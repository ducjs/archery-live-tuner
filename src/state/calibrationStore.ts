import { useMemo } from 'react'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  HEURISTIC_V0,
  createHeuristicModel,
  heuristicModel,
  type Calibration,
  type SimulationModel,
} from '../engine/index.ts'
import { NO_PERSONAL, type Personal } from '../models/calibration.ts'

/** The last fit: the shifts it found and how well they did. */
export type StoredFit = Calibration & {
  /** ISO date and time */
  fittedAt: string
}

type CalibrationState = {
  /** The last fit to the archer's observations, or null before the first one. */
  fit: StoredFit | null
  /** Whether results are computed with the shifts of that fit. Off is the base model. */
  enabled: boolean
  /** Keeps a fit. It is switched on only when it does better than the base model. */
  keep: (calibration: Calibration) => void
  setEnabled: (enabled: boolean) => void
  /** Forgets the fit and goes back to the base model. */
  clear: () => void
}

const fitSchema = z.object({
  personal: z.object({
    behaviorShift: z.number().min(-1).max(1),
    nockingPointNeutral: z.number().min(-20).max(20),
    centerShotNeutral: z.number().min(-10).max(10),
  }),
  used: z.number().int().min(0),
  before: z.number().int().min(0),
  after: z.number().int().min(0),
  total: z.number().int().min(0),
  better: z.boolean(),
  fittedAt: z.string(),
})

export const useCalibrationStore = create<CalibrationState>()(
  persist(
    (set) => ({
      fit: null,
      enabled: false,
      keep: (calibration) =>
        set({
          fit: { ...calibration, fittedAt: new Date().toISOString() },
          enabled: calibration.better,
        }),
      setEnabled: (enabled) => set((state) => ({ enabled: enabled && state.fit !== null })),
      clear: () => set({ fit: null, enabled: false }),
    }),
    {
      name: 'tuner.calibration',
      partialize: ({ fit, enabled }) => ({ fit, enabled }),
      // What was stored is untrusted: a fit that no longer validates is dropped.
      merge: (stored, current) => {
        const remembered = (stored ?? {}) as { fit?: unknown; enabled?: unknown }
        const fit = fitSchema.safeParse(remembered.fit)
        return fit.success
          ? { ...current, fit: fit.data, enabled: remembered.enabled === true }
          : current
      },
    },
  ),
)

/** The shifts results are computed with: those of the fit when it is switched on, none otherwise. */
export function usePersonal(): Personal {
  const fit = useCalibrationStore((state) => state.fit)
  const enabled = useCalibrationStore((state) => state.enabled)
  return enabled && fit ? fit.personal : NO_PERSONAL
}

/** The model the page computes with: the base model, or the one shifted to the archer. */
export function useModel(): SimulationModel {
  const personal = usePersonal()
  return useMemo(
    () =>
      personal === NO_PERSONAL ? heuristicModel : createHeuristicModel(HEURISTIC_V0, personal),
    [personal],
  )
}
