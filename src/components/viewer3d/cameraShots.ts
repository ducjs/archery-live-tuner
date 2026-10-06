import { along, type BowGeometry, type Vec3 } from './bowGeometry.ts'

// Where the camera stands for each thing a user may want to look at, and what
// is measured there. Plain numbers, so it can be tested without a 3D scene.

/** Views picked by hand from the buttons under the viewer. */
export const PRESETS = ['bow', 'front', 'top', 'rest', 'alongString'] as const
export type Preset = (typeof PRESETS)[number]

/** Views the camera flies to by itself when a value of the setup changes. */
export type PartFocus =
  | 'centerShot'
  | 'nockingPoint'
  | 'braceHeight'
  | 'tiller'
  | 'limbs'
  | 'plunger'
  | 'arrow'
  | 'stabilizer'
  | 'string'

export type Focus = Preset | PartFocus

const FOCUS_OF: Record<string, Focus> = {
  'bow.riserSize': 'bow',
  'bow.limbSize': 'bow',
  'bow.handedness': 'bow',
  'bow.drawLength': 'bow',
  'bow.centerShot': 'centerShot',
  'bow.nockingPointHeight': 'nockingPoint',
  'bow.braceHeight': 'braceHeight',
  'bow.tiller': 'tiller',
  'bow.limbAlignmentTop': 'limbs',
  'bow.limbAlignmentBottom': 'limbs',
  'bow.plungerPreload': 'plunger',
  'arrow.length': 'arrow',
  'arrow.pointWeight': 'arrow',
  'arrow.shaftDiameter': 'arrow',
  'bow.stabilizerMass': 'stabilizer',
  'bow.stabilizerPosition': 'stabilizer',
  'bow.string.strandCount': 'string',
}

/** The view that shows what a parameter does to the bow. Null when it has nothing to show. */
export function focusOf(parameterKey: string): Focus | null {
  return FOCUS_OF[parameterKey] ?? null
}

export type Shot = { position: Vec3; target: Vec3 }

/** Camera position and the point it looks at. The open side of the bow is the one away from the riser's window. */
export function cameraShot(focus: Focus, geometry: BowGeometry): Shot {
  const { side, stringX, point, longRod } = geometry
  // The side the arrow is on, where nothing stands between it and the camera.
  const open = -side
  switch (focus) {
    case 'front':
      // From the target, looking back at the archer.
      return { position: [3300, 0, open], target: [0, 0, 0] }
    case 'top':
      // From above. A touch off the vertical, so turning the view still has an up.
      return { position: [120, 1900, 20 * open], target: [120, 0, 0] }
    case 'rest':
    case 'plunger':
      // Close on the rest and plunger, a little ahead of them and above.
      return { position: [230, 80, 420 * open], target: [0, 0, 0] }
    case 'alongString':
    case 'limbs':
      // From behind the string, sighting along it at the limbs and the long rod:
      // the way limb alignment is checked on a real bow.
      return { position: [-3600, 40, 0], target: [0, 0, 0] }
    case 'centerShot': {
      // Looking down on the front half of the arrow, where the offset is largest.
      const x = stringX + (point[0] - stringX) * 0.6
      return { position: [x, 820, 130 * open], target: [x, 0, 0] }
    }
    case 'nockingPoint':
      // Level with the nock, from the open side of the bow.
      return { position: [stringX + 90, 25, 560 * open], target: [stringX + 90, 10, 0] }
    case 'braceHeight':
      // Square on to the gap between string and grip.
      return { position: [stringX / 2, -20, 900 * open], target: [stringX / 2, -20, 0] }
    case 'tiller':
      // Square on to the riser, wide enough for both ends of it.
      return { position: [-60, 0, 2300 * open], target: [-60, 0, 0] }
    case 'arrow': {
      const x = point[0] - 110
      return { position: [x, 110, 620 * open], target: [x, 0, 0] }
    }
    case 'stabilizer': {
      const x = longRod.to[0] * 0.5
      return { position: [x + 150, 60, 1500 * open], target: [x, longRod.from[1], 0] }
    }
    case 'string':
      return { position: [stringX - 20, 40, 420 * open], target: [stringX, 15, 0] }
    default:
      // From the open side and a little ahead, so the arrow is in front of the riser.
      return { position: [900, 250, 2900 * open], target: [120, 0, 0] }
  }
}

/** Something measured on the bow: a label, and the line it measures along. */
export type Mark = {
  /** What the label says: the value of a parameter, or the length of the bow. */
  shows: { parameter: string } | 'bowLength'
  /** Where the label is pinned. */
  at: Vec3
  line?: { from: Vec3; to: Vec3 }
}

const lifted = ([x, y, z]: Vec3, by: number): Vec3 => [x, y + by, z]

/** What is measured in a view. Only that is labelled, so the bow is never covered in labels. */
export function marks(focus: Focus, geometry: BowGeometry): Mark[] {
  const { stringX, stringZ, nock, point, limbs, longRod, tiller } = geometry
  const [upper, lower] = limbs
  const upperTip = upper.at(-1)!
  const lowerTip = lower.at(-1)!

  switch (focus) {
    case 'centerShot':
      return [
        {
          shows: { parameter: 'bow.centerShot' },
          at: [point[0], Math.max(point[1], 0) + 30, point[2]],
          // From the string line to the point.
          line: { from: [point[0], 0, stringZ], to: [point[0], 0, point[2]] },
        },
      ]
    case 'nockingPoint':
      return [
        {
          shows: { parameter: 'bow.nockingPointHeight' },
          at: [nock[0], Math.max(nock[1], 0) + 30, stringZ],
          // From square to the nock, beside the string.
          line: { from: [stringX - 14, 0, stringZ], to: [stringX - 14, nock[1], stringZ] },
        },
      ]
    case 'braceHeight':
      return [
        {
          shows: { parameter: 'bow.braceHeight' },
          at: [stringX / 2, -20, 0],
          // From the string to the deepest point of the grip.
          line: { from: [stringX, -45, 0], to: [0, -45, 0] },
        },
      ]
    case 'tiller':
      return [
        { shows: { parameter: 'bow.tiller' }, at: lifted(tiller[0].from, 40), line: tiller[0] },
        // The lower gap is drawn to compare with, without a label of its own.
        { shows: { parameter: 'bow.tiller' }, at: lifted(tiller[0].from, 40), line: tiller[1] },
      ]
    case 'limbs':
    case 'alongString':
      return [
        {
          shows: { parameter: 'bow.limbAlignmentTop' },
          // Inside the tips, so the labels stay in the picture.
          at: lifted(upperTip, -110),
          // From where the tip would be with the limb in line.
          line: { from: [upperTip[0], upperTip[1], 0], to: upperTip },
        },
        {
          shows: { parameter: 'bow.limbAlignmentBottom' },
          at: lifted(lowerTip, 150),
          line: { from: [lowerTip[0], lowerTip[1], 0], to: lowerTip },
        },
      ]
    case 'plunger':
    case 'rest':
      return [{ shows: { parameter: 'bow.plungerPreload' }, at: [0, 45, geometry.atRest[2]] }]
    case 'arrow':
      return [
        {
          shows: { parameter: 'arrow.length' },
          at: lifted(along(nock, point, 0.82), 35),
          line: { from: lifted(nock, -22), to: lifted(point, -22) },
        },
        { shows: { parameter: 'arrow.pointWeight' }, at: lifted(point, -45) },
      ]
    case 'stabilizer':
      return [
        {
          shows: { parameter: 'bow.stabilizerPosition' },
          at: lifted(along(longRod.from, longRod.to, 0.5), 40),
          line: { from: lifted(longRod.from, -28), to: lifted(longRod.to, -28) },
        },
        { shows: { parameter: 'bow.stabilizerMass' }, at: lifted(longRod.to, -50) },
      ]
    case 'string':
      return [{ shows: { parameter: 'bow.string.strandCount' }, at: lifted(nock, 70) }]
    default:
      // Beside the upper limb pocket, where it covers nothing.
      return [{ shows: 'bowLength', at: lifted(geometry.pockets[1], 70) }]
  }
}
