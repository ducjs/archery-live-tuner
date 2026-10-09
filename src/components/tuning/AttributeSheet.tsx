import type { Attribute, AttributeGroup, Tone } from '../../engine/index.ts'
import { FARTHEST_DISTANCE } from '../../engine/index.ts'
import type { Messages } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { tierShows, type ParameterTier, type UnitSystem } from '../../models/parameters.ts'
import { panelClass } from '../common/styles.ts'

type Props = {
  groups: AttributeGroup[]
  /** The level decides how many of the groups are shown. */
  level: ParameterTier
  units: UnitSystem
}

/** The level from which a group is shown. */
const GROUP_TIER: Record<AttributeGroup['id'], ParameterTier> = {
  bareShaft: 'simple',
  flight: 'advanced',
  performance: 'pro',
}

const FILL: Record<Tone, string> = {
  good: 'bg-good',
  fair: 'bg-gold',
  poor: 'bg-weak',
  plain: 'bg-ink-muted',
}

/** What is written next to a bar: the number in its unit, or the side it leans to. */
function reading(attribute: Attribute, m: Messages, units: UnitSystem): string {
  const text = m.attributes
  const { id, value } = attribute
  switch (id) {
    case 'lateral':
    case 'vertical':
    case 'stiffness': {
      const { low, middle, high } = text.ends[id]
      if (attribute.tone === 'good') return middle
      const size = text.outOfTen(String(Math.max(1, Math.round(Math.abs(attribute.share) * 10))))
      return `${value < 0 ? low : high} ${size}`
    }
    case 'speed':
      return units === 'archery' ? `${(value * 3.28084).toFixed(0)} fps` : `${value.toFixed(1)} m/s`
    case 'settling':
      return `${value.toFixed(2)} s`
    case 'frontOfCenter':
      return `${value.toFixed(1)} %`
    case 'efficiency':
      return `${value.toFixed(0)} %`
    case 'arrowMass':
      return `${value.toFixed(1)} gr/lb`
    case 'sightReach':
      if (value <= 0) return text.noReach
      return value >= FARTHEST_DISTANCE ? text.andMore(value) : `${value.toFixed(0)} m`
    case 'clearance':
    case 'forgiveness':
    case 'steadiness':
      return text.outOfTen(value.toFixed(1))
  }
}

function Bar({ attribute }: { attribute: Attribute }) {
  const fill = FILL[attribute.tone]
  if (attribute.kind === 'level') {
    return (
      <span className="bg-line block h-2 overflow-hidden rounded-full" aria-hidden="true">
        <span
          className={`${fill} block h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none`}
          style={{ width: `${Math.max(2, attribute.share * 100)}%` }}
        />
      </span>
    )
  }
  // A lean: the middle is the aim, and the bar grows from it to one side.
  const size = Math.abs(attribute.share) * 50
  return (
    <span className="bg-line relative block h-2 rounded-full" aria-hidden="true">
      <span
        className={`${fill} absolute inset-y-0 rounded-full transition-[left,width] duration-200 motion-reduce:transition-none`}
        style={
          size < 2
            ? { left: 'calc(50% - 0.375rem)', width: '0.75rem' }
            : { left: `${attribute.share < 0 ? 50 - size : 50}%`, width: `${size}%` }
        }
      />
      <span className="bg-ink absolute inset-y-[-3px] left-1/2 w-px" />
    </span>
  )
}

/** The setup as a sheet of bars: where it leans, how it flies, what it gives. */
export function AttributeSheet({ groups, level, units }: Props) {
  const m = useMessages()
  const text = m.attributes
  const shown = groups.filter((group) => tierShows(level, GROUP_TIER[group.id]))

  return (
    <section aria-labelledby="attributes-heading" className={`${panelClass} @container`}>
      <h2 id="attributes-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <div className="mt-3 grid gap-x-8 gap-y-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {shown.map((group) => (
          <div key={group.id} className="min-w-0">
            <h3 className="text-ink-muted text-sm font-medium">{text.groups[group.id]}</h3>
            <dl className="mt-1.5 grid gap-2.5">
              {group.attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1"
                >
                  <dt className="min-w-0">
                    {text.labels[attribute.id]}
                    {attribute.estimate && (
                      <span className="text-ink-muted text-sm"> ({text.estimate})</span>
                    )}
                  </dt>
                  {/* The bar is drawn under both; it belongs to the value. */}
                  <dd className="contents">
                    <span className="text-right font-semibold tabular-nums">
                      {reading(attribute, m, units)}
                      {attribute.kind === 'level' && attribute.tone !== 'plain' && (
                        <span className="text-ink-muted ml-2 text-sm font-normal">
                          {text.tones[attribute.tone]}
                        </span>
                      )}
                    </span>
                    <span className="col-span-2 block">
                      <Bar attribute={attribute} />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            {group.id === 'performance' && (
              <p className="text-ink-muted mt-2 text-sm">{text.sightNote}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-ink-muted mt-4 max-w-prose text-sm">{text.about}</p>
    </section>
  )
}
