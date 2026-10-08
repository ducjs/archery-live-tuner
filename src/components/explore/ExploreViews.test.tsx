// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.tsx'
import { createDefaultSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'

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
const openExplore = async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('radio', { name: 'Explore' }))
}

describe('landscape in the simulator', () => {
  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('takes the place of the animation', async () => {
    await openExplore()
    expect(
      screen.getByRole('heading', { name: 'Which shaft and point suit this bow' }),
    ).toBeTruthy()
    expect(screen.queryByRole('img', { name: /view of the arrow/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull()
    // The result stays next to it.
    expect(screen.getByRole('heading', { name: 'Model result' })).toBeTruthy()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('marks the cell of the setup on screen', async () => {
    await openExplore()
    const pressed = screen.getAllByRole('button', { pressed: true })
    expect(pressed.map((cell) => cell.getAttribute('aria-label'))).toEqual([
      'Spine 700, point 120 gr: Neutral',
    ])
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('puts a pressed cell into the setup, and the result follows', async () => {
    await openExplore()
    await userEvent.click(screen.getByRole('button', { name: 'Spine 900, point 140 gr: Weak' }))
    expect(setup().arrow.spine).toBe(900)
    expect(setup().arrow.pointWeight).toBeCloseTo(convert(140, 'gr', 'g'), 9)
    expect(screen.getByRole('button', { name: 'Spine 900, point 140 gr: Weak' })).toHaveProperty(
      'ariaPressed',
      'true',
    )
    expect(screen.getByText(/^The arrow reads clearly weak\./)).toBeTruthy()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('follows the bow: a heavier bow turns the cell of the setup weak', async () => {
    await openExplore()
    useTuningStore.getState().setParameter('bow.drawWeight', convert(48, 'lbf', 'N'))
    expect(
      await screen.findByRole('button', { name: 'Spine 700, point 120 gr: Weak' }),
    ).toBeTruthy()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('heads the columns in grams when the units are metric', async () => {
    useTuningStore.setState({ units: 'metric' })
    await openExplore()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: '7.8' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Spine 700, point 7.8 g: Neutral' })).toBeTruthy()
  })
})

describe('sensitivity chart in the simulator', () => {
  const rows = () =>
    within(screen.getByRole('heading', { name: 'What moves the result most' }).closest('section')!)
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild!.textContent)

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('lists the values that move weak and stiff, largest first', async () => {
    await openExplore()
    expect(rows()[0]).toBe('Spine')
    expect(rows()).toContain('Spine')
    expect(rows()).toContain('Draw weight')
    expect(screen.getAllByLabelText(/^0\.\d\d weaker$/).length).toBeGreaterThan(0)
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('lists only values that Simple mode shows, and more in Advanced', async () => {
    await openExplore()
    expect(rows()).not.toContain('String mass')
    cleanup()

    useTuningStore.setState({ mode: 'advanced' })
    await openExplore()
    expect(rows()).toContain('String mass')
  })
})
