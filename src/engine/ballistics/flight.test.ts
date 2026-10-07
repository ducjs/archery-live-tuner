import { describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { dragPerMeter, launchAngleFor } from './flight.ts'

const { arrow } = createDefaultSetup()
const SPEED = 58_000
const G = 9806.65

describe('dragPerMeter', () => {
  it('takes about a twelfth of a percent of the speed per meter off the reference arrow', () => {
    // 4.2 mm shaft, 308 gr: 0.5 · 1.2 · 2 · 1.385e-5 m² / 0.01996 kg.
    expect(dragPerMeter(arrow)).toBeCloseTo(8.33e-4, 5)
  })

  it('is larger for a thicker shaft and smaller for a heavier arrow', () => {
    expect(dragPerMeter({ ...arrow, shaftDiameter: 6 })).toBeGreaterThan(dragPerMeter(arrow))
    expect(dragPerMeter({ ...arrow, pointWeight: arrow.pointWeight * 1.5 })).toBeLessThan(
      dragPerMeter(arrow),
    )
  })
})

describe('launchAngleFor', () => {
  it('gives the textbook angle without drag', () => {
    for (const distance of [18_000, 50_000, 90_000]) {
      const textbook = 0.5 * Math.asin((G * distance) / SPEED ** 2)
      expect(launchAngleFor(SPEED, 0, distance)).toBeCloseTo(textbook, 4)
    }
  })

  it('asks for more elevation with drag, and more so the further the target', () => {
    const drag = dragPerMeter(arrow)
    const extra = (distance: number) =>
      launchAngleFor(SPEED, drag, distance) - launchAngleFor(SPEED, 0, distance)
    expect(extra(18_000)).toBeGreaterThan(0)
    expect(extra(90_000)).toBeGreaterThan(5 * extra(18_000))
    // At 90 m drag is worth a few tenths of a degree, not several degrees.
    expect((extra(90_000) * 180) / Math.PI).toBeGreaterThan(0.2)
    expect((extra(90_000) * 180) / Math.PI).toBeLessThan(1.5)
  })

  it('adds the angle up to a point above the launch point', () => {
    const level = launchAngleFor(SPEED, 0, 18_000)
    const up = launchAngleFor(SPEED, 0, 18_000, 110)
    // 110 mm over 18 m is 0.35°.
    expect(up - level).toBeCloseTo(110 / 18_000, 3)
  })

  it('asks for less elevation from a faster arrow', () => {
    expect(launchAngleFor(70_000, 0, 70_000)).toBeLessThan(launchAngleFor(50_000, 0, 70_000))
  })

  it('is NaN for a target the arrow cannot reach', () => {
    expect(launchAngleFor(20_000, 0, 90_000)).toBeNaN()
    expect(launchAngleFor(0, 0, 18_000)).toBeNaN()
    expect(launchAngleFor(SPEED, 0, 0)).toBeNaN()
  })
})
