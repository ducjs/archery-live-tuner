import base from './heuristic-0.4.json'

// Every number in the coefficient file is a HEURISTIC. None of them has been
// validated against real shooting data. They are tuned so that the reference
// setup (spec §19) comes out neutral and so that changes move the result in the
// direction archers expect.
//
// The numbers live in a versioned JSON file, not in code, so that a calibrated
// set can replace them without touching the engine (spec §34.7). This file says
// what each one means. Values are in internal units (mm, g, N) unless the name
// says otherwise.
export type Coefficients = {
  /** Names the set. Results carry it as `modelVersion`. */
  version: string

  /**
   * The setup that the model treats as perfectly tuned: a 38 lbf bow drawn to
   * 28 in, a 27 in arrow of 700 spine with 120 + 12 gr at the front and 9 + 5 gr
   * at the back, and a 105 gr string. Stored in internal units like the rest.
   */
  reference: {
    drawWeight: number
    drawLength: number
    braceHeight: number
    arrowLength: number
    spine: number
    frontMass: number
    tailMass: number
    stringMass: number
    strandCount: number
    plungerStiffness: number
    plungerPreload: number
    nockingPointHeight: number
    tiller: number
    shaftDiameter: number
    bowMass: number
    stabilizerMass: number
    stabilizerPosition: number
  }

  /**
   * Exponents of the required-spine power law. A positive exponent means that
   * increasing the input calls for a stiffer shaft (a lower spine number).
   */
  requiredSpine: {
    drawWeight: number
    drawLength: number
    /**
     * A higher brace height makes the arrow shoot weaker, and the whole usable
     * range of a recurve is worth about 20 gr of point weight (Easton, Arrow
     * Tuning and Maintenance Guide, "Brace Height").
     */
    braceHeight: number
    arrowLength: number
    frontMass: number
    /**
     * Kept small on purpose. The tail carries about a tenth of the mass of the
     * front, so the same exponent would make a grain at the nock count ten
     * times as much as a grain at the point. With this value it counts for a
     * little less than a grain at the point, in the other direction.
     */
    tailMass: number
    /**
     * A change of strands "can require a shaft one full size weaker or stiffer"
     * (Easton, Arrow Tuning and Maintenance Guide, "Bowstring"). Four strands
     * more on a 16-strand string, with the mass that comes with them, is worth
     * about three quarters of a 50-point spine step here.
     */
    stringMass: number
    strandCount: number
  }

  behavior: {
    /** Maps the log stiffness mismatch onto the -1..+1 scale. */
    gain: number
    /** Log-mismatch shift per unit of plunger stiffness above medium. */
    plungerShift: number
  }

  flex: {
    neutralAmplitude: number
    mismatchGain: number
    /** 1/s, how fast the shaft bending dies out. */
    decay: number
    /** Lowers the free-free beam frequency for the mass carried at both ends. */
    endMassFactor: number
  }

  oscillation: {
    base: number
    mismatch: number
    weakExtra: number
    perMmCenterShot: number
    perMmPreloadOffset: number
    /** Per mm that the two limb tips sit apart sideways: a twisted string plane throws the nock sideways. */
    perMmLimbTwist: number
    bowInertia: number
    /** 1/s */
    baseDecay: number
    /** 1/s per grain of fletching */
    decayPerGrainFletching: number
    /** Hz, rigid-body fishtailing, far slower than shaft bending */
    fishtailFrequency: number
    /** Oscillation level regarded as "settled" when computing stability time. */
    settledLevel: number
  }

  lateral: {
    behavior: number
    perMmCenterShot: number
    perMmPreload: number
    /** rad of launch yaw at full lateral deviation */
    maxYaw: number
    /** rad of fishtail amplitude at full oscillation */
    maxFishtail: number
    /** Sideways drift per unit of distance at full lateral deviation. Illustrative. */
    driftSlope: number
  }

  vertical: {
    perMmNockingPoint: number
    perMmTiller: number
    /** rad of launch pitch at full vertical tendency */
    maxPitch: number
    driftSlope: number
  }

  fletching: {
    /** Largest share of the launch error that fletching can steer out. */
    maxCorrection: number
    /** Grains of fletching at which about two thirds of that is reached. */
    correctionScale: number
  }

  clearance: {
    base: number
    /** For how hard the shaft bends: a mismatched arrow swings wider past the riser. */
    mismatch: number
    /** For bad timing: the risk added when the tail passes the riser at the worst moment. */
    phase: number
    /** Bending cycles away from the neutral count at which the timing is at its worst. */
    phaseSpan: number
    /**
     * Bending cycles the shaft has gone through when its tail passes the riser,
     * for the reference setup. The model takes that timing as the good one.
     */
    neutralCycles: number
    perMmTowardRiser: number
    tightNock: number
    looseNock: number
    lowBrace: number
    vertical: number
    perMmDiameter: number
    /** Per mm that the two limb tips sit apart sideways. */
    perMmLimbTwist: number
  }

  energy: {
    /** g, mass of limbs and string that moves with the arrow */
    limbVirtualMass: number
    stringMassShare: number
  }

  /**
   * The draw force curve of spec §39: force over the power stroke as
   * `u + fullness·u(1−u) + endRise·u(1−u)(1−2u)`, with `u` from 0 at brace
   * height to 1 at full draw.
   */
  drawCurve: {
    /** Fullness of the three curve styles. Stored energy is `1 + fullness / 3` times that of a straight line. */
    fullnessStraight: number
    /** 0.42 gives the factor of 1.14 the model used before it had a curve. */
    fullnessStandard: number
    fullnessFull: number
    /**
     * End rise of a bow whose length fits the draw. Set so that the reference
     * setup gains 5% of its draw weight per inch at full draw, the usual rule
     * for a recurve near 28 in.
     */
    endRise: number
    /** End rise added per inch of draw beyond the one the bow length fits. A guess at the size of a known direction. */
    endRisePerInch: number
    /** The estimate is kept between 0 and this, so the curve always rises. */
    endRiseMax: number
    /** mm, the draw length that a bow of `fitBowLength` fits: 28 in. */
    fitDrawLength: number
    /** in. Each inch of bow length fits one more inch of draw. */
    fitBowLength: number
    /** Share of the draw weight a common recurve gains per inch at full draw. */
    usualGainPerInch: number
    /** Half-width of what is still read as "about usual". */
    usualGainBand: number
    /** mm before full draw at which the archer reads the bow scale: 2 in, and 8 in for the second point. */
    nearOffset: number
    midOffset: number
    /** A measured fullness outside these is taken as a misreading, not as a bow. */
    fullnessMin: number
    fullnessMax: number
  }

  thresholds: {
    stiffnessNeutral: number
    lateralNeutral: number
    verticalNeutral: number
    bareShaftTogether: number
    oscillationMedium: number
    oscillationHigh: number
    clearanceMedium: number
    clearanceHigh: number
  }
}

function describe(value: unknown): string {
  return value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
}

function check(value: unknown, shape: unknown, path: string): void {
  if (typeof shape === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Coefficient ${path} must be a number, got ${describe(value)}`)
    }
    return
  }
  if (typeof shape === 'string') {
    if (typeof value !== 'string' || value === '') {
      throw new Error(`Coefficient ${path} must be a name, got ${describe(value)}`)
    }
    return
  }
  if (describe(value) !== 'object') {
    throw new Error(`Coefficient group ${path} is missing`)
  }
  const group = value as Record<string, unknown>
  const expected = shape as Record<string, unknown>
  for (const key of Object.keys(group)) {
    if (!(key in expected)) throw new Error(`Unknown coefficient ${path}.${key}`)
  }
  for (const [key, inner] of Object.entries(expected)) {
    check(group[key], inner, path === '' ? key : `${path}.${key}`)
  }
}

/**
 * Takes a coefficient set read from JSON, such as a calibrated one. It has to
 * hold exactly the numbers of the base set: a missing or misspelled one would
 * otherwise turn every result into NaN without a word.
 */
export function parseCoefficients(data: unknown): Coefficients {
  check(data, base, '')
  return data as Coefficients
}

/** The base set: the one the app ships with. */
export const HEURISTIC_V0: Coefficients = parseCoefficients(base)
