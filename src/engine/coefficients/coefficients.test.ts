import { describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { convert } from '../../utils/units.ts'
import { createHeuristicModel, heuristicModel } from '../simulation/simulate.ts'
import { HEURISTIC_V0, parseCoefficients } from './coefficients.ts'
import base from './heuristic-0.2.json'

describe('coefficient file', () => {
  it('names its version, and results carry it', () => {
    expect(base.version).toBe('heuristic-0.2')
    expect(HEURISTIC_V0.version).toBe(base.version)
    expect(heuristicModel.simulate(createDefaultSetup()).modelVersion).toBe(base.version)
  })

  it('holds the reference setup in internal units', () => {
    expect(base.reference.drawWeight).toBeCloseTo(convert(38, 'lbf', 'N'), 9)
    expect(base.reference.drawLength).toBeCloseTo(convert(28, 'in', 'mm'), 9)
    expect(base.reference.frontMass).toBeCloseTo(convert(132, 'gr', 'g'), 9)
  })

  it('accepts a changed set and runs the model on it', () => {
    const calibrated = parseCoefficients({
      ...structuredClone(base),
      version: 'calibrated-test',
      behavior: { ...base.behavior, gain: 4 },
    })
    const result = createHeuristicModel(calibrated).simulate(createDefaultSetup())
    expect(result.modelVersion).toBe('calibrated-test')
  })

  it('refuses a set with a missing number', () => {
    const broken: Record<string, unknown> = structuredClone(base)
    broken.flex = { neutralAmplitude: 0.4, mismatchGain: 1.2, decay: 14 }
    expect(() => parseCoefficients(broken)).toThrow('flex.endMassFactor')
  })

  it('refuses a number that is not one', () => {
    const broken = structuredClone(base) as unknown as { energy: Record<string, unknown> }
    broken.energy.drawCurveFactor = '1.14'
    expect(() => parseCoefficients(broken)).toThrow('energy.drawCurveFactor')
  })

  it('refuses an entry it does not know', () => {
    expect(() => parseCoefficients({ ...structuredClone(base), extra: { a: 1 } })).toThrow(
      'Unknown coefficient .extra',
    )
  })

  it('refuses something that is not a set at all', () => {
    expect(() => parseCoefficients(null)).toThrow()
    expect(() => parseCoefficients({ ...structuredClone(base), thresholds: null })).toThrow(
      'thresholds',
    )
  })
})
