import type { Effort, Suggestion } from '../../engine/index.ts'
import { getParameter, toDisplay, type NumberParameter } from '../../models/parameters.ts'
import type { BareShaftComparison, TuningClassification } from '../../models/simulation.ts'
import { unitLabel } from '../../utils/units.ts'

const ACTIONS: Record<string, { increase: string; decrease: string }> = {
  'bow.nockingPointHeight': {
    increase: 'Raise the nocking point',
    decrease: 'Lower the nocking point',
  },
  'bow.plungerStiffness': { increase: 'Stiffen the plunger', decrease: 'Soften the plunger' },
  'bow.plungerPreload': { increase: 'Add plunger preload', decrease: 'Reduce plunger preload' },
  'bow.centerShot': {
    increase: 'Move the arrow point to the right',
    decrease: 'Move the arrow point to the left',
  },
  'bow.braceHeight': { increase: 'Raise the brace height', decrease: 'Lower the brace height' },
  'bow.tiller': { increase: 'Increase the tiller', decrease: 'Reduce the tiller' },
  'bow.drawWeight': { increase: 'Increase the draw weight', decrease: 'Reduce the draw weight' },
  'arrow.pointWeight': { increase: 'Use a heavier point', decrease: 'Use a lighter point' },
  'arrow.nockWeight': { increase: 'Use a heavier nock', decrease: 'Use a lighter nock' },
  'arrow.length': { increase: 'Use a longer arrow', decrease: 'Use a shorter arrow' },
  // A higher spine number is a weaker shaft.
  'arrow.spine': { increase: 'Use a weaker shaft', decrease: 'Use a stiffer shaft' },
}

const EFFORT: Record<Effort, string> = {
  bow: 'Adjust on the bow',
  arrowPart: 'Change an arrow part',
  newArrows: 'Needs new arrows',
}

const RATING: Record<string, string> = {
  WEAK: 'weak',
  NEUTRAL: 'neutral',
  STIFF: 'stiff',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  LEFT: 'left',
  RIGHT: 'right',
  NOCK_LOW: 'nock low',
  NOCK_HIGH: 'nock high',
}

const BARE_HORIZONTAL: Record<BareShaftComparison['horizontal'], string> = {
  LEFT: 'left of the group',
  TOGETHER: 'with the group',
  RIGHT: 'right of the group',
}

const BARE_VERTICAL: Record<BareShaftComparison['vertical'], string> = {
  LOW: 'below the group',
  TOGETHER: 'level with the group',
  HIGH: 'above the group',
}

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

function decimalsOf(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

export function describeSuggestion(suggestion: Suggestion, before: Reading): SuggestionText {
  const parameter = getParameter(suggestion.parameterKey) as NumberParameter
  const decimals = decimalsOf(parameter.step)
  const unit = parameter.displayUnit ? ` ${unitLabel(parameter.displayUnit)}` : ''
  const show = (value: number) => `${toDisplay(parameter, value).toFixed(decimals)}${unit}`

  const { after } = suggestion
  const effects: string[] = []
  const rated = (title: string, key: keyof TuningClassification) => {
    const from = before.classification[key]
    const to = after.classification[key]
    if (from !== to) effects.push(`${title} goes from ${RATING[from]} to ${RATING[to]}.`)
  }
  rated('Dynamic behavior', 'stiffness')
  rated('Lateral tendency', 'lateral')
  rated('Vertical tendency', 'vertical')
  rated('Oscillation', 'oscillation')
  rated('Clearance sensitivity', 'clearance')
  if (before.horizontal !== after.horizontal) {
    effects.push(`The bare shaft lands ${BARE_HORIZONTAL[after.horizontal]}.`)
  }
  if (before.vertical !== after.vertical) {
    effects.push(`The bare shaft lands ${BARE_VERTICAL[after.vertical]}.`)
  }
  if (effects.length === 0) effects.push('Moves closer to neutral, without changing a rating.')

  return {
    action: ACTIONS[suggestion.parameterKey]?.[suggestion.direction] ?? parameter.label,
    value: `Try about ${show(suggestion.to)}. It is ${show(suggestion.from)} now.`,
    effort: EFFORT[suggestion.effort],
    effects,
  }
}
