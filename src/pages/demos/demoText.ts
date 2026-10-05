export const buttonClass =
  'border-line bg-surface focus-visible:outline-accent aria-pressed:bg-ink aria-pressed:text-surface min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50'

export const inputClass =
  'border-line bg-surface focus-visible:outline-accent min-h-11 rounded-md border px-3 focus-visible:outline-2 focus-visible:outline-offset-2'

/** Vietnamese words for the model's ratings. */
export const RATING: Record<string, string> = {
  WEAK: 'Yếu',
  NEUTRAL: 'Trung tính',
  STIFF: 'Cứng',
  LOW: 'Thấp',
  MEDIUM: 'Vừa',
  HIGH: 'Cao',
  LEFT: 'Trái',
  RIGHT: 'Phải',
  NOCK_LOW: 'Nock thấp',
  NOCK_HIGH: 'Nock cao',
}
