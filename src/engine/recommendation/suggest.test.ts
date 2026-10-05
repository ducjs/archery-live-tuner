import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { heuristicModel } from '../simulation/simulate.ts'
import { suggestTuning } from './suggest.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

function errorOf(setup: TuningSetup): number {
  const fletched = heuristicModel.analyze(setup).metrics
  const bare = heuristicModel.analyze(setup, { bareShaft: true }).metrics
  return (
    Math.abs(fletched.dynamicBehavior) +
    Math.abs(bare.lateralDeviation) +
    Math.abs(fletched.verticalTendency) +
    0.5 * fletched.clearanceRisk +
    0.3 * fletched.oscillation
  )
}

describe('suggestTuning', () => {
  it('has nothing to suggest for the reference setup', () => {
    expect(suggestTuning(heuristicModel, reference)).toEqual({ tuned: true, suggestions: [] })
  })

  it('suggests lowering a nocking point that is too high, first', () => {
    const nockHigh = withDisplay(reference, 'bow.nockingPointHeight', 9)
    const { tuned, suggestions } = suggestTuning(heuristicModel, nockHigh)
    expect(tuned).toBe(false)

    const first = suggestions[0]!
    expect(first.parameterKey).toBe('bow.nockingPointHeight')
    expect(first.direction).toBe('decrease')
    expect(first.to).toBeCloseTo(4, 6)
    expect(first.after.classification.vertical).toBe('NEUTRAL')
    expect(first.after.vertical).toBe('TOGETHER')
  })

  it('suggests ways to stiffen a weak arrow, bow adjustments before new arrows', () => {
    const weak = withDisplay(reference, 'arrow.spine', 800)
    const { suggestions } = suggestTuning(heuristicModel, weak, { limit: 20 })
    const byKey = new Map(suggestions.map((suggestion) => [suggestion.parameterKey, suggestion]))

    expect(byKey.get('arrow.spine')?.direction).toBe('decrease')
    expect(byKey.get('arrow.pointWeight')?.direction).toBe('decrease')
    expect(byKey.get('bow.drawWeight')?.direction).toBe('decrease')
    expect(byKey.get('bow.plungerStiffness')?.direction).toBe('increase')

    // A new shaft fixes the most, but a free adjustment that helps is offered first.
    expect(suggestions[0]!.effort).toBe('bow')
    const spine = byKey.get('arrow.spine')!
    expect(spine.improvement).toBeGreaterThan(suggestions[0]!.improvement)
  })

  it('suggests the opposite for a stiff arrow', () => {
    const stiff = withDisplay(reference, 'arrow.spine', 600)
    const { suggestions } = suggestTuning(heuristicModel, stiff, { limit: 20 })
    const byKey = new Map(suggestions.map((suggestion) => [suggestion.parameterKey, suggestion]))
    expect(byKey.get('arrow.spine')?.direction).toBe('increase')
    expect(byKey.get('arrow.pointWeight')?.direction).toBe('increase')
  })

  it('leaves out advanced parameters in the simple tier and respects the limit', () => {
    const messy = withDisplay(
      withDisplay(withDisplay(reference, 'arrow.spine', 850), 'bow.plungerPreload', 3),
      'bow.tiller',
      10,
    )
    const all = suggestTuning(heuristicModel, messy, { limit: 20 }).suggestions
    expect(all.some((suggestion) => suggestion.parameterKey === 'bow.plungerPreload')).toBe(true)

    const simple = suggestTuning(heuristicModel, messy, { tier: 'simple', limit: 20 }).suggestions
    for (const suggestion of simple) {
      expect(getParameter(suggestion.parameterKey).tier, suggestion.parameterKey).toBe('simple')
    }
    expect(suggestTuning(heuristicModel, messy, { limit: 2 }).suggestions).toHaveLength(2)
  })

  it('only suggests in-range changes that the model scores as better, best rank first', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const before = errorOf(setup)
        const { suggestions } = suggestTuning(heuristicModel, setup, { limit: 20 })
        for (const suggestion of suggestions) {
          const parameter = getParameter(suggestion.parameterKey) as NumberParameter
          expect(suggestion.to).toBeGreaterThanOrEqual(parameter.min)
          expect(suggestion.to).toBeLessThanOrEqual(parameter.max)
          expect(suggestion.to).not.toBe(suggestion.from)
          expect(suggestion.direction).toBe(
            suggestion.to > suggestion.from ? 'increase' : 'decrease',
          )

          const after = errorOf(setValue(setup, parameter, suggestion.to))
          expect(after).toBeLessThan(before)
          expect(suggestion.improvement).toBeCloseTo((before - after) / before, 9)
        }
      }),
      { numRuns: 40 },
    )
  })
})
