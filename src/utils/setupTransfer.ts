import { PARAMETERS, defaultValues, getValue, setValue } from '../models/parameters.ts'
import { SETUP_SCHEMA_VERSION, sameSetup, type TuningSetup } from '../models/setup.ts'
import { parseSetup } from './validation.ts'

// Ways to hand a setup to someone else, or to another browser, without a
// server (spec §34.6): a link that carries one setup, and a file that carries
// many. Whatever comes back in is untrusted and goes through `parseSetup`.

/** The query parameter of a link that carries a setup. */
export const LINK_PARAMETER = 's'

const LINK_VERSION = 1

type LinkPayload = {
  /** Version of this format. */
  v: number
  /** Name of the setup. */
  n: string
  /** Every value by parameter key, in internal units and at full precision. */
  p: Record<string, number | string>
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  )
}

/**
 * Packs a setup into text that fits in a link. Values are kept by name and at
 * full precision, so the setup that comes out gives exactly the same result,
 * and a link still opens after parameters are added to the app.
 */
export function encodeSetup(setup: TuningSetup): string {
  const payload: LinkPayload = {
    v: LINK_VERSION,
    n: setup.name,
    p: Object.fromEntries(
      PARAMETERS.map((parameter) => [parameter.key, getValue(setup, parameter)]),
    ),
  }
  return toBase64Url(JSON.stringify(payload))
}

/**
 * Reads text made by `encodeSetup`. The setup gets an id of its own, so it
 * never takes the place of a saved one. Null when the text is not a setup, or
 * holds a value outside what the app accepts.
 */
export function decodeSetup(code: string): TuningSetup | null {
  let payload: Partial<LinkPayload>
  try {
    payload = JSON.parse(fromBase64Url(code)) as Partial<LinkPayload>
  } catch {
    return null
  }
  if (payload === null || typeof payload !== 'object') return null
  const values = payload.p
  if (payload.v !== LINK_VERSION || values === null || typeof values !== 'object') return null

  let setup: TuningSetup = {
    id: crypto.randomUUID(),
    schemaVersion: SETUP_SCHEMA_VERSION,
    name: typeof payload.n === 'string' ? payload.n : '',
    ...defaultValues(),
    metadata: { createdAt: new Date().toISOString() },
  }
  // A value the link does not name keeps its default; one the app no longer has is left out.
  for (const parameter of PARAMETERS) {
    const value = values[parameter.key]
    if (value !== undefined) setup = setValue(setup, parameter, value)
  }
  const parsed = parseSetup(setup)
  return parsed.ok ? parsed.setup : null
}

/** The address that opens the app with this setup on offer. */
export function setupLink(setup: TuningSetup, location: Pick<Location, 'origin' | 'pathname'>) {
  return `${location.origin}${location.pathname}?${LINK_PARAMETER}=${encodeSetup(setup)}`
}

/** The setup a page address carries: none, one that reads, or one that does not. */
export function readSharedSetup(search: string): TuningSetup | 'unreadable' | null {
  const code = new URLSearchParams(search).get(LINK_PARAMETER)
  if (code === null) return null
  return decodeSetup(code) ?? 'unreadable'
}

const EXPORT_FORMAT = 'recurve-tuning-simulator/setups'

/** The contents of a backup file holding these setups. */
export function exportSetups(setups: TuningSetup[], now = new Date()): string {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      schemaVersion: SETUP_SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      setups,
    },
    null,
    2,
  )
}

export type ImportResult = {
  /** Setups to add to the saved ones. */
  added: TuningSetup[]
  /** Entries that are already saved, value for value. */
  known: number
  /** Entries that are not setups this app can read. */
  invalid: number
}

/**
 * Reads a backup file, or a single setup as JSON. Nothing saved is ever
 * replaced: an entry with the id of a saved setup but other values comes in as
 * a setup of its own. Null when the text is not JSON or holds no list of setups.
 */
export function importSetups(text: string, existing: TuningSetup[]): ImportResult | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  const list = Array.isArray(data)
    ? data
    : data !== null && typeof data === 'object' && 'setups' in data
      ? (data as { setups: unknown }).setups
      : [data]
  if (!Array.isArray(list)) return null

  const result: ImportResult = { added: [], known: 0, invalid: 0 }
  for (const entry of list) {
    const parsed = parseSetup(entry)
    if (!parsed.ok) {
      result.invalid += 1
      continue
    }
    const taken = [...existing, ...result.added]
    if (taken.some((setup) => sameSetup(setup, parsed.setup))) {
      result.known += 1
      continue
    }
    const clash = taken.some((setup) => setup.id === parsed.setup.id)
    result.added.push(clash ? { ...parsed.setup, id: crypto.randomUUID() } : parsed.setup)
  }
  return result
}
