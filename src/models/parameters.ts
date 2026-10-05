import { convert, unitLabel, type Unit } from '../utils/units.ts'
import type { ArrowSetup } from './arrow.ts'
import type { BowSetup } from './bow.ts'

export type ParameterTier = 'simple' | 'advanced'
export type ParameterGroup = 'bow' | 'arrow'

type ParameterBase = {
  /** Path into the setup, e.g. `bow.string.strandCount`. Also the i18n key. */
  key: string
  group: ParameterGroup
  tier: ParameterTier
  label: string
  /** Short note on the convention the value follows. */
  hint?: string
}

export type NumberParameter = ParameterBase & {
  kind: 'number'
  /** Unit the value is stored in. `null` for dimensionless values. */
  unit: Unit | null
  /** Unit shown by default in the UI. */
  displayUnit: Unit | null
  /** Bounds and default, in the internal unit. UI safety bounds, not equipment limits. */
  min: number
  max: number
  default: number
  /** Slider step, in the display unit. */
  step: number
  integer: boolean
}

export type EnumParameter = ParameterBase & {
  kind: 'enum'
  options: readonly string[]
  optionLabels: Readonly<Record<string, string>>
  default: string
}

export type Parameter = NumberParameter | EnumParameter

type NumberSpec = {
  /** [internal unit, display unit]. Omit for dimensionless values. */
  units?: [Unit, Unit]
  /** min, max and default are written in the display unit. */
  min: number
  max: number
  default: number
  step: number
  integer?: boolean
}

const HINTS: Record<string, string> = {
  'bow.drawWeight': 'Weight on the fingers at full draw.',
  'bow.nockingPointHeight': 'Height above square.',
  'bow.centerShot': 'Arrow point from the string line. Negative is left, positive is right.',
  'bow.plungerStiffness': '0 is very soft, 1 is medium, 2 is very stiff.',
  'bow.tiller': 'Top tiller minus bottom tiller.',
  'bow.bowMass': 'Everything held in the bow hand, stabilizers included.',
  'bow.stabilizerPosition': 'How far in front of the riser the weight sits.',
  'arrow.length': 'Nock groove to the end of the shaft, without the point.',
  'arrow.spine': 'A lower number is a stiffer shaft.',
  'arrow.fletchingWeight': 'All vanes together.',
}

function groupOf(key: string): ParameterGroup {
  return key.startsWith('arrow.') ? 'arrow' : 'bow'
}

function num(key: string, tier: ParameterTier, label: string, spec: NumberSpec): NumberParameter {
  const [unit, displayUnit] = spec.units ?? [null, null]
  const toInternal = (value: number) =>
    unit && displayUnit ? convert(value, displayUnit, unit) : value
  return {
    kind: 'number',
    key,
    group: groupOf(key),
    tier,
    label,
    hint: HINTS[key],
    unit,
    displayUnit,
    min: toInternal(spec.min),
    max: toInternal(spec.max),
    default: toInternal(spec.default),
    step: spec.step,
    integer: spec.integer ?? false,
  }
}

function choice(
  key: string,
  tier: ParameterTier,
  label: string,
  optionLabels: Readonly<Record<string, string>>,
  defaultOption: string,
): EnumParameter {
  return {
    kind: 'enum',
    key,
    group: groupOf(key),
    tier,
    label,
    hint: HINTS[key],
    options: Object.keys(optionLabels),
    optionLabels,
    default: defaultOption,
  }
}

// Defaults follow the development reference setup (spec §19). Tiers follow spec §4.1.
export const PARAMETERS: readonly Parameter[] = [
  choice('bow.handedness', 'simple', 'Handedness', { RH: 'Right-handed', LH: 'Left-handed' }, 'RH'),
  num('bow.drawWeight', 'simple', 'Draw weight', {
    units: ['N', 'lbf'],
    min: 10,
    max: 80,
    default: 38,
    step: 0.5,
  }),
  num('bow.drawLength', 'simple', 'Draw length', {
    units: ['mm', 'in'],
    min: 20,
    max: 35,
    default: 28,
    step: 0.25,
  }),
  num('bow.braceHeight', 'simple', 'Brace height', {
    units: ['mm', 'cm'],
    min: 15,
    max: 30,
    default: 22,
    step: 0.1,
  }),
  num('bow.nockingPointHeight', 'simple', 'Nocking point height', {
    units: ['mm', 'mm'],
    min: -5,
    max: 15,
    default: 4,
    step: 0.5,
  }),
  num('bow.centerShot', 'simple', 'Center shot', {
    units: ['mm', 'mm'],
    min: -5,
    max: 5,
    default: 0,
    step: 0.1,
  }),
  num('bow.plungerStiffness', 'simple', 'Plunger stiffness', {
    min: 0,
    max: 2,
    default: 1,
    step: 0.05,
  }),
  num('bow.tiller', 'advanced', 'Tiller', {
    units: ['mm', 'mm'],
    min: -5,
    max: 15,
    default: 4,
    step: 0.5,
  }),
  num('bow.plungerPreload', 'advanced', 'Plunger preload', {
    units: ['mm', 'mm'],
    min: 0,
    max: 5,
    default: 1,
    step: 0.1,
  }),
  num('bow.bowMass', 'advanced', 'Bow mass', {
    units: ['g', 'kg'],
    min: 1,
    max: 6,
    default: 3,
    step: 0.05,
  }),
  num('bow.stabilizerMass', 'advanced', 'Stabilizer mass', {
    units: ['g', 'g'],
    min: 0,
    max: 1500,
    default: 250,
    step: 10,
  }),
  num('bow.stabilizerPosition', 'advanced', 'Stabilizer position', {
    units: ['mm', 'cm'],
    min: 0,
    max: 100,
    default: 70,
    step: 1,
  }),
  num('bow.string.strandCount', 'advanced', 'String strands', {
    min: 10,
    max: 24,
    default: 16,
    step: 1,
    integer: true,
  }),
  num('bow.string.stringMass', 'advanced', 'String mass', {
    units: ['g', 'gr'],
    min: 50,
    max: 200,
    default: 105,
    step: 1,
  }),
  choice(
    'bow.string.nockFit',
    'advanced',
    'Nock fit',
    { LOOSE: 'Loose', NORMAL: 'Normal', TIGHT: 'Tight' },
    'NORMAL',
  ),

  num('arrow.length', 'simple', 'Arrow length', {
    units: ['mm', 'in'],
    min: 20,
    max: 35,
    default: 27,
    step: 0.25,
  }),
  num('arrow.spine', 'simple', 'Spine', { min: 200, max: 2000, default: 700, step: 10 }),
  num('arrow.pointWeight', 'simple', 'Point weight', {
    units: ['g', 'gr'],
    min: 50,
    max: 200,
    default: 120,
    step: 5,
  }),
  num('arrow.shaftGpi', 'advanced', 'Shaft weight', {
    units: ['g/mm', 'gpi'],
    min: 3,
    max: 15,
    default: 6,
    step: 0.1,
  }),
  num('arrow.shaftDiameter', 'advanced', 'Shaft diameter', {
    units: ['mm', 'mm'],
    min: 3,
    max: 10,
    default: 4.2,
    step: 0.1,
  }),
  num('arrow.insertWeight', 'advanced', 'Insert weight', {
    units: ['g', 'gr'],
    min: 0,
    max: 50,
    default: 12,
    step: 1,
  }),
  num('arrow.nockWeight', 'advanced', 'Nock weight', {
    units: ['g', 'gr'],
    min: 2,
    max: 20,
    default: 9,
    step: 0.5,
  }),
  num('arrow.fletchingWeight', 'advanced', 'Fletching weight', {
    units: ['g', 'gr'],
    min: 0,
    max: 30,
    default: 5,
    step: 0.5,
  }),
]

/** Parameters of one panel, in display order. Simple mode hides the advanced tier. */
export function visibleParameters(group: ParameterGroup, mode: ParameterTier): Parameter[] {
  return PARAMETERS.filter(
    (parameter) =>
      parameter.group === group && (mode === 'advanced' || parameter.tier === 'simple'),
  )
}

const BY_KEY = new Map(PARAMETERS.map((parameter) => [parameter.key, parameter]))

export function getParameter(key: string): Parameter {
  const parameter = BY_KEY.get(key)
  if (!parameter) throw new Error(`Unknown parameter: ${key}`)
  return parameter
}

export type SetupValues = { bow: BowSetup; arrow: ArrowSetup }

type Tree = Record<string, unknown>

export function setPath(tree: Tree, path: readonly string[], value: unknown): Tree {
  const [head, ...rest] = path
  if (head === undefined) return tree
  const child = rest.length === 0 ? value : setPath((tree[head] ?? {}) as Tree, rest, value)
  return { ...tree, [head]: child }
}

export function getValue(setup: SetupValues, parameter: NumberParameter): number
export function getValue(setup: SetupValues, parameter: EnumParameter): string
export function getValue(setup: SetupValues, parameter: Parameter): number | string
export function getValue(setup: SetupValues, parameter: Parameter): number | string {
  let node: unknown = setup
  for (const segment of parameter.key.split('.')) {
    node = (node as Tree)[segment]
  }
  return node as number | string
}

/** Returns a new setup with the value replaced. The input is not mutated. */
export function setValue<T extends SetupValues>(
  setup: T,
  parameter: Parameter,
  value: number | string,
): T {
  return setPath(setup, parameter.key.split('.'), value) as T
}

export function defaultValues(): SetupValues {
  let tree: Tree = {}
  for (const parameter of PARAMETERS) {
    tree = setPath(tree, parameter.key.split('.'), parameter.default)
  }
  return tree as SetupValues
}

/** Parameters that currently differ from their default. Used for the Simple-mode notice. */
export function modifiedParameters(setup: SetupValues, tier?: ParameterTier): Parameter[] {
  return PARAMETERS.filter((parameter) => {
    if (tier && parameter.tier !== tier) return false
    const value = getValue(setup, parameter)
    if (parameter.kind === 'enum') return value !== parameter.default
    return Math.abs((value as number) - parameter.default) > 1e-9
  })
}

/** Which units the UI shows. `archery` is lb, inch and grain; `metric` is kg, cm and gram. */
export type UnitSystem = 'archery' | 'metric'

// The metric stand-in for each archery unit, with a slider step that suits it.
// Nocks, inserts and vanes weigh a gram or two, so they get a finer step.
const METRIC: Partial<Record<Unit, { unit: Unit; step: (largest: number) => number }>> = {
  lbf: { unit: 'kgf', step: () => 0.1 },
  in: { unit: 'cm', step: () => 0.5 },
  gr: { unit: 'g', step: (largest) => (largest < 4 ? 0.01 : 0.1) },
  gpi: { unit: 'g/m', step: () => 0.5 },
}

export type ParameterDisplay = {
  unit: Unit | null
  step: number
  decimals: number
  /** Bounds in the shown unit, moved inward to a whole number of steps. */
  min: number
  max: number
}

function decimalsOf(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

/** How a parameter is shown in a unit system: unit, step and bounds. */
export function displayOf(
  parameter: NumberParameter,
  system: UnitSystem = 'archery',
): ParameterDisplay {
  const metric = system === 'metric' && parameter.displayUnit && METRIC[parameter.displayUnit]
  const unit = metric ? metric.unit : parameter.displayUnit
  const step = metric
    ? metric.step(toDisplay(parameter, parameter.max, metric.unit))
    : parameter.step
  const decimals = decimalsOf(step)
  const inSteps = (value: number) => toDisplay(parameter, value, unit ?? undefined) / step
  const snap = (steps: number) => Number((steps * step).toFixed(decimals))
  return {
    unit,
    step,
    decimals,
    min: snap(Math.ceil(inSteps(parameter.min) - 1e-6)),
    max: snap(Math.floor(inSteps(parameter.max) + 1e-6)),
  }
}

/** A value with its unit, as the UI writes it. */
export function formatValue(
  parameter: NumberParameter,
  value: number,
  system: UnitSystem = 'archery',
): string {
  const { unit, decimals } = displayOf(parameter, system)
  const text = toDisplay(parameter, value, unit ?? undefined).toFixed(decimals)
  return unit ? `${text} ${unitLabel(unit)}` : text
}

export function toDisplay(parameter: NumberParameter, value: number, unit?: Unit): number {
  const target = unit ?? parameter.displayUnit
  return parameter.unit && target ? convert(value, parameter.unit, target) : value
}

export function fromDisplay(parameter: NumberParameter, value: number, unit?: Unit): number {
  const source = unit ?? parameter.displayUnit
  return parameter.unit && source ? convert(value, source, parameter.unit) : value
}
