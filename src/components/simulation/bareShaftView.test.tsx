// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { ResultPanel } from '../tuning/ResultPanel.tsx'
import { FlightView, PlaybackControls } from './SimulationStage.tsx'

afterEach(cleanup)

const weak = setValue(createDefaultSetup(), getParameter('arrow.spine'), 900)
const comparison = heuristicModel.compareBareShaft(weak)

describe('bare shaft in the views', () => {
  it.each(['top', 'side'] as const)('draws a second arrow and a legend in the %s view', (view) => {
    const { container, rerender } = render(
      <FlightView
        view={view}
        result={comparison.fletched}
        handedness="RH"
        elapsed={1.5}
        exaggeration={3}
      />,
    )
    const shaftsAlone = container.querySelectorAll('svg[role="img"] path[d^="M"][d*="L"]').length
    expect(screen.queryByText('Bare shaft')).toBeNull()

    rerender(
      <FlightView
        view={view}
        result={comparison.fletched}
        bare={comparison.bare}
        handedness="RH"
        elapsed={1.5}
        exaggeration={3}
      />,
    )
    expect(screen.getByText('Bare shaft')).toBeTruthy()
    expect(screen.getByText('Fletched')).toBeTruthy()
    expect(container.querySelectorAll('svg[role="img"] path[d^="M"][d*="L"]').length).toBe(
      shaftsAlone + 1,
    )
    expect(container.innerHTML).not.toContain('NaN')
  })

  it.each(['top', 'side'] as const)(
    'keeps the fletched arrow in place in the %s view when the bare shaft is shown',
    (view) => {
      // Off in both directions: weak, and a nocking point far too low.
      const off = setValue(weak, getParameter('bow.nockingPointHeight'), -5)
      const flown = heuristicModel.compareBareShaft(off)
      const fletchedShaft = (bare: boolean) => {
        const { container } = render(
          <FlightView
            view={view}
            result={flown.fletched}
            bare={bare ? flown.bare : undefined}
            handedness="RH"
            elapsed={99}
            exaggeration={2}
          />,
        )
        const shafts = container.querySelectorAll('svg[role="img"] path[d^="M"][d*="L"]')
        const d = shafts[shafts.length - 1]!.getAttribute('d')
        cleanup()
        return d
      }
      expect(fletchedShaft(true)).toBe(fletchedShaft(false))
    },
  )

  it('toggles from the playback controls', async () => {
    const onBareShaftChange = vi.fn()
    render(
      <PlaybackControls
        playing
        onToggle={() => {}}
        onRestart={() => {}}
        bareShaft
        onBareShaftChange={onBareShaftChange}
        settings={{ view: 'top', distance: 18, impact: 'one', speed: 1, exaggeration: 3 }}
        onSettingsChange={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Fly a bare shaft too' }))
    expect(onBareShaftChange).toHaveBeenCalledWith(false)
  })

  it('explains the result in the result panel', () => {
    const { rerender } = render(
      <ResultPanel result={comparison.fletched} comparison={comparison} handedness="RH" />,
    )
    expect(
      screen.getByText(
        'The bare shaft lands to the right of the fletched arrows. That reads as a weak arrow.',
      ),
    ).toBeTruthy()

    rerender(<ResultPanel result={comparison.fletched} handedness="RH" />)
    expect(screen.queryByText('Bare shaft test')).toBeNull()
  })
})
