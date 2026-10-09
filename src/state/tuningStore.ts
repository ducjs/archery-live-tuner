import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MESSAGES, detectLanguage, type Language } from '../i18n/index.ts'
import {
  getParameter,
  modifiedParameters,
  setValue,
  tierShows,
  TIERS,
  type ParameterTier,
  type UnitSystem,
} from '../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../models/setup.ts'
import { parseSetup } from '../utils/validation.ts'

/** One job of the simulator, shown as a tab. */
export type Workspace = 'setup' | 'fly' | 'target' | 'analysis'
export const WORKSPACES: readonly Workspace[] = ['setup', 'fly', 'target', 'analysis']
/** The level from which a workspace exists. */
export const WORKSPACE_TIER: Record<Workspace, ParameterTier> = {
  setup: 'simple',
  fly: 'simple',
  target: 'advanced',
  analysis: 'advanced',
}
/** The flight drawn next to the values of the setup, if any. */
export type FlightPreview = 'target' | 'top' | 'side' | 'off'
const FLIGHT_PREVIEWS: readonly FlightPreview[] = ['target', 'top', 'side', 'off']

/**
 * Whether this looks like a device that the 3D bow would weigh on: few
 * processor cores or little memory. Such a device starts without it; the
 * switch is one press away either way.
 */
const weakDevice = () => {
  if (typeof navigator === 'undefined') return false
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return (navigator.hardwareConcurrency ?? 8) <= 4 || (memory !== undefined && memory <= 2)
}

type TuningState = {
  /** The setup on screen. Saved copies live in the library store. */
  setup: TuningSetup
  /** Which tier of parameters the panels show. */
  mode: ParameterTier
  language: Language
  units: UnitSystem
  workspace: Workspace
  /** Whether the 3D bow is shown next to the values of the setup. */
  bow3d: boolean
  flightPreview: FlightPreview
  setWorkspace: (workspace: Workspace) => void
  setBow3d: (shown: boolean) => void
  setFlightPreview: (preview: FlightPreview) => void
  setMode: (mode: ParameterTier) => void
  setLanguage: (language: Language) => void
  setUnits: (units: UnitSystem) => void
  setParameter: (key: string, value: number | string) => void
  resetParameter: (key: string) => void
  /** Puts every value the level does not show back to its default. */
  resetHidden: () => void
  setName: (name: string) => void
  /** Puts another setup on screen, replacing the current one. */
  openSetup: (setup: TuningSetup) => void
  /** The input the page is pointing the user to. `request` goes up each time, even for the same one. */
  highlighted: { key: string; request: number } | null
  /** Points to the input of a value, raising the level first if the value lives above it. */
  pointTo: (key: string) => void
  clearHighlight: () => void
}

type Remembered = Pick<
  TuningState,
  'setup' | 'mode' | 'language' | 'units' | 'workspace' | 'bow3d' | 'flightPreview'
>

let pointings = 0

export const useTuningStore = create<TuningState>()(
  persist(
    (set) => ({
      setup: createDefaultSetup(MESSAGES[detectLanguage()].setups.defaultName),
      mode: 'simple',
      language: detectLanguage(),
      units: 'archery',
      workspace: 'setup',
      bow3d: !weakDevice(),
      // The landing on a target face: small, and it says in one look what the
      // two drawings of the flight say in two. Those are one press away.
      flightPreview: 'target',
      // A workspace above the level raises the level: nothing is opened that is then hidden.
      setWorkspace: (workspace) =>
        set((state) => ({
          workspace,
          mode: tierShows(state.mode, WORKSPACE_TIER[workspace])
            ? state.mode
            : WORKSPACE_TIER[workspace],
        })),
      setBow3d: (bow3d) => set({ bow3d }),
      setFlightPreview: (flightPreview) => set({ flightPreview }),
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
      resetHidden: () =>
        set((state) => ({
          setup: modifiedParameters(state.setup, state.mode).reduce(
            (setup, parameter) => setValue(setup, parameter, parameter.default),
            state.setup,
          ),
        })),
      setName: (name) => set((state) => ({ setup: { ...state.setup, name } })),
      openSetup: (setup) => set({ setup }),
      highlighted: null,
      pointTo: (key) => {
        // Counted outside the state, so the count goes on after a highlight is cleared.
        pointings += 1
        set((state) => ({
          // The level goes up to where the value lives, and never down.
          mode: tierShows(state.mode, getParameter(key).tier) ? state.mode : getParameter(key).tier,
          highlighted: { key, request: pointings },
        }))
      },
      clearHighlight: () => set({ highlighted: null }),
    }),
    {
      name: 'tuner.ui',
      // The setup on screen is remembered as a draft, so a reload at the range loses nothing.
      partialize: ({
        setup,
        mode,
        language,
        units,
        workspace,
        bow3d,
        flightPreview,
      }): Remembered => ({ setup, mode, language, units, workspace, bow3d, flightPreview }),
      // What comes back from the browser is untrusted: keep only what still makes sense.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<Record<keyof Remembered, unknown>>
        const parsed = parseSetup(stored.setup)
        return {
          ...current,
          setup: parsed.ok ? parsed.setup : current.setup,
          mode: TIERS.find((tier) => tier === stored.mode) ?? current.mode,
          language:
            stored.language === 'en' || stored.language === 'vi'
              ? stored.language
              : current.language,
          workspace:
            WORKSPACES.find((workspace) => workspace === stored.workspace) ?? current.workspace,
          bow3d: typeof stored.bow3d === 'boolean' ? stored.bow3d : current.bow3d,
          flightPreview:
            FLIGHT_PREVIEWS.find((preview) => preview === stored.flightPreview) ??
            current.flightPreview,
          units:
            stored.units === 'metric' || stored.units === 'archery' ? stored.units : current.units,
        }
      },
    },
  ),
)
