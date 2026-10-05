import { describe, expect, it } from 'vitest'
import { convert } from '../utils/units.ts'
import { arrowTotalMass } from './arrow.ts'
import {
  PARAMETERS,
  defaultValues,
  fromDisplay,
  getParameter,
  getValue,
  modifiedParameters,
  setValue,
  toDisplay,
  type NumberParameter,
} from './parameters.ts'
import { SETUP_SCHEMA_VERSION, createDefaultSetup } from './setup.ts'

function numberParameter(key: string): NumberParameter {
  const parameter = getParameter(key)
  if (parameter.kind !== 'number') throw new Error(`${key} is not a number parameter`)
  return parameter
}

describe('parameter table', () => {
  it('has unique keys', () => {
    const keys = PARAMETERS.map((parameter) => parameter.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keeps every default inside its bounds', () => {
    for (const parameter of PARAMETERS) {
      if (parameter.kind === 'enum') {
        expect(parameter.options, parameter.key).toContain(parameter.default)
      } else {
        expect(parameter.min, parameter.key).toBeLessThan(parameter.max)
        expect(parameter.default, parameter.key).toBeGreaterThanOrEqual(parameter.min)
        expect(parameter.default, parameter.key).toBeLessThanOrEqual(parameter.max)
      }
    }
  })

  it('stores bounds in internal units', () => {
    const drawWeight = numberParameter('bow.drawWeight')
    expect(drawWeight.unit).toBe('N')
    expect(drawWeight.default).toBeCloseTo(convert(38, 'lbf', 'N'), 9)
    expect(numberParameter('bow.braceHeight').default).toBeCloseTo(220, 9)
    expect(numberParameter('arrow.length').default).toBeCloseTo(685.8, 9)
  })

  it('puts the basic tuning inputs in the simple tier', () => {
    const simple = PARAMETERS.filter((parameter) => parameter.tier === 'simple').map(
      (parameter) => parameter.key,
    )
    expect(simple).toEqual([
      'bow.handedness',
      'bow.drawWeight',
      'bow.drawLength',
      'bow.braceHeight',
      'bow.nockingPointHeight',
      'bow.centerShot',
      'bow.plungerStiffness',
      'arrow.length',
      'arrow.spine',
      'arrow.pointWeight',
    ])
  })

  it('rejects unknown keys', () => {
    expect(() => getParameter('bow.nope')).toThrow(/Unknown parameter/)
  })
})

describe('setup values', () => {
  it('builds defaults that every parameter can read back', () => {
    const values = defaultValues()
    for (const parameter of PARAMETERS) {
      expect(getValue(values, parameter), parameter.key).toBe(parameter.default)
    }
  })

  it('reads nested values', () => {
    const values = defaultValues()
    expect(values.bow.string.strandCount).toBe(16)
    expect(values.bow.string.nockFit).toBe('NORMAL')
  })

  it('sets a value without mutating the input', () => {
    const before = defaultValues()
    const strands = getParameter('bow.string.strandCount')
    const after = setValue(before, strands, 18)

    expect(after.bow.string.strandCount).toBe(18)
    expect(before.bow.string.strandCount).toBe(16)
    expect(after.arrow).toBe(before.arrow)
    expect(after.bow.string.nockFit).toBe('NORMAL')
  })

  it('reports which parameters differ from their defaults', () => {
    let values = defaultValues()
    expect(modifiedParameters(values)).toEqual([])

    values = setValue(values, getParameter('bow.tiller'), 6)
    values = setValue(values, getParameter('arrow.spine'), 600)

    expect(modifiedParameters(values).map((parameter) => parameter.key)).toEqual([
      'bow.tiller',
      'arrow.spine',
    ])
    expect(modifiedParameters(values, 'advanced').map((parameter) => parameter.key)).toEqual([
      'bow.tiller',
    ])
  })

  it('converts to and from display units', () => {
    const drawWeight = numberParameter('bow.drawWeight')
    expect(toDisplay(drawWeight, drawWeight.default)).toBeCloseTo(38, 9)
    expect(toDisplay(drawWeight, drawWeight.default, 'kgf')).toBeCloseTo(17.2365, 4)
    expect(fromDisplay(drawWeight, 40)).toBeCloseTo(convert(40, 'lbf', 'N'), 9)

    const spine = numberParameter('arrow.spine')
    expect(toDisplay(spine, 700)).toBe(700)
    expect(fromDisplay(spine, 700)).toBe(700)
  })
})

describe('createDefaultSetup', () => {
  it('creates a complete setup with a fresh id', () => {
    const first = createDefaultSetup('Reference')
    const second = createDefaultSetup()

    expect(first.name).toBe('Reference')
    expect(second.name).toBe('New setup')
    expect(first.schemaVersion).toBe(SETUP_SCHEMA_VERSION)
    expect(first.id).not.toBe(second.id)
    expect(first.bow.handedness).toBe('RH')
  })
})

describe('arrowTotalMass', () => {
  it('sums shaft and components for the reference arrow', () => {
    // 27 in x 6 gpi = 162 gr shaft, plus 120 + 12 + 9 + 5 gr of components.
    const { arrow } = defaultValues()
    expect(convert(arrowTotalMass(arrow), 'g', 'gr')).toBeCloseTo(308, 6)
  })
})
