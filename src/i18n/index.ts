import type { Parameter } from '../models/parameters.ts'
import { en, type Messages, type ParameterText } from './en.ts'
import { vi } from './vi.ts'

export type { Messages } from './en.ts'
export type Language = 'en' | 'vi'

export const MESSAGES: Record<Language, Messages> = { en, vi }

/** The language the browser asks for, if it is one we have. English otherwise. */
export function detectLanguage(): Language {
  const asked = typeof navigator === 'undefined' ? '' : navigator.language
  return asked.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

/** Label, hint and choice labels of a parameter. Falls back to the English text. */
export function parameterText(m: Messages, parameter: Parameter): ParameterText {
  return m.parameter[parameter.key] ?? en.parameter[parameter.key] ?? { label: parameter.label }
}
