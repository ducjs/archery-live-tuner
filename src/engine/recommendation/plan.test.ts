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
import { planTuning } from './plan.ts'
import { suggestTuning } from './suggest.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

const keys = (setup: TuningSetup, options = {}) =>
  planTuning(heuristicModel, setup, options).steps.map((step) => step.suggestion.parameterKey)

describe('planTuning', () => {
  it('has nothing to do for a tuned setup', () => {
    expect(planTuning(heuristicModel, reference)).toEqual({ steps: [], tuned: true })
  })

  it('walks a setup that is off in two ways to tuned, up and down first', () => {
    const detuned = withDisplay(
      withDisplay(reference, 'bow.nockingPointHeight', 8),
      'arrow.spine',
      800,
    )
    const plan = planTuning(heuristicModel, detuned)
    expect(plan.steps.length).toBeGreaterThan(1)
    expect(plan.steps[0]!.suggestion.parameterKey).toBe('bow.nockingPointHeight')
    expect(plan.tuned).toBe(true)
  })

  it('starts by putting back a center shot that was moved', () => {
    const moved = withDisplay(withDisplay(reference, 'bow.centerShot', 2), 'arrow.spine', 800)
    expect(keys(moved)[0]).toBe('bow.centerShot')
  })

  it('changes each value once, in the order of the guides', () => {
    const order = keys(withDisplay(reference, 'arrow.spine', 1000))
    expect(new Set(order).size).toBe(order.length)
    const at = (key: string) => order.indexOf(key)
    // The plunger comes first, by its tension or its preload.
    expect(order[0]).toMatch(/^bow\.plunger/)
    expect(at('bow.plungerStiffness')).toBeLessThan(2)
    // What it reaches for next comes later in the order of the guides.
    if (at('arrow.pointWeight') >= 0 && at('bow.drawWeight') >= 0) {
      expect(at('arrow.pointWeight')).toBeLessThan(at('bow.drawWeight'))
    }
    if (at('arrow.spine') >= 0) expect(at('arrow.spine')).toBe(order.length - 1)
  })

  it('starts every step from the result of the one before', () => {
    const detuned = withDisplay(
      withDisplay(reference, 'bow.nockingPointHeight', 8),
      'arrow.spine',
      850,
    )
    const { steps } = planTuning(heuristicModel, detuned)
    let setup = detuned
    for (const [index, step] of steps.entries()) {
      const parameter = getParameter(step.suggestion.parameterKey) as NumberParameter
      // The step is what the suggestions put first for the setup as it then is.
      expect(step.suggestion.from).toBeCloseTo(
        setup[parameter.key.startsWith('bow.') ? 'bow' : 'arrow'][
          parameter.key.split('.')[1] as never
        ],
        9,
      )
      const reading = heuristicModel.compareBareShaft(setup)
      expect(step.before.classification).toEqual(reading.fletched.classification)
      expect(step.before.horizontal).toBe(reading.horizontal)
      setup = setValue(setup, parameter, step.suggestion.to)
      expect(step.setup).toEqual(setup)
      if (index > 0) expect(step.before).toEqual(steps[index - 1]!.suggestion.after)
    }
  })

  it('stops at the most steps asked for, and says the setup is not tuned yet', () => {
    const far = withDisplay(
      withDisplay(reference, 'arrow.spine', 1000),
      'bow.nockingPointHeight',
      9,
    )
    const plan = planTuning(heuristicModel, far, { maxSteps: 1 })
    expect(plan.steps).toHaveLength(1)
    expect(plan.tuned).toBe(false)
  })

  it('keeps to the values Simple mode shows when asked to', () => {
    const messy = withDisplay(withDisplay(reference, 'arrow.spine', 900), 'bow.tiller', 10)
    for (const key of keys(messy, { tier: 'simple' })) {
      expect(getParameter(key).tier, key).toBe('simple')
    }
  })

  it('never makes a setup worse, and ends tuned or with nothing left to try', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const plan = planTuning(heuristicModel, setup)
        expect(plan.steps.length).toBeLessThanOrEqual(7)
        for (const step of plan.steps) expect(step.suggestion.improvement).toBeGreaterThan(0)
        const end = plan.steps.at(-1)?.setup ?? setup
        expect(plan.tuned).toBe(suggestTuning(heuristicModel, end, { limit: 1 }).tuned)
      }),
      { numRuns: 25 },
    )
  })
})
