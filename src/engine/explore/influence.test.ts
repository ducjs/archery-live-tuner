import { describe, expect, it } from 'vitest'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { heuristicModel as model } from '../index.ts'
import { FINE, influence, setupTone, valueTone } from './influence.ts'

const base = createDefaultSetup()
const drawWeight = getParameter('bow.drawWeight')

describe('what a value does over its range', () => {
  it('reads the reference setup as in order', () => {
    expect(setupTone(model, base)).toBe('good')
  })

  it('has the draw weight in order where it is, and out of order at both ends', () => {
    const found = influence(model, base, drawWeight, FINE)
    expect(found.now).toBe('good')
    expect(found.lever).toBe(true)
    expect(found.tones.at(0)).toBe('poor')
    expect(found.tones.at(-1)).toBe('poor')
    expect(found.tones).toContain('good')
  })

  it('writes a draw weight far too high as not in order', () => {
    if (drawWeight.kind !== 'number') throw new Error('a number')
    const heavy = setValue(base, drawWeight, drawWeight.max)
    expect(valueTone(influence(model, heavy, drawWeight))).toBe('poor')
  })

  it('leaves a value that changes nothing unmarked, however the setup reads', () => {
    if (drawWeight.kind !== 'number') throw new Error('a number')
    const heavy = setValue(base, drawWeight, drawWeight.max)
    // The mass of the bow does not move the arrow in this model.
    const found = influence(model, heavy, getParameter('bow.bowMass'))
    expect(found.lever).toBe(false)
    expect(valueTone(found)).toBe('plain')
  })

  it('tries every option of a value that is a choice', () => {
    const riser = getParameter('bow.riserSize')
    if (riser.kind !== 'enum') throw new Error('a choice')
    expect(influence(model, base, riser).tones).toHaveLength(riser.options.length)
  })
})
