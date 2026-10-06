// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { ROADMAP } from '../roadmap/roadmapData.ts'
import { Demos } from './Demos.tsx'
import { DEMO_TABS, demoTab, isDemoHash } from './demoTabs.ts'

beforeEach(() => {
  localStorage.clear()
  useTuningStore.setState({ setup: createDefaultSetup(), mode: 'simple' })
})

afterEach(cleanup)

describe('demo tabs', () => {
  it('has one tab for every roadmap phase', () => {
    expect(DEMO_TABS.map((tab) => tab.id)).toEqual(ROADMAP.map((phase) => phase.id))
  })

  it('reads the tab from the address', () => {
    expect(isDemoHash('#demo-v0-3')).toBe(true)
    expect(isDemoHash('#roadmap')).toBe(false)
    expect(demoTab('#demo-v0-3').version).toBe('V0.3')
    expect(demoTab('#demo-nope').version).toBe('V0.1')
  })

  it.each(DEMO_TABS)('renders the $version tab, with every card saying how real it is', (tab) => {
    const { container } = render(<Demos hash={`#demo-${tab.id}`} />)
    expect(screen.getByRole('link', { current: 'page' }).textContent).toContain(tab.version)

    const cards = container.querySelectorAll('section')
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      expect(card.textContent).toMatch(/Tính bằng mô hình hiện có|Mô phỏng đơn giản|Dữ liệu giả/)
    }
    expect(container.innerHTML).not.toContain('NaN')
  })
})

describe('demos that do something', () => {
  it('reads the example target and changes its advice with the example', async () => {
    render(<Demos hash="#demo-v0-4" />)
    expect(screen.getByText(/Đọc bia: tên đang yếu\./)).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Ví dụ: nock cao' }))
    expect(screen.getByText(/Đọc bia: nocking point cao\./)).toBeTruthy()
    expect(screen.getByText('Hạ nocking point xuống khoảng 1 mm')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Ví dụ: chưa rõ' }))
    expect(screen.getByText('Chưa kết luận được.')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Xoá hết' }))
    expect(screen.getByText(/Cần ít nhất 3 tên có cánh và 1 bareshaft/)).toBeTruthy()
  })

  it('adds a mark where the target is tapped', () => {
    render(<Demos hash="#demo-v0-4" />)
    const face = screen.getByRole('img', { name: /Mặt bia 40 cm/ })
    const before = face.querySelectorAll('circle[r="0.8"]').length
    fireEvent.click(face, { clientX: 10, clientY: 10 })
    expect(face.querySelectorAll('circle[r="0.8"]').length).toBe(before + 1)
  })

  it('lays out a tuning plan for the sample setup and none for a tuned one', async () => {
    render(<Demos hash="#demo-v0-5" />)
    const plan = screen.getAllByRole('list')[0]!
    expect(within(plan).getAllByRole('listitem').length).toBeGreaterThan(1)

    await userEvent.click(screen.getByRole('button', { name: 'Setup đang mở' }))
    expect(screen.getByText(/Không có bước nào cần làm/)).toBeTruthy()
  })

  it('switches the units demo between systems', async () => {
    render(<Demos hash="#demo-v0-1" />)
    expect(screen.getByText('38.0 lb')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'lb, inch, grain' }))
    expect(screen.getByText('17.2 kg')).toBeTruthy()
  })
})
