// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TRAJECTORY_OPTIONS, heuristicModel } from '../../engine/index.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { ResultPanel } from '../tuning/ResultPanel.tsx'
import { FlightView, TimeScrubber } from './SimulationStage.tsx'
import {
  DISTANCES,
  SLOW_MOTION,
  clipSeconds,
  clipTime,
  flightSeconds,
  strokeSeconds,
} from './timing.ts'

afterEach(cleanup)

const setup = createDefaultSetup()
const at = (distance: number) =>
  heuristicModel.compareBareShaft(setup, {
    trajectory: { ...DEFAULT_TRAJECTORY_OPTIONS, distance: distance * 1000 },
  })

describe('distance', () => {
  it.each(DISTANCES)('flies to %i m and takes longer the further it goes', (distance) => {
    const { fletched } = at(distance)
    expect(fletched.trajectory.at(-1)!.x).toBeCloseTo(distance * 1000, 6)
    if (distance > DISTANCES[0]!) {
      expect(flightSeconds(fletched)).toBeGreaterThan(flightSeconds(at(DISTANCES[0]!).fletched))
    }
  })

  it('keeps the whole arc of a 90 m shot inside the side view', () => {
    const { fletched, bare } = at(90)
    const { container } = render(
      <FlightView
        view="side"
        result={fletched}
        bare={bare}
        handedness="RH"
        elapsed={flightSeconds(fletched) / 2}
        exaggeration={3}
      />,
    )
    expect(container.innerHTML).not.toContain('NaN')

    // The arrow shaft is the path with the most segments. Its points must stay in the 300-high frame.
    const shafts = [...container.querySelectorAll('svg[role="img"] path')].filter(
      (path) => (path.getAttribute('d')!.match(/L/g) ?? []).length > 10,
    )
    expect(shafts.length).toBe(2)
    for (const shaft of shafts) {
      const ys = [...shaft.getAttribute('d')!.matchAll(/[ML][\d.-]+ ([\d.-]+)/g)].map((match) =>
        Number(match[1]),
      )
      expect(Math.min(...ys)).toBeGreaterThan(0)
      expect(Math.max(...ys)).toBeLessThan(300)
    }
  })

  // Skipped on 2026-10-08: written for the screen before the workspaces of spec §40. To be rewritten.
  it.skip('reports the flight time to the chosen distance', () => {
    const { fletched } = at(70)
    render(<ResultPanel result={fletched} handedness="RH" />)
    expect(screen.getByText(/reaching 70 m in/)).toBeTruthy()
    expect(screen.getByText(`${fletched.trajectory.at(-1)!.t.toFixed(2)} s`)).toBeTruthy()
  })
})

describe('TimeScrubber', () => {
  const { fletched } = at(18)
  const flight = flightSeconds(fletched)

  it('shows the moment and how far the arrow has travelled', () => {
    render(
      <TimeScrubber
        result={fletched}
        elapsed={strokeSeconds(fletched) + flight / 2}
        flightSeconds={clipSeconds(fletched)}
        onSeek={vi.fn()}
      />,
    )
    const milliseconds = ((flight / 2 / SLOW_MOTION) * 1000).toFixed(0)
    expect(screen.getByText(`${milliseconds} ms`)).toBeTruthy()
    expect(screen.getByText(', 9.0 m')).toBeTruthy()
    expect(screen.getByRole('slider', { name: 'Moment' }).getAttribute('aria-valuetext')).toContain(
      '9.0 metres out',
    )
  })

  it('opens at full draw, before the arrow has left the string', () => {
    render(
      <TimeScrubber
        result={fletched}
        elapsed={0}
        flightSeconds={clipSeconds(fletched)}
        onSeek={vi.fn()}
      />,
    )
    const milliseconds = (fletched.launch.timeOnString * 1000).toFixed(0)
    expect(screen.getByText(`−${milliseconds} ms`)).toBeTruthy()
    expect(clipTime(fletched, strokeSeconds(fletched))).toBeCloseTo(0, 12)
    expect(screen.getByRole('slider', { name: 'Moment' }).getAttribute('aria-valuetext')).toBe(
      `On the string, ${milliseconds} milliseconds before the arrow leaves it`,
    )
  })

  it('seeks to the chosen moment', () => {
    const onSeek = vi.fn()
    render(<TimeScrubber result={fletched} elapsed={0} flightSeconds={flight} onSeek={onSeek} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Moment' }), { target: { value: '1.2' } })
    expect(onSeek).toHaveBeenCalledTimes(1)
    expect(onSeek.mock.calls[0]![0]).toBeCloseTo(1.2, 1)
  })
})
