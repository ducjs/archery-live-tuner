import {
  plungerReach,
  shaftLimit,
  type DiagnosisStep,
  type PlotReading,
} from '../../engine/index.ts'
import type { Messages } from '../../i18n/index.ts'

const cm = (mm: number) => (mm / 10).toFixed(mm < 95 ? 1 : 0)

/** What the target shows, in the words of the bare shaft test. Empty when it shows nothing. */
export function plotConclusions(reading: PlotReading, m: Messages): string[] {
  const conclusions: string[] = []
  if (reading.horizontal !== 'OK') {
    conclusions.push(reading.horizontal === 'WEAK' ? m.bareShaft.weak : m.bareShaft.stiff)
  }
  if (reading.vertical !== 'OK') {
    conclusions.push(reading.vertical === 'NOCK_HIGH' ? m.bareShaft.nockHigh : m.bareShaft.nockLow)
  }
  return conclusions
}

/** One step of the diagnosis: what to do, and why it comes where it does. */
export function describeStep(
  step: DiagnosisStep,
  reading: PlotReading,
  m: Messages,
): { action: string; why: string } {
  const meters = (reading.distance / 1000).toFixed(0)
  const why = m.target.why
  return {
    action: m.suggestions.actions[step.parameterKey]?.[step.direction] ?? step.parameterKey,
    why:
      step.cause === 'point'
        ? why.point(cm(plungerReach(reading.distance)), meters)
        : step.cause === 'shaft'
          ? why.shaft(cm(shaftLimit(reading.distance)), meters)
          : why[step.cause],
  }
}

export { cm as centimeters }
