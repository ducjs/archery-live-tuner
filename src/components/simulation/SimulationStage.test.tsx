// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { FlightView, PlaybackControls, type ViewSettings } from './SimulationStage.tsx'

afterEach(cleanup)

const settings: ViewSettings = { view: 'top', speed: 1, exaggeration: 3 }
const noop = () => {}

describe('PlaybackControls', () => {
  it('shows only play and restart without a settings handler', () => {
    render(
      <PlaybackControls
        playing
        onToggle={noop}
        onRestart={noop}
        bareShaft
        onBareShaftChange={noop}
        settings={settings}
      />,
    )
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeTruthy()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('reports view, speed and amplification changes', async () => {
    const onSettingsChange = vi.fn()
    render(
      <PlaybackControls
        playing={false}
        onToggle={noop}
        onRestart={noop}
        bareShaft
        onBareShaftChange={noop}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()

    await userEvent.click(screen.getByRole('radio', { name: 'Side' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, view: 'side' })

    await userEvent.click(screen.getByRole('radio', { name: '0.25×' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, speed: 0.25 })

    fireEvent.change(screen.getByRole('slider', { name: 'Amplify' }), { target: { value: '5' } })
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, exaggeration: 5 })
  })

  it('states how much the playback is slowed', () => {
    render(
      <PlaybackControls
        playing
        onToggle={noop}
        onRestart={noop}
        bareShaft
        onBareShaftChange={noop}
        settings={{ ...settings, speed: 0.25 }}
      />,
    )
    expect(screen.getByText(/Slowed 48 times/)).toBeTruthy()
  })
})

describe('FlightView', () => {
  const result = heuristicModel.simulate(createDefaultSetup())

  it.each([
    ['top', /Top view/],
    ['side', /Side view/],
    ['both', /Top view/],
    ['both', /Side view/],
  ] as const)('draws the %s view at any point of the flight', (view, name) => {
    for (const elapsed of [0, 1.7, 99]) {
      render(
        <FlightView
          view={view}
          result={result}
          handedness="RH"
          elapsed={elapsed}
          exaggeration={3}
        />,
      )
      const image = screen.getByRole('img', { name })
      expect(image.innerHTML).not.toContain('NaN')
      cleanup()
    }
  })
})
