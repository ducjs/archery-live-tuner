import { LANDSCAPE_POINTS, type LandscapeCell, type Sensitivity } from '../../engine/index.ts'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import {
  displayOf,
  fromDisplay,
  getParameter,
  toDisplay,
  visibleParameters,
  type NumberParameter,
} from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { unitLabel } from '../../utils/units.ts'

const point = getParameter('arrow.pointWeight') as NumberParameter

// Diverging scale: weak and stiff are the two poles, neutral has no hue.
function cellStyle(behavior: number) {
  const strength = Math.min(1, Math.abs(behavior) / 0.8)
  if (strength < 0.25) return undefined
  const pole = behavior < 0 ? 'var(--color-chart-weak)' : 'var(--color-chart-stiff)'
  return { background: `color-mix(in oklab, ${pole} ${Math.round(strength * 78)}%, transparent)` }
}

/** Which spine and point weight suit the bow on screen. A cell puts its pair into the setup. */
export function Landscape({ grid }: { grid: LandscapeCell[][] }) {
  const m = useMessages()
  const text = m.explore
  const setup = useTuningStore((state) => state.setup)
  const units = useTuningStore((state) => state.units)
  const setParameter = useTuningStore((state) => state.setParameter)

  const { unit, decimals } = displayOf(point, units)
  const shownPoint = (grains: number) =>
    toDisplay(point, fromDisplay(point, grains), unit ?? undefined).toFixed(
      units === 'metric' ? decimals : 0,
    )
  const pointUnit = unit ? unitLabel(unit) : ''
  // The column of the setup on screen: the point weight nearest to its own.
  const currentPoint = toDisplay(point, setup.arrow.pointWeight)
  const nearestPoint = LANDSCAPE_POINTS.reduce((best, grains) =>
    Math.abs(grains - currentPoint) < Math.abs(best - currentPoint) ? grains : best,
  )

  return (
    <section
      aria-labelledby="landscape-heading"
      className="border-line bg-panel rounded-xl border p-4"
    >
      <h2 id="landscape-heading" className="font-display text-xl font-semibold">
        {text.landscape}
      </h2>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.landscapeIntro}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-center">
          <caption className="sr-only">{text.landscapeCaption(pointUnit)}</caption>
          <thead>
            <tr>
              <td className="text-ink-muted pr-2 text-right text-sm">{text.axes(pointUnit)}</td>
              {LANDSCAPE_POINTS.map((grains) => (
                <th key={grains} scope="col" className="text-ink-muted px-0.5 text-sm font-normal">
                  {shownPoint(grains)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row[0]!.spine}>
                <th scope="row" className="text-ink-muted pr-2 text-right text-sm font-normal">
                  {row[0]!.spine}
                </th>
                {row.map((cell) => {
                  const selected =
                    cell.spine === setup.arrow.spine && cell.pointWeight === nearestPoint
                  return (
                    <td key={cell.pointWeight} className="p-0">
                      <button
                        type="button"
                        aria-label={text.cell(
                          cell.spine,
                          `${shownPoint(cell.pointWeight)} ${pointUnit}`,
                          m.rating[cell.rating],
                        )}
                        aria-pressed={selected}
                        onClick={() => {
                          setParameter('arrow.spine', cell.spine)
                          setParameter(point.key, fromDisplay(point, cell.pointWeight))
                        }}
                        style={cellStyle(cell.behavior)}
                        className="bg-ink-muted/10 focus-visible:outline-accent aria-pressed:ring-ink h-10 w-10 cursor-pointer rounded text-sm font-semibold focus-visible:outline-2 aria-pressed:ring-2 sm:w-11"
                      >
                        {text.letter[cell.rating]}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="text-ink-muted mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {(['STIFF', 'NEUTRAL', 'WEAK'] as const).map((rating) => (
          <li key={rating} className="flex items-center gap-1.5">
            <span
              className="bg-ink-muted/25 size-3 rounded-sm"
              style={
                rating === 'NEUTRAL'
                  ? undefined
                  : { background: `var(--color-chart-${rating === 'WEAK' ? 'weak' : 'stiff'})` }
              }
            />
            {text.letter[rating]}: {m.rating[rating].toLowerCase()}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** How many values the chart lists. Past these the bars are too short to tell apart. */
const MOST = 8

/** Which values move weak and stiff most for the setup on screen, largest first. */
export function SensitivityChart({ entries }: { entries: Sensitivity[] }) {
  const m = useMessages()
  const text = m.explore
  const mode = useTuningStore((state) => state.mode)

  // Simple mode only lists values it shows.
  const visible = new Set(
    [...visibleParameters('bow', mode), ...visibleParameters('arrow', mode)].map(
      (parameter) => parameter.key,
    ),
  )
  const shown = entries.filter((entry) => visible.has(entry.key)).slice(0, MOST)
  const largest = Math.max(...shown.map((entry) => Math.abs(entry.effect)), 0.01)

  return (
    <section
      aria-labelledby="sensitivity-heading"
      className="border-line bg-panel rounded-xl border p-4"
    >
      <h2 id="sensitivity-heading" className="font-display text-xl font-semibold">
        {text.sensitivity}
      </h2>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.sensitivityIntro}</p>
      <div className="text-ink-muted mt-2 grid grid-cols-[minmax(0,9rem)_1fr_3rem] gap-x-3 text-sm">
        <span />
        <span className="flex justify-between">
          <span>{text.weaker}</span>
          <span>{text.stiffer}</span>
        </span>
        <span />
      </div>
      <ul className="mt-1 grid gap-1.5">
        {shown.map((entry) => {
          const share = (Math.abs(entry.effect) / largest) * 50
          const label = parameterText(m, getParameter(entry.key)).label
          return (
            <li
              key={entry.key}
              className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-x-3"
            >
              <span className="truncate">{label}</span>
              <span className="bg-ink-muted/10 relative block h-4 rounded" aria-hidden="true">
                <span className="bg-ink-muted absolute inset-y-0 left-1/2 w-px" />
                <span
                  className="absolute inset-y-0 rounded"
                  style={{
                    width: `${share}%`,
                    left: entry.effect < 0 ? `${50 - share}%` : '50%',
                    background: `var(--color-chart-${entry.effect < 0 ? 'weak' : 'stiff'})`,
                  }}
                />
              </span>
              <span
                className="text-right text-sm font-semibold"
                aria-label={text.effect(entry.effect < 0, Math.abs(entry.effect).toFixed(2))}
              >
                {entry.effect > 0 ? '+' : '−'}
                {Math.abs(entry.effect).toFixed(2)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
