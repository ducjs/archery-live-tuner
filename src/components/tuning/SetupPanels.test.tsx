// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PARAMETERS } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { SetupPanels } from './SetupPanels.tsx'

beforeEach(() => {
  localStorage.clear()
  useTuningStore.setState({ setup: createDefaultSetup(), mode: 'simple' })
})

afterEach(cleanup)

const setup = () => useTuningStore.getState().setup

describe('SetupPanels', () => {
  it('shows only the simple parameters in Simple mode', () => {
    render(<SetupPanels />)
    for (const parameter of PARAMETERS) {
      const shown = screen.queryAllByText(parameter.label).length > 0
      expect(shown, parameter.key).toBe(parameter.tier === 'simple')
    }
  })

  it('shows every parameter in Advanced mode and remembers the mode', async () => {
    render(<SetupPanels />)
    await userEvent.click(screen.getByRole('radio', { name: 'Advanced' }))

    for (const parameter of PARAMETERS) {
      expect(screen.queryAllByText(parameter.label).length, parameter.key).toBeGreaterThan(0)
    }
    expect(JSON.parse(localStorage.getItem('tuner.ui')!).state).toMatchObject({ mode: 'advanced' })
  })

  it('shows nothing of the draw force curve in Simple mode, and all of it in Advanced', async () => {
    render(<SetupPanels />)
    const parts = [
      'Draw force, measured',
      'Force 2 in before full draw',
      'Draw force curve',
    ] as const
    for (const part of parts) expect(screen.queryAllByText(part), part).toHaveLength(0)

    await userEvent.click(screen.getByRole('radio', { name: 'Advanced' }))
    for (const part of parts) {
      expect(screen.queryAllByText(part).length, part).toBeGreaterThan(0)
    }
  })

  it('updates the setup from the number input, in display units', async () => {
    render(<SetupPanels />)
    const input = screen.getByRole('spinbutton', { name: 'Point weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '100')

    expect(setup().arrow.pointWeight).toBeCloseTo(convert(100, 'gr', 'g'), 9)
  })

  it('clamps a typed value that is out of range when the field loses focus', async () => {
    render(<SetupPanels />)
    const input = screen.getByRole('spinbutton', { name: 'Draw weight' })
    await userEvent.clear(input)
    await userEvent.type(input, '500')
    // '50' was valid on the way and was applied; '500' is out of range and is not.
    expect(setup().bow.drawWeight).toBeCloseTo(convert(50, 'lbf', 'N'), 9)

    await userEvent.tab()
    expect(setup().bow.drawWeight).toBeCloseTo(convert(80, 'lbf', 'N'), 9)
    expect(Number((input as HTMLInputElement).value)).toBe(80)
  })

  it('updates the setup from the slider', () => {
    render(<SetupPanels />)
    fireEvent.change(screen.getByRole('slider', { name: 'Spine slider' }), {
      target: { value: '600' },
    })
    expect(setup().arrow.spine).toBe(600)
  })

  it('resets a single parameter', async () => {
    render(<SetupPanels />)
    fireEvent.change(screen.getByRole('slider', { name: 'Spine slider' }), {
      target: { value: '600' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Reset Spine to 700' }))
    expect(setup().arrow.spine).toBe(700)
  })

  it('switches handedness', async () => {
    render(<SetupPanels />)
    await userEvent.click(screen.getByRole('radio', { name: 'Left-handed' }))
    expect(setup().bow.handedness).toBe('LH')
  })

  it('updates the estimated total arrow mass', () => {
    render(<SetupPanels />)
    expect(screen.getByText('308 gr')).toBeTruthy()
    fireEvent.change(screen.getByRole('slider', { name: 'Point weight slider' }), {
      target: { value: '100' },
    })
    expect(screen.getByText('288 gr')).toBeTruthy()
  })

  it('warns in Simple mode about changed advanced values and can reset them', async () => {
    render(<SetupPanels />)
    expect(screen.queryByRole('status')).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: 'Advanced' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Tiller slider' }), {
      target: { value: '8' },
    })
    fireEvent.change(screen.getByRole('slider', { name: 'Nock weight slider' }), {
      target: { value: '12' },
    })
    expect(screen.queryByRole('status')).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: 'Simple' }))
    const notice = screen.getByRole('status')
    expect(notice.textContent).toContain('2 advanced values are changed')
    expect(setup().bow.tiller).toBe(8)

    await userEvent.click(within(notice).getByRole('button', { name: 'Reset them' }))
    expect(screen.queryByRole('status')).toBeNull()
    expect(setup().bow.tiller).toBe(4)
    expect(setup().arrow.nockWeight).toBeCloseTo(convert(9, 'gr', 'g'), 9)
  })

  it('names the hidden values that Simple mode assumes', async () => {
    render(<SetupPanels />)
    const assumed = screen.getByRole('region', { name: 'Simple mode assumes 19 more values' })
    expect(assumed.textContent).toContain(
      'Plunger preload 1.0 mm, String mass 105 gr, Insert weight 12 gr and 16 more',
    )
    expect(within(assumed).queryByText('Tiller')).toBeNull()

    await userEvent.click(within(assumed).getByRole('button', { name: 'See all of them' }))
    for (const parameter of PARAMETERS.filter(
      (parameter) => parameter.tier === 'advanced' && parameter.group !== 'curve',
    )) {
      expect(within(assumed).getByText(parameter.label), parameter.key).toBeTruthy()
    }
    expect(within(assumed).getByText('Normal')).toBeTruthy()

    await userEvent.click(within(assumed).getByRole('button', { name: 'Enter my own values' }))
    expect(useTuningStore.getState().mode).toBe('advanced')
    expect(screen.queryByRole('region', { name: /Simple mode assumes/ })).toBeNull()
  })

  it('shows the assumed values in the chosen units', () => {
    useTuningStore.setState({ units: 'metric' })
    render(<SetupPanels />)
    expect(screen.getByRole('region', { name: /Simple mode assumes/ }).textContent).toContain(
      'Insert weight 0.78 g',
    )
    useTuningStore.setState({ units: 'archery' })
  })

  it('opens Advanced mode from the notice', async () => {
    useTuningStore.getState().setParameter('bow.tiller', 8)
    render(<SetupPanels />)
    await userEvent.click(screen.getByRole('button', { name: 'Show them' }))
    expect(useTuningStore.getState().mode).toBe('advanced')
    expect(screen.getByRole('slider', { name: 'Tiller slider' })).toBeTruthy()
  })
})
