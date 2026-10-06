import type { Messages } from '../../i18n/index.ts'
import type { SimulationResult } from '../../models/simulation.ts'

/** Dynamic behavior, on the -1..+1 scale, from which weak or stiff is called clear. */
const CLEAR = 0.5

/**
 * The model result as a few short sentences, the most telling first: how the
 * arrow matches the bow, then only what stands out.
 */
export function resultReading(
  result: Pick<SimulationResult, 'classification' | 'metrics'>,
  m: Messages,
): string[] {
  const { classification, metrics } = result
  const text = m.result.reading
  const sentences: string[] = []

  if (classification.stiffness === 'NEUTRAL') {
    sentences.push(text.matched)
  } else {
    const degree = Math.abs(metrics.dynamicBehavior) < CLEAR ? text.little : text.clearly
    sentences.push(degree[classification.stiffness])
  }
  if (classification.vertical !== 'NEUTRAL') sentences.push(text.nock[classification.vertical])
  if (classification.clearance === 'HIGH') sentences.push(text.clearance)
  if (classification.oscillation === 'HIGH') sentences.push(text.oscillation)
  return sentences
}
