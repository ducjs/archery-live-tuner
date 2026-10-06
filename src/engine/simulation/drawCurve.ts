import { bowLength, powerStroke, type BowSetup } from '../../models/bow.ts'
import type { CurveShape, SimulationMetrics } from '../../models/simulation.ts'
import type { Coefficients } from '../coefficients/coefficients.ts'

// The draw force curve of spec §39. `u` is the share of the power stroke drawn
// so far: 0 at brace height, where the force is zero, and 1 at full draw, where
// it is the draw weight. Forces here are shares of the draw weight.

const MM_PER_INCH = 25.4

/** Bulges above the straight line, most in mid-draw. Its area is 1/6. */
const hump = (u: number) => u * (1 - u)
/** Lifts the first half and lowers the second by as much, so it adds no area. */
const sway = (u: number) => u * (1 - u) * (1 - 2 * u)

/** Share of the draw weight on the fingers at `u`. */
export function curveForce(shape: CurveShape, u: number): number {
  return u + shape.fullness * hump(u) + shape.endRise * sway(u)
}

/** How fast that share grows, per share of the power stroke. */
export function curveSlope(shape: CurveShape, u: number): number {
  return 1 + shape.fullness * (1 - 2 * u) + shape.endRise * (1 - 6 * u + 6 * u * u)
}

/** A curve flatter than this anywhere is not one a bow has. */
const LEAST_SLOPE = 0.05

/** True when the force grows all the way from brace height to full draw. */
export function rises(shape: CurveShape): boolean {
  const { fullness, endRise } = shape
  const lowest = [0, 1]
  // With a positive end rise the slope has a low point between the ends.
  if (endRise > 0) {
    const between = 0.5 + fullness / (6 * endRise)
    if (between > 0 && between < 1) lowest.push(between)
  }
  return lowest.every((u) => curveSlope(shape, u) >= LEAST_SLOPE)
}

/** The curve taken for a bow nobody has measured: style and bow size decide. */
export function estimatedShape(bow: BowSetup, c: Coefficients): CurveShape {
  const d = c.drawCurve
  const fullness =
    bow.drawCurve === 'STRAIGHT'
      ? d.fullnessStraight
      : bow.drawCurve === 'FULL'
        ? d.fullnessFull
        : d.fullnessStandard
  // A longer bow fits a longer draw. Drawn beyond that, the force climbs at the end.
  const fitDraw = d.fitDrawLength + (bowLength(bow) - d.fitBowLength) * MM_PER_INCH
  const beyond = (bow.drawLength - fitDraw) / MM_PER_INCH
  const endRise = Math.min(d.endRiseMax, Math.max(0, d.endRise + d.endRisePerInch * beyond))
  return { fullness, endRise, measuredPoints: 0 }
}

/** The curve the model uses for this bow. */
export function drawCurve(bow: BowSetup, c: Coefficients): CurveShape {
  return estimatedShape(bow, c)
}

/** N per mm, how fast the force on the fingers still rises at full draw. */
export function clickerGain(bow: BowSetup, shape: CurveShape): number {
  return (bow.drawWeight / powerStroke(bow)) * curveSlope(shape, 1)
}

/** The curve in mm of draw and N, evenly spaced from brace height to full draw. */
export function curvePoints(
  bow: BowSetup,
  shape: CurveShape,
  count = 32,
): { draw: number; force: number }[] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const u = index / count
    return {
      draw: bow.braceHeight + u * powerStroke(bow),
      force: bow.drawWeight * curveForce(shape, u),
    }
  })
}

/** The shape a result was computed with. */
export function shapeOf(metrics: SimulationMetrics): CurveShape {
  return {
    fullness: metrics.curveFullness,
    endRise: metrics.curveEndRise,
    measuredPoints: metrics.curveMeasuredPoints,
  }
}
