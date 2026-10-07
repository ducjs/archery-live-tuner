// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { MarkedWeightHelper } from './MarkedWeightHelper.tsx'

afterEach(cleanup)
beforeEach(() => {
  useTuningStore.setState({ setup: createDefaultSetup(), language: 'en', units: 'archery' })
})

const open = async () => {
  render(<MarkedWeightHelper />)
  await userEvent.click(screen.getByRole('button', { name: /only know what is marked/ }))
}

describe('marked draw weight helper', () => {
  it('stays folded until asked for', () => {
    render(<MarkedWeightHelper />)
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('estimates the force on the fingers at the draw length of the setup', async () => {
    useTuningStore.getState().setParameter('bow.drawLength', convert(29, 'in', 'mm'))
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    expect(
      screen.getByText(/About 42\.0 lb on the fingers at your draw length of 29\.0 in/),
    ).toBeTruthy()
  })

  it('follows the limb bolts', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    await userEvent.click(screen.getByRole('radio', { name: 'All the way in' }))
    expect(screen.getByText(/About 42\.0 lb/)).toBeTruthy()
  })

  it('puts the estimate into the draw weight when asked', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    await userEvent.click(screen.getByRole('button', { name: 'Use as draw weight' }))
    expect(useTuningStore.getState().setup.bow.drawWeight).toBeCloseTo(convert(40, 'lbf', 'N'), 9)
  })

  it('offers nothing to use before a weight is typed, or for one that is not a number', async () => {
    await open()
    expect(screen.queryByRole('button', { name: 'Use as draw weight' })).toBeNull()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '-')
    expect(screen.queryByRole('button', { name: 'Use as draw weight' })).toBeNull()
  })

  it('keeps the draw weight inside what the app accepts', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '500')
    await userEvent.click(screen.getByRole('button', { name: 'Use as draw weight' }))
    expect(useTuningStore.getState().setup.bow.drawWeight).toBeCloseTo(convert(80, 'lbf', 'N'), 9)
  })
})
