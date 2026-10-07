export {
  LANDSCAPE_POINTS,
  LANDSCAPE_SPINES,
  explore,
  landscape,
  sensitivity,
  type Exploration,
  type LandscapeCell,
  type Sensitivity,
} from './explore/explore.ts'
export {
  MIN_BARE,
  MIN_FLETCHED,
  diagnosePlot,
  plungerReach,
  readPlot,
  shaftLimit,
  type Diagnosis,
  type DiagnosisCause,
  type DiagnosisStep,
  type PlotReading,
} from './diagnosis/targetPlot.ts'
export {
  compareObservation,
  type ObservationComparison,
  type ObservationRow,
} from './diagnosis/observation.ts'
export { DRAG_COEFFICIENT, dragPerMeter, launchAngleFor } from './ballistics/flight.ts'
export {
  MIN_MARKS,
  fitSightMarks,
  usableMarks,
  type SightFit,
  type SightInputs,
  type SightPrediction,
} from './ballistics/sightMarks.ts'
export { HEURISTIC_V0, parseCoefficients, type Coefficients } from './coefficients/coefficients.ts'
export {
  suggestTuning,
  suggestionGroup,
  type Effort,
  type SuggestOptions,
  type Suggestion,
  type SuggestionGroup,
  type TuningAdvice,
} from './recommendation/suggest.ts'
export {
  createHeuristicModel,
  heuristicModel,
  type Analysis,
  type SetupInput,
  type SimulateOptions,
  type SimulationModel,
} from './simulation/simulate.ts'
export { curvePoints, shapeOf } from './simulation/drawCurve.ts'
export { readPaperTear } from './simulation/paperTear.ts'
export { MIN_GRAINS_PER_POUND } from './simulation/derivedMetrics.ts'
export { DEFAULT_TRAJECTORY_OPTIONS, type TrajectoryOptions } from './simulation/trajectory.ts'
