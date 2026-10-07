// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { TargetPlot } from '../models/observation.ts'
import { createDefaultSetup } from '../models/setup.ts'
import {
  createObservation,
  exportObservations,
  observedSetup,
  parseObservation,
} from '../utils/observations.ts'
import { OBSERVATIONS_KEY, createLocalObservationRepository } from './observationRepository.ts'

beforeEach(() => localStorage.clear())

const setup = createDefaultSetup('Indoor')
const plot: TargetPlot = {
  distance: 18_000,
  faceDiameter: 400,
  marks: [
    { x: 0, y: 0, bare: false, end: 1 },
    { x: 40, y: -5, bare: true, end: 1 },
  ],
}

describe('createObservation', () => {
  it('keeps a copy of the values of the setup, and what was seen', () => {
    const at = new Date('2026-10-07T10:00:00Z')
    const observation = createObservation(
      setup,
      { stiffness: 'WEAK' },
      { plot, notes: '  windy ' },
      at,
    )
    expect(observation).toMatchObject({
      setupId: setup.id,
      setupName: 'Indoor',
      bow: setup.bow,
      arrow: setup.arrow,
      createdAt: '2026-10-07T10:00:00.000Z',
      seen: { stiffness: 'WEAK' },
      plot,
      notes: 'windy',
    })
    expect(observedSetup(observation)).toEqual({ id: setup.id, bow: setup.bow, arrow: setup.arrow })
  })

  it('leaves out a plot and notes that were not given', () => {
    const observation = createObservation(setup, {}, { notes: '   ' })
    expect('plot' in observation).toBe(false)
    expect('notes' in observation).toBe(false)
  })
})

describe('parseObservation', () => {
  const good = createObservation(setup, { bareHorizontal: 'RIGHT', oscillation: 'HIGH' }, { plot })

  it('accepts what createObservation makes, after a trip through JSON', () => {
    expect(parseObservation(JSON.parse(JSON.stringify(good)))).toEqual(good)
  })

  it.each([
    ['a rating that does not exist', { ...good, seen: { stiffness: 'SOFT' } }],
    ['a bow value out of bounds', { ...good, bow: { ...good.bow, drawWeight: -1 } }],
    [
      'a mark far off any target',
      { ...good, plot: { ...plot, marks: [{ x: 1e9, y: 0, bare: true, end: 1 }] } },
    ],
    ['no setup values', { ...good, bow: undefined }],
    ['another schema version', { ...good, schemaVersion: 99 }],
    ['not an object', 'nonsense'],
  ])('refuses %s', (_, input) => {
    expect(parseObservation(JSON.parse(JSON.stringify(input) ?? 'null'))).toBeNull()
  })

  it('gives a value added to the app since then its default', () => {
    const { tiller: _tiller, ...olderBow } = good.bow
    const parsed = parseObservation({ ...good, bow: olderBow })
    expect(parsed?.bow.tiller).toBe(setup.bow.tiller)
  })
})

describe('exportObservations', () => {
  it('writes a file that says what it is and holds every observation', () => {
    const one = createObservation(setup, { stiffness: 'STIFF' })
    const file = JSON.parse(exportObservations([one], new Date('2026-10-07T10:00:00Z')))
    expect(file.format).toBe('recurve-tuning-simulator/observations')
    expect(file.exportedAt).toBe('2026-10-07T10:00:00.000Z')
    expect(file.observations).toEqual([one])
  })
})

describe('local observation repository', () => {
  it('starts empty', async () => {
    expect(await createLocalObservationRepository().list()).toEqual([])
  })

  it('saves observations and gives them back oldest first', async () => {
    const repository = createLocalObservationRepository()
    const a = createObservation(setup, { stiffness: 'WEAK' })
    const b = createObservation(setup, { stiffness: 'STIFF' }, { plot })
    await repository.save(a)
    await repository.save(b)
    expect(await createLocalObservationRepository().list()).toEqual([a, b])
  })

  it('replaces an observation that has the same id, and removes one', async () => {
    const repository = createLocalObservationRepository()
    const a = createObservation(setup, { stiffness: 'WEAK' })
    const b = createObservation(setup, {})
    await repository.save(a)
    await repository.save(b)
    await repository.save({ ...a, seen: { stiffness: 'NEUTRAL' } })
    expect((await repository.list()).map((stored) => stored.seen.stiffness)).toEqual([
      'NEUTRAL',
      undefined,
    ])
    await repository.remove(a.id)
    expect(await repository.list()).toEqual([b])
  })

  it('leaves out stored entries that are not valid observations', async () => {
    const good = createObservation(setup, {})
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([good, { id: 'x' }, 'nonsense', null]))
    expect(await createLocalObservationRepository().list()).toEqual([good])
  })

  it('reads storage that holds something else as empty', async () => {
    localStorage.setItem(OBSERVATIONS_KEY, '{not json')
    expect(await createLocalObservationRepository().list()).toEqual([])
  })
})
