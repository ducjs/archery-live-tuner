export type TuningClassification = {
  stiffness: 'WEAK' | 'NEUTRAL' | 'STIFF'
  oscillation: 'LOW' | 'MEDIUM' | 'HIGH'
  lateral: 'LEFT' | 'NEUTRAL' | 'RIGHT'
  clearance: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type TrajectoryPoint = {
  /** s */
  t: number
  /** mm, downrange */
  x: number
  /** mm, vertical */
  y: number
  /** mm, lateral: negative = left, positive = right */
  z?: number
  /** rad */
  yaw?: number
  /** rad */
  pitch?: number
  /** normalized shaft bend at this instant, signed */
  flex?: number
}

export type SimulationMetrics = {
  /** -1 = very weak, 0 = neutral, +1 = very stiff */
  dynamicBehavior: number
  /** 0..1 */
  flexAmplitude: number
  /** 0..1 */
  oscillation: number
  /** -1 = far left, +1 = far right */
  lateralDeviation: number
  /** rad */
  yaw: number
  /** rad */
  pitch: number
  /** s, time until oscillation has died down */
  stabilityTime: number
  /** 0..1 */
  clearanceRisk: number
}

export type SimulationResult = {
  setupId: string
  modelVersion: string
  classification: TuningClassification
  metrics: SimulationMetrics
  trajectory: TrajectoryPoint[]
}
