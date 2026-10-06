import { useMemo, useState } from 'react'
import { useTuningStore } from '../../state/tuningStore.ts'
import { setupLink } from '../../utils/setupTransfer.ts'
import { DemoCard } from './demoParts.tsx'
import { buttonClass } from './demoText.ts'

/** For a preview that has since been built: says where the real thing is. */
function NowLive() {
  return (
    <p className="max-w-prose">
      Phần này đã làm xong và nằm trong trang Simulator: chọn "Toàn cảnh" ở mục Hiển thị.{' '}
      <a
        href="#"
        className="text-accent focus-visible:outline-accent rounded-sm font-medium underline underline-offset-4 focus-visible:outline-2"
      >
        Mở trang Simulator
      </a>
    </p>
  )
}

function ShareDemo() {
  const setup = useTuningStore((state) => state.setup)
  const [status, setStatus] = useState('')
  const link = useMemo(() => setupLink(setup, window.location), [setup])

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
        Đường link dài {link.length} ký tự và chứa đủ mọi giá trị của setup. Mở link thì trang
        Simulator hỏi có mở setup đó không. Tính năng này nằm ở mục "Chia sẻ và sao lưu" của trang
        Simulator, cùng với xuất và nhập file.
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
        <NowLive />
      </DemoCard>
      <DemoCard
        title="Thông số nào ảnh hưởng mạnh nhất"
        kind="model"
        intro="Biết nên chỉnh cái gì trước: thứ làm kết quả đổi nhiều nhất với setup hiện tại."
      >
        <NowLive />
      </DemoCard>
      <DemoCard
        title="Chia sẻ setup bằng đường link"
        kind="model"
        intro="Gửi setup cho huấn luyện viên hoặc bạn tập mà không cần tài khoản. Đã có trong trang Simulator."
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
