// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel, planTuning } from '../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { TuningPlanPanel } from './TuningPlanPanel.tsx'

afterEach(cleanup)

const reference = createDefaultSetup()

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

function renderFor(setup: TuningSetup, options = {}) {
  const onApply = vi.fn()
  const plan = planTuning(heuristicModel, setup, options)
  render(<TuningPlanPanel plan={plan} onApply={onApply} />)
  return { onApply, plan }
}

describe('TuningPlanPanel', () => {
  it('shows nothing for a tuned setup', () => {
    renderFor(reference)
    expect(screen.queryByText('The whole session')).toBeNull()
  })

  it('shows nothing when one step is all there is: the suggestions already say it', () => {
    const { plan } = renderFor(withDisplay(reference, 'bow.nockingPointHeight', 8))
    expect(plan.steps).toHaveLength(1)
    expect(screen.queryByText('The whole session')).toBeNull()
  })

  it('lists the steps in order, each with its value and what it changes', () => {
    const detuned = withDisplay(
      withDisplay(reference, 'bow.nockingPointHeight', 8),
      'arrow.spine',
      800,
    )
    const { plan } = renderFor(detuned)
    const steps = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(steps).toHaveLength(plan.steps.length)
    expect(steps[0]!.textContent).toMatch(/^1Lower the nocking point/)
    expect(steps[0]!.textContent).toMatch(/4\.0 mm.*8\.0 mm/)
    expect(steps[1]!.textContent).toMatch(/^2/)
    expect(
      screen.getByText(
        `After these ${plan.steps.length} steps the model reads the setup as tuned.`,
      ),
    ).toBeTruthy()
  })

  it('says so when the steps do not get the setup tuned', () => {
    const far = withDisplay(
      withDisplay(reference, 'arrow.spine', 1000),
      'bow.nockingPointHeight',
      9,
    )
    renderFor(far, { maxSteps: 2 })
    expect(screen.getByText(/still does not read the setup as tuned.*another shaft/)).toBeTruthy()
  })

  it('hands every change of the plan over, in order, to be tried at once', async () => {
    const user = userEvent.setup()
    const detuned = withDisplay(
      withDisplay(reference, 'bow.nockingPointHeight', 8),
      'arrow.spine',
      800,
    )
    const { onApply, plan } = renderFor(detuned)
    await user.click(screen.getByRole('button', { name: 'Try all of them' }))
    expect(onApply).toHaveBeenCalledWith(
      plan.steps.map((step) => ({
        parameterKey: step.suggestion.parameterKey,
        value: step.suggestion.to,
      })),
    )
    // Taken together, they leave the setup the plan ends on.
    const end = onApply.mock.calls[0]![0].reduce(
      (setup: TuningSetup, change: { parameterKey: string; value: number }) =>
        setValue(setup, getParameter(change.parameterKey), change.value),
      detuned,
    )
    expect(end).toEqual(plan.steps.at(-1)!.setup)
  })
})
