import type { BareShaftComparison } from '../../models/simulation.ts'
import { pinPosition, type SightGeometry } from '../ballistics/sightClearance.ts'
import { HEURISTIC_V0, type Coefficients } from '../coefficients/coefficients.ts'
import { relativeBowInertia } from '../simulation/bowModel.ts'
import { FOC_RANGE, MIN_GRAINS_PER_POUND } from '../simulation/derivedMetrics.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'

// What a setup is like, as a short list of numbers that can each be drawn as a
// bar: the sheet of attributes of a setup. Nothing here is new physics. Each
// number is read off the model, or worked out from a few runs of it.

/** How a number is to be read: in order, worth a look, not in order, or neither. */
export type Tone = 'good' | 'fair' | 'poor' | 'plain'

export type AttributeId =
  | 'lateral'
  | 'vertical'
  | 'stiffness'
  | 'speed'
  | 'settling'
  | 'clearance'
  | 'frontOfCenter'
  | 'efficiency'
  | 'arrowMass'
  | 'forgiveness'
  | 'steadiness'
  | 'sightReach'

export type Attribute = {
  id: AttributeId
  /**
   * `offset` is a lean to one side of a middle that is the aim; `level` is an
   * amount between nothing and full.
   */
  kind: 'offset' | 'level'
  /** How much of the bar is filled: -1..+1 from the middle for an offset, 0..1 for a level. */
  share: number
  tone: Tone
  /** The number itself, in the unit the id implies, for writing next to the bar. */
  value: number
  /** True when the number is a rough estimate from too few values to be more. */
  estimate: boolean
}

export type AttributeGroup = {
  id: 'bareShaft' | 'flight' | 'performance'
  attributes: Attribute[]
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
/** Where a value sits between `low` and `high`, as 0..1. */
const between = (value: number, low: number, high: number) =>
  clamp((value - low) / (high - low), 0, 1)

/** An offset on a -1..+1 scale: in order inside `neutral`, worth a look up to three times that. */
function offset(id: AttributeId, value: number, neutral: number, full: number): Attribute {
  const size = Math.abs(value)
  return {
    id,
    kind: 'offset',
    share: clamp(value / full, -1, 1),
    tone: size <= neutral ? 'good' : size <= 3 * neutral ? 'fair' : 'poor',
    value,
    estimate: false,
  }
}

// What an archer does differently from one shot to the next, as far as the
// model has a value for it: the draw ends a little short or a little long, and
// with it the weight on the fingers. HEURISTIC.
/** mm, how far the draw length is moved either way */
const DRAW_ERROR = 5
/** Share of the draw weight that comes and goes with that much draw length. */
const WEIGHT_ERROR = 0.015
/** The arrow moving this far on the -1..+1 scales between the two draws is no forgiveness at all. HEURISTIC. */
const UNFORGIVING = 0.25
/** How much a change of speed counts next to a change of launch. HEURISTIC. */
const SPEED_WEIGHT = 4

/**
 * 0..1, how little the arrow minds a draw that ends short or long. The setup
 * is run with the draw 5 mm short and 5 mm long. What counts against it is the
 * worst of three things: how far the arrow moves between the two draws
 * (sideways and in height by its launch, and in height by its speed), how much
 * the shaft is still bending at the worse of them, and how near it comes to
 * the bow there. A setup at the edge of clearing the bow lands its arrows
 * close together only for as long as every shot is the same.
 */
export function forgiveness(model: SimulationModel, setup: SetupInput): number {
  const drawn = (sign: 1 | -1) =>
    model.analyze({
      ...setup,
      bow: {
        ...setup.bow,
        drawLength: setup.bow.drawLength + sign * DRAW_ERROR,
        drawWeight: setup.bow.drawWeight * (1 + sign * WEIGHT_ERROR),
      },
    }).metrics
  const short = drawn(-1)
  const long = drawn(1)
  const moved = Math.hypot(
    long.lateralDeviation - short.lateralDeviation,
    long.verticalTendency - short.verticalTendency,
    // A slower arrow lands lower: a quarter less speed counts as the full scale.
    (SPEED_WEIGHT * (long.launchSpeed - short.launchSpeed)) /
      (long.launchSpeed + short.launchSpeed),
  )
  const against = Math.max(
    moved / UNFORGIVING,
    short.oscillation,
    long.oscillation,
    short.clearanceRisk,
    long.clearanceRisk,
  )
  return 1 - clamp(against, 0, 1)
}

/** m, the longest distance looked for; a recurve is not shot further. */
export const FARTHEST_DISTANCE = 90

/** m, the shortest distance looked for. Nearer than this the pin is low for another reason: the arrow starts under the eye. */
const NEAREST_DISTANCE = 10

/**
 * m, the longest distance at which the pin still clears the arrow, to the
 * meter. Zero when it does not clear at any.
 */
export function sightReach(geometry: SightGeometry): number {
  const clears = (meters: number) => {
    const { status } = pinPosition(geometry, meters * 1000)
    return status === 'clear' || status === 'close'
  }
  // Every fifth meter from the far end, then the meters past the first that clears.
  for (let meters = FARTHEST_DISTANCE; meters >= NEAREST_DISTANCE; meters -= 5) {
    if (!clears(meters)) continue
    let reach = meters
    while (reach < FARTHEST_DISTANCE && clears(reach + 1)) reach += 1
    return reach
  }
  return 0
}

export type AttributeInput = {
  model: SimulationModel
  setup: SetupInput
  /** The bare shaft test of that setup. */
  comparison: BareShaftComparison
  /** The sight, when there is one to place. Without it the reach of the sight is left out. */
  sight?: Omit<SightGeometry, 'speed' | 'drag' | 'drawLength' | 'shaftDiameter' | 'vaneHeight'> & {
    speed: number
    drag: number
  }
  coefficients?: Coefficients
}

/** The attributes of a setup, in their groups. */
export function attributes({
  model,
  setup,
  comparison,
  sight,
  coefficients = HEURISTIC_V0,
}: AttributeInput): AttributeGroup[] {
  const { metrics } = comparison.fletched
  const limits = coefficients.thresholds
  const level = (
    id: AttributeId,
    value: number,
    share: number,
    tone: Tone = 'plain',
    estimate = false,
  ): Attribute => ({ id, kind: 'level', share: clamp(share, 0, 1), tone, value, estimate })
  /** Less is better, and the model names two steps of too much. */
  const risk = (value: number, medium: number, high: number): Tone =>
    value < medium ? 'good' : value < high ? 'fair' : 'poor'

  const efficiency = metrics.storedEnergy > 0 ? metrics.kineticEnergy / metrics.storedEnergy : 0
  const forgiving = forgiveness(model, setup)
  const inertia = relativeBowInertia(setup.bow, coefficients)
  const foc = metrics.frontOfCenter

  const performance: Attribute[] = [
    level('efficiency', efficiency * 100, between(efficiency, 0.5, 0.9)),
    level(
      'arrowMass',
      metrics.grainsPerPound,
      between(metrics.grainsPerPound, 3, 12),
      // Too light an arrow is hard on the bow: that one is a matter of safety.
      metrics.grainsPerPound < MIN_GRAINS_PER_POUND ? 'poor' : 'plain',
    ),
    level(
      'forgiveness',
      forgiving * 10,
      forgiving,
      forgiving >= 0.65 ? 'good' : forgiving >= 0.4 ? 'fair' : 'poor',
    ),
    // From the mass in the hand and the one weight on the long rod: the model
    // knows of no side rods and of no balance point. The reference bow reads 6.
    level('steadiness', clamp(inertia * 6, 0, 10), (inertia * 6) / 10, 'plain', true),
  ]
  if (sight) {
    const reach = sightReach({
      ...sight,
      drawLength: setup.bow.drawLength,
      shaftDiameter: setup.arrow.shaftDiameter,
      vaneHeight: setup.arrow.fletchingHeight,
    })
    performance.push(level('sightReach', reach, reach / FARTHEST_DISTANCE))
  }

  return [
    {
      id: 'bareShaft',
      attributes: [
        offset('lateral', comparison.offset.lateral, limits.bareShaftTogether, 0.5),
        offset('vertical', comparison.offset.vertical, limits.bareShaftTogether, 0.5),
        // Negative is weak, positive is stiff.
        {
          ...offset('stiffness', metrics.dynamicBehavior, limits.stiffnessNeutral, 1),
          tone:
            Math.abs(metrics.dynamicBehavior) <= limits.stiffnessNeutral
              ? 'good'
              : Math.abs(metrics.dynamicBehavior) <= 0.5
                ? 'fair'
                : 'poor',
        },
      ],
    },
    {
      id: 'flight',
      attributes: [
        level('speed', metrics.launchSpeed / 1000, between(metrics.launchSpeed / 1000, 35, 75)),
        level(
          'settling',
          metrics.stabilityTime,
          1 - metrics.oscillation,
          risk(metrics.oscillation, limits.oscillationMedium, limits.oscillationHigh),
        ),
        level(
          'clearance',
          (1 - metrics.clearanceRisk) * 10,
          1 - metrics.clearanceRisk,
          risk(metrics.clearanceRisk, limits.clearanceMedium, limits.clearanceHigh),
        ),
        level(
          'frontOfCenter',
          foc,
          between(foc, 0, 25),
          foc >= FOC_RANGE.low && foc <= FOC_RANGE.high ? 'good' : 'fair',
        ),
      ],
    },
    { id: 'performance', attributes: performance },
  ]
}
