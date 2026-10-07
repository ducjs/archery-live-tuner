// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { SideView, type SightOnBow } from './SideView.tsx'

afterEach(cleanup)

const result = heuristicModel.simulate(createDefaultSetup())

function draw(sight?: SightOnBow) {
  const { container } = render(
    <SideView result={result} impact="one" time={-1} exaggeration={2} sight={sight} />,
  )
  return container
}

const sightAt = (pinHeight: number, status: SightOnBow['status'] = 'clear'): SightOnBow => ({
  extension: 150,
  pinHeight,
  pinDiameter: 12,
  status,
})

describe('the sight on the bow in the side view', () => {
  it('is not drawn unless asked for', () => {
    expect(draw().querySelector('[data-sight]')).toBeNull()
  })

  it('draws the extension, the bar and the pin, and says how much room there is', () => {
    const sight = draw(sightAt(80)).querySelector('[data-sight]')!
    expect(sight.getAttribute('data-sight')).toBe('clear')
    expect(sight.querySelector('path')).toBeTruthy()
    expect(sight.querySelector('circle')).toBeTruthy()
  })

  it('puts the pin lower for a mark that is lower, and further out for a longer extension', () => {
    const pin = (sight: SightOnBow) => {
      const circle = draw(sight).querySelector('[data-sight] circle')!
      cleanup()
      return { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) }
    }
    const high = pin(sightAt(80))
    const low = pin(sightAt(20))
    // Down the screen is a larger y.
    expect(low.y).toBeGreaterThan(high.y)
    expect(low.x).toBe(high.x)
    expect(pin({ ...sightAt(80), extension: 250 }).x).toBeGreaterThan(high.x)
  })

  it('marks a pin that is close to the arrow or in its way, not by color alone', () => {
    for (const status of ['close', 'blocked'] as const) {
      const sight = draw(sightAt(5, status)).querySelector('[data-sight]')!
      expect(sight.getAttribute('data-sight')).toBe(status)
      cleanup()
    }
    // In the way, the pin is filled; otherwise it is a ring.
    const blocked = draw(sightAt(-4, 'blocked')).querySelector('[data-sight] circle')!
    expect(blocked.getAttribute('class')).toContain('fill-weak')
  })
})
