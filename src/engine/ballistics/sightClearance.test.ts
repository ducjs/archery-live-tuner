import { describe, expect, it } from 'vitest'
import { launchAngleFor } from './flight.ts'
import { CLOSE_ROOM, pinPosition, pinReach, type SightGeometry } from './sightClearance.ts'

const geometry: SightGeometry = {
  speed: 58_000,
  drag: 8.3e-4,
  eyeHeight: 110,
  drawLength: 28 * 25.4,
  extension: 150,
  pinDiameter: 12,
  shaftDiameter: 4.2,
  vaneHeight: 12,
}
const at = (meters: number, change: Partial<SightGeometry> = {}) =>
  pinPosition({ ...geometry, ...change }, meters * 1000)

describe('pinReach', () => {
  it('is the draw length to the pivot point plus the extension', () => {
    // 28 in AMO is 26.25 in to the pivot: 666.75 mm.
    expect(pinReach(geometry)).toBeCloseTo(666.75 + 150, 6)
  })
})

describe('pinPosition', () => {
  it('puts the pin on the line from the eye to the target', () => {
    const angle = launchAngleFor(geometry.speed, geometry.drag, 18_000, geometry.eyeHeight)
    const { pinHeight } = at(18)
    expect(pinHeight).toBeCloseTo(110 - 816.75 * Math.tan(angle), 6)
    // At 18 m the pin is some 8 cm above the arrow.
    expect(pinHeight).toBeGreaterThan(70)
    expect(pinHeight).toBeLessThan(95)
  })

  it('brings the pin down as the target moves away', () => {
    const heights = [18, 30, 50, 70, 90].map((meters) => at(meters).pinHeight)
    for (let i = 1; i < heights.length; i++) expect(heights[i]).toBeLessThan(heights[i - 1]!)
  })

  it('leaves room for the pin housing, the vanes and half the shaft', () => {
    const { pinHeight, room } = at(30)
    expect(room).toBeCloseTo(pinHeight - 6 - 12 - 2.1, 9)
  })

  it('is clear at short distance and runs out of room far out', () => {
    expect(at(18).status).toBe('clear')
    expect(at(30).status).toBe('clear')
    // 58 m/s at 90 m takes more angle than this anchor and extension allow.
    expect(at(90).status).toBe('blocked')
    expect(at(90).room).toBeLessThan(0)
  })

  it('calls it close just before that', () => {
    const tight = [50, 60, 70, 80].map((meters) => at(meters)).find((pin) => pin.status === 'close')
    expect(tight).toBeDefined()
    expect(tight!.room).toBeGreaterThanOrEqual(0)
    expect(tight!.room).toBeLessThan(CLOSE_ROOM)
  })

  it('gains room from a shorter extension, a higher eye or a faster arrow', () => {
    const room = at(70).room
    expect(at(70, { extension: 60 }).room).toBeGreaterThan(room)
    expect(at(70, { eyeHeight: 130 }).room).toBeGreaterThan(room)
    expect(at(70, { speed: 66_000 }).room).toBeGreaterThan(room)
  })

  it('loses room to a larger pin housing and a thicker shaft', () => {
    const room = at(50).room
    expect(at(50, { pinDiameter: 25 }).room).toBeLessThan(room)
    expect(at(50, { shaftDiameter: 9 }).room).toBeLessThan(room)
    expect(at(50, { vaneHeight: 20 }).room).toBeCloseTo(room - 8, 9)
  })

  it('says so when the arrow cannot reach the distance', () => {
    const pin = at(90, { speed: 22_000 })
    expect(pin.status).toBe('unreachable')
    expect(pin.pinHeight).toBeNaN()
  })
})
