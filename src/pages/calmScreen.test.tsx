// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { ResultPanel } from '../components/tuning/ResultPanel.tsx'
import { heuristicModel } from '../engine/index.ts'
import { getParameter, setValue } from '../models/parameters.ts'
import { createDefaultSetup } from '../models/setup.ts'
import { useLibraryStore } from '../state/libraryStore.ts'
import { useTuningStore } from '../state/tuningStore.ts'
import { convert } from '../utils/units.ts'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
  useTuningStore.setState({
    setup: createDefaultSetup('Indoor bow'),
    mode: 'simple',
    language: 'en',
    units: 'archery',
  })
  useLibraryStore.setState({ saved: [], failed: false })
})

afterEach(cleanup)

const setup = () => useTuningStore.getState().setup
const weak = setValue(createDefaultSetup(), getParameter('arrow.spine'), 1000)

describe('changing a value without dragging', () => {
  it('steps a value down and up with the buttons beside its slider', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Increase Point weight' }))
    expect(setup().arrow.pointWeight).toBeGreaterThan(convert(120, 'gr', 'g'))

    await userEvent.click(screen.getByRole('button', { name: 'Decrease Point weight' }))
    expect(setup().arrow.pointWeight).toBeCloseTo(convert(120, 'gr', 'g'), 9)
  })

  it('stops at the end of the range', () => {
    useTuningStore.setState({
      setup: setValue(createDefaultSetup(), getParameter('arrow.spine'), 200),
    })
    render(<App />)
    const stiffest = Number(
      (screen.getByRole('spinbutton', { name: 'Spine' }) as HTMLInputElement).min,
    )
    expect(setup().arrow.spine).toBe(stiffest)
    expect(screen.getByRole('button', { name: 'Decrease Spine' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Increase Spine' })).toHaveProperty('disabled', false)
  })
})

describe('groups of inputs', () => {
  it('fold away and say how many of their values are changed', async () => {
    useTuningStore.setState({ setup: weak })
    render(<App />)
    const fold = screen.getByRole('button', { name: 'Hide Arrow' })
    expect(fold.textContent).toBe('1 changed')
    expect(screen.getByRole('button', { name: 'Hide Bow' }).textContent).toBe('')

    await userEvent.click(fold)
    expect(screen.queryByRole('spinbutton', { name: 'Spine' })).toBeNull()
    expect(screen.getByRole('spinbutton', { name: 'Draw weight' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Show Arrow' }).textContent).toBe('1 changed')

    await userEvent.click(screen.getByRole('button', { name: 'Show Arrow' }))
    expect(screen.getByRole('spinbutton', { name: 'Spine' })).toBeTruthy()
  })
})

describe('the result in words', () => {
  const panel = (result = heuristicModel.simulate(createDefaultSetup())) =>
    render(<ResultPanel result={result} handedness="RH" />)

  it('says a matched setup is matched', () => {
    panel()
    expect(screen.getByText('The arrow matches the bow.')).toBeTruthy()
  })

  it('says how far off the arrow is, and which way', () => {
    panel(heuristicModel.simulate(weak))
    expect(screen.getByText(/^The arrow reads clearly weak\./)).toBeTruthy()
    cleanup()

    const little = setValue(createDefaultSetup(), getParameter('arrow.spine'), 600)
    panel(heuristicModel.simulate(little))
    expect(screen.getByText(/^The arrow reads a little stiff\./)).toBeTruthy()
  })

  it('adds only what stands out', () => {
    const high = setValue(weak, getParameter('bow.nockingPointHeight'), 12)
    panel(heuristicModel.simulate(high))
    expect(screen.getByText(/The nocking point reads too high\./)).toBeTruthy()
    cleanup()

    panel()
    expect(screen.queryByText(/nocking point reads/)).toBeNull()
    expect(screen.queryByText(/touch the bow/)).toBeNull()
  })

  it('names where the bare shaft lands when one is flown', () => {
    const comparison = heuristicModel.compareBareShaft(weak)
    render(<ResultPanel result={comparison.fletched} comparison={comparison} handedness="RH" />)
    expect(
      screen.getByText(
        /^The arrow reads clearly weak\..* The bare shaft lands to the right of the fletched arrows\.$/,
      ),
    ).toBeTruthy()
  })

  it('puts the gauges away and brings them back', async () => {
    panel()
    expect(screen.getByText('Dynamic behavior')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Hide the gauges' }))
    expect(screen.getByRole('button', { name: 'Show the gauges' })).toHaveProperty(
      'ariaExpanded',
      'false',
    )
    expect(document.getElementById('result-gauges')).toHaveProperty('hidden', true)
    // The reading stays.
    expect(screen.getByText('The arrow matches the bow.')).toBeTruthy()
  })
})

describe('sections on a phone', () => {
  it('offers setup, result and suggestions, one at a time', async () => {
    render(<App />)
    const tabs = within(screen.getByRole('tablist', { name: 'Part of the page' }))
    expect(tabs.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Setup',
      'Result',
      'Suggestions',
    ])
    expect(tabs.getByRole('tab', { name: 'Setup' })).toHaveProperty('ariaSelected', 'true')
    expect(document.getElementById('section-result')!.className).toContain('hidden')

    await userEvent.click(tabs.getByRole('tab', { name: 'Result' }))
    expect(tabs.getByRole('tab', { name: 'Result' })).toHaveProperty('ariaSelected', 'true')
    expect(document.getElementById('section-setup')!.className).toContain('hidden')
    expect(document.getElementById('section-result')!.className).not.toMatch(/(^| )hidden( |$)/)
  })
})

describe('the drawing', () => {
  it('can be put away and brought back', async () => {
    render(<App />)
    expect(screen.getAllByRole('img', { name: /view of the arrow/ })).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Hide the drawing' }))
    expect(screen.queryAllByRole('img', { name: /view of the arrow/ })).toHaveLength(0)
    expect(screen.queryByRole('slider', { name: 'Moment' })).toBeNull()
    // The result is still there to read.
    expect(screen.getByRole('heading', { name: 'Model result' })).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Show the drawing' }))
    expect(screen.getAllByRole('img', { name: /view of the arrow/ })).toHaveLength(2)
  })
})
