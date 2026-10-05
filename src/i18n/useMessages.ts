import { useTuningStore } from '../state/tuningStore.ts'
import { MESSAGES, type Messages } from './index.ts'

/** The texts of the language the user chose. */
export function useMessages(): Messages {
  return MESSAGES[useTuningStore((state) => state.language)]
}
