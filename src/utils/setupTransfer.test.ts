import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { heuristicModel } from '../engine/index.ts'
import { PARAMETERS, getParameter, getValue, setValue } from '../models/parameters.ts'
import { setupArbitrary } from '../models/setup.arbitrary.ts'
import { createDefaultSetup, sameSetup, type TuningSetup } from '../models/setup.ts'
import {
  decodeSetup,
  encodeSetup,
  exportSetups,
  importSetups,
  readSharedSetup,
  setupLink,
} from './setupTransfer.ts'

const reference = createDefaultSetup('Indoor bow')
const weak = {
  ...setValue(reference, getParameter('arrow.spine'), 900),
  id: 'weak-one',
  name: 'Weak one',
}

function toCode(payload: unknown): string {
  return btoa(JSON.stringify(payload)).replace(/=+$/, '')
}

describe('setup link', () => {
  it('brings back every value exactly, under an id of its own', () => {
    fc.assert(
      fc.property(setupArbitrary, (values) => {
        const setup: TuningSetup = { ...reference, ...values }
        const decoded = decodeSetup(encodeSetup(setup))!
        for (const parameter of PARAMETERS) {
          // Compared with ===, since JSON has no negative zero.
          expect(getValue(decoded, parameter) === getValue(setup, parameter), parameter.key).toBe(
            true,
          )
        }
        expect(decoded.id).not.toBe(setup.id)
      }),
    )
  })

  it('gives the same model result on the other side', () => {
    const decoded = decodeSetup(encodeSetup(weak))!
    expect(heuristicModel.analyze(decoded)).toEqual(heuristicModel.analyze(weak))
  })

  it('keeps a name with Vietnamese letters, and fits in an address', () => {
    const named = { ...weak, name: 'Cung tập 18 m của Đức' }
    const code = encodeSetup(named)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeSetup(code)!.name).toBe('Cung tập 18 m của Đức')
  })

  it('reads the setup out of a page address', () => {
    const link = setupLink(weak, { origin: 'https://example.test', pathname: '/tuner/' })
    expect(link.startsWith('https://example.test/tuner/?s=')).toBe(true)
    const shared = readSharedSetup(new URL(link).search)
    expect(shared).not.toBe('unreadable')
    expect(sameSetup(shared as TuningSetup, weak)).toBe(true)
  })

  it('finds nothing in an address without a setup', () => {
    expect(readSharedSetup('')).toBeNull()
    expect(readSharedSetup('?other=1')).toBeNull()
  })

  it('uses the default for a value the link does not name', () => {
    const decoded = decodeSetup(toCode({ v: 1, n: 'Short', p: { 'arrow.spine': 500 } }))!
    expect(decoded.arrow.spine).toBe(500)
    expect(decoded.bow.drawWeight).toBe(reference.bow.drawWeight)
  })

  it.each([
    ['text that is not a code', 'not a setup!'],
    ['a code that is not a setup', toCode([1, 2, 3])],
    ['another version of the format', toCode({ v: 2, n: 'x', p: {} })],
    ['a value out of range', toCode({ v: 1, n: 'x', p: { 'arrow.spine': 5 } })],
    ['a value of the wrong kind', toCode({ v: 1, n: 'x', p: { 'arrow.spine': 'stiff' } })],
    ['a setup without a name', toCode({ v: 1, p: {} })],
  ])('refuses %s', (_, code) => {
    expect(decodeSetup(code)).toBeNull()
    expect(readSharedSetup(`?s=${encodeURIComponent(code)}`)).toBe('unreadable')
  })
})

describe('backup file', () => {
  it('brings back the setups it was made from', () => {
    const result = importSetups(exportSetups([reference, weak]), [])!
    expect(result).toEqual({ added: [reference, weak], known: 0, invalid: 0 })
  })

  it('skips what is already saved', () => {
    const result = importSetups(exportSetups([reference, weak]), [reference])!
    expect(result.added).toEqual([weak])
    expect(result.known).toBe(1)
  })

  it('never takes the place of a saved setup that has since changed', () => {
    const changed = setValue(reference, getParameter('arrow.spine'), 600)
    const result = importSetups(exportSetups([reference]), [changed])!
    expect(result.added).toHaveLength(1)
    expect(result.added[0]!.id).not.toBe(reference.id)
    expect(result.added[0]!.arrow.spine).toBe(reference.arrow.spine)
  })

  it('counts entries it cannot read and keeps the rest', () => {
    const broken = { ...weak, arrow: { ...weak.arrow, spine: -1 } }
    const text = JSON.stringify({ setups: [reference, broken, 'nonsense'] })
    const result = importSetups(text, [])!
    expect(result.added).toEqual([reference])
    expect(result.invalid).toBe(2)
  })

  it('takes a single setup as JSON, and a bare list', () => {
    expect(importSetups(JSON.stringify(weak), [])!.added).toEqual([weak])
    expect(importSetups(JSON.stringify([reference, weak]), [])!.added).toHaveLength(2)
  })

  it('refuses text that is not JSON, or has no list of setups', () => {
    expect(importSetups('not json', [])).toBeNull()
    expect(importSetups(JSON.stringify({ setups: 'none' }), [])).toBeNull()
  })
})
