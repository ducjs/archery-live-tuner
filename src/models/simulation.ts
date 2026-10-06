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

/** The two numbers that shape the draw force curve (spec §39.2). */
export type CurveShape = {
  /** How far the curve bulges above a straight line in mid-draw. Sets the stored energy. */
  fullness: number
  /** How much steeper the two ends are than the middle. Sets the force gain at the clicker. */
  endRise: number
  /** How many forces measured by the archer shaped it. 0 is an estimate from the setup. */
  measuredPoints: 0 | 1 | 2
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
  /** Bending cycles the shaft has gone through when its tail passes the riser. */
  clearanceCycles: number
  /** mm/s, estimated */
  launchSpeed: number
  /** J, of the arrow at that speed */
  kineticEnergy: number
  /** J, stored in the bow at full draw: the area under the draw force curve */
  storedEnergy: number
  /** N per mm, how fast the force on the fingers still rises at full draw */
  clickerGain: number
  /** Shape of the draw force curve, see `CurveShape` */
  curveFullness: number
  curveEndRise: number
  curveMeasuredPoints: 0 | 1 | 2
  /** gr/lb, arrow mass per pound of draw weight */
  grainsPerPound: number
  /** %, how far the balance point sits ahead of the middle of the shaft */
  frontOfCenter: number
  /** in, riser and limbs together */
  bowLength: number
  /** mm, the lowest brace height recommended for a bow of this length */
  braceHeightMin: number
  /** mm, the highest */
  braceHeightMax: number
  /** mm, center shot against the string as the limbs carry it: the entered value, moved by limb alignment */
  effectiveCenterShot: number
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

/**
 * mm from the center at which an arrow lands when its tendency is at full
 * scale and nothing steers it back. The same for a fletched arrow and a bare
 * shaft of one setup, so a drawing can put both on one scale.
 */
export type FullDrift = {
  lateral: number
  vertical: number
}

export type SimulationResult = {
  setupId: string
  modelVersion: string
  launch: LaunchGeometry
  fullDrift: FullDrift
  classification: TuningClassification
  metrics: SimulationMetrics
  trajectory: TrajectoryPoint[]
}
