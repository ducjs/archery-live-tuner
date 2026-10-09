import { valueTone, type Influence, type Tone } from '../../engine/index.ts'

/** How a value is written when the setup does not read as in order and the value can do something about it. */
export const TONE_TEXT: Record<Tone, string> = {
  good: '',
  plain: '',
  fair: 'text-caution',
  poor: 'text-weak',
}

/** The tone a value is written in. In order is written as any other value: only trouble is marked. */
export function textTone(found: Influence | undefined): 'fair' | 'poor' | 'plain' {
  const tone = found ? valueTone(found) : 'plain'
  return tone === 'fair' || tone === 'poor' ? tone : 'plain'
}

const COLOR: Record<Influence['tones'][number], string> = {
  good: 'var(--color-good)',
  fair: 'var(--color-gold)',
  poor: 'var(--color-weak)',
}

/**
 * The background of the strip under a slider: one stretch of color around each
 * place the value was tried at, the first and the last half as long.
 */
export function strip(tones: Influence['tones']): string {
  const last = tones.length - 1
  const stops = tones.map((tone, index) => {
    const from = Math.max(0, (index - 0.5) / last) * 100
    const to = Math.min(1, (index + 0.5) / last) * 100
    return `${COLOR[tone]} ${from.toFixed(2)}% ${to.toFixed(2)}%`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
}
