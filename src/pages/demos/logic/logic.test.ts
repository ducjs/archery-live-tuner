import { describe, expect, it } from 'vitest'
import { heuristicModel } from '../../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../../models/setup.ts'
import { tunePlan } from './explore.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

describe('tunePlan', () => {
  it('walks a detuned setup to tuned, one change at a time', () => {
    const detuned = withDisplay(
      withDisplay(reference, 'bow.nockingPointHeight', 8),
      'arrow.spine',
      800,
    )
    const plan = tunePlan(heuristicModel, detuned)
    expect(plan.steps.length).toBeGreaterThan(1)
    expect(plan.tuned).toBe(true)
  })

  it('has nothing to do for a tuned setup', () => {
    expect(tunePlan(heuristicModel, reference)).toEqual({ steps: [], tuned: true })
  })
})
