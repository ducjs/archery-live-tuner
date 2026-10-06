import { useMemo } from 'react'
import { MIN_GRAINS_PER_POUND, heuristicModel } from '../../engine/index.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { DemoCard, Fact } from './demoParts.tsx'

function DerivedDemo() {
  const setup = useTuningStore((state) => state.setup)
  const { metrics } = useMemo(() => heuristicModel.analyze(setup), [setup])
  const gpp = metrics.grainsPerPound
  const foc = metrics.frontOfCenter

  return (
    <div className="grid gap-3">
      <dl className="grid max-w-md gap-1">
        <Fact label="Grains mỗi pound">{gpp.toFixed(1)} gr/lb</Fact>
        <Fact label="FOC (trọng tâm lệch về trước)">{foc.toFixed(1)} %</Fact>
        <Fact label="Tốc độ ước lượng">{(metrics.launchSpeed / 1000).toFixed(1)} m/s</Fact>
        <Fact label="Động năng">{metrics.kineticEnergy.toFixed(1)} J</Fact>
      </dl>
      {gpp < MIN_GRAINS_PER_POUND && (
        <p
          role="status"
          className="border-weak bg-weak/10 max-w-prose rounded-md border-l-4 px-3 py-2"
        >
          Mũi tên nhẹ so với lực kéo ({gpp.toFixed(1)} gr/lb). Tên quá nhẹ làm cung chịu tải gần như
          bắn khan; nên xem khuyến nghị của nhà sản xuất cung.
        </p>
      )}
    </div>
  )
}

/** A sheet of paper with the hole the point makes and the tear the nock end leaves. */
function PaperTearDemo() {
  const setup = useTuningStore((state) => state.setup)
  const { metrics, classification } = useMemo(
    () => heuristicModel.analyze(setup, { bareShaft: true }),
    [setup],
  )
  // Right-handed and weak: the nock end tears to the left of the point hole.
  const side = setup.bow.handedness === 'RH' ? 1 : -1
  const dx = metrics.dynamicBehavior * side * 46
  const dy = -metrics.verticalTendency * 46
  const clean = Math.hypot(dx, dy) < 8

  const words: string[] = []
  if (Math.abs(dx) >= 8) words.push(dx < 0 ? 'lệch trái' : 'lệch phải')
  if (Math.abs(dy) >= 8) words.push(dy < 0 ? 'lệch cao' : 'lệch thấp')

  return (
    <div className="grid items-center gap-4 @lg:grid-cols-[12rem_1fr]">
      <svg
        viewBox="-60 -60 120 120"
        role="img"
        aria-label="Tờ giấy với lỗ tên xuyên qua"
        className="w-48"
      >
        <rect x="-58" y="-58" width="116" height="116" rx="3" className="fill-paper stroke-line" />
        <line
          x1="0"
          y1="0"
          x2={dx}
          y2={dy}
          className="stroke-ink"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle r="6" className="fill-ink" />
        {[0, 120, 240].map((angle) => (
          <line
            key={angle}
            x1={dx}
            y1={dy}
            x2={dx + 9 * Math.cos((angle * Math.PI) / 180)}
            y2={dy + 9 * Math.sin((angle * Math.PI) / 180)}
            className="stroke-ink"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div>
        <p className="font-semibold">
          {clean ? 'Lỗ tròn, gần như không rách.' : `Vết rách của đuôi tên ${words.join(', ')}.`}
        </p>
        <p className="text-ink-muted mt-1 max-w-prose">
          Chấm đậm là lỗ của point, vạch là đường đuôi tên xé giấy.{' '}
          {classification.stiffness === 'NEUTRAL' && classification.vertical === 'NEUTRAL'
            ? 'Mô hình đọc setup này là cân.'
            : 'Hướng rách suy ra từ độ cứng động và xu hướng dọc của mô hình.'}
        </p>
      </div>
    </div>
  )
}

/** Arrows shot at one aiming point from growing distances; a tuned bow leaves a vertical line. */
function WalkBackDemo() {
  const setup = useTuningStore((state) => state.setup)
  const { metrics } = useMemo(() => heuristicModel.analyze(setup), [setup])
  const distances = [5, 10, 15, 20, 25, 30]
  const drift = metrics.lateralDeviation
  const lean =
    Math.abs(drift) < 0.08 ? 'thẳng đứng' : drift > 0 ? 'nghiêng sang phải' : 'nghiêng sang trái'

  return (
    <div className="grid items-center gap-4 @lg:grid-cols-[12rem_1fr]">
      <svg
        viewBox="-60 -10 120 150"
        role="img"
        aria-label="Các mũi tên walk-back trên bia"
        className="w-48"
      >
        <rect x="-58" y="-8" width="116" height="146" rx="3" className="fill-paper stroke-line" />
        <line x1="0" y1="0" x2="0" y2="130" className="stroke-line" strokeDasharray="3 4" />
        {distances.map((distance, index) => (
          <g key={distance}>
            <circle cx={drift * distance * 1.6} cy={8 + index * 22} r="4" className="fill-ink" />
            <text x="-54" y={12 + index * 22} className="fill-ink-muted" fontSize="9">
              {distance} m
            </text>
          </g>
        ))}
      </svg>
      <div>
        <p className="font-semibold">Hàng tên {lean}.</p>
        <p className="text-ink-muted mt-1 max-w-prose">
          Bắn cùng một điểm ngắm từ 5 m lùi dần ra 30 m. Hàng thẳng đứng nghĩa là center shot và
          plunger đã ổn; hàng nghiêng nghĩa là tên lệch dần theo cự ly.
        </p>
      </div>
    </div>
  )
}

/** Sideways swing of the nock end over time, with the moment the arrow leaves the string. */
function ClearanceDemo() {
  const setup = useTuningStore((state) => state.setup)
  const { metrics } = useMemo(() => heuristicModel.analyze(setup), [setup])
  const stroke = (setup.bow.drawLength - setup.bow.braceHeight) / 1000
  // Constant acceleration over the power stroke: time on the string is 2 s / v.
  const onString = (2 * stroke) / (metrics.launchSpeed / 1000)
  const cycles = onString * metrics.oscillationFrequency
  const swing = -Math.cos(2 * Math.PI * cycles)
  const away = swing > 0.3

  const width = 300
  const span = onString * 1.6
  const path = Array.from({ length: 80 }, (_, index) => {
    const t = (span * index) / 79
    const y = 40 + 26 * Math.cos(2 * Math.PI * metrics.oscillationFrequency * t) * Math.exp(-14 * t)
    return `${index === 0 ? 'M' : 'L'}${((t / span) * width).toFixed(1)} ${y.toFixed(1)}`
  }).join('')
  const leaveX = (onString / span) * width

  return (
    <div className="grid gap-3">
      <svg
        viewBox={`0 0 ${width} 80`}
        role="img"
        aria-label="Dao động của đuôi tên theo thời gian"
        className="w-full max-w-lg"
      >
        <line x1="0" y1="40" x2={width} y2="40" className="stroke-line" />
        <path d={path} fill="none" className="stroke-ink" strokeWidth="2" />
        <line x1={leaveX} y1="4" x2={leaveX} y2="76" className="stroke-accent" strokeWidth="2" />
        <text x={leaveX + 5} y="13" className="fill-ink" fontSize="10">
          rời dây
        </text>
        <text x="2" y="76" className="fill-ink-muted" fontSize="9">
          phía cung
        </text>
        <text x="2" y="11" className="fill-ink-muted" fontSize="9">
          phía ngoài
        </text>
      </svg>
      <dl className="grid max-w-md gap-1">
        <Fact label="Thời gian trên dây">{(onString * 1000).toFixed(1)} ms</Fact>
        <Fact label="Số chu kỳ dao động lúc rời dây">{cycles.toFixed(2)}</Fact>
        <Fact label="Đuôi tên lúc đó">{away ? 'Đang lệch xa cung' : 'Đang ở gần cung'}</Fact>
      </dl>
      <p className="text-ink-muted max-w-prose text-sm">
        Đuôi tên qua cung an toàn nhất khi nó đang lệch ra xa. Công thức thời gian ở đây giả định
        gia tốc đều, nên chỉ để minh hoạ ý tưởng.
      </p>
    </div>
  )
}

const SPINE_CHART = [
  { draw: '30–34 lb', spine: '800–900' },
  { draw: '35–39 lb', spine: '700–780' },
  { draw: '40–44 lb', spine: '620–680' },
]

export function V02Demo() {
  return (
    <>
      <DemoCard
        title="Chỉ số phụ"
        kind="model"
        intro="Các con số người bắn hay hỏi, tính từ setup đang mở. Phần này đã có trong bảng kết quả của trang Simulator: cảnh báo tên quá nhẹ hiện ở cả hai chế độ, các con số hiện ở chế độ Nâng cao."
      >
        <DerivedDemo />
      </DemoCard>
      <DemoCard
        title="Bài test ảo: xé giấy"
        kind="simple"
        intro="Bắn qua tờ giấy ở cự ly gần và đọc hướng vết rách. Ở đây hướng rách suy thẳng từ kết quả mô hình, chưa mô phỏng tờ giấy."
      >
        <PaperTearDemo />
      </DemoCard>
      <DemoCard
        title="Bài test ảo: walk-back"
        kind="simple"
        intro="Xem tên lệch ngang dần theo cự ly như thế nào."
      >
        <WalkBackDemo />
      </DemoCard>
      <DemoCard
        title="Chạm cung theo nhịp dao động"
        kind="simple"
        intro="Mũi tên dao động khi còn trên dây. Khả năng chạm cung phụ thuộc vào việc đuôi tên đang ở đâu trong nhịp đó lúc rời dây."
      >
        <ClearanceDemo />
      </DemoCard>
      <DemoCard
        title="Đối chiếu bảng spine của nhà sản xuất"
        kind="fake"
        intro="Vùng trung tính của mô hình phải nằm gần khuyến nghị của bảng spine. Các số trong bảng này là ví dụ, chưa lấy từ tài liệu thật."
      >
        <table className="w-full max-w-md text-left">
          <thead className="text-ink-muted text-sm">
            <tr>
              <th className="py-1 font-normal">Lực kéo, tên 27 in</th>
              <th className="py-1 text-right font-normal">Bảng khuyến nghị</th>
            </tr>
          </thead>
          <tbody>
            {SPINE_CHART.map((row) => (
              <tr key={row.draw} className="border-line border-t">
                <td className="py-1">{row.draw}</td>
                <td className="py-1 text-right font-semibold">{row.spine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DemoCard>
    </>
  )
}
