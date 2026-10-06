import { describe, expect, it } from 'vitest'
import { PARAMETERS, defaultValues, getParameter, setValue } from '../../models/parameters.ts'
import { bowGeometry, type Vec3 } from './bowGeometry.ts'
import { EQUIPMENT, VIEWS, cameraShot, focusOf, marks, type Focus } from './cameraShots.ts'

const reference = defaultValues()
const right = bowGeometry(reference, 1)
const left = bowGeometry(setValue(reference, getParameter('bow.handedness'), 'LH'), 1)

const PARTS: Focus[] = [
  'centerShot',
  'nockingPoint',
  'braceHeight',
  'tiller',
  'limbs',
  'plunger',
  'arrow',
  'stabilizer',
  'string',
]
const ALL: Focus[] = [...new Set<Focus>([...VIEWS, 'rest', ...PARTS])]
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('which view shows a value', () => {
  it('has a view for every value that moves a part', () => {
    expect(focusOf('bow.centerShot')).toBe('centerShot')
    expect(focusOf('bow.limbAlignmentTop')).toBe('limbs')
    expect(focusOf('bow.limbAlignmentBottom')).toBe('limbs')
    expect(focusOf('bow.tiller')).toBe('tiller')
    expect(focusOf('arrow.pointWeight')).toBe('arrow')
    expect(focusOf('bow.riserSize')).toBe('bow')
  })

  it('has none for a value with nothing to draw', () => {
    for (const key of ['bow.drawWeight', 'arrow.spine', 'arrow.shaftGpi', 'bow.plungerStiffness']) {
      expect(focusOf(key), key).toBeNull()
    }
  })

  it('only names parameters that exist', () => {
    const known = new Set(PARAMETERS.map((parameter) => parameter.key))
    for (const mark of ALL.flatMap((focus) => marks(focus, right))) {
      if (mark.shows !== 'bowLength') expect(known.has(mark.shows.parameter)).toBe(true)
    }
  })
})

describe('equipment buttons', () => {
  it('pair each piece with a value that exists and a view that measures something', () => {
    for (const { name, focus, parameter } of EQUIPMENT) {
      expect(
        PARAMETERS.some((entry) => entry.key === parameter),
        name,
      ).toBe(true)
      expect(marks(focus, right).length, name).toBeGreaterThan(0)
    }
  })

  it('show the view the camera would fly to when that value is changed', () => {
    for (const name of ['limbs', 'string', 'nockingPoint', 'rest', 'arrow', 'stabilizer']) {
      const piece = EQUIPMENT.find((entry) => entry.name === name)!
      expect(piece.focus, name).toBe(focusOf(piece.parameter))
    }
  })
})

describe('camera shots', () => {
  it.each(ALL)('stands back from what it looks at in the %s view', (focus) => {
    const shot = cameraShot(focus, right)
    expect(distance(shot.position, shot.target)).toBeGreaterThan(150)
    expect(distance(shot.position, shot.target)).toBeLessThan(6000)
    expect(shot.position.concat(shot.target).every(Number.isFinite)).toBe(true)
  })

  it('looks from the side the arrow is on, for either hand', () => {
    for (const focus of ['bow', 'rest', 'nockingPoint', 'tiller', 'arrow'] as const) {
      // Right-handed: the riser window is on the archer's right, so the open side is the left.
      expect(cameraShot(focus, right).position[2], focus).toBeLessThan(0)
      expect(cameraShot(focus, left).position[2], focus).toBeGreaterThan(0)
    }
  })

  it('sights along the string from behind it to check the limbs', () => {
    const shot = cameraShot('alongString', right)
    expect(shot.position[0]).toBeLessThan(right.stringX)
    expect(shot.position[2]).toBe(0)
    expect(cameraShot('limbs', right)).toEqual(shot)
  })

  it('looks down for the top view and back from the target for the front view', () => {
    const top = cameraShot('top', right)
    expect(top.position[1]).toBeGreaterThan(1500)
    const front = cameraShot('front', right)
    expect(front.position[0]).toBeGreaterThan(right.point[0])
  })

  it('follows the arrow to its point', () => {
    const long = bowGeometry(setValue(reference, getParameter('arrow.length'), 800), 1)
    expect(cameraShot('arrow', long).target[0]).toBeGreaterThan(
      cameraShot('arrow', right).target[0],
    )
  })
})

describe('what a view measures', () => {
  it('labels the bow length on the whole-bow views', () => {
    for (const focus of ['bow', 'front', 'top'] as const) {
      expect(marks(focus, right).map((mark) => mark.shows)).toEqual(['bowLength'])
    }
  })

  it('draws the center shot from the string line to the point', () => {
    const geometry = bowGeometry(setValue(reference, getParameter('bow.centerShot'), 2), 1)
    const [mark] = marks('centerShot', geometry)
    expect(mark!.line!.from[2]).toBe(geometry.stringZ)
    expect(mark!.line!.to[2]).toBeCloseTo(2, 9)
  })

  it('draws the brace height from the string to the grip', () => {
    const [mark] = marks('braceHeight', right)
    expect(mark!.line!.to[0] - mark!.line!.from[0]).toBe(reference.bow.braceHeight)
  })

  it('draws both tiller gaps under one label', () => {
    const tiller = marks('tiller', right)
    expect(tiller).toHaveLength(2)
    expect(tiller[0]!.line!.from[1]).toBeGreaterThan(0)
    expect(tiller[1]!.line!.from[1]).toBeLessThan(0)
    expect(tiller[0]!.shows).toEqual(tiller[1]!.shows)
  })

  it('draws each limb tip against where it would be in line', () => {
    const geometry = bowGeometry(
      setValue(
        setValue(reference, getParameter('bow.limbAlignmentTop'), 2),
        getParameter('bow.limbAlignmentBottom'),
        -1,
      ),
      1,
    )
    const [top, bottom] = marks('limbs', geometry)
    expect(top!.line!.to[2] - top!.line!.from[2]).toBe(2)
    expect(bottom!.line!.to[2] - bottom!.line!.from[2]).toBe(-1)
    expect(top!.shows).toEqual({ parameter: 'bow.limbAlignmentTop' })
  })

  it('measures the arrow from nock to point, and the long rod to its weight', () => {
    const [arrow] = marks('arrow', right)
    expect(distance(arrow!.line!.from, arrow!.line!.to)).toBeCloseTo(reference.arrow.length, 0)
    const [rod] = marks('stabilizer', right)
    expect(distance(rod!.line!.from, rod!.line!.to)).toBe(reference.bow.stabilizerPosition)
  })
})
