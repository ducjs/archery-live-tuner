// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { DrawCurvePanel } from './DrawCurvePanel.tsx'
import { gainReading } from './drawCurveReading.ts'

afterEach(cleanup)

const reference = createDefaultSetup()
const show = (setup = reference, units: 'archery' | 'metric' = 'archery') =>
  render(<DrawCurvePanel setup={setup} result={heuristicModel.simulate(setup)} units={units} />)

describe('draw force curve panel', () => {
  it('draws the curve and describes it in words', () => {
    show()
    expect(screen.getByRole('heading', { name: 'Draw force curve' })).toBeTruthy()
    const chart = screen.getByRole('img')
    expect(chart.getAttribute('aria-label')).toBe(
      'Force on the fingers over the draw, reaching 38.0 lb at 28.0 in.',
    )
    expect(chart.querySelectorAll('polyline')).toHaveLength(1)
  })

  it('gives the stored energy and the gain at the clicker', () => {
    show()
    expect(screen.getByText('Stored in the bow').nextElementSibling?.textContent).toMatch(
      /^4\d\.\d J$/,
    )
    expect(screen.getByText('Force gain at the clicker').nextElementSibling?.textContent).toBe(
      '1.9 lb per in',
    )
  })

  it('uses newtons and centimetres in metric', () => {
    show(reference, 'metric')
    expect(screen.getByText('Force gain at the clicker').nextElementSibling?.textContent).toMatch(
      /^\d\.\d N per cm$/,
    )
  })

  it('says the curve is an estimate', () => {
    show()
    expect(screen.getByText(/Estimated from the bow size/)).toBeTruthy()
  })

  it('reads the gain against 5% per inch without judging it', () => {
    const weight = reference.bow.drawWeight
    // N per mm, for a share of the draw weight gained per inch.
    const gaining = (sharePerInch: number) => ({ clickerGain: (weight * sharePerInch) / 25.4 })
    expect(gainReading(heuristicModel.analyze(reference).metrics, weight)).toBe('USUAL')
    expect(gainReading(gaining(0.059), weight)).toBe('USUAL')
    expect(gainReading(gaining(0.07), weight)).toBe('STEEPER')
    expect(gainReading(gaining(0.03), weight)).toBe('GENTLER')
    // A straight curve keeps climbing where a full one has flattened.
    const straight = setValue(reference, getParameter('bow.drawCurve'), 'STRAIGHT')
    expect(gainReading(heuristicModel.analyze(straight).metrics, weight)).toBe('STEEPER')
  })
})
