import { Line, OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CatmullRomCurve3,
  MOUSE,
  Quaternion,
  TubeGeometry,
  Vector3,
  type Color,
  type Group,
  type Material,
  type Mesh,
} from 'three'
import { useMessages } from '../../i18n/useMessages.ts'
import type { ArrowSetup } from '../../models/arrow.ts'
import { bowLength, type BowSetup } from '../../models/bow.ts'
import { formatValue, getParameter, getValue, type UnitSystem } from '../../models/parameters.ts'
import { parameterText } from '../../i18n/index.ts'
import {
  RISER_HALF_WIDTH,
  WINDOW_BAR_HALF_WIDTH,
  along,
  bowGeometry,
  type BowGeometry,
  type Vec3,
} from './bowGeometry.ts'
import {
  EQUIPMENT,
  calloutAnchor,
  cameraShot,
  marks,
  type Focus,
  type Mark,
  type PartName,
} from './cameraShots.ts'
import { PartIcon } from './PartIcon.tsx'

type Props = {
  bow: BowSetup
  arrow: ArrowSetup
  /** How many times the small offsets are enlarged. 1 is true scale. */
  amplify: number
  /** Shows the bow at full draw. */
  drawn: boolean
  focus: Focus
  /** Changes whenever the camera should fly to `focus` again. */
  focusRequest: number
  units: UnitSystem
  /** Called with the key of the value a pressed part stands for. */
  onPick: (parameterKey: string) => void
  /** Called when the close look at a part ends: a press beside the bow, or zooming back out. */
  onLeave: () => void
  /**
   * By the key of a value: the tone its callout writes it in, when the setup
   * does not read as in order and that value can do something about it.
   */
  tones?: Partial<Record<string, 'fair' | 'poor' | 'plain'>>
}

/** The nocking point locators are a few millimetres long; this is what answers a press on them. */
function NockPressArea({ at }: { at: Vec3 }) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[PRESS * 1.4, 12, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

type Palette = {
  ink: string
  muted: string
  accent: string
  gold: string
  weak: string
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(`--color-${name}`).trim()
  return {
    ink: token('ink'),
    muted: token('ink-muted'),
    accent: token('accent'),
    gold: token('gold'),
    weak: token('weak'),
  }
}

const UP = new Vector3(0, 1, 0)

/** mm, half the width of the area that answers a press on a thin part */
const PRESS = 20

/** Position, rotation and length of something that runs from one point to another. */
function span(from: Vec3, to: Vec3) {
  const start = new Vector3(...from)
  const direction = new Vector3(...to).sub(start)
  const length = direction.length()
  const quaternion = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize())
  return { middle: start.add(direction.multiplyScalar(0.5)), quaternion, length }
}

type RodProps = {
  from: Vec3
  to: Vec3
  radius: number
  /** Radius at `to`. Defaults to `radius`; near 0 makes a cone. */
  endRadius?: number
  color: string
}

/**
 * Something to press that is wider than what is drawn. A string or a shaft is
 * a pixel or two wide when the whole bow is in view; nobody can hit that.
 */
function PressArea({ from, to, radius }: Pick<RodProps, 'from' | 'to' | 'radius'>) {
  const { middle, quaternion, length } = span(from, to)
  return (
    <mesh position={middle} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/** A cylinder or cone between two points. */
function Rod({ from, to, radius, endRadius = radius, color }: RodProps) {
  const { middle, quaternion, length } = span(from, to)
  return (
    <mesh position={middle} quaternion={quaternion}>
      <cylinderGeometry args={[endRadius, radius, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  )
}

function Vanes({ from, to, radius, color }: Omit<RodProps, 'endRadius'>) {
  const { middle, quaternion, length } = span(from, to)
  return (
    <group position={middle} quaternion={quaternion}>
      {[0, 1, 2].map((index) => (
        <group key={index} rotation={[0, (index * 2 * Math.PI) / 3 + Math.PI / 6, 0]}>
          <mesh position={[0, 0, radius + 6]}>
            <boxGeometry args={[0.8, length, 12]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** A limb is this many times wider than it is thick. */
const LIMB_WIDTH = 3.6

function Limb({ points, color }: { points: Vec3[]; color: string }) {
  const geometry = useMemo(() => {
    // The tube is widened afterwards, so what its path has of sideways is narrowed first.
    const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z / LIMB_WIDTH)))
    return new TubeGeometry(curve, 48, 5, 10)
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  // A round tube squashed sideways reads as a flat limb.
  return (
    <mesh geometry={geometry} scale={[1, 1, LIMB_WIDTH]}>
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

/** Front to back, the riser is half again as deep as it is wide. */
const RISER_DEPTH = 1.5

type RiserPartProps = {
  points: Vec3[]
  /** Half the width, side to side. */
  halfWidth: number
  color: string
}

/** A stretch of the riser: a tube along its centerline, deeper front to back than it is wide. */
function RiserPart({ points, halfWidth, color }: RiserPartProps) {
  const depth = (RISER_DEPTH * RISER_HALF_WIDTH) / halfWidth
  const geometry = useMemo(() => {
    // The tube is stretched front to back afterwards, so its path is narrowed first.
    const curve = new CatmullRomCurve3(
      points.map(([x, y, z]) => new Vector3(x / depth, y, z)),
      false,
      'catmullrom',
      0.35,
    )
    return new TubeGeometry(curve, 64, halfWidth, 14, false)
  }, [points, halfWidth, depth])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} scale={[depth, 1, 1]}>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.35} />
    </mesh>
  )
}

type ControlsHandle = { target: Vector3; update: () => void }

type RigProps = Pick<Props, 'focus' | 'focusRequest' | 'onLeave'> & {
  geometry: BowGeometry
  /** Called when the view is taken hold of, and again when it is let go. */
  onHold: (held: boolean) => void
  /** Called when a flight of the camera has ended. */
  onArrive: () => void
}

/** Zoomed out to this many times the distance of a close look, the close look is over. */
const LEAVE_AT = 1.6
/** With this share of a flight left, the camera is put where it was going. */
const ARRIVED = 0.005

function CameraRig({ focus, focusRequest, geometry, onLeave, onHold, onArrive }: RigProps) {
  const controls = useRef<ControlsHandle | null>(null)
  const flying = useRef(true)
  const first = useRef(true)
  const latest = useRef(geometry)
  const { camera, invalidate } = useThree()

  useEffect(() => {
    latest.current = geometry
  }, [geometry])

  // A new request starts a flight. Geometry changes on their own do not, or the
  // camera would fight the user while a slider is dragged.
  const goal = useRef<{ position: Vector3; target: Vector3; near: number } | null>(null)
  useEffect(() => {
    const shot = cameraShot(focus, latest.current)
    const position = new Vector3(...shot.position)
    goal.current = {
      position,
      target: new Vector3(...shot.target),
      near: Math.max(1, camera.position.distanceTo(position) * ARRIVED),
    }
    flying.current = true
    invalidate()
  }, [focus, focusRequest, geometry.side, camera, invalidate])

  useFrame((_, delta) => {
    if (!flying.current || !controls.current || !goal.current) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    // Back to the whole bow is the quicker flight: there is nothing to follow on the way.
    const rate = focus === 'bow' ? 8 : 5
    const step = first.current || reduceMotion ? 1 : 1 - Math.exp(-rate * Math.min(delta, 0.1))
    first.current = false

    camera.position.lerp(goal.current.position, step)
    controls.current.target.lerp(goal.current.target, step)
    // The last stretch of such a flight is too slow to see and keeps the callouts waiting.
    const arrived = camera.position.distanceTo(goal.current.position) < goal.current.near
    if (arrived) {
      camera.position.copy(goal.current.position)
      controls.current.target.copy(goal.current.target)
    }
    controls.current.update()

    if (arrived) {
      flying.current = false
      onArrive()
    } else invalidate()
  })

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping={false}
      // The wheel zooms as it is turned; held down, it moves the view.
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
      minDistance={150}
      maxDistance={6000}
      onStart={() => {
        // The user took over; stop steering the camera.
        flying.current = false
        onHold(true)
      }}
      onEnd={() => {
        onHold(false)
        // Zooming well back out of a close look at a part ends it.
        if (focus === 'bow' || !goal.current || !controls.current) return
        const close = goal.current.position.distanceTo(goal.current.target)
        if (camera.position.distanceTo(controls.current.target) > close * LEAVE_AT) onLeave()
      }}
    />
  )
}

type Anchor = { element: () => HTMLElement | null | undefined; position: Vec3 }

/** Keeps HTML labels pinned to points of the scene. */
function LabelPins({ anchors }: { anchors: Anchor[] }) {
  const projected = useMemo(() => new Vector3(), [])
  useFrame(({ camera, size }) => {
    for (const { element: find, position } of anchors) {
      const element = { current: find() }
      if (!element.current) continue
      projected.set(...position).project(camera)
      const visible = projected.z < 1
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      // Written straight to the DOM: this runs every frame, outside React rendering.
      // oxlint-disable-next-line react/immutability
      element.current.style.visibility = visible ? 'visible' : 'hidden'
      element.current.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
    }
  })
  return null
}

type Callout = {
  /** False for the other parts while one part is looked at closely. */
  shown: boolean
  box: () => HTMLElement | null | undefined
  line: () => SVGLineElement | null | undefined
  dot: () => SVGCircleElement | null | undefined
  position: Vec3
}

/** px, the gap kept between callout boxes, and between a box and the edge of the view */
const CALLOUT_GAP = 6
/** s, how long the view has to stand still before the callouts are drawn again */
const CALLOUT_SETTLE = 0.2
/** s, the same after a flight of the camera, which ends standing still */
const CALLOUT_ARRIVED = 0.04
/** The parts count as standing in one line when their spread across it is this share of the spread along it. */
const IN_LINE = 0.5
/** px, a part this close to that line is on it */
const ON_LINE = 14

type CalloutPinsProps = {
  callouts: Callout[]
  /** What holds the boxes and the lines: faded out while the view moves. */
  layer: () => HTMLElement | null
  /** Whether a hand is on the view, turning it. */
  held: () => boolean
  /**
   * Called with the way to draw the callouts again, for when the view is let
   * go. Called with true, they are drawn without the usual wait.
   */
  onSettle: (settle: (soon?: boolean) => void) => void
}

/**
 * Puts a box next to each part, a short way out from the middle of the bow,
 * with a line from the box to the part. Boxes that would cover each other are
 * pushed apart. Parts that stand in one line, as seen from behind the string,
 * get their boxes on either side of it by turns. While the bow is turned or a value moves it, the callouts are
 * put away, and they are drawn again a moment after the view is let go and
 * stands still: lines that follow every frame are restless to look at.
 */
function CalloutPins({ callouts, layer, held, onSettle }: CalloutPinsProps) {
  const { camera, size } = useThree()
  const latest = useRef(callouts)
  const seenView = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const soon = useRef(false)

  const layout = () => {
    const projected = new Vector3()
    const far = size.width < 480 ? 40 : 72
    const placed: {
      callout: Callout
      x: number
      y: number
      cx: number
      cy: number
      width: number
      height: number
    }[] = []
    for (const callout of latest.current) {
      const box = callout.box()
      const line = callout.line()
      const dot = callout.dot()
      if (!box || !line || !dot) continue
      projected.set(...callout.position).project(camera)
      const x = (projected.x * 0.5 + 0.5) * size.width
      const y = (-projected.y * 0.5 + 0.5) * size.height
      const inView =
        callout.shown && projected.z < 1 && x > 0 && x < size.width && y > 0 && y < size.height
      for (const element of [box, line, dot]) {
        element.style.visibility = inView ? 'visible' : 'hidden'
      }
      if (inView) {
        placed.push({
          callout,
          x,
          y,
          cx: x,
          cy: y,
          width: box.offsetWidth,
          height: box.offsetHeight,
        })
      }
    }
    if (placed.length === 0) return

    // Each box goes outward from the middle of the parts in view, so it lands
    // on the open side of its part.
    const middleX = placed.reduce((sum, item) => sum + item.x, 0) / placed.length
    const middleY = placed.reduce((sum, item) => sum + item.y, 0) / placed.length
    // A bow is long and thin, and turned towards its string or its target the
    // parts stand close to one line: outward would put the boxes on that line
    // too, over the bow and over each other. Then every box goes sideways from
    // the line: a part that stands off it to its own side, the parts on it to
    // either side by turns, in the order they have along it.
    let xx = 0
    let yy = 0
    let xy = 0
    for (const item of placed) {
      xx += (item.x - middleX) ** 2
      yy += (item.y - middleY) ** 2
      xy += (item.x - middleX) * (item.y - middleY)
    }
    const lineAngle = Math.atan2(2 * xy, xx - yy) / 2
    const lineX = Math.cos(lineAngle)
    const lineY = Math.sin(lineAngle)
    const spreadAlong = xx * lineX ** 2 + 2 * xy * lineX * lineY + yy * lineY ** 2
    const spreadAcross = xx + yy - spreadAlong
    const inLine = placed.length > 2 && spreadAcross < spreadAlong * IN_LINE ** 2
    type Placed = (typeof placed)[number]
    const alongLine = (item: Placed) => (item.x - middleX) * lineX + (item.y - middleY) * lineY
    const offLine = (item: Placed) => (item.y - middleY) * lineX - (item.x - middleX) * lineY
    const turns = new Map<Placed, number>()
    if (inLine) {
      const onLine = placed.filter((item) => Math.abs(offLine(item)) < ON_LINE)
      for (const item of placed)
        if (!onLine.includes(item)) turns.set(item, Math.sign(offLine(item)))
      // The side with fewer boxes so far gets the next one.
      let lean = [...turns.values()].reduce((sum, turn) => sum + turn, 0)
      for (const item of onLine.toSorted((a, b) => alongLine(a) - alongLine(b))) {
        const turn = lean > 0 ? -1 : 1
        turns.set(item, turn)
        lean += turn
      }
    }

    placed.forEach((item, index) => {
      let dx = item.x - middleX
      let dy = item.y - middleY
      const length = Math.hypot(dx, dy)
      if (inLine) {
        const turn = turns.get(item)!
        dx = -lineY * turn
        dy = lineX * turn
      } else if (length < 12) {
        // In the middle there is no outward: spread such parts around the clock.
        const angle = (index / placed.length) * 2 * Math.PI
        dx = Math.cos(angle)
        dy = Math.sin(angle)
      } else {
        dx /= length
        dy /= length
      }
      const reach = far + (Math.abs(dx) * item.width + Math.abs(dy) * item.height) / 2
      item.cx = item.x + dx * reach
      item.cy = item.y + dy * reach
    })

    const keepInView = (item: (typeof placed)[number]) => {
      const halfWidth = item.width / 2 + CALLOUT_GAP
      const halfHeight = item.height / 2 + CALLOUT_GAP
      item.cx = Math.min(size.width - halfWidth, Math.max(halfWidth, item.cx))
      item.cy = Math.min(size.height - halfHeight, Math.max(halfHeight, item.cy))
    }
    // Boxes that overlap are pushed apart the short way, a few rounds over.
    for (let round = 0; round < 24; round++) {
      placed.forEach(keepInView)
      let moved = false
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i]!
          const b = placed[j]!
          const overX = (a.width + b.width) / 2 + CALLOUT_GAP - Math.abs(a.cx - b.cx)
          const overY = (a.height + b.height) / 2 + CALLOUT_GAP - Math.abs(a.cy - b.cy)
          if (overX <= 0 || overY <= 0) continue
          moved = true
          if (overY <= overX) {
            const sign = a.cy <= b.cy ? -1 : 1
            a.cy += (sign * overY) / 2
            b.cy -= (sign * overY) / 2
          } else {
            const sign = a.cx <= b.cx ? -1 : 1
            a.cx += (sign * overX) / 2
            b.cx -= (sign * overX) / 2
          }
        }
      }
      if (!moved) break
    }
    placed.forEach(keepInView)

    for (const { callout, x, y, cx, cy, width, height } of placed) {
      const left = cx - width / 2
      const top = cy - height / 2
      callout.box()!.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`
      // The line leaves the box at the point of its edge nearest to the part.
      const line = callout.line()!
      line.setAttribute('x1', Math.min(left + width, Math.max(left, x)).toFixed(1))
      line.setAttribute('y1', Math.min(top + height, Math.max(top, y)).toFixed(1))
      line.setAttribute('x2', x.toFixed(1))
      line.setAttribute('y2', y.toFixed(1))
      const dot = callout.dot()!
      dot.setAttribute('cx', x.toFixed(1))
      dot.setAttribute('cy', y.toFixed(1))
    }
  }

  const settle = useRef<(now?: boolean) => void>(() => {})
  useEffect(() => {
    latest.current = callouts
    settle.current = (now = false) => {
      const element = layer()
      if (element) element.style.opacity = '0'
      clearTimeout(timer.current)
      if (now) soon.current = true
      // A hand still on the view may go on turning it: wait for it to let go.
      if (held()) {
        soon.current = false
        return
      }
      timer.current = setTimeout(
        () => {
          soon.current = false
          layout()
          const shown = layer()
          if (shown) shown.style.opacity = '1'
        },
        (soon.current ? CALLOUT_ARRIVED : CALLOUT_SETTLE) * 1000,
      )
    }
    onSettle(settle.current)
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  // A part moved, because a value did: the callouts wait for it to stop too.
  const places = JSON.stringify(callouts.map((callout) => [callout.shown, callout.position]))
  useEffect(() => {
    settle.current()
  }, [places])

  useFrame(() => {
    const view = `${camera.matrixWorld.elements.map((value) => value.toFixed(2)).join()} ${size.width} ${size.height}`
    if (view === seenView.current) return
    seenView.current = view
    settle.current()
  })
  return null
}

/** How a part is drawn while one of them is pointed at: that one bright, the others faint. */
type Look = 'plain' | 'lit' | 'dim'

/** The part of the bow that the value under the pointer is set on. */
const PART_OF: Record<string, PartName> = {
  'bow.riserSize': 'riser',
  'bow.tiller': 'limbs',
  'bow.limbSize': 'limbs',
  'bow.braceHeight': 'string',
  'bow.stabilizerPosition': 'stabilizer',
  'bow.stabilizerMass': 'stabilizer',
  'bow.plungerStiffness': 'plunger',
  'bow.centerShot': 'rest',
  'arrow.length': 'arrow',
  'bow.nockingPointHeight': 'nockingPoint',
}

/** Close looks that no piece of equipment has as its own, and the part each one is about. */
const EXTRA_FOCUS: Partial<Record<Focus, PartName>> = {
  limbs: 'limbs',
  string: 'string',
  rest: 'rest',
}

/** Opacity of the parts that are not the one pointed at. */
const DIMMED = 0.22

type Shaded = Material & { emissive?: Color; emissiveIntensity?: number }

/** A part of the bow, as a group that can be made bright or faint as a whole. */
function Part({ look, children, ...events }: { look: Look } & ThreeElements['group']) {
  const group = useRef<Group>(null)
  const invalidate = useThree((state) => state.invalidate)
  const accent = useMemo(() => readPalette().accent, [])
  // After every render: the meshes inside are rebuilt when a value of the setup changes.
  useEffect(() => {
    group.current?.traverse((object) => {
      const material = (object as Mesh).material as Shaded | Shaded[] | undefined
      if (!material || Array.isArray(material)) return
      // The areas that only answer a press are never drawn.
      if (material.type === 'MeshBasicMaterial') return
      material.transparent = look === 'dim'
      material.opacity = look === 'dim' ? DIMMED : 1
      if (material.emissive) {
        material.emissive.set(look === 'lit' ? accent : '#000000')
        material.emissiveIntensity = look === 'lit' ? 0.55 : 0
      }
      material.needsUpdate = true
    })
    invalidate()
  })
  return (
    <group ref={group} {...events}>
      {children}
    </group>
  )
}

type BowProps = {
  /** The part to draw bright, with the others faint. Null draws all of them as they are. */
  lit: PartName | null
  geometry: BowGeometry
  measured: Mark[]
  /** Called with the key of the value a pressed part stands for. */
  onPick: (parameterKey: string) => void
  /** Called with the key of the value under the pointer. */
  onHover: (parameterKey: string) => void
  /** Called when the pointer leaves the part of that value. */
  onLeave: (parameterKey: string) => void
}

function Bow({ geometry, measured, lit, onPick, onHover, onLeave }: BowProps) {
  const look = (part: PartName): Look => (lit === null ? 'plain' : lit === part ? 'lit' : 'dim')
  // A part answers a press, not the end of a drag that turned the bow.
  const pick = (parameterKey: string) => ({
    onClick: (event: ThreeEvent<MouseEvent>) => {
      if (event.delta > 8) return
      // Only the part in front answers.
      event.stopPropagation()
      onPick(parameterKey)
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      document.body.style.cursor = 'pointer'
      onHover(parameterKey)
    },
    onPointerOut: () => {
      document.body.style.cursor = ''
      onLeave(parameterKey)
    },
  })

  const palette = useMemo(() => readPalette(), [])
  const { side, stringX, stringZ, nock, point, atRest, shaftRadius, limbs, string } = geometry
  const { riser, pockets, longRod, sideRods, weightLength, plungerCollar } = geometry
  const [upperLimb, lowerLimb] = limbs

  // Drawn a little thicker than life, or the shaft vanishes at this size.
  const radius = shaftRadius * 1.4
  // The plunger goes through the bar where the riser's centerline is, at the arrow's height.
  const plungerX = riser.bar[1]![0]
  const arrowLength = Math.hypot(point[0] - nock[0], point[1] - nock[1], point[2] - nock[2])
  // The wall of the sight window, and the outer face of the bar that carries it.
  const windowZ = riser.wall
  const outerZ = riser.wall + side * 2 * WINDOW_BAR_HALF_WIDTH
  // The window is closed below by the shelf and above where the riser is whole again.
  const shelf = riser.lower.at(-1)!
  const lintel = riser.upper[0]!
  const joinWidth = RISER_HALF_WIDTH + Math.abs(outerZ)
  const joinZ = (outerZ - side * RISER_HALF_WIDTH) / 2
  const riserDepth = 2 * RISER_HALF_WIDTH * RISER_DEPTH

  return (
    <group>
      <Part look={look('riser')} {...pick('bow.riserSize')}>
        {/* Riser, with the grip on the archer's side and a pocket for each limb. */}
        <RiserPart points={riser.lower} halfWidth={RISER_HALF_WIDTH} color={palette.muted} />
        <RiserPart points={riser.upper} halfWidth={RISER_HALF_WIDTH} color={palette.muted} />
        <RiserPart points={riser.bar} halfWidth={WINDOW_BAR_HALF_WIDTH} color={palette.muted} />
        {/* The shelf under the arrow and the top of the window: where the bar meets the whole riser. */}
        <RoundedBox
          args={[riserDepth, 20, joinWidth]}
          radius={6}
          position={[shelf[0], shelf[1] - 8, joinZ]}
        >
          <meshStandardMaterial color={palette.muted} roughness={0.4} metalness={0.35} />
        </RoundedBox>
        <RoundedBox
          args={[riserDepth, 20, joinWidth]}
          radius={6}
          position={[lintel[0], lintel[1] + 8, joinZ]}
        >
          <meshStandardMaterial color={palette.muted} roughness={0.4} metalness={0.35} />
        </RoundedBox>
        <group position={[-1, -74, 0]} rotation={[0, 0, 0.16]}>
          <RoundedBox args={[30, 92, 31]} radius={12}>
            <meshStandardMaterial color={palette.ink} roughness={0.85} />
          </RoundedBox>
        </group>
      </Part>
      <Part look={look('limbs')} {...pick('bow.tiller')}>
        {pockets.map((pocket, index) => (
          <group key={index} position={pocket} rotation={[0, 0, index === 0 ? -0.36 : 0.36]}>
            <RoundedBox args={[30, 62, 42]} radius={6}>
              <meshStandardMaterial color={palette.muted} roughness={0.4} metalness={0.35} />
            </RoundedBox>
            {/* Limb bolt. */}
            <mesh position={[17, index === 0 ? 10 : -10, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[7, 7, 10, 16]} />
              <meshStandardMaterial color={palette.gold} roughness={0.35} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part look={look('limbs')} {...pick('bow.limbSize')}>
        <Limb points={upperLimb} color={palette.ink} />
        <Limb points={lowerLimb} color={palette.ink} />
        {/* Seen from the side a limb is a line; this gives it some width to press. */}
        {[upperLimb, lowerLimb].flatMap((points, limb) =>
          points
            .slice(1)
            .map((end, index) => (
              <PressArea key={`${limb}-${index}`} from={points[index]!} to={end} radius={PRESS} />
            )),
        )}
      </Part>
      <Part look={look('string')} {...pick('bow.braceHeight')}>
        {/* The string, strand count and all, with the thicker center serving around the nock. */}
        {string.slice(1).map((end, index) => (
          <Rod
            key={index}
            from={string[index]!}
            to={end}
            radius={geometry.stringRadius}
            color={palette.ink}
          />
        ))}
        <Rod
          from={along(nock, string[1]!, 0.12)}
          to={nock}
          radius={geometry.stringRadius + 0.6}
          color={palette.muted}
        />
        <Rod
          from={nock}
          to={along(nock, string[3]!, 0.12)}
          radius={geometry.stringRadius + 0.6}
          color={palette.muted}
        />
        {/* Clear of the nock, which belongs to the nocking point. */}
        <PressArea from={string[1]!} to={along(nock, string[1]!, 0.1)} radius={PRESS} />
        <PressArea from={along(nock, string[3]!, 0.1)} to={string[3]!} radius={PRESS} />
      </Part>
      <Part look={look('stabilizer')} {...pick('bow.stabilizerPosition')}>
        {/* Long rod, with a damper and its weight at the far end. */}
        <Rod from={longRod.from} to={longRod.to} radius={7} color={palette.ink} />
        <PressArea from={longRod.from} to={longRod.to} radius={PRESS} />

        <Rod
          from={longRod.to}
          to={[longRod.to[0] + 14, longRod.to[1], 0]}
          radius={10}
          color={palette.accent}
        />
        <Rod
          from={[longRod.to[0] + 14, longRod.to[1], 0]}
          to={[longRod.to[0] + 14 + weightLength, longRod.to[1], 0]}
          radius={13}
          color={palette.muted}
        />
      </Part>
      <Part look={look('stabilizer')} {...pick('bow.stabilizerMass')}>
        {/* V-bar on the long rod mount, and the two side rods with their weights. */}
        <RoundedBox
          args={[22, 20, 46]}
          radius={5}
          position={[longRod.from[0] + 8, longRod.from[1], 0]}
        >
          <meshStandardMaterial color={palette.muted} roughness={0.4} metalness={0.35} />
        </RoundedBox>
        {sideRods.map((rod, index) => (
          <group key={index}>
            <Rod from={rod.from} to={rod.to} radius={6} color={palette.ink} />
            <PressArea from={rod.from} to={along(rod.from, rod.to, 1.12)} radius={PRESS} />

            <Rod
              from={rod.to}
              to={along(rod.from, rod.to, 1.12)}
              radius={12}
              color={palette.muted}
            />
          </group>
        ))}
      </Part>
      <Part look={look('plunger')} {...pick('bow.plungerStiffness')}>
        {/* Plunger through the riser, touching the shaft. Rest wire under it. */}
        <Rod
          from={[plungerX, 0, outerZ + side * 8]}
          to={[plungerX, 0, atRest[2] + side * radius]}
          radius={3.2}
          color={palette.gold}
        />
        <PressArea
          from={[plungerX, 0, outerZ]}
          to={[plungerX, 0, outerZ + side * 40]}
          radius={PRESS * 0.8}
        />
        {/* The barrel of the plunger, on the outside of the riser, and the collar that sets its preload. */}
        <Rod
          from={[plungerX, 0, outerZ]}
          to={[plungerX, 0, outerZ + side * 34]}
          radius={6}
          color={palette.muted}
        />
        <Rod
          from={[plungerX, 0, outerZ + side * plungerCollar]}
          to={[plungerX, 0, outerZ + side * (6 + plungerCollar)]}
          radius={8.5}
          color={palette.gold}
        />
      </Part>
      <Part look={look('rest')} {...pick('bow.centerShot')}>
        {/* The rest: a wire out of the window wall, bent up under the shaft. */}
        <PressArea
          from={[plungerX + 8, -radius - 14, windowZ]}
          to={[plungerX + 8, -radius - 14, atRest[2] - side * 11]}
          radius={PRESS * 0.6}
        />
        <Rod
          from={[plungerX + 8, -radius - 1.2, windowZ]}
          to={[plungerX + 8, -radius - 1.2, atRest[2] - side * 9]}
          radius={1.1}
          color={palette.ink}
        />
        <Rod
          from={[plungerX + 8, -radius - 1.2, atRest[2] - side * 9]}
          to={[plungerX + 8, radius * 0.4, atRest[2] - side * 11]}
          radius={1.1}
          color={palette.ink}
        />
      </Part>
      {/* The reference: string line seen from above, square to the string seen from the side. */}
      <Line
        points={[
          [stringX, 0, stringZ],
          [point[0] + 90, 0, stringZ],
        ]}
        color={palette.gold}
        lineWidth={2}
        dashed
        dashSize={18}
        gapSize={12}
      />

      <Part look={look('arrow')} {...pick('arrow.length')}>
        {/* Arrow: shaft, point, nock, three vanes. */}
        <Rod from={nock} to={point} radius={radius} color={palette.ink} />
        {/* From ahead of the string to the point: the nock end belongs to the nocking point. */}
        <PressArea from={along(nock, point, 0.14)} to={point} radius={PRESS} />

        <Rod
          from={point}
          to={along(nock, point, 1 + geometry.pointLength / arrowLength)}
          radius={radius * 1.3}
          endRadius={0.2}
          color={palette.muted}
        />
        <Rod
          from={along(nock, point, -0.015)}
          to={nock}
          radius={radius * 1.2}
          color={palette.weak}
        />
        <Vanes
          from={along(nock, point, 0.04)}
          to={along(nock, point, 0.12)}
          radius={radius}
          color={palette.accent}
        />
      </Part>
      <Part look={look('nockingPoint')} {...pick('bow.nockingPointHeight')}>
        {/* Nocking point locators on the string. */}
        <NockPressArea at={nock} />

        {[-11, 5].map((offset) => (
          <Rod
            key={offset}
            from={[stringX, nock[1] + offset, stringZ]}
            to={[stringX, nock[1] + offset + 6, stringZ]}
            radius={2.2}
            color={palette.gold}
          />
        ))}
      </Part>
      {/* What this view measures, drawn where it is measured. */}
      {measured.map(
        (mark, index) =>
          mark.line && (
            <Line
              key={index}
              points={[mark.line.from, mark.line.to]}
              color={palette.accent}
              lineWidth={4}
            />
          ),
      )}
    </group>
  )
}

/** How the value of a callout is written. On a narrow view the value is not shown; the edge of the box says it. */
const CALLOUT_TONE = {
  plain: 'text-ink-muted',
  fair: 'text-caution font-semibold',
  poor: 'text-weak font-semibold',
}

const labelClass =
  'border-line bg-surface text-ink absolute top-0 left-0 rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap shadow-sm'

export default function BowScene({
  bow,
  arrow,
  amplify,
  drawn,
  focus,
  focusRequest,
  units,
  onPick,
  onLeave,
  tones,
}: Props) {
  const m = useMessages()
  const geometry = useMemo(
    () => bowGeometry({ bow, arrow }, { amplify, drawn }),
    [bow, arrow, amplify, drawn],
  )
  const { point, side } = geometry
  const measured = useMemo(() => marks(focus, geometry), [focus, geometry])
  // The value the part under the pointer stands for: said before it is pressed.
  const [hovered, setHovered] = useState<string | null>(null)
  // The part whose callout is under the pointer, or has the focus.
  const [pointed, setPointed] = useState<PartName | null>(null)
  // The part being looked at closely, which is the one being set, stays bright too.
  const ownPiece = EQUIPMENT.find((piece) => piece.focus === focus)
  const inFocus: PartName | null =
    EXTRA_FOCUS[focus] ?? (focus !== 'bow' && ownPiece ? ownPiece.name : null)
  const underPointer: PartName | null = hovered ? (PART_OF[hovered] ?? null) : null
  // While the bow is turned the pointer crosses parts without meaning any of them.
  const [turning, setTurning] = useState(false)
  const lit = turning ? inFocus : (pointed ?? underPointer ?? inFocus)

  // One label per thing measured. Two marks may share a label: it is written once.
  // The length of the bow is left out: with the whole bow in view the callouts need the room.
  const labels = measured.filter(
    (mark, index) =>
      mark.shows !== 'bowLength' &&
      measured.findIndex((other) => JSON.stringify(other.shows) === JSON.stringify(mark.shows)) ===
        index,
  )
  const elements = useRef<(HTMLSpanElement | null)[]>([])
  const anchors: Anchor[] = labels.map((mark, index) => ({
    element: () => elements.current[index],
    position: mark.at,
  }))

  // A box for every part, with a line to it: the bow is its own menu.
  const calloutLayer = useRef<HTMLDivElement | null>(null)
  // What the hand is doing to the view: the callouts wait until it lets go.
  const handling = useRef({ held: false, released: (_soon?: boolean) => {} })
  const boxes = useRef<(HTMLButtonElement | null)[]>([])
  const lines = useRef<(SVGLineElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  // While one part is looked at closely, only its own callout stays.
  const closeUp = focus !== 'bow' && EQUIPMENT.some((piece) => piece.focus === focus)
  const callouts: Callout[] = EQUIPMENT.map(({ name, focus: own }, index) => ({
    shown: !closeUp || own === focus,
    box: () => boxes.current[index],
    line: () => lines.current[index],
    dot: () => dots.current[index],
    position: calloutAnchor(name, geometry),
  }))
  /** The value a part is known by, as its callout writes it. */
  const valueOf = (key: string): string => {
    const parameter = getParameter(key)
    return parameter.kind === 'enum'
      ? (parameterText(m, parameter).options?.[getValue({ bow, arrow }, parameter)] ??
          getValue({ bow, arrow }, parameter))
      : formatValue(parameter, getValue({ bow, arrow }, parameter), units)
  }

  const text = (mark: Mark): string => {
    if (mark.shows === 'bowLength') return m.panels.bowLength(bowLength(bow))
    const key = mark.shows.parameter
    // These two are said in words: which side of what, by how much.
    if (key === 'bow.centerShot') {
      // Against the string as the limbs carry it, which is what the arrow sees.
      const value = m.viewer.centerShotValue((point[2] - geometry.stringZ) / amplify)
      return `${m.viewer.centerShot}: ${value}`
    }
    if (key === 'bow.nockingPointHeight') {
      return `${m.viewer.nockingPoint}: ${m.viewer.nockingPointValue(bow.nockingPointHeight)}`
    }
    const parameter = getParameter(key)
    const { label } = parameterText(m, parameter)
    if (parameter.kind === 'enum') return label
    return `${label}: ${formatValue(parameter, getValue({ bow, arrow }, parameter), units)}`
  }

  return (
    <div
      className="@container relative h-full w-full overflow-hidden"
      // Or the browser starts its own scrolling under the held wheel.
      onMouseDown={(event) => {
        if (event.button === 1) event.preventDefault()
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, near: 20, far: 20000, position: [900, 250, -2900 * side] }}
        aria-label={m.viewer.sceneLabel}
        // A press beside the bow ends the close look at a part.
        onPointerMissed={() => {
          if (focus !== 'bow') onLeave()
        }}
        role="img"
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[800, 1600, -1200 * side]} intensity={2.2} />
        <directionalLight position={[-900, -400, 900 * side]} intensity={0.7} />
        <directionalLight position={[-1600, 300, 0]} intensity={0.9} />
        <Bow
          geometry={geometry}
          measured={measured}
          lit={lit}
          onPick={onPick}
          onHover={setHovered}
          // Going from one part straight to the next, the new one is entered before
          // the old one is left: leaving must not wipe out what was just entered.
          onLeave={(key) => setHovered((current) => (current === key ? null : current))}
        />
        <CameraRig
          focus={focus}
          focusRequest={focusRequest}
          geometry={geometry}
          onLeave={onLeave}
          onHold={(held) => {
            handling.current.held = held
            setTurning(held)
            if (!held) handling.current.released()
          }}
          onArrive={() => handling.current.released(true)}
        />
        <LabelPins anchors={anchors} />
        <CalloutPins
          callouts={callouts}
          layer={() => calloutLayer.current}
          held={() => handling.current.held}
          onSettle={(settle) => {
            handling.current.released = settle
          }}
        />
      </Canvas>

      {hovered && !turning && (
        <p className="border-line bg-surface text-ink pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap">
          {m.viewer.goTo(parameterText(m, getParameter(hovered)).label)}
        </p>
      )}
      <div
        ref={calloutLayer}
        className="pointer-events-none absolute inset-0 transition-opacity duration-150 motion-reduce:transition-none"
      >
        <svg
          className="text-ink-muted pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {EQUIPMENT.map(({ name }, index) => (
            <g key={name}>
              <line
                ref={(element) => {
                  lines.current[index] = element
                }}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.7"
              />
              <circle
                ref={(element) => {
                  dots.current[index] = element
                }}
                r="3"
                fill="currentColor"
              />
            </g>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0">
          {EQUIPMENT.map(({ name, parameter }, index) => (
            <button
              key={name}
              type="button"
              ref={(element) => {
                boxes.current[index] = element
              }}
              onClick={() => onPick(parameter)}
              onPointerEnter={() => setPointed(name)}
              onPointerLeave={() => setPointed((current) => (current === name ? null : current))}
              onFocus={() => setPointed(name)}
              onBlur={() => setPointed((current) => (current === name ? null : current))}
              aria-label={
                (tones?.[parameter] ?? 'plain') === 'plain'
                  ? m.viewer.goTo(m.viewer.part[name])
                  : `${m.viewer.goTo(m.viewer.part[name])}. ${m.attributes.tones[tones![parameter] as 'fair' | 'poor']}`
              }
              data-tone={tones?.[parameter] ?? 'plain'}
              className="border-line bg-surface/90 text-ink hover:border-accent data-[tone=fair]:border-l-gold data-[tone=poor]:border-l-weak data-[tone=fair]:border-l-4 data-[tone=poor]:border-l-4 focus-visible:outline-accent pointer-events-auto invisible absolute top-0 left-0 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-1.5 py-1 text-left leading-tight shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 @md:gap-2 @md:px-2"
            >
              <PartIcon part={name} className="text-ink-muted size-6 shrink-0 @md:size-8" />
              <span className="grid">
                <span className="text-xs font-medium @md:text-sm">{m.viewer.part[name]}</span>
                <span
                  className={`hidden text-xs @md:block ${CALLOUT_TONE[tones?.[parameter] ?? 'plain']}`}
                >
                  {valueOf(parameter)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        {labels.map((mark, index) => (
          <span
            key={JSON.stringify(mark.shows)}
            ref={(element) => {
              elements.current[index] = element
            }}
            className={labelClass}
          >
            {text(mark)}
          </span>
        ))}
      </div>
    </div>
  )
}
