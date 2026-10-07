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
import { suggestTuning, suggestionGroup } from './suggest.ts'

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

describe('suggestionGroup', () => {
  it('puts what is set on the bow apart from what has to be changed or bought', () => {
    expect(suggestionGroup('bow')).toBe('adjust')
    expect(suggestionGroup('arrowPart')).toBe('equipment')
    expect(suggestionGroup('newArrows')).toBe('equipment')
  })
})

describe('suggestTuning', () => {
  it('has nothing to suggest for the reference setup', () => {
    expect(suggestTuning(heuristicModel, reference)).toEqual({
      tuned: true,
      bareShaftSlightlyOff: false,
      suggestions: [],
    })
  })

  // The order and the limits below follow the Easton guide and Total Archery;
  // see readme/tuning-references.md §5 and §9.7.
  describe('in the order the books tune in', () => {
    const keys = (setup: TuningSetup) =>
      suggestTuning(heuristicModel, setup, { limit: 20 }).suggestions.map(
        (suggestion) => suggestion.parameterKey,
      )

    it('takes the nocking point first, however far off the spine is', () => {
      const weakAndNockHigh = withDisplay(
        withDisplay(reference, 'arrow.spine', 950),
        'bow.nockingPointHeight',
        6.5,
      )
      expect(keys(weakAndNockHigh)[0]).toBe('bow.nockingPointHeight')
    })

    it('goes from plunger to point to draw weight to a new shaft', () => {
      const order = keys(withDisplay(reference, 'arrow.spine', 800))
      const at = (key: string) => order.indexOf(key)
      expect(at('bow.plungerStiffness')).toBeGreaterThanOrEqual(0)
      expect(at('bow.plungerStiffness')).toBeLessThan(at('arrow.pointWeight'))
      expect(at('arrow.pointWeight')).toBeLessThan(at('bow.drawWeight'))
      expect(at('bow.drawWeight')).toBeLessThan(at('arrow.spine'))
    })

    it('does not move the center shot off its set-up position to make up for the spine', () => {
      expect(keys(withDisplay(reference, 'arrow.spine', 800))).not.toContain('bow.centerShot')
      expect(keys(withDisplay(reference, 'arrow.spine', 600))).not.toContain('bow.centerShot')
    })

    it('still puts back a center shot that was moved', () => {
      const moved = withDisplay(reference, 'bow.centerShot', 3)
      const { suggestions } = suggestTuning(heuristicModel, moved, { limit: 20 })
      const centerShot = suggestions.find(
        (suggestion) => suggestion.parameterKey === 'bow.centerShot',
      )!
      expect(centerShot.direction).toBe('decrease')
      expect(centerShot.to).toBeGreaterThanOrEqual(0)
    })
  })

  describe('what counts as tuned', () => {
    it('accepts a bare shaft a little to the stiff side', () => {
      const slightlyStiff = withDisplay(reference, 'bow.plungerStiffness', 1.6)
      expect(heuristicModel.compareBareShaft(slightlyStiff).horizontal).toBe('LEFT')
      expect(suggestTuning(heuristicModel, slightlyStiff)).toEqual({
        tuned: true,
        bareShaftSlightlyOff: true,
        suggestions: [],
      })
    })

    it('mirrors the stiff side for a left-handed archer', () => {
      const leftHanded = { ...reference, bow: { ...reference.bow, handedness: 'LH' as const } }
      const slightlyStiff = withDisplay(leftHanded, 'bow.plungerStiffness', 1.6)
      expect(heuristicModel.compareBareShaft(slightlyStiff).horizontal).toBe('RIGHT')
      expect(suggestTuning(heuristicModel, slightlyStiff).tuned).toBe(true)
    })

    it('does not accept the same distance to the weak side', () => {
      const slightlyWeak = withDisplay(reference, 'bow.plungerStiffness', 0.4)
      expect(heuristicModel.compareBareShaft(slightlyWeak).horizontal).toBe('RIGHT')
      expect(suggestTuning(heuristicModel, slightlyWeak).tuned).toBe(false)
    })

    it('accepts a bare shaft a little low, not a little high', () => {
      const low = withDisplay(reference, 'bow.nockingPointHeight', 4.5)
      expect(heuristicModel.compareBareShaft(low).vertical).toBe('LOW')
      expect(suggestTuning(heuristicModel, low).tuned).toBe(true)

      const high = withDisplay(reference, 'bow.nockingPointHeight', 3.5)
      expect(heuristicModel.compareBareShaft(high).vertical).toBe('HIGH')
      expect(suggestTuning(heuristicModel, high).tuned).toBe(false)
    })

    it('does not accept a bare shaft that is clearly off', () => {
      const stiff = withDisplay(reference, 'arrow.spine', 600)
      expect(suggestTuning(heuristicModel, stiff).tuned).toBe(false)
    })
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
