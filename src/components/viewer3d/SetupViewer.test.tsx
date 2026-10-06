// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App.tsx'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { useBowViewer } from './useBowViewer.ts'

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

const reference = createDefaultSetup()
const withValue = (key: string, value: number | string, from: TuningSetup = reference) =>
  setValue(from, getParameter(key), value)

describe('where the camera goes', () => {
  const viewer = (setup: TuningSetup) =>
    renderHook((current: TuningSetup) => useBowViewer(current), { initialProps: setup })

  it('starts on the whole bow, at true scale and at brace height', () => {
    const { result } = viewer(reference)
    expect(result.current.focus).toBe('bow')
    expect(result.current.amplified).toBe(false)
    expect(result.current.drawn).toBe(false)
  })

  it.each([
    ['bow.centerShot', 1, 'centerShot'],
    ['bow.nockingPointHeight', 6, 'nockingPoint'],
    ['bow.braceHeight', 230, 'braceHeight'],
    ['bow.tiller', 8, 'tiller'],
    ['bow.limbAlignmentTop', 1, 'limbs'],
    ['bow.plungerPreload', 2, 'plunger'],
    ['arrow.pointWeight', 9, 'arrow'],
    ['bow.stabilizerPosition', 500, 'stabilizer'],
    ['bow.string.strandCount', 18, 'string'],
    ['bow.riserSize', 'H27', 'bow'],
  ] as const)('flies to the part that %s moves', (key, value, focus) => {
    const { result, rerender } = viewer(reference)
    const before = result.current.focusRequest
    rerender(withValue(key, value))
    expect(result.current.focus).toBe(focus)
    expect(result.current.focusRequest).toBe(before + 1)
  })

  it('stays put for a value with nothing to draw', () => {
    const { result, rerender } = viewer(reference)
    rerender(withValue('arrow.spine', 500))
    rerender(withValue('bow.drawWeight', 200))
    expect(result.current.focus).toBe('bow')
    expect(result.current.focusRequest).toBe(0)
  })

  it('stays put when another setup is opened, which changes many values at once', () => {
    const { result, rerender } = viewer(reference)
    rerender(withValue('bow.tiller', 8, withValue('bow.centerShot', 2)))
    expect(result.current.focusRequest).toBe(0)
  })

  it('draws the bow when the draw length is changed, since that is where it shows', () => {
    const { result, rerender } = viewer(reference)
    rerender(withValue('bow.drawLength', 750))
    expect(result.current.drawn).toBe(true)
    expect(result.current.focus).toBe('bow')
  })

  it('goes where it is sent, again if asked again', () => {
    const { result } = viewer(reference)
    act(() => result.current.lookAt('alongString'))
    act(() => result.current.lookAt('alongString'))
    expect(result.current.focus).toBe('alongString')
    expect(result.current.focusRequest).toBe(2)
  })
})

describe('the viewer in the page', () => {
  // jsdom has no WebGL, which is the case the flat drawings are for.
  it('shows the flat drawings where 3D cannot run, and says why', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    expect(screen.getByText(/needs WebGL.*flat drawings instead/)).toBeTruthy()
    expect(screen.getAllByRole('img', { name: /view of the arrow/ })).toHaveLength(2)
  })

  it('offers the preset views and the two switches', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    const views = screen.getByRole('group', { name: 'Look at' })
    expect([...views.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
      'Whole bow',
      'From the target',
      'From above',
      'Rest and plunger',
      'Along the string',
    ])
    expect(screen.getByRole('button', { name: 'Whole bow' })).toHaveProperty('ariaPressed', 'true')

    await userEvent.click(screen.getByRole('button', { name: 'Along the string' }))
    expect(screen.getByRole('button', { name: 'Along the string' })).toHaveProperty(
      'ariaPressed',
      'true',
    )
    // Larger offsets are off until asked for.
    expect(screen.getByRole('checkbox', { name: /Draw offsets 6 times larger/ })).toHaveProperty(
      'checked',
      false,
    )
    expect(screen.getByRole('checkbox', { name: 'At full draw' })).toHaveProperty('checked', false)
  })

  it('names the values it has nothing to draw for', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    expect(screen.getByText(/Nothing to draw for draw weight, spine/)).toBeTruthy()
  })
})
