import type { SimulationMetrics, TuningClassification } from '../../models/simulation.ts'
import type { Coefficients } from '../coefficients/heuristicV0.ts'

export function classify(
  metrics: SimulationMetrics,
  coefficients: Coefficients,
): TuningClassification {
  const t = coefficients.thresholds
  const { dynamicBehavior, oscillation, lateralDeviation, clearanceRisk } = metrics

  return {
    stiffness:
      dynamicBehavior < -t.stiffnessNeutral
        ? 'WEAK'
        : dynamicBehavior > t.stiffnessNeutral
          ? 'STIFF'
          : 'NEUTRAL',
    oscillation:
      oscillation >= t.oscillationHigh
        ? 'HIGH'
        : oscillation >= t.oscillationMedium
          ? 'MEDIUM'
          : 'LOW',
    lateral:
      lateralDeviation < -t.lateralNeutral
        ? 'LEFT'
        : lateralDeviation > t.lateralNeutral
          ? 'RIGHT'
          : 'NEUTRAL',
    clearance:
      clearanceRisk >= t.clearanceHigh
        ? 'HIGH'
        : clearanceRisk >= t.clearanceMedium
          ? 'MEDIUM'
          : 'LOW',
  }
}
