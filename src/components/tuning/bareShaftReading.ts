import type { Messages } from '../../i18n/index.ts'
import type { Handedness } from '../../models/bow.ts'
import type { BareShaftComparison } from '../../models/simulation.ts'

export type BareShaftReading = {
  /** Where the bare shaft lands. */
  landing: string
  /** What an archer would conclude from that. */
  meaning: string
}

/** Puts the bare shaft test into the words archers use for it. */
export function bareShaftReading(
  comparison: Pick<BareShaftComparison, 'horizontal' | 'vertical'>,
  handedness: Handedness,
  m: Messages,
): BareShaftReading {
  const { horizontal, vertical } = comparison
  const text = m.bareShaft

  if (horizontal === 'TOGETHER' && vertical === 'TOGETHER') {
    return { landing: text.together, meaning: text.matched }
  }

  const where: string[] = []
  if (vertical !== 'TOGETHER') where.push(vertical === 'HIGH' ? text.above : text.below)
  if (horizontal !== 'TOGETHER') {
    where.push(horizontal === 'LEFT' ? text.left : text.right)
  }

  const conclusions: string[] = []
  if (horizontal !== 'TOGETHER') {
    // A weak arrow sends the bare shaft away from the riser side of the archer.
    const weakSide = handedness === 'RH' ? 'RIGHT' : 'LEFT'
    conclusions.push(horizontal === weakSide ? text.weak : text.stiff)
  }
  if (vertical !== 'TOGETHER') {
    conclusions.push(vertical === 'LOW' ? text.nockHigh : text.nockLow)
  }

  return { landing: text.landing(where), meaning: text.meaning(conclusions) }
}
