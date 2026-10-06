// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Roadmap } from './Roadmap.tsx'
import { PINNED, ROADMAP, countItems } from './roadmapData.ts'

afterEach(cleanup)

describe('Roadmap page', () => {
  it('is marked as Vietnamese and shows the overall progress', () => {
    render(<Roadmap />)
    expect(screen.getByRole('main').getAttribute('lang')).toBe('vi')
    expect(screen.getByRole('heading', { level: 1, name: 'Lộ trình phát triển' })).toBeTruthy()

    const all = countItems(ROADMAP.flatMap((phase) => phase.groups))
    expect(screen.getByText(String(all.total))).toBeTruthy()
  })

  it('pins the tasks that wait on the owner above the phases', () => {
    render(<Roadmap />)
    const pinned = screen.getByRole('region', { name: 'Việc cần bạn làm' })
    for (const task of PINNED) {
      expect(within(pinned).getByText(task.text)).toBeTruthy()
      expect(within(pinned).getByText(task.why)).toBeTruthy()
    }
    const firstPhase = document.getElementById(ROADMAP[0]!.id)!
    expect(
      pinned.compareDocumentPosition(firstPhase) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('lists every phase in the side navigation and as a section', () => {
    render(<Roadmap />)
    const navigation = within(screen.getByRole('navigation', { name: 'Các giai đoạn' }))
    for (const phase of ROADMAP) {
      const link = navigation.getByRole('link', { name: new RegExp(`^${phase.version} `) })
      expect(link.getAttribute('href')).toBe(`#${phase.id}`)
      expect(document.getElementById(phase.id)).toBeTruthy()
    }
    expect(navigation.getAllByRole('link', { current: 'step' })).toHaveLength(1)
  })

  it('opens only the unfinished lists of the current phase', () => {
    const { container } = render(<Roadmap />)
    const open = [...container.querySelectorAll('details[open] summary')].map(
      (summary) => summary.textContent,
    )
    expect(open).toHaveLength(2)
    expect(open[0]).toContain('M7.')
    expect(open[1]).toContain('M8.')
  })

  it('says in words whether an item is done', () => {
    render(<Roadmap />)
    expect(screen.getAllByText('Đã xong:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Chưa làm:').length).toBeGreaterThan(0)
  })
})
