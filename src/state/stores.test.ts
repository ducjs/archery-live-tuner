// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getParameter, setValue } from '../models/parameters.ts'
import { createDefaultSetup } from '../models/setup.ts'
import { useLibraryStore } from './libraryStore.ts'
import { useTuningStore } from './tuningStore.ts'

beforeEach(() => {
  localStorage.clear()
  useTuningStore.setState({
    setup: createDefaultSetup(),
    mode: 'simple',
    language: 'en',
    units: 'archery',
  })
  useLibraryStore.setState({ saved: [], failed: false })
})

describe('tuning store', () => {
  it('brings back the setup on screen, the language and the units after a reload', async () => {
    const setup = setValue(createDefaultSetup('Range bow'), getParameter('arrow.spine'), 600)
    localStorage.setItem(
      'tuner.ui',
      JSON.stringify({ state: { setup, language: 'vi', units: 'metric', mode: 'advanced' } }),
    )
    await useTuningStore.persist.rehydrate()

    const state = useTuningStore.getState()
    expect(state.setup).toEqual(setup)
    expect(state.language).toBe('vi')
    expect(state.units).toBe('metric')
    expect(state.mode).toBe('advanced')
  })

  it('remembers every change to the setup on screen', () => {
    useTuningStore.getState().setParameter('arrow.spine', 600)
    const remembered = JSON.parse(localStorage.getItem('tuner.ui')!).state
    expect(remembered.setup.arrow.spine).toBe(600)
  })

  it('ignores remembered values that no longer make sense', async () => {
    const before = useTuningStore.getState().setup
    localStorage.setItem(
      'tuner.ui',
      JSON.stringify({
        state: { setup: { name: 'broken' }, language: 'fr', units: 'stone', mode: 'expert' },
      }),
    )
    await useTuningStore.persist.rehydrate()

    const state = useTuningStore.getState()
    expect(state.setup).toEqual(before)
    expect(state.language).toBe('en')
    expect(state.units).toBe('archery')
    expect(state.mode).toBe('simple')
  })
})

describe('library store', () => {
  it('saves, lists and removes setups through the repository', async () => {
    const a = createDefaultSetup('A')
    const b = createDefaultSetup('B')
    await useLibraryStore.getState().save(a)
    await useLibraryStore.getState().save(b)
    expect(useLibraryStore.getState().saved).toEqual([a, b])

    // What is stored outlives the store itself.
    useLibraryStore.setState({ saved: [] })
    await useLibraryStore.getState().load()
    expect(useLibraryStore.getState().saved).toEqual([a, b])

    await useLibraryStore.getState().remove(a.id)
    expect(useLibraryStore.getState().saved).toEqual([b])
    expect(useLibraryStore.getState().failed).toBe(false)
  })
})
