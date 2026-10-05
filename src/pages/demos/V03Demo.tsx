import { useMemo, useState } from 'react'
import { heuristicModel } from '../../engine/index.ts'
import { fromDisplay, getParameter, type NumberParameter } from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { DemoCard } from './demoParts.tsx'
import { RATING, buttonClass } from './demoText.ts'
import {
  LANDSCAPE_POINTS,
  decodeSetup,
  encodeSetup,
  landscape,
  sensitivity,
} from './logic/explore.ts'

const pointWeight = getParameter('arrow.pointWeight') as NumberParameter

// Diverging scale: weak and stiff are the two poles, neutral has no hue.
function cellStyle(behavior: number) {
  const strength = Math.min(1, Math.abs(behavior) / 0.8)
  if (strength < 0.25) return undefined
  const pole = behavior < 0 ? 'var(--color-chart-weak)' : 'var(--color-chart-stiff)'
  return { background: `color-mix(in oklab, ${pole} ${Math.round(strength * 78)}%, transparent)` }
}

function LandscapeDemo() {
  const setup = useTuningStore((state) => state.setup)
  const setParameter = useTuningStore((state) => state.setParameter)
  const grid = useMemo(() => landscape(heuristicModel, setup), [setup])
  const currentPoint = Math.round(convert(setup.arrow.pointWeight, 'g', 'gr') / 10) * 10

  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-center">
          <caption className="text-ink-muted pb-1 text-left text-sm">
            Hàng là spine, cột là point weight (gr). Bấm một ô để áp vào setup.
          </caption>
          <thead>
            <tr>
              <td />
              {LANDSCAPE_POINTS.map((point) => (
                <th key={point} scope="col" className="text-ink-muted px-1 text-sm font-normal">
                  {point}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row[0]!.spine}>
                <th scope="row" className="text-ink-muted pr-2 text-right text-sm font-normal">
                  {row[0]!.spine}
                </th>
                {row.map((cell) => {
                  const selected =
                    cell.spine === setup.arrow.spine && cell.pointWeight === currentPoint
                  return (
                    <td key={cell.pointWeight} className="p-0">
                      <button
                        type="button"
                        title={`Spine ${cell.spine}, point ${cell.pointWeight} gr: ${RATING[cell.rating]} (${cell.behavior.toFixed(2)})`}
                        aria-label={`Spine ${cell.spine}, point ${cell.pointWeight} grain: ${RATING[cell.rating]}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setParameter('arrow.spine', cell.spine)
                          setParameter(pointWeight.key, fromDisplay(pointWeight, cell.pointWeight))
                        }}
                        style={cellStyle(cell.behavior)}
                        className="bg-ink-muted/10 focus-visible:outline-accent aria-pressed:ring-ink size-11 cursor-pointer rounded text-sm font-semibold focus-visible:outline-2 aria-pressed:ring-2"
                      >
                        {cell.rating === 'NEUTRAL' ? 'TT' : cell.rating === 'WEAK' ? 'Y' : 'C'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="text-ink-muted flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: 'var(--color-chart-weak)' }} />
          Y: yếu
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-ink-muted/25 size-3 rounded-sm" />
          TT: trung tính
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: 'var(--color-chart-stiff)' }} />
          C: cứng
        </li>
      </ul>
    </div>
  )
}

function SensitivityDemo() {
  const setup = useTuningStore((state) => state.setup)
  const entries = useMemo(() => sensitivity(heuristicModel, setup).slice(0, 8), [setup])
  const largest = Math.max(...entries.map((entry) => Math.abs(entry.effect)), 0.01)

  return (
    <div className="grid gap-2">
      <div className="text-ink-muted grid grid-cols-[9rem_1fr_3.5rem] gap-x-3 text-sm">
        <span />
        <span className="flex justify-between">
          <span>làm tên yếu hơn</span>
          <span>làm tên cứng hơn</span>
        </span>
        <span />
      </div>
      <ul className="grid gap-1.5">
        {entries.map((entry) => {
          const share = (Math.abs(entry.effect) / largest) * 50
          return (
            <li key={entry.key} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-x-3">
              <span className="truncate">{entry.label}</span>
              <span className="bg-ink-muted/10 relative block h-4 rounded">
                <span className="bg-ink-muted absolute inset-y-0 left-1/2 w-px" />
                <span
                  className="absolute inset-y-0 rounded"
                  style={{
                    width: `${share}%`,
                    left: entry.effect < 0 ? `${50 - share}%` : '50%',
                    background: `var(--color-chart-${entry.effect < 0 ? 'weak' : 'stiff'})`,
                  }}
                />
              </span>
              <span className="text-right text-sm font-semibold">
                {entry.effect > 0 ? '+' : '−'}
                {Math.abs(entry.effect).toFixed(2)}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-ink-muted max-w-prose text-sm">
        Mỗi thanh: độ cứng động đổi bao nhiêu khi tăng thông số đó thêm một phần mười khoảng cho
        phép. Thanh dài nhất là thứ ảnh hưởng mạnh nhất với setup đang mở.
      </p>
    </div>
  )
}

function ShareDemo() {
  const setup = useTuningStore((state) => state.setup)
  const [status, setStatus] = useState('')
  const code = useMemo(() => encodeSetup(setup), [setup])
  const link = `${window.location.origin}${window.location.pathname}?setup=${code}`
  const check = decodeSetup(setup, code)

  return (
    <div className="grid gap-3">
      <p className="border-line bg-paper max-w-full rounded-md border px-3 py-2 text-sm break-all">
        {link}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            navigator.clipboard
              ?.writeText(link)
              .then(() => setStatus('Đã chép đường link.'))
              .catch(() => setStatus('Trình duyệt không cho chép. Hãy chọn và chép bằng tay.'))
          }}
        >
          Chép đường link
        </button>
        <span role="status" className="text-ink-muted">
          {status}
        </span>
      </div>
      <p className="text-ink-muted max-w-prose text-sm">
        Đường link chứa đủ {code.length} ký tự mã hoá toàn bộ setup, và giải mã ngược lại{' '}
        {check ? 'ra đúng setup này' : 'chưa khớp'}. Bản demo chưa tự mở setup khi vào link.
      </p>
    </div>
  )
}

export function V03Demo() {
  return (
    <>
      <DemoCard
        title="Bảng toàn cảnh"
        kind="model"
        intro="Thay vì thử từng tổ hợp, nhìn một lần thấy tổ hợp spine và point weight nào cân với cây cung đang mở."
      >
        <LandscapeDemo />
      </DemoCard>
      <DemoCard
        title="Thông số nào ảnh hưởng mạnh nhất"
        kind="model"
        intro="Biết nên chỉnh cái gì trước: thứ làm kết quả đổi nhiều nhất với setup hiện tại."
      >
        <SensitivityDemo />
      </DemoCard>
      <DemoCard
        title="Chia sẻ setup bằng đường link"
        kind="simple"
        intro="Gửi setup cho huấn luyện viên hoặc bạn tập mà không cần tài khoản."
      >
        <ShareDemo />
      </DemoCard>
      <DemoCard
        title="Cây cung 3D"
        kind="model"
        intro="Bản xem trước đã có trong trang Simulator: chỉnh center shot hoặc nocking point và nhìn mũi tên dịch trên cung."
      >
        <a
          href="#3d"
          className="text-accent focus-visible:outline-accent inline-flex min-h-11 items-center rounded font-medium underline underline-offset-4 focus-visible:outline-2"
        >
          Mở cây cung 3D
        </a>
      </DemoCard>
    </>
  )
}
