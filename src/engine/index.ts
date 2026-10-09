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
export {
  FARTHEST_DISTANCE,
  attributes,
  forgiveness,
  sightReach,
  type Attribute,
  type AttributeGroup,
  type AttributeId,
  type Tone,
} from './explore/attributes.ts'
export { FINE, influence, setupTone, valueTone, type Influence } from './explore/influence.ts'
export { DRAG_COEFFICIENT, dragPerMeter, launchAngleFor } from './ballistics/flight.ts'
export {
  CLOSE_ROOM,
  pinPosition,
  type PinPosition,
  type SightGeometry,
} from './ballistics/sightClearance.ts'
export {
  MIN_MARKS,
  fitSightMarks,
  usableMarks,
  type SightFit,
  type SightInputs,
  type SightPrediction,
} from './ballistics/sightMarks.ts'
export { MIN_OBSERVATIONS, fitPersonal, type Calibration } from './calibration/fit.ts'
export { HEURISTIC_V0, parseCoefficients, type Coefficients } from './coefficients/coefficients.ts'
export {
  planTuning,
  type PlanOptions,
  type PlanReading,
  type PlanStep,
  type TuningPlan,
} from './recommendation/plan.ts'
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
export { FOC_RANGE, MIN_GRAINS_PER_POUND } from './simulation/derivedMetrics.ts'
export { DEFAULT_TRAJECTORY_OPTIONS, type TrajectoryOptions } from './simulation/trajectory.ts'
