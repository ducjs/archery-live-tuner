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
): BareShaftReading {
  const { horizontal, vertical } = comparison

  if (horizontal === 'TOGETHER' && vertical === 'TOGETHER') {
    return {
      landing: 'The bare shaft lands with the fletched arrows.',
      meaning: 'That reads as a matched setup.',
    }
  }

  const where: string[] = []
  if (vertical !== 'TOGETHER') where.push(vertical === 'HIGH' ? 'above' : 'below')
  if (horizontal !== 'TOGETHER') {
    where.push(horizontal === 'LEFT' ? 'to the left of' : 'to the right of')
  }

  const conclusions: string[] = []
  if (horizontal !== 'TOGETHER') {
    // A weak arrow sends the bare shaft away from the riser side of the archer.
    const weakSide = handedness === 'RH' ? 'RIGHT' : 'LEFT'
    conclusions.push(horizontal === weakSide ? 'a weak arrow' : 'a stiff arrow')
  }
  if (vertical !== 'TOGETHER') {
    conclusions.push(
      vertical === 'LOW' ? 'a nocking point that is too high' : 'a nocking point that is too low',
    )
  }

  return {
    landing: `The bare shaft lands ${where.join(' and ')} the fletched arrows.`,
    meaning: `That reads as ${conclusions.join(' and ')}.`,
  }
}
