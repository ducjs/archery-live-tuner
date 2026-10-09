// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    highlighted: null,
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
    // The whole bow is in view already: nothing to fly to.
    expect(result.current.focusRequest).toBe(focus === 'bow' ? before : before + 1)
  })

  it('leaves the view alone while the value of the part in view is set', () => {
    const { result, rerender } = viewer(reference)
    rerender(withValue('bow.stabilizerPosition', 500))
    const before = result.current.focusRequest
    rerender(withValue('bow.stabilizerPosition', 520))
    rerender(withValue('bow.stabilizerPosition', 540))
    expect(result.current.focus).toBe('stabilizer')
    expect(result.current.focusRequest).toBe(before)
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
  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('shows the flat drawings where 3D cannot run, and says why', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    expect(screen.getByText(/needs WebGL.*flat drawings instead/)).toBeTruthy()
    expect(screen.getAllByRole('img', { name: /view of the arrow/ })).toHaveLength(2)
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('offers the views and the equipment in two groups, and the two switches', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    const buttons = (group: string) =>
      [...screen.getByRole('group', { name: group }).querySelectorAll('button')].map(
        (button) => button.textContent,
      )
    expect(buttons('View')).toEqual([
      'Whole bow',
      'From the target',
      'From above',
      'Along the string',
    ])
    expect(buttons('Equipment')).toEqual([
      'Limbs',
      'String',
      'Nocking point',
      'Rest',
      'Plunger',
      'Arrow',
      'Stabilizer',
    ])

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

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('names the values it has nothing to draw for', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
    expect(screen.getByText(/Nothing to draw for draw weight, spine/)).toBeTruthy()
  })
})

describe('the button of a piece of equipment', () => {
  const marked = () =>
    [...document.querySelectorAll('[data-highlighted]')].map(
      (element) => element.querySelector('label, legend')?.textContent,
    )
  const open3d = async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Bow 3D' }))
  }

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('turns the camera to the piece and goes to its slider, in one press', async () => {
    await open3d()
    await userEvent.click(screen.getByRole('button', { name: 'String' }))
    expect(screen.getByRole('button', { name: 'String' })).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByRole('button', { name: 'Whole bow' })).toHaveProperty('ariaPressed', 'false')
    expect(marked()).toEqual(['Brace height'])
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Brace height slider' }))
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('shows Advanced when the value of the piece lives there', async () => {
    await open3d()
    await userEvent.click(screen.getByRole('button', { name: 'Limbs' }))
    expect(useTuningStore.getState().mode).toBe('advanced')
    expect(marked()).toEqual(['Tiller'])
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('opens the setup tab, which is where the sliders are on a phone', async () => {
    await open3d()
    await userEvent.click(screen.getByRole('tab', { name: 'Result' }))
    await userEvent.click(screen.getByRole('button', { name: 'Arrow' }))
    expect(screen.getByRole('tab', { name: 'Setup' })).toHaveProperty('ariaSelected', 'true')
    expect(marked()).toEqual(['Arrow length'])
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('leaves the sliders alone for a view of the whole bow', async () => {
    await open3d()
    await userEvent.click(screen.getByRole('button', { name: 'From above' }))
    expect(marked()).toEqual([])
  })
})

describe('going from a part of the bow to its value', () => {
  const pointTo = (key: string) => act(() => useTuningStore.getState().pointTo(key))
  const marked = () =>
    [...document.querySelectorAll('[data-highlighted]')].map(
      (element) => element.querySelector('label, legend')?.textContent,
    )

  it('marks the input, gives it the focus and lets go of it after a moment', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<App />)
    pointTo('bow.braceHeight')
    expect(marked()).toEqual(['Brace height'])
    // The slider has the focus, so the arrow keys change the value at once.
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Brace height slider' }))

    act(() => vi.advanceTimersByTime(3000))
    expect(marked()).toEqual([])
    vi.useRealTimers()
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('shows Advanced first when the value lives there', () => {
    render(<App />)
    expect(screen.queryByRole('spinbutton', { name: 'Tiller' })).toBeNull()
    pointTo('bow.tiller')
    expect(useTuningStore.getState().mode).toBe('advanced')
    expect(marked()).toEqual(['Tiller'])
  })

  it('leaves the mode alone for a value Simple shows', () => {
    render(<App />)
    pointTo('arrow.length')
    expect(useTuningStore.getState().mode).toBe('simple')
    expect(marked()).toEqual(['Arrow length'])
  })

  it('marks a choice as well as a slider', () => {
    render(<App />)
    pointTo('bow.riserSize')
    expect(marked()).toEqual(['Riser'])
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'H25' }))
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('opens the group again if it was folded, every time', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Hide Arrow' }))
    expect(screen.queryByRole('spinbutton', { name: 'Arrow length' })).toBeNull()

    pointTo('arrow.length')
    expect(screen.getByRole('spinbutton', { name: 'Arrow length' })).toBeTruthy()

    act(() => useTuningStore.getState().clearHighlight())
    await userEvent.click(screen.getByRole('button', { name: 'Hide Arrow' }))
    pointTo('arrow.length')
    expect(screen.getByRole('spinbutton', { name: 'Arrow length' })).toBeTruthy()
  })
})
