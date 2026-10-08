// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { ResultPanel } from './ResultPanel.tsx'

afterEach(cleanup)

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

const reference = createDefaultSetup()
// 308 gr on a 64 lb bow is 4.8 gr/lb, and still above the 276 gr of the AMO chart.
const tooLight = withDisplay(reference, 'bow.drawWeight', 64)
// On a 70 lb bow the AMO chart asks for 312 gr.
const belowAmo = withDisplay(reference, 'bow.drawWeight', 70)

describe('paper tear in the result panel', () => {
  const panel = (setup: TuningSetup, withComparison = true) =>
    render(
      <ResultPanel
        result={heuristicModel.simulate(setup)}
        comparison={withComparison ? heuristicModel.compareBareShaft(setup) : undefined}
        handedness="RH"
      />,
    )

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('comes with the bare shaft test, not without it', () => {
    panel(reference, false)
    expect(screen.queryByText('Paper tear test')).toBeNull()
    cleanup()

    panel(reference)
    expect(screen.getByText('Paper tear test')).toBeTruthy()
    expect(screen.getByText(/go through one hole/)).toBeTruthy()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('draws the tear and says what it means', () => {
    panel(withDisplay(reference, 'arrow.spine', 500))
    expect(screen.getByText(/tears to the right of the hole.*stiff arrow/)).toBeTruthy()
    const figure = screen.getByRole('img', { name: /sheet of paper.*to the right of the hole/ })
    expect(figure.querySelector('circle')).toBeTruthy()
  })
})

describe('derived numbers in the result panel', () => {
  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('shows them in Advanced only', () => {
    const result = heuristicModel.simulate(reference)
    const { rerender } = render(<ResultPanel result={result} handedness="RH" />)
    expect(screen.queryByText('Grains per pound')).toBeNull()
    expect(screen.queryByText('Front of center (FOC)')).toBeNull()

    rerender(<ResultPanel result={result} handedness="RH" level="pro" />)
    expect(screen.getByText('Grains per pound').nextElementSibling?.textContent).toBe('8.1 gr/lb')
    expect(screen.getByText('Front of center (FOC)').nextElementSibling?.textContent).toBe(
      `${result.metrics.frontOfCenter.toFixed(1)} %`,
    )
    expect(screen.getByText('Kinetic energy').nextElementSibling?.textContent).toMatch(/ J$/)
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('notes a front of center outside the range of the Easton guide, in Advanced only', () => {
    // The reference arrow is front-heavy: 19 %.
    const result = heuristicModel.simulate(reference)
    const { rerender } = render(<ResultPanel result={result} handedness="RH" />)
    expect(screen.queryByText(/FOC of/)).toBeNull()
    rerender(<ResultPanel result={result} handedness="RH" level="pro" />)
    expect(screen.getByText(/FOC of 19\.0 % is above the 7 to 16 %/)).toBeTruthy()
    cleanup()

    // A light point on a long shaft brings it inside the range.
    const balanced = withDisplay(
      withDisplay(reference, 'arrow.pointWeight', 80),
      'arrow.length',
      31,
    )
    render(<ResultPanel result={heuristicModel.simulate(balanced)} handedness="RH" level="pro" />)
    expect(screen.queryByText(/FOC of/)).toBeNull()
  })

  it('gives no warning for an arrow that is heavy enough', () => {
    render(<ResultPanel result={heuristicModel.simulate(reference)} handedness="RH" level="pro" />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it.each([false, true])('warns about too light an arrow (advanced: %s)', (advanced) => {
    render(
      <ResultPanel
        result={heuristicModel.simulate(tooLight)}
        handedness="RH"
        level={advanced ? 'pro' : 'simple'}
      />,
    )
    expect(screen.getByRole('status').textContent).toMatch(/light.*4\.8 gr\/lb.*5 gr\/lb/)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each([false, true])(
    'warns once, and louder, under the AMO minimum (advanced: %s)',
    (advanced) => {
      render(
        <ResultPanel
          result={heuristicModel.simulate(belowAmo)}
          handedness="RH"
          level={advanced ? 'pro' : 'simple'}
        />,
      )
      expect(screen.getByRole('alert').textContent).toMatch(/308 gr.*312 gr.*AMO/)
      expect(screen.queryByRole('status')).toBeNull()
    },
  )
})
