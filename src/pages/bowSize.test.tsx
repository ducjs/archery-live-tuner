// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { getParameter, setValue } from '../models/parameters.ts'
import { createDefaultSetup } from '../models/setup.ts'
import { useLibraryStore } from '../state/libraryStore.ts'
import { useTuningStore } from '../state/tuningStore.ts'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
  window.history.replaceState(null, '', '/')
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
const change = (key: string, value: number | string) =>
  useTuningStore.setState({ setup: setValue(setup(), getParameter(key), value) })

describe('bow size', () => {
  it('has a section of its own above the other inputs, in Simple mode too', () => {
    render(<App />)
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(headings.indexOf('Bow size')).toBeGreaterThan(-1)
    expect(headings.indexOf('Bow size')).toBeLessThan(headings.indexOf('Bow'))
    expect(screen.getByRole('radio', { name: 'H25' })).toHaveProperty('checked', true)
    expect(screen.getByRole('radio', { name: '68' })).toHaveProperty('checked', true)
    expect(screen.getByText('68 in bow')).toBeTruthy()
  })

  it('works out the bow length from riser and limbs', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'H27' }))
    expect(setup().bow.riserSize).toBe('H27')
    expect(screen.getByText('70 in bow')).toBeTruthy()

    await userEvent.click(screen.getByRole('radio', { name: '66' }))
    expect(setup().bow.limbSize).toBe('66')
    expect(screen.getByText('68 in bow')).toBeTruthy()
  })

  it('says when the brace height does not suit a bow of that length', async () => {
    render(<App />)
    expect(screen.queryByText(/Brace height is outside the range/)).toBeNull()

    // 22 cm suits a 68 in bow, and is too low for a 72 in one.
    await userEvent.click(screen.getByRole('radio', { name: 'H27' }))
    await userEvent.click(screen.getByRole('radio', { name: '70' }))
    expect(
      screen.getByText(
        'Brace height is outside the range Easton gives for a 72 in bow: 22.2 to 25.4 cm.',
      ),
    ).toBeTruthy()
  })
})

describe('limb alignment', () => {
  it('is an Advanced value', async () => {
    render(<App />)
    expect(screen.queryByRole('spinbutton', { name: 'Top limb alignment' })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Advanced' }))
    expect(screen.getByRole('spinbutton', { name: 'Top limb alignment' })).toBeTruthy()
    expect(screen.getByRole('spinbutton', { name: 'Bottom limb alignment' })).toBeTruthy()
  })

  it('says what limbs out of line do to the center shot', () => {
    change('bow.limbAlignmentTop', 1)
    change('bow.limbAlignmentBottom', 1)
    render(<App />)
    expect(
      screen.getByText(
        'The limbs carry the string off line, which acts like −3.1 mm more of center shot.',
      ),
    ).toBeTruthy()
  })

  it('says nothing when the limbs only point apart', () => {
    change('bow.limbAlignmentTop', 1)
    change('bow.limbAlignmentBottom', -1)
    render(<App />)
    expect(screen.queryByText(/carry the string off line/)).toBeNull()
  })
})
