import { describe, expect, it } from 'vitest'
import { convert } from './units.ts'
import { BOLT_RANGE, onFingers } from './markedDrawWeight.ts'

const lb = (value: number) => convert(value, 'lbf', 'N')
const inches = (value: number) => convert(value, 'in', 'mm')

describe('marked draw weight (§39.6)', () => {
  it('is the marked weight at 28 in with the limb bolts in the middle', () => {
    expect(onFingers(lb(38), inches(28), 0)).toBeCloseTo(lb(38), 9)
  })

  it('gains 5% per inch of draw beyond 28 in, and loses it short of 28 in', () => {
    expect(onFingers(lb(40), inches(29), 0)).toBeCloseTo(lb(42), 9)
    expect(onFingers(lb(40), inches(26), 0)).toBeCloseTo(lb(36), 9)
  })

  it('moves by the share the limb bolts are turned', () => {
    expect(onFingers(lb(40), inches(28), BOLT_RANGE)).toBeCloseTo(lb(42), 9)
    expect(onFingers(lb(40), inches(28), -BOLT_RANGE)).toBeCloseTo(lb(38), 9)
  })

  it('stays positive at the shortest draw the app accepts', () => {
    expect(onFingers(lb(20), inches(20), -BOLT_RANGE)).toBeGreaterThan(0)
  })
})
