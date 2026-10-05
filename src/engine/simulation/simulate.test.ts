import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { getParameter, setValue, type NumberParameter } from '../../models/parameters.ts'
import { numberValueArbitrary, setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { convert } from '../../utils/units.ts'
import { heuristicModel } from './simulate.ts'

const reference = createDefaultSetup('Reference')

function numberParameter(key: string): NumberParameter {
  return getParameter(key) as NumberParameter
}

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = numberParameter(key)
  const value =
    parameter.unit && parameter.displayUnit
      ? convert(displayValue, parameter.displayUnit, parameter.unit)
      : displayValue
  return setValue(setup, parameter, value)
}

function behavior(setup: TuningSetup): number {
  return heuristicModel.analyze(setup).metrics.dynamicBehavior
}

describe('reference setup', () => {
  const result = heuristicModel.simulate(reference)

  it('is neutral with no lateral deviation (Test 5)', () => {
    expect(result.metrics.dynamicBehavior).toBeCloseTo(0, 9)
    expect(result.metrics.lateralDeviation).toBeCloseTo(0, 9)
    expect(result.classification).toEqual({
      stiffness: 'NEUTRAL',
      oscillation: 'LOW',
      lateral: 'NEUTRAL',
      clearance: 'LOW',
    })
  })

  it('reports plausible speed and bending frequency', () => {
    const metersPerSecond = result.metrics.launchSpeed / 1000
    expect(metersPerSecond).toBeGreaterThan(50)
    expect(metersPerSecond).toBeLessThan(65)
    expect(result.metrics.oscillationFrequency).toBeGreaterThan(50)
    expect(result.metrics.oscillationFrequency).toBeLessThan(100)
  })

  it('stamps the setup id and model version', () => {
    expect(result.setupId).toBe(reference.id)
    expect(result.modelVersion).toBe(heuristicModel.version)
  })
})

describe('tendencies at the reference setup', () => {
  it('heavier point shifts toward WEAK (Test 1)', () => {
    const light = withDisplay(reference, 'arrow.pointWeight', 100)
    const heavy = withDisplay(reference, 'arrow.pointWeight', 120)
    expect(behavior(heavy)).toBeLessThan(behavior(light))
  })

  it('higher draw weight shifts toward WEAK (Test 2)', () => {
    const higher = withDisplay(reference, 'bow.drawWeight', 42)
    expect(behavior(higher)).toBeLessThan(behavior(reference))
  })

  it('stiffer shaft shifts toward STIFF (Test 3)', () => {
    const stiffer = withDisplay(reference, 'arrow.spine', 600)
    const weaker = withDisplay(reference, 'arrow.spine', 800)
    expect(behavior(stiffer)).toBeGreaterThan(behavior(reference))
    expect(heuristicModel.analyze(stiffer).classification.stiffness).toBe('STIFF')
    expect(heuristicModel.analyze(weaker).classification.stiffness).toBe('WEAK')
  })

  it('plunger stiffness and preload change the result (Test 4)', () => {
    const stiffPlunger = withDisplay(reference, 'bow.plungerStiffness', 1.8)
    expect(behavior(stiffPlunger)).toBeGreaterThan(behavior(reference))

    const morePreload = withDisplay(reference, 'bow.plungerPreload', 3)
    // Right-handed: more preload pushes the arrow away from the riser, to the left.
    expect(heuristicModel.analyze(morePreload).metrics.lateralDeviation).toBeLessThan(0)
  })

  it('a weak arrow goes right for a right-handed archer', () => {
    const weak = withDisplay(reference, 'arrow.spine', 900)
    expect(heuristicModel.analyze(weak).classification.lateral).toBe('RIGHT')
    const stiff = withDisplay(reference, 'arrow.spine', 500)
    expect(heuristicModel.analyze(stiff).classification.lateral).toBe('LEFT')
  })

  it('a longer arrow bends at a lower frequency', () => {
    const longer = withDisplay(reference, 'arrow.length', 30)
    expect(heuristicModel.analyze(longer).metrics.oscillationFrequency).toBeLessThan(
      heuristicModel.analyze(reference).metrics.oscillationFrequency,
    )
  })

  it('more fletching settles the arrow sooner', () => {
    const weak = withDisplay(reference, 'arrow.spine', 900)
    const bare = withDisplay(weak, 'arrow.fletchingWeight', 0)
    expect(heuristicModel.analyze(weak).metrics.stabilityTime).toBeLessThan(
      heuristicModel.analyze(bare).metrics.stabilityTime,
    )
  })
})

describe('properties over all valid setups', () => {
  it('produces finite metrics inside their ranges', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const { metrics } = heuristicModel.analyze(setup)
        for (const [name, value] of Object.entries(metrics)) {
          expect(Number.isFinite(value), name).toBe(true)
        }
        expect(Math.abs(metrics.dynamicBehavior)).toBeLessThanOrEqual(1)
        expect(Math.abs(metrics.lateralDeviation)).toBeLessThanOrEqual(1)
        for (const value of [metrics.flexAmplitude, metrics.oscillation, metrics.clearanceRisk]) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        }
        expect(metrics.launchSpeed).toBeGreaterThan(0)
        expect(metrics.oscillationFrequency).toBeGreaterThan(0)
        expect(metrics.stabilityTime).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  // Test 7: tendencies hold everywhere, not only at the reference setup.
  const monotonic: [key: string, direction: 'weaker' | 'stiffer'][] = [
    ['arrow.pointWeight', 'weaker'],
    ['bow.drawWeight', 'weaker'],
    ['bow.drawLength', 'weaker'],
    ['arrow.length', 'weaker'],
    ['arrow.spine', 'weaker'],
    ['bow.braceHeight', 'stiffer'],
    ['bow.plungerStiffness', 'stiffer'],
  ]

  it.each(monotonic)('increasing %s never shifts the other way (%s)', (key, direction) => {
    const parameter = numberParameter(key)
    const value = numberValueArbitrary(parameter)
    fc.assert(
      fc.property(setupArbitrary, value, value, (setup, a, b) => {
        const low = behavior(setValue(setup, parameter, Math.min(a, b)))
        const high = behavior(setValue(setup, parameter, Math.max(a, b)))
        if (direction === 'weaker') {
          expect(high).toBeLessThanOrEqual(low)
        } else {
          expect(high).toBeGreaterThanOrEqual(low)
        }
      }),
    )
  })

  it('mirrors left-handed setups (Test 6)', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const rightHanded = setValue(setup, getParameter('bow.handedness'), 'RH')
        const mirrored = setValue(
          setValue(setup, getParameter('bow.handedness'), 'LH'),
          getParameter('bow.centerShot'),
          -setup.bow.centerShot,
        )
        const rh = heuristicModel.simulate(rightHanded)
        const lh = heuristicModel.simulate(mirrored)

        expect(lh.metrics.lateralDeviation).toBeCloseTo(-rh.metrics.lateralDeviation, 12)
        expect(lh.metrics.yaw).toBeCloseTo(-rh.metrics.yaw, 12)
        expect({ ...lh.metrics, lateralDeviation: 0, yaw: 0 }).toEqual({
          ...rh.metrics,
          lateralDeviation: 0,
          yaw: 0,
        })

        const last = rh.trajectory.length - 1
        expect(lh.trajectory.length).toBe(rh.trajectory.length)
        expect(lh.trajectory[last]!.z).toBeCloseTo(-rh.trajectory[last]!.z!, 9)
        expect(lh.trajectory[0]!.flex).toBeCloseTo(-rh.trajectory[0]!.flex!, 12)
        expect(lh.trajectory[last]!.y).toBeCloseTo(rh.trajectory[last]!.y, 9)
      }),
    )
  })
})

describe('trajectory', () => {
  const weak = withDisplay(reference, 'arrow.spine', 900)
  const { trajectory, metrics } = heuristicModel.simulate(weak)

  it('runs from the bow to the target with increasing time', () => {
    const first = trajectory[0]!
    const last = trajectory[trajectory.length - 1]!
    expect(first).toMatchObject({ t: 0, x: 0, y: 0, z: 0 })
    expect(last.x).toBeCloseTo(18_000, 6)
    for (let index = 1; index < trajectory.length; index++) {
      expect(trajectory[index]!.t).toBeGreaterThan(trajectory[index - 1]!.t)
    }
  })

  it('is aimed at the target center when there is no vertical tendency', () => {
    expect(trajectory[trajectory.length - 1]!.y).toBeCloseTo(0, 6)
  })

  it('starts flexed toward the riser and the flex dies out', () => {
    expect(trajectory[0]!.flex).toBeCloseTo(metrics.flexAmplitude, 12)
    const lateFlex = trajectory.slice(-20).map((point) => Math.abs(point.flex!))
    expect(Math.max(...lateFlex)).toBeLessThan(metrics.flexAmplitude * 0.1)
  })

  it('drifts to the side the lateral tendency points to', () => {
    expect(metrics.lateralDeviation).toBeGreaterThan(0)
    expect(trajectory[trajectory.length - 1]!.z).toBeGreaterThan(0)
  })

  it('honours distance and time step options', () => {
    const far = heuristicModel.simulate(reference, { distance: 70_000, timeStep: 0.005 })
    expect(far.trajectory[far.trajectory.length - 1]!.x).toBeCloseTo(70_000, 6)
    expect(far.trajectory.length).toBeLessThan(500)
  })
})
