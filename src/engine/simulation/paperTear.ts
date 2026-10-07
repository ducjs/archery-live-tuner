import type { Handedness } from '../../models/bow.ts'
import type { BareShaftComparison, PaperTear } from '../../models/simulation.ts'

/**
 * The paper tear test: where the fletching tears the paper relative to the
 * hole the point made, shot from a couple of meters.
 *
 * So close to the bow the fletching has not yet steered the arrow, so the
 * paper shows the same launch error the bare shaft does, seen from the other
 * end: a shaft that leaves tail-right flies off to the left. The tear is
 * therefore read from the bare shaft comparison and the two tests always
 * agree. Directions follow the Easton tuning guide.
 */
export function readPaperTear(comparison: BareShaftComparison, handedness: Handedness): PaperTear {
  const horizontal = ({ LEFT: 'RIGHT', TOGETHER: 'CLEAN', RIGHT: 'LEFT' } as const)[
    comparison.horizontal
  ]
  const vertical = ({ LOW: 'HIGH', TOGETHER: 'CLEAN', HIGH: 'LOW' } as const)[comparison.vertical]

  // The guide names two tears that poor clearance also makes: a high one, and
  // one to the weak side, which is the left for a right-handed archer.
  const weakSide = handedness === 'RH' ? 'LEFT' : 'RIGHT'
  const clearanceSuspect =
    comparison.fletched.classification.clearance !== 'LOW' &&
    (vertical === 'HIGH' || horizontal === weakSide)

  return {
    horizontal,
    vertical,
    // `|| 0` keeps a clean hole at 0 instead of -0.
    tail: {
      lateral: -comparison.offset.lateral || 0,
      vertical: -comparison.offset.vertical || 0,
    },
    clearanceSuspect,
  }
}
