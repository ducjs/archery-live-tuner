import { useState } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import { getParameter, type NumberParameter } from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { BOLT_RANGE, onFingers } from '../../utils/markedDrawWeight.ts'
import { convert } from '../../utils/units.ts'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { buttonClass, inputClass } from '../common/styles.ts'

const BOLTS = { OUT: -BOLT_RANGE, MIDDLE: 0, IN: BOLT_RANGE } as const
type Bolt = keyof typeof BOLTS

/** For an archer who has no bow scale: an estimate of the draw weight from the limb marking. */
export function MarkedWeightHelper() {
  const m = useMessages()
  const text = m.curve.marked
  const drawLength = useTuningStore((state) => state.setup.bow.drawLength)
  const setParameter = useTuningStore((state) => state.setParameter)
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [bolt, setBolt] = useState<Bolt>('MIDDLE')

  // Limbs are marked in pounds whatever units the rest of the page shows.
  const marked = Number(typed)
  const usable = typed.trim() !== '' && Number.isFinite(marked) && marked > 0
  const weight = getParameter('bow.drawWeight') as NumberParameter
  const estimate = usable ? onFingers(convert(marked, 'lbf', 'N'), drawLength, BOLTS[bolt]) : 0
  const accepted = Number.isFinite(estimate) && estimate >= weight.min && estimate <= weight.max

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="marked-weight"
        onClick={() => setOpen(!open)}
        className="text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md text-left font-medium underline underline-offset-4 focus-visible:outline-2"
      >
        {text.open}
      </button>
      {open && (
        <div id="marked-weight" className="mt-2 grid max-w-md gap-3">
          <label className="grid gap-1">
            <span className="text-ink-muted">{text.weight}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className={inputClass}
            />
          </label>
          <SegmentedControl
            label={text.bolts}
            options={(Object.keys(BOLTS) as Bolt[]).map((value) => ({
              value,
              label: text.bolt[value],
            }))}
            value={bolt}
            onChange={(value) => setBolt(value as Bolt)}
          />
          {usable && !accepted && <p className="font-medium">{text.outOfRange}</p>}
          {usable && accepted && (
            <>
              <p className="font-medium">
                {text.estimate(
                  `${convert(estimate, 'N', 'lbf').toFixed(1)} lb`,
                  `${convert(drawLength, 'mm', 'in').toFixed(1)} in`,
                )}
              </p>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setParameter('bow.drawWeight', estimate)}
              >
                {text.use}
              </button>
            </>
          )}
          <p className="text-ink-muted text-sm">{text.note}</p>
        </div>
      )}
    </div>
  )
}
