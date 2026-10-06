import { describe, expect, it } from 'vitest'
import { heuristicModel } from '../../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../../models/setup.ts'
import { LANDSCAPE_POINTS, LANDSCAPE_SPINES, landscape, sensitivity, tunePlan } from './explore.ts'
import { advise, readPlot, type Mark } from './targetPlot.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

describe('landscape', () => {
  const grid = landscape(heuristicModel, reference)

  it('covers every spine and point weight', () => {
    expect(grid).toHaveLength(LANDSCAPE_SPINES.length)
    expect(grid[0]).toHaveLength(LANDSCAPE_POINTS.length)
  })

  it('is neutral at the reference cell, stiffer above it and weaker below', () => {
    const column = LANDSCAPE_POINTS.indexOf(120)
    const row = LANDSCAPE_SPINES.indexOf(700)
    expect(grid[row]![column]!.rating).toBe('NEUTRAL')
    expect(grid[0]![column]!.rating).toBe('STIFF')
    expect(grid.at(-1)![column]!.rating).toBe('WEAK')
  })
})

describe('sensitivity', () => {
  it('ranks by size of effect, with the sign archers expect', () => {
    const entries = sensitivity(heuristicModel, reference)
    const sizes = entries.map((entry) => Math.abs(entry.effect))
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a))

    const effect = (key: string) => entries.find((entry) => entry.key === key)!.effect
    expect(effect('arrow.spine')).toBeLessThan(0)
    expect(effect('bow.drawWeight')).toBeLessThan(0)
    expect(effect('bow.braceHeight')).toBeLessThan(0)
  })
})

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

describe('target plot', () => {
  const group: Mark[] = [
    { x: 0.5, y: 1, bare: false },
    { x: -1, y: -0.5, bare: false },
    { x: 1, y: -1, bare: false },
    { x: -0.5, y: 0.5, bare: false },
  ]

  it('needs both kinds of arrow', () => {
    expect(readPlot(group, 'RH').enough).toBe(false)
    expect(readPlot(group, 'RH').conclusive).toBe(false)
  })

  it('reads a bare shaft to the right as weak for a right-handed archer', () => {
    const reading = readPlot([...group, { x: 6, y: 0, bare: true }], 'RH')
    expect(reading.conclusive).toBe(true)
    expect(reading.horizontal).toBe('WEAK')
    expect(reading.vertical).toBe('OK')
    expect(reading.clock).toBe(3)
    expect(reading.distance).toBeCloseTo(6, 6)

    expect(readPlot([...group, { x: 6, y: 0, bare: true }], 'LH').horizontal).toBe('STIFF')
  })

  it('reads a low bare shaft as a nocking point that is too high', () => {
    const reading = readPlot([...group, { x: 0, y: -5, bare: true }], 'RH')
    expect(reading.vertical).toBe('NOCK_HIGH')
    expect(reading.horizontal).toBe('OK')
    expect(reading.clock).toBe(6)
  })

  it('does not conclude from an offset inside the group', () => {
    const reading = readPlot([...group, { x: 0.6, y: 0.2, bare: true }], 'RH')
    expect(reading.enough).toBe(true)
    expect(reading.conclusive).toBe(false)
    expect(advise(reading, true)).toEqual([])
  })

  it('advises the nocking point first, then the plunger', () => {
    const reading = readPlot([...group, { x: 5, y: -5, bare: true }], 'RH')
    const advice = advise(reading, false)
    expect(advice[0]!.action).toContain('nocking point')
    expect(advice[1]!.action).toContain('plunger')
    expect(advice[1]!.why).toContain('cách thả dây')
  })
})
