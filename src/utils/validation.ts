import { z } from 'zod'
import { PARAMETERS, type NumberParameter, type Parameter } from '../models/parameters.ts'
import { SETUP_SCHEMA_VERSION, type TuningSetup } from '../models/setup.ts'

function leafSchema(parameter: Parameter): z.ZodType {
  if (parameter.kind === 'enum') {
    return z.enum(parameter.options as [string, ...string[]])
  }
  const schema = z.number().min(parameter.min).max(parameter.max)
  return parameter.integer ? schema.int() : schema
}

type SchemaTree = { [segment: string]: SchemaTree | z.ZodType }

function isSchema(node: SchemaTree | z.ZodType): node is z.ZodType {
  return node instanceof z.ZodType
}

function toObjectSchema(tree: SchemaTree): z.ZodType {
  const shape: Record<string, z.ZodType> = {}
  for (const [segment, node] of Object.entries(tree)) {
    shape[segment] = isSchema(node) ? node : toObjectSchema(node)
  }
  return z.object(shape)
}

// The bow and arrow schemas are generated from the parameter table, so bounds live in one place.
function buildValuesTree(): SchemaTree {
  const root: SchemaTree = {}
  for (const parameter of PARAMETERS) {
    const path = parameter.key.split('.')
    const leaf = path.pop()!
    let node = root
    for (const segment of path) {
      node = (node[segment] ??= {}) as SchemaTree
    }
    node[leaf] = leafSchema(parameter)
  }
  return root
}

const valuesTree = buildValuesTree()

const releaseSchema = z.object({
  lateralReleaseError: z.number(),
  verticalReleaseError: z.number(),
  stringRotation: z.number(),
  releaseConsistency: z.number(),
})

const setupSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(SETUP_SCHEMA_VERSION),
  name: z.string().trim().min(1).max(100),
  bow: toObjectSchema(valuesTree.bow as SchemaTree),
  arrow: toObjectSchema(valuesTree.arrow as SchemaTree),
  release: releaseSchema.optional(),
  metadata: z
    .object({
      notes: z.string().max(2000).optional(),
      createdAt: z.string().optional(),
    })
    .optional(),
})

export type ValidationIssue = {
  /** Dotted path, e.g. `bow.drawWeight`. */
  path: string
  message: string
}

export type ParseResult =
  { ok: true; setup: TuningSetup } | { ok: false; issues: ValidationIssue[] }

/**
 * Gives a setup the default of every value it does not have. A setup stored
 * before a parameter was added to the app is still a good setup; without this
 * it would be refused, and saved work would vanish with every new parameter.
 */
function withDefaults(input: unknown): unknown {
  if (input === null || typeof input !== 'object') return input
  let setup = input as Record<string, unknown>
  for (const parameter of PARAMETERS) {
    const path = parameter.key.split('.')
    let node: unknown = setup
    for (const segment of path) {
      node = node !== null && typeof node === 'object' ? (node as Tree)[segment] : undefined
    }
    if (node !== undefined) continue
    // Only a missing value is filled in. A parent that is there but is not a
    // group of values is left for the schema to refuse.
    const parents = path.slice(0, -1)
    let parent: unknown = setup
    for (const segment of parents) parent = (parent as Tree)?.[segment]
    if (parents.length > 0 && (parent === null || typeof parent !== 'object')) continue
    setup = fill(setup, path, parameter.default)
  }
  return setup
}

type Tree = Record<string, unknown>

function fill(tree: Tree, path: string[], value: unknown): Tree {
  const [head, ...rest] = path
  if (head === undefined) return tree
  return {
    ...tree,
    [head]: rest.length === 0 ? value : fill((tree[head] ?? {}) as Tree, rest, value),
  }
}

/** Validates untrusted input (imported JSON, URL state, localStorage). */
export function parseSetup(input: unknown): ParseResult {
  const result = setupSchema.safeParse(withDefaults(input))
  if (result.success) {
    return { ok: true, setup: result.data as TuningSetup }
  }
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}

export function isValidValue(parameter: Parameter, value: unknown): boolean {
  return leafSchema(parameter).safeParse(value).success
}

/** Forces a number into the parameter's bounds. Non-finite input falls back to the default. */
export function clampValue(parameter: NumberParameter, value: number): number {
  if (!Number.isFinite(value)) return parameter.default
  const bounded = Math.min(parameter.max, Math.max(parameter.min, value))
  return parameter.integer ? Math.round(bounded) : bounded
}
