import {
  AFTER_V1,
  ROADMAP,
  countItems,
  type RoadmapGroup,
  type RoadmapItem,
  type RoadmapPhase,
} from './roadmapData.ts'

type Status = 'done' | 'current' | 'partial' | 'waiting'

const STATUS_LABEL: Record<Status, string> = {
  done: 'Đã xong',
  current: 'Đang làm',
  partial: 'Làm trước một phần',
  waiting: 'Chưa bắt đầu',
}

const STATUS_CLASS: Record<Status, string> = {
  done: 'border-gold bg-gold/15',
  current: 'border-accent bg-accent/10',
  partial: 'border-line',
  waiting: 'border-line text-ink-muted',
}

function statusOf(phase: RoadmapPhase): Status {
  const { done, total } = countItems(phase.groups)
  if (done === total) return 'done'
  if (phase.current) return 'current'
  return done > 0 ? 'partial' : 'waiting'
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div className="bg-ink-muted/25 h-2 overflow-hidden rounded-full" aria-hidden="true">
      <div
        className="bg-ink h-full origin-left"
        style={{ transform: `scaleX(${total === 0 ? 0 : done / total})` }}
      />
    </div>
  )
}

function ItemRow({ item }: { item: RoadmapItem }) {
  return (
    <li className="grid grid-cols-[1.5rem_1fr] items-start gap-x-2">
      <svg viewBox="0 0 20 20" className="mt-0.5 size-5" aria-hidden="true">
        {item.done ? (
          <>
            <circle cx="10" cy="10" r="9" className="fill-ink" />
            <path
              d="M5.8 10.4l2.8 2.8 5.6-6"
              fill="none"
              className="stroke-surface"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <circle
            cx="10"
            cy="10"
            r="8.25"
            fill="none"
            className="stroke-ink-muted"
            strokeWidth="1.5"
          />
        )}
      </svg>
      <span className={item.done ? undefined : 'text-ink-muted'}>
        <span className="sr-only">{item.done ? 'Đã xong: ' : 'Chưa làm: '}</span>
        {item.text}
      </span>
    </li>
  )
}

function Group({ group, open }: { group: RoadmapGroup; open: boolean }) {
  const { done, total } = countItems([group])
  return (
    <details open={open} className="border-line bg-surface group rounded-lg border">
      <summary className="focus-visible:outline-accent flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 20 20"
          className="text-ink-muted size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        >
          <path
            d="M7.5 4.5l5.5 5.5-5.5 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-semibold">{group.title ?? 'Các việc cần làm'}</span>
        <span className="text-ink-muted ml-auto text-sm">
          {done === total ? `Xong cả ${total} việc` : `${done} / ${total} việc`}
        </span>
      </summary>
      <div className="grid gap-3 px-4 pt-1 pb-4">
        {group.summary && <p className="max-w-prose">{group.summary}</p>}
        {group.note && (
          <p className="border-gold bg-gold/10 max-w-prose rounded-md border-l-4 px-3 py-2 text-sm">
            {group.note}
          </p>
        )}
        <ul className="grid gap-2">
          {group.items.map((item) => (
            <ItemRow key={item.text} item={item} />
          ))}
        </ul>
      </div>
    </details>
  )
}

function Phase({ phase }: { phase: RoadmapPhase }) {
  const status = statusOf(phase)
  const { done, total } = countItems(phase.groups)
  return (
    <section id={phase.id} aria-labelledby={`${phase.id}-title`} className="scroll-mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={`${phase.id}-title`} className="font-display text-2xl font-semibold">
          <span className="text-ink-muted">{phase.version}</span> {phase.title}
        </h2>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-sm font-medium ${STATUS_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="mt-2 max-w-prose text-lg">{phase.summary}</p>

      <div className="mt-3 max-w-md">
        <ProgressBar done={done} total={total} />
        <p className="text-ink-muted mt-1 text-sm">
          Xong {done} trên {total} việc
        </p>
      </div>

      <div className="mt-4 grid gap-2">
        {phase.groups.map((group, index) => {
          const counts = countItems([group])
          // Open what is being worked on; keep finished and future lists folded.
          const open = Boolean(phase.current) && counts.done < counts.total
          return <Group key={group.title ?? index} group={group} open={open} />
        })}
      </div>

      <p className="text-ink-muted mt-3 max-w-prose text-sm">
        <span className="text-ink font-medium">Khi nào coi là xong:</span> {phase.exit}
      </p>
      <a
        href={`#demo-${phase.id}`}
        className="text-accent focus-visible:outline-accent mt-1 inline-flex min-h-11 items-center rounded font-medium underline underline-offset-4 focus-visible:outline-2"
      >
        Xem bản dựng thử của {phase.version}
      </a>
    </section>
  )
}

export function Roadmap() {
  const all = countItems(ROADMAP.flatMap((phase) => phase.groups))
  const current = ROADMAP.find((phase) => phase.current)

  return (
    <main lang="vi" className="px-4 pt-5 pb-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl leading-tight font-semibold">Lộ trình phát triển</h1>
        <p className="text-ink-muted mt-1 max-w-prose">
          Ứng dụng được làm theo từng giai đoạn. Mỗi giai đoạn có một mục đích, một danh sách việc
          và một điều kiện để coi là xong.
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar done={all.done} total={all.total} />
          <p className="mt-1">
            Đã xong <span className="font-semibold">{all.done}</span> trên{' '}
            <span className="font-semibold">{all.total}</span> việc.
            {current && (
              <>
                {' '}
                Đang ở giai đoạn{' '}
                <a
                  href={`#${current.id}`}
                  className="text-accent focus-visible:outline-accent rounded font-semibold underline underline-offset-4 focus-visible:outline-2"
                >
                  {current.version}
                </a>
                .
              </>
            )}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Các giai đoạn" className="lg:sticky lg:top-4">
          <ol className="border-line grid gap-0.5 border-l-2">
            {ROADMAP.map((phase) => {
              const status = statusOf(phase)
              const { done, total } = countItems(phase.groups)
              return (
                <li key={phase.id}>
                  <a
                    href={`#${phase.id}`}
                    aria-current={phase.current ? 'step' : undefined}
                    className="hover:bg-ink-muted/10 focus-visible:outline-accent aria-[current=step]:border-accent -ml-0.5 grid min-h-11 content-center border-l-2 border-transparent py-1.5 pr-2 pl-3 focus-visible:outline-2"
                  >
                    <span className="font-medium">
                      <span className="text-ink-muted">{phase.version}</span> {phase.title}
                    </span>
                    <span className="text-ink-muted text-sm">
                      {STATUS_LABEL[status]}, {done}/{total}
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="grid gap-12">
          {ROADMAP.map((phase) => (
            <Phase key={phase.id} phase={phase} />
          ))}

          <section aria-labelledby="later-title">
            <h2 id="later-title" className="font-display text-2xl font-semibold">
              Sau V1.0
            </h2>
            <p className="text-ink-muted mt-1 max-w-prose">Ý tưởng để ngỏ, chưa xếp lịch.</p>
            <ul className="mt-3 grid max-w-prose list-disc gap-1 pl-5">
              {AFTER_V1.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </section>

          <p className="text-ink-muted border-line max-w-prose border-t pt-4 text-sm">
            Trang này là bản tiếng Việt, viết gọn của file ROADMAP.md trong mã nguồn. File đó là bản
            gốc; một bài test giữ cho hai bên khớp nhau.
          </p>
        </div>
      </div>
    </main>
  )
}
