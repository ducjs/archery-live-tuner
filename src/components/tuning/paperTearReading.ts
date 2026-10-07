import type { Messages } from '../../i18n/index.ts'
import type { Handedness } from '../../models/bow.ts'
import type { PaperTear } from '../../models/simulation.ts'

export type PaperTearReading = {
  /** Where the fletching tears. */
  tearing: string
  /** What an archer would conclude from that. */
  meaning: string
  /** Set when poor clearance makes the same tear and the model rates it a risk. */
  clearance?: string
}

/** Puts the paper tear test into the words archers use for it. */
export function paperTearReading(
  tear: Pick<PaperTear, 'horizontal' | 'vertical' | 'clearanceSuspect'>,
  handedness: Handedness,
  m: Messages,
): PaperTearReading {
  const { horizontal, vertical } = tear
  const text = m.paperTear

  if (horizontal === 'CLEAN' && vertical === 'CLEAN') {
    return { tearing: text.clean, meaning: m.bareShaft.matched }
  }

  const where: string[] = []
  if (vertical !== 'CLEAN') where.push(vertical === 'HIGH' ? text.above : text.below)
  if (horizontal !== 'CLEAN') where.push(horizontal === 'LEFT' ? text.left : text.right)

  const conclusions: string[] = []
  if (horizontal !== 'CLEAN') {
    // A weak arrow leaves with its tail on the side away from the riser.
    const weakSide = handedness === 'RH' ? 'LEFT' : 'RIGHT'
    conclusions.push(horizontal === weakSide ? m.bareShaft.weak : m.bareShaft.stiff)
  }
  if (vertical !== 'CLEAN') {
    conclusions.push(vertical === 'HIGH' ? m.bareShaft.nockHigh : m.bareShaft.nockLow)
  }

  return {
    tearing: text.tearing(where),
    meaning: m.bareShaft.meaning(conclusions),
    ...(tear.clearanceSuspect && { clearance: text.clearance }),
  }
}
