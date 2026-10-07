import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KnownMark } from '../models/observation.ts'
import { parseSight } from '../utils/observations.ts'

/** mm, a usual distance from the eye to the arrow with an anchor under the chin. HEURISTIC. */
export const DEFAULT_EYE_HEIGHT = 110

export type SightEntry = {
  marks: KnownMark[]
  /** mm */
  eyeHeight: number
}

const EMPTY: SightEntry = { marks: [], eyeHeight: DEFAULT_EYE_HEIGHT }

type SightState = {
  /**
   * Sight marks by setup id. Marks belong to one setup: other arrows, another
   * draw weight or another anchor make them useless.
   */
  bySetup: Record<string, SightEntry>
  /** Sets the mark for a distance, or takes it away with `null`. */
  setMark: (setupId: string, distance: number, mark: number | null) => void
  setEyeHeight: (setupId: string, eyeHeight: number) => void
}

/** The sight marks of a setup; nothing entered yet reads as no marks. */
export function sightOf(bySetup: SightState['bySetup'], setupId: string): SightEntry {
  return bySetup[setupId] ?? EMPTY
}

export const useSightStore = create<SightState>()(
  persist(
    (set) => {
      const change = (setupId: string, next: (entry: SightEntry) => SightEntry) =>
        set((state) => ({
          bySetup: { ...state.bySetup, [setupId]: next(sightOf(state.bySetup, setupId)) },
        }))
      return {
        bySetup: {},
        setMark: (setupId, distance, mark) =>
          change(setupId, (entry) => {
            const others = entry.marks.filter((known) => known.distance !== distance)
            const marks = mark === null ? others : [...others, { distance, mark }]
            return { ...entry, marks: marks.sort((a, b) => a.distance - b.distance) }
          }),
        setEyeHeight: (setupId, eyeHeight) => change(setupId, (entry) => ({ ...entry, eyeHeight })),
      }
    },
    {
      name: 'tuner.sight',
      partialize: ({ bySetup }) => ({ bySetup }),
      // What was stored is untrusted: entries that no longer validate are dropped.
      merge: (stored, current) => {
        const remembered = (stored as { bySetup?: unknown } | undefined)?.bySetup
        if (remembered === null || typeof remembered !== 'object') return current
        const bySetup: SightState['bySetup'] = {}
        for (const [setupId, entry] of Object.entries(remembered)) {
          const parsed = parseSight(entry)
          if (parsed) bySetup[setupId] = { marks: parsed.marks, eyeHeight: parsed.eyeHeight }
        }
        return { ...current, bySetup }
      },
    },
  ),
)
