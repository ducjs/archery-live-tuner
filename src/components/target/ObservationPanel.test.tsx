// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { OBSERVATIONS_KEY } from '../../storage/observationRepository.ts'
import { createObservation } from '../../utils/observations.ts'
import { ObservationPanel } from './ObservationPanel.tsx'

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  useObservationStore.setState({ observations: [], failed: false })
})

const setup = createDefaultSetup('Indoor')
const stored = () => JSON.parse(localStorage.getItem(OBSERVATIONS_KEY) ?? '[]')

describe('ObservationPanel', () => {
  it('starts with nothing kept and nothing to save or export', async () => {
    render(<ObservationPanel setup={setup} />)
    expect(await screen.findByText('Kept for this setup (0)')).toBeTruthy()
    expect(screen.getByText(/Nothing yet/)).toBeTruthy()
    const button = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name })
    expect(button('Save the observation').disabled).toBe(true)
    expect(button('Export all observations').disabled).toBe(true)
  })

  it('saves what was noted and shows it beside the model', async () => {
    const user = userEvent.setup()
    render(<ObservationPanel setup={setup} />)

    await user.selectOptions(screen.getByLabelText('How the arrow behaves'), 'Weak')
    await user.selectOptions(screen.getByLabelText('Signs of the arrow touching the bow'), 'None')
    await user.type(screen.getByLabelText('Notes'), 'Light wind from the left')
    await user.click(screen.getByRole('button', { name: 'Save the observation' }))

    expect(await screen.findByText('Kept for this setup (1)')).toBeTruthy()
    expect(stored()).toHaveLength(1)
    expect(stored()[0]).toMatchObject({
      setupId: setup.id,
      seen: { stiffness: 'WEAK', clearance: 'LOW' },
      notes: 'Light wind from the left',
    })

    const card = screen.getByRole('listitem')
    expect(within(card).getByText('Noted by hand')).toBeTruthy()
    const rows = within(card).getAllByRole('row').slice(1)
    // You saw weak; the model reads the reference setup as matched.
    expect(rows[0]!.textContent).toMatch(/How the arrow behaves.*Weak.*Matched.*\(differs\)/)
    expect(rows[1]!.textContent).toMatch(/touching the bow.*None.*None.*\(same\)/)
    expect(within(card).getByText('The model agrees on 1 of 2.')).toBeTruthy()
    expect(within(card).getByText('Light wind from the left')).toBeTruthy()

    // The form is empty again.
    expect(screen.getByLabelText<HTMLSelectElement>('How the arrow behaves').value).toBe('')
    expect(screen.getByLabelText<HTMLTextAreaElement>('Notes').value).toBe('')
  })

  it('lists only the observations of the setup on screen, newest first', async () => {
    const other = createDefaultSetup('Outdoor')
    const store = useObservationStore.getState()
    await act(async () => {
      await store.save(
        createObservation(setup, { stiffness: 'WEAK' }, {}, new Date('2026-10-01T09:00:00Z')),
      )
      await store.save(createObservation(other, { stiffness: 'STIFF' }))
      await store.save(
        createObservation(
          setup,
          { bareHorizontal: 'RIGHT' },
          { plot: { distance: 30_000, faceDiameter: 800, marks: [] } },
          new Date('2026-10-05T09:00:00Z'),
        ),
      )
    })
    render(<ObservationPanel setup={setup} />)

    const cards = await screen.findAllByRole('listitem')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]!).getByText('Read from a target at 30 m')).toBeTruthy()
    expect(within(cards[1]!).getByText('Noted by hand')).toBeTruthy()
    // The export covers every setup.
    expect(screen.getByText('3 in this browser, over all setups.')).toBeTruthy()
  })

  it('deletes an observation', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await useObservationStore.getState().save(createObservation(setup, { stiffness: 'WEAK' }))
    })
    render(<ObservationPanel setup={setup} />)

    await user.click(await screen.findByRole('button', { name: /^Delete the observation of/ }))
    await waitFor(() => expect(screen.getByText('Kept for this setup (0)')).toBeTruthy())
    expect(stored()).toEqual([])
  })

  it('writes every observation to a file', async () => {
    const user = userEvent.setup()
    const created: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob)
      return 'blob:observations'
    })
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await act(async () => {
      await useObservationStore.getState().save(createObservation(setup, { oscillation: 'HIGH' }))
    })
    render(<ObservationPanel setup={setup} />)
    await user.click(await screen.findByRole('button', { name: 'Export all observations' }))

    expect(click).toHaveBeenCalledOnce()
    const file = JSON.parse(await created[0]!.text())
    expect(file.format).toBe('recurve-tuning-simulator/observations')
    expect(file.observations).toHaveLength(1)
    expect(screen.getByText('Wrote 1 observation to a file.')).toBeTruthy()
    click.mockRestore()
  })
})
