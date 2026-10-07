import { describe, expect, it } from 'vitest'
import { NO_PERSONAL, type Personal } from '../../models/calibration.ts'
import type { Observation } from '../../models/observation.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { createObservation } from '../../utils/observations.ts'
import { HEURISTIC_V0 } from '../coefficients/coefficients.ts'
import { createHeuristicModel, heuristicModel } from '../simulation/simulate.ts'
import { MIN_OBSERVATIONS, fitPersonal } from './fit.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

/** Setups an archer might try over a few sessions. */
const SETUPS: TuningSetup[] = [
  reference,
  withDisplay(reference, 'arrow.spine', 800),
  withDisplay(reference, 'arrow.spine', 600),
  withDisplay(reference, 'arrow.pointWeight', 100),
  withDisplay(reference, 'bow.nockingPointHeight', 7),
  withDisplay(reference, 'bow.nockingPointHeight', 2),
  withDisplay(reference, 'bow.plungerStiffness', 1.5),
  withDisplay(reference, 'bow.centerShot', 1.5),
]

/** What an archer for whom the model is off by `truth` would see and note for these setups. */
function seenBy(truth: Personal, setups = SETUPS): Observation[] {
  const real = createHeuristicModel(HEURISTIC_V0, truth)
  return setups.map((setup) => {
    const comparison = real.compareBareShaft(setup)
    return createObservation(setup, {
      stiffness: comparison.fletched.classification.stiffness,
      bareHorizontal: comparison.horizontal,
      bareVertical: comparison.vertical,
    })
  })
}

describe('a model shifted to one archer', () => {
  it('says so in its version, and only then', () => {
    expect(createHeuristicModel(HEURISTIC_V0, NO_PERSONAL).version).toBe(heuristicModel.version)
    const shifted = createHeuristicModel(HEURISTIC_V0, { ...NO_PERSONAL, behaviorShift: 0.1 })
    expect(shifted.version).toBe(`${heuristicModel.version}+personal`)
    expect(shifted.simulate(reference).modelVersion).toBe(shifted.version)
  })

  it('reads the reference setup as stiff, weak, nock low or off center by the shift given', () => {
    const read = (personal: Partial<Personal>) =>
      createHeuristicModel(HEURISTIC_V0, { ...NO_PERSONAL, ...personal }).compareBareShaft(
        reference,
      )

    expect(read({ behaviorShift: 0.1 }).fletched.classification.stiffness).toBe('STIFF')
    expect(read({ behaviorShift: -0.1 }).fletched.classification.stiffness).toBe('WEAK')
    // Neutral lies 3 mm higher for this archer, so 4 mm is now too low: the bare shaft lands high.
    expect(read({ nockingPointNeutral: 3 }).vertical).toBe('HIGH')
    // Neutral lies to the left, so a center shot of 0 is now toward the riser: weak side.
    expect(read({ centerShotNeutral: -2 }).horizontal).toBe('RIGHT')
  })
})

describe('fitPersonal', () => {
  it('needs a few observations that say something it can use', () => {
    expect(fitPersonal([])).toBeNull()
    const few = seenBy(NO_PERSONAL).slice(0, MIN_OBSERVATIONS - 1)
    expect(fitPersonal(few)).toBeNull()
    // Wobble and clearance alone give the fit nothing to hold on to.
    const unusable = SETUPS.map((setup) => createObservation(setup, { oscillation: 'HIGH' }))
    expect(fitPersonal(unusable)).toBeNull()
  })

  it('moves nothing when the base model already agrees with everything', () => {
    const fit = fitPersonal(seenBy(NO_PERSONAL))!
    expect(fit.personal).toEqual(NO_PERSONAL)
    expect(fit.before).toBe(fit.total)
    expect(fit.better).toBe(false)
  })

  it('finds an archer whose arrows shoot weaker than the model expects', () => {
    const truth = { ...NO_PERSONAL, behaviorShift: -0.12 }
    const fit = fitPersonal(seenBy(truth))!
    expect(fit.personal.behaviorShift).toBeLessThan(-0.05)
    expect(fit.personal.behaviorShift).toBeGreaterThan(-0.2)
    expect(Math.abs(fit.personal.nockingPointNeutral)).toBeLessThan(1)
    expect(fit.after).toBeGreaterThan(fit.before)
    expect(fit.better).toBe(true)
  })

  it('finds a nocking point that is neutral higher up for this archer', () => {
    const truth = { ...NO_PERSONAL, nockingPointNeutral: 4 }
    const fit = fitPersonal(seenBy(truth))!
    expect(fit.personal.nockingPointNeutral).toBeGreaterThan(2.5)
    expect(fit.personal.nockingPointNeutral).toBeLessThan(5.5)
    expect(fit.personal.behaviorShift).toBe(0)
    expect(fit.after).toBe(fit.total)
  })

  it('finds several shifts at once and agrees with more of what was seen', () => {
    const truth: Personal = { behaviorShift: 0.1, nockingPointNeutral: -2, centerShotNeutral: 0 }
    const observations = seenBy(truth)
    const fit = fitPersonal(observations)!
    expect(fit.personal.behaviorShift).toBeGreaterThan(0.04)
    expect(fit.personal.nockingPointNeutral).toBeLessThan(-1)
    expect(fit.used).toBe(SETUPS.length)
    expect(fit.total).toBe(SETUPS.length * 3)
    expect(fit.after).toBeGreaterThanOrEqual(fit.total - 2)
    expect(fit.after).toBeGreaterThan(fit.before)
  })

  it('stays within its bounds when the observations are far from the model', () => {
    const fit = fitPersonal(
      seenBy({ behaviorShift: 2, nockingPointNeutral: 40, centerShotNeutral: 0 }),
    )!
    expect(fit.personal.behaviorShift).toBeLessThanOrEqual(0.35)
    expect(fit.personal.nockingPointNeutral).toBeLessThanOrEqual(8)
  })

  it('leaves out observations that say nothing it can use, and counts the rest', () => {
    const observations = [
      ...seenBy({ ...NO_PERSONAL, behaviorShift: -0.12 }),
      createObservation(reference, { clearance: 'LOW' }),
      createObservation(reference, {}),
    ]
    expect(fitPersonal(observations)!.used).toBe(SETUPS.length)
  })
})
