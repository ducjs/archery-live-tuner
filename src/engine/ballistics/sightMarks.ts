import type { KnownMark } from '../../models/observation.ts'
import { launchAngleFor } from './flight.ts'

// Sight marks (spec §38). A mark is a measurement of the launch angle: the pin
// sits on the line from the eye to the target, and the further the target, the
// more the arrow has to point above that line. So
//
//   mark(D) = offset + scale · tan(angle the arrow needs at distance D)
//
// `offset` and `scale` belong to the sight and to how the archer anchors, and
// are found from the marks the archer already has. The angle comes from the
// flight path. Everything here is a model result to confirm by shooting.

export type SightInputs = {
  /** mm/s, the model's estimate of the arrow speed */
  speed: number
  /** 1/m, see `dragPerMeter` */
  drag: number
  /** mm, how far the eye is above the arrow at anchor */
  eyeHeight: number
}

export type SightPrediction = {
  /** mm */
  distance: number
  /** In the units of the archer's own scale. NaN when the arrow cannot reach. */
  mark: number
  /** The marks between which it is expected to fall. */
  low: number
  high: number
  /** The mark the archer entered for this distance, if any. */
  known?: number
}

export type SightFit = {
  offset: number
  scale: number
  /** mm/s, the speed the predictions were made with */
  speed: number
  /** `marks` when three or more marks were enough to find the speed from them. */
  speedFrom: 'model' | 'marks'
  /** mm/s, the range of that speed when the eye height is 20 mm off either way. Only with `marks`. */
  speedRange?: { low: number; high: number }
  /** Largest gap between an entered mark and the fitted curve, in scale units. */
  worstMiss: number
  predictions: SightPrediction[]
}

/** The fewest marks that say anything: two fix the offset and the scale. */
export const MIN_MARKS = 2
/** From this many marks on, the speed is found from the marks too. */
const MARKS_FOR_SPEED = 3
/** mm/s, the speeds a recurve arrow can have; a fit that lands on either end found nothing. */
const SLOWEST = 35_000
const FASTEST = 95_000
/** mm, how far the eye height is taken to be off, for the ranges. HEURISTIC. */
const EYE_DOUBT = 20
/** Share of the model's speed it is taken to be off by, for the ranges. HEURISTIC. */
const SPEED_DOUBT = 0.05
/** Share of the drag it is taken to be off by, for the ranges. HEURISTIC. */
const DRAG_DOUBT = 0.5
/**
 * How well a mark is taken to be read, as a share of the scale: half a
 * millimeter on a sight whose pin is 900 mm from the eye. HEURISTIC. It is
 * what widens a far prediction the most, as an error in two close marks is
 * carried out along the line through them.
 */
const READING_DOUBT = 0.5 / 900

type Line = { offset: number; scale: number; error: number; worstMiss: number }

/** tan of the angle between the line of sight and the arrow, for a level shot. */
function tangent(inputs: SightInputs, distance: number): number {
  // The arrow starts below the eye and has to climb to the line of sight.
  return Math.tan(launchAngleFor(inputs.speed, inputs.drag, distance, inputs.eyeHeight))
}

/** The straight line through the marks, by least squares, against tan of the angle. */
function fitLine(known: KnownMark[], inputs: SightInputs): Line | null {
  const points = known.map(({ distance, mark }) => ({ t: tangent(inputs, distance), mark }))
  if (points.some((point) => !Number.isFinite(point.t))) return null
  const n = points.length
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / n
  const meanMark = points.reduce((sum, point) => sum + point.mark, 0) / n
  const spreadT = points.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0)
  if (spreadT === 0) return null
  const scale =
    points.reduce((sum, point) => sum + (point.t - meanT) * (point.mark - meanMark), 0) / spreadT
  const offset = meanMark - scale * meanT
  const misses = points.map((point) => point.mark - (offset + scale * point.t))
  return {
    offset,
    scale,
    error: misses.reduce((sum, miss) => sum + miss ** 2, 0),
    worstMiss: Math.max(...misses.map(Math.abs)),
  }
}

/**
 * The speed at which the marks lie best on one line. With the eye height
 * known, short and long distances pull on the speed differently, which is
 * what makes it findable. Returns null when the best speed is at either end
 * of what a recurve can do: then the marks do not agree with each other.
 */
function fitSpeed(known: KnownMark[], inputs: SightInputs): number | null {
  const error = (speed: number) => fitLine(known, { ...inputs, speed })?.error ?? Infinity
  // Golden-section search; the error has one minimum over this span.
  const ratio = (Math.sqrt(5) - 1) / 2
  let low = SLOWEST
  let high = FASTEST
  let a = high - ratio * (high - low)
  let b = low + ratio * (high - low)
  let errorA = error(a)
  let errorB = error(b)
  for (let i = 0; i < 32; i++) {
    if (errorA < errorB) {
      high = b
      b = a
      errorB = errorA
      a = high - ratio * (high - low)
      errorA = error(a)
    } else {
      low = a
      a = b
      errorA = errorB
      b = low + ratio * (high - low)
      errorB = error(b)
    }
  }
  const best = (low + high) / 2
  const margin = (FASTEST - SLOWEST) * 0.01
  return best < SLOWEST + margin || best > FASTEST - margin ? null : best
}

type Solved = { line: Line; inputs: SightInputs; speedFrom: SightFit['speedFrom'] }

function solve(known: KnownMark[], inputs: SightInputs): Solved | null {
  if (known.length >= MARKS_FOR_SPEED) {
    const speed = fitSpeed(known, inputs)
    if (speed !== null) {
      const fitted = { ...inputs, speed }
      const line = fitLine(known, fitted)
      if (line) return { line, inputs: fitted, speedFrom: 'marks' }
    }
  }
  const line = fitLine(known, inputs)
  return line && { line, inputs, speedFrom: 'model' }
}

const markAt = ({ line, inputs }: Solved, distance: number) =>
  line.offset + line.scale * tangent(inputs, distance)

/** Leaves out marks that say nothing, and keeps the last one entered for a distance. */
export function usableMarks(known: KnownMark[]): KnownMark[] {
  const byDistance = new Map<number, KnownMark>()
  for (const entry of known) {
    if (Number.isFinite(entry.mark) && entry.distance > 0) byDistance.set(entry.distance, entry)
  }
  return [...byDistance.values()].sort((a, b) => a.distance - b.distance)
}

/**
 * Fits the sight to the marks the archer has and predicts the mark for each of
 * `distances`. Null with fewer than two marks at different distances, or when
 * a marked distance is out of reach of the arrow.
 *
 * The range of a prediction is what it moves by when each thing that is only
 * estimated is off by a plausible amount, refitting to the known marks every
 * time, and when the nearest and furthest marks were read half a millimeter
 * off. It is therefore narrow between the known marks and widens away from
 * them.
 */
export function fitSightMarks(
  marks: KnownMark[],
  inputs: SightInputs,
  distances: number[],
): SightFit | null {
  const known = usableMarks(marks)
  if (known.length < MIN_MARKS) return null
  const best = solve(known, inputs)
  if (!best) return null

  const doubts: SightInputs[] = [
    { ...inputs, eyeHeight: inputs.eyeHeight - EYE_DOUBT },
    { ...inputs, eyeHeight: inputs.eyeHeight + EYE_DOUBT },
    { ...inputs, drag: inputs.drag * (1 - DRAG_DOUBT) },
    { ...inputs, drag: inputs.drag * (1 + DRAG_DOUBT) },
  ]
  // The speed is only in doubt while it is the model's.
  if (best.speedFrom === 'model') {
    doubts.push(
      { ...inputs, speed: inputs.speed * (1 - SPEED_DOUBT) },
      { ...inputs, speed: inputs.speed * (1 + SPEED_DOUBT) },
    )
  }
  const others = doubts.flatMap((doubt) => solve(known, doubt) ?? [])

  // The nearest and the furthest mark read a little off, in opposite directions.
  const reading = Math.abs(best.line.scale) * READING_DOUBT
  for (const tilt of [reading, -reading]) {
    const tilted = known.map((entry, index) =>
      index === 0
        ? { ...entry, mark: entry.mark + tilt }
        : index === known.length - 1
          ? { ...entry, mark: entry.mark - tilt }
          : entry,
    )
    // The speed stays as found: this is about the reading, not about the arrow.
    const line = fitLine(tilted, best.inputs)
    if (line) others.push({ line, inputs: best.inputs, speedFrom: best.speedFrom })
  }

  const predictions = distances.map((distance): SightPrediction => {
    const mark = markAt(best, distance)
    const all = [mark, ...others.map((other) => markAt(other, distance))].filter(Number.isFinite)
    const entered = known.find((entry) => entry.distance === distance)
    return {
      distance,
      mark,
      low: all.length > 0 ? Math.min(...all) : Number.NaN,
      high: all.length > 0 ? Math.max(...all) : Number.NaN,
      ...(entered && { known: entered.mark }),
    }
  })

  const fit: SightFit = {
    offset: best.line.offset,
    scale: best.line.scale,
    speed: best.inputs.speed,
    speedFrom: best.speedFrom,
    worstMiss: best.line.worstMiss,
    predictions,
  }
  if (best.speedFrom === 'marks') {
    // The speed read from the marks rests on the eye height: say how much.
    const speeds = others
      .slice(0, 2)
      .filter((other) => other.speedFrom === 'marks')
      .map((other) => other.inputs.speed)
    if (speeds.length === 2) {
      fit.speedRange = { low: Math.min(...speeds), high: Math.max(...speeds) }
    }
  }
  return fit
}
