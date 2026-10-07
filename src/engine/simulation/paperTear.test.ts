import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { readPaperTear } from './paperTear.ts'
import { heuristicModel } from './simulate.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

function tearOf(setup: TuningSetup) {
  return readPaperTear(heuristicModel.compareBareShaft(setup), setup.bow.handedness)
}

const leftHanded = (setup: TuningSetup): TuningSetup => ({
  ...setup,
  bow: { ...setup.bow, handedness: 'LH' },
})

// Directions as drawn in the Easton guide, page 7 (readme/tuning-references.md §9.1).
describe('paper tear', () => {
  it('is a clean hole for the reference setup', () => {
    expect(tearOf(reference)).toEqual({
      horizontal: 'CLEAN',
      vertical: 'CLEAN',
      tail: { lateral: 0, vertical: 0 },
      clearanceSuspect: false,
    })
  })

  it('tears to the right for a stiff arrow, right-handed', () => {
    const tear = tearOf(withDisplay(reference, 'arrow.spine', 500))
    expect(tear.horizontal).toBe('RIGHT')
    expect(tear.tail.lateral).toBeGreaterThan(0)
    expect(tear.vertical).toBe('CLEAN')
  })

  it('tears to the left for a weak arrow, right-handed', () => {
    const tear = tearOf(withDisplay(reference, 'arrow.spine', 900))
    expect(tear.horizontal).toBe('LEFT')
    expect(tear.tail.lateral).toBeLessThan(0)
  })

  it('mirrors left and right for a left-handed archer', () => {
    expect(tearOf(leftHanded(withDisplay(reference, 'arrow.spine', 500))).horizontal).toBe('LEFT')
    expect(tearOf(leftHanded(withDisplay(reference, 'arrow.spine', 900))).horizontal).toBe('RIGHT')
  })

  it('tears high for a high nocking point and low for a low one', () => {
    const high = tearOf(withDisplay(reference, 'bow.nockingPointHeight', 8))
    expect(high.vertical).toBe('HIGH')
    expect(high.tail.vertical).toBeGreaterThan(0)

    const low = tearOf(withDisplay(reference, 'bow.nockingPointHeight', 0))
    expect(low.vertical).toBe('LOW')
    expect(low.tail.vertical).toBeLessThan(0)
  })

  it('tears longer the further off the setup is', () => {
    const little = tearOf(withDisplay(reference, 'arrow.spine', 800))
    const much = tearOf(withDisplay(reference, 'arrow.spine', 1000))
    expect(Math.abs(much.tail.lateral)).toBeGreaterThan(Math.abs(little.tail.lateral))
  })

  describe('clearance', () => {
    // A very stiff shaft is badly timed past the riser; the high nock adds to it.
    const contact = withDisplay(
      withDisplay(reference, 'arrow.spine', 400),
      'bow.nockingPointHeight',
      9,
    )

    it('is suspected behind a high tear when the tail is likely to touch the bow', () => {
      expect(heuristicModel.analyze(contact).classification.clearance).toBe('HIGH')
      const tear = tearOf(contact)
      expect(tear.vertical).toBe('HIGH')
      expect(tear.clearanceSuspect).toBe(true)
    })

    it('is suspected behind a tear to the weak side', () => {
      const weakAndTight: TuningSetup = withDisplay(reference, 'arrow.spine', 1000)
      const risky = {
        ...weakAndTight,
        bow: {
          ...weakAndTight.bow,
          string: { ...weakAndTight.bow.string, nockFit: 'TIGHT' as const },
        },
      }
      expect(heuristicModel.analyze(risky).classification.clearance).not.toBe('LOW')
      expect(tearOf(risky).horizontal).toBe('LEFT')
      expect(tearOf(risky).clearanceSuspect).toBe(true)
    })

    it('is not suspected behind a tear that clearance does not make', () => {
      // Stiff side only, nock on the reference height.
      const stiff = withDisplay(reference, 'arrow.spine', 400)
      expect(heuristicModel.analyze(stiff).classification.clearance).not.toBe('LOW')
      expect(tearOf(stiff).clearanceSuspect).toBe(false)
    })

    it('is not suspected while clearance is good', () => {
      const nockHigh = withDisplay(reference, 'bow.nockingPointHeight', 5.5)
      expect(heuristicModel.analyze(nockHigh).classification.clearance).toBe('LOW')
      expect(tearOf(nockHigh).clearanceSuspect).toBe(false)
    })
  })

  it('always agrees with the bare shaft test', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const comparison = heuristicModel.compareBareShaft(setup)
        const tear = readPaperTear(comparison, setup.bow.handedness)
        // The tail tears to the side the bare shaft does not land on.
        expect(tear.horizontal).toBe(
          { LEFT: 'RIGHT', TOGETHER: 'CLEAN', RIGHT: 'LEFT' }[comparison.horizontal],
        )
        expect(tear.vertical).toBe(
          { LOW: 'HIGH', TOGETHER: 'CLEAN', HIGH: 'LOW' }[comparison.vertical],
        )
        expect(Math.abs(tear.tail.lateral)).toBeLessThanOrEqual(1)
        expect(Math.abs(tear.tail.vertical)).toBeLessThanOrEqual(1)
      }),
    )
  })
})
