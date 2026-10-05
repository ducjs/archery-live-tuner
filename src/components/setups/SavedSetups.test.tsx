// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { SavedSetups } from './SavedSetups.tsx'

beforeEach(() => {
  localStorage.clear()
  useTuningStore.setState({
    setup: createDefaultSetup('Indoor bow'),
    mode: 'simple',
    language: 'en',
    units: 'archery',
  })
  useLibraryStore.setState({ saved: [], failed: false })
})

afterEach(cleanup)

const working = () => useTuningStore.getState().setup
const saved = () => useLibraryStore.getState().saved
const changeSpine = (spine: number) => useTuningStore.getState().setParameter('arrow.spine', spine)

async function saveCurrent() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByText('Saved setups (1)')
}

describe('SavedSetups', () => {
  it('saves the setup on screen and says whether it has unsaved changes', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    expect(screen.getByRole('status').textContent).toBe('Not saved yet')
    expect(screen.getByText(/Nothing saved yet/)).toBeTruthy()

    await saveCurrent()
    expect(saved()).toEqual([working()])
    expect(screen.getByRole('status').textContent).toBe('Saved')
    expect(screen.getByText('Draw weight 38.0 lb, Spine 700, Point weight 120 gr')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true)

    changeSpine(600)
    expect(await screen.findByText('Unsaved changes')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/Spine 600/)).toBeTruthy()
    expect(saved()).toHaveLength(1)
  })

  it('renames the setup on screen without ever leaving it nameless', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    const name = screen.getByLabelText('Setup name')
    await userEvent.clear(name)
    expect(working().name).toBe('Indoor bow')
    await userEvent.type(name, 'Outdoor bow')
    expect(working().name).toBe('Outdoor bow')
  })

  it('saves a changed setup as a new one and keeps the old one', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    await saveCurrent()
    const firstId = working().id

    changeSpine(600)
    await userEvent.click(await screen.findByRole('button', { name: 'Save as new' }))
    await screen.findByText('Saved setups (2)')

    expect(saved().map((setup) => [setup.name, setup.arrow.spine])).toEqual([
      ['Indoor bow', 700],
      ['Indoor bow (copy)', 600],
    ])
    expect(working().id).not.toBe(firstId)
    expect(working().name).toBe('Indoor bow (copy)')
  })

  it('asks before an open replaces unsaved changes', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    await saveCurrent()
    changeSpine(600)
    await screen.findByText('Unsaved changes')

    await userEvent.click(screen.getByRole('button', { name: 'Open: Indoor bow' }))
    expect(screen.getByText('Unsaved changes will be lost.')).toBeTruthy()
    expect(working().arrow.spine).toBe(600)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(working().arrow.spine).toBe(600)

    await userEvent.click(screen.getByRole('button', { name: 'Open: Indoor bow' }))
    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(working().arrow.spine).toBe(700)
  })

  it('opens another saved setup straight away when nothing would be lost', async () => {
    const other = setValue(createDefaultSetup('Other bow'), getParameter('arrow.spine'), 500)
    await useLibraryStore.getState().save(other)
    render(<SavedSetups onCompare={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Open: Other bow' }))
    expect(working()).toEqual(other)
    expect(screen.getByText('Open now')).toBeTruthy()
  })

  it('renames and deletes a saved setup', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    await saveCurrent()

    await userEvent.click(screen.getByRole('button', { name: 'Rename: Indoor bow' }))
    const input = screen.getByLabelText('New name for Indoor bow')
    await userEvent.clear(input)
    await userEvent.type(input, 'Club bow{Enter}')
    const row = (await screen.findByText('Club bow')).closest('li')!
    expect(saved()[0]!.name).toBe('Club bow')
    expect(working().name).toBe('Club bow')

    await userEvent.click(within(row).getByRole('button', { name: 'Delete: Club bow' }))
    expect(screen.getByText('Delete "Club bow"? This cannot be undone.')).toBeTruthy()
    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }))
    await screen.findByText('Saved setups (0)')
    expect(saved()).toEqual([])
    // The setup on screen stays, as a draft that is not saved.
    expect(screen.getByRole('status').textContent).toBe('Not saved yet')
  })

  it('starts a new setup', async () => {
    render(<SavedSetups onCompare={() => {}} />)
    await saveCurrent()
    const firstId = working().id
    await userEvent.click(screen.getByRole('button', { name: 'New setup' }))
    expect(working().id).not.toBe(firstId)
    expect(working().name).toBe('My setup')
    expect(saved()).toHaveLength(1)
  })

  it('hands the setup to compare', async () => {
    const onCompare = vi.fn()
    render(<SavedSetups onCompare={onCompare} />)
    await saveCurrent()
    await userEvent.click(screen.getByRole('button', { name: 'Compare: Indoor bow' }))
    expect(onCompare).toHaveBeenCalledWith(working().id)
  })

  it('says so when the browser storage cannot be used', () => {
    useLibraryStore.setState({ failed: true })
    render(<SavedSetups onCompare={() => {}} />)
    expect(screen.getByRole('alert').textContent).toMatch(/could not be used/)
  })
})
