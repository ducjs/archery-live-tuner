import { useMemo, useState } from 'react'
import { TopView } from '../../components/simulation/TopView.tsx'
import { heuristicModel } from '../../engine/index.ts'
import {
  fromDisplay,
  getParameter,
  getValue,
  setValue,
  toDisplay,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, type TuningSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { DemoCard, Fact } from './demoParts.tsx'
import { RATING, buttonClass, inputClass } from './demoText.ts'

function preset(name: string, values: Record<string, number>): TuningSetup {
  return Object.entries(values).reduce((setup, [key, value]) => {
    const parameter = getParameter(key) as NumberParameter
    return setValue(setup, parameter, fromDisplay(parameter, value))
  }, createDefaultSetup(name))
}

// Made-up saved setups, standing in for what the user would have stored.
const SAVED = [
  preset('Tên cũ, point 120', {}),
  preset('Thử point 100', { 'arrow.pointWeight': 100 }),
  preset('Tên mới spine 800', { 'arrow.spine': 800, 'arrow.pointWeight': 110 }),
]

const COMPARED = [
  'arrow.spine',
  'arrow.pointWeight',
  'arrow.length',
  'bow.drawWeight',
  'bow.plungerStiffness',
]

function SetupColumn({ setup }: { setup: TuningSetup }) {
  const result = useMemo(() => heuristicModel.simulate(setup), [setup])
  const { classification } = result
  return (
    <div className="min-w-0">
      <div className="border-line overflow-hidden rounded-md border">
        <TopView result={result} handedness={setup.bow.handedness} time={0.02} exaggeration={3} />
      </div>
      <dl className="mt-3 grid gap-1">
        <Fact label="Độ cứng động">{RATING[classification.stiffness]}</Fact>
        <Fact label="Dao động">{RATING[classification.oscillation]}</Fact>
        <Fact label="Lệch ngang">{RATING[classification.lateral]}</Fact>
        <Fact label="Dễ chạm cung">{RATING[classification.clearance]}</Fact>
      </dl>
    </div>
  )
}

function CompareDemo() {
  const current = useTuningStore((state) => state.setup)
  const setups = useMemo(() => [{ ...current, name: 'Setup đang mở' }, ...SAVED], [current])
  const [left, setLeft] = useState(1)
  const [right, setRight] = useState(2)
  const a = setups[left]!
  const b = setups[right]!

  const differences = COMPARED.map((key) => {
    const parameter = getParameter(key) as NumberParameter
    const show = (setup: TuningSetup) =>
      toDisplay(parameter, getValue(setup, parameter)).toFixed(parameter.step < 1 ? 1 : 0)
    return { label: parameter.label, a: show(a), b: show(b) }
  }).filter((row) => row.a !== row.b)

  const picker = (label: string, value: number, onChange: (index: number) => void) => (
    <label className="grid gap-1">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClass}
      >
        {setups.map((setup, index) => (
          <option key={setup.name} value={index}>
            {setup.name}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 @xl:grid-cols-2">
        <div className="grid content-start gap-3">
          {picker('Bên trái', left, setLeft)}
          <SetupColumn setup={a} />
        </div>
        <div className="grid content-start gap-3">
          {picker('Bên phải', right, setRight)}
          <SetupColumn setup={b} />
        </div>
      </div>
      <div>
        <h4 className="font-semibold">Khác nhau ở đâu</h4>
        {differences.length === 0 ? (
          <p className="text-ink-muted">Hai setup giống nhau ở các thông số chính.</p>
        ) : (
          <table className="mt-1 w-full max-w-md text-left">
            <thead className="text-ink-muted text-sm">
              <tr>
                <th className="py-1 font-normal">Thông số</th>
                <th className="py-1 text-right font-normal">Trái</th>
                <th className="py-1 text-right font-normal">Phải</th>
              </tr>
            </thead>
            <tbody>
              {differences.map((row) => (
                <tr key={row.label} className="border-line border-t">
                  <td className="py-1">{row.label}</td>
                  <td className="py-1 text-right font-semibold">{row.a}</td>
                  <td className="py-1 text-right font-semibold">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function UnitsDemo() {
  const setup = useTuningStore((state) => state.setup)
  const [metric, setMetric] = useState(false)
  const [vietnamese, setVietnamese] = useState(true)
  const text = vietnamese
    ? { draw: 'Lực kéo', length: 'Chiều dài tên', point: 'Khối lượng point', brace: 'Brace height' }
    : { draw: 'Draw weight', length: 'Arrow length', point: 'Point weight', brace: 'Brace height' }
  const { bow, arrow } = setup

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          aria-pressed={vietnamese}
          onClick={() => setVietnamese((value) => !value)}
        >
          {vietnamese ? 'Tiếng Việt' : 'English'}
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-pressed={metric}
          onClick={() => setMetric((value) => !value)}
        >
          {metric ? 'kg, cm, gram' : 'lb, inch, grain'}
        </button>
      </div>
      <dl className="grid max-w-md gap-1">
        <Fact label={text.draw}>
          {metric
            ? `${convert(bow.drawWeight, 'N', 'kgf').toFixed(1)} kg`
            : `${convert(bow.drawWeight, 'N', 'lbf').toFixed(1)} lb`}
        </Fact>
        <Fact label={text.length}>
          {metric
            ? `${convert(arrow.length, 'mm', 'cm').toFixed(1)} cm`
            : `${convert(arrow.length, 'mm', 'in').toFixed(2)} in`}
        </Fact>
        <Fact label={text.point}>
          {metric
            ? `${arrow.pointWeight.toFixed(1)} g`
            : `${convert(arrow.pointWeight, 'g', 'gr').toFixed(0)} gr`}
        </Fact>
        <Fact label={text.brace}>
          {metric
            ? `${convert(bow.braceHeight, 'mm', 'cm').toFixed(1)} cm`
            : `${convert(bow.braceHeight, 'mm', 'in').toFixed(2)} in`}
        </Fact>
      </dl>
    </div>
  )
}

export function V01Demo() {
  return (
    <>
      <DemoCard
        title="M6. Lưu và so sánh setup"
        kind="model"
        intro="Đặt hai setup cạnh nhau để thấy đổi gì thì kết quả đổi ra sao. Ba setup đã lưu ở đây là dựng sẵn. Bản thật đã có ở trang Mô phỏng: mục Setup của bạn và nút So sánh."
      >
        <CompareDemo />
      </DemoCard>
      <DemoCard
        title="M7. Ngôn ngữ và đơn vị"
        kind="simple"
        intro="Cùng một setup, hiển thị bằng tiếng Việt hoặc tiếng Anh, theo hệ lb/inch/grain hoặc kg/cm/gram. Số bên dưới lấy từ setup đang mở. Bản thật đã có ở trang Mô phỏng: hai nút chuyển trên thanh trên cùng."
      >
        <UnitsDemo />
      </DemoCard>
    </>
  )
}
