import { describe, expect, it } from 'vitest'
import source from '../../../readme/ROADMAP.md?raw'
import { ROADMAP, countItems } from './roadmapData.ts'

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

  it('marks exactly one phase as current', () => {
    expect(ROADMAP.filter((phase) => phase.current)).toHaveLength(1)
  })

  it('counts done and total items', () => {
    expect(countItems(ROADMAP[0]!.groups)).toEqual({ done: 46, total: 47 })
  })
})
