import type {
  BareShaftComparison,
  SimulationMetrics,
  SimulationResult,
  TuningClassification,
} from '../../models/simulation.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { HEURISTIC_V0, type Coefficients } from '../coefficients/heuristicV0.ts'
import { clamp01 } from '../math/scalar.ts'
import { bendingFrequency } from './arrowModel.ts'
import { launchSpeed, powerStroke, relativeBowInertia, timeOnString } from './bowModel.ts'
import { classify } from './classification.ts'
import { stiffnessMismatch } from './dynamicSpine.ts'
import { plungerBehaviorShift, plungerLateralPush } from './plungerModel.ts'
import {
  DEFAULT_TRAJECTORY_OPTIONS,
  buildTrajectory,
  type TrajectoryOptions,
} from './trajectory.ts'

export type SetupInput = Pick<TuningSetup, 'id' | 'bow' | 'arrow'>

export type Analysis = {
  metrics: SimulationMetrics
  classification: TuningClassification
}

/** The contract the UI depends on. A better model replaces the engine by implementing this. */
export type SimulationModel = {
  readonly version: string
  /** Metrics and classification only. Cheap enough to run over a grid of setups. */
  analyze(setup: SetupInput, options?: SimulateOptions): Analysis
  simulate(setup: SetupInput, options?: SimulateOptions): SimulationResult
  /** Flies a bare shaft next to the fletched arrow and reports where it lands. */
  compareBareShaft(setup: SetupInput, options?: SimulateOptions): BareShaftComparison
}

export type SimulateOptions = {
  /**
   * Fly the arrow as a bare shaft: no steering or damping from fletching. The
   * mass is kept, as with a bare shaft taped to match the fletched arrows.
   */
  bareShaft?: boolean
  trajectory?: TrajectoryOptions
}

type Internals = Analysis & {
  verticalTendency: number
  driftFactor: number
  flexDirection: 1 | -1
}

const GRAMS_PER_GRAIN = 0.06479891

function evaluate(setup: SetupInput, c: Coefficients, bareShaft = false): Internals {
  const { bow, arrow } = setup
  const { reference } = c

  // The model works in the right-handed frame and mirrors left-handed setups:
  // for a right-handed archer the riser is to the right of the arrow.
  const side = bow.handedness === 'RH' ? 1 : -1
  const centerShot = bow.centerShot * side

  const mismatch = stiffnessMismatch(bow, arrow, c) + plungerBehaviorShift(bow, c)
  const dynamicBehavior = Math.tanh(c.behavior.gain * mismatch)

  const flexAmplitude = clamp01(c.flex.neutralAmplitude * Math.exp(-c.flex.mismatchGain * mismatch))

  const preloadOffset = bow.plungerPreload - reference.plungerPreload
  const oscillation = clamp01(
    c.oscillation.base +
      c.oscillation.mismatch * Math.abs(dynamicBehavior) +
      c.oscillation.weakExtra * Math.max(0, -dynamicBehavior) +
      c.oscillation.perMmCenterShot * Math.abs(centerShot) +
      c.oscillation.perMmPreloadOffset * Math.abs(preloadOffset) -
      c.oscillation.bowInertia * Math.log(relativeBowInertia(bow, c)),
  )

  // Fletching steers the arrow back toward the line and damps its wobble.
  const fletchingGrains = bareShaft ? 0 : arrow.fletchingWeight / GRAMS_PER_GRAIN
  const driftFactor =
    1 - c.fletching.maxCorrection * (1 - Math.exp(-fletchingGrains / c.fletching.correctionScale))

  // Right-handed: a weak arrow goes right, a stiff arrow goes left.
  const lateralDeviation =
    side *
    driftFactor *
    Math.tanh(
      -c.lateral.behavior * dynamicBehavior +
        c.lateral.perMmCenterShot * centerShot +
        plungerLateralPush(bow, c),
    )

  const verticalTendency = Math.tanh(
    c.vertical.perMmNockingPoint * (bow.nockingPointHeight - reference.nockingPointHeight) -
      c.vertical.perMmTiller * (bow.tiller - reference.tiller),
  )

  const nockFit =
    bow.string.nockFit === 'TIGHT'
      ? c.clearance.tightNock
      : bow.string.nockFit === 'LOOSE'
        ? c.clearance.looseNock
        : 0
  const clearanceRisk = clamp01(
    c.clearance.base +
      c.clearance.mismatch * Math.abs(dynamicBehavior) +
      c.clearance.perMmTowardRiser * Math.max(0, centerShot) +
      nockFit +
      c.clearance.lowBrace * Math.max(0, Math.log(reference.braceHeight / bow.braceHeight)) +
      c.clearance.vertical * Math.abs(verticalTendency) +
      c.clearance.perMmDiameter * (arrow.shaftDiameter - reference.shaftDiameter),
  )

  const oscillationDecay =
    c.oscillation.baseDecay + c.oscillation.decayPerGrainFletching * fletchingGrains
  const stabilityTime =
    Math.log(Math.max(oscillation, c.oscillation.settledLevel) / c.oscillation.settledLevel) /
    oscillationDecay

  const metrics: SimulationMetrics = {
    dynamicBehavior,
    flexAmplitude,
    oscillation,
    oscillationFrequency: bendingFrequency(arrow, c),
    oscillationDecay,
    lateralDeviation,
    verticalTendency,
    yaw: c.lateral.maxYaw * lateralDeviation,
    // Nock high leaves the bow tail-up, which is nose-down.
    pitch: -c.vertical.maxPitch * verticalTendency,
    stabilityTime,
    clearanceRisk,
    launchSpeed: launchSpeed(bow, arrow, c),
  }

  return {
    metrics,
    classification: classify(metrics, c),
    verticalTendency,
    driftFactor,
    // The first bend is toward the riser.
    flexDirection: side,
  }
}

export function createHeuristicModel(coefficients: Coefficients = HEURISTIC_V0): SimulationModel {
  return {
    version: coefficients.version,

    analyze(setup, options) {
      const { metrics, classification } = evaluate(setup, coefficients, options?.bareShaft)
      return { metrics, classification }
    },

    simulate,

    compareBareShaft(setup, options) {
      const fletched = simulate(setup, { ...options, bareShaft: false })
      const bare = simulate(setup, { ...options, bareShaft: true })
      const fletchedEnd = fletched.trajectory.at(-1)!
      const bareEnd = bare.trajectory.at(-1)!

      const offset = {
        lateral:
          ((bareEnd.z ?? 0) - (fletchedEnd.z ?? 0)) / (bareEnd.x * coefficients.lateral.driftSlope),
        vertical: (bareEnd.y - fletchedEnd.y) / (bareEnd.x * coefficients.vertical.driftSlope),
      }
      const together = coefficients.thresholds.bareShaftTogether
      return {
        fletched,
        bare,
        offset,
        horizontal:
          offset.lateral < -together ? 'LEFT' : offset.lateral > together ? 'RIGHT' : 'TOGETHER',
        vertical:
          offset.vertical < -together ? 'LOW' : offset.vertical > together ? 'HIGH' : 'TOGETHER',
      }
    },
  }

  function simulate(setup: SetupInput, options?: SimulateOptions): SimulationResult {
    const { metrics, classification, verticalTendency, driftFactor, flexDirection } = evaluate(
      setup,
      coefficients,
      options?.bareShaft,
    )
    const { bow, arrow } = setup
    const distance = (options?.trajectory ?? DEFAULT_TRAJECTORY_OPTIONS).distance
    return {
      setupId: setup.id,
      modelVersion: coefficients.version,
      launch: {
        powerStroke: powerStroke(bow),
        timeOnString: timeOnString(bow, arrow, coefficients),
        nockAngle: Math.atan2(bow.nockingPointHeight, bow.braceHeight),
      },
      fullDrift: {
        lateral: coefficients.lateral.driftSlope * distance,
        vertical: coefficients.vertical.driftSlope * distance,
      },
      classification,
      metrics,
      trajectory: buildTrajectory(
        { metrics, verticalTendency, driftFactor, flexDirection },
        coefficients,
        options?.trajectory,
      ),
    }
  }
}

export const heuristicModel = createHeuristicModel()
