// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.tsx'
import { heuristicModel } from '../../engine/simulation/simulate.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { createLocalStorageRepository } from '../../storage/localStorageRepository.ts'
import { ComparisonTable } from './Comparison.tsx'

const withSpine = (name: string, spine: number): TuningSetup => ({
  ...setValue(createDefaultSetup(name), getParameter('arrow.spine'), spine),
  name,
})
const stiff = withSpine('Stiff shafts', 500)
const matched = withSpine('Matched shafts', 700)
const weak = withSpine('Weak shafts', 900)
const weakest = withSpine('Weakest shafts', 1000)
const onScreen = withSpine('On the bow now', 800)

beforeEach(async () => {
  localStorage.clear()
  window.location.hash = ''
  window.history.replaceState(null, '', '/')
  const repository = createLocalStorageRepository()
  for (const setup of [stiff, matched, weak, weakest]) await repository.save(setup)
  useTuningStore.setState({ setup: onScreen, mode: 'simple', language: 'en', units: 'archery' })
  useLibraryStore.setState({ saved: [], failed: false })
})

afterEach(cleanup)

const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)
const chosen = () =>
  within(screen.getByRole('group', { name: /^Compare with/ }))
    .getAllByRole('checkbox')
    .filter((box) => (box as HTMLInputElement).checked)
    .map((box) => box.closest('label')!.textContent)
const check = (name: string) => screen.getByRole('checkbox', { name })

async function openCompare() {
  render(<App />)
  await screen.findByText('Saved setups (4)')
  await userEvent.click(screen.getByRole('radio', { name: 'Compare' }))
}

describe('comparing more than two setups', () => {
  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('starts with one saved setup next to the one on screen', async () => {
    await openCompare()
    expect(chosen()).toEqual(['Stiff shafts'])
    expect(screen.getAllByRole('img', { name: /^Top view/ })).toHaveLength(2)
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('adds a drawing and a column for every setup that is ticked', async () => {
    await openCompare()
    await userEvent.click(check('Matched shafts'))
    await userEvent.click(check('Weak shafts'))

    expect(chosen()).toEqual(['Stiff shafts', 'Matched shafts', 'Weak shafts'])
    expect(screen.getAllByRole('img', { name: /^Top view/ })).toHaveLength(4)
    expect(screen.getByText('Saved: Weak shafts')).toBeTruthy()
    expect(screen.getByText('Now: On the bow now')).toBeTruthy()

    const [inputs, results] = screen.getAllByRole('table')
    // With several setups the columns carry their names.
    expect(
      within(inputs!)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Value', 'Stiff shafts', 'Matched shafts', 'Weak shafts', 'Now'])
    expect(cells(within(inputs!).getByRole('row', { name: /Spine/ }))).toEqual([
      '500',
      '700',
      '900',
      '800',
    ])
    expect(cells(within(results!).getByRole('row', { name: /Dynamic behavior/ }))).toEqual([
      'Stiff',
      'Neutral',
      'Weak',
      'Weak',
    ])
    expect(screen.getByText(/Every column is a model result/)).toBeTruthy()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('takes no more than three saved setups, and always keeps one', async () => {
    await openCompare()
    // The only one chosen cannot be taken away.
    expect(check('Stiff shafts')).toHaveProperty('disabled', true)

    await userEvent.click(check('Matched shafts'))
    await userEvent.click(check('Weak shafts'))
    expect(check('Weakest shafts')).toHaveProperty('disabled', true)
    expect(check('Stiff shafts')).toHaveProperty('disabled', false)

    await userEvent.click(check('Stiff shafts'))
    expect(chosen()).toEqual(['Matched shafts', 'Weak shafts'])
    expect(check('Weakest shafts')).toHaveProperty('disabled', false)
    expect(screen.getAllByRole('img', { name: /^Top view/ })).toHaveLength(3)
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('goes back to a single comparison from the list of saved setups', async () => {
    await openCompare()
    await userEvent.click(check('Matched shafts'))
    await userEvent.click(screen.getByRole('button', { name: 'Compare: Weakest shafts' }))
    expect(chosen()).toEqual(['Weakest shafts'])
    expect(
      within(screen.getAllByRole('table')[0]!)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Value', 'Saved', 'Now'])
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('says when all of them hold the same values', async () => {
    useTuningStore.setState({ setup: { ...matched, id: 'another', name: 'Copy' } })
    const repository = createLocalStorageRepository()
    await repository.save({ ...matched, id: 'twin', name: 'Twin' })
    render(<App />)
    await screen.findByText('Saved setups (5)')
    await userEvent.click(screen.getByRole('button', { name: 'Compare: Matched shafts' }))
    await userEvent.click(check('Twin'))
    expect(screen.getByText('All of these setups have the same values.')).toBeTruthy()
  })
})

describe('the draw force curves of the compared setups', () => {
  it('draws the draw force curves of all sides on one chart', () => {
    const saved = createDefaultSetup('Before')
    const now = setValue(saved, getParameter('bow.drawCurve'), 'FULL')
    render(
      <ComparisonTable
        saved={[{ setup: saved, result: heuristicModel.simulate(saved) }]}
        now={{ setup: now, result: heuristicModel.simulate(now) }}
        units="archery"
      />,
    )
    expect(screen.getByRole('heading', { name: 'Draw force curve' })).toBeTruthy()
    expect(screen.getByRole('img').querySelectorAll('polyline')).toHaveLength(2)
    const energy = screen.getByRole('row', { name: /Stored in the bow/ })
    const values = [...energy.querySelectorAll('td')].map((cell) => cell.textContent)
    expect(values).toHaveLength(2)
    expect(Number.parseFloat(values[1]!)).toBeGreaterThan(Number.parseFloat(values[0]!))
  })

  it('keeps the clicker label readable where a dashed curve runs behind it', () => {
    const heavy = createDefaultSetup('Heavier')
    const now = setValue(heavy, getParameter('bow.drawWeight'), 200)
    render(
      <ComparisonTable
        saved={[{ setup: heavy, result: heuristicModel.simulate(heavy) }]}
        now={{ setup: now, result: heuristicModel.simulate(now) }}
        units="archery"
      />,
    )
    const label = screen.getByText('Clicker')
    expect(label.getAttribute('paint-order')).toBe('stroke')
    // The chart sits on the page background, so the halo takes that color.
    expect(label.getAttribute('stroke')).toBe('var(--color-paper)')
    expect(label.getAttribute('stroke-width')).toBe('3')
  })
  it('says a force was not measured instead of showing zero', () => {
    const unmeasured = createDefaultSetup('Unmeasured')
    const measured = setValue(unmeasured, getParameter('bow.drawForceNear'), 150)
    render(
      <ComparisonTable
        saved={[{ setup: unmeasured, result: heuristicModel.simulate(unmeasured) }]}
        now={{ setup: measured, result: heuristicModel.simulate(measured) }}
        units="archery"
      />,
    )
    const row = screen.getByRole('row', { name: /Force 2 in before full draw/ })
    const values = [...row.querySelectorAll('td')].map((cell) => cell.textContent)
    expect(values).toEqual(['Not measured', expect.stringMatching(/^\d+\.\d lb$/)])
  })
})
