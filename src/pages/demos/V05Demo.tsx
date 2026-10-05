import { useMemo, useState } from 'react'
import { describeSuggestion } from '../../components/tuning/suggestionText.ts'
import { heuristicModel } from '../../engine/index.ts'
import { vi } from '../../i18n/vi.ts'
import {
  fromDisplay,
  getParameter,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { DemoCard, Fact } from './demoParts.tsx'
import { buttonClass } from './demoText.ts'
import { tunePlan } from './logic/explore.ts'

// A made-up setup that is off in three ways, so the plan has several steps.
const DETUNED: TuningSetup = Object.entries({
  'arrow.spine': 800,
  'bow.nockingPointHeight': 8,
  'bow.centerShot': 1.5,
}).reduce((setup, [key, value]) => {
  const parameter = getParameter(key) as NumberParameter
  return setValue(setup, parameter, fromDisplay(parameter, value))
}, createDefaultSetup('Setup lệch mẫu'))

function PlanDemo() {
  const current = useTuningStore((state) => state.setup)
  const [useCurrent, setUseCurrent] = useState(false)
  const start = useCurrent ? current : DETUNED
  const plan = useMemo(() => tunePlan(heuristicModel, start), [start])

  // Each step is described against the setup as it was just before that step.
  const texts = useMemo(
    () =>
      plan.steps.map((step, index) => {
        const before = heuristicModel.compareBareShaft(
          index === 0 ? start : plan.steps[index - 1]!.setup,
        )
        return describeSuggestion(
          step.suggestion,
          {
            classification: before.fletched.classification,
            horizontal: before.horizontal,
            vertical: before.vertical,
          },
          vi,
        )
      }),
    [plan, start],
  )

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Bắt đầu từ">
        <button
          type="button"
          className={buttonClass}
          aria-pressed={!useCurrent}
          onClick={() => setUseCurrent(false)}
        >
          Setup lệch mẫu
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-pressed={useCurrent}
          onClick={() => setUseCurrent(true)}
        >
          Setup đang mở
        </button>
      </div>

      {plan.steps.length === 0 ? (
        <p>Mô hình đọc setup này là đã cân. Không có bước nào cần làm.</p>
      ) : (
        <ol className="grid gap-2">
          {texts.map((text, index) => (
            <li
              key={index}
              className="border-line grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
            >
              <span className="font-display text-ink-muted text-xl font-semibold">{index + 1}</span>
              <div>
                <p className="font-semibold">{text.action}</p>
                <p>{text.value}</p>
                <p className="text-ink-muted text-sm">{text.effects.join(' ')}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="text-ink-muted max-w-prose text-sm">
        {plan.tuned
          ? `Sau ${plan.steps.length} bước, mô hình đọc setup là đã cân.`
          : 'Sau các bước này vẫn chưa cân hẳn; cần đổi lớn hơn một bước mỗi lần.'}{' '}
        Mỗi bước tính lại từ kết quả của bước trước.
      </p>
    </div>
  )
}

function StabilizerDemo() {
  const [longRod, setLongRod] = useState(28)
  const [tipWeight, setTipWeight] = useState(120)
  const [sideRods, setSideRods] = useState(10)
  const [sideWeight, setSideWeight] = useState(90)

  // Distances in front of (+) or behind (-) the riser, in cm.
  const front = longRod * 2.54
  const back = -sideRods * 2.54 * 0.7
  const total = tipWeight + sideWeight * 2
  const balance = total === 0 ? 0 : (tipWeight * front + sideWeight * 2 * back) / total

  const slider = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min: number,
    max: number,
    unit: string,
  ) => (
    <label className="grid gap-0.5">
      <span className="flex justify-between">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">
          {value} {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-accent focus-visible:outline-accent h-11 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </label>
  )

  const scale = 1.1
  return (
    <div className="grid gap-4 @2xl:grid-cols-2">
      <div className="grid gap-2">
        {slider('Thanh dài', longRod, setLongRod, 20, 34, 'in')}
        {slider('Tạ đầu thanh dài', tipWeight, setTipWeight, 0, 300, 'g')}
        {slider('Thanh bên', sideRods, setSideRods, 8, 15, 'in')}
        {slider('Tạ mỗi thanh bên', sideWeight, setSideWeight, 0, 250, 'g')}
      </div>
      <div className="grid content-start gap-3">
        <svg
          viewBox="-70 -45 190 90"
          role="img"
          aria-label="Bộ stabilizer nhìn từ trên"
          className="w-full max-w-md"
        >
          <rect x="-5" y="-6" width="10" height="12" rx="2" className="fill-ink-muted" />
          <g className="stroke-ink" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="0" x2={front * scale} y2="0" />
            <line x1="-3" y1="0" x2={back * scale} y2={-sideRods * 2.2} />
            <line x1="-3" y1="0" x2={back * scale} y2={sideRods * 2.2} />
          </g>
          <circle cx={front * scale} cy="0" r={3 + tipWeight / 60} className="fill-ink" />
          <circle
            cx={back * scale}
            cy={-sideRods * 2.2}
            r={3 + sideWeight / 60}
            className="fill-ink"
          />
          <circle
            cx={back * scale}
            cy={sideRods * 2.2}
            r={3 + sideWeight / 60}
            className="fill-ink"
          />
          <line
            x1={balance * scale}
            y1="-40"
            x2={balance * scale}
            y2="40"
            className="stroke-accent"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </svg>
        <dl className="grid max-w-md gap-1">
          <Fact label="Tổng khối lượng tạ">{total} g</Fact>
          <Fact label="Điểm cân bằng của tạ">
            {Math.abs(balance).toFixed(0)} cm {balance >= 0 ? 'trước' : 'sau'} riser
          </Fact>
        </dl>
        <p className="text-ink-muted max-w-prose text-sm">
          Vạch đứt là điểm cân bằng. Bản thật sẽ đưa các con số này vào mô hình thay cho một ô
          "stabilizer mass" như hiện nay.
        </p>
      </div>
    </div>
  )
}

const MORE = [
  ['Cách thả dây', 'Sai số thả dây theo chiều ngang, chiều dọc và độ ổn định giữa các lần bắn.'],
  ['Barebow', 'String walking: khoảng crawl làm đổi lực lên hai limb và độ cứng động của tên.'],
  ['Chi tiết tên', 'Chiều dài point và vị trí dán cánh.'],
]

export function V05Demo() {
  return (
    <>
      <DemoCard
        title="Kế hoạch tune từng bước"
        kind="model"
        intro="Mục gợi ý hiện nay chỉ nói bước kế tiếp. Bản này xếp cả một chuỗi: làm gì trước, làm gì sau, tới khi cân."
      >
        <PlanDemo />
      </DemoCard>
      <DemoCard
        title="Bộ stabilizer chi tiết"
        kind="simple"
        intro="Nhập từng thanh và từng cục tạ thay vì một con số tổng. Phép tính điểm cân bằng ở đây là moment đơn giản."
      >
        <StabilizerDemo />
      </DemoCard>
      <DemoCard
        title="Các thông số nâng cao khác"
        kind="fake"
        intro="Những nhóm thông số sẽ thêm vào chế độ Advanced. Chưa có phép tính nào phía sau."
      >
        <dl className="grid max-w-prose gap-3">
          {MORE.map(([name, text]) => (
            <div key={name}>
              <dt className="font-semibold">{name}</dt>
              <dd className="text-ink-muted">{text}</dd>
            </div>
          ))}
        </dl>
      </DemoCard>
    </>
  )
}
