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
import { advise, plungerReach, shaftLimit, readPlot, type Mark } from './targetPlot.ts'

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

  // Thresholds from the Easton guide and Total Archery, see tuning-references.md §9.7.
  describe('how far the bare shaft is off', () => {
    const adviceAt = (x: number) =>
      advise(readPlot([...group, { x, y: 0, bare: true }], 'RH'), true)

    it('scales the two limits with the shooting distance', () => {
      expect(shaftLimit(18)).toBeCloseTo(15, 9)
      expect(plungerReach(30)).toBeCloseTo(7.6, 9)
      expect(plungerReach(18)).toBeCloseTo(4.56, 9)
    })

    it('leaves it at the plunger when the offset is within its reach', () => {
      const advice = adviceAt(4)
      expect(advice).toHaveLength(1)
      expect(advice[0]!.action).toContain('plunger')
    })

    it('adds point and draw weight beyond the reach of the plunger', () => {
      const advice = adviceAt(9)
      expect(advice.map((item) => item.action)).toEqual([
        expect.stringContaining('plunger'),
        expect.stringContaining('point'),
      ])
    })

    it('says to change the shaft only past 15 cm at 18 m', () => {
      expect(adviceAt(14).some((item) => item.action.includes('thân tên'))).toBe(false)
      const advice = adviceAt(16)
      expect(advice.at(-1)!.action).toContain('thân tên cứng hơn')
    })

    it('moves the limits out at a longer distance', () => {
      const reading = readPlot([...group, { x: 16, y: 0, bare: true }], 'RH')
      expect(advise(reading, true, 30).some((item) => item.action.includes('thân tên'))).toBe(false)
    })
  })
})
