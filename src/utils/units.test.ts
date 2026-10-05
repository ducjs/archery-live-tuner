import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { convert, dimensionOf, type Unit } from './units.ts'

describe('convert', () => {
  it('converts known values', () => {
    expect(convert(1, 'in', 'mm')).toBeCloseTo(25.4, 10)
    expect(convert(22, 'cm', 'mm')).toBeCloseTo(220, 10)
    expect(convert(120, 'gr', 'g')).toBeCloseTo(7.7759, 4)
    expect(convert(38, 'lbf', 'N')).toBeCloseTo(169.032, 3)
    expect(convert(1, 'kg', 'g')).toBe(1000)
    expect(convert(180, 'deg', 'rad')).toBeCloseTo(Math.PI, 12)
    expect(convert(6, 'gpi', 'g/mm')).toBeCloseTo((6 * 0.06479891) / 25.4, 12)
  })

  it('returns the same value for the same unit', () => {
    expect(convert(12.34, 'mm', 'mm')).toBe(12.34)
  })

  it('rejects conversion between dimensions', () => {
    expect(() => convert(1, 'mm', 'g')).toThrow(/Cannot convert/)
    expect(() => convert(1, 'lbf', 'kg')).toThrow(/Cannot convert/)
  })

  it('round-trips within every dimension', () => {
    const units: Unit[] = ['mm', 'cm', 'm', 'in', 'g', 'kg', 'gr', 'N', 'lbf', 'kgf', 'rad', 'deg']
    fc.assert(
      fc.property(
        fc.constantFrom(...units),
        fc.constantFrom(...units),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        (from, to, value) => {
          fc.pre(dimensionOf(from) === dimensionOf(to))
          const back = convert(convert(value, from, to), to, from)
          expect(back).toBeCloseTo(value, 6)
        },
      ),
    )
  })
})
