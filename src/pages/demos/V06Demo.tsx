import { useState } from 'react'
import { DemoCard } from './demoParts.tsx'
import { buttonClass, inputClass } from './demoText.ts'

// Everything on this tab is made up: there is no server yet.
const CLOUD_SETUPS = [
  {
    name: 'Thi đấu 70 m',
    detail: '38 lb, spine 700, point 120 gr',
    synced: 'Đã đồng bộ',
    when: 'hôm nay 09:12',
  },
  {
    name: 'Tập trong nhà 18 m',
    detail: '36 lb, spine 750, point 100 gr',
    synced: 'Đã đồng bộ',
    when: 'hôm qua',
  },
  {
    name: 'Thử tên mới',
    detail: '38 lb, spine 650, point 110 gr',
    synced: 'Chỉ có trên máy này',
    when: '3 ngày trước',
  },
]

const HISTORY = [
  { when: '05/10, 09:12', change: 'Plunger 1.0 lên 1.2', note: 'Bareshaft lệch phải 6 cm ở 18 m' },
  { when: '03/10, 17:40', change: 'Nocking point 6 mm xuống 4 mm', note: 'Bareshaft rơi thấp' },
  { when: '01/10, 08:05', change: 'Point 120 gr xuống 110 gr', note: '' },
  { when: '28/09, 16:30', change: 'Tạo setup', note: 'Tên mới cắt 27 in' },
]

function AccountDemo() {
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')

  if (!signedIn) {
    return (
      <form
        className="grid max-w-sm gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          setSignedIn(true)
        }}
      >
        <label className="grid gap-1">
          <span className="font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ban@vidu.vn"
            className={inputClass}
          />
        </label>
        <button type="submit" className={`${buttonClass} justify-self-start`}>
          Đăng nhập thử
        </button>
        <p className="text-ink-muted text-sm">
          Không có gì được gửi đi. Nút này chỉ chuyển sang màn hình sau khi đăng nhập.
        </p>
      </form>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Đang đăng nhập: <span className="font-semibold">{email || 'ban@vidu.vn'}</span>
        </p>
        <button type="button" className={buttonClass} onClick={() => setSignedIn(false)}>
          Đăng xuất
        </button>
      </div>
      <ul className="grid gap-2">
        {CLOUD_SETUPS.map((setup) => (
          <li
            key={setup.name}
            className="border-line flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border p-3"
          >
            <div>
              <p className="font-semibold">{setup.name}</p>
              <p className="text-ink-muted text-sm">{setup.detail}</p>
            </div>
            <p className="text-sm">
              {setup.synced}
              <span className="text-ink-muted">, sửa {setup.when}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function V06Demo() {
  return (
    <>
      <DemoCard
        title="Tài khoản và setup trên máy chủ"
        kind="fake"
        intro="Đăng nhập để setup đi theo bạn trên mọi thiết bị. Setup đang lưu trên máy sẽ được đưa lên ở lần đăng nhập đầu. Không đăng nhập vẫn dùng được như bây giờ."
      >
        <AccountDemo />
      </DemoCard>
      <DemoCard
        title="Lịch sử thay đổi của một setup"
        kind="fake"
        intro="Mỗi lần chỉnh được ghi lại, kèm ghi chú và quan sát ngoài bãi, để lần lại được cả một buổi tune."
      >
        <ol className="border-line grid max-w-xl gap-4 border-l-2 pl-4">
          {HISTORY.map((entry) => (
            <li key={entry.when}>
              <p className="text-ink-muted text-sm">{entry.when}</p>
              <p className="font-semibold">{entry.change}</p>
              {entry.note && <p className="text-ink-muted">{entry.note}</p>}
            </li>
          ))}
        </ol>
      </DemoCard>
    </>
  )
}
