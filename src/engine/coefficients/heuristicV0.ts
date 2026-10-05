import { convert } from '../../utils/units.ts'

// Every number in this file is a HEURISTIC. None of them has been validated against
// real shooting data. They are tuned so that the reference setup (spec §19) comes out
// neutral and so that changes move the result in the direction archers expect.
//
// Values are in internal units (mm, g, N) unless the name says otherwise.
export const HEURISTIC_V0 = {
  version: 'heuristic-0.1',

  /** The setup that the model treats as perfectly tuned. */
  reference: {
    drawWeight: convert(38, 'lbf', 'N'),
    drawLength: convert(28, 'in', 'mm'),
    braceHeight: 220,
    arrowLength: convert(27, 'in', 'mm'),
    spine: 700,
    frontMass: convert(120 + 12, 'gr', 'g'),
    tailMass: convert(9 + 5, 'gr', 'g'),
    stringMass: convert(105, 'gr', 'g'),
    strandCount: 16,
    plungerStiffness: 1,
    plungerPreload: 1,
    nockingPointHeight: 4,
    tiller: 4,
    shaftDiameter: 4.2,
    bowMass: 3000,
    stabilizerMass: 250,
    stabilizerPosition: 700,
  },

  /**
   * Exponents of the required-spine power law. A positive exponent means that
   * increasing the input calls for a stiffer shaft (a lower spine number).
   */
  requiredSpine: {
    drawWeight: 1.0,
    powerStroke: 0.5,
    arrowLength: 2.5,
    frontMass: 0.3,
    tailMass: -0.1,
    stringMass: -0.1,
    strandCount: -0.05,
  },

  behavior: {
    /** Maps the log stiffness mismatch onto the -1..+1 scale. */
    gain: 3,
    /** Log-mismatch shift per unit of plunger stiffness above medium. */
    plungerShift: 0.08,
  },

  flex: {
    neutralAmplitude: 0.4,
    mismatchGain: 1.2,
    /** 1/s, how fast the shaft bending dies out. */
    decay: 14,
    /** Lowers the free-free beam frequency for the mass carried at both ends. */
    endMassFactor: 2,
  },

  oscillation: {
    base: 0.2,
    mismatch: 0.55,
    weakExtra: 0.15,
    perMmCenterShot: 0.05,
    perMmPreloadOffset: 0.05,
    bowInertia: 0.08,
    /** 1/s */
    baseDecay: 12,
    /** 1/s per grain of fletching */
    decayPerGrainFletching: 2,
    /** Hz, rigid-body fishtailing, far slower than shaft bending */
    fishtailFrequency: 6,
    /** Oscillation level regarded as "settled" when computing stability time. */
    settledLevel: 0.05,
  },

  lateral: {
    behavior: 0.9,
    perMmCenterShot: 0.25,
    perMmPreload: 0.15,
    /** rad of launch yaw at full lateral deviation */
    maxYaw: 0.02,
    /** rad of fishtail amplitude at full oscillation */
    maxFishtail: 0.03,
    /** Sideways drift per unit of distance at full lateral deviation. Illustrative. */
    driftSlope: 1 / 120,
  },

  vertical: {
    perMmNockingPoint: 0.25,
    perMmTiller: 0.08,
    /** rad of launch pitch at full vertical tendency */
    maxPitch: 0.015,
    driftSlope: 1 / 200,
  },

  clearance: {
    base: 0.15,
    mismatch: 0.5,
    perMmTowardRiser: 0.06,
    tightNock: 0.1,
    looseNock: -0.03,
    lowBrace: 0.6,
    vertical: 0.1,
    perMmDiameter: 0.03,
  },

  energy: {
    /** Stored energy relative to a linear draw-force curve (½·F·stroke). */
    drawCurveFactor: 1.14,
    /** g, mass of limbs and string that moves with the arrow */
    limbVirtualMass: 5.5,
    stringMassShare: 1 / 3,
  },

  thresholds: {
    stiffnessNeutral: 0.2,
    lateralNeutral: 0.15,
    verticalNeutral: 0.15,
    oscillationMedium: 0.35,
    oscillationHigh: 0.65,
    clearanceMedium: 0.33,
    clearanceHigh: 0.66,
  },
}

export type Coefficients = typeof HEURISTIC_V0
