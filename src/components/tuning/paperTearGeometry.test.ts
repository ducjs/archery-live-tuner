import { describe, expect, it } from 'vitest'
import { tearGeometry } from './paperTearGeometry.ts'

describe('tearGeometry', () => {
  it('puts a clean hole in the middle of the sheet, vanes around it', () => {
    const { hole, tail, vanes } = tearGeometry({ lateral: 0, vertical: 0 })
    expect(hole).toEqual({ x: 60, y: 60 })
    expect(tail).toEqual({ x: 60, y: 60 })
    expect(vanes).toHaveLength(3)
    // An upright Y: one cut down, two up and out.
    expect(vanes[0]!.x).toBeCloseTo(60, 6)
    expect(vanes[0]!.y).toBeGreaterThan(60)
    expect(vanes[1]!.y).toBeLessThan(60)
    expect(vanes[2]!.y).toBeLessThan(60)
  })

  it('puts the tail to the right and above for a tear to the right and high', () => {
    const { hole, tail } = tearGeometry({ lateral: 0.1, vertical: 0.1 })
    expect(tail.x).toBeGreaterThan(hole.x)
    // Up on the sheet is a smaller y.
    expect(tail.y).toBeLessThan(hole.y)
  })

  it('spreads two vanes away from the hole and lays the third back along the tear', () => {
    const { hole, tail, vanes } = tearGeometry({ lateral: -0.1, vertical: 0 })
    expect(tail.x).toBeLessThan(hole.x)
    expect(vanes[0]!.x).toBeGreaterThan(tail.x)
    expect(vanes[0]!.y).toBeCloseTo(tail.y, 6)
    expect(vanes[1]!.x).toBeLessThan(tail.x)
    expect(vanes[2]!.x).toBeLessThan(tail.x)
    expect(vanes[1]!.y).not.toBeCloseTo(vanes[2]!.y, 1)
  })

  it('keeps the longest tear on the sheet', () => {
    for (const lateral of [-1, 1]) {
      for (const vertical of [-1, 0, 1]) {
        const { hole, tail, vanes } = tearGeometry({ lateral, vertical })
        for (const { x, y } of [hole, tail, ...vanes]) {
          expect(x).toBeGreaterThan(8)
          expect(x).toBeLessThan(112)
          expect(y).toBeGreaterThan(8)
          expect(y).toBeLessThan(112)
        }
      }
    }
  })
})
