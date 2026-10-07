// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { diagnosePlot, heuristicModel, readPlot } from '../../engine/index.ts'
import type { Mark, TargetPlot } from '../../models/observation.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { usePlotStore } from '../../state/plotStore.ts'
import { TargetControls } from './TargetControls.tsx'
import { TargetFace } from './TargetFace.tsx'
import { TargetReading } from './TargetReading.tsx'

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  usePlotStore.setState({
    plot: { distance: 18_000, faceDiameter: 400, marks: [] },
    bare: false,
    end: 1,
  })
})

const setup = createDefaultSetup()
const group: Mark[] = [
  { x: 5, y: 10, bare: false, end: 1 },
  { x: -10, y: -5, bare: false, end: 1 },
  { x: 10, y: -10, bare: false, end: 1 },
]
const plotWith = (...bare: [number, number][]): TargetPlot => ({
  distance: 18_000,
  faceDiameter: 400,
  marks: [...group, ...bare.map(([x, y]) => ({ x, y, bare: true, end: 1 }))],
})

function renderReading(plot: TargetPlot, saved = false) {
  const reading = readPlot(plot, 'RH')
  const onSave = vi.fn()
  render(
    <TargetReading
      reading={reading}
      diagnosis={diagnosePlot(reading, setup, heuristicModel)}
      onSave={onSave}
      saved={saved}
    />,
  )
  return onSave
}

describe('plot store', () => {
  const state = () => usePlotStore.getState()

  it('marks fletched arrows and bare shafts in the end that is open', () => {
    state().addMark(10, 20)
    state().setBare(true)
    state().addMark(-30, 5)
    expect(state().plot.marks).toEqual([
      { x: 10, y: 20, bare: false, end: 1 },
      { x: -30, y: 5, bare: true, end: 1 },
    ])
  })

  it('opens the next end only once the open one has an arrow, and starts it on fletched', () => {
    state().nextEnd()
    expect(state().end).toBe(1)
    state().setBare(true)
    state().addMark(0, 0)
    state().nextEnd()
    expect(state().end).toBe(2)
    expect(state().bare).toBe(false)
    state().addMark(1, 1)
    expect(state().plot.marks.at(-1)).toMatchObject({ end: 2, bare: false })
  })

  it('goes back an end when its only arrow is taken back', () => {
    state().addMark(0, 0)
    state().nextEnd()
    state().addMark(1, 1)
    state().removeLast()
    expect(state().end).toBe(1)
    expect(state().plot.marks).toHaveLength(1)
    state().removeLast()
    state().removeLast()
    expect(state().plot.marks).toEqual([])
    expect(state().end).toBe(1)
  })

  it('clears the arrows and keeps where the target stands', () => {
    state().setDistance(70_000)
    state().addMark(0, 0)
    state().clear()
    expect(state().plot).toEqual({ distance: 70_000, faceDiameter: 1220, marks: [] })
  })

  it('puts up the usual face for a distance, which can then be changed', () => {
    state().setDistance(30_000)
    expect(state().plot.faceDiameter).toBe(800)
    state().setFace(600)
    expect(state().plot).toMatchObject({ distance: 30_000, faceDiameter: 600 })
  })

  it('remembers the target between visits', () => {
    state().addMark(12, -7)
    expect(JSON.parse(localStorage.getItem('tuner.plot')!).state.plot.marks).toEqual([
      { x: 12, y: -7, bare: false, end: 1 },
    ])
  })
})

/** The face as the page shows it, with the texts of the keyboard cursor. */
function Face({ plot, onMark }: { plot: TargetPlot; onMark: (x: number, y: number) => void }) {
  return (
    <TargetFace
      plot={plot}
      reading={readPlot(plot, 'RH')}
      label="face"
      onMark={onMark}
      keyboardLabel="Target face, keys"
      describeCursor={(x, y) => `cursor ${x} ${y}`}
    />
  )
}

describe('TargetFace', () => {
  it('marks an arrow with the keyboard: arrow keys move a cursor, Enter marks under it', async () => {
    const user = userEvent.setup()
    const onMark = vi.fn()
    render(<Face plot={plotWith()} onMark={onMark} />)
    const face = screen.getByRole('application', { name: 'Target face, keys' })
    expect(face.querySelector('[data-cursor]')).toBeNull()

    await user.tab()
    expect(document.activeElement).toBe(face)
    expect(face.querySelector('[data-cursor]')).toBeTruthy()
    // A step is a fortieth of the 400 mm face; with Shift, a fifth of that.
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}')
    expect(screen.getByText('cursor 20 10')).toBeTruthy()
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(screen.getByText('cursor 18 10')).toBeTruthy()

    await user.keyboard('{Enter}')
    expect(onMark).toHaveBeenLastCalledWith(18, 10)
    await user.keyboard('{ArrowDown} ')
    expect(onMark).toHaveBeenLastCalledWith(18, 0)
  })

  it('keeps the cursor on the sheet', async () => {
    const user = userEvent.setup()
    render(<Face plot={plotWith()} onMark={vi.fn()} />)
    await user.tab()
    await user.keyboard('{ArrowLeft>40/}')
    // The sheet reaches 224 mm from the middle of a 400 mm face.
    expect(screen.getByText('cursor -224 0')).toBeTruthy()
  })

  it('marks the arrow where the face is tapped, in mm from the middle', () => {
    const onMark = vi.fn()
    const plot = plotWith()
    render(<Face plot={plot} onMark={onMark} />)
    const face = screen.getByRole('img', { name: 'face' })
    // The drawing shows the 400 mm face with a margin: 448 mm across.
    face.getBoundingClientRect = () => ({ left: 0, top: 0, width: 448, height: 448 }) as DOMRect

    fireEvent.click(face, { clientX: 224, clientY: 224 })
    expect(onMark).toHaveBeenLastCalledWith(0, 0)
    // Right of the middle and above it.
    fireEvent.click(face, { clientX: 324, clientY: 174 })
    expect(onMark).toHaveBeenLastCalledWith(100, 50)
  })

  it('draws fletched arrows as dots and bare shafts as squares', () => {
    const plot = plotWith([40, 0], [50, 5])
    render(<Face plot={plot} onMark={vi.fn()} />)
    const face = screen.getByRole('img', { name: 'face' })
    expect(face.querySelectorAll('rect')).toHaveLength(2)
    // Ten rings, and one dot for each fletched arrow.
    expect(face.querySelectorAll('circle')).toHaveLength(10 + 3)
  })
})

describe('TargetControls', () => {
  it('switches the next arrow, counts the end, and takes marks back', async () => {
    const user = userEvent.setup()
    render(<TargetControls />)
    expect(screen.getByRole('status').textContent).toBe('End 1: 0 marked')
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next end' }).disabled).toBe(true)

    await user.click(screen.getByRole('radio', { name: 'Bare shaft' }))
    act(() => usePlotStore.getState().addMark(3, 4))
    expect(usePlotStore.getState().plot.marks[0]!.bare).toBe(true)
    expect(screen.getByRole('status').textContent).toBe('End 1: 1 marked')

    await user.click(screen.getByRole('button', { name: 'Next end' }))
    expect(screen.getByRole('status').textContent).toBe('End 2: 0 marked')

    await user.click(screen.getByRole('button', { name: 'Take back the last arrow' }))
    expect(usePlotStore.getState().plot.marks).toEqual([])
  })

  it('sets the distance and with it the usual face', async () => {
    const user = userEvent.setup()
    render(<TargetControls />)
    await user.click(screen.getByRole('radio', { name: '70 m' }))
    expect(usePlotStore.getState().plot).toMatchObject({ distance: 70_000, faceDiameter: 1220 })
    expect(screen.getByRole<HTMLInputElement>('radio', { name: '122 cm' }).checked).toBe(true)
  })
})

describe('TargetReading', () => {
  it('says what is still needed before it reads anything', () => {
    renderReading({ distance: 18_000, faceDiameter: 400, marks: group.slice(0, 2) })
    expect(
      screen.getByText(/at least 3 fletched arrows and 1 bare shaft.*2 fletched, 0 bare/),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save as an observation' })).toBeNull()
  })

  it('reads a bare shaft to the right as a weak arrow and lists what to try', () => {
    renderReading(plotWith([92, 0]))
    expect(screen.getByText('That reads as a weak arrow.')).toBeTruthy()
    expect(screen.getByText("9.0 cm, at 3 o'clock")).toBeTruthy()
    expect(screen.getByText(/model does not read the setup you entered this way/)).toBeTruthy()

    const steps = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(steps.map((step) => step.querySelector('p')!.textContent)).toEqual([
      'Stiffen the plunger',
      'Use a lighter point',
      'Reduce the draw weight',
    ])
    expect(steps[1]!.textContent).toMatch(/4\.6 cm to the side at 18 m/)
  })

  it('does not conclude from a bare shaft inside the group', () => {
    renderReading(plotWith([4, 2]))
    expect(screen.getByText('Nothing to conclude yet.')).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('saves the target, and says so until it changes', async () => {
    const user = userEvent.setup()
    const onSave = renderReading(plotWith([92, 0]))
    await user.click(screen.getByRole('button', { name: 'Save as an observation' }))
    expect(onSave).toHaveBeenCalledOnce()
    cleanup()

    renderReading(plotWith([92, 0]), true)
    expect(screen.getByText('Saved with the setup on screen.')).toBeTruthy()
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Save as an observation' }).disabled,
    ).toBe(true)
  })
})
