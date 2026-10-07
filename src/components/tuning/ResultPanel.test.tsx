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

describe('derived numbers in the result panel', () => {
  it('shows them in Advanced only', () => {
    const result = heuristicModel.simulate(reference)
    const { rerender } = render(<ResultPanel result={result} handedness="RH" />)
    expect(screen.queryByText('Grains per pound')).toBeNull()
    expect(screen.queryByText('Front of center (FOC)')).toBeNull()

    rerender(<ResultPanel result={result} handedness="RH" advanced />)
    expect(screen.getByText('Grains per pound').nextElementSibling?.textContent).toBe('8.1 gr/lb')
    expect(screen.getByText('Front of center (FOC)').nextElementSibling?.textContent).toBe(
      `${result.metrics.frontOfCenter.toFixed(1)} %`,
    )
    expect(screen.getByText('Kinetic energy').nextElementSibling?.textContent).toMatch(/ J$/)
  })

  it('gives no warning for an arrow that is heavy enough', () => {
    render(<ResultPanel result={heuristicModel.simulate(reference)} handedness="RH" advanced />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it.each([false, true])('warns about too light an arrow (advanced: %s)', (advanced) => {
    render(
      <ResultPanel
        result={heuristicModel.simulate(tooLight)}
        handedness="RH"
        advanced={advanced}
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
          advanced={advanced}
        />,
      )
      expect(screen.getByRole('alert').textContent).toMatch(/308 gr.*312 gr.*AMO/)
      expect(screen.queryByRole('status')).toBeNull()
    },
  )
})
