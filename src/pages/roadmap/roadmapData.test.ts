import { describe, expect, it } from 'vitest'
import source from '../../../readme/ROADMAP.md?raw'
import { PINNED, ROADMAP, countItems } from './roadmapData.ts'

/** Done flags of the checklist items in ROADMAP.md, per phase and per group. */
function parseMarkdown(): Map<string, boolean[][]> {
  const phases = new Map<string, boolean[][]>()
  let groups: boolean[][] | null = null
  for (const line of source.split(/\r?\n/)) {
    const phase = /^## (V\d+\.\d+) /.exec(line)
    if (phase) {
      groups = [[]]
      phases.set(phase[1]!, groups)
    } else if (line.startsWith('## ')) {
      groups = null
    } else if (line.startsWith('### ') && groups) {
      groups.push([])
    } else {
      const item = /^- \[( |x)\] /.exec(line)
      if (item && groups) groups.at(-1)!.push(item[1] === 'x')
    }
  }
  // A phase whose items all sit under sub-headings has an empty first group.
  for (const [version, list] of phases) {
    phases.set(
      version,
      list.filter((group) => group.length > 0),
    )
  }
  return phases
}

/** Text and done flag of the pinned tasks at the top of ROADMAP.md. */
function parsePinned(): { text: string; done: boolean }[] {
  const tasks: { text: string; done: boolean }[] = []
  let inside = false
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith('## ')) inside = line.startsWith('## Việc cần bạn làm')
    const item = /^- \[( |x)\] (.+?)\. \*/.exec(line)
    if (inside && item) tasks.push({ text: item[2]!, done: item[1] === 'x' })
  }
  return tasks
}

describe('Vietnamese roadmap', () => {
  const markdown = parseMarkdown()

  it('covers the same phases as ROADMAP.md', () => {
    expect(ROADMAP.map((phase) => phase.version)).toEqual([...markdown.keys()])
  })

  it.each(ROADMAP.map((phase) => [phase.version, phase] as const))(
    '%s has the same items and done states as ROADMAP.md',
    (version, phase) => {
      const flags = phase.groups.map((group) => group.items.map((item) => item.done))
      expect(flags).toEqual(markdown.get(version))
    },
  )

  it('pins the same tasks for the owner as ROADMAP.md', () => {
    expect(PINNED.map(({ text, done }) => ({ text, done }))).toEqual(parsePinned())
  })

  it('marks exactly one phase as current', () => {
    expect(ROADMAP.filter((phase) => phase.current)).toHaveLength(1)
  })

  it('counts done and total items', () => {
    expect(countItems(ROADMAP[0]!.groups)).toEqual({ done: 50, total: 52 })
  })
})
