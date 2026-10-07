import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { buttonClass } from '../common/styles.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { FACES, usePlotStore } from '../../state/plotStore.ts'
import { DISTANCES } from '../simulation/timing.ts'

/** Which arrow the next tap marks, where the target stands, and taking marks back. */
export function TargetControls() {
  const text = useMessages().target
  const plot = usePlotStore((state) => state.plot)
  const bare = usePlotStore((state) => state.bare)
  const end = usePlotStore((state) => state.end)
  const { setBare, removeLast, clear, nextEnd, setDistance, setFace } = usePlotStore.getState()
  const inEnd = plot.marks.filter((mark) => mark.end === end).length

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <SegmentedControl
          label={text.kind}
          options={[
            { value: 'fletched', label: text.fletched },
            { value: 'bare', label: text.bare },
          ]}
          value={bare ? 'bare' : 'fletched'}
          onChange={(kind) => setBare(kind === 'bare')}
        />
        <ul className="text-ink-muted flex gap-4 text-sm" aria-hidden="true">
          <li className="flex items-center gap-1.5">
            <span className="bg-ink ring-surface size-3 rounded-full ring-2" /> {text.fletched}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="border-ink bg-surface size-3 border-2" /> {text.bare}
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 font-medium" role="status">
          {text.end(end, inEnd)}
        </p>
        <button type="button" className={buttonClass} disabled={inEnd === 0} onClick={nextEnd}>
          {text.nextEnd}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={plot.marks.length === 0}
          onClick={removeLast}
        >
          {text.removeLast}
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={plot.marks.length === 0}
          onClick={clear}
        >
          {text.clear}
        </button>
      </div>

      <div className="border-line bg-surface flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-3 py-2">
        <SegmentedControl
          label={text.distance}
          options={DISTANCES.map((meters) => ({ value: String(meters), label: `${meters} m` }))}
          value={String(plot.distance / 1000)}
          onChange={(meters) => setDistance(Number(meters) * 1000)}
        />
        <SegmentedControl
          label={text.face}
          options={FACES.map((face) => ({ value: String(face), label: `${face / 10} cm` }))}
          value={String(plot.faceDiameter)}
          onChange={(face) => setFace(Number(face))}
        />
      </div>
    </div>
  )
}
