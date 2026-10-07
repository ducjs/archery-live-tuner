import type { Messages } from '../../i18n/index.ts'
import type { Personal } from '../../models/calibration.ts'

/** One 50-point step of spine at 700, on the scale of the behavior shift. */
const SPINE_STEP = 0.07

/** The shifts of a fit, each as one sentence. Empty when nothing moved. */
export function describeShifts(personal: Personal, m: Messages): string[] {
  const text = m.calibration
  const sentences: string[] = []
  if (personal.behaviorShift !== 0) {
    const steps = (Math.abs(personal.behaviorShift) / SPINE_STEP).toFixed(1)
    sentences.push(personal.behaviorShift < 0 ? text.weaker(steps) : text.stiffer(steps))
  }
  if (personal.nockingPointNeutral !== 0) {
    const mm = Math.abs(personal.nockingPointNeutral).toFixed(1)
    sentences.push(personal.nockingPointNeutral > 0 ? text.nockHigher(mm) : text.nockLower(mm))
  }
  if (personal.centerShotNeutral !== 0) {
    const mm = Math.abs(personal.centerShotNeutral).toFixed(1)
    sentences.push(personal.centerShotNeutral > 0 ? text.centerRight(mm) : text.centerLeft(mm))
  }
  return sentences
}
