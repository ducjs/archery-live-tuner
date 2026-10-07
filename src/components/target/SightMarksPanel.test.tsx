// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { dragPerMeter, heuristicModel, launchAngleFor } from '../../engine/index.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { DEFAULT_EYE_HEIGHT, sightOf, useSightStore } from '../../state/sightStore.ts'
import { OBSERVATIONS_KEY } from '../../storage/observationRepository.ts'
import { ObservationPanel } from './ObservationPanel.tsx'
import { SightMarksPanel } from './SightMarksPanel.tsx'
import { useSight } from './useSight.ts'

/** The panel as the page shows it: fed by the hook that fits and places the sight. */
function Panel(props: { setup: TuningSetup; result: SimulationResult }) {
  return <SightMarksPanel {...props} sight={useSight(props.setup, props.result)} />
}

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  useSightStore.setState({ bySetup: {} })
  useObservationStore.setState({ observations: [], failed: false })
})

const setup = createDefaultSetup('Indoor')
const result = heuristicModel.simulate(setup)
const marksOf = () => sightOf(useSightStore.getState().bySetup, setup.id).marks

/** The mark a sight reading 900 per unit of slope shows for an arrow of this speed. */
function markFor(meters: number, speed = result.metrics.launchSpeed): string {
  const angle = launchAngleFor(speed, dragPerMeter(setup.arrow), meters * 1000, DEFAULT_EYE_HEIGHT)
  return (900 * Math.tan(angle)).toFixed(2)
}

const input = (meters: number) => screen.getByLabelText(`Your sight mark at ${meters} m`)
// Two tables list the distances: the marks come first, the room under the pin second.
const row = (meters: number) => screen.getAllByRole('row', { name: new RegExp(`^${meters} m`) })[0]!

async function enter(user: ReturnType<typeof userEvent.setup>, meters: number, mark: string) {
  await user.clear(input(meters))
  if (mark) await user.type(input(meters), mark)
  await user.tab()
}

describe('SightMarksPanel', () => {
  it('asks for two marks before it predicts anything', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    expect(screen.getByText(/at least 2 distances/)).toBeTruthy()

    await enter(user, 18, markFor(18))
    expect(marksOf()).toHaveLength(1)
    expect(screen.getByText(/at least 2 distances/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save as an observation' })).toBeNull()
  })

  it('predicts the other distances from two marks, with a range that widens', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    await enter(user, 18, markFor(18))
    await enter(user, 30, markFor(30))

    // The marks were made with the model's own speed, so its prediction is the true mark.
    const far = within(row(70)).getAllByRole('cell')
    expect(Number(far[1]!.textContent)).toBeCloseTo(Number(markFor(70)), 0)
    const [low70, high70] = far[2]!.textContent!.split(' and ').map(Number)
    const [low50, high50] = within(row(50))
      .getAllByRole('cell')[2]!
      .textContent!.split(' and ')
      .map(Number)
    expect(high70! - low70!).toBeGreaterThan(high50! - low50!)
    // A distance the archer has shot gets no range.
    expect(within(row(18)).getAllByRole('cell')[2]!.textContent).toBe('')

    expect(screen.getByText('Takes three marks')).toBeTruthy()
    expect(screen.getByText(/place to start, to confirm by shooting/)).toBeTruthy()
  })

  it('reads the speed of the arrow from three marks, and says it is rough', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    // An arrow 8 % faster than the model estimates.
    const real = result.metrics.launchSpeed * 1.08
    for (const meters of [18, 30, 50]) await enter(user, meters, markFor(meters, real))

    const implied = screen.getByText('Arrow speed your marks imply').nextElementSibling!
    expect(Number.parseFloat(implied.textContent!)).toBeCloseTo(real / 1000, 0)
    expect(screen.getByText(/A rough reading.*between [\d.]+ and [\d.]+ m\/s/)).toBeTruthy()
  })

  it('takes a comma for the decimal point, and takes a mark away when it is cleared', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    await enter(user, 18, '15,5')
    expect(marksOf()).toEqual([{ distance: 18_000, mark: 15.5 }])
    await enter(user, 18, '')
    expect(marksOf()).toEqual([])
  })

  it('warns when the marks do not lie on one curve', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    await enter(user, 18, '15')
    await enter(user, 30, '14')
    await enter(user, 50, '40')
    expect(screen.getByRole('alert').textContent).toMatch(/do not lie on one curve/)
  })

  it('keeps the marks of each setup apart', async () => {
    const user = userEvent.setup()
    const other = createDefaultSetup('Outdoor')
    const { rerender } = render(<Panel setup={setup} result={result} />)
    await enter(user, 18, '15')

    rerender(<Panel setup={other} result={heuristicModel.simulate(other)} />)
    expect(screen.getByLabelText<HTMLInputElement>('Your sight mark at 18 m').value).toBe('')
    rerender(<Panel setup={setup} result={result} />)
    expect(screen.getByLabelText<HTMLInputElement>('Your sight mark at 18 m').value).toBe('15')
  })

  it('changes the eye height, and puts back an entry that cannot be one', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    const eye = screen.getByLabelText<HTMLInputElement>(/Eye above the arrow at anchor/)
    expect(eye.value).toBe('11')

    await user.clear(eye)
    await user.type(eye, '9,5')
    await user.tab()
    expect(sightOf(useSightStore.getState().bySetup, setup.id).eyeHeight).toBe(95)

    const again = screen.getByLabelText<HTMLInputElement>(/Eye above the arrow at anchor/)
    await user.clear(again)
    await user.type(again, '80')
    await user.tab()
    expect(sightOf(useSightStore.getState().bySetup, setup.id).eyeHeight).toBe(95)
    expect(again.value).toBe('9.5')
  })

  it('shows the room under the pin for every distance, and warns where there is none', () => {
    render(<Panel setup={setup} result={result} />)
    const rows = screen.getAllByRole('row', { name: /^(18|30|50|70|90) m/ }).slice(5)
    expect(rows).toHaveLength(5)
    // Near: the pin is well above the arrow. Far: it has come down onto it.
    expect(rows[0]!.textContent).toMatch(/18 m[\d.]+ cm[\d.]+ cm/)
    expect(rows[4]!.textContent).toMatch(/None: the vanes would strike the pin/)
    expect(screen.getByText(/shorter extension, or anchor lower/)).toBeTruthy()
  })

  it('gains room when the pin is brought closer to the riser', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    const roomAt70 = () =>
      Number.parseFloat(
        screen
          .getAllByRole('row', { name: /^70 m/ })[1]!
          .textContent!.replace(/^70 m[\d.-]+ cm(Close: )?/, ''),
      )
    const before = roomAt70()

    const extension = screen.getByLabelText<HTMLInputElement>(/Pin in front of the riser/)
    expect(extension.value).toBe('15')
    await user.clear(extension)
    await user.type(extension, '6')
    await user.tab()
    expect(sightOf(useSightStore.getState().bySetup, setup.id).extension).toBe(60)
    expect(roomAt70()).toBeGreaterThan(before)
  })

  it('switches the drawing of the sight on the bow on and off', async () => {
    const user = userEvent.setup()
    render(<Panel setup={setup} result={result} />)
    const box = screen.getByRole<HTMLInputElement>('checkbox', {
      name: /Draw the sight on the bow/,
    })
    expect(box.checked).toBe(false)
    await user.click(box)
    expect(sightOf(useSightStore.getState().bySetup, setup.id).onBow).toBe(true)
  })

  it('saves the marks as an observation, which then lists them', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Panel setup={setup} result={result} />
        <ObservationPanel setup={setup} />
      </>,
    )
    const real = result.metrics.launchSpeed * 1.08
    for (const meters of [18, 30, 50]) await enter(user, meters, markFor(meters, real))
    await user.click(screen.getByRole('button', { name: 'Save as an observation' }))

    await waitFor(() => expect(screen.getByText('Kept for this setup (1)')).toBeTruthy())
    const stored = JSON.parse(localStorage.getItem(OBSERVATIONS_KEY)!)[0]
    expect(stored.sight.marks).toHaveLength(3)
    expect(stored.sight.eyeHeight).toBe(DEFAULT_EYE_HEIGHT)
    expect(stored.sight.impliedSpeed / real).toBeCloseTo(1, 1)

    // The card comes first; the marks inside it are list items too.
    const card = screen.getAllByRole('listitem')[0]!
    expect(within(card).getByText('Sight marks')).toBeTruthy()
    expect(within(card).getByText(/^The marks imply [\d.]+ m\/s; the model estimates/)).toBeTruthy()
    expect(screen.getByText('Saved with the setup on screen.')).toBeTruthy()
  })
})
