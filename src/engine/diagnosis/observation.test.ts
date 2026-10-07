import { describe, expect, it } from 'vitest'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { createObservation } from '../../utils/observations.ts'
import { heuristicModel } from '../simulation/simulate.ts'
import { compareObservation } from './observation.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

describe('compareObservation', () => {
  it('has no rows for an observation that notes nothing', () => {
    expect(compareObservation(createObservation(reference, {}), heuristicModel)).toEqual({
      rows: [],
      matches: 0,
    })
  })

  it('sets what was seen beside the model, in a fixed order, and counts the matches', () => {
    const observation = createObservation(reference, {
      clearance: 'LOW',
      bareHorizontal: 'RIGHT',
      stiffness: 'NEUTRAL',
    })
    expect(compareObservation(observation, heuristicModel)).toEqual({
      rows: [
        { key: 'stiffness', seen: 'NEUTRAL', model: 'NEUTRAL', match: true },
        { key: 'bareHorizontal', seen: 'RIGHT', model: 'TOGETHER', match: false },
        { key: 'clearance', seen: 'LOW', model: 'LOW', match: true },
      ],
      matches: 2,
    })
  })

  it('runs the model on the values the setup had when it was shot', () => {
    const weak = withDisplay(reference, 'arrow.spine', 900)
    const observation = createObservation(weak, { stiffness: 'WEAK', bareHorizontal: 'RIGHT' })
    // The setup has since been changed; the observation keeps its own copy.
    const { rows, matches } = compareObservation(observation, heuristicModel)
    expect(rows.map((row) => row.model)).toEqual(['WEAK', 'RIGHT'])
    expect(matches).toBe(2)
  })

  it('covers every kind of thing that can be noted', () => {
    const observation = createObservation(reference, {
      stiffness: 'STIFF',
      bareHorizontal: 'LEFT',
      bareVertical: 'LOW',
      lateral: 'LEFT',
      oscillation: 'HIGH',
      clearance: 'HIGH',
    })
    const { rows, matches } = compareObservation(observation, heuristicModel)
    expect(rows.map((row) => row.key)).toEqual([
      'stiffness',
      'bareHorizontal',
      'bareVertical',
      'lateral',
      'oscillation',
      'clearance',
    ])
    expect(matches).toBe(0)
  })
})
