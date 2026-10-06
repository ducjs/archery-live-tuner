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
// 308 gr on a 70 lb bow is 4.4 gr/lb.
const tooLight = withDisplay(reference, 'bow.drawWeight', 70)

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
    expect(screen.getByRole('status').textContent).toMatch(/too light.*4\.4 gr\/lb.*5 gr\/lb/)
  })
})
