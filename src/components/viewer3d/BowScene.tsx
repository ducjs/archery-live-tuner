import { Line, OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { CatmullRomCurve3, Quaternion, TubeGeometry, Vector3 } from 'three'
import { useMessages } from '../../i18n/useMessages.ts'
import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import { along, bowGeometry, type BowGeometry, type Vec3 } from './bowGeometry.ts'

export type Focus = 'bow' | 'centerShot' | 'nockingPoint'

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

function Riser({ points, color }: { points: Vec3[]; color: string }) {
  const geometry = useMemo(() => {
    // The tube is stretched front to back afterwards, so its path is narrowed first.
    const curve = new CatmullRomCurve3(
      points.map(([x, y, z]) => new Vector3(x / RISER_DEPTH, y, z)),
      false,
      'catmullrom',
      0.35,
    )
    return new TubeGeometry(curve, 96, 15, 14)
  }, [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} scale={[RISER_DEPTH, 1, 1]}>
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.35} />
    </mesh>
  )
}

type Shot = { position: Vec3; target: Vec3 }

function cameraShot(focus: Focus, geometry: BowGeometry): Shot {
  const { side, stringX, point } = geometry
  switch (focus) {
    case 'centerShot': {
      // Looking down on the front half of the arrow, where the offset is largest.
      const x = stringX + (point[0] - stringX) * 0.6
      return { position: [x, 820, -130 * side], target: [x, 0, 0] }
    }
    case 'nockingPoint':
      // Level with the nock, from the open side of the bow.
      return { position: [stringX + 90, 25, -560 * side], target: [stringX + 90, 10, 0] }
    default:
      // From the open side, so the arrow is in front of the riser.
      return { position: [900, 250, -2900 * side], target: [120, 0, 0] }
  }
}

type ControlsHandle = { target: Vector3; update: () => void }

type RigProps = Pick<Props, 'focus' | 'focusRequest'> & { geometry: BowGeometry }

function CameraRig({ focus, focusRequest, geometry }: RigProps) {
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
  const goal = useRef<{ position: Vector3; target: Vector3 } | null>(null)
  useEffect(() => {
    const shot = cameraShot(focus, latest.current)
    goal.current = {
      position: new Vector3(...shot.position),
      target: new Vector3(...shot.target),
    }
    flying.current = true
    invalidate()
  }, [focus, focusRequest, geometry.side, invalidate])

  useFrame((_, delta) => {
    if (!flying.current || !controls.current || !goal.current) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const step = first.current || reduceMotion ? 1 : 1 - Math.exp(-5 * Math.min(delta, 0.1))
    first.current = false

    camera.position.lerp(goal.current.position, step)
    controls.current.target.lerp(goal.current.target, step)
    controls.current.update()

    if (camera.position.distanceTo(goal.current.position) < 1) flying.current = false
    else invalidate()
  })

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping={false}
      minDistance={150}
      maxDistance={6000}
      onStart={() => {
        // The user took over; stop steering the camera.
        flying.current = false
      }}
    />
  )
}

type Anchor = { element: RefObject<HTMLElement | null>; position: Vec3 }

/** Keeps HTML labels pinned to points of the scene. */
function LabelPins({ anchors }: { anchors: Anchor[] }) {
  const projected = useMemo(() => new Vector3(), [])
  useFrame(({ camera, size }) => {
    for (const { element, position } of anchors) {
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

function Bow({ geometry }: { geometry: BowGeometry }) {
  const palette = useMemo(() => readPalette(), [])
  const { side, stringX, stringZ, nock, point, atRest, shaftRadius, limbs, string } = geometry
  const { riser, pockets, longRod, sideRods, weightLength, plungerCollar } = geometry
  const [upperLimb, lowerLimb] = limbs

  // Drawn a little thicker than life, or the shaft vanishes at this size.
  const radius = shaftRadius * 1.4
  const arrowLength = Math.hypot(point[0] - nock[0], point[1] - nock[1], point[2] - nock[2])
  // Z of the riser beside the arrow: the inner face of the sight window.
  const windowZ = riser.find(([, y]) => y > 0)![2]

  return (
    <group>
      {/* Riser, with the grip on the archer's side and a pocket for each limb. */}
      <Riser points={riser} color={palette.muted} />
      <group position={[-1, -74, 0]} rotation={[0, 0, 0.16]}>
        <RoundedBox args={[30, 92, 31]} radius={12}>
          <meshStandardMaterial color={palette.ink} roughness={0.85} />
        </RoundedBox>
      </group>
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

      <Limb points={upperLimb} color={palette.ink} />
      <Limb points={lowerLimb} color={palette.ink} />
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

      {/* Long rod, with a damper and its weight at the far end. */}
      <Rod from={longRod.from} to={longRod.to} radius={7} color={palette.ink} />
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
          <Rod from={rod.to} to={along(rod.from, rod.to, 1.12)} radius={12} color={palette.muted} />
        </group>
      ))}

      {/* Plunger through the riser, touching the shaft. Rest wire under it. */}
      <Rod
        from={[0, 0, windowZ + side * 30]}
        to={[0, 0, atRest[2] + side * radius]}
        radius={3.2}
        color={palette.gold}
      />
      {/* The barrel of the plunger, on the outside of the riser, and the collar that sets its preload. */}
      <Rod
        from={[0, 0, windowZ + side * 14]}
        to={[0, 0, windowZ + side * 44]}
        radius={6}
        color={palette.muted}
      />
      <Rod
        from={[0, 0, windowZ + side * (14 + plungerCollar)]}
        to={[0, 0, windowZ + side * (20 + plungerCollar)]}
        radius={8.5}
        color={palette.gold}
      />
      <Rod
        from={[6, -radius - 1, windowZ]}
        to={[6, -radius - 1, atRest[2] - side * 10]}
        radius={1}
        color={palette.ink}
      />

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

      {/* Arrow: shaft, point, nock, three vanes. */}
      <Rod from={nock} to={point} radius={radius} color={palette.ink} />
      <Rod
        from={point}
        to={along(nock, point, 1 + geometry.pointLength / arrowLength)}
        radius={radius * 1.3}
        endRadius={0.2}
        color={palette.muted}
      />
      <Rod from={along(nock, point, -0.015)} to={nock} radius={radius * 1.2} color={palette.weak} />
      <Vanes
        from={along(nock, point, 0.04)}
        to={along(nock, point, 0.12)}
        radius={radius}
        color={palette.accent}
      />

      {/* Nocking point locators on the string. */}
      {[-11, 5].map((offset) => (
        <Rod
          key={offset}
          from={[stringX, nock[1] + offset, stringZ]}
          to={[stringX, nock[1] + offset + 6, stringZ]}
          radius={2.2}
          color={palette.gold}
        />
      ))}

      {/* The two offsets, drawn from the reference line to the arrow. */}
      <Line
        points={[
          [stringX - 14, 0, stringZ],
          [stringX - 14, nock[1], stringZ],
        ]}
        color={palette.accent}
        lineWidth={4}
      />
      <Line
        points={[
          [point[0], 0, stringZ],
          [point[0], 0, point[2]],
        ]}
        color={palette.accent}
        lineWidth={4}
      />
    </group>
  )
}

const labelClass =
  'border-line bg-surface text-ink absolute top-0 left-0 rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap shadow-sm'

export default function BowScene({ bow, arrow, amplify, drawn, focus, focusRequest }: Props) {
  const m = useMessages()
  const geometry = useMemo(
    () => bowGeometry({ bow, arrow }, { amplify, drawn }),
    [bow, arrow, amplify, drawn],
  )
  const nockLabel = useRef<HTMLSpanElement>(null)
  const pointLabel = useRef<HTMLSpanElement>(null)
  const { nock, point, side } = geometry

  const anchors: Anchor[] = [
    { element: nockLabel, position: [nock[0], Math.max(nock[1], 0) + 30, 0] },
    { element: pointLabel, position: [point[0], Math.max(point[1], 0) + 30, point[2]] },
  ]

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, near: 20, far: 20000, position: [900, 250, -2900 * side] }}
        aria-label={m.viewer.sceneLabel}
        role="img"
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[800, 1600, -1200 * side]} intensity={2.2} />
        <directionalLight position={[-900, -400, 900 * side]} intensity={0.7} />
        <Bow geometry={geometry} />
        <CameraRig focus={focus} focusRequest={focusRequest} geometry={geometry} />
        <LabelPins anchors={anchors} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0">
        <span ref={nockLabel} className={labelClass}>
          {m.viewer.nockingPoint}: {m.viewer.nockingPointValue(bow.nockingPointHeight)}
        </span>
        <span ref={pointLabel} className={labelClass}>
          {/* Against the string as the limbs carry it, which is what the arrow sees. */}
          {m.viewer.centerShot}: {m.viewer.centerShotValue((point[2] - geometry.stringZ) / amplify)}
        </span>
      </div>
    </div>
  )
}
