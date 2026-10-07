import { describe, expect, it } from 'vitest'
import { en } from '../../i18n/en.ts'
import { paperTearReading } from './paperTearReading.ts'

const tear = (
  horizontal: 'LEFT' | 'CLEAN' | 'RIGHT',
  vertical: 'LOW' | 'CLEAN' | 'HIGH',
  clearanceSuspect = false,
) => ({ horizontal, vertical, clearanceSuspect })

describe('paperTearReading', () => {
  it('reads one hole as a matched setup', () => {
    expect(paperTearReading(tear('CLEAN', 'CLEAN'), 'RH', en)).toEqual({
      tearing: 'The point and the fletching go through one hole.',
      meaning: 'That reads as a matched setup.',
    })
  })

  it('reads the side by handedness', () => {
    expect(paperTearReading(tear('RIGHT', 'CLEAN'), 'RH', en)).toEqual({
      tearing: 'The fletching tears to the right of the hole the point made.',
      meaning: 'That reads as a stiff arrow.',
    })
    expect(paperTearReading(tear('RIGHT', 'CLEAN'), 'LH', en).meaning).toBe(
      'That reads as a weak arrow.',
    )
    expect(paperTearReading(tear('LEFT', 'CLEAN'), 'RH', en).meaning).toBe(
      'That reads as a weak arrow.',
    )
    expect(paperTearReading(tear('LEFT', 'CLEAN'), 'LH', en).meaning).toBe(
      'That reads as a stiff arrow.',
    )
  })

  it('reads the height as nocking point', () => {
    expect(paperTearReading(tear('CLEAN', 'HIGH'), 'RH', en)).toEqual({
      tearing: 'The fletching tears above the hole the point made.',
      meaning: 'That reads as a nocking point that is too high.',
    })
    expect(paperTearReading(tear('CLEAN', 'LOW'), 'RH', en).meaning).toBe(
      'That reads as a nocking point that is too low.',
    )
  })

  it('names both directions of a diagonal tear, height first', () => {
    expect(paperTearReading(tear('LEFT', 'HIGH'), 'RH', en)).toEqual({
      tearing: 'The fletching tears above and to the left of the hole the point made.',
      meaning: 'That reads as a weak arrow and a nocking point that is too high.',
    })
  })

  it('adds that the arrow may be touching the bow when clearance is suspect', () => {
    const reading = paperTearReading(tear('CLEAN', 'HIGH', true), 'RH', en)
    expect(reading.clearance).toMatch(/touching the bow/)
    expect(paperTearReading(tear('CLEAN', 'HIGH'), 'RH', en).clearance).toBeUndefined()
  })
})
