export type TuningClassification = {
  stiffness: 'WEAK' | 'NEUTRAL' | 'STIFF'
  oscillation: 'LOW' | 'MEDIUM' | 'HIGH'
  lateral: 'LEFT' | 'NEUTRAL' | 'RIGHT'
  clearance: 'LOW' | 'MEDIUM' | 'HIGH'
  vertical: 'NOCK_LOW' | 'NEUTRAL' | 'NOCK_HIGH'
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
  /** Hz, first bending mode of the shaft */
  oscillationFrequency: number
  /** 1/s, how fast fletching damps the oscillation */
  oscillationDecay: number
  /** -1 = far left, +1 = far right */
  lateralDeviation: number
  /** -1 = nock far too low, +1 = nock far too high */
  verticalTendency: number
  /** rad */
  yaw: number
  /** rad */
  pitch: number
  /** s, time until oscillation has died down */
  stabilityTime: number
  /** 0..1 */
  clearanceRisk: number
  /** mm/s, estimated */
  launchSpeed: number
}

/**
 * The bare shaft test: a shaft without fletching, weighted to match, shot with
 * the fletched arrows. Fletching steers an arrow back toward the line, so the
 * bare shaft shows the launch error that the fletched arrows hide.
 */
export type BareShaftComparison = {
  fletched: SimulationResult
  bare: SimulationResult
  /** Where the bare shaft lands relative to the fletched arrows. */
  horizontal: 'LEFT' | 'TOGETHER' | 'RIGHT'
  vertical: 'LOW' | 'TOGETHER' | 'HIGH'
  /** Offset of the bare shaft from the fletched arrows, on the -1..+1 scales. */
  offset: {
    /** positive = right */
    lateral: number
    /** positive = high */
    vertical: number
  }
}

/** The shot before the arrow is free: what the views need to draw the bow at full draw. */
export type LaunchGeometry = {
  /** mm, how far the string carries the arrow, from full draw to brace height */
  powerStroke: number
  /** s, from release until the nock leaves the string */
  timeOnString: number
  /** rad, how far the arrow on the bow points below square to the string; positive for a nocking point above square */
  nockAngle: number
}

export type SimulationResult = {
  setupId: string
  modelVersion: string
  launch: LaunchGeometry
  classification: TuningClassification
  metrics: SimulationMetrics
  trajectory: TrajectoryPoint[]
}
