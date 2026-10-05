import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getParameter,
  modifiedParameters,
  setValue,
  type ParameterTier,
} from '../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../models/setup.ts'

type TuningState = {
  setup: TuningSetup
  /** Which tier of parameters the panels show. */
  mode: ParameterTier
  setMode: (mode: ParameterTier) => void
  setParameter: (key: string, value: number | string) => void
  resetParameter: (key: string) => void
  /** Puts every advanced parameter back to its default. */
  resetAdvanced: () => void
}

export const useTuningStore = create<TuningState>()(
  persist(
    (set) => ({
      setup: createDefaultSetup('My setup'),
      mode: 'simple',
      setMode: (mode) => set({ mode }),
      setParameter: (key, value) =>
        set((state) => ({ setup: setValue(state.setup, getParameter(key), value) })),
      resetParameter: (key) =>
        set((state) => {
          const parameter = getParameter(key)
          return { setup: setValue(state.setup, parameter, parameter.default) }
        }),
      resetAdvanced: () =>
        set((state) => ({
          setup: modifiedParameters(state.setup, 'advanced').reduce(
            (setup, parameter) => setValue(setup, parameter, parameter.default),
            state.setup,
          ),
        })),
    }),
    {
      name: 'tuner.ui',
      // Only the display mode is remembered here. Setups are saved through the repository.
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
)
