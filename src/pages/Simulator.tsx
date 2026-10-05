import { useMemo } from 'react'
import { ParameterSlider } from '../components/common/ParameterSlider.tsx'
import { SimulationStage } from '../components/simulation/SimulationStage.tsx'
import { ResultPanel } from '../components/tuning/ResultPanel.tsx'
import { heuristicModel } from '../engine/index.ts'
import { arrowTotalMass } from '../models/arrow.ts'
import { getParameter, getValue, type NumberParameter } from '../models/parameters.ts'
import { useTuningStore } from '../state/tuningStore.ts'
import { convert } from '../utils/units.ts'

const pointWeight = getParameter('arrow.pointWeight') as NumberParameter

export function Simulator() {
  const setup = useTuningStore((state) => state.setup)
  const setParameter = useTuningStore((state) => state.setParameter)
  const resetParameter = useTuningStore((state) => state.resetParameter)

  const result = useMemo(() => heuristicModel.simulate(setup), [setup])

  const { bow, arrow } = setup
  const summary = [
    `${convert(bow.drawWeight, 'N', 'lbf').toFixed(0)} lb`,
    `${convert(bow.drawLength, 'mm', 'in').toFixed(0)} in draw`,
    `${convert(arrow.length, 'mm', 'in').toFixed(0)} in arrow`,
    `${arrow.spine} spine`,
  ].join(', ')

  return (
    <main className="mx-auto max-w-6xl px-4 pt-5 pb-12 sm:px-6">
      <header>
        <h1 className="font-display text-3xl leading-tight font-semibold">
          Recurve tuning simulator
        </h1>
        <p className="text-ink-muted mt-1 max-w-prose">
          Change the point weight and watch how the arrow leaves the bow.
        </p>
      </header>

      <div className="mt-5 grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-8">
        {/* The stage stays in view on a phone while a slider is dragged. */}
        <div className="bg-paper sticky top-0 z-10 -mx-4 min-w-0 px-4 py-2 sm:-mx-6 sm:px-6 lg:static lg:order-2 lg:m-0 lg:p-0">
          <SimulationStage result={result} handedness={bow.handedness} />
        </div>

        <div className="min-w-0 lg:order-1 lg:row-span-2">
          <h2 className="font-display text-xl font-semibold">Arrow</h2>
          <div className="mt-3">
            <ParameterSlider
              parameter={pointWeight}
              value={getValue(setup, pointWeight)}
              onChange={(value) => setParameter(pointWeight.key, value)}
              onReset={() => resetParameter(pointWeight.key)}
            />
          </div>
          <dl className="border-line mt-5 grid grid-cols-[1fr_auto] gap-y-1.5 border-t pt-4">
            <dt className="text-ink-muted">Total arrow mass</dt>
            <dd className="text-right font-medium">
              {convert(arrowTotalMass(arrow), 'g', 'gr').toFixed(0)} gr
            </dd>
            <dt className="text-ink-muted">Estimated speed</dt>
            <dd className="text-right font-medium">
              {(result.metrics.launchSpeed / 1000).toFixed(1)} m/s
            </dd>
          </dl>
          <p className="text-ink-muted mt-4 text-sm">Rest of the setup: {summary}.</p>
        </div>

        <div className="min-w-0 lg:order-3 lg:col-start-2">
          <ResultPanel result={result} />
        </div>
      </div>
    </main>
  )
}
