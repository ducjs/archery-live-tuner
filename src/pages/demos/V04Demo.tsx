import { useMemo, useState, type MouseEvent } from 'react'
import { heuristicModel } from '../../engine/index.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { DemoCard, Fact } from './demoParts.tsx'
import { RATING, buttonClass } from './demoText.ts'
import { advise, readPlot, type Mark } from './logic/targetPlot.ts'

/** cm. A 40 cm face, as used at 18 m. */
const FACE_RADIUS = 20
const VIEW = 24

// World Archery colors, outer ring first. Each color covers two scoring rings.
const RINGS = ['#f5f5f5', '#22262b', '#2d9cdb', '#e5383b', '#ffd23f']

// Made-up ends, so the demo has something to read before the user taps anything.
const EXAMPLES: Record<string, { label: string; marks: Mark[] }> = {
  weak: {
    label: 'Ví dụ: tên yếu',
    marks: [
      { x: -1.2, y: 1.4, bare: false },
      { x: 0.8, y: -0.6, bare: false },
      { x: -0.4, y: -1.8, bare: false },
      { x: 1.6, y: 0.9, bare: false },
      { x: 0.2, y: 0.3, bare: false },
      { x: 7.4, y: -0.8, bare: true },
      { x: 6.1, y: 0.6, bare: true },
    ],
  },
  nockHigh: {
    label: 'Ví dụ: nock cao',
    marks: [
      { x: -0.9, y: 0.7, bare: false },
      { x: 1.1, y: 1.3, bare: false },
      { x: 0.3, y: -1.1, bare: false },
      { x: -1.5, y: -0.4, bare: false },
      { x: 0.6, y: -6.8, bare: true },
      { x: -0.8, y: -5.9, bare: true },
    ],
  },
  unclear: {
    label: 'Ví dụ: chưa rõ',
    marks: [
      { x: -4.2, y: 3.1, bare: false },
      { x: 3.6, y: -2.4, bare: false },
      { x: -2.1, y: -4.4, bare: false },
      { x: 4.8, y: 3.9, bare: false },
      { x: 1.9, y: 0.8, bare: true },
    ],
  },
}

function TargetPlotDemo() {
  const setup = useTuningStore((state) => state.setup)
  const [marks, setMarks] = useState<Mark[]>(EXAMPLES.weak!.marks)
  const [bare, setBare] = useState(false)

  const handedness = setup.bow.handedness
  const reading = useMemo(() => readPlot(marks, handedness), [marks, handedness])
  const model = useMemo(() => heuristicModel.compareBareShaft(setup), [setup])
  // Does the setup, as entered, read the same way in the model?
  const weakSide = handedness === 'RH' ? 'RIGHT' : 'LEFT'
  const modelReads =
    model.horizontal === 'TOGETHER' ? 'OK' : model.horizontal === weakSide ? 'WEAK' : 'STIFF'
  const advice = advise(reading, modelReads === reading.horizontal)

  const addMark = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 2 * VIEW - VIEW
    const y = -(((event.clientY - box.top) / box.height) * 2 * VIEW - VIEW)
    setMarks((current) => [...current, { x, y, bare }])
  }

  return (
    <div className="grid gap-5 @2xl:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Loại tên sẽ chấm">
          <button
            type="button"
            className={buttonClass}
            aria-pressed={!bare}
            onClick={() => setBare(false)}
          >
            Tên có cánh
          </button>
          <button
            type="button"
            className={buttonClass}
            aria-pressed={bare}
            onClick={() => setBare(true)}
          >
            Bareshaft
          </button>
        </div>
        <svg
          viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
          role="img"
          aria-label={`Mặt bia 40 cm. Đã chấm ${marks.filter((mark) => !mark.bare).length} tên có cánh và ${marks.filter((mark) => mark.bare).length} bareshaft. Bấm để chấm thêm.`}
          onClick={addMark}
          className="w-full max-w-sm cursor-crosshair touch-manipulation"
        >
          {RINGS.map((color, index) => (
            <circle
              key={color}
              r={FACE_RADIUS * (1 - index / RINGS.length)}
              fill={color}
              stroke="#22262b"
              strokeWidth="0.12"
            />
          ))}
          {marks.map((mark, index) =>
            mark.bare ? (
              // Bare shafts are a square outline, so they differ by shape, not only by color.
              <rect
                key={index}
                x={mark.x - 0.85}
                y={-mark.y - 0.85}
                width="1.7"
                height="1.7"
                fill="#ffffff"
                stroke="#101418"
                strokeWidth="0.45"
              />
            ) : (
              <circle
                key={index}
                cx={mark.x}
                cy={-mark.y}
                r="0.8"
                fill="#101418"
                stroke="#ffffff"
                strokeWidth="0.3"
              />
            ),
          )}
        </svg>
        <ul className="text-ink-muted flex gap-5 text-sm">
          <li className="flex items-center gap-1.5">
            <span className="bg-ink size-3 rounded-full" /> Tên có cánh
          </li>
          <li className="flex items-center gap-1.5">
            <span className="border-ink bg-surface size-3 border-2" /> Bareshaft
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          {Object.values(EXAMPLES).map((example) => (
            <button
              key={example.label}
              type="button"
              className={buttonClass}
              onClick={() => setMarks(example.marks)}
            >
              {example.label}
            </button>
          ))}
          <button
            type="button"
            className={buttonClass}
            disabled={marks.length === 0}
            onClick={() => setMarks((current) => current.slice(0, -1))}
          >
            Bỏ mũi cuối
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={marks.length === 0}
            onClick={() => setMarks([])}
          >
            Xoá hết
          </button>
        </div>
      </div>

      <div className="grid content-start gap-4">
        {!reading.enough ? (
          <p className="max-w-prose">
            Cần ít nhất 3 tên có cánh và 1 bareshaft để đọc. Bấm lên mặt bia để chấm, hoặc chọn một
            ví dụ.
          </p>
        ) : (
          <>
            <dl className="grid max-w-md gap-1">
              <Fact label="Bareshaft lệch khỏi cụm">
                {reading.distance.toFixed(1)} cm, hướng {reading.clock} giờ
              </Fact>
              <Fact label="Độ tản của cụm có cánh">{reading.spread.toFixed(1)} cm</Fact>
              <Fact label="Mô hình đọc setup đã nhập">
                {modelReads === 'OK' ? 'Cân' : RATING[modelReads]}
              </Fact>
            </dl>

            {!reading.conclusive ? (
              <p className="border-line max-w-prose rounded-md border-l-4 px-3 py-2">
                <span className="font-semibold">Chưa kết luận được.</span> Độ lệch của bareshaft nhỏ
                so với độ tản của cụm. Bắn thêm vài lượt, hoặc bắn ở cự ly gần hơn.
              </p>
            ) : (
              <div>
                <p className="font-semibold">
                  Đọc bia:{' '}
                  {[
                    reading.horizontal === 'WEAK' && 'tên đang yếu',
                    reading.horizontal === 'STIFF' && 'tên đang cứng',
                    reading.vertical === 'NOCK_HIGH' && 'nocking point cao',
                    reading.vertical === 'NOCK_LOW' && 'nocking point thấp',
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  .
                </p>
                <ol className="mt-2 grid gap-2">
                  {advice.map((item, index) => (
                    <li
                      key={item.action}
                      className="border-line grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
                    >
                      <span className="font-display text-ink-muted text-xl font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{item.action}</p>
                        <p className="text-ink-muted text-sm">{item.why}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Made-up log of one archer's sessions.
const OBSERVATIONS = [
  { setup: 'Spine 700, point 120', model: 'Trung tính', seen: 'Hơi yếu', match: false },
  { setup: 'Spine 700, point 100', model: 'Trung tính', seen: 'Trung tính', match: true },
  { setup: 'Spine 800, point 110', model: 'Yếu', seen: 'Yếu nhiều', match: true },
  { setup: 'Spine 650, point 120', model: 'Cứng', seen: 'Trung tính', match: false },
]

function CalibrationDemo() {
  const [calibrated, setCalibrated] = useState(false)
  const matches = calibrated ? OBSERVATIONS.length : OBSERVATIONS.filter((row) => row.match).length

  return (
    <div className="grid gap-3">
      <button
        type="button"
        className={`${buttonClass} justify-self-start`}
        aria-pressed={calibrated}
        onClick={() => setCalibrated((value) => !value)}
      >
        {calibrated ? 'Đang dùng mô hình đã hiệu chỉnh' : 'Đang dùng mô hình gốc'}
      </button>
      <table className="w-full max-w-xl text-left">
        <thead className="text-ink-muted text-sm">
          <tr>
            <th className="py-1 font-normal">Setup</th>
            <th className="py-1 font-normal">Mô hình đoán</th>
            <th className="py-1 font-normal">Thực tế ghi lại</th>
          </tr>
        </thead>
        <tbody>
          {OBSERVATIONS.map((row) => (
            <tr key={row.setup} className="border-line border-t">
              <td className="py-1.5">{row.setup}</td>
              <td className="py-1.5 font-semibold">
                {calibrated ? row.seen.replace(' nhiều', '').replace('Hơi yếu', 'Yếu') : row.model}
              </td>
              <td className="py-1.5">{row.seen}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Khớp với thực tế: <span className="font-semibold">{matches}</span> trên{' '}
        {OBSERVATIONS.length} lần ghi.
      </p>
    </div>
  )
}

export function V04Demo() {
  return (
    <>
      <DemoCard
        title="Chấm tên trên bia để chẩn đoán"
        kind="simple"
        intro="Chấm vị trí tên có cánh và bareshaft như app ghi điểm. Ứng dụng đọc độ lệch thật trên bia, đối chiếu với setup đang mở, rồi gợi ý nên chỉnh gì trước. Các ví dụ là dữ liệu dựng sẵn."
      >
        <TargetPlotDemo />
      </DemoCard>
      <DemoCard
        title="Mô hình học từ quan sát"
        kind="fake"
        intro="Ghi lại điều thật sự xảy ra với từng setup. Sau vài lần, mô hình tự chỉnh hệ số để đoán sát hơn cho chính bạn. Bảng dưới là ví dụ minh hoạ, chưa có phép hiệu chỉnh thật."
      >
        <CalibrationDemo />
      </DemoCard>
    </>
  )
}
