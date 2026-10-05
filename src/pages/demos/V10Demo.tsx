import { useState } from 'react'
import { DemoCard } from './demoParts.tsx'
import { buttonClass, inputClass } from './demoText.ts'

const EXPLAINED = [
  {
    question: 'Mô hình làm được gì?',
    answer:
      'Cho biết xu hướng: tên yếu hay cứng, lệch bên nào, dao động nhiều hay ít, và đổi một thông số thì xu hướng đó dịch về đâu.',
  },
  {
    question: 'Mô hình không làm được gì?',
    answer:
      'Không đoán được điểm chạm chính xác tính bằng cm, không thấy cách thả dây hay tư thế của bạn, và chưa được kiểm chứng với số liệu bắn thật.',
  },
  {
    question: 'Vì sao hình vẽ không theo tỉ lệ?',
    answer:
      'Độ uốn thật của mũi tên chỉ vài milimét và diễn ra trong vài phần trăm giây. Hình vẽ phóng đại và làm chậm để mắt nhìn thấy được.',
  },
  {
    question: 'Nên tin gợi ý tới đâu?',
    answer:
      'Coi đó là thứ đáng thử ngoài bãi, không phải kết luận. Bareshaft và cụm tên trên bia của chính bạn mới là câu trả lời cuối.',
  },
]

function FeedbackDemo() {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="grid gap-3">
        <p role="status">Đã ghi nhận góp ý. Trong bản demo, nội dung không được gửi đi đâu cả.</p>
        <button
          type="button"
          className={`${buttonClass} justify-self-start`}
          onClick={() => {
            setSent(false)
            setText('')
          }}
        >
          Viết góp ý khác
        </button>
      </div>
    )
  }

  return (
    <form
      className="grid max-w-xl gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(true)
      }}
    >
      <label className="grid gap-1">
        <span className="font-medium">Kết quả mô phỏng khác thực tế của bạn ở đâu?</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          className={`${inputClass} py-2`}
        />
      </label>
      <button
        type="submit"
        disabled={text.trim() === ''}
        className={`${buttonClass} justify-self-start`}
      >
        Gửi góp ý
      </button>
    </form>
  )
}

export function V10Demo() {
  return (
    <>
      <DemoCard
        title="Trang giải thích mô hình"
        kind="fake"
        intro="Viết rõ mô hình làm được gì và không làm được gì, ở nơi người dùng sẽ đọc. Nội dung dưới đây là bản nháp."
      >
        <div className="grid max-w-prose gap-2">
          {EXPLAINED.map((entry) => (
            <details key={entry.question} className="border-line group rounded-lg border">
              <summary className="focus-visible:outline-accent flex min-h-11 cursor-pointer list-none items-center rounded-lg px-4 py-2 font-semibold focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
                {entry.question}
              </summary>
              <p className="px-4 pb-3">{entry.answer}</p>
            </details>
          ))}
        </div>
      </DemoCard>
      <DemoCard
        title="Kênh góp ý"
        kind="fake"
        intro="Người dùng báo chỗ mô hình sai so với thực tế, để các bản sau sửa đúng chỗ."
      >
        <FeedbackDemo />
      </DemoCard>
    </>
  )
}
