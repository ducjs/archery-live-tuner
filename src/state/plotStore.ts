import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TargetPlot } from '../models/observation.ts'
import { parsePlot } from '../utils/observations.ts'

/** mm, the target face a distance is usually shot at (World Archery). */
export function usualFace(distance: number): number {
  if (distance <= 25_000) return 400
  if (distance <= 50_000) return 800
  return 1220
}

/** mm, the target faces that can be chosen. */
export const FACES = [400, 600, 800, 1220]

const EMPTY: TargetPlot = { distance: 18_000, faceDiameter: 400, marks: [] }

type PlotState = {
  /** The target being marked. It is kept between visits, as an end can take a while. */
  plot: TargetPlot
  /** The next mark is a bare shaft. */
  bare: boolean
  /** The end the next mark belongs to, counting from 1. */
  end: number
  setBare: (bare: boolean) => void
  /** Marks an arrow, in mm from the middle of the face. */
  addMark: (x: number, y: number) => void
  removeLast: () => void
  clear: () => void
  nextEnd: () => void
  /** Changes the distance, and with it the face to the one usual there. */
  setDistance: (distance: number) => void
  setFace: (faceDiameter: number) => void
}

type Remembered = Pick<PlotState, 'plot' | 'bare' | 'end'>

export const usePlotStore = create<PlotState>()(
  persist(
    (set) => ({
      plot: EMPTY,
      bare: false,
      end: 1,
      setBare: (bare) => set({ bare }),
      addMark: (x, y) =>
        set((state) => ({
          plot: {
            ...state.plot,
            marks: [...state.plot.marks, { x, y, bare: state.bare, end: state.end }],
          },
        })),
      removeLast: () =>
        set((state) => {
          const marks = state.plot.marks.slice(0, -1)
          // Taking back the first arrow of an end goes back to the end before it.
          return { plot: { ...state.plot, marks }, end: marks.at(-1)?.end ?? 1 }
        }),
      clear: () => set((state) => ({ plot: { ...state.plot, marks: [] }, end: 1, bare: false })),
      nextEnd: () =>
        set((state) =>
          // An end without arrows is not an end.
          state.plot.marks.some((mark) => mark.end === state.end)
            ? { end: state.end + 1, bare: false }
            : state,
        ),
      setDistance: (distance) =>
        set((state) => ({ plot: { ...state.plot, distance, faceDiameter: usualFace(distance) } })),
      setFace: (faceDiameter) => set((state) => ({ plot: { ...state.plot, faceDiameter } })),
    }),
    {
      name: 'tuner.plot',
      partialize: ({ plot, bare, end }): Remembered => ({ plot, bare, end }),
      // What was stored is untrusted: a plot that no longer validates is dropped.
      merge: (stored, current) => {
        const remembered = stored as Partial<Remembered> | undefined
        const plot = parsePlot(remembered?.plot)
        if (!plot) return current
        const lastEnd = Math.max(1, ...plot.marks.map((mark) => mark.end))
        return {
          ...current,
          plot,
          bare: remembered?.bare === true,
          end: Number.isInteger(remembered?.end) ? Math.max(lastEnd, remembered!.end!) : lastEnd,
        }
      },
    },
  ),
)
