// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { FlightView, PlaybackControls, type ViewSettings } from './SimulationStage.tsx'

afterEach(cleanup)

const settings: ViewSettings = {
  view: 'top',
  distance: 18,
  impact: 'one',
  speed: 1,
  exaggeration: 3,
}
const noop = () => {}

describe('PlaybackControls', () => {
  it('offers view, distance and speed, but not amplification, outside Advanced', async () => {
    const onSettingsChange = vi.fn()
    render(
      <PlaybackControls
        playing
        onToggle={noop}
        onRestart={noop}
        bareShaft
        onBareShaftChange={noop}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeTruthy()
    // The options stay put away until they are asked for.
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    await userEvent.click(screen.getByRole('button', { name: 'Display options' }))
    expect(screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)).toEqual([
      'Top',
      'Side',
      'Both',
      '18 m',
      '30 m',
      '50 m',
      '70 m',
      '90 m',
      'One point',
      'Two points',
      '1/48',
      '1/24',
      '1/12',
      '1/6',
      'Real',
    ])
    expect(screen.queryByRole('slider')).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: 'Both' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, view: 'both' })

    await userEvent.click(screen.getByRole('radio', { name: '70 m' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, distance: 70 })

    await userEvent.click(screen.getByRole('radio', { name: 'Real' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, speed: 12 })
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
        advanced
      />,
    )
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Display options' }))

    await userEvent.click(screen.getByRole('radio', { name: 'Side' }))
    expect(onSettingsChange).toHaveBeenLastCalledWith({ ...settings, view: 'side' })

    await userEvent.click(screen.getByRole('radio', { name: '1/48' }))
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
        onSettingsChange={noop}
      />,
    )
    expect(screen.getByText(/Slowed 48 times/)).toBeTruthy()
  })

  it('says so when playing at real speed', () => {
    render(
      <PlaybackControls
        playing
        onToggle={noop}
        onRestart={noop}
        bareShaft
        onBareShaftChange={noop}
        settings={{ ...settings, speed: 12 }}
        onSettingsChange={noop}
      />,
    )
    expect(screen.getByText(/Real speed\./)).toBeTruthy()
    expect(screen.queryByText(/Slowed/)).toBeNull()
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
