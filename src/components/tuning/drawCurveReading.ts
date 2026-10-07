import { HEURISTIC_V0 } from '../../engine/index.ts'
import { displayOf, getParameter } from '../../models/parameters.ts'
import type { NumberParameter, UnitSystem } from '../../models/parameters.ts'
import type { SimulationMetrics } from '../../models/simulation.ts'
import type { Unit } from '../../utils/units.ts'

function unitOf(key: string, units: UnitSystem): Unit {
  const unit = displayOf(getParameter(key) as NumberParameter, units).unit
  if (!unit) throw new Error(`${key} is shown without a unit`)
  return unit
}

/** Units the chart is read in: those the draw weight and draw length are shown in. */
export function curveUnits(units: UnitSystem): { length: Unit; force: Unit } {
  return { length: unitOf('bow.drawLength', units), force: unitOf('bow.drawWeight', units) }
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
