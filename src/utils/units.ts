export type Dimension = 'length' | 'mass' | 'force' | 'angle' | 'time' | 'linearDensity'

const GRAMS_PER_GRAIN = 0.06479891
const MM_PER_INCH = 25.4

// `toBase` converts a value in the unit to the internal base unit of its dimension:
// mm, g, N, rad, s, g/mm.
const UNITS = {
  mm: { dimension: 'length', toBase: 1, label: 'mm' },
  cm: { dimension: 'length', toBase: 10, label: 'cm' },
  m: { dimension: 'length', toBase: 1000, label: 'm' },
  in: { dimension: 'length', toBase: MM_PER_INCH, label: 'in' },

  g: { dimension: 'mass', toBase: 1, label: 'g' },
  kg: { dimension: 'mass', toBase: 1000, label: 'kg' },
  gr: { dimension: 'mass', toBase: GRAMS_PER_GRAIN, label: 'gr' },

  N: { dimension: 'force', toBase: 1, label: 'N' },
  lbf: { dimension: 'force', toBase: 4.4482216152605, label: 'lb' },
  kgf: { dimension: 'force', toBase: 9.80665, label: 'kg' },

  rad: { dimension: 'angle', toBase: 1, label: 'rad' },
  deg: { dimension: 'angle', toBase: Math.PI / 180, label: '°' },

  s: { dimension: 'time', toBase: 1, label: 's' },
  ms: { dimension: 'time', toBase: 0.001, label: 'ms' },

  'g/mm': { dimension: 'linearDensity', toBase: 1, label: 'g/mm' },
  gpi: { dimension: 'linearDensity', toBase: GRAMS_PER_GRAIN / MM_PER_INCH, label: 'gpi' },
} as const satisfies Record<string, { dimension: Dimension; toBase: number; label: string }>

export type Unit = keyof typeof UNITS

export function dimensionOf(unit: Unit): Dimension {
  return UNITS[unit].dimension
}

export function unitLabel(unit: Unit): string {
  return UNITS[unit].label
}

export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  const source = UNITS[from]
  const target = UNITS[to]
  if (source.dimension !== target.dimension) {
    throw new Error(`Cannot convert ${from} (${source.dimension}) to ${to} (${target.dimension})`)
  }
  return (value * source.toBase) / target.toBase
}
