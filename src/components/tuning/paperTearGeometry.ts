import type { PaperTear } from '../../models/simulation.ts'

/** Side of the square sheet, in drawing units. */
export const SHEET = 120
const CENTER = SHEET / 2
/** Drawing units between the hole and the tail when the offset is at full scale. */
const REACH = 150
/** The tear never runs off the sheet. */
const MAX_REACH = 38
const VANE_LENGTH = 15

export type SheetPoint = { x: number; y: number }

/**
 * Where the hole of the point and the three cuts of the fletching sit on the
 * sheet. The two are placed about the middle, so a long tear stays on it.
 */
export function tearGeometry(tail: PaperTear['tail']): {
  hole: SheetPoint
  tail: SheetPoint
  vanes: SheetPoint[]
} {
  let dx = tail.lateral * REACH
  // Drawings count downward; the tear counts upward.
  let dy = -tail.vertical * REACH
  const length = Math.hypot(dx, dy)
  if (length > MAX_REACH) {
    dx *= MAX_REACH / length
    dy *= MAX_REACH / length
  }
  const hole = { x: CENTER - dx / 2, y: CENTER - dy / 2 }
  const end = { x: CENTER + dx / 2, y: CENTER + dy / 2 }

  // As in the drawings of the tuning guides, the cuts make a Y: one vane lies
  // back along the tear, the other two spread away from the hole, 120° apart.
  // On a clean hole there is no tear to follow, and the Y stands upright.
  const along = length < 0.5 ? -Math.PI / 2 : Math.atan2(dy, dx)
  const vanes = [0, 1, 2].map((index) => {
    const angle = along + Math.PI + (index * 2 * Math.PI) / 3
    return { x: end.x + VANE_LENGTH * Math.cos(angle), y: end.y + VANE_LENGTH * Math.sin(angle) }
  })
  return { hole, tail: end, vanes }
}
