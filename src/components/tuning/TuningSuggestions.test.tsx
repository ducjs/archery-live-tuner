// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { heuristicModel, suggestTuning } from '../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { TuningSuggestions } from './TuningSuggestions.tsx'

afterEach(cleanup)

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

function renderFor(setup: TuningSetup, onTry = vi.fn()) {
  const comparison = heuristicModel.compareBareShaft(setup)
  render(
    <TuningSuggestions
      advice={suggestTuning(heuristicModel, setup, { limit: Infinity })}
      before={{
        classification: comparison.fletched.classification,
        horizontal: comparison.horizontal,
        vertical: comparison.vertical,
      }}
      onTry={onTry}
    />,
  )
  return onTry
}

describe('TuningSuggestions', () => {
  it('says so when the setup is tuned', () => {
    renderFor(createDefaultSetup())
    expect(screen.getByText(/reads this setup as tuned/)).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('lists suggestions in order, with value, effect and effort', () => {
    renderFor(withDisplay(createDefaultSetup(), 'bow.nockingPointHeight', 9))
    const items = screen.getAllByRole('listitem')
    const first = within(items[0]!)

    expect(first.getByText('1')).toBeTruthy()
    expect(first.getByText('Lower the nocking point')).toBeTruthy()
    expect(first.getByText('Try about 4.0 mm. It is 9.0 mm now.')).toBeTruthy()
    expect(first.getByText(/Vertical tendency goes from nock high to neutral\./)).toBeTruthy()
    expect(first.getByText(/The bare shaft lands level with the group\./)).toBeTruthy()
  })

  it('keeps adjustments on the bow apart from changes of equipment', () => {
    const messy = withDisplay(
      withDisplay(createDefaultSetup(), 'bow.nockingPointHeight', 9),
      'arrow.spine',
      900,
    )
    renderFor(messy)
    const group = (name: string) =>
      within(screen.getByRole('heading', { level: 3, name }).closest('section')!)

    const adjust = group('Adjust directly')
    expect(adjust.getByText('Lower the nocking point')).toBeTruthy()
    expect(adjust.queryByText('Use a stiffer shaft')).toBeNull()
    expect(adjust.getAllByRole('listitem').length).toBeLessThanOrEqual(3)
    // Each group counts from 1.
    expect(within(adjust.getAllByRole('listitem')[0]!).getByText('1')).toBeTruthy()

    const equipment = group('Equipment')
    expect(equipment.getByText('Use a stiffer shaft')).toBeTruthy()
    expect(equipment.getAllByText('Needs new arrows').length).toBeGreaterThan(0)
    expect(equipment.queryByText('Lower the nocking point')).toBeNull()
    expect(within(equipment.getAllByRole('listitem')[0]!).getByText('1')).toBeTruthy()
  })

  it('says so when a group has nothing to offer', () => {
    // Only the nocking point is off: no arrow part fixes that.
    renderFor(withDisplay(createDefaultSetup(), 'bow.nockingPointHeight', 9))
    const equipment = within(
      screen.getByRole('heading', { level: 3, name: 'Equipment' }).closest('section')!,
    )
    expect(equipment.getByText('Nothing in this group helps much.')).toBeTruthy()
  })

  it('applies a suggestion', async () => {
    const onTry = renderFor(withDisplay(createDefaultSetup(), 'bow.nockingPointHeight', 9))
    await userEvent.click(screen.getByRole('button', { name: 'Try it: Lower the nocking point' }))
    expect(onTry).toHaveBeenCalledWith('bow.nockingPointHeight', 4)
  })

  it('words spine by stiffness, not by number', () => {
    renderFor(withDisplay(createDefaultSetup(), 'arrow.spine', 900))
    expect(screen.getByText('Use a stiffer shaft')).toBeTruthy()
    expect(screen.getAllByText('Needs new arrows').length).toBeGreaterThan(0)
  })
})
