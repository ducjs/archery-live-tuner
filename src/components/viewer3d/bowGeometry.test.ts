import { describe, expect, it } from 'vitest'
import { defaultValues, getParameter, setValue } from '../../models/parameters.ts'
import { en } from '../../i18n/en.ts'
import { vi } from '../../i18n/vi.ts'
import { RISER_HALF_LENGTH, STABILIZER_HEIGHT, along, bowGeometry } from './bowGeometry.ts'

const { centerShotValue: centerShotText, nockingPointValue: nockingPointText } = en.viewer

const reference = defaultValues()
const withValue = (key: string, value: number | string) =>
  setValue(reference, getParameter(key), value)

describe('bowGeometry', () => {
  it('puts the nock on the string and the point one arrow length ahead', () => {
    const geometry = bowGeometry(reference, 1)
    expect(geometry.stringX).toBe(-220)
    expect(geometry.nock[0]).toBe(-220)
    expect(geometry.point[0]).toBeCloseTo(-220 + 685.8, 9)
    expect(geometry.shaftRadius).toBeCloseTo(2.1, 9)
  })

  it('raises the nock by the nocking point height and keeps the shaft on the rest', () => {
    const geometry = bowGeometry(withValue('bow.nockingPointHeight', 6), 1)
    expect(geometry.nock[1]).toBe(6)
    // Nock above square, so the point ends up below the square line.
    expect(geometry.point[1]).toBeLessThan(0)

    const brace = 220
    const crossing = along(geometry.nock, geometry.point, brace / 685.8)
    expect(crossing[0]).toBeCloseTo(0, 9)
    expect(crossing[1]).toBeCloseTo(0, 9)
  })

  it('moves the point sideways by the center shot and leaves the nock on the string line', () => {
    const right = bowGeometry(withValue('bow.centerShot', 2), 1)
    expect(right.nock[2]).toBe(0)
    expect(right.point[2]).toBeCloseTo(2, 9)
    expect(right.atRest[2]).toBeCloseTo((2 * 220) / 685.8, 9)

    const left = bowGeometry(withValue('bow.centerShot', -3), 1)
    expect(left.point[2]).toBeCloseTo(-3, 9)
  })

  it('amplifies both offsets and nothing else', () => {
    const setup = setValue(
      withValue('bow.centerShot', 2),
      getParameter('bow.nockingPointHeight'),
      5,
    )
    const real = bowGeometry(setup, 1)
    const amplified = bowGeometry(setup, 6)
    expect(amplified.nock[1]).toBe(30)
    expect(amplified.point[2]).toBeCloseTo(12, 9)
    expect(amplified.point[0]).toBe(real.point[0])
    expect(amplified.stringX).toBe(real.stringX)
  })

  it('puts the riser on the other side for a left-handed archer', () => {
    expect(bowGeometry(reference, 1).side).toBe(1)
    expect(bowGeometry(withValue('bow.handedness', 'LH'), 1).side).toBe(-1)
  })

  it('moves the string and limb tips with brace height', () => {
    const geometry = bowGeometry(withValue('bow.braceHeight', 240), 1)
    expect(geometry.stringX).toBe(-240)
    expect(geometry.string[1]![0]).toBe(-240)
    expect(geometry.limbs[0].at(-1)![0]).toBe(-210)
  })
})

describe('parts of the bow', () => {
  const right = bowGeometry(reference, 1)
  const left = bowGeometry(withValue('bow.handedness', 'LH'), 1)

  it('runs the riser from one limb pocket to the other, in the string plane', () => {
    expect(right.riser.lower[0]).toEqual(right.pockets[0])
    expect(right.riser.upper.at(-1)).toEqual(right.pockets[1])
    for (const [, , z] of [...right.riser.lower, ...right.riser.upper]) expect(z).toBe(0)
    expect(right.pockets[0][1]).toBe(-RISER_HALF_LENGTH)
    expect(right.pockets[1][1]).toBe(RISER_HALF_LENGTH)
    expect(right.pockets.map((pocket) => pocket[2])).toEqual([0, 0])
  })

  it('sets the sight window to the bow hand side, clear of the arrow', () => {
    expect(right.riser.bar.every(([, , z]) => z > 0)).toBe(true)
    expect(left.riser.bar.every(([, , z]) => z < 0)).toBe(true)
    expect(left.riser.wall).toBe(-right.riser.wall)

    // The riser is whole only below the arrow and well above it.
    expect(right.riser.lower.at(-1)![1]).toBeLessThan(-right.shaftRadius * 3)
    expect(right.riser.upper[0]![1]).toBeGreaterThan(120)
    // The bar reaches into the whole riser at both ends, so there is no gap between them.
    expect(right.riser.bar[0]![1]).toBeLessThan(right.riser.lower.at(-1)![1])
    expect(right.riser.bar.at(-1)![1]).toBeGreaterThan(right.riser.upper[0]![1])
  })

  it('leaves the arrow room in the window, whatever the center shot', () => {
    // The largest center shot toward the riser, drawn six times larger, is the worst case.
    for (const [hand, toRiser] of [
      ['RH', 5],
      ['LH', -5],
    ] as const) {
      const geometry = bowGeometry(
        setValue(withValue('bow.handedness', hand), getParameter('bow.centerShot'), toRiser),
        6,
      )
      const gap = Math.abs(geometry.riser.wall) - Math.abs(geometry.atRest[2])
      expect(gap, hand).toBeGreaterThan(geometry.shaftRadius * 1.4 + 2)
    }
  })

  it('starts each limb in its pocket', () => {
    const [x, y] = right.limbs[0][0]!
    expect(Math.hypot(x - right.pockets[1][0], y - right.pockets[1][1])).toBeLessThan(40)
  })

  it('carries the long rod forward by the stabilizer position, below the arrow', () => {
    const { from, to } = bowGeometry(withValue('bow.stabilizerPosition', 600), 1).longRod
    expect(to[0] - from[0]).toBe(600)
    expect(from[1]).toBe(STABILIZER_HEIGHT)
    expect(to[1]).toBe(STABILIZER_HEIGHT)
    expect(STABILIZER_HEIGHT).toBeLessThan(0)
  })

  it('has two side rods of 10 in, mirrored, pointing back and outward', () => {
    const [one, other] = right.sideRods
    for (const rod of right.sideRods) {
      const length = Math.hypot(
        rod.to[0] - rod.from[0],
        rod.to[1] - rod.from[1],
        rod.to[2] - rod.from[2],
      )
      expect(length).toBeCloseTo(254, 0)
      expect(rod.to[0]).toBeLessThan(rod.from[0])
      expect(Math.abs(rod.to[2])).toBeGreaterThan(Math.abs(rod.from[2]))
    }
    expect(one!.to[2]).toBe(-other!.to[2])
    expect(one!.to[0]).toBe(other!.to[0])
  })
})

describe('the setup on the bow', () => {
  const base = bowGeometry(reference, 1)
  const tipHeight = (geometry: typeof base) => geometry.limbs[0].at(-1)![1]

  it('makes a longer riser longer, and the bow with it', () => {
    const long = bowGeometry(withValue('bow.riserSize', 'H27'), 1)
    expect(long.pockets[1][1]).toBeCloseTo((RISER_HALF_LENGTH * 27) / 25, 9)
    // Two inches more of bow is one inch more to each tip.
    expect(tipHeight(long) - tipHeight(base)).toBeCloseTo(25.4, 9)
  })

  it('makes the bow longer with longer limbs, on the same riser', () => {
    const long = bowGeometry(withValue('bow.limbSize', '70'), 1)
    expect(long.pockets).toEqual(base.pockets)
    expect(tipHeight(long) - tipHeight(base)).toBeCloseTo(25.4, 9)
  })

  it('carries the string to the side with limbs out of line, and leaves the rest where it is', () => {
    const both = bowGeometry(
      setValue(withValue('bow.limbAlignmentTop', 2), getParameter('bow.limbAlignmentBottom'), 2),
      1,
    )
    expect(both.limbs[0].at(-1)![2]).toBe(2)
    expect(both.limbs[1].at(-1)![2]).toBe(2)
    // The limb leaves its pocket straight.
    expect(both.limbs[0][0]![2]).toBe(0)
    expect(both.stringZ).toBeGreaterThan(1.5)
    expect(both.nock[2]).toBe(both.stringZ)
    expect(both.atRest[2]).toBe(0)
    // The point ends up on the other side of the string line, by about three times as much.
    expect(both.point[2] - both.stringZ).toBeCloseTo(-both.stringZ * (685.8 / 220), 9)
  })

  it('keeps the string in the middle when the limbs point apart', () => {
    const apart = bowGeometry(
      setValue(withValue('bow.limbAlignmentTop', 2), getParameter('bow.limbAlignmentBottom'), -2),
      1,
    )
    expect(apart.stringZ).toBeCloseTo(0, 9)
    expect(apart.string[1]![2]).toBeGreaterThan(0)
    expect(apart.string[3]![2]).toBeLessThan(0)
  })

  it('opens the upper limb and closes the lower one for a positive tiller', () => {
    const even = bowGeometry(withValue('bow.tiller', 0), 1)
    const positive = bowGeometry(withValue('bow.tiller', 8), 1)
    const gap = (mark: { from: [number, number, number]; to: [number, number, number] }) =>
      mark.from[0] - mark.to[0]
    expect(gap(even.tiller[0])).toBeCloseTo(gap(even.tiller[1]), 9)
    // Top tiller minus bottom tiller is the value entered.
    expect(gap(positive.tiller[0]) - gap(positive.tiller[1])).toBeCloseTo(8, 9)
    // The tips, and so the string, stay where they are; so do the limbs in their pockets.
    expect(positive.limbs[0].at(-1)).toEqual(even.limbs[0].at(-1))
    expect(positive.limbs[0][0]).toEqual(even.limbs[0][0])
    expect(positive.limbs[1][0]).toEqual(even.limbs[1][0])
  })

  it('draws the string back to the draw length, and keeps its length', () => {
    const drawn = bowGeometry(reference, { amplify: 1, drawn: true })
    expect(drawn.stringX).toBeCloseTo(-711.2, 9)
    expect(drawn.nock[0]).toBe(drawn.stringX)
    // At full draw the point comes back to just behind the rest.
    expect(drawn.point[0]).toBeCloseTo(-711.2 + 685.8, 9)

    const length = (points: [number, number, number][]) =>
      points
        .slice(1)
        .reduce(
          (sum, point, index) =>
            sum + Math.hypot(point[0] - points[index]![0], point[1] - points[index]![1]),
          0,
        )
    // Without the nocking point height, which kinks the string a little.
    const square = withValue('bow.nockingPointHeight', 0)
    const atBrace = bowGeometry(square, 1).string.slice(1, 4)
    const atDraw = bowGeometry(square, { amplify: 1, drawn: true }).string.slice(1, 4)
    expect(length(atDraw)).toBeCloseTo(length(atBrace), 6)
    // The limb tips come back and in.
    expect(drawn.limbs[0].at(-1)![0]).toBeLessThan(base.limbs[0].at(-1)![0])
    expect(tipHeight(drawn)).toBeLessThan(tipHeight(base))
  })

  it('sizes the point, the stabilizer weight, the string and the plunger collar from their values', () => {
    const more = (key: string, value: number) => bowGeometry(withValue(key, value), 1)
    expect(more('arrow.pointWeight', 9).pointLength).toBeGreaterThan(base.pointLength)
    expect(more('bow.stabilizerMass', 600).weightLength).toBeGreaterThan(base.weightLength)
    expect(more('bow.string.strandCount', 20).stringRadius).toBeGreaterThan(base.stringRadius)
    expect(more('bow.plungerPreload', 3).plungerCollar).toBeGreaterThan(base.plungerCollar)
  })
})

describe('value text', () => {
  it('describes the center shot', () => {
    expect(centerShotText(0)).toBe('on the string line')
    expect(centerShotText(-1.5)).toBe('1.5 mm left of the string line')
    expect(centerShotText(2)).toBe('2.0 mm right of the string line')
  })

  it('describes the nocking point', () => {
    expect(nockingPointText(0)).toBe('square to the string')
    expect(nockingPointText(4)).toBe('4.0 mm above square')
    expect(nockingPointText(-2)).toBe('2.0 mm below square')
  })

  it('describes both in Vietnamese', () => {
    expect(vi.viewer.centerShotValue(-1.5)).toBe('lệch trái đường dây 1.5 mm')
    expect(vi.viewer.nockingPointValue(4)).toBe('cao hơn đường vuông góc 4.0 mm')
  })
})
