import { describe, expect, it } from 'vitest'
import type { TrajectoryPoint } from '../../models/simulation.ts'
import { pointOnArrow, sampleTrajectory, shaftPath, type ArrowPose } from './arrowGeometry.ts'

const trajectory: TrajectoryPoint[] = [
  { t: 0, x: 0, y: 0, z: 0, flex: 1 },
  { t: 1, x: 10, y: 2, z: 4, flex: -1 },
  { t: 2, x: 20, y: 0, z: 8, flex: 0 },
]

describe('sampleTrajectory', () => {
  it('interpolates between samples', () => {
    expect(sampleTrajectory(trajectory, 0.5)).toMatchObject({ x: 5, y: 1, z: 2, flex: 0 })
    expect(sampleTrajectory(trajectory, 1.25)).toMatchObject({ x: 12.5, z: 5, flex: -0.75 })
  })

  it('clamps outside the flight', () => {
    expect(sampleTrajectory(trajectory, -1)).toBe(trajectory[0])
    expect(sampleTrajectory(trajectory, 99)).toBe(trajectory[2])
  })

  it('rejects an empty trajectory', () => {
    expect(() => sampleTrajectory([], 0)).toThrow(/empty/)
  })
})

describe('arrow shape', () => {
  const straight: ArrowPose = { centerX: 100, centerY: 50, length: 80, angle: 0, bend: 0 }

  it('lays a straight arrow along the x axis', () => {
    expect(pointOnArrow(straight, 0)).toEqual({ x: 60, y: 50 })
    expect(pointOnArrow(straight, 1)).toEqual({ x: 140, y: 50 })
  })

  it('bends the middle one way and the ends the other', () => {
    const bent = { ...straight, bend: 10 }
    expect(pointOnArrow(bent, 0.5).y).toBeCloseTo(60, 9)
    expect(pointOnArrow(bent, 0).y).toBeCloseTo(40, 9)
    expect(pointOnArrow(bent, 1).y).toBeCloseTo(40, 9)
    expect(pointOnArrow(bent, 0.25).y).toBeCloseTo(50, 9)
  })

  it('turns the point toward positive y for a positive angle', () => {
    const turned = { ...straight, angle: Math.PI / 2 }
    expect(pointOnArrow(turned, 1).x).toBeCloseTo(100, 9)
    expect(pointOnArrow(turned, 1).y).toBeCloseTo(90, 9)
  })

  it('builds a path with one command per sample', () => {
    const path = shaftPath(straight, 0, 1, 4)
    expect(path.startsWith('M60.00 50.00')).toBe(true)
    expect(path.match(/L/g)).toHaveLength(4)
  })
})
