import { describe, expect, it } from 'vitest'
import { bareShaftReading } from './bareShaftReading.ts'

describe('bareShaftReading', () => {
  it('reads a shared impact as a matched setup', () => {
    expect(bareShaftReading({ horizontal: 'TOGETHER', vertical: 'TOGETHER' }, 'RH')).toEqual({
      landing: 'The bare shaft lands with the fletched arrows.',
      meaning: 'That reads as a matched setup.',
    })
  })

  it('reads the side by handedness', () => {
    const right = { horizontal: 'RIGHT', vertical: 'TOGETHER' } as const
    expect(bareShaftReading(right, 'RH')).toEqual({
      landing: 'The bare shaft lands to the right of the fletched arrows.',
      meaning: 'That reads as a weak arrow.',
    })
    expect(bareShaftReading(right, 'LH').meaning).toBe('That reads as a stiff arrow.')

    const left = { horizontal: 'LEFT', vertical: 'TOGETHER' } as const
    expect(bareShaftReading(left, 'RH').meaning).toBe('That reads as a stiff arrow.')
    expect(bareShaftReading(left, 'LH').meaning).toBe('That reads as a weak arrow.')
  })

  it('reads the height as nocking point', () => {
    expect(bareShaftReading({ horizontal: 'TOGETHER', vertical: 'LOW' }, 'RH')).toEqual({
      landing: 'The bare shaft lands below the fletched arrows.',
      meaning: 'That reads as a nocking point that is too high.',
    })
    expect(bareShaftReading({ horizontal: 'TOGETHER', vertical: 'HIGH' }, 'RH').meaning).toBe(
      'That reads as a nocking point that is too low.',
    )
  })

  it('combines both directions', () => {
    expect(bareShaftReading({ horizontal: 'LEFT', vertical: 'HIGH' }, 'RH')).toEqual({
      landing: 'The bare shaft lands above and to the left of the fletched arrows.',
      meaning: 'That reads as a stiff arrow and a nocking point that is too low.',
    })
  })
})
