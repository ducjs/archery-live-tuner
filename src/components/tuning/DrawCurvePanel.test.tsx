// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { HEURISTIC_V0, heuristicModel } from '../../engine/index.ts'
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

describe('with the archer’s own measurement', () => {
  const c = HEURISTIC_V0.drawCurve
  const stroke = reference.bow.drawLength - reference.bow.braceHeight
  // Forces of a curve with fullness 0.3 and end rise 0.6, at the two places.
  const force = (offset: number) => {
    const u = 1 - offset / stroke
    return reference.bow.drawWeight * (u + 0.3 * u * (1 - u) + 0.6 * u * (1 - u) * (1 - 2 * u))
  }
  const measured = (near: number, mid: number) => ({
    ...reference,
    bow: { ...reference.bow, drawForceNear: near, drawForceMid: mid },
  })

  it('says how many points shaped the curve, and marks them on the chart', () => {
    show(measured(force(c.nearOffset), force(c.midOffset)))
    expect(screen.getByText('Shaped by 2 forces from your bow scale.')).toBeTruthy()
    expect(screen.queryByText(/Estimated from the bow size/)).toBeNull()
    expect(screen.getByRole('img').querySelectorAll('circle[data-measured]')).toHaveLength(2)
  })

  it('reminds that a measurement belongs to one draw weight, draw length and brace height', () => {
    show(measured(force(c.nearOffset), 0))
    expect(screen.getByText('Shaped by 1 force from your bow scale.')).toBeTruthy()
    expect(screen.getByText(/Measure again after changing/)).toBeTruthy()
  })

  it('says so when the forces entered are not used', () => {
    show(measured(reference.bow.drawWeight + 5, 0))
    expect(screen.getByRole('status').textContent).toMatch(/do not fit a draw force curve/)
    expect(screen.getByText(/Estimated from the bow size/)).toBeTruthy()
  })

  it('says so when only the second force is entered', () => {
    show(measured(0, force(c.midOffset)))
    expect(screen.getByRole('status').textContent).toMatch(/do not fit a draw force curve/)
  })
})
