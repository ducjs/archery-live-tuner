import { create } from 'zustand'
import { getParameter, setValue } from '../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../models/setup.ts'

type TuningState = {
  setup: TuningSetup
  setParameter: (key: string, value: number | string) => void
  resetParameter: (key: string) => void
}

export const useTuningStore = create<TuningState>()((set) => ({
  setup: createDefaultSetup('My setup'),
  setParameter: (key, value) =>
    set((state) => ({ setup: setValue(state.setup, getParameter(key), value) })),
  resetParameter: (key) =>
    set((state) => {
      const parameter = getParameter(key)
      return { setup: setValue(state.setup, parameter, parameter.default) }
    }),
}))
