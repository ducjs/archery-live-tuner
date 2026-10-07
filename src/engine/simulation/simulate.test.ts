import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { getParameter, getValue, setValue, type NumberParameter } from '../../models/parameters.ts'
import { numberValueArbitrary, setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { convert } from '../../utils/units.ts'
import { HEURISTIC_V0 } from '../coefficients/coefficients.ts'
import { MIN_GRAINS_PER_POUND } from './derivedMetrics.ts'
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
      vertical: 'NEUTRAL',
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

  it('a high nocking point reads as nock high and tips the arrow nose-down', () => {
    const high = heuristicModel.analyze(withDisplay(reference, 'bow.nockingPointHeight', 10))
    expect(high.classification.vertical).toBe('NOCK_HIGH')
    expect(high.metrics.pitch).toBeLessThan(0)

    const low = heuristicModel.analyze(withDisplay(reference, 'bow.nockingPointHeight', -2))
    expect(low.classification.vertical).toBe('NOCK_LOW')
    expect(low.metrics.pitch).toBeGreaterThan(0)
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
    ['bow.braceHeight', 'weaker'],
    ['bow.plungerStiffness', 'stiffer'],
    ['bow.string.stringMass', 'stiffer'],
    ['bow.string.strandCount', 'stiffer'],
    ['arrow.nockWeight', 'stiffer'],
    ['arrow.fletchingWeight', 'stiffer'],
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
        // Everything that has a left and a right is mirrored with the archer.
        const mirrored = ['bow.centerShot', 'bow.limbAlignmentTop', 'bow.limbAlignmentBottom']
          .map(numberParameter)
          .reduce(
            (flipped, parameter) => setValue(flipped, parameter, -getValue(setup, parameter)),
            setValue(setup, getParameter('bow.handedness'), 'LH'),
          )
        const rh = heuristicModel.simulate(rightHanded)
        const lh = heuristicModel.simulate(mirrored)

        expect(lh.metrics.lateralDeviation).toBeCloseTo(-rh.metrics.lateralDeviation, 12)
        expect(lh.metrics.yaw).toBeCloseTo(-rh.metrics.yaw, 12)
        expect(lh.metrics.effectiveCenterShot).toBeCloseTo(-rh.metrics.effectiveCenterShot, 12)
        const sided = { lateralDeviation: 0, yaw: 0, effectiveCenterShot: 0 }
        expect({ ...lh.metrics, ...sided }).toEqual({ ...rh.metrics, ...sided })

        const last = rh.trajectory.length - 1
        expect(lh.trajectory.length).toBe(rh.trajectory.length)
        expect(lh.trajectory[last]!.z).toBeCloseTo(-rh.trajectory[last]!.z!, 9)
        expect(lh.trajectory[0]!.flex).toBeCloseTo(-rh.trajectory[0]!.flex!, 12)
        expect(lh.trajectory[last]!.y).toBeCloseTo(rh.trajectory[last]!.y, 9)
      }),
    )
  })
})

describe('bare shaft test', () => {
  const weak = withDisplay(reference, 'arrow.spine', 900)

  it('lands together with the fletched arrows for the reference setup', () => {
    const comparison = heuristicModel.compareBareShaft(reference)
    expect(comparison.horizontal).toBe('TOGETHER')
    expect(comparison.vertical).toBe('TOGETHER')
  })

  it('lands right of the fletched arrows when a right-handed setup is weak', () => {
    const comparison = heuristicModel.compareBareShaft(weak)
    expect(comparison.horizontal).toBe('RIGHT')
    expect(comparison.offset.lateral).toBeGreaterThan(0)
    // Both go the same way; the bare shaft goes further.
    expect(comparison.fletched.metrics.lateralDeviation).toBeGreaterThan(0)
    expect(comparison.bare.metrics.lateralDeviation).toBeGreaterThan(
      comparison.fletched.metrics.lateralDeviation,
    )
  })

  it('lands left when the setup is stiff, and mirrors for a left-handed archer', () => {
    const stiff = withDisplay(reference, 'arrow.spine', 500)
    expect(heuristicModel.compareBareShaft(stiff).horizontal).toBe('LEFT')

    const leftHandedWeak = setValue(weak, getParameter('bow.handedness'), 'LH')
    expect(heuristicModel.compareBareShaft(leftHandedWeak).horizontal).toBe('LEFT')
  })

  it('lands low when the nocking point is too high', () => {
    const nockHigh = withDisplay(reference, 'bow.nockingPointHeight', 10)
    expect(heuristicModel.compareBareShaft(nockHigh).vertical).toBe('LOW')
    const nockLow = withDisplay(reference, 'bow.nockingPointHeight', -2)
    expect(heuristicModel.compareBareShaft(nockLow).vertical).toBe('HIGH')
  })

  it('keeps the mass, so only steering and damping differ', () => {
    const { fletched, bare } = heuristicModel.compareBareShaft(weak)
    expect(bare.metrics.launchSpeed).toBe(fletched.metrics.launchSpeed)
    expect(bare.metrics.dynamicBehavior).toBe(fletched.metrics.dynamicBehavior)
    expect(bare.metrics.oscillationDecay).toBeLessThan(fletched.metrics.oscillationDecay)
    expect(bare.metrics.stabilityTime).toBeGreaterThan(fletched.metrics.stabilityTime)
  })

  it('never lands on the other side of the fletched arrows from the line', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const { fletched, bare } = heuristicModel.compareBareShaft(setup)
        const f = fletched.metrics.lateralDeviation
        const b = bare.metrics.lateralDeviation
        expect(Math.abs(b)).toBeGreaterThanOrEqual(Math.abs(f))
        expect(Math.sign(b) * Math.sign(f)).toBeGreaterThanOrEqual(0)
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

  it('starts straight, bends toward the riser first, and the flex dies out', () => {
    expect(trajectory[0]!.flex).toBeCloseTo(0, 12)
    expect(trajectory[3]!.flex).toBeGreaterThan(metrics.flexAmplitude * 0.5)
    const lateFlex = trajectory.slice(-20).map((point) => Math.abs(point.flex!))
    expect(Math.max(...lateFlex)).toBeLessThan(metrics.flexAmplitude * 0.1)
  })

  it('describes the shot before the arrow leaves the string', () => {
    const { launch } = heuristicModel.simulate(reference)
    expect(launch.powerStroke).toBeCloseTo(reference.bow.drawLength - reference.bow.braceHeight, 9)
    // A recurve arrow is on the string for somewhere between 10 and 25 ms.
    expect(launch.timeOnString).toBeGreaterThan(0.01)
    expect(launch.timeOnString).toBeLessThan(0.025)
    expect(launch.nockAngle).toBeGreaterThan(0)
  })

  it('drifts to the side the lateral tendency points to', () => {
    expect(metrics.lateralDeviation).toBeGreaterThan(0)
    expect(trajectory[trajectory.length - 1]!.z).toBeGreaterThan(0)
  })

  it('honours distance and time step options', () => {
    const far = heuristicModel.simulate(reference, {
      trajectory: { distance: 70_000, timeStep: 0.005 },
    })
    expect(far.trajectory[far.trajectory.length - 1]!.x).toBeCloseTo(70_000, 6)
    expect(far.trajectory.length).toBeLessThan(500)
  })
})

describe('derived metrics', () => {
  const { metrics } = heuristicModel.analyze(reference)

  it('gives grains per pound, front of center and energy for the reference setup', () => {
    expect(metrics.grainsPerPound).toBeCloseTo(308 / 38, 6)
    // 162 gr shaft at the middle, 132 gr at the front, 9 gr at the back, 5 gr near the back.
    expect(metrics.frontOfCenter).toBeCloseTo(((132 - 9 - 5 * 0.84) / 2 / 308) * 100, 6)
    expect(metrics.kineticEnergy).toBeGreaterThan(25)
    expect(metrics.kineticEnergy).toBeLessThan(45)
  })

  it('finds the reference arrow heavy enough for its bow', () => {
    expect(metrics.grainsPerPound).toBeGreaterThan(MIN_GRAINS_PER_POUND)
  })

  it('moves the balance forward with a heavier point', () => {
    const heavy = withDisplay(reference, 'arrow.pointWeight', 150)
    expect(heuristicModel.analyze(heavy).metrics.frontOfCenter).toBeGreaterThan(
      metrics.frontOfCenter,
    )
  })

  // The AMO chart for recurve bows, as printed in the Easton guide (tuning-references.md §9.2).
  describe('AMO minimum arrow weight', () => {
    const minimumGrains = (drawWeight: number, drawLength: number) =>
      convert(
        heuristicModel.analyze(
          withDisplay(
            withDisplay(reference, 'bow.drawWeight', drawWeight),
            'bow.drawLength',
            drawLength,
          ),
        ).metrics.minimumArrowMass,
        'g',
        'gr',
      )

    it.each([
      [30, 28, 150],
      [38, 28, 150],
      [41, 33, 165],
      [44, 30, 163],
      [50, 28, 167],
      [58, 33, 305],
      [62, 28, 240],
      [70, 28, 312],
    ])('reads %i lb at %i in as %i gr', (drawWeight, drawLength, grains) => {
      expect(minimumGrains(drawWeight, drawLength)).toBeCloseTo(grains, 6)
    })

    it('goes between the columns for a draw length between two inches', () => {
      expect(minimumGrains(50, 28.5)).toBeCloseTo((167 + 185) / 2, 6)
    })

    it('takes the band above for a draw weight between two bands', () => {
      expect(minimumGrains(41.5, 33)).toBeCloseTo(211, 6)
    })

    it('stays on the chart outside its draw lengths', () => {
      expect(minimumGrains(58, 22)).toBeCloseTo(150, 6)
      expect(minimumGrains(58, 35)).toBeCloseTo(305, 6)
    })

    it('finds the reference arrow well above it', () => {
      expect(metrics.arrowMass).toBeCloseTo(convert(308, 'gr', 'g'), 6)
      expect(metrics.arrowMass).toBeGreaterThan(metrics.minimumArrowMass)
    })

    it('never asks for less at a heavier draw weight or a longer draw', () => {
      for (let drawLength = 25; drawLength <= 33; drawLength++) {
        for (let drawWeight = 20; drawWeight < 80; drawWeight++) {
          const here = minimumGrains(drawWeight, drawLength)
          expect(minimumGrains(drawWeight + 1, drawLength)).toBeGreaterThanOrEqual(here)
          if (drawLength < 33) {
            expect(minimumGrains(drawWeight, drawLength + 1)).toBeGreaterThanOrEqual(here)
          }
        }
      }
    })
  })

  it('counts fewer grains per pound on a heavier bow', () => {
    const heavyBow = withDisplay(reference, 'bow.drawWeight', 48)
    expect(heuristicModel.analyze(heavyBow).metrics.grainsPerPound).toBeCloseTo(308 / 48, 6)
  })
})

describe('clearance as timing (§34.2)', () => {
  const { clearance } = HEURISTIC_V0
  const analyze = (setup: TuningSetup) => heuristicModel.analyze(setup).metrics
  const neutral = analyze(reference)

  it('takes the timing of the reference setup as the good one', () => {
    expect(neutral.clearanceCycles).toBeCloseTo(clearance.neutralCycles, 9)
    expect(neutral.clearanceRisk).toBeCloseTo(clearance.base, 9)
  })

  it('counts more bending cycles for a stiffer shaft and fewer for a weaker one', () => {
    expect(analyze(withDisplay(reference, 'arrow.spine', 500)).clearanceCycles).toBeGreaterThan(
      neutral.clearanceCycles,
    )
    expect(analyze(withDisplay(reference, 'arrow.spine', 900)).clearanceCycles).toBeLessThan(
      neutral.clearanceCycles,
    )
  })

  it('counts fewer cycles on a faster bow, which leaves the shaft less time', () => {
    expect(analyze(withDisplay(reference, 'bow.drawWeight', 48)).clearanceCycles).toBeLessThan(
      neutral.clearanceCycles,
    )
  })

  it('raises the risk when the timing is off in either direction', () => {
    for (const spine of [500, 900]) {
      expect(analyze(withDisplay(reference, 'arrow.spine', spine)).clearanceRisk).toBeGreaterThan(
        neutral.clearanceRisk,
      )
    }
  })

  it('raises the risk for timing alone, with weak and stiff unchanged', () => {
    // Shaft weight changes how fast the shaft bends and flies, not how it matches the bow.
    const heavyShaft = setValue(
      reference,
      numberParameter('arrow.shaftGpi'),
      reference.arrow.shaftGpi * 1.4,
    )
    const metrics = analyze(heavyShaft)
    expect(metrics.dynamicBehavior).toBeCloseTo(neutral.dynamicBehavior, 9)
    expect(metrics.clearanceCycles).not.toBeCloseTo(neutral.clearanceCycles, 2)
    expect(metrics.clearanceRisk).toBeGreaterThan(neutral.clearanceRisk)
  })

  it('counts a finite, positive number of cycles for any valid setup', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const metrics = analyze(setup)
        expect(metrics.clearanceCycles).toBeGreaterThan(0)
        expect(Number.isFinite(metrics.clearanceCycles)).toBe(true)
      }),
    )
  })
})

describe('bow size', () => {
  const analyze = (setup: TuningSetup) => heuristicModel.analyze(setup).metrics
  const sized = (riser: string, limbs: string) =>
    setValue(
      setValue(reference, getParameter('bow.riserSize'), riser),
      getParameter('bow.limbSize'),
      limbs,
    )

  it('adds the riser to what the limbs make on a 25 in riser', () => {
    expect(analyze(reference).bowLength).toBe(68)
    expect(analyze(sized('H23', '68')).bowLength).toBe(66)
    expect(analyze(sized('H27', '70')).bowLength).toBe(72)
    expect(analyze(sized('H23', '66')).bowLength).toBe(64)
  })

  it('gives the brace height range Easton lists for each length', () => {
    // 64 in: 19.7 to 22.9 cm. 68 in: 21.0 to 24.1 cm. 70 in: 21.6 to 24.8 cm.
    const range = (riser: string, limbs: string) => {
      const metrics = analyze(sized(riser, limbs))
      return [metrics.braceHeightMin / 10, metrics.braceHeightMax / 10]
    }
    expect(range('H25', '68')[0]).toBeCloseTo(21.0, 1)
    expect(range('H25', '68')[1]).toBeCloseTo(24.1, 1)
    expect(range('H23', '66')[0]).toBeCloseTo(19.7, 1)
    expect(range('H23', '66')[1]).toBeCloseTo(22.9, 1)
    expect(range('H25', '70')[0]).toBeCloseTo(21.6, 1)
    expect(range('H25', '70')[1]).toBeCloseTo(24.8, 1)
  })

  it('leaves weak and stiff alone', () => {
    expect(analyze(sized('H27', '70')).dynamicBehavior).toBeCloseTo(0, 9)
  })

  it('counts the same brace height as lower on a longer bow', () => {
    const low = withDisplay(reference, 'bow.braceHeight', 21)
    const onLong = setValue(low, getParameter('bow.limbSize'), '70')
    expect(analyze(onLong).clearanceRisk).toBeGreaterThan(analyze(low).clearanceRisk)
  })
})

describe('limb alignment', () => {
  const analyze = (setup: TuningSetup) => heuristicModel.analyze(setup).metrics
  const aligned = (top: number, bottom: number, from: TuningSetup = reference) =>
    setValue(
      setValue(from, numberParameter('bow.limbAlignmentTop'), top),
      numberParameter('bow.limbAlignmentBottom'),
      bottom,
    )
  const neutral = analyze(reference)

  it('changes nothing when the limbs are in line', () => {
    expect(analyze(aligned(0, 0))).toEqual(neutral)
    expect(neutral.effectiveCenterShot).toBe(0)
  })

  it('turns both limbs to one side into a center shot error the other way', () => {
    // The string goes right with the limbs; the rest stays, so the point ends up left.
    const metrics = analyze(aligned(1, 1))
    const leverage = reference.arrow.length / reference.bow.braceHeight
    expect(metrics.effectiveCenterShot).toBeCloseTo(-leverage, 9)
    expect(leverage).toBeGreaterThan(3)
  })

  it('reads the same as entering that center shot by hand', () => {
    const byLimbs = analyze(aligned(1, 1))
    const byHand = analyze(
      setValue(reference, numberParameter('bow.centerShot'), byLimbs.effectiveCenterShot),
    )
    expect(byLimbs.lateralDeviation).toBeCloseTo(byHand.lateralDeviation, 12)
    expect(byLimbs.oscillation).toBeCloseTo(byHand.oscillation, 12)
  })

  it('can be taken out again with the center shot', () => {
    const leverage = reference.arrow.length / reference.bow.braceHeight
    const corrected = setValue(aligned(1, 1), numberParameter('bow.centerShot'), leverage)
    expect(analyze(corrected).lateralDeviation).toBeCloseTo(0, 9)
  })

  it('adds wobble and clearance risk when the limbs point apart, without a side', () => {
    const twisted = analyze(aligned(2, -2))
    expect(twisted.effectiveCenterShot).toBe(0)
    expect(twisted.lateralDeviation).toBeCloseTo(0, 9)
    expect(twisted.oscillation).toBeGreaterThan(neutral.oscillation)
    expect(twisted.clearanceRisk).toBeGreaterThan(neutral.clearanceRisk)
    expect(analyze(aligned(-2, 2))).toEqual(twisted)
  })
})

describe('draw force curve (§39)', () => {
  const reference = createDefaultSetup()
  const withValue = (key: string, value: number | string) =>
    setValue(reference, getParameter(key), value)
  const metrics = (setup: TuningSetup) => heuristicModel.analyze(setup).metrics

  it('reports the curve of the reference setup', () => {
    const m = metrics(reference)
    expect(m.curveFullness).toBe(0.42)
    expect(m.curveEndRise).toBeCloseTo(0.39, 9)
    expect(m.curveMeasuredPoints).toBe(0)
    // 38 lb over a 19.3 in power stroke, times 1.14: about 47 J.
    expect(m.storedEnergy).toBeGreaterThan(44)
    expect(m.storedEnergy).toBeLessThan(50)
    expect(m.storedEnergy).toBeGreaterThan(m.kineticEnergy)
  })

  it('shoots faster with a fuller curve, and leaves weak and stiff alone', () => {
    const straight = metrics(withValue('bow.drawCurve', 'STRAIGHT'))
    const standard = metrics(reference)
    const full = metrics(withValue('bow.drawCurve', 'FULL'))
    expect(straight.launchSpeed).toBeLessThan(standard.launchSpeed)
    expect(standard.launchSpeed).toBeLessThan(full.launchSpeed)
    expect(straight.dynamicBehavior).toBe(standard.dynamicBehavior)
    expect(full.dynamicBehavior).toBe(standard.dynamicBehavior)
  })

  it('gains more at the clicker on shorter limbs, at the same speed', () => {
    const short = metrics(withValue('bow.limbSize', '66'))
    const long = metrics(withValue('bow.limbSize', '70'))
    expect(short.clickerGain).toBeGreaterThan(long.clickerGain)
    expect(short.launchSpeed).toBe(long.launchSpeed)
  })

  it('reports finite curve numbers for any valid setup', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const m = metrics(setup)
        expect(Number.isFinite(m.storedEnergy)).toBe(true)
        expect(m.clickerGain).toBeGreaterThan(0)
        expect(Number.isFinite(m.curveFullness)).toBe(true)
        expect(Number.isFinite(m.curveEndRise)).toBe(true)
      }),
    )
  })
})

// Figures from the literature, with wide margins. The model is not fitted to
// them: they are here so that a later change of coefficients cannot walk it out
// of the plausible range unnoticed. Sources in readme/tuning-references.md §10.3.
describe('against published figures', () => {
  const efficiency = (setup: TuningSetup) => {
    const m = heuristicModel.analyze(setup).metrics
    return m.kineticEnergy / m.storedEnergy
  }

  it('lets the shaft bend about one and a quarter times before it leaves the string', () => {
    // Pratt's criterion, as reviewed by Kooi (1998): 1.25 cycles.
    const { metrics, launch } = heuristicModel.simulate(reference)
    const cyclesOnString = metrics.oscillationFrequency * launch.timeOnString
    expect(cyclesOnString).toBeGreaterThan(1)
    expect(cyclesOnString).toBeLessThan(1.5)
  })

  it('gives the arrow about three quarters of the stored energy', () => {
    // Pękalski takes 75 %; Kooi computes 69 to 98 % over arrows of usual mass.
    expect(efficiency(reference)).toBeGreaterThan(0.6)
    expect(efficiency(reference)).toBeLessThan(0.9)
  })

  it('shoots a lighter arrow faster and less efficiently (Kooi, table 3.10)', () => {
    const light = withDisplay(reference, 'arrow.shaftGpi', 5)
    const heavy = withDisplay(reference, 'arrow.shaftGpi', 9)
    expect(metricsOf(light).launchSpeed).toBeGreaterThan(metricsOf(heavy).launchSpeed)
    expect(efficiency(light)).toBeLessThan(efficiency(heavy))
  })

  it('loses a little speed with every rise in brace height (Kooi, table 3.5)', () => {
    const speeds = [21, 22, 23, 24].map(
      (brace) => metricsOf(withDisplay(reference, 'bow.braceHeight', brace)).launchSpeed,
    )
    for (let i = 1; i < speeds.length; i++) {
      expect(speeds[i]).toBeLessThan(speeds[i - 1]!)
      // A small loss: under 3 % per centimeter.
      expect(speeds[i]! / speeds[i - 1]!).toBeGreaterThan(0.97)
    }
  })

  function metricsOf(setup: TuningSetup) {
    return heuristicModel.analyze(setup).metrics
  }
})
