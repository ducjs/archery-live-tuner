import fc from 'fast-check'
import { PARAMETERS, setValue, type NumberParameter, type Parameter } from './parameters.ts'
import { createDefaultSetup, type TuningSetup } from './setup.ts'

// Test support: fast-check generators for valid setups.

export function numberValueArbitrary(parameter: NumberParameter): fc.Arbitrary<number> {
  return parameter.integer
    ? fc.integer({ min: parameter.min, max: parameter.max })
    : fc.double({ min: parameter.min, max: parameter.max, noNaN: true })
}

function valueArbitrary(parameter: Parameter): fc.Arbitrary<number | string> {
  return parameter.kind === 'enum'
    ? fc.constantFrom(...parameter.options)
    : numberValueArbitrary(parameter)
}

/** Any setup whose values are all inside their bounds. */
export const setupArbitrary: fc.Arbitrary<TuningSetup> = fc
  .tuple(...PARAMETERS.map(valueArbitrary))
  .map((values) =>
    PARAMETERS.reduce<TuningSetup>(
      (setup, parameter, index) => setValue(setup, parameter, values[index]!),
      { ...createDefaultSetup('Generated'), id: 'generated' },
    ),
  )
