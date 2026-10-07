import { useState } from 'react'
import { DemoCard } from './demoParts.tsx'
import { buttonClass } from './demoText.ts'

/** For a preview that has since been built: says where the real thing is. */
function NowLive() {
  return (
    <p className="max-w-prose">
      Phần này đã làm xong và nằm trong trang Simulator: chọn "Bia" ở mục Hiển thị.{' '}
      <a
        href="#target"
        className="text-accent focus-visible:outline-accent rounded-sm font-medium underline underline-offset-4 focus-visible:outline-2"
      >
        Mở phần đọc bia
      </a>
    </p>
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
        kind="model"
        intro="Chấm vị trí tên có cánh và bareshaft như app ghi điểm. Ứng dụng đọc độ lệch thật trên bia, đối chiếu với setup đang mở, rồi gợi ý nên chỉnh gì trước."
      >
        <NowLive />
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
