import type { ReactNode } from 'react'

/** How much of a demo is real. Shown on every card, so nothing fake reads as finished. */
export type DemoKind = 'model' | 'simple' | 'fake'

const KIND: Record<DemoKind, { label: string; className: string }> = {
  model: { label: 'Tính bằng mô hình hiện có', className: 'border-accent bg-accent/10' },
  simple: { label: 'Mô phỏng đơn giản', className: 'border-gold bg-gold/15' },
  fake: { label: 'Dữ liệu giả', className: 'border-line text-ink-muted' },
}

type CardProps = {
  title: string
  kind: DemoKind
  /** One or two sentences: what the finished feature is for. */
  intro: string
  children: ReactNode
}

export function DemoCard({ title, kind, intro, children }: CardProps) {
  return (
    <section className="border-line bg-surface @container rounded-lg border p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-sm font-medium ${KIND[kind].className}`}
        >
          {KIND[kind].label}
        </span>
      </div>
      <p className="text-ink-muted mt-1 max-w-prose">{intro}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** A label with its value, for short fact lists. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}
