import type { Handedness } from '../../../models/bow.ts'

/** Where one arrow landed, in cm from the middle of the target. x is right, y is up. */
export type Mark = { x: number; y: number; bare: boolean }

export type PlotReading = {
  /** Enough arrows to say anything at all. */
  enough: boolean
  /** cm, middle of the fletched group */
  fletchedCenter: { x: number; y: number }
  /** cm, average distance of the fletched arrows from their own middle */
  spread: number
  /** cm, bare shafts relative to the fletched group */
  offset: { x: number; y: number }
  /** cm */
  distance: number
  /** 1..12, direction of the bare shafts from the fletched group, as on a clock face */
  clock: number
  /** False when the offset is small against the spread of the group. */
  conclusive: boolean
  horizontal: 'WEAK' | 'STIFF' | 'OK'
  vertical: 'NOCK_HIGH' | 'NOCK_LOW' | 'OK'
}

const MIN_FLETCHED = 3
const MIN_BARE = 1
/** An offset under this many cm is within what a bare shaft does on its own. */
const MIN_OFFSET = 1.5

function center(marks: Mark[]): { x: number; y: number } {
  const total = marks.reduce((sum, mark) => ({ x: sum.x + mark.x, y: sum.y + mark.y }), {
    x: 0,
    y: 0,
  })
  return { x: total.x / marks.length, y: total.y / marks.length }
}

/** Reads a bare shaft test from marks on a target face. */
export function readPlot(marks: Mark[], handedness: Handedness): PlotReading {
  const fletched = marks.filter((mark) => !mark.bare)
  const bare = marks.filter((mark) => mark.bare)
  const enough = fletched.length >= MIN_FLETCHED && bare.length >= MIN_BARE

  const fletchedCenter = fletched.length > 0 ? center(fletched) : { x: 0, y: 0 }
  const spread =
    fletched.length > 0
      ? fletched.reduce(
          (sum, mark) => sum + Math.hypot(mark.x - fletchedCenter.x, mark.y - fletchedCenter.y),
          0,
        ) / fletched.length
      : 0
  const bareCenter = bare.length > 0 ? center(bare) : fletchedCenter
  const offset = { x: bareCenter.x - fletchedCenter.x, y: bareCenter.y - fletchedCenter.y }
  const distance = Math.hypot(offset.x, offset.y)

  // 12 o'clock is straight up, 3 o'clock is to the right.
  const hours = Math.round((Math.atan2(offset.x, offset.y) / (2 * Math.PI)) * 12)
  const clock = ((hours + 11) % 12) + 1

  const conclusive = enough && distance > Math.max(MIN_OFFSET, spread * 0.75)
  // One direction only counts when it carries a real share of the offset.
  const counts = (component: number) => conclusive && Math.abs(component) > distance * 0.4
  const weakSide = handedness === 'RH' ? 1 : -1

  return {
    enough,
    fletchedCenter,
    spread,
    offset,
    distance,
    clock,
    conclusive,
    horizontal: counts(offset.x) ? (Math.sign(offset.x) === weakSide ? 'WEAK' : 'STIFF') : 'OK',
    vertical: counts(offset.y) ? (offset.y < 0 ? 'NOCK_HIGH' : 'NOCK_LOW') : 'OK',
  }
}

export type PlotAdvice = { action: string; why: string }

/** m, the distance the demo's 40 cm face is shot at. */
export const DEFAULT_RANGE = 18

/**
 * cm to the side within which the plunger alone will most likely bring the
 * bare shaft back. Total Archery gives 3 in at 30 m; scaling it with the
 * distance is an assumption.
 */
export function plungerReach(range: number): number {
  return 7.6 * (range / 30)
}

/**
 * cm to the side past which the shaft is the wrong one, when adjusting the bow
 * has not brought it back. The Easton guide gives 6 in at 20 yd (15 cm at
 * 18 m); scaling it with the distance is an assumption.
 */
export function shaftLimit(range: number): number {
  return 15 * (range / 18)
}

/**
 * Turns the reading into things to try, in the order the tuning guides work
 * in. `modelAgrees` says whether the setup, as entered, also reads weak or
 * stiff in the model. `range` is the shooting distance in m.
 */
export function advise(
  reading: PlotReading,
  modelAgrees: boolean,
  range: number = DEFAULT_RANGE,
): PlotAdvice[] {
  const advice: PlotAdvice[] = []
  if (!reading.conclusive) return advice

  if (reading.vertical !== 'OK') {
    const high = reading.vertical === 'NOCK_HIGH'
    advice.push({
      action: high ? 'Hạ nocking point xuống khoảng 1 mm' : 'Nâng nocking point lên khoảng 1 mm',
      why: high
        ? 'Bareshaft rơi thấp hơn cụm tên có cánh. Chỉnh chiều dọc trước, vì nó ảnh hưởng tới cách đọc chiều ngang.'
        : 'Bareshaft rơi cao hơn cụm tên có cánh. Chỉnh chiều dọc trước, vì nó ảnh hưởng tới cách đọc chiều ngang.',
    })
  }

  if (reading.horizontal !== 'OK') {
    const weak = reading.horizontal === 'WEAK'
    const sideways = Math.abs(reading.offset.x)
    const cm = (value: number) => value.toFixed(0)
    advice.push({
      action: weak ? 'Tăng độ cứng plunger một nấc' : 'Giảm độ cứng plunger một nấc',
      why: modelAgrees
        ? `Bia và mô hình cùng cho thấy tên đang ${weak ? 'yếu' : 'cứng'}. Plunger là thứ chỉnh nhanh nhất, không tốn gì.`
        : `Trên giấy setup này đã cân, nhưng bia cho thấy tên đang ${weak ? 'yếu' : 'cứng'}. Khác biệt có thể đến từ cách thả dây, nên chỉnh plunger trước khi nghĩ tới đổi tên.`,
    })
    if (sideways > plungerReach(range)) {
      advice.push({
        action: weak
          ? 'Thử point nhẹ hơn, rồi mới tới giảm lực kéo'
          : 'Thử point nặng hơn, rồi mới tới tăng lực kéo',
        why: `Lệch ngang hơn ${cm(plungerReach(range))} cm ở ${range} m thì plunger thường không đủ kéo bareshaft về cụm.`,
      })
    }
    if (sideways > shaftLimit(range)) {
      advice.push({
        action: weak ? 'Cân nhắc thân tên cứng hơn' : 'Cân nhắc thân tên mềm hơn',
        why: `Nếu đã chỉnh các thứ trên mà bareshaft vẫn lệch ngang hơn ${cm(shaftLimit(range))} cm ở ${range} m, sách Easton coi là thân tên không hợp với cung.`,
      })
    }
  }
  return advice
}
