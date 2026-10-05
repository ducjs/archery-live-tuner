import type { Suggestion } from '../../engine/index.ts'
import { parameterText, type Messages } from '../../i18n/index.ts'
import {
  formatValue,
  getParameter,
  type NumberParameter,
  type UnitSystem,
} from '../../models/parameters.ts'
import type { BareShaftComparison, TuningClassification } from '../../models/simulation.ts'

export type Reading = {
  classification: TuningClassification
  horizontal: BareShaftComparison['horizontal']
  vertical: BareShaftComparison['vertical']
}

export type SuggestionText = {
  action: string
  /** Suggested and current value, with unit. */
  value: string
  effort: string
  /** What the model reports differently after the change. */
  effects: string[]
}

export function describeSuggestion(
  suggestion: Suggestion,
  before: Reading,
  m: Messages,
  units: UnitSystem = 'archery',
): SuggestionText {
  const parameter = getParameter(suggestion.parameterKey) as NumberParameter
  const show = (value: number) => formatValue(parameter, value, units)
  const text = m.suggestions

  const { after } = suggestion
  const effects: string[] = []
  const rated = (title: string, key: keyof TuningClassification) => {
    const from = before.classification[key]
    const to = after.classification[key]
    if (from !== to) {
      effects.push(text.goes(title, m.rating[from].toLowerCase(), m.rating[to].toLowerCase()))
    }
  }
  rated(m.result.stiffness, 'stiffness')
  rated(m.result.lateral, 'lateral')
  rated(m.result.vertical, 'vertical')
  rated(m.result.oscillation, 'oscillation')
  rated(m.result.clearance, 'clearance')
  if (before.horizontal !== after.horizontal) {
    effects.push(text.bareLands(text.bareHorizontal[after.horizontal]))
  }
  if (before.vertical !== after.vertical) {
    effects.push(text.bareLands(text.bareVertical[after.vertical]))
  }
  if (effects.length === 0) effects.push(text.closer)

  return {
    action:
      text.actions[suggestion.parameterKey]?.[suggestion.direction] ??
      parameterText(m, parameter).label,
    value: text.value(show(suggestion.to), show(suggestion.from)),
    effort: text.effort[suggestion.effort],
    effects,
  }
}
