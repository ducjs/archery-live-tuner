import { describe, expect, it } from 'vitest'
import type { Mark, TargetPlot } from '../../models/observation.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { heuristicModel } from '../simulation/simulate.ts'
import { diagnosePlot, plungerReach, readPlot, shaftLimit } from './targetPlot.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

const group: Mark[] = [
  { x: 5, y: 10, bare: false, end: 1 },
  { x: -10, y: -5, bare: false, end: 1 },
  { x: 10, y: -10, bare: false, end: 1 },
  { x: -5, y: 5, bare: false, end: 1 },
]

/** The group above with one bare shaft, shot at 18 m unless said otherwise. */
function plot(x: number, y: number, meters = 18): TargetPlot {
  return {
    distance: meters * 1000,
    faceDiameter: 400,
    marks: [...group, { x, y, bare: true, end: 1 }],
  }
}

describe('readPlot', () => {
  it('needs both kinds of arrow', () => {
    const reading = readPlot({ distance: 18_000, faceDiameter: 400, marks: group }, 'RH')
    expect(reading.enough).toBe(false)
    expect(reading.conclusive).toBe(false)
    expect(reading.fletchedCount).toBe(4)
    expect(reading.bareCount).toBe(0)
  })

  it('reads a bare shaft to the right as weak for a right-handed archer', () => {
    const reading = readPlot(plot(60, 0), 'RH')
    expect(reading.conclusive).toBe(true)
    expect(reading.horizontal).toBe('WEAK')
    expect(reading.bareHorizontal).toBe('RIGHT')
    expect(reading.vertical).toBe('OK')
    expect(reading.bareVertical).toBe('TOGETHER')
    expect(reading.clock).toBe(3)
    expect(reading.offsetLength).toBeCloseTo(60, 6)

    expect(readPlot(plot(60, 0), 'LH').horizontal).toBe('STIFF')
  })

  it('reads a low bare shaft as a nocking point that is too high', () => {
    const reading = readPlot(plot(0, -50), 'RH')
    expect(reading.vertical).toBe('NOCK_HIGH')
    expect(reading.bareVertical).toBe('LOW')
    expect(reading.horizontal).toBe('OK')
    expect(reading.clock).toBe(6)
  })

  it('does not conclude from an offset inside the group', () => {
    const reading = readPlot(plot(6, 2), 'RH')
    expect(reading.enough).toBe(true)
    expect(reading.conclusive).toBe(false)
    expect(reading.bareHorizontal).toBe('TOGETHER')
    expect(reading.bareVertical).toBe('TOGETHER')
  })

  it('asks for a larger offset at a longer distance', () => {
    // 20 mm is beyond what a bare shaft does on its own at 18 m, not at 70 m.
    expect(readPlot(plot(20, 0, 18), 'RH').conclusive).toBe(true)
    expect(readPlot(plot(20, 0, 70), 'RH').conclusive).toBe(false)
  })

  it('adds up the arrows of several ends', () => {
    const twoEnds: TargetPlot = {
      distance: 18_000,
      faceDiameter: 400,
      marks: [
        ...group,
        { x: 40, y: 0, bare: true, end: 1 },
        ...group.map((mark) => ({ ...mark, end: 2 })),
        { x: 80, y: 0, bare: true, end: 2 },
      ],
    }
    const reading = readPlot(twoEnds, 'RH')
    expect(reading.fletchedCount).toBe(8)
    expect(reading.bareCount).toBe(2)
    expect(reading.offset.x).toBeCloseTo(60, 6)
  })
})

describe('limits from the guides', () => {
  it('scale with the shooting distance', () => {
    expect(shaftLimit(18_000)).toBeCloseTo(150, 9)
    expect(plungerReach(30_000)).toBeCloseTo(76, 9)
    expect(plungerReach(18_000)).toBeCloseTo(45.6, 9)
  })
})

describe('diagnosePlot', () => {
  const steps = (setup: TuningSetup, x: number, y: number, meters = 18) =>
    diagnosePlot(readPlot(plot(x, y, meters), setup.bow.handedness), setup, heuristicModel)
  const causes = (setup: TuningSetup, x: number, y: number, meters = 18) =>
    steps(setup, x, y, meters).steps.map((step) => step.cause)

  it('has nothing to say about an offset inside the group', () => {
    expect(steps(reference, 6, 2)).toEqual({ agrees: true, steps: [] })
  })

  it('takes the nocking point first, then the plunger', () => {
    const { steps: found } = steps(reference, 40, -50)
    expect(found[0]).toMatchObject({
      cause: 'nockingPoint',
      parameterKey: 'bow.nockingPointHeight',
      direction: 'decrease',
    })
    expect(found[1]).toMatchObject({
      cause: 'plunger',
      parameterKey: 'bow.plungerStiffness',
      direction: 'increase',
    })
  })

  it('leaves it at the plunger within its reach', () => {
    expect(causes(reference, 40, 0)).toEqual(['plunger'])
  })

  it('goes on to point and draw weight beyond the reach of the plunger', () => {
    const { steps: found } = steps(reference, 90, 0)
    expect(found.map((step) => step.cause)).toEqual(['plunger', 'point', 'drawWeight'])
    // Weak: a lighter point, a lighter draw.
    expect(found[1]).toMatchObject({ parameterKey: 'arrow.pointWeight', direction: 'decrease' })
    expect(found[2]).toMatchObject({ parameterKey: 'bow.drawWeight', direction: 'decrease' })
  })

  it('names the shaft only past 15 cm at 18 m', () => {
    expect(causes(reference, 140, 0)).not.toContain('shaft')
    const { steps: found } = steps(reference, 160, 0)
    expect(found.at(-1)).toMatchObject({
      cause: 'shaft',
      parameterKey: 'arrow.spine',
      // A stiffer shaft has a lower spine number.
      direction: 'decrease',
    })
  })

  it('moves the limits out at a longer distance', () => {
    expect(causes(reference, 160, 0, 30)).not.toContain('shaft')
  })

  it('turns everything around for a stiff reading', () => {
    const { steps: found } = steps(reference, -90, 0)
    expect(found[0]).toMatchObject({ cause: 'plunger', direction: 'decrease' })
    expect(found[1]).toMatchObject({ cause: 'point', direction: 'increase' })
    expect(found[2]).toMatchObject({ cause: 'drawWeight', direction: 'increase' })
  })

  describe('with the setup as entered', () => {
    it('starts with a center shot that was moved the way the target shows', () => {
      // Right-handed, point moved toward the riser: the bare shaft goes right.
      const moved = withDisplay(reference, 'bow.centerShot', 2)
      const { steps: found } = steps(moved, 40, 0)
      expect(found[0]).toMatchObject({
        cause: 'centerShot',
        parameterKey: 'bow.centerShot',
        direction: 'decrease',
      })
      expect(found[1]!.cause).toBe('plunger')
    })

    it('does not blame a center shot that was moved the other way', () => {
      const moved = withDisplay(reference, 'bow.centerShot', -2)
      expect(causes(moved, 40, 0)).not.toContain('centerShot')
    })

    it('skips a plunger that is already at the end of its travel', () => {
      const stiffPlunger = withDisplay(reference, 'bow.plungerStiffness', 1.9)
      expect(causes(stiffPlunger, 40, 0)).toEqual(['point', 'drawWeight'])
    })

    it('says so when the model reads the setup the same way', () => {
      const weak = withDisplay(reference, 'arrow.spine', 900)
      expect(steps(weak, 90, 0).agrees).toBe(true)
    })

    it('points to the archer when the model reads the setup as tuned', () => {
      const diagnosis = steps(reference, 90, 0)
      expect(diagnosis.agrees).toBe(false)
      expect(diagnosis.steps.every((step) => step.cause !== 'shaft')).toBe(true)
    })
  })
})
