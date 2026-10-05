export type DemoTab = {
  /** Matches the phase id on the roadmap page. */
  id: string
  version: string
  title: string
  summary: string
}

export const DEMO_TABS: DemoTab[] = [
  {
    id: 'v0-1',
    version: 'V0.1',
    title: 'Lưu, so sánh, ngôn ngữ',
    summary: 'Hai phần còn lại của bản đầu tiên: lưu và so sánh setup, đổi ngôn ngữ và đơn vị.',
  },
  {
    id: 'v0-2',
    version: 'V0.2',
    title: 'Mô hình đáng tin hơn',
    summary: 'Chỉ số phụ và các bài test ảo, báo kết quả theo cách người bắn quen dùng.',
  },
  {
    id: 'v0-3',
    version: 'V0.3',
    title: 'Toàn cảnh và chia sẻ',
    summary:
      'Nhìn nhiều setup một lúc, biết thông số nào quan trọng nhất, và gửi setup cho người khác.',
  },
  {
    id: 'v0-4',
    version: 'V0.4',
    title: 'Học từ thực tế',
    summary: 'Bắt đầu từ mũi tên trên bia thật, không chỉ từ điều mô hình tự đoán.',
  },
  {
    id: 'v0-5',
    version: 'V0.5',
    title: 'Nâng cao và kế hoạch tune',
    summary: 'Chi tiết hơn cho người tune sâu, và gợi ý cả một chuỗi bước.',
  },
  {
    id: 'v0-6',
    version: 'V0.6',
    title: 'Tài khoản và lưu trữ',
    summary: 'Setup và lịch sử của bạn nằm trên máy chủ, mở ở đâu cũng thấy.',
  },
  {
    id: 'v1-0',
    version: 'V1.0',
    title: 'Bản chính thức',
    summary: 'Tài liệu rõ ràng và kênh góp ý cho cộng đồng.',
  },
]

const DEMO_PREFIX = '#demo'

export function isDemoHash(hash: string): boolean {
  return hash.startsWith(DEMO_PREFIX)
}

/** The tab a hash such as `#demo-v0-3` points at. Anything else opens the first tab. */
export function demoTab(hash: string): DemoTab {
  const id = hash.slice(DEMO_PREFIX.length + 1)
  return DEMO_TABS.find((tab) => tab.id === id) ?? DEMO_TABS[0]!
}
