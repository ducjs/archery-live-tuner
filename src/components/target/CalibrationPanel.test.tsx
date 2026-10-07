// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HEURISTIC_V0, createHeuristicModel, heuristicModel } from '../../engine/index.ts'
import { NO_PERSONAL, type Personal } from '../../models/calibration.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useCalibrationStore, useModel } from '../../state/calibrationStore.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { createObservation } from '../../utils/observations.ts'
import { CalibrationPanel } from './CalibrationPanel.tsx'

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  useObservationStore.setState({ observations: [], failed: false })
  useCalibrationStore.setState({ fit: null, enabled: false })
})

const reference = createDefaultSetup('Indoor')

function withDisplay(setup: TuningSetup, key: string, displayValue: number): TuningSetup {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, displayValue))
}

/** What an archer for whom the base model is off by `truth` would have noted over a few setups. */
function noteAs(truth: Personal) {
  const real = createHeuristicModel(HEURISTIC_V0, truth)
  const setups = [
    reference,
    withDisplay(reference, 'arrow.spine', 800),
    withDisplay(reference, 'arrow.spine', 600),
    withDisplay(reference, 'arrow.pointWeight', 100),
    withDisplay(reference, 'bow.nockingPointHeight', 7),
  ]
  useObservationStore.setState({
    observations: setups.map((setup) => {
      const comparison = real.compareBareShaft(setup)
      return createObservation(setup, {
        stiffness: comparison.fletched.classification.stiffness,
        bareHorizontal: comparison.horizontal,
        bareVertical: comparison.vertical,
      })
    }),
  })
}

const fitButton = () => screen.getByRole('button', { name: /^Fit (to my observations|again)$/ })

describe('CalibrationPanel', () => {
  it('says what it takes when there is too little to fit', async () => {
    const user = userEvent.setup()
    render(<CalibrationPanel />)
    expect(screen.getByText('0 observations in this browser.')).toBeTruthy()

    await user.click(fitButton())
    expect(screen.getByText(/takes at least 3 observations/)).toBeTruthy()
    expect(useCalibrationStore.getState().fit).toBeNull()
  })

  it('fits an archer whose arrows shoot weak, says what moved, and switches it on', async () => {
    const user = userEvent.setup()
    noteAs({ ...NO_PERSONAL, behaviorShift: -0.12 })
    render(<CalibrationPanel />)

    await user.click(fitButton())
    expect(screen.getByText('Fitted, and switched on.')).toBeTruthy()
    expect(
      screen.getByText(/shoot weaker than the base model expects, by about [\d.]+ steps/),
    ).toBeTruthy()
    expect(
      screen.getByText(/the base model agrees with \d+ and the fitted model with \d+/),
    ).toBeTruthy()
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Use the fitted model' }).checked,
    ).toBe(true)
    expect(screen.getByText('Results on this page come from the model fitted to you.')).toBeTruthy()

    const { fit, enabled } = useCalibrationStore.getState()
    expect(enabled).toBe(true)
    expect(fit!.after).toBeGreaterThan(fit!.before)
    // It is kept for the next visit.
    expect(JSON.parse(localStorage.getItem('tuner.calibration')!).state.enabled).toBe(true)
  })

  it('goes back to the base model with one switch, and forgets the fit with another', async () => {
    const user = userEvent.setup()
    noteAs({ ...NO_PERSONAL, behaviorShift: -0.12 })
    render(<CalibrationPanel />)
    await user.click(fitButton())

    await user.click(screen.getByRole('checkbox', { name: 'Use the fitted model' }))
    expect(useCalibrationStore.getState().enabled).toBe(false)
    expect(screen.getByText('Results on this page come from the base model.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Forget the fit' }))
    expect(useCalibrationStore.getState().fit).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('keeps the base model when no shift does better', async () => {
    const user = userEvent.setup()
    noteAs(NO_PERSONAL)
    render(<CalibrationPanel />)

    await user.click(fitButton())
    expect(screen.getAllByText(/No shift agrees with more of what you saw/).length).toBeGreaterThan(
      0,
    )
    expect(screen.getByText(/Nothing moved/)).toBeTruthy()
    expect(useCalibrationStore.getState().enabled).toBe(false)
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Use the fitted model' }).disabled,
    ).toBe(true)
  })
})

describe('useModel', () => {
  it('is the base model until a fit is switched on, and the base model again after', () => {
    const { result } = renderHook(() => useModel())
    expect(result.current).toBe(heuristicModel)

    act(() =>
      useCalibrationStore.getState().keep({
        personal: { ...NO_PERSONAL, behaviorShift: -0.12 },
        used: 5,
        before: 9,
        after: 15,
        total: 15,
        better: true,
      }),
    )
    expect(result.current.version).toBe(`${heuristicModel.version}+personal`)
    expect(result.current.analyze(reference).classification.stiffness).toBe('WEAK')

    act(() => useCalibrationStore.getState().setEnabled(false))
    expect(result.current).toBe(heuristicModel)
  })

  it('does not switch on a fit that is no better', () => {
    const { result } = renderHook(() => useModel())
    act(() =>
      useCalibrationStore.getState().keep({
        personal: { ...NO_PERSONAL, behaviorShift: 0.05 },
        used: 3,
        before: 9,
        after: 9,
        total: 9,
        better: false,
      }),
    )
    expect(result.current).toBe(heuristicModel)
  })
})
