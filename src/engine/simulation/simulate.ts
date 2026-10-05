import type {
  SimulationMetrics,
  SimulationResult,
  TuningClassification,
} from '../../models/simulation.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { HEURISTIC_V0, type Coefficients } from '../coefficients/heuristicV0.ts'
import { clamp01 } from '../math/scalar.ts'
import { bendingFrequency } from './arrowModel.ts'
import { launchSpeed, relativeBowInertia } from './bowModel.ts'
import { classify } from './classification.ts'
import { stiffnessMismatch } from './dynamicSpine.ts'
import { plungerBehaviorShift, plungerLateralPush } from './plungerModel.ts'
import { buildTrajectory, type TrajectoryOptions } from './trajectory.ts'

export type SetupInput = Pick<TuningSetup, 'id' | 'bow' | 'arrow'>

export type Analysis = {
  metrics: SimulationMetrics
  classification: TuningClassification
}

/** The contract the UI depends on. A better model replaces the engine by implementing this. */
export type SimulationModel = {
  readonly version: string
  /** Metrics and classification only. Cheap enough to run over a grid of setups. */
  analyze(setup: SetupInput): Analysis
  simulate(setup: SetupInput, options?: TrajectoryOptions): SimulationResult
}

type Internals = Analysis & {
  verticalTendency: number
  flexDirection: 1 | -1
}

function evaluate(setup: SetupInput, c: Coefficients): Internals {
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

  // Right-handed: a weak arrow goes right, a stiff arrow goes left.
  const lateralDeviation =
    side *
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
    c.oscillation.baseDecay +
    c.oscillation.decayPerGrainFletching * (arrow.fletchingWeight / 0.06479891)
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
    // The first bend is toward the riser.
    flexDirection: side,
  }
}

export function createHeuristicModel(coefficients: Coefficients = HEURISTIC_V0): SimulationModel {
  return {
    version: coefficients.version,

    analyze(setup) {
      const { metrics, classification } = evaluate(setup, coefficients)
      return { metrics, classification }
    },

    simulate(setup, options) {
      const { metrics, classification, verticalTendency, flexDirection } = evaluate(
        setup,
        coefficients,
      )
      return {
        setupId: setup.id,
        modelVersion: coefficients.version,
        classification,
        metrics,
        trajectory: buildTrajectory(
          { metrics, verticalTendency, flexDirection },
          coefficients,
          options,
        ),
      }
    },
  }
}

export const heuristicModel = createHeuristicModel()
