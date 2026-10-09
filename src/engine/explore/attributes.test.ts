import { describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { dragPerMeter } from '../ballistics/flight.ts'
import { createHeuristicModel } from '../simulation/simulate.ts'
import { FARTHEST_DISTANCE, attributes, forgiveness, sightReach } from './attributes.ts'

const model = createHeuristicModel()
const base = createDefaultSetup()
const sheet = (setup = base) =>
  attributes({
    model,
    setup,
    comparison: model.compareBareShaft(setup),
    sight: {
      speed: model.analyze(setup).metrics.launchSpeed,
      drag: dragPerMeter(setup.arrow),
      eyeHeight: 110,
      extension: 150,
      pinDiameter: 12,
    },
  })
const find = (setup: typeof base, id: string) =>
  sheet(setup)
    .flatMap((group) => group.attributes)
    .find((attribute) => attribute.id === id)!

describe('attributes of a setup', () => {
  it('come in three groups, every bar within its scale', () => {
    const groups = sheet()
    expect(groups.map((group) => group.id)).toEqual(['bareShaft', 'flight', 'performance'])
    for (const attribute of groups.flatMap((group) => group.attributes)) {
      expect(Number.isFinite(attribute.value)).toBe(true)
      expect(attribute.share).toBeGreaterThanOrEqual(attribute.kind === 'offset' ? -1 : 0)
      expect(attribute.share).toBeLessThanOrEqual(1)
    }
  })

  it('reads a much weaker shaft as out of order, on the weak side', () => {
    const weak = { ...base, arrow: { ...base.arrow, spine: 1000 } }
    const stiffness = find(weak, 'stiffness')
    expect(stiffness.value).toBeLessThan(find(base, 'stiffness').value)
    expect(stiffness.tone).not.toBe('good')
  })

  it('marks the steadiness of the bow as an estimate, and nothing else', () => {
    const estimates = sheet()
      .flatMap((group) => group.attributes)
      .filter((attribute) => attribute.estimate)
    expect(estimates.map((attribute) => attribute.id)).toEqual(['steadiness'])
  })

  it('reads more weight further out on the long rod as a steadier bow', () => {
    const heavy = {
      ...base,
      bow: { ...base.bow, stabilizerMass: base.bow.stabilizerMass + 200 },
    }
    expect(find(heavy, 'steadiness').value).toBeGreaterThan(find(base, 'steadiness').value)
  })

  it('leaves the reach of the sight out when there is no sight to place', () => {
    const groups = attributes({ model, setup: base, comparison: model.compareBareShaft(base) })
    const ids = groups.flatMap((group) => group.attributes).map((attribute) => attribute.id)
    expect(ids).not.toContain('sightReach')
  })
})

describe('forgiveness', () => {
  it('is a share between nothing and all', () => {
    const value = forgiveness(model, base)
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(1)
  })

  it('is less for a shaft far too weak, which is still bending as it passes the bow', () => {
    const weak = { ...base, arrow: { ...base.arrow, spine: 1000 } }
    expect(forgiveness(model, weak)).toBeLessThan(forgiveness(model, base))
  })
})

describe('reach of the sight', () => {
  const geometry = {
    speed: 58000,
    drag: dragPerMeter(base.arrow),
    eyeHeight: 110,
    drawLength: base.bow.drawLength,
    extension: 150,
    pinDiameter: 12,
    shaftDiameter: base.arrow.shaftDiameter,
    vaneHeight: base.arrow.fletchingHeight,
  }

  it('is shorter for a slower arrow', () => {
    const slow = sightReach({ ...geometry, speed: 42000 })
    expect(slow).toBeLessThanOrEqual(sightReach(geometry))
    expect(slow).toBeLessThan(FARTHEST_DISTANCE)
  })

  it('is shorter with the pin further out, where it sits lower', () => {
    const slow = { ...geometry, speed: 45000 }
    expect(sightReach({ ...slow, extension: 300 })).toBeLessThanOrEqual(sightReach(slow))
  })
})
