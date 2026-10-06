import { HEURISTIC_V0 } from '../../engine/index.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { SimulationMetrics } from '../../models/simulation.ts'
import type { Unit } from '../../utils/units.ts'

/** Units the chart is read in. */
export function curveUnits(units: UnitSystem): { length: Unit; force: Unit } {
  return units === 'metric' ? { length: 'cm', force: 'N' } : { length: 'in', force: 'lbf' }
}

/** The gain at the clicker against what a common recurve gains. A comparison, not a verdict. */
export function gainReading(
  metrics: Pick<SimulationMetrics, 'clickerGain'>,
  drawWeight: number,
): 'USUAL' | 'GENTLER' | 'STEEPER' {
  const { usualGainPerInch, usualGainBand } = HEURISTIC_V0.drawCurve
  const sharePerInch = (metrics.clickerGain * 25.4) / drawWeight
  if (sharePerInch < usualGainPerInch - usualGainBand) return 'GENTLER'
  if (sharePerInch > usualGainPerInch + usualGainBand) return 'STEEPER'
  return 'USUAL'
}
