import { describe, expect, it } from 'vitest'
import { PARAMETERS } from '../models/parameters.ts'
import { en } from './en.ts'
import { MESSAGES, parameterText } from './index.ts'
import { vi } from './vi.ts'

/** Dotted paths of every text in a dictionary. */
function paths(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix]
  return Object.entries(node).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('dictionaries', () => {
  it('has the same texts in every language', () => {
    // Hints are optional per parameter, so parameters are checked on their own below.
    const shape = (messages: typeof en) => paths({ ...messages, parameter: null }).sort()
    expect(shape(vi)).toEqual(shape(en))
  })

  it.each(Object.keys(MESSAGES) as (keyof typeof MESSAGES)[])(
    'names every parameter and every choice in %s',
    (language) => {
      const m = MESSAGES[language]
      for (const parameter of PARAMETERS) {
        const text = m.parameter[parameter.key]
        expect(text?.label, parameter.key).toBeTruthy()
        expect(Boolean(text?.hint), `${parameter.key} hint`).toBe(Boolean(parameter.hint))
        if (parameter.kind === 'enum') {
          expect(Object.keys(text?.options ?? {})).toEqual([...parameter.options])
        }
      }
    },
  )

  it('falls back to English for a parameter without a translation', () => {
    const parameter = PARAMETERS[0]!
    expect(parameterText({ ...vi, parameter: {} }, parameter).label).toBe(parameter.label)
  })

  it('writes the texts that take values', () => {
    expect(vi.panels.advancedChanged(2)).toBe(
      '2 thông số nâng cao đã đổi và vẫn ảnh hưởng tới kết quả.',
    )
    expect(en.panels.advancedChanged(1)).toBe(
      '1 advanced value is changed and still affects the result.',
    )
    expect(vi.suggestions.value('4.0 mm', '9.0 mm')).toBe('Thử khoảng 4.0 mm. Hiện là 9.0 mm.')
    expect(vi.bareShaft.landing(['cao hơn', 'lệch trái'])).toBe(
      'Bareshaft cắm cao hơn và lệch trái so với cụm tên có cánh.',
    )
  })
})
