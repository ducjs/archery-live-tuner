// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { FlightView, PlaybackControls, type ViewSettings } from './SimulationStage.tsx'
import type { ImpactMode } from './timing.ts'

afterEach(cleanup)

// Off in both directions: weak, and a nocking point far too low.
const off = setValue(
  setValue(createDefaultSetup(), getParameter('arrow.spine'), 900),
  getParameter('bow.nockingPointHeight'),
  -5,
)
const flown = heuristicModel.compareBareShaft(off)

/** The shafts as drawn once the arrows are in the target: the bare one first, if any. */
function landed(view: 'top' | 'side', impact: ImpactMode | undefined, bare: boolean) {
  const { container } = render(
    <FlightView
      view={view}
      result={flown.fletched}
      bare={bare ? flown.bare : undefined}
      handedness="RH"
      impact={impact}
      elapsed={99}
      exaggeration={2}
    />,
  )
  const shafts = [...container.querySelectorAll('svg[role="img"] path[d^="M"][d*="L"]')].map(
    (shaft) => shaft.getAttribute('d'),
  )
  expect(container.innerHTML).not.toContain('NaN')
  cleanup()
  return { fletched: shafts.at(-1), bare: bare ? shafts.at(-2) : undefined }
}

describe('points of impact', () => {
  it.each(['top', 'side'] as const)(
    'draws one point of impact in the %s view unless told otherwise',
    (view) => {
      expect(landed(view, undefined, true)).toEqual(landed(view, 'one', true))
    },
  )

  it.each(['top', 'side'] as const)(
    'lets the fletched arrow of a setup that is off miss in the %s view with two points',
    (view) => {
      const one = landed(view, 'one', true)
      const two = landed(view, 'two', true)
      expect(two.fletched).not.toBe(one.fletched)
      expect(two.bare).not.toBe(one.bare)
    },
  )

  it.each(['top', 'side'] as const)(
    'keeps the fletched arrow where it is in the %s view with two points when the bare shaft is switched off',
    (view) => {
      expect(landed(view, 'two', false).fletched).toBe(landed(view, 'two', true).fletched)
    },
  )
})

describe('the choice in the playback controls', () => {
  const settings: ViewSettings = {
    view: 'both',
    distance: 18,
    impact: 'one',
    speed: 1,
    exaggeration: 2,
  }
  const controls = (impact: ImpactMode, onSettingsChange = vi.fn()) => (
    <PlaybackControls
      playing={false}
      onToggle={() => {}}
      onRestart={() => {}}
      settings={{ ...settings, impact }}
      onSettingsChange={onSettingsChange}
    />
  )

  it('reports a change of mode', async () => {
    const onSettingsChange = vi.fn()
    render(controls('one', onSettingsChange))
    expect((screen.getByRole('radio', { name: 'One point' }) as HTMLInputElement).checked).toBe(
      true,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Two points' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, impact: 'two' })
  })

  it('says what the drawing assumes in each mode', () => {
    const { rerender } = render(controls('one'))
    expect(screen.getByText(/taken as sighted in on the center/)).toBeTruthy()

    rerender(controls('two'))
    expect(screen.queryByText(/sighted in/)).toBeNull()
    expect(screen.getByText(/lands where the model throws it/)).toBeTruthy()
  })
})
