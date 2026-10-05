// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { getParameter, setValue } from '../models/parameters.ts'
import { createDefaultSetup } from '../models/setup.ts'
import { useLibraryStore } from '../state/libraryStore.ts'
import { useTuningStore } from '../state/tuningStore.ts'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
  useTuningStore.setState({
    setup: createDefaultSetup('Indoor bow'),
    mode: 'simple',
    language: 'en',
    units: 'archery',
  })
  useLibraryStore.setState({ saved: [], failed: false })
})

afterEach(cleanup)

const numberInput = (name: string) => screen.getByRole('spinbutton', { name }) as HTMLInputElement
const cells = (row: HTMLElement) =>
  within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)

describe('language', () => {
  it('switches the whole simulator to Vietnamese and back', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Recurve tuning simulator')

    await userEvent.click(screen.getByRole('radio', { name: 'Tiếng Việt' }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mô phỏng tune cung recurve')
    expect(document.documentElement.lang).toBe('vi')
    expect(screen.getByRole('heading', { name: 'Kết quả mô hình' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Gợi ý tune' })).toBeTruthy()
    expect(numberInput('Lực kéo').value).toBe('38.0')
    expect(screen.getByRole('radio', { name: 'Tay phải' })).toHaveProperty('checked', true)
    expect(screen.getByRole('button', { name: 'Chạy lại' })).toBeTruthy()
    expect(screen.getByText(/không thay cho việc tune thực tế/)).toBeTruthy()

    await userEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(numberInput('Draw weight').value).toBe('38.0')
    expect(document.documentElement.lang).toBe('en')
  })

  it('writes the suggestions in Vietnamese', () => {
    useTuningStore.setState({
      setup: setValue(createDefaultSetup(), getParameter('bow.nockingPointHeight'), 9),
      language: 'vi',
    })
    render(<App />)
    const list = screen.getByRole('heading', { name: 'Gợi ý tune' }).closest('section')!
    const first = within(within(list).getAllByRole('listitem')[0]!)
    expect(first.getByText('Hạ nocking point')).toBeTruthy()
    expect(first.getByText('Thử khoảng 4.0 mm. Hiện là 9.0 mm.')).toBeTruthy()
    expect(first.getByText(/Xu hướng lệch dọc đổi từ nock cao sang trung tính\./)).toBeTruthy()
  })
})

describe('units', () => {
  it('shows and takes values in kg, cm and gram', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'kg, cm, g' }))

    const drawWeight = numberInput('Draw weight')
    expect(drawWeight.value).toBe('17.2')
    expect(numberInput('Arrow length').value).toBe('68.6')
    expect(numberInput('Point weight').value).toBe('7.8')

    await userEvent.clear(drawWeight)
    await userEvent.type(drawWeight, '20')
    await userEvent.tab()
    // 20 kg of force, in newtons.
    expect(useTuningStore.getState().setup.bow.drawWeight).toBeCloseTo(196.133, 2)

    await userEvent.click(screen.getByRole('radio', { name: 'lb, in, gr' }))
    expect(numberInput('Draw weight').value).toBe('44.1')
  })
})

describe('compare', () => {
  it('asks for a saved setup first', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Compare' }))
    expect(screen.getByText(/Save a setup first/)).toBeTruthy()
  })

  it('shows the saved setup and the changed one side by side', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved setups (1)')

    const spine = numberInput('Spine')
    await userEvent.clear(spine)
    await userEvent.type(spine, '900')
    await userEvent.tab()
    await userEvent.click(screen.getByRole('button', { name: 'Compare: Indoor bow' }))

    expect(screen.getByRole('radio', { name: 'Compare' })).toHaveProperty('checked', true)
    expect(screen.getAllByRole('img', { name: /^Top view/ })).toHaveLength(2)
    expect(screen.getByText('Saved: Indoor bow')).toBeTruthy()
    expect(screen.getByText('Now: Indoor bow')).toBeTruthy()

    const [inputs, results] = screen.getAllByRole('table')
    expect(cells(within(inputs!).getByRole('row', { name: /Spine/ }))).toEqual(['700', '900'])
    // The header row and the one value that differs.
    expect(within(inputs!).getAllByRole('row')).toHaveLength(2)
    expect(cells(within(results!).getByRole('row', { name: /Dynamic behavior/ }))).toEqual([
      'Neutral',
      'Weak',
    ])

    // One drawing per setup: the "Both" view is not on offer here.
    expect(screen.queryByRole('radio', { name: 'Both' })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Side' }))
    expect(screen.getAllByRole('img', { name: /^Side view/ })).toHaveLength(2)
  })

  it('says when the two setups are the same', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Saved setups (1)')
    await userEvent.click(screen.getByRole('radio', { name: 'Compare' }))
    expect(screen.getByText('Both setups have the same values.')).toBeTruthy()
  })
})

describe('disclaimer', () => {
  it('is on the page', () => {
    render(<App />)
    expect(screen.getByText(/not as a substitute for real-world tuning/)).toBeTruthy()
    expect(screen.getByText(/Everything on this page is a model result/)).toBeTruthy()
  })
})
