import { describe, expect, it } from 'vitest'
import { PARAMETERS, getParameter, setValue, type NumberParameter } from '../models/parameters.ts'
import { createDefaultSetup } from '../models/setup.ts'
import { clampValue, isValidValue, parseSetup } from './validation.ts'

const drawWeight = getParameter('bow.drawWeight') as NumberParameter
const strands = getParameter('bow.string.strandCount') as NumberParameter

describe('parseSetup', () => {
  it('accepts the default setup', () => {
    const setup = createDefaultSetup()
    const result = parseSetup(setup)
    expect(result).toEqual({ ok: true, setup })
  })

  it('accepts a setup that went through JSON', () => {
    const setup = createDefaultSetup()
    const result = parseSetup(JSON.parse(JSON.stringify(setup)))
    expect(result.ok).toBe(true)
  })

  it('accepts every parameter at its bounds', () => {
    for (const parameter of PARAMETERS) {
      if (parameter.kind !== 'number') continue
      for (const value of [parameter.min, parameter.max]) {
        const setup = setValue(createDefaultSetup(), parameter, value)
        expect(parseSetup(setup).ok, `${parameter.key} = ${value}`).toBe(true)
      }
    }
  })

  it('reports the path of an out-of-range value', () => {
    const setup = setValue(createDefaultSetup(), drawWeight, drawWeight.max + 1)
    const result = parseSetup(setup)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual(['bow.drawWeight'])
    }
  })

  it('rejects non-finite numbers, wrong types and unknown options', () => {
    const base = createDefaultSetup()
    expect(parseSetup(setValue(base, drawWeight, Number.NaN)).ok).toBe(false)
    expect(parseSetup(setValue(base, drawWeight, Number.POSITIVE_INFINITY)).ok).toBe(false)
    expect(parseSetup(setValue(base, drawWeight, '38')).ok).toBe(false)
    expect(parseSetup(setValue(base, getParameter('bow.handedness'), 'XX')).ok).toBe(false)
    expect(parseSetup(setValue(base, strands, 16.5)).ok).toBe(false)
  })

  it('rejects missing fields and a wrong schema version', () => {
    const base = createDefaultSetup()
    const { string: _string, ...bowWithoutString } = base.bow
    const missing = parseSetup({ ...base, bow: bowWithoutString })
    expect(missing.ok).toBe(false)
    if (!missing.ok) {
      expect(missing.issues.map((issue) => issue.path)).toEqual(['bow.string'])
    }

    expect(parseSetup({ ...base, schemaVersion: 99 }).ok).toBe(false)
    expect(parseSetup({ ...base, name: '   ' }).ok).toBe(false)
    expect(parseSetup(null).ok).toBe(false)
  })

  it('opens a setup saved before measured forces existed', () => {
    const current = createDefaultSetup()
    const { drawForceNear: _near, drawForceMid: _mid, ...oldBow } = current.bow
    const parsed = parseSetup({ ...current, bow: oldBow })
    expect(parsed.ok && parsed.setup.bow.drawForceNear).toBe(0)
    expect(parsed.ok && parsed.setup.bow.drawForceMid).toBe(0)
  })

  it('drops unknown fields', () => {
    const result = parseSetup({ ...createDefaultSetup(), extra: 1 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.setup).not.toHaveProperty('extra')
    }
  })
})

describe('isValidValue', () => {
  it('checks a single value against its parameter', () => {
    expect(isValidValue(drawWeight, drawWeight.default)).toBe(true)
    expect(isValidValue(drawWeight, drawWeight.min - 0.001)).toBe(false)
    expect(isValidValue(getParameter('bow.string.nockFit'), 'TIGHT')).toBe(true)
    expect(isValidValue(getParameter('bow.string.nockFit'), 'tight')).toBe(false)
  })
})

describe('clampValue', () => {
  it('forces values into bounds', () => {
    expect(clampValue(drawWeight, 1e9)).toBe(drawWeight.max)
    expect(clampValue(drawWeight, -1e9)).toBe(drawWeight.min)
    expect(clampValue(drawWeight, drawWeight.default)).toBe(drawWeight.default)
  })

  it('rounds integer parameters and replaces non-finite input with the default', () => {
    expect(clampValue(strands, 17.6)).toBe(18)
    expect(clampValue(strands, Number.NaN)).toBe(strands.default)
  })
})

describe('setups stored before a parameter was added', () => {
  const current = createDefaultSetup('Old one')

  it('get the default for what they lack, and keep what they have', () => {
    const { riserSize: _riser, limbAlignmentTop: _top, ...oldBow } = current.bow
    const old = { ...current, bow: { ...oldBow, drawWeight: 150 } }
    const parsed = parseSetup(old)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.setup.bow.riserSize).toBe('H25')
    expect(parsed.setup.bow.limbAlignmentTop).toBe(0)
    expect(parsed.setup.bow.drawWeight).toBe(150)
  })

  it('get a missing value inside the string group too', () => {
    const { nockFit: _fit, ...oldString } = current.bow.string
    const parsed = parseSetup({ ...current, bow: { ...current.bow, string: oldString } })
    expect(parsed.ok && parsed.setup.bow.string.nockFit).toBe('NORMAL')
  })

  it('are still refused when a value is wrong, not missing', () => {
    expect(parseSetup({ ...current, bow: { ...current.bow, riserSize: 'H99' } }).ok).toBe(false)
    expect(parseSetup({ ...current, bow: 'none' }).ok).toBe(false)
    expect(parseSetup(null).ok).toBe(false)
  })

  it('opens a setup saved before the draw force curve existed', () => {
    const current = createDefaultSetup()
    const { drawCurve: _left, ...oldBow } = current.bow
    const parsed = parseSetup({ ...current, bow: oldBow })
    expect(parsed.ok && parsed.setup.bow.drawCurve).toBe('STANDARD')
  })
})
