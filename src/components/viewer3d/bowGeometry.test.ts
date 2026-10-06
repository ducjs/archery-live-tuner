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
    expect(right.point[2]).toBe(2)
    expect(right.atRest[2]).toBeCloseTo((2 * 220) / 685.8, 9)

    const left = bowGeometry(withValue('bow.centerShot', -3), 1)
    expect(left.point[2]).toBe(-3)
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
    expect(amplified.point[2]).toBe(12)
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
    expect(geometry.limb.at(-1)![0]).toBe(-210)
  })
})

describe('parts of the bow', () => {
  const right = bowGeometry(reference, 1)
  const left = bowGeometry(withValue('bow.handedness', 'LH'), 1)

  it('runs the riser from one limb pocket to the other, in the string plane', () => {
    expect(right.riser[0]).toEqual(right.pockets[0])
    expect(right.riser.at(-1)).toEqual(right.pockets[1])
    expect(right.pockets[0][1]).toBe(-RISER_HALF_LENGTH)
    expect(right.pockets[1][1]).toBe(RISER_HALF_LENGTH)
    expect(right.pockets.map((pocket) => pocket[2])).toEqual([0, 0])
  })

  it('sets the sight window to the bow hand side, clear of the arrow', () => {
    const windowOf = (geometry: typeof right) =>
      geometry.riser.filter((point) => point[2] !== 0).map((point) => point[2])
    expect(windowOf(right).length).toBeGreaterThan(1)
    expect(windowOf(right).every((z) => z > 0)).toBe(true)
    expect(windowOf(left).every((z) => z < 0)).toBe(true)

    // The arrow lies on the string line; the riser beside it has to leave it room.
    const beside = right.riser.find(([, y]) => y > 0)!
    expect(beside[2] - 15).toBeGreaterThan(right.shaftRadius * 1.4)
  })

  it('starts each limb in its pocket', () => {
    const [x, y] = right.limb[0]!
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
