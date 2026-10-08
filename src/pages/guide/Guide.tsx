// The user guide: what to do on each screen, in the order a tuning session
// goes. Vietnamese only, like the roadmap. "How it works" explains what the
// model does behind these screens.

type Section = {
  id: string
  title: string
  /** What this part is for, in a sentence. */
  about: string
  steps: string[]
  /** A screen to try it on. */
  go?: { label: string; href: string }
  note?: string
}

const SECTIONS: Section[] = [
  {
    id: 'muc',
    title: 'Chọn mức phù hợp với bạn',
    about:
      'Ba mức ở góc trên phải quyết định bạn thấy bao nhiêu: ô nhập, độ chi tiết của kết quả, và có những màn hình nào.',
    steps: [
      'Cơ bản: 15 thông số trong ba nhóm (Cung, Điều chỉnh, Tên), hai màn hình Setup và Tên bay. Đủ để tune một cây cung.',
      'Nâng cao: thêm dây, cân bằng, chi tiết thân tên; thêm màn hình Bia thật và Phân tích; kết quả có xé giấy và số liệu.',
      'Chuyên nghiệp: thêm đường lực kéo, chi tiết cánh và point, bảng toàn cảnh, thước ngắm, hiệu chỉnh theo bạn.',
      'Đổi mức không xóa gì. Nếu có thông số ở mức cao hơn đã bị đổi, tool sẽ báo và cho bạn xem hoặc đặt lại.',
    ],
    note: 'Chưa chắc thì cứ để Cơ bản. Khi tool dẫn bạn tới một thông số ở mức cao hơn, nó tự nâng mức.',
  },
  {
    id: 'setup',
    title: 'Nhập setup',
    about: 'Cho tool biết cây cung và mũi tên của bạn. Kết quả đổi ngay khi bạn đổi một số.',
    steps: [
      'Mở một nhóm để thấy các thông số của nó. Mỗi lúc chỉ một nhóm mở; nhóm đang đóng vẫn ghi các giá trị chính.',
      'Mỗi thông số là một dòng: gõ số, hoặc bấm trừ và cộng. Chạm vào dòng nào thì dòng đó mở thanh trượt và lời chú thích.',
      'Chấm xanh cạnh tên thông số nghĩa là giá trị đang khác mặc định. Dòng đang mở có nút đặt lại.',
      'Cung 3D bên cạnh: mỗi bộ phận có một ô chú thích nối bằng đường kẻ. Bấm ô, hoặc bấm thẳng vào bộ phận, để nhảy tới thông số của nó. Bấm "Cả cây cung" hoặc bấm ra ngoài để quay lại.',
      'Kéo để xoay cung, lăn chuột hoặc chụm hai ngón để phóng to. Tắt cung 3D bằng ô "Cung 3D" nếu máy chạy chậm.',
      '"Tên bay: Từ trên / Từ bên" vẽ thêm đường bay ngay cạnh các thông số.',
    ],
    go: { label: 'Setup', href: '#setup' },
    note: 'Dòng "Đang giả định … thông số khác" liệt kê những số tool đoán thay bạn. Đồ của bạn khác thì kết quả lệch theo.',
  },
  {
    id: 'ket-qua',
    title: 'Đọc kết quả',
    about: 'Một câu nói tên đang yếu, hợp hay cứng, và bareshaft sẽ cắm về đâu so với tên có cánh.',
    steps: [
      'Câu kết luận luôn nằm trên cùng. Đọc nó trước.',
      'Thước đo: kim nằm trong vùng vàng là cân. Lệch trái hay phải cho biết lệch về phía nào.',
      'Tab Bareshaft và Xé giấy mô tả điều bạn sẽ thấy nếu làm hai bài thử đó ngoài bãi.',
      'Bấm Chạy để xem mũi tên rời cung. Thanh "Thời điểm" kéo tới bất kỳ lúc nào của đường bay.',
      '"Tùy chọn hiển thị" đổi góc nhìn, cự ly, và tốc độ phát.',
    ],
    go: { label: 'Tên bay', href: '#fly' },
    note: 'Hình vẽ phóng đại độ uốn và không theo tỉ lệ. Chỗ tên cắm trên hình là xu hướng, không phải điểm chạm thật.',
  },
  {
    id: 'goi-y',
    title: 'Làm theo gợi ý',
    about: 'Tool đề xuất một thay đổi nên thử tiếp, theo đúng thứ tự mà sách tune vẫn làm.',
    steps: [
      '"Việc nên làm tiếp" là thay đổi đứng đầu. Bấm Thử để áp giá trị đó vào setup và xem kết quả đổi.',
      'Danh sách bên dưới chia hai nhóm: chỉnh ngay trên cung (không tốn gì), và đổi thiết bị.',
      'Mỗi gợi ý là một thay đổi đơn lẻ từ setup hiện tại. Thử một cái, rồi đọc lại danh sách.',
      'Từ mức Nâng cao có "Cả buổi tune": chuỗi các thay đổi nối nhau, áp một lần được.',
    ],
    go: { label: 'Tên bay', href: '#fly' },
    note: 'Gợi ý lấy từ chính mô hình này, không phải lời khuyên đã kiểm chứng. Ra bãi bắn thử trước khi mua tên mới.',
  },
  {
    id: 'luu',
    title: 'Lưu và so sánh',
    about: 'Giữ lại một setup để quay về, hoặc để đặt cạnh bản đã chỉnh.',
    steps: [
      'Thanh trên cùng có tên setup, nút Lưu, và nút "Các setup" mở danh sách đã lưu.',
      'Trong danh sách: mở, đổi tên, xóa, hoặc so sánh một setup đã lưu.',
      'So sánh (mức Nâng cao, màn hình Phân tích) bay hai tới bốn setup cùng lúc và liệt kê chỗ khác nhau.',
      '"Sao chép link" tạo một đường link chứa toàn bộ setup để gửi cho người khác. Xuất và nhập file để sao lưu.',
    ],
    note: 'Setup lưu trong trình duyệt này, trên máy này. Đổi máy hoặc xóa dữ liệu trình duyệt là mất, nên hãy xuất file nếu cần giữ.',
  },
  {
    id: 'bia',
    title: 'Đối chiếu với bia thật',
    about: 'Mô hình không thấy cách bạn thả dây. Mũi tên trên bia thì thấy. Từ mức Nâng cao.',
    steps: [
      'Bắn tên có cánh và bareshaft vào cùng một điểm ngắm.',
      'Chọn "Có cánh" hoặc "Bareshaft", rồi bấm lên mặt bia đúng chỗ từng mũi cắm. Dùng bàn phím cũng được: phím mũi tên di con trỏ, Enter để chấm.',
      'Cần ít nhất 3 tên có cánh và 1 bareshaft thì tool mới đọc.',
      'Tool nói bareshaft lệch bao xa, về hướng nào, và nên chỉnh gì. Nếu độ lệch nhỏ so với độ tản của cụm, nó nói "chưa kết luận được".',
      'Lưu bia thành một quan sát. Ở mức Chuyên nghiệp, các quan sát được dùng để chỉnh mô hình cho khớp với bạn.',
    ],
    go: { label: 'Bia thật', href: '#target' },
  },
  {
    id: 'thuoc-ngam',
    title: 'Đoán vạch thước ngắm',
    about:
      'Nhập vạch ở vài cự ly đã bắn chuẩn, tool đoán vạch cho các cự ly còn lại. Ở mức Chuyên nghiệp.',
    steps: [
      'Nhập ít nhất hai vạch, theo đúng thang trên thước ngắm của bạn.',
      'Tool đoán vạch từ 18 tới 90 m, kèm một khoảng sai số. Càng xa các vạch đã biết, khoảng đó càng rộng.',
      'Ra bãi, bắt đầu từ vạch tool đoán rồi bắn vài mũi để chỉnh tinh.',
    ],
    go: { label: 'Bia thật', href: '#target' },
  },
  {
    id: 'khac',
    title: 'Những điều tiện khác',
    about: 'Vài thứ nhỏ nhưng dùng thường xuyên.',
    steps: [
      'Nút Cài đặt: đổi tiếng Việt và tiếng Anh, đổi lb, inch, grain sang kg, cm, gam.',
      'Sau lần mở đầu tiên, trang chạy được khi không có mạng, và cài được lên màn hình chính của điện thoại.',
      'Mọi thứ dùng được bằng bàn phím. Phím Tab đầu tiên đưa ra nút "Tới thẳng nội dung".',
    ],
  },
]

export function Guide() {
  return (
    <main lang="vi" className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl leading-tight font-semibold">Hướng dẫn sử dụng</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Làm gì trên từng màn hình, theo thứ tự của một buổi tune. Muốn biết tool tính ra kết quả
        bằng cách nào thì xem{' '}
        <a href="#how" className="text-accent font-medium underline underline-offset-4">
          Cách hoạt động
        </a>
        .
      </p>

      <nav aria-label="Trong trang này" className="border-line bg-panel mt-5 rounded-xl border p-4">
        <ul className="grid gap-x-6 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              {/* The address belongs to the page, so a section is reached by scrolling to it. */}
              <button
                type="button"
                onClick={() => {
                  const heading = document.getElementById(`guide-${section.id}`)
                  heading?.scrollIntoView({ block: 'start' })
                  heading?.focus()
                }}
                className="text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md text-left font-medium underline underline-offset-4 focus-visible:outline-2"
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`guide-${section.id}`}
          className="border-line bg-panel mt-6 rounded-xl border p-4"
        >
          <h2
            id={`guide-${section.id}`}
            tabIndex={-1}
            className="font-display scroll-mt-4 text-2xl font-semibold focus:outline-none"
          >
            {section.title}
          </h2>
          <p className="text-ink-muted mt-1 max-w-prose">{section.about}</p>
          <ul className="mt-3 grid max-w-prose list-disc gap-1.5 pl-5">
            {section.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          {section.note && (
            <p className="border-gold bg-gold/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2">
              {section.note}
            </p>
          )}
          {section.go && (
            <p className="mt-2">
              <a
                href={section.go.href}
                className="text-accent focus-visible:outline-accent inline-flex min-h-11 items-center rounded-md font-medium underline underline-offset-4 focus-visible:outline-2"
              >
                Mở {section.go.label}
              </a>
            </p>
          )}
        </section>
      ))}
    </main>
  )
}
