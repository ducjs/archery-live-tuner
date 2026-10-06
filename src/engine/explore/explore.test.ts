import { describe, expect, it } from 'vitest'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { heuristicModel } from '../simulation/simulate.ts'
import { LANDSCAPE_POINTS, LANDSCAPE_SPINES, explore, landscape, sensitivity } from './explore.ts'

const reference = createDefaultSetup('Reference')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

describe('landscape', () => {
  const grid = landscape(heuristicModel, reference)

  it('covers every spine and point weight', () => {
    expect(grid).toHaveLength(LANDSCAPE_SPINES.length)
    for (const row of grid) expect(row).toHaveLength(LANDSCAPE_POINTS.length)
  })

  it('is neutral at the reference cell, stiffer above it and weaker below', () => {
    const column = LANDSCAPE_POINTS.indexOf(120)
    const row = LANDSCAPE_SPINES.indexOf(700)
    expect(grid[row]![column]!.rating).toBe('NEUTRAL')
    expect(grid[row]![column]!.behavior).toBeCloseTo(0, 9)
    expect(grid[0]![column]!.rating).toBe('STIFF')
    expect(grid.at(-1)![column]!.rating).toBe('WEAK')
  })

  it('gets weaker along a row as the point gets heavier', () => {
    for (const row of grid) {
      const behaviors = row.map((cell) => cell.behavior)
      expect(behaviors).toEqual([...behaviors].sort((a, b) => b - a))
    }
  })

  it('moves the neutral band to stiffer shafts on a heavier bow', () => {
    const column = LANDSCAPE_POINTS.indexOf(120)
    const neutralSpines = (setup: TuningSetup) =>
      landscape(heuristicModel, setup)
        .map((row) => row[column]!)
        .filter((cell) => cell.rating === 'NEUTRAL')
        .map((cell) => cell.spine)
    const light = Math.max(...neutralSpines(reference))
    const heavy = Math.max(...neutralSpines(withDisplay(reference, 'bow.drawWeight', 48)))
    expect(heavy).toBeLessThan(light)
  })

  it('leaves the setup it was given as it was', () => {
    const before = JSON.stringify(reference)
    landscape(heuristicModel, reference)
    expect(JSON.stringify(reference)).toBe(before)
  })
})

describe('sensitivity', () => {
  const entries = sensitivity(heuristicModel, reference)

  it('ranks by size of effect, with the sign archers expect', () => {
    const sizes = entries.map((entry) => Math.abs(entry.effect))
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a))

    const effect = (key: string) => entries.find((entry) => entry.key === key)!.effect
    expect(effect('arrow.spine')).toBeLessThan(0)
    expect(effect('bow.drawWeight')).toBeLessThan(0)
    expect(effect('bow.braceHeight')).toBeLessThan(0)
    expect(effect('arrow.pointWeight')).toBeLessThan(0)
  })

  it('leaves out values that do not move weak and stiff', () => {
    const keys = entries.map((entry) => entry.key)
    expect(keys).not.toContain('bow.nockingPointHeight')
    expect(keys).not.toContain('arrow.shaftDiameter')
  })

  it('still reports a value that has no room to go up', () => {
    const heaviest = withDisplay(reference, 'bow.drawWeight', 80)
    const drawWeight = sensitivity(heuristicModel, heaviest).find(
      (entry) => entry.key === 'bow.drawWeight',
    )!
    // Measured by stepping down, reported as the effect of going up.
    expect(drawWeight.effect).toBeLessThan(0)
  })
})

describe('explore', () => {
  it('gives both views, and survives the trip to and from a worker', () => {
    const result = explore(heuristicModel, reference)
    expect(result.landscape).toEqual(landscape(heuristicModel, reference))
    expect(result.sensitivity).toEqual(sensitivity(heuristicModel, reference))
    // What a worker posts is copied structurally; nothing in it may be lost on the way.
    expect(structuredClone(result)).toEqual(result)
  })
})
