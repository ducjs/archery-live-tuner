// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { attributes, heuristicModel as model } from '../../engine/index.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { AttributeSheet } from './AttributeSheet.tsx'

afterEach(cleanup)

const base = createDefaultSetup()
const groupsOf = (setup = base) =>
  attributes({ model, setup, comparison: model.compareBareShaft(setup) })

describe('AttributeSheet', () => {
  it('shows the bare shaft group alone at the first level', () => {
    render(<AttributeSheet groups={groupsOf()} level="simple" units="metric" />)
    expect(screen.getByRole('heading', { name: 'Bare shaft' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Flight' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Performance' })).toBeNull()
  })

  it('shows all three groups at the last level', () => {
    render(<AttributeSheet groups={groupsOf()} level="pro" units="metric" />)
    for (const name of ['Bare shaft', 'Flight', 'Performance']) {
      expect(screen.getByRole('heading', { name })).toBeTruthy()
    }
  })

  it('names the side a weak shaft leans to, and writes the speed in the chosen units', () => {
    const weak = { ...base, arrow: { ...base.arrow, spine: 1000 } }
    const { unmount } = render(
      <AttributeSheet groups={groupsOf(weak)} level="pro" units="metric" />,
    )
    const sheet = screen.getByRole('region', { name: 'What this setup is like' })
    expect(within(sheet).getByText(/^Weak \d+\/10$/)).toBeTruthy()
    expect(within(sheet).getByText(/m\/s$/)).toBeTruthy()
    unmount()
    render(<AttributeSheet groups={groupsOf(weak)} level="pro" units="archery" />)
    expect(screen.getByText(/fps$/)).toBeTruthy()
  })

  it('says which number is only a rough estimate', () => {
    render(<AttributeSheet groups={groupsOf()} level="pro" units="metric" />)
    expect(screen.getByText('(rough estimate)')).toBeTruthy()
  })
})
