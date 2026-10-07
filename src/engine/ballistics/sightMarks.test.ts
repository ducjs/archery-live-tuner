import { describe, expect, it } from 'vitest'
import type { KnownMark } from '../../models/observation.ts'
import { launchAngleFor } from './flight.ts'
import { fitSightMarks, usableMarks, type SightInputs } from './sightMarks.ts'

const DISTANCES = [18, 30, 50, 70, 90].map((meters) => meters * 1000)
const model: SightInputs = { speed: 58_000, drag: 8.3e-4, eyeHeight: 110 }

/** The marks a sight with this offset and scale would show for an arrow that flies as `truth` says. */
function sightOf(truth: SightInputs, offset: number, scale: number) {
  return (meters: number): KnownMark => ({
    distance: meters * 1000,
    mark:
      offset +
      scale * Math.tan(launchAngleFor(truth.speed, truth.drag, meters * 1000, truth.eyeHeight)),
  })
}

const at = (fit: NonNullable<ReturnType<typeof fitSightMarks>>, meters: number) =>
  fit.predictions.find((prediction) => prediction.distance === meters * 1000)!

describe('usableMarks', () => {
  it('sorts by distance, keeps the last mark entered for one, and drops what is not a number', () => {
    expect(
      usableMarks([
        { distance: 30_000, mark: 30 },
        { distance: 18_000, mark: 14 },
        { distance: 50_000, mark: Number.NaN },
        { distance: 18_000, mark: 15 },
      ]),
    ).toEqual([
      { distance: 18_000, mark: 15 },
      { distance: 30_000, mark: 30 },
    ])
  })
})

describe('fitSightMarks', () => {
  it('needs two marks at different distances', () => {
    expect(fitSightMarks([], model, DISTANCES)).toBeNull()
    expect(fitSightMarks([{ distance: 18_000, mark: 15 }], model, DISTANCES)).toBeNull()
    expect(
      fitSightMarks(
        [
          { distance: 18_000, mark: 15 },
          { distance: 18_000, mark: 16 },
        ],
        model,
        DISTANCES,
      ),
    ).toBeNull()
  })

  it('goes through two marks exactly and predicts the rest with the speed of the model', () => {
    const mark = sightOf(model, 5, 900)
    const fit = fitSightMarks([mark(18), mark(30)], model, DISTANCES)!
    expect(fit.speedFrom).toBe('model')
    expect(fit.speed).toBe(model.speed)
    expect(fit.worstMiss).toBeCloseTo(0, 6)
    expect(fit.offset).toBeCloseTo(5, 4)
    expect(fit.scale).toBeCloseTo(900, 2)
    // The truth is the model here, so the far marks come out right.
    for (const meters of [50, 70, 90]) {
      expect(at(fit, meters).mark).toBeCloseTo(mark(meters).mark, 4)
    }
    expect(at(fit, 18).known).toBeCloseTo(mark(18).mark, 9)
    expect(at(fit, 50).known).toBeUndefined()
  })

  it('takes a scale that counts down as well as one that counts up', () => {
    const up = sightOf(model, 0, 900)
    const down = sightOf(model, 80, -900)
    const rising = fitSightMarks([up(18), up(30)], model, DISTANCES)!
    const falling = fitSightMarks([down(18), down(30)], model, DISTANCES)!
    expect(at(rising, 70).mark).toBeGreaterThan(at(rising, 30).mark)
    expect(at(falling, 70).mark).toBeLessThan(at(falling, 30).mark)
    expect(falling.scale).toBeCloseTo(-900, 2)
  })

  it('curves away from a straight line through two marks, toward more elevation far out', () => {
    const mark = sightOf(model, 0, 900)
    const fit = fitSightMarks([mark(18), mark(30)], model, DISTANCES)!
    const perMeter = (mark(30).mark - mark(18).mark) / 12
    const straight = mark(30).mark + perMeter * 60
    expect(at(fit, 90).mark).toBeGreaterThan(straight)
  })

  describe('ranges', () => {
    const mark = sightOf(model, 0, 900)
    const fit = fitSightMarks([mark(18), mark(30)], model, DISTANCES)!
    const width = (meters: number) => at(fit, meters).high - at(fit, meters).low

    it('hold the prediction', () => {
      for (const prediction of fit.predictions) {
        expect(prediction.low).toBeLessThanOrEqual(prediction.mark)
        expect(prediction.high).toBeGreaterThanOrEqual(prediction.mark)
      }
    })

    it('are no wider than the reading of a mark at the marks that are known', () => {
      // Half a millimeter either way, on a scale of 900 per unit of slope.
      expect(width(18)).toBeCloseTo(1, 6)
      expect(width(30)).toBeCloseTo(1, 6)
    })

    it('carry a reading error in two close marks far out along the line', () => {
      // 18 and 30 m are 12 m apart; 90 m is five times that further on.
      expect(width(90)).toBeGreaterThan(5 * width(30))
    })

    it('widen with the distance from the known marks', () => {
      expect(width(50)).toBeGreaterThan(0.1)
      expect(width(70)).toBeGreaterThan(width(50))
      expect(width(90)).toBeGreaterThan(width(70))
    })

    it('are narrower with a mark out at 70 m than without', () => {
      const withFar = fitSightMarks([mark(18), mark(30), mark(70)], model, DISTANCES)!
      expect(at(withFar, 90).high - at(withFar, 90).low).toBeLessThan(width(90))
    })
  })

  describe('with three marks or more', () => {
    // An arrow that is really 8 % faster than the model thinks.
    const truth: SightInputs = { ...model, speed: 62_640 }
    const mark = sightOf(truth, 12, 870)

    it('finds the speed from the marks', () => {
      const fit = fitSightMarks([mark(18), mark(30), mark(50)], model, DISTANCES)!
      expect(fit.speedFrom).toBe('marks')
      expect(fit.speed / truth.speed).toBeCloseTo(1, 2)
      expect(fit.worstMiss).toBeLessThan(0.01)
      expect(at(fit, 90).mark).toBeCloseTo(mark(90).mark, 1)
    })

    it('says how far that speed moves with the eye height', () => {
      const fit = fitSightMarks([mark(18), mark(30), mark(50), mark(70)], model, DISTANCES)!
      expect(fit.speedRange!.low).toBeLessThan(fit.speed)
      expect(fit.speedRange!.high).toBeGreaterThan(fit.speed)
      // 20 mm on 110 mm of eye height is a real share of the speed, not a rounding error.
      expect((fit.speedRange!.high - fit.speedRange!.low) / fit.speed).toBeGreaterThan(0.05)
    })

    it('falls back on the speed of the model when the marks do not agree with each other', () => {
      const fit = fitSightMarks(
        [
          { distance: 18_000, mark: 15 },
          { distance: 30_000, mark: 14 },
          { distance: 50_000, mark: 40 },
        ],
        model,
        DISTANCES,
      )!
      expect(fit.speedFrom).toBe('model')
      expect(fit.worstMiss).toBeGreaterThan(1)
    })
  })

  it('gives NaN for a distance the arrow cannot reach, and still predicts the others', () => {
    const slow: SightInputs = { ...model, speed: 28_000 }
    const mark = sightOf(slow, 0, 900)
    const fit = fitSightMarks([mark(18), mark(30)], slow, DISTANCES)!
    expect(at(fit, 50).mark).toBeGreaterThan(at(fit, 30).mark)
    expect(at(fit, 90).mark).toBeNaN()
  })

  it('is null when a marked distance is out of reach', () => {
    const slow: SightInputs = { ...model, speed: 20_000 }
    expect(
      fitSightMarks(
        [
          { distance: 18_000, mark: 15 },
          { distance: 90_000, mark: 90 },
        ],
        slow,
        DISTANCES,
      ),
    ).toBeNull()
  })
})
