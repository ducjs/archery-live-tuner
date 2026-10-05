// Vietnamese, plain-language version of readme/ROADMAP.md, shown on the roadmap page.
// ROADMAP.md stays the source of truth: a test checks that every group here has
// the same items, in the same order, with the same done state.

export type RoadmapItem = { text: string; done: boolean }

export type RoadmapGroup = {
  /** Left out for a phase whose items are not split into milestones. */
  title?: string
  summary?: string
  note?: string
  items: RoadmapItem[]
}

export type RoadmapPhase = {
  id: string
  version: string
  title: string
  summary: string
  /** The phase being worked on now. */
  current?: boolean
  groups: RoadmapGroup[]
  exit: string
}

/** Something only the project owner can do: a decision, a permission, a document. */
export type PinnedTask = RoadmapItem & { why: string }

// Mirrors the pinned list at the top of readme/ROADMAP.md, in the same order.
export const PINNED: PinnedTask[] = [
  {
    text: 'Cho phép push các commit đang chờ để site được deploy, rồi mở site thật trên điện thoại và rà 10 tiêu chí ở spec §33',
    why: 'Đây là việc cuối cùng của V0.1. Push lên master là site tự cập nhật.',
    done: false,
  },
  {
    text: 'Xem khối "đang giả định" trong chế độ Cơ bản trên trình duyệt, nhất là trên điện thoại',
    why: 'Khối này đã qua test nhưng chưa ai nhìn bằng mắt.',
    done: false,
  },
  {
    text: 'Quyết định điểm cân của center shot: giữ 0 mm, dời ra ngoài khoảng 2,4 mm theo sách Easton, hay đổi nghĩa thông số thành "lệch so với vị trí chuẩn"',
    why: 'Hiện đặt center shot đúng như sách thì mô hình báo bareshaft lệch trái. Chi tiết ở tuning-references.md mục 4.2.',
    done: false,
  },
  {
    text: 'Quyết định điểm cân của nocking point: giữ 4 mm hay nâng lên',
    why: 'Các nguồn ghi từ 3 tới 13 mm; 4 mm nằm ở đầu thấp. Chi tiết ở tuning-references.md mục 4.3.',
    done: false,
  },
  {
    text: 'Tìm bảng chọn spine của Easton (PDF) và đặt vào docs/',
    why: 'Cần cho bài test đối chiếu vùng cân với bảng của nhà sản xuất, là điều kiện để xong V0.2.',
    done: false,
  },
  {
    text: 'Tải bản PDF gốc sách Easton "Arrow Tuning and Maintenance Guide" (đủ 32 trang, có hình) và bản sạch sách của Murray Elliot, đặt vào docs/',
    why: 'Bản lưu từ Scribd mất hết hình và thiếu trang; thiếu hình thì không làm được phần xé giấy.',
    done: false,
  },
  {
    text: 'Thêm ducnblue@gmail.com vào GitHub, Settings, Emails nếu chưa có',
    why: 'Để các commit mới gắn với tài khoản ducjs.',
    done: false,
  },
]

const done = (text: string): RoadmapItem => ({ text, done: true })
const todo = (text: string): RoadmapItem => ({ text, done: false })

export const ROADMAP: RoadmapPhase[] = [
  {
    id: 'v0-1',
    version: 'V0.1',
    title: 'Bản mô phỏng cơ bản',
    current: true,
    summary:
      'Bản đầu tiên dùng được. Nhập thông số cung và tên, xem mũi tên bay, kéo thử một thanh trượt và thấy kết quả đổi ngay. Kết quả mới chỉ là xu hướng (yếu/cứng, lệch trái/phải), chưa phải con số chính xác.',
    groups: [
      {
        title: 'M1. Dựng khung dự án',
        summary:
          'Dựng khung dự án và bộ công cụ. Chưa có gì để xem, nhưng từ đây mọi dòng code đều được tự động kiểm tra lỗi và chạy test.',
        items: [
          done('Khung ứng dụng: Vite, React, TypeScript chế độ chặt'),
          done('Tailwind CSS cho giao diện'),
          done('Dùng ô nhập gốc của trình duyệt, tự tạo kiểu; chưa cần thư viện component'),
          done('Bộ test: Vitest và fast-check'),
          done('Kiểm tra code tự động; phần tính toán bị chặn không cho phụ thuộc giao diện'),
          done('Cấu trúc thư mục theo spec'),
        ],
      },
      {
        title: 'M2. Dữ liệu và tiện ích',
        summary:
          'Định nghĩa "một bộ setup" gồm những thông số nào, mỗi thông số có đơn vị gì, giới hạn bao nhiêu, mặc định là gì, thuộc nhóm cơ bản hay nâng cao. Kèm bộ đổi đơn vị (lb, inch, grain) và kiểm tra dữ liệu nhập sai.',
        items: [
          done('Kiểu dữ liệu cho cung, tên, setup và kết quả mô phỏng'),
          done('Bảng thông số: tên, đơn vị, giới hạn, mặc định, nhóm cơ bản hay nâng cao'),
          done('Bộ đổi đơn vị'),
          done('Kiểm tra dữ liệu nhập, sinh từ chính bảng thông số'),
          done('Setup tham chiếu làm giá trị mặc định'),
        ],
      },
      {
        title: 'M3. Bộ não phiên bản đầu',
        summary:
          'Bộ não của ứng dụng. Nhận một setup, trả lời: tên đang yếu hay cứng, dao động nhiều hay ít, lệch trái hay phải, có dễ chạm cung không, và đường bay trông thế nào. Đúng sai kiểm bằng test (ví dụ: tăng point weight thì tên phải yếu đi).',
        items: [
          done(
            'Giao kèo chung cho mô hình, để sau này thay mô hình tốt hơn mà không sửa giao diện',
          ),
          done('Mô hình ước lượng, mọi hệ số ghi rõ là ước chừng'),
          done('Tay trái thì kết quả lật gương so với tay phải'),
          done('Xếp loại: độ cứng, dao động, lệch ngang, khả năng chạm cung'),
          done('Sinh đường bay của mũi tên'),
          done('Test tính nhất quán, chạy trên hàng trăm setup ngẫu nhiên'),
        ],
      },
      {
        title: 'Bản xem thử đầu tiên',
        summary:
          'Chỉ một thanh trượt point weight, nhưng đi trọn đường: kéo thanh trượt, bộ não tính lại, mũi tên bay khác đi và bảng kết quả đổi theo. Mục đích là chứng minh cả chuỗi chạy được trước khi làm đủ các bảng nhập.',
        items: [
          done('Thanh trượt point weight, có ô nhập số và nút đặt lại'),
          done('Hoạt hình nhìn từ trên: cung, tên uốn, lệch dần, bia'),
          done('Bảng kết quả với bốn xếp loại'),
          done('Nút chạy, dừng, chạy lại; tôn trọng cài đặt giảm chuyển động'),
          done('Bảng màu sáng và tối, phông chữ tự lưu trong ứng dụng'),
        ],
      },
      {
        title: 'M4. Màn hình nhập liệu',
        summary:
          'Hai bảng Cung và Tên, mỗi thông số có ô nhập số và thanh trượt. Có nút chuyển Simple/Advanced để người mới chỉ thấy những thông số cơ bản.',
        items: [
          done('Bảng Cung và bảng Tên, sinh tự động từ bảng thông số'),
          done(
            'Mỗi thông số: ô số, thanh trượt, đơn vị, nút đặt lại, min/max và chú thích quy ước',
          ),
          done('Nút Simple/Advanced, được ghi nhớ, có cảnh báo khi giá trị nâng cao đang bị ẩn'),
          done(
            'Chế độ Simple nói rõ đang giả định những thông số nào: bao nhiêu cái, những cái ảnh hưởng mạnh nhất, danh sách đầy đủ khi cần, và lối vào để tự nhập',
          ),
          done('Kho trạng thái chung của ứng dụng'),
          done('Ước lượng tổng khối lượng mũi tên'),
          done('Test giao diện cho các bảng nhập'),
        ],
      },
      {
        title: 'M5. Hình ảnh mô phỏng',
        summary:
          'Phần nhìn thấy được. Hoạt hình mũi tên rời cung, uốn, dao động rồi ổn định; kèm bảng kết quả. Kéo thanh trượt là hoạt hình và kết quả đổi theo, không cần bấm nút tính.',
        items: [
          done('Nhìn từ trên: cung, tên uốn, dao động, ổn định dần'),
          done('Nhìn ngang: tên chúi hay ngóc. Chọn nhìn trên, nhìn ngang hoặc cả hai'),
          done(
            'Chạy, dừng, chạy lại; chỉnh mức phóng đại độ uốn. Hình đứng yên ở tư thế kéo hết dây tới khi bấm chạy',
          ),
          done(
            'Kéo dây rồi thả: dây kéo lùi, đẩy tên suốt power stroke, tên rời dây ở trạng thái thẳng. Nhìn ngang thì cung nghiêng theo hướng bắn, thanh cân bằng vuông góc với dây, tên chúc theo nocking point',
          ),
          done('Tốc độ phát: 1/48, 1/24, 1/12, 1/6 và tốc độ thật'),
          done('Thanh thời điểm: nhảy tới bất kỳ lúc nào của đường bay'),
          done('Chọn cự ly bia: 18, 30, 50, 70 hoặc 90 m, kèm thời gian bay'),
          done('Trang rộng hết màn hình; màn rất rộng chia ba cột'),
          done('Ghi rõ hình vẽ không theo tỉ lệ'),
          done('Bảng kết quả, thêm xu hướng dọc (nock thấp / nock cao)'),
          done('Kết quả cập nhật ngay khi đang kéo thanh trượt'),
          done('Bareshaft bay cùng tên có cánh, kèm lời đọc kết quả'),
        ],
      },
      {
        title: 'M6. Lưu và so sánh setup',
        summary:
          'Lưu lại setup đang có, đổi vài thông số, rồi đặt hai bản cạnh nhau để so trước và sau. Dữ liệu lưu ngay trên trình duyệt, chưa cần tài khoản.',
        items: [
          done(
            'Lớp lưu trữ, bản đầu lưu trên trình duyệt; sau này đổi sang máy chủ không phải sửa giao diện',
          ),
          done(
            'Lưu, mở, đổi tên, xoá setup; lưu thành bản mới; setup đang mở được giữ lại khi tải lại trang',
          ),
          done(
            'So sánh hai setup: bản đã lưu và bản đang mở bay cạnh nhau, kèm bảng những chỗ khác nhau',
          ),
        ],
      },
      {
        title: 'M7. Phát hành',
        summary:
          'Hoàn thiện để đưa cho người khác dùng: chạy tốt trên điện thoại, có tiếng Việt và tiếng Anh, đổi được đơn vị, có lời nhắc đây chỉ là mô hình gần đúng, và có đường link công khai.',
        items: [
          done('Bố cục cho điện thoại'),
          done('Hai ngôn ngữ: tiếng Việt và tiếng Anh, đổi ngay trên thanh trên cùng'),
          done('Đổi đơn vị hiển thị: lb, inch, grain hoặc kg, cm, gram'),
          done('Lời nhắc về giới hạn của mô hình, ở cuối trang mô phỏng'),
          todo(
            'Đưa lên mạng với đường link công khai. Đã sẵn sàng cho GitHub Pages, còn thiếu repo trên GitHub và lần push đầu',
          ),
        ],
      },
    ],
    exit: 'Người dùng làm được trọn mười bước trong tiêu chí thành công của spec, và bộ não chạy được trong test mà không cần giao diện.',
  },
  {
    id: 'v0-2',
    version: 'V0.2',
    title: 'Mô hình đáng tin hơn',
    summary:
      'Làm cho bộ não đáng tin hơn. Thay các hệ số ước chừng bằng công thức vật lý đơn giản (độ cứng thật của thân tên, tần số dao động), và báo kết quả theo cách người bắn quen dùng: bareshaft lệch đâu, xé giấy hướng nào. Giao diện gần như không đổi.',
    groups: [
      {
        items: [
          todo('Tách hệ số ra file riêng có số phiên bản'),
          done('Tính độ cứng thật của thân tên từ chỉ số spine'),
          done('Tính tần số dao động của mũi tên từ độ cứng, khối lượng và chiều dài'),
          todo('Tính khả năng chạm cung theo nhịp dao động lúc tên rời dây'),
          done('Thông số dây cung có ảnh hưởng tới kết quả'),
          todo('Chỉ số phụ: FOC, grains mỗi pound kèm cảnh báo, tốc độ ước lượng'),
          done('Bài test ảo: bareshaft'),
          todo('Bài test ảo: xé giấy, walk-back'),
          todo('Đối chiếu với bảng spine của nhà sản xuất'),
        ],
      },
    ],
    exit: 'Mô hình mới thay vào mà không phải viết lại giao diện, mọi test vẫn qua, và vùng "trung tính" khớp với bảng spine của nhà sản xuất.',
  },
  {
    id: 'v0-3',
    version: 'V0.3',
    title: 'Toàn cảnh, chia sẻ, cung 3D',
    summary:
      'Nhìn toàn cảnh thay vì thử từng cái. Một bảng màu cho biết tổ hợp spine và point weight nào tốt, một biểu đồ cho biết thông số nào ảnh hưởng mạnh nhất. Gửi setup cho người khác bằng một đường link, và dùng được khi không có mạng.',
    groups: [
      {
        title: 'Toàn cảnh và chia sẻ',
        items: [
          todo('Bảng màu toàn cảnh, ví dụ spine × point weight'),
          todo('Tính bảng ở luồng phụ để giao diện không giật'),
          todo('Biểu đồ thông số nào ảnh hưởng mạnh nhất'),
          todo('Setup nằm trong đường link để chia sẻ'),
          todo('Xuất và nhập setup dạng file'),
          todo('So sánh nhiều hơn hai setup'),
          todo('Dùng được khi không có mạng'),
        ],
      },
      {
        title: 'Cây cung 3D',
        summary:
          'Một cây cung 3D xoay được. Chỉnh thông số nào thì bộ phận đó chuyển động theo, camera tự bay tới chỗ đó và hiện thước đo. Mục đích là hiểu "thông số này nằm ở đâu trên cung", không phải mô phỏng bay.',
        note: 'Đã có bản xem trước trong ứng dụng (Show: Bow in 3D): mới làm center shot và nocking point, hình cung còn thô. Các việc dưới đây vẫn để mở cho tới khi làm bản đầy đủ.',
        items: [
          todo('Cảnh 3D, chỉ tải khi mở'),
          todo('Cung dựng bằng code để từng bộ phận chuyển động được'),
          todo('Các bộ phận: riser, limb, dây, plunger, rest, tên, stabilizer'),
          todo(
            'Thông số thấy được trên cung: tay thuận, center shot, brace height, tiller, nocking point, plunger preload, draw length, chiều dài tên, point weight, stabilizer, số sợi dây',
          ),
          todo('Kéo thanh trượt thì camera bay tới bộ phận đó, tô sáng và hiện thước đo'),
          todo('Phóng đại độ lệch, có ghi rõ không theo tỉ lệ'),
          todo('Thông số không có gì để vẽ thì nói rõ, không bịa hình'),
          todo('Xoay, zoom, các góc nhìn có sẵn'),
          todo('Chạy trên điện thoại; không có WebGL thì quay về hình 2D'),
        ],
      },
    ],
    exit: 'Bảng toàn cảnh không làm thanh trượt bị giật, đường link chia sẻ cho ra đúng kết quả trên máy khác, và với mỗi thông số 3D người dùng thấy được bộ phận nào dịch, theo hướng nào.',
  },
  {
    id: 'v0-4',
    version: 'V0.4',
    title: 'Học từ thực tế',
    summary:
      'Dạy mô hình bằng thực tế. Người bắn ghi lại điều thật sự xảy ra ngoài bãi, ứng dụng so với dự đoán rồi tự chỉnh để lần sau đoán sát hơn cho chính bộ cung đó.',
    groups: [
      {
        title: 'Ghi nhận và hiệu chỉnh',
        items: [
          todo(
            'Mẫu ghi quan sát gắn với setup: dao động, hướng lệch, chạm cung, kết quả bareshaft',
          ),
          todo('Đặt cạnh nhau: mô hình đoán gì, thực tế ra sao'),
          todo('Chỉnh hệ số bằng hồi quy đơn giản, không dùng machine learning'),
          todo('Bộ hệ số riêng của từng người, bật tắt được'),
          todo('Xuất dữ liệu quan sát'),
        ],
      },
      {
        title: 'Chấm tên trên bia để chẩn đoán',
        summary:
          'Giống app ghi điểm: chấm vị trí từng mũi tên trên bia, đánh dấu mũi nào là bareshaft, mũi nào có cánh. Ứng dụng so hai cụm, kết hợp với setup đã nhập, rồi đoán nguyên nhân và gợi ý nên chỉnh gì trước.',
        note: 'Vì sao cần: setup nhìn "đẹp" trong mô phỏng vẫn có thể bắn khác đi, do cách thả dây và cơ thể mỗi người. Mô hình không thấy điều đó, mũi tên trên bia thì có.',
        items: [
          todo('Mặt bia để chấm vị trí tên, kèm cự ly và cỡ bia'),
          todo('Đánh dấu từng mũi là có cánh hay bareshaft; cộng dồn nhiều lượt bắn'),
          todo('Tâm cụm và độ tản; bareshaft lệch bao nhiêu cm, hướng mấy giờ'),
          todo('Lệch nhỏ hơn độ tản của cụm thì báo "chưa kết luận được"'),
          todo(
            'Chẩn đoán từ độ lệch thật, dùng setup để chọn giữa các nguyên nhân, xếp thứ tự việc cần chỉnh',
          ),
          todo('Lưu độ lệch quan sát để dùng cho hiệu chỉnh'),
        ],
      },
      {
        title: 'Đoán vạch thước ngắm (ý tưởng, chưa lên lịch)',
        summary:
          'Nhập vạch thước ngắm (sight) ở vài cự ly đã bắn chuẩn, ví dụ 18 m vạch 15 và 30 m vạch 30, ứng dụng đoán vạch cho 50, 70, 90 m. Ra bãi không phải dò lại từ đầu, chỉ cần bắn vài mũi để chỉnh tinh.',
        note: 'Vì sao cần: ai cũng cần vạch cho cự ly chưa bắn, và dò bằng cách bắn thử thì tốn tên, tốn thời gian. Các vạch đã có cũng là số đo thật về cách cây cung này đẩy mũi tên này, thứ mà mô hình mới chỉ ước lượng.',
        items: [
          todo(
            'Nhập vạch thước cho các cự ly đã bắn, ít nhất hai cự ly, theo thang của chính thước đó',
          ),
          todo(
            'Đoán vạch cho các cự ly còn lại, từ 18 m tới 90 m, bằng đường bay khớp với các vạch đã có',
          ),
          todo('Thêm lực cản không khí vào đường bay, nếu không cự ly xa sẽ bị đoán thấp'),
          todo(
            'Mỗi vạch đoán có khoảng sai số, càng xa cự ly đã biết càng rộng, kèm lời nhắc phải bắn thử để chốt',
          ),
          todo(
            'Vận tốc tên suy ra từ các vạch đã có, đặt cạnh ước lượng của mô hình và lưu làm quan sát thực tế',
          ),
        ],
      },
    ],
    exit: 'Sau khi ghi quan sát cho vài setup, mô hình đã hiệu chỉnh khớp thực tế hơn mô hình gốc, và người dùng luôn quay lại mô hình gốc được.',
  },
  {
    id: 'v0-5',
    version: 'V0.5',
    title: 'Thông số nâng cao và gợi ý',
    summary:
      'Thêm chi tiết cho người tune sâu (từng thanh stabilizer, cách thả dây, barebow), và ứng dụng gợi ý nên thử đổi gì tiếp theo.',
    groups: [
      {
        title: 'Thiết bị chi tiết và gợi ý',
        items: [
          todo('Tách stabilizer: thanh dài, thanh bên, extender, tạ'),
          todo('Thông số thả dây'),
          todo('Hỗ trợ barebow'),
          todo('Chi tiết thêm cho tên: chiều dài point, vị trí cánh'),
          done(
            'Gợi ý tune có thứ tự ưu tiên, kèm nút thử ngay, chia hai nhóm: chỉnh trực tiếp và thiết bị',
          ),
          todo('Gợi ý cả một chuỗi bước, không chỉ bước kế tiếp'),
        ],
      },
      {
        title: 'Giả lập lỗi kỹ thuật (ý tưởng, chưa lên lịch)',
        summary:
          'Giả lập lỗi của người bắn: release dơ, tay cầm cung vặn, arm collapse, alignment sai. Thay vì một mũi tên "hoàn hảo", ứng dụng bắn thử vài chục mũi có sai số rồi vẽ cả cụm tên trên bia.',
        note: 'Vì sao cần: release dơ tạo dấu hiệu trên bareshaft rất giống spine sai, nên người bắn dễ đi đổi tên trong khi vấn đề nằm ở tay. Và setup cân thì "dễ tha thứ" hơn setup lệch, điều mà một mũi tên hoàn hảo không cho thấy được.',
        items: [
          todo('Cụm tên giả lập trên bia, với một thanh "độ ổn định": mỗi mũi có một sai số nhỏ'),
          todo(
            'Ba lỗi riêng: collapse, release dơ, tay cầm cung vặn; mỗi lỗi ba mức, không nhập mm',
          ),
          todo('Mỗi lỗi gồm phần cố định làm cả cụm dời đi và phần thay đổi làm cụm tản ra'),
          todo(
            'Dùng chung mặt bia với tính năng chấm tên của V0.4, để so cụm mô hình với cụm thật',
          ),
          todo(
            'Alignment và áp lực ngón không đều, khi đã có tài liệu về độ lớn và chiều ảnh hưởng',
          ),
          todo(
            'Áp lực trên từng ngón tay thành một đầu vào riêng: ngón trỏ, giữa, áp út mỗi ngón gánh bao nhiêu phần lực kéo, và móc dây nặng ngón trên hay nặng ngón dưới thì độ lệch dọc và bareshaft đổi ra sao',
          ),
          todo(
            'Câu chữ kiểu "nếu bạn collapse thì sẽ thấy thế này", không phán "bạn đang collapse"',
          ),
        ],
      },
    ],
    exit: 'Mọi thông số mới nằm ở nhóm nâng cao và có mặc định, chế độ Simple không đổi, và mỗi gợi ý đều là thay đổi mà bảng toàn cảnh cho thấy là tốt hơn.',
  },
  {
    id: 'v0-6',
    version: 'V0.6',
    title: 'Máy chủ lưu setup',
    summary:
      'Có tài khoản và lưu trữ trên máy chủ. Thông số của từng setup được giữ lại theo người dùng, mở trên máy nào cũng thấy, kèm lịch sử thay đổi. Không đăng nhập vẫn dùng được như cũ.',
    groups: [
      {
        items: [
          todo('Chọn nền tảng máy chủ'),
          todo('Tài khoản người dùng'),
          todo('Lớp lưu trữ nối với máy chủ'),
          todo('Đưa setup đang lưu trên máy lên khi đăng nhập lần đầu'),
          todo('Lịch sử thay đổi của từng setup'),
          todo('Lưu quan sát thực tế cùng setup'),
          todo('Đồng bộ giữa các thiết bị'),
          todo('Không đăng nhập vẫn dùng được'),
        ],
      },
    ],
    exit: 'Setup lưu ở máy này hiện ra ở máy khác, setup trên máy không mất khi đăng nhập, và trải nghiệm khi không đăng nhập giống hệt trước đó.',
  },
  {
    id: 'v1-0',
    version: 'V1.0',
    title: 'Bản chính thức',
    summary:
      'Bản chính thức cho cộng đồng. Không thêm tính năng lớn; tập trung vào độ ổn định, tốc độ trên máy yếu, dễ dùng cho mọi người, và tài liệu giải thích rõ mô hình làm được gì, không làm được gì.',
    groups: [
      {
        items: [
          todo('Rà soát khả năng tiếp cận: bàn phím, trình đọc màn hình, độ tương phản'),
          todo('Rà soát tốc độ trên điện thoại yếu'),
          todo('Test tự động trọn luồng sử dụng chính'),
          todo('Hướng dẫn sử dụng và trang giải thích mô hình'),
          todo('Chính sách quyền riêng tư'),
          todo('Kênh nhận góp ý'),
        ],
      },
    ],
    exit: 'Không còn lỗi chặn nào đã biết, và giới hạn của mô hình được viết ra ở nơi người dùng sẽ đọc.',
  },
]

export const AFTER_V1 = [
  'Mũi tên bay dạng 3D',
  'Hồ sơ cung thật, cơ sở dữ liệu tên và phụ kiện thương mại',
  'Chế độ huấn luyện viên',
  'Lịch sử tune',
  'So sánh với video bắn thật, phân tích quay chậm đường bay',
]

export function countItems(groups: RoadmapGroup[]): { done: number; total: number } {
  const items = groups.flatMap((group) => group.items)
  return { done: items.filter((item) => item.done).length, total: items.length }
}
