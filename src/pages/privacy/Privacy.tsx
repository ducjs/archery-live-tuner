// What the site keeps and where. It describes the site as it is now: no
// accounts, no server of its own. It has to be rewritten when V0.6 adds them.
// Vietnamese only, like the roadmap.

/** The date this text was last checked against the code. */
const CHECKED = '8 tháng 10, 2026'

const STORED: [what: string, where: string][] = [
  ['Setup đang mở, mức, ngôn ngữ, đơn vị, màn hình đang xem', 'tuner.ui'],
  ['Các setup đã lưu', 'tuner.setups'],
  ['Quan sát từ bắn thật', 'tuner.observations'],
  ['Mặt bia đang chấm dở', 'tuner.plot'],
  ['Vạch thước ngắm', 'tuner.sight'],
  ['Mô hình đã hiệu chỉnh theo bạn', 'tuner.calibration'],
]

export function Privacy() {
  return (
    <main lang="vi" className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl leading-tight font-semibold">Quyền riêng tư</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Nói ngắn: mọi thứ bạn nhập nằm lại trong trình duyệt của bạn. Trang này không có tài khoản,
        không có máy chủ riêng, và không gửi dữ liệu của bạn đi đâu.
      </p>
      <p className="text-ink-muted mt-1 text-sm">Đối chiếu với code lần cuối: {CHECKED}.</p>

      <section className="border-line bg-panel mt-6 rounded-xl border p-4">
        <h2 className="font-display text-2xl font-semibold">Cái gì được lưu, ở đâu</h2>
        <p className="mt-2 max-w-prose">
          Tất cả nằm trong bộ nhớ của trình duyệt (localStorage) trên chính máy này. Không có gì
          được đồng bộ sang máy khác.
        </p>
        <table className="mt-3 w-full max-w-prose text-left">
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="py-1 pr-4 font-medium">
                Dữ liệu
              </th>
              <th scope="col" className="py-1 font-medium">
                Tên khóa
              </th>
            </tr>
          </thead>
          <tbody>
            {STORED.map(([what, where]) => (
              <tr key={where} className="border-line border-b last:border-b-0">
                <td className="py-1.5 pr-4">{what}</td>
                <td className="text-ink-muted py-1.5 whitespace-nowrap">{where}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 max-w-prose">
          Để chạy được khi không có mạng, trình duyệt còn giữ một bản sao các file của trang. Bản
          sao đó chỉ chứa trang, không chứa dữ liệu của bạn.
        </p>
      </section>

      <section className="border-line bg-panel mt-6 rounded-xl border p-4">
        <h2 className="font-display text-2xl font-semibold">Cái gì không có</h2>
        <ul className="mt-2 grid max-w-prose list-disc gap-1.5 pl-5">
          <li>Không tài khoản, không đăng nhập.</li>
          <li>Không cookie.</li>
          <li>Không công cụ đo lường hay quảng cáo. Trang không biết bạn là ai và bạn làm gì.</li>
          <li>
            Không tải gì từ bên thứ ba: font chữ và mọi file khác đều nằm trên chính trang này.
          </li>
        </ul>
      </section>

      <section className="border-line bg-panel mt-6 rounded-xl border p-4">
        <h2 className="font-display text-2xl font-semibold">Khi nào dữ liệu rời máy bạn</h2>
        <p className="mt-2 max-w-prose">Chỉ khi chính bạn làm một trong hai việc sau:</p>
        <ul className="mt-2 grid max-w-prose list-disc gap-1.5 pl-5">
          <li>
            Gửi một đường link setup. Link chứa toàn bộ thông số của setup ngay trong địa chỉ. Ai có
            link đều đọc được, và máy chủ đặt trang nhìn thấy địa chỉ đó khi link được mở.
          </li>
          <li>Xuất file setup hoặc file quan sát rồi gửi cho người khác.</li>
        </ul>
        <p className="mt-3 max-w-prose">
          Như mọi trang web, nơi đặt trang (hiện là GitHub Pages) nhận địa chỉ IP của bạn khi trình
          duyệt tải trang. Việc đó nằm ngoài trang này và theo chính sách của nơi đặt trang.
        </p>
      </section>

      <section className="border-line bg-panel mt-6 rounded-xl border p-4">
        <h2 className="font-display text-2xl font-semibold">Xóa dữ liệu của bạn</h2>
        <ul className="mt-2 grid max-w-prose list-disc gap-1.5 pl-5">
          <li>Từng setup: mở "Các setup" rồi bấm Xóa.</li>
          <li>
            Tất cả: xóa dữ liệu của trang này trong cài đặt trình duyệt. Sau đó không lấy lại được,
            trừ khi bạn đã xuất file.
          </li>
        </ul>
      </section>

      <section className="border-gold bg-gold/10 mt-6 rounded-md border-l-4 px-4 py-3">
        <h2 className="font-semibold">Sẽ thay đổi khi có tài khoản</h2>
        <p className="mt-1 max-w-prose">
          Lộ trình có kế hoạch thêm tài khoản và lưu setup trên máy chủ. Khi đó trang này sẽ được
          viết lại trước khi tính năng ra mắt, và không đăng nhập thì mọi thứ vẫn như mô tả ở trên.
        </p>
      </section>
    </main>
  )
}
