import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { powerStroke } from '../../models/bow.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import type { CurveShape } from '../../models/simulation.ts'
import { HEURISTIC_V0 as c } from '../coefficients/coefficients.ts'
import { storedEnergy } from './bowModel.ts'
import {
  clickerGain,
  curveForce,
  curvePoints,
  curveSlope,
  drawCurve,
  estimatedShape,
  measuredShape,
  rises,
} from './drawCurve.ts'

const reference = createDefaultSetup()
const withValue = (key: string, value: number | string) =>
  setValue(reference, getParameter(key), value)
const shape = (fullness: number, endRise: number): CurveShape => ({
  fullness,
  endRise,
  measuredPoints: 0,
})

/** Area under the curve from 0 to 1, by the midpoint rule. */
function area(of: CurveShape): number {
  const steps = 2000
  let sum = 0
  for (let step = 0; step < steps; step += 1) sum += curveForce(of, (step + 0.5) / steps)
  return sum / steps
}

describe('curve shape (§39.2)', () => {
  it('starts at zero force and ends at the draw weight', () => {
    expect(curveForce(shape(0.42, 0.39), 0)).toBe(0)
    expect(curveForce(shape(0.42, 0.39), 1)).toBeCloseTo(1, 12)
  })

  it('stores 1 + h / 3 of a straight line, whatever the end rise', () => {
    expect(2 * area(shape(0, 0))).toBeCloseTo(1, 5)
    expect(2 * area(shape(0.42, 0))).toBeCloseTo(1.14, 5)
    expect(2 * area(shape(0.42, 0.8))).toBeCloseTo(1.14, 5)
  })

  it('gains 1 - h + k at full draw', () => {
    expect(curveSlope(shape(0.42, 0.39), 1)).toBeCloseTo(0.97, 12)
  })

  it('tells a curve that rises all the way from one that falls', () => {
    expect(rises(shape(0.42, 0.39))).toBe(true)
    expect(rises(shape(0.6, 0.8))).toBe(true)
    // Bulges so far that the force falls before full draw.
    expect(rises(shape(1.5, 0))).toBe(false)
    // Rises at both ends but dips between them.
    expect(rises(shape(0, 2.5))).toBe(false)
  })
})

describe('estimate from the setup (§39.3)', () => {
  it('gives the reference setup the standard curve', () => {
    const estimate = estimatedShape(reference.bow, c)
    expect(estimate.fullness).toBe(0.42)
    // The reference draw length is 711.1999999999999 mm, not exactly 28 in.
    expect(estimate.endRise).toBeCloseTo(0.39, 9)
    expect(estimate.measuredPoints).toBe(0)
  })

  it('stores what the fixed factor of 1.14 stored', () => {
    const linear = 0.5 * reference.bow.drawWeight * (powerStroke(reference.bow) / 1000)
    expect(storedEnergy(reference.bow, c)).toBeCloseTo(linear * 1.14, 9)
  })

  it('gains about 5% of the draw weight per inch at the reference setup', () => {
    const gain = clickerGain(reference.bow, estimatedShape(reference.bow, c))
    expect((gain * 25.4) / reference.bow.drawWeight).toBeCloseTo(0.05, 2)
  })

  it('stores more in a fuller style and less in a straight one', () => {
    const energy = (style: string) => storedEnergy(withValue('bow.drawCurve', style).bow, c)
    expect(energy('STRAIGHT')).toBeLessThan(energy('STANDARD'))
    expect(energy('STANDARD')).toBeLessThan(energy('FULL'))
  })

  it('climbs more steeply at the end for a short bow drawn long', () => {
    const endRise = (key: string, value: number | string) =>
      estimatedShape(withValue(key, value).bow, c).endRise
    const here = estimatedShape(reference.bow, c).endRise
    expect(endRise('bow.drawLength', reference.bow.drawLength + 25.4)).toBeGreaterThan(here)
    expect(endRise('bow.limbSize', '66')).toBeGreaterThan(here)
    expect(endRise('bow.limbSize', '70')).toBeLessThan(here)
    expect(endRise('bow.riserSize', 'H27')).toBeLessThan(here)
  })

  it('keeps the end rise inside its bounds', () => {
    expect(endRiseAt(35 * 25.4)).toBe(c.drawCurve.endRiseMax)
    expect(endRiseAt(20 * 25.4)).toBe(0)

    function endRiseAt(drawLength: number) {
      return estimatedShape(withValue('bow.drawLength', drawLength).bow, c).endRise
    }
  })

  it('samples the curve from brace height to full draw', () => {
    const points = curvePoints(reference.bow, estimatedShape(reference.bow, c), 10)
    expect(points).toHaveLength(11)
    expect(points[0]).toEqual({ draw: reference.bow.braceHeight, force: 0 })
    expect(points.at(-1)!.draw).toBeCloseTo(reference.bow.drawLength, 9)
    expect(points.at(-1)!.force).toBeCloseTo(reference.bow.drawWeight, 9)
  })

  it('gives every valid setup a curve that rises, with finite energy', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const curve = drawCurve(setup.bow, c)
        expect(rises(curve)).toBe(true)
        expect(Number.isFinite(storedEnergy(setup.bow, c))).toBe(true)
        expect(storedEnergy(setup.bow, c)).toBeGreaterThan(0)
      }),
    )
  })
})

describe('fit to measured forces (§39.4)', () => {
  /** The reference bow with the forces a curve of this shape would give on a bow scale. */
  function measuredOn(fullness: number, endRise: number, points: 1 | 2, bow = reference.bow) {
    const stroke = powerStroke(bow)
    const forceAt = (offset: number) =>
      bow.drawWeight * curveForce(shape(fullness, endRise), 1 - offset / stroke)
    return {
      ...bow,
      drawForceNear: forceAt(c.drawCurve.nearOffset),
      drawForceMid: points === 2 ? forceAt(c.drawCurve.midOffset) : 0,
    }
  }

  it('finds both numbers from two points', () => {
    const curve = drawCurve(measuredOn(0.3, 0.6, 2), c)
    expect(curve.measuredPoints).toBe(2)
    expect(curve.fullness).toBeCloseTo(0.3, 9)
    expect(curve.endRise).toBeCloseTo(0.6, 9)
  })

  it('finds the end rise from one point and keeps the fullness of the style', () => {
    const curve = drawCurve(measuredOn(0.42, 0.7, 1), c)
    expect(curve.measuredPoints).toBe(1)
    expect(curve.fullness).toBe(0.42)
    expect(curve.endRise).toBeCloseTo(0.7, 9)
  })

  it('moves the stored energy with a measured fullness', () => {
    expect(storedEnergy(measuredOn(0.3, 0.6, 2), c)).toBeLessThan(storedEnergy(reference.bow, c))
  })

  it('has nothing to fit when nothing is measured', () => {
    expect(measuredShape(reference.bow, c)).toBeNull()
    expect(drawCurve(reference.bow, c).measuredPoints).toBe(0)
  })

  it('does not use a nearer point that is not below the draw weight', () => {
    const bow = { ...reference.bow, drawForceNear: reference.bow.drawWeight }
    expect(measuredShape(bow, c)).toBeNull()
    expect(drawCurve(bow, c)).toEqual(estimatedShape(reference.bow, c))
  })

  it('does not use a farther point that is not below the nearer one', () => {
    const good = measuredOn(0.3, 0.6, 2)
    expect(measuredShape({ ...good, drawForceMid: good.drawForceNear }, c)).toBeNull()
  })

  it('does not use points that ask for a curve no bow has', () => {
    const good = measuredOn(0.3, 0.6, 2)
    // A farther point this light would need a curve far below a straight line.
    expect(measuredShape({ ...good, drawForceMid: good.drawForceMid * 0.4 }, c)).toBeNull()
    // And this heavy, a bulge beyond what limbs do.
    expect(measuredShape({ ...good, drawForceMid: good.drawForceNear * 0.99 }, c)).toBeNull()
  })

  it('does not shape the curve from the farther point alone', () => {
    const bow = { ...measuredOn(0.3, 0.6, 2), drawForceNear: 0 }
    expect(measuredShape(bow, c)).toBeNull()
  })

  it('leaves out a farther point that lies before brace height', () => {
    // 20 in of draw on a 30 cm brace height: a 208 mm power stroke.
    const short = { ...reference.bow, drawLength: 508, braceHeight: 300 }
    const curve = drawCurve(measuredOn(0.42, 0.39, 2, short), c)
    expect(curve.measuredPoints).toBeLessThan(2)
    expect(Number.isFinite(curve.fullness)).toBe(true)
    expect(Number.isFinite(curve.endRise)).toBe(true)
  })
})
