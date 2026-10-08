// How the simulator gets from a setup to a suggestion, one step after the other.
// Vietnamese only, like the roadmap. The formulas behind each step are in
// readme/physics-and-calculations.md; when the engine changes, change this too.

/** What a step stands on: how far its answer can be trusted. */
type Basis = 'input' | 'physics' | 'estimate' | 'drawing' | 'real'

const BASIS: Record<Basis, { label: string; about: string; className: string }> = {
  input: {
    label: 'Bạn nhập',
    about: 'Số của bạn, tool không tính gì.',
    className: 'border-ink text-ink',
  },
  physics: {
    label: 'Vật lý',
    about: 'Công thức cơ học, suy ra được từ định nghĩa.',
    className: 'border-stiff text-stiff',
  },
  estimate: {
    label: 'Ước chừng',
    about: 'Hệ số chọn cho đúng chiều, chưa kiểm bằng bắn thật.',
    className: 'border-gold text-ink',
  },
  drawing: {
    label: 'Minh họa',
    about: 'Vẽ cho dễ thấy, không phải vị trí trúng bia.',
    className: 'border-ink-muted text-ink-muted',
  },
  real: {
    label: 'Dữ liệu thật',
    about: 'Từ mũi tên thật của bạn trên bia.',
    className: 'border-weak text-weak',
  },
}

type Step = {
  title: string
  basis: Basis
  /** What goes in. */
  takes: string
  /** What the tool does with it. */
  does: string[]
  /** What comes out, and what the archer sees of it. */
  gives: string
  /** Where on the screen, with the level it needs when that is above Basic. */
  where?: { label: string; href: string; level?: string }
}

type Phase = { title: string; about: string; steps: Step[] }

const PHASES: Phase[] = [
  {
    title: 'Bạn đưa vào',
    about: 'Mọi thứ bắt đầu từ một bộ setup: cây cung và mũi tên của bạn, viết thành số.',
    steps: [
      {
        title: 'Nhập setup',
        basis: 'input',
        takes:
          'Thông số của cung và tên: 15 thông số ở mức Cơ bản, 27 ở Nâng cao, 33 ở Chuyên nghiệp.',
        does: [
          'Thông số nào mức hiện tại không hiện thì lấy giá trị mặc định của bộ setup tham chiếu. Mô hình lúc nào cũng nhận đủ 33 thông số.',
          'Mọi giá trị đổi về đơn vị nội bộ: mm, gam, newton. Đổi lb sang kg trên màn hình không làm setup đổi.',
          'Setup được ghi nhớ ngay trong trình duyệt, tải lại trang không mất.',
        ],
        gives:
          'Một bộ setup đầy đủ. Dòng "Đang giả định … thông số khác" cho biết bao nhiêu số là tool đoán thay bạn.',
        where: { label: 'Setup', href: '#setup' },
      },
    ],
  },
  {
    title: 'Mô hình tính',
    about:
      'Mỗi lần bạn đổi một giá trị, cả chuỗi dưới đây chạy lại ngay, không cần bấm nút. Tất cả là phép tính thuần, không có giao diện, nên chạy được hàng nghìn lần cho bảng toàn cảnh.',
    steps: [
      {
        title: 'Mũi tên: nặng bao nhiêu, cứng bao nhiêu',
        basis: 'physics',
        takes: 'Chiều dài tên, spine, khối lượng thân tên, point, insert, nock, cánh.',
        does: [
          'Cộng khối lượng: thân tên (gpi nhân chiều dài) cộng point, insert, nock và cánh.',
          'Đổi số spine ra độ cứng uốn thật. Số spine là độ võng khi gác thân tên lên hai gối cách nhau 28 in và treo 1,94 lb ở giữa, nên từ nó tính ngược ra được độ cứng.',
          'Từ độ cứng, khối lượng và chiều dài, tính thân tên rung bao nhiêu lần mỗi giây.',
        ],
        gives:
          'Khối lượng tên, độ cứng uốn, tần số rung. Tần số này quyết định mũi tên uốn nhanh hay chậm trong hoạt hình.',
        where: { label: 'Setup, nhóm Tên', href: '#setup' },
      },
      {
        title: 'Cung: tích bao nhiêu năng lượng, đẩy tên nhanh cỡ nào',
        basis: 'physics',
        takes: 'Lực kéo, chiều dài kéo, brace height, cỡ cung, khối lượng dây, khối lượng tên.',
        does: [
          'Power stroke bằng chiều dài kéo trừ brace height: quãng dây đẩy mũi tên.',
          'Năng lượng tích bằng nửa lực kéo nhân power stroke, nhân thêm một hệ số vì đường lực kéo của recurve phồng lên ở giữa (1,14 với cung chuẩn).',
          'Vận tốc rời cung suy từ cân bằng năng lượng. Một phần năng lượng đi vào limb và dây đang chuyển động theo, nên bị trừ ra.',
        ],
        gives: 'Năng lượng tích và vận tốc rời cung. Hai hằng số trong bước này vẫn là ước chừng.',
        where: { label: 'Tên bay, tab Số liệu', href: '#fly', level: 'Nâng cao' },
      },
      {
        title: 'Yếu hay cứng',
        basis: 'estimate',
        takes: 'Kết quả hai bước trên, cộng độ cứng plunger.',
        does: [
          'Tính spine mà bộ cung này cần. Lực kéo lớn hơn, kéo dài hơn, tên dài hơn, point nặng hơn thì cần thân cứng hơn. Chiều dài tên ảnh hưởng mạnh nhất.',
          'So spine cần với spine thật của bạn, rồi cộng thêm tác dụng của plunger: plunger cứng hơn đẩy kết quả về phía cứng.',
          'Ép kết quả vào thang từ −1 (rất yếu) tới +1 (rất cứng). Số 0 là tên hợp với cung.',
        ],
        gives:
          'Một con số duy nhất cho weak / stiff. Đây là phần ước chừng quan trọng nhất của mô hình: các hệ số được chọn sao cho setup tham chiếu ra "hợp" và mọi thay đổi đi đúng chiều sách tune mô tả.',
      },
      {
        title: 'Bốn chỉ số còn lại',
        basis: 'estimate',
        takes:
          'Con số weak / stiff, cộng center shot, plunger, nocking point, tiller, lệch cánh, dây.',
        does: [
          'Dao động: tên lắc nhiều hay ít trước khi ổn định.',
          'Lệch ngang: từ center shot, plunger và hai đầu cánh có thẳng hàng không.',
          'Lệch dọc: từ nocking point và tiller.',
          'Nguy cơ chạm cung: thân tên đã uốn được bao nhiêu chu kỳ lúc đuôi tên đi ngang riser. Đúng nhịp thì đuôi tên né được, lệch nhịp thì dễ chạm.',
        ],
        gives:
          'Bốn con số, mỗi số trên một thang chuẩn hóa. Tay trái thì lật dấu chiều ngang, không đổi gì khác.',
      },
      {
        title: 'Xếp loại và viết thành câu',
        basis: 'estimate',
        takes: 'Năm con số ở trên.',
        does: [
          'Mỗi số được so với ngưỡng. Ví dụ weak / stiff: dưới −0,2 là yếu, trên +0,2 là cứng, ở giữa là hợp.',
          'Các xếp loại được viết thành một hai câu tiếng thường.',
          'Kèm cảnh báo an toàn khi tên quá nhẹ so với lực kéo. Cảnh báo này hiện ở mọi mức.',
        ],
        gives: 'Câu kết luận ("Tên đọc hơi yếu…") và năm thước đo. Kim nằm trong vùng vàng là cân.',
        where: { label: 'Tên bay, Kết quả mô hình', href: '#fly' },
      },
    ],
  },
  {
    title: 'Bạn xem và chỉnh',
    about: 'Từ các con số, tool vẽ ra thứ người bắn quen nhìn, rồi đề xuất nên vặn gì.',
    steps: [
      {
        title: 'Bay thử: tên có cánh và bareshaft',
        basis: 'drawing',
        takes: 'Vận tốc rời cung, năm con số, cự ly bạn chọn.',
        does: [
          'Bay mũi tên tới bia theo cung đạn đạo có lực cản không khí, từng bước 1 mili giây. Phần này là vật lý.',
          'Bay thêm một bareshaft cùng khối lượng. Cánh che bớt sai số lúc rời cung; bareshaft thì để lộ ra.',
          'Vẽ thân tên uốn, lắc và trôi theo thời gian, phóng đại cho dễ thấy. Phần này là minh họa.',
          'Đọc chỗ bareshaft cắm so với cụm tên có cánh, và vết rách trên giấy ở cự ly gần.',
        ],
        gives:
          'Hoạt hình nhìn từ trên và từ bên, bài thử bareshaft, bài thử xé giấy. Chỗ tên cắm trên hình là xu hướng, không phải điểm chạm thật.',
        where: { label: 'Tên bay', href: '#fly' },
      },
      {
        title: 'Gợi ý chỉnh gì tiếp',
        basis: 'estimate',
        takes: 'Setup hiện tại và chính mô hình ở trên.',
        does: [
          'Gộp năm con số thành một điểm sai lệch: càng gần 0 càng cân.',
          'Với từng thông số chỉnh được, thử 24 giá trị quanh giá trị hiện tại và giữ lại giá trị cho sai lệch nhỏ nhất.',
          'Xếp các gợi ý theo thứ tự sách tune vẫn làm: lắp đặt, lên xuống, plunger, point, lực kéo, brace height, cuối cùng mới tới đổi thân tên.',
          'Nối các gợi ý thành cả một buổi tune, tối đa 7 bước, mỗi thông số chỉ đổi một lần.',
        ],
        gives:
          '"Việc nên làm tiếp" với nút Thử, danh sách gợi ý còn lại, và kế hoạch cả buổi. Gợi ý chỉ nhắc tới thông số mà mức hiện tại có hiện.',
        where: { label: 'Tên bay', href: '#fly' },
      },
    ],
  },
  {
    title: 'Đối chiếu với bắn thật',
    about:
      'Mô hình không thấy được cách bạn thả dây hay tư thế của bạn. Mũi tên trên bia thì thấy. Hai bước này đưa thực tế quay ngược vào tool.',
    steps: [
      {
        title: 'Đọc bia thật',
        basis: 'real',
        takes: 'Vị trí từng mũi tên bạn chấm lên mặt bia, mũi nào có cánh, mũi nào là bareshaft.',
        does: [
          'Tính tâm cụm và độ tản của tên có cánh, rồi bareshaft lệch khỏi cụm bao xa, về hướng mấy giờ.',
          'Nếu độ lệch nhỏ so với độ tản thì báo "chưa kết luận được", không đoán bừa.',
          'Chẩn đoán đi từ độ lệch thật, dùng setup đã nhập để chọn giữa các nguyên nhân: spine, plunger, center shot, nocking point.',
          'Nói rõ khi mô hình đọc setup khác với điều bia cho thấy.',
        ],
        gives:
          'Bài đọc bia, gợi ý xếp theo thứ tự sách tune, và một quan sát được lưu kèm setup lúc bắn.',
        where: { label: 'Bia thật', href: '#target', level: 'Nâng cao' },
      },
      {
        title: 'Hiệu chỉnh mô hình theo bạn',
        basis: 'real',
        takes: 'Các quan sát bạn đã lưu, qua nhiều setup.',
        does: [
          'Dò ba số dịch chuyển: điểm mà mô hình coi là "hợp" giữa yếu và cứng, điểm cân của nocking point, điểm cân của center shot.',
          'Độ nhạy của mô hình giữ nguyên. Chỉ dời chỗ nó coi là cân, cho khớp với bạn.',
          'Chỉ tự bật khi bản đã chỉnh khớp với nhiều quan sát hơn bản gốc, và lúc nào cũng tắt được bằng một nút.',
        ],
        gives:
          'Một mô hình riêng của bạn. Khi bật, cả chuỗi tính chạy lại từ bước "Yếu hay cứng" với ba số này.',
        where: { label: 'Bia thật', href: '#target', level: 'Chuyên nghiệp' },
      },
    ],
  },
]

// Steps are numbered across the phases: it is one sequence.
const FIRST_NUMBER = PHASES.map((_, index) =>
  PHASES.slice(0, index).reduce((count, phase) => count + phase.steps.length, 1),
)
const STEP_COUNT = PHASES.reduce((count, phase) => count + phase.steps.length, 0)

function BasisTag({ basis }: { basis: Basis }) {
  return (
    <span
      className={`bg-surface rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${BASIS[basis].className}`}
    >
      {BASIS[basis].label}
    </span>
  )
}

export function HowItWorks() {
  return (
    <main className="mx-auto max-w-4xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl leading-tight font-semibold">
        Tool này hoạt động thế nào
      </h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Từ lúc bạn nhập một thông số tới lúc tool gợi ý nên chỉnh gì, có {STEP_COUNT} bước, luôn
        theo đúng thứ tự này. Mỗi bước ghi rõ nó nhận gì, làm gì, trả ra gì, và câu trả lời của nó
        đáng tin tới đâu.
      </p>

      <dl className="border-line bg-panel mt-5 grid gap-x-6 gap-y-2 rounded-xl border p-4 sm:grid-cols-2">
        {(Object.keys(BASIS) as Basis[]).map((basis) => (
          <div key={basis} className="flex items-baseline gap-2">
            <dt>
              <BasisTag basis={basis} />
            </dt>
            <dd className="text-ink-muted text-sm">{BASIS[basis].about}</dd>
          </div>
        ))}
      </dl>

      {PHASES.map((phase, phaseIndex) => (
        <section key={phase.title} className="mt-10">
          <h2 className="font-display text-2xl font-semibold">{phase.title}</h2>
          <p className="text-ink-muted mt-1 max-w-prose">{phase.about}</p>
          {/* The rail on the left joins the steps: one leads into the next. */}
          <ol className="border-line mt-4 ml-5 grid gap-5 border-l-2 pl-8">
            {phase.steps.map((step, stepIndex) => {
              const number = FIRST_NUMBER[phaseIndex]! + stepIndex
              return (
                <li key={step.title} className="relative">
                  <span
                    aria-hidden="true"
                    className="bg-ink text-surface font-display ring-paper absolute top-3 -left-[3.3rem] grid size-10 place-items-center rounded-full text-lg font-semibold ring-4"
                  >
                    {number}
                  </span>
                  <article className="border-line bg-panel rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <h3 className="font-display text-xl font-semibold">
                        <span className="sr-only">Bước {number}: </span>
                        {step.title}
                      </h3>
                      <BasisTag basis={step.basis} />
                    </div>
                    <dl className="mt-3 grid gap-3">
                      <div>
                        <dt className="text-ink-muted text-sm font-medium">Nhận vào</dt>
                        <dd>{step.takes}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted text-sm font-medium">Tool làm gì</dt>
                        <dd>
                          <ul className="grid list-disc gap-1 pl-5">
                            {step.does.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted text-sm font-medium">Trả ra</dt>
                        <dd>{step.gives}</dd>
                      </div>
                    </dl>
                    {step.where && (
                      <p className="border-line mt-3 flex flex-wrap items-center gap-x-3 border-t pt-2">
                        <span className="text-ink-muted text-sm">Xem ở</span>
                        <a
                          href={step.where.href}
                          className="text-accent focus-visible:outline-accent flex min-h-11 items-center rounded-md font-medium underline underline-offset-4 focus-visible:outline-2"
                        >
                          {step.where.label}
                        </a>
                        {step.where.level && (
                          <span className="text-ink-muted text-sm">từ mức {step.where.level}</span>
                        )}
                      </p>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>
        </section>
      ))}

      <section className="border-gold bg-gold/10 mt-10 rounded-md border-l-4 px-4 py-3">
        <h2 className="font-semibold">Điều cần nhớ</h2>
        <p className="mt-1 max-w-prose">
          Chưa hệ số nào của mô hình được kiểm bằng dữ liệu bắn thật. Tool cho bạn xu hướng: đổi cái
          này thì tên yếu đi hay cứng lên, lệch về đâu. Nó không cho số đo. Trước khi đổi thiết bị,
          hãy thử trên chính cây cung của bạn.
        </p>
      </section>
    </main>
  )
}
