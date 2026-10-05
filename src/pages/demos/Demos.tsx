import type { ReactNode } from 'react'
import { V01Demo } from './V01Demo.tsx'
import { V02Demo } from './V02Demo.tsx'
import { V03Demo } from './V03Demo.tsx'
import { V04Demo } from './V04Demo.tsx'
import { V05Demo } from './V05Demo.tsx'
import { V06Demo } from './V06Demo.tsx'
import { V10Demo } from './V10Demo.tsx'
import { DEMO_TABS, demoTab } from './demoTabs.ts'

const CONTENT: Record<string, ReactNode> = {
  'v0-1': <V01Demo />,
  'v0-2': <V02Demo />,
  'v0-3': <V03Demo />,
  'v0-4': <V04Demo />,
  'v0-5': <V05Demo />,
  'v0-6': <V06Demo />,
  'v1-0': <V10Demo />,
}

/** Previews of what the remaining phases will add, one tab per phase. */
export function Demos({ hash }: { hash: string }) {
  const tab = demoTab(hash)

  return (
    <main lang="vi" className="px-4 pt-5 pb-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl leading-tight font-semibold">
          Xem trước các giai đoạn
        </h1>
        <p className="text-ink-muted mt-1 max-w-prose">
          Bản dựng thử của những phần chưa làm, để hình dung trước khi làm thật. Mỗi ô ghi rõ nó
          đang chạy bằng mô hình hiện có, bằng một phép tính đơn giản, hay chỉ là dữ liệu giả.
        </p>
      </header>

      <nav aria-label="Giai đoạn" className="border-line mt-5 border-b">
        <ul className="-mb-px flex flex-wrap gap-x-1">
          {DEMO_TABS.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#demo-${entry.id}`}
                aria-current={entry.id === tab.id ? 'page' : undefined}
                className="focus-visible:outline-accent aria-[current=page]:border-ink text-ink-muted aria-[current=page]:text-ink hover:text-ink flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-3 font-medium focus-visible:outline-2"
              >
                <span className="font-display text-lg">{entry.version}</span>
                <span className="hidden sm:inline">{entry.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5">
        <h2 className="font-display text-2xl font-semibold">
          <span className="text-ink-muted">{tab.version}</span> {tab.title}
        </h2>
        <p className="mt-1 max-w-prose">{tab.summary}</p>
        <div className="mt-5 grid gap-5 2xl:grid-cols-2 2xl:items-start">{CONTENT[tab.id]}</div>
      </div>
    </main>
  )
}
