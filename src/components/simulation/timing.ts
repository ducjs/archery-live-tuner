import type { SimulationResult } from '../../models/simulation.ts'

// Real flight takes about a third of a second, far too fast to read.
export const SLOW_MOTION = 12

/** s, how long the arrow stays in the target before the loop restarts */
export const HOLD_SECONDS = 1.2

/** Playback rates, relative to the normal slow motion. The last one is real time. */
export const SPEEDS = [0.25, 0.5, 1, 2, SLOW_MOTION]
export const DEFAULT_SPEED = 1

/** How many times slower than real time a playback rate is. 1 means real time. */
export function slowdown(speed: number): number {
  return SLOW_MOTION / speed
}

/** m, the distances archers usually shoot and tune at */
export const DISTANCES = [18, 30, 50, 70, 90]
export const DEFAULT_DISTANCE = 18

/**
 * mm, diameter of the World Archery target face shot at a distance: 40 cm
 * indoors at 18 m, 80 cm at 30 and 50 m, 122 cm at 70 and 90 m.
 */
export function targetFaceDiameter(distance: number): number {
  if (distance <= 25_000) return 400
  if (distance <= 50_000) return 800
  return 1220
}

export const MIN_EXAGGERATION = 1
export const MAX_EXAGGERATION = 5
export const DEFAULT_EXAGGERATION = 2

/**
 * SVG units per mm for the bow and the arrow, which are drawn to one scale:
 * the bow in the side view is a 68 in recurve, 187 units from tip to tip.
 * Distance to the target, bending and drift each have a scale of their own.
 */
export const EQUIPMENT_SCALE = 187 / (68 * 25.4)

/** s of flight over which the arrow turns from its rest on the bow to its flight attitude */
const LAUNCH_SECONDS = 0.008

/**
 * 0 on the string, 1 once the arrow is away. `time` counts from the moment the
 * nock leaves the string and is negative before that.
 */
export function launchEase(time: number): number {
  const share = Math.min(1, Math.max(0, time / LAUNCH_SECONDS))
  return share * share * (3 - 2 * share)
}

/**
 * SVG units from the center at which an arrow lands when its lateral or
 * vertical tendency is at full scale and nothing steers it back: a little
 * outside the target face. A bare shaft at full scale then misses the face,
 * and a fletched arrow, which is steered back, stays on it. The model gives
 * tendencies, not centimetres, so this is for reading the direction and
 * comparing two arrows.
 */
export function driftPixels(distance: number): number {
  return 1.4 * (targetFaceDiameter(distance) / 2) * EQUIPMENT_SCALE
}

/** Shared drawing area of the top and side views, in SVG units. */
export const SCENE = {
  width: 800,
  height: 300,
  centerY: 150,
  bowX: 70,
  targetX: 752,
  // A 27 in arrow at the scale of the bow.
  arrowLength: 27 * 25.4 * EQUIPMENT_SCALE,
}

/**
 * SVG units the nock sits behind the string's place at brace height: the whole
 * power stroke at full draw, nothing once the arrow has left. The string pushes
 * evenly, so the arrow covers the stroke as the square of the time.
 */
export function drawBack(result: SimulationResult, time: number): number {
  if (time >= 0) return 0
  const { powerStroke, timeOnString } = result.launch
  const share = Math.max(0, 1 + time / timeOnString)
  // Kept inside the frame for a very long draw.
  return Math.min(SCENE.bowX - 6, powerStroke * EQUIPMENT_SCALE) * (1 - share * share)
}

/** s, the longest the push of the string is shown for at normal playback speed */
const MAX_STROKE_SECONDS = 1.2

/**
 * s, how long the push of the string takes on screen at normal playback speed.
 * The bow is drawn far larger than the distance to the target, so at the pace
 * of the flight the arrow would shoot off the string and then seem to brake.
 * The push is shown slower instead, so the arrow leaves the string at the
 * speed it then flies at on screen.
 */
export function strokeSeconds(result: SimulationResult): number {
  const { powerStroke, timeOnString } = result.launch
  const flightPixels = SCENE.targetX - SCENE.bowX - SCENE.arrowLength
  const pixelsPerSecond = flightPixels / flightSeconds(result)
  const matched = (2 * powerStroke * EQUIPMENT_SCALE) / pixelsPerSecond
  return Math.min(MAX_STROKE_SECONDS, Math.max(timeOnString * SLOW_MOTION, matched))
}

/**
 * s of simulated time for a moment of the clip, counted from the nock leaving
 * the string: negative during the push, which runs at its own pace.
 */
export function clipTime(result: SimulationResult, elapsed: number): number {
  const stroke = strokeSeconds(result)
  return elapsed < stroke
    ? -result.launch.timeOnString * (1 - elapsed / stroke)
    : (elapsed - stroke) / SLOW_MOTION
}

/** s, the whole clip on screen: from full draw until the arrow is in the target */
export function clipSeconds(result: SimulationResult): number {
  return strokeSeconds(result) + flightSeconds(result)
}

/** s, how long the flight takes on screen at normal playback speed */
export function flightSeconds(result: SimulationResult): number {
  const { trajectory } = result
  return trajectory[trajectory.length - 1]!.t * SLOW_MOTION
}
