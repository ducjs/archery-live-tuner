import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MESSAGES, detectLanguage, type Language } from '../i18n/index.ts'
import {
  getParameter,
  modifiedParameters,
  setValue,
  type ParameterTier,
  type UnitSystem,
} from '../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../models/setup.ts'
import { parseSetup } from '../utils/validation.ts'

type TuningState = {
  /** The setup on screen. Saved copies live in the library store. */
  setup: TuningSetup
  /** Which tier of parameters the panels show. */
  mode: ParameterTier
  language: Language
  units: UnitSystem
  setMode: (mode: ParameterTier) => void
  setLanguage: (language: Language) => void
  setUnits: (units: UnitSystem) => void
  setParameter: (key: string, value: number | string) => void
  resetParameter: (key: string) => void
  /** Puts every advanced parameter back to its default. */
  resetAdvanced: () => void
  setName: (name: string) => void
  /** Puts another setup on screen, replacing the current one. */
  openSetup: (setup: TuningSetup) => void
}

type Remembered = Pick<TuningState, 'setup' | 'mode' | 'language' | 'units'>

export const useTuningStore = create<TuningState>()(
  persist(
    (set) => ({
      setup: createDefaultSetup(MESSAGES[detectLanguage()].setups.defaultName),
      mode: 'simple',
      language: detectLanguage(),
      units: 'archery',
      setMode: (mode) => set({ mode }),
      setLanguage: (language) => set({ language }),
      setUnits: (units) => set({ units }),
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
      setName: (name) => set((state) => ({ setup: { ...state.setup, name } })),
      openSetup: (setup) => set({ setup }),
    }),
    {
      name: 'tuner.ui',
      // The setup on screen is remembered as a draft, so a reload at the range loses nothing.
      partialize: ({ setup, mode, language, units }): Remembered => ({
        setup,
        mode,
        language,
        units,
      }),
      // What comes back from the browser is untrusted: keep only what still makes sense.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<Record<keyof Remembered, unknown>>
        const parsed = parseSetup(stored.setup)
        return {
          ...current,
          setup: parsed.ok ? parsed.setup : current.setup,
          mode:
            stored.mode === 'advanced'
              ? 'advanced'
              : stored.mode === 'simple'
                ? 'simple'
                : current.mode,
          language:
            stored.language === 'en' || stored.language === 'vi'
              ? stored.language
              : current.language,
          units:
            stored.units === 'metric' || stored.units === 'archery' ? stored.units : current.units,
        }
      },
    },
  ),
)
