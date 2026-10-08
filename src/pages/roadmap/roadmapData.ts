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
    text: 'Mở site thật trên điện thoại và rà 10 tiêu chí ở spec §33',
    why: 'Đây là việc cuối cùng của V0.1: mọi mục đã tick, chỉ còn bước kiểm này.',
    done: false,
  },
  {
    text: 'Mở "Hiển thị: Cung 3D" trên điện thoại thật: xoay bằng một ngón, phóng to bằng hai ngón, bấm thử năm góc nhìn có sẵn',
    why: 'Mới kiểm bằng Chrome trên máy tính ở bề rộng điện thoại, với WebGL phần mềm; thao tác cảm ứng trên cảnh 3D chưa thử được.',
    done: false,
  },
  {
    text: 'Thử thanh trượt trên điện thoại thật: vuốt dọc ngang qua thanh trượt phải cuộn trang, chỉ kéo đúng nút tròn mới đổi giá trị',
    why: 'Mới kiểm bằng Chrome giả lập màn cảm ứng trên máy tính, chưa thử trên máy thật.',
    done: false,
  },
  {
    text: 'Chuyển repo GitHub sang private, rồi nối repo với Cloudflare Pages: lệnh build `npm run build`, thư mục xuất `dist`',
    why: 'Ở gói GitHub miễn phí, repo private thì GitHub Pages ngừng chạy, nên site sẽ tắt cho tới khi Cloudflare chạy. Nối xong thì báo để bỏ bước deploy GitHub Pages khỏi workflow.',
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
    why: 'Easton ghi 13 mm, Total Archery ghi 4,8 tới 9,5 mm; 4 mm nằm dưới cả hai. Tiller cũng vậy: sách ghi 4,8 tới 6,4 mm, mô hình coi 4 mm là cân. Chi tiết ở tuning-references.md mục 4.3.',
    done: false,
  },
  {
    text: 'Tìm bảng chọn spine của Easton (PDF) và đặt vào docs/',
    why: 'Cần cho bài test đối chiếu vùng cân với bảng của nhà sản xuất, là điều kiện để xong V0.2.',
    done: false,
  },
  {
    text: 'Tìm bài của Kooi và Sparenberg, "On the mechanics of the arrow: Archer\'s Paradox" (Journal of Engineering Mathematics, 1997), và bản sạch sách của Murray Elliot, đặt vào docs/',
    why: 'Bài của Kooi là nguồn duy nhất đã biết có mô hình tên uốn quanh cung, cần để kiểm độ lớn của weak và stiff. Sách Easton đủ trang đã có, và phần xé giấy đã làm xong.',
    done: false,
  },
  {
    text: 'Quyết định có giữ lời nhắc tên nhẹ ở mốc 5 gr/lb không, khi đã có cảnh báo theo bảng AMO',
    why: 'Hiện có cả hai: dưới bảng AMO thì cảnh báo cung có thể gãy, dưới 5 gr/lb thì chỉ nhắc là tên nhẹ. Mốc 5 gr/lb là quy tắc của compound và cao hơn bảng AMO ở hầu hết recurve. Chi tiết ở tuning-references.md mục 9.2.',
    done: false,
  },
  {
    text: 'Bắn xé giấy ở ba cự ly, ví dụ 2 m, 4 m và 6 m, và bareshaft ở 18 m; ghi lại vết rách về phía nào ở từng cự ly',
    why: 'Bạn thấy trên phim quay chậm: có lúc đuôi tên đá ngang ngay khi rời cung, có lúc ra thẳng rồi gần 18 m đuôi mới đá, mũi nào cũng vậy. Mô hình chưa tái hiện được trường hợp sau. Nếu vết rách đổi chiều theo cự ly thì đó là đuôi lắc qua lại, và quãng giữa hai lần đổi chiều cho biết chu kỳ thật để chỉnh mô hình.',
    done: false,
  },
  {
    text: 'Đo lực kéo trên cung của bạn bằng cân cung ở ba chỗ: full draw, trước đó 2 inch và trước đó 8 inch, kèm brace height và cỡ cung lúc đo',
    why: 'Để kiểm hai hệ số hình dạng mặc định của đường lực kéo, hiện vẫn là ước lượng; ứng dụng đã nhận thẳng các số này ở Nâng cao, "Lực kéo tự đo". Chi tiết ở spec §39 và tuning-references.md mục 8.4.',
    done: false,
  },
  {
    text: 'Duyệt thiết kế đường lực kéo ở spec §39',
    why: 'Chưa code gì cho tới khi bạn đồng ý.',
    done: true,
  },
  {
    text: 'Duyệt thiết kế ba mức tune và màn hình setup bấm vào bộ phận cung ở spec §40',
    why: 'Bạn đã bảo cứ làm; đã làm xong.',
    done: true,
  },
  {
    text: 'Dùng thử màn hình mới (ba mức, bốn màn hình làm việc, Setup có cung 3D) trên máy tính và điện thoại thật, rồi báo chỗ nào chưa vừa ý',
    why: 'Mới xem bằng Chrome không giao diện ở 1440 px và 400 px. Chưa ai dùng thử bằng tay, và cảm ứng trên cảnh 3D chưa kiểm được.',
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
          done(
            'Mặt bia theo chuẩn World Archery cho từng cự ly (40, 80 hoặc 122 cm), vẽ cùng tỉ lệ với cung, đủ mười vòng',
          ),
          done('Trang rộng hết màn hình; màn rất rộng chia ba cột'),
          done('Ghi rõ hình vẽ không theo tỉ lệ'),
          done('Bảng kết quả, thêm xu hướng dọc (nock thấp / nock cao)'),
          done('Kết quả cập nhật ngay khi đang kéo thanh trượt'),
          done('Bareshaft bay cùng tên có cánh, kèm lời đọc kết quả'),
          done(
            'Một điểm chạm: tên có cánh coi như đã chỉnh thước vào tâm vàng, bareshaft vẽ theo độ lệch so với nó, đúng như phép thử bareshaft ngoài bãi',
          ),
          done(
            'Chọn giữa hai cách vẽ điểm chạm, có ở cả Cơ bản, Nâng cao và phần so sánh. "Một điểm chạm" là cách trên, vẫn là mặc định. "Hai điểm chạm" để cả hai mũi tên cắm đúng chỗ mô hình tính, nên xu hướng lệch của tên có cánh cũng hiện thành trượt tâm',
          ),
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
          done(
            'Đưa lên mạng với đường link công khai, qua GitHub Pages. Chủ dự án dự định chuyển repo sang private và dời sang Cloudflare Pages',
          ),
        ],
      },
      {
        title: 'M8. Màn hình gọn hơn',
        summary:
          'Màn hình đang có quá nhiều thứ cùng lúc, nhìn vào khá rối. Phần này sắp lại để thứ quan trọng hiện trước, phần còn lại mở ra khi cần. Trên điện thoại, vuốt để cuộn trang không còn vô tình kéo trúng thanh trượt.',
        items: [
          done(
            'Trên màn cảm ứng, thanh trượt chỉ chạy khi kéo đúng nút tròn; vuốt dọc bắt đầu trên thanh trượt thì cuộn trang. Mỗi thông số có thêm nút trừ và cộng để chỉnh mà không cần kéo. Đã kiểm bằng Chrome giả lập màn cảm ứng, còn phải thử trên điện thoại thật',
          ),
          done(
            'Cất bớt tùy chọn phát: chỉ để lại chạy, chạy lại và công tắc bareshaft; góc nhìn, cự ly, điểm chạm, tốc độ và phóng đại mở ra từ một nút "tùy chọn hiển thị"',
          ),
          done(
            'Kết quả mở đầu bằng một câu dễ hiểu (ví dụ "tên hơi yếu, bareshaft cắm lệch phải"). Các thước đo và con số mở ra khi cần: trên điện thoại lúc đầu cất đi, trên màn rộng lúc đầu hiện sẵn',
          ),
          done(
            'Thông số nhập chia nhóm gập lại được, nhóm ghi số giá trị đã đổi. Trên điện thoại, setup, kết quả và gợi ý thành ba tab dưới hoạt hình thay cho một trang dài',
          ),
          done(
            'Rút các dòng ghi chú cố định (chiếu chậm, phóng đại, không theo tỉ lệ, giới hạn mô hình) còn mỗi thứ một dòng, bản đầy đủ nằm sau một đường link',
          ),
          done(
            'Rà cả màn hình bằng hai skill UI và xem bằng mắt ở bề rộng 400 px, cả hai ngôn ngữ',
          ),
          done(
            'Nút cất hình vẽ nhìn từ trên và từ bên đi rồi hiện lại, để màn hình nhỏ dành chỗ cho thông số và kết quả',
          ),
        ],
      },
      {
        title: 'M9. Ba mức tune và màn hình setup riêng',
        summary:
          'Chia ứng dụng thành ba mức: Cơ bản, Nâng cao, Chuyên nghiệp. Mức nào chỉ thấy đúng thứ của mức đó, từ ô nhập tới kết quả và các màn hình. Phần setup ra một chỗ riêng: bấm vào một bộ phận trên cây cung 3D, thông số của nó hiện ra và kéo thanh trượt ngay tại chỗ, giống màn hình độ súng trong game.',
        items: [
          done(
            'Ba mức thay cho hai, áp cho cả ứng dụng: ô nhập, độ chi tiết của kết quả, và có những màn hình nào. Tiller và lệch cánh về Cơ bản; đường lực kéo và chi tiết thêm của mũi tên lên Chuyên nghiệp',
          ),
          done(
            'Thông số chia năm nhóm (cung, điều chỉnh, tên, dây, cân bằng), mỗi lúc mở một nhóm, nhóm đang đóng vẫn ghi các giá trị chính. Mỗi thông số là một dòng, đang dùng dòng nào thì dòng đó mở thanh trượt',
          ),
          done(
            'Bốn màn hình làm việc thay cho nút "Hiển thị": Setup, Tên bay, Bia thật, Phân tích. Tên setup, lưu và chia sẻ gom vào một thanh phía trên; ngôn ngữ và đơn vị nằm sau một nút cài đặt',
          ),
          done(
            'Setup có thông số nằm cạnh cây cung 3D: bấm vào một bộ phận thì nhảy tới thông số của nó, kéo thanh trượt thì cây cung chuyển động theo. Cung 3D bật tắt được, và vẽ thêm được đường tên bay nhìn từ trên hoặc từ bên',
          ),
          done(
            'Mỗi bộ phận trên cung 3D có một ô chú thích: hình vẽ nhỏ của bộ phận, tên và giá trị của nó, kèm một đường kẻ nối tới bộ phận, giống màn hình độ súng trong game. Bấm vào ô là nhảy tới thông số',
          ),
          done(
            'Kết quả xoay quanh việc nên làm tiếp: một câu kết luận, một gợi ý để thử, phần còn lại nằm trong các tab',
          ),
          done(
            'Các phần trên màn hình tách rõ khỏi nền: mỗi phần là một khung có viền và một vạch màu cạnh tiêu đề, nền trang đậm hơn một bậc, các ô điều khiển sáng hơn một bậc',
          ),
          done(
            'Ô tìm thông số ở mức Chuyên nghiệp. Đã xem bằng Chrome không giao diện ở 1440 px và 400 px, tiếng Việt',
          ),
          todo(
            'Viết lại các test giao diện cho các màn hình làm việc: 49 test viết cho bố cục cũ đang bị bỏ qua',
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
          done(
            'Tách hệ số ra file JSON riêng có số phiên bản; file thiếu hoặc sai số nào thì bị từ chối khi nạp',
          ),
          done('Tính độ cứng thật của thân tên từ chỉ số spine'),
          done('Tính tần số dao động của mũi tên từ độ cứng, khối lượng và chiều dài'),
          done(
            'Tính khả năng chạm cung theo nhịp dao động: thân tên đã uốn bao nhiêu chu kỳ lúc đuôi của nó đi ngang qua cung. Bộ hệ số lên phiên bản heuristic-0.2',
          ),
          done('Thông số dây cung có ảnh hưởng tới kết quả'),
          done(
            'Chỉ số phụ: FOC, grains mỗi pound kèm cảnh báo, tốc độ ước lượng. Con số hiện ở chế độ Nâng cao; cảnh báo tên dưới 5 gr/lb hiện ở cả hai chế độ',
          ),
          done(
            'Cảnh báo khi tên nhẹ hơn mức tối thiểu của bảng AMO cho lực kéo và draw length đang nhập, lấy từ sách Easton. Khi cả hai cùng đúng thì nó thay cho lời nhắc 5 gr/lb',
          ),
          done(
            'Test giữ mô hình trong vùng số liệu đã công bố: số chu kỳ uốn của tên lúc còn trên dây, phần năng lượng tên nhận được, vận tốc theo khối lượng tên và brace height',
          ),
          done('Bài test ảo: bareshaft'),
          done(
            'Bài test ảo: xé giấy. Bảng kết quả vẽ tờ giấy và đọc vết rách, cạnh bài thử bareshaft; hướng rách lấy từ sách Easton',
          ),
          todo('Bài test ảo: walk-back. Mới có một nguồn tả nó, độ tin thấp'),
          todo(
            'Lắc đuôi như dao động thật của mũi tên trong không khí: tần số và độ tắt theo cánh, FOC và vận tốc, để tái hiện được trường hợp tên ra thẳng rồi gần bia đuôi mới đá, và bareshaft lệch dần',
          ),
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
          done(
            'Bảng màu toàn cảnh spine × point weight: mục "Hiển thị: Toàn cảnh" ở trang Simulator. Bấm một ô để đưa cặp đó vào setup',
          ),
          done('Tính bảng ở luồng phụ để giao diện không giật'),
          done(
            'Biểu đồ thông số nào ảnh hưởng mạnh nhất, nằm dưới bảng toàn cảnh. Chế độ Cơ bản chỉ liệt kê thông số nó đang hiện',
          ),
          done(
            'Setup nằm trong đường link để chia sẻ: nút "Chép link tới setup này" dưới danh sách setup đã lưu. Mở link thì ứng dụng hỏi trước, không tự thay setup đang mở',
          ),
          done(
            'Xuất và nhập setup dạng file: một file chứa các setup đã lưu và setup đang mở. Nhập file chỉ thêm, không ghi đè setup đã lưu',
          ),
          done(
            'So sánh nhiều hơn hai setup: tối đa ba setup đã lưu đặt cạnh setup đang mở, mỗi cái một hình vẽ và một cột trong bảng',
          ),
          done(
            'Dùng được khi không có mạng: mở site một lần là lần sau mở được không cần mạng, và cài được ra màn hình chính của điện thoại',
          ),
        ],
      },
      {
        title: 'Cây cung 3D',
        summary:
          'Một cây cung 3D xoay được. Chỉnh thông số nào thì bộ phận đó chuyển động theo, camera tự bay tới chỗ đó và hiện thước đo. Mục đích là hiểu "thông số này nằm ở đâu trên cung", không phải mô phỏng bay.',
        note: 'Đã làm xong, qua ba đợt. Mở bằng "Hiển thị: Cung 3D". Thao tác cảm ứng trên điện thoại thật còn chờ chủ dự án thử.',
        items: [
          done('Cảnh 3D, chỉ tải khi mở'),
          done('Cung dựng bằng code để từng bộ phận chuyển động được'),
          done(
            'Các bộ phận: riser có cửa sổ ngắm, grip và ổ limb; limb; dây có center serving và nocking point; plunger; rest; tên; long rod có damper và tạ; V-bar và hai side rod',
          ),
          done(
            'Thông số thấy được trên cung: tay thuận, cỡ riser và cánh, center shot, cánh lệch ngang, brace height, tiller, nocking point, plunger preload, draw length (tư thế kéo hết dây), chiều dài tên, point weight, stabilizer, số sợi dây',
          ),
          done('Kéo thanh trượt thì camera bay tới bộ phận đó và hiện thước đo kèm giá trị'),
          done('Phóng đại độ lệch, có ghi rõ không theo tỉ lệ'),
          done('Thông số không có gì để vẽ thì nói rõ, không bịa hình'),
          done(
            'Xoay, zoom, và các nút bấm nhanh chia hai nhóm. "Góc nhìn": cả cây cung, từ phía bia, từ trên xuống, dọc theo dây (cách kiểm cánh có thẳng hàng không). "Thiết bị": cánh cung, dây, nocking point, rest, plunger, mũi tên, stabilizer',
          ),
          done('Chạy trên điện thoại; không có WebGL thì quay về hình 2D, có ghi rõ lý do'),
          done(
            'Bấm vào một bộ phận trên cung, hoặc nút của thiết bị đó, là tới thông số của nó: ô nhập cuộn vào tầm nhìn, nhận focus và được tô sáng một lúc. Bộ phận mảnh như dây và mũi tên nhận cả cú bấm sát bên',
          ),
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
          done(
            'Mẫu ghi quan sát gắn với setup: dao động, hướng lệch, chạm cung, kết quả bareshaft. Nằm ở mục "Hiển thị: Bia"; mỗi lần ghi giữ lại giá trị của setup lúc bắn',
          ),
          done(
            'Đặt cạnh nhau: mô hình đoán gì, thực tế ra sao. Mỗi quan sát ghi "Bạn thấy" cạnh "Mô hình nói" và đếm số điều khớp',
          ),
          done(
            'Chỉnh hệ số bằng phép dò đơn giản, không dùng machine learning. Chỉ dò ba số dịch chuyển: lệch weak/stiff riêng của người bắn, điểm cân của nocking point và của center shot. Mới kiểm bằng quan sát dựng sẵn, chưa có quan sát thật',
          ),
          done(
            'Bộ hệ số riêng của từng người, bật tắt được: chỉ tự bật khi khớp quan sát hơn mô hình gốc, và luôn tắt được bằng một nút',
          ),
          done('Xuất dữ liệu quan sát: một file chứa mọi quan sát trong trình duyệt'),
        ],
      },
      {
        title: 'Chấm tên trên bia để chẩn đoán',
        summary:
          'Giống app ghi điểm: chấm vị trí từng mũi tên trên bia, đánh dấu mũi nào là bareshaft, mũi nào có cánh. Ứng dụng so hai cụm, kết hợp với setup đã nhập, rồi đoán nguyên nhân và gợi ý nên chỉnh gì trước.',
        note: 'Vì sao cần: setup nhìn "đẹp" trong mô phỏng vẫn có thể bắn khác đi, do cách thả dây và cơ thể mỗi người. Mô hình không thấy điều đó, mũi tên trên bia thì có.',
        items: [
          done(
            'Mặt bia để chấm vị trí tên, kèm cự ly và cỡ bia. Nằm ở trang Simulator, mục "Hiển thị: Bia". Chấm được cả bằng bàn phím: phím mũi tên dời con trỏ, Enter để chấm',
          ),
          done(
            'Đánh dấu từng mũi là có cánh hay bareshaft; cộng dồn nhiều lượt bắn. Bia đang chấm được giữ lại khi đóng trang',
          ),
          done('Tâm cụm và độ tản; bareshaft lệch bao nhiêu cm, hướng mấy giờ'),
          done(
            'Lệch nhỏ hơn độ tản của cụm, hoặc nhỏ hơn mức bareshaft tự lệch ở cự ly đó, thì báo "chưa kết luận được"',
          ),
          done(
            'Chẩn đoán từ độ lệch thật, dùng setup để chọn giữa các nguyên nhân, xếp thứ tự việc cần chỉnh theo sách tuning. Nói rõ khi mô hình đọc setup khác với bia',
          ),
          done(
            'Lưu bia thành quan sát thực tế, kèm giá trị của setup lúc bắn, để dùng cho hiệu chỉnh',
          ),
        ],
      },
      {
        title: 'Đoán vạch thước ngắm',
        summary:
          'Nhập vạch thước ngắm (sight) ở vài cự ly đã bắn chuẩn, ví dụ 18 m vạch 15 và 30 m vạch 30, ứng dụng đoán vạch cho 50, 70, 90 m. Ra bãi không phải dò lại từ đầu, chỉ cần bắn vài mũi để chỉnh tinh.',
        note: 'Vì sao cần: ai cũng cần vạch cho cự ly chưa bắn, và dò bằng cách bắn thử thì tốn tên, tốn thời gian. Các vạch đã có cũng là số đo thật về cách cây cung này đẩy mũi tên này, thứ mà mô hình mới chỉ ước lượng.',
        items: [
          done(
            'Nhập vạch thước cho các cự ly đã bắn, ít nhất hai cự ly, theo thang của chính thước đó',
          ),
          done(
            'Đoán vạch cho các cự ly còn lại, từ 18 m tới 90 m, bằng đường bay khớp với các vạch đã có',
          ),
          done('Thêm lực cản không khí vào đường bay, nếu không cự ly xa sẽ bị đoán thấp'),
          done(
            'Mỗi vạch đoán có khoảng sai số, càng xa cự ly đã biết càng rộng, kèm lời nhắc phải bắn thử để chốt',
          ),
          done(
            'Vận tốc tên suy ra từ các vạch đã có, đặt cạnh ước lượng của mô hình và lưu làm quan sát thực tế',
          ),
          done(
            'Vẽ thước ngắm (sight) trên cung ở góc nhìn ngang, đầu ngắm nằm đúng vạch của cự ly đang chọn, và cảnh báo khi mũi tên hoặc cánh đi quá sát đầu ngắm hay thanh thước',
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
      'Thêm chi tiết cho người tune sâu (từng thanh stabilizer, cách thả dây, barebow, đường lực kéo của cung), và ứng dụng gợi ý nên thử đổi gì tiếp theo.',
    groups: [
      {
        title: 'Thiết bị chi tiết và gợi ý',
        items: [
          todo('Tách stabilizer: thanh dài, thanh bên, extender, tạ'),
          todo('Thông số thả dây'),
          done(
            'Cỡ cung: riser (H23, H25, H27) và cánh (66, 68, 70), nằm ở một mục riêng trên cùng. Từ đó ra chiều dài cung và khoảng brace height nên dùng',
          ),
          done(
            'Cánh cung lệch ngang: đầu mỗi cánh lệch trái hay phải bao nhiêu mm. Hai cánh lệch cùng phía thì như center shot bị lệch; lệch ngược phía thì tên lắc hơn và dễ chạm cung hơn',
          ),
          todo('Hỗ trợ barebow'),
          done(
            'Chi tiết thêm cho tên: point nhô khỏi thân bao nhiêu, cánh cao bao nhiêu và cách nock bao xa. FOC tính theo các vị trí đó, và có ghi chú khi nằm ngoài khoảng 7 tới 16 % của sách Easton',
          ),
          done(
            'Gợi ý tune có thứ tự ưu tiên, kèm nút thử ngay, chia hai nhóm: chỉnh trực tiếp và thiết bị',
          ),
          done(
            'Gợi ý xếp theo thứ tự sách tuning vẫn làm: lắp đặt, lên xuống, plunger, point, lực kéo, brace height, rồi mới tới thân tên. Center shot chỉ được gợi ý đưa về chỗ đã đặt. Bareshaft hơi thấp hoặc hơi cứng vẫn tính là đã cân',
          ),
          done(
            'Gợi ý cả một chuỗi bước, không chỉ bước kế tiếp: mục "Cả buổi tune" dưới phần gợi ý, mỗi giá trị đổi một lần theo thứ tự sách, kèm nút thử tất cả',
          ),
        ],
      },
      {
        title: 'Đường lực kéo (DFC)',
        summary:
          'Vẽ đường lực kéo của cây cung: kéo tới đâu thì nặng bao nhiêu, cung tích được bao nhiêu năng lượng, và lúc gần clicker lực còn tăng nhanh hay chậm. Ứng dụng dựng một đường chung từ cỡ cung và draw length, rồi sửa lại cho đúng cây cung của bạn nếu bạn tự đo vài điểm bằng cân cung.',
        note: 'Vì sao cần: hai cây cung cùng số pound vẫn có thể tích năng lượng khác nhau và cho cảm giác khác nhau ở clicker, mà trước đây mô hình coi là một. Giờ ứng dụng vẽ đường này, ước lượng từ cỡ cung hoặc uốn theo lực người bắn tự đo. Hãng không công bố đường này, và không đoán được nó từ lõi foam hay gỗ: số đo cho thấy lõi không quyết định hình dạng.',
        items: [
          done(
            'Đường lực kéo chung từ lực kéo, draw length và brace height, với hai số hình dạng: độ đầy quyết định năng lượng tích, độ dốc cuối quyết định lực tăng ở clicker',
          ),
          done(
            'Chọn kiểu đường cong ba mức (thẳng, chuẩn, đầy giữa hành trình), ghi rõ là ước lượng. Mức chuẩn cho kết quả y như hiện nay',
          ),
          done(
            'Độ dốc cuối tính từ việc cung dài hay ngắn so với draw length: cung ngắn kéo dài thì cuối hành trình dốc hơn',
          ),
          done(
            'Tự đo: nhập lực ở một hoặc hai chỗ kéo ngắn hơn, đọc từ cân cung. Số đo thay cho ước lượng và được lưu cùng setup',
          ),
          done(
            'Đồ thị đường lực kéo, kèm năng lượng tích và lực tăng mỗi inch ở clicker; khi so sánh hai setup thì vẽ hai đường',
          ),
          done(
            'Đổi số pound ghi trên limb ra lực trên ngón tay: 5% mỗi inch tính từ 28 inch, limb bolt ±5%, ghi rõ là ước lượng',
          ),
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
          done(
            'Rà soát khả năng tiếp cận bằng máy và bằng bàn phím: mọi màn hình được axe kiểm theo WCAG 2.2 mức A và AA, nền sáng và nền tối, màn rộng và 400 px, không còn lỗi nào. Thêm nút "Tới thẳng nội dung", phần cài đặt đóng bằng Escape, các ô chọn cao 44 px, và các thước đo thành danh sách đúng chuẩn',
          ),
          todo(
            'Khả năng tiếp cận bằng tai: thử trọn luồng chính với trình đọc màn hình (NVDA hoặc VoiceOver). Không phép kiểm bằng máy nào thay được việc này',
          ),
          todo('Rà soát tốc độ trên điện thoại yếu'),
          done(
            'Test tự động trọn luồng sử dụng chính bằng Playwright: 13 test chạy trên bản build trong Chrome, từ lúc nhập một giá trị tới lúc so sánh setup đã lưu sau khi tải lại trang, cộng 24 phép kiểm khả năng tiếp cận. Có workflow riêng chạy mỗi lần push, tách khỏi bước deploy; workflow này chưa chạy lần nào',
          ),
          done(
            'Trang giải thích mô hình: "Cách hoạt động", một dòng thời gian mười bước từ lúc nhập setup tới lúc có gợi ý. Mỗi bước ghi nó nhận gì, làm gì, trả ra gì, xem ở đâu, và dựa trên vật lý, ước chừng, minh họa hay mũi tên thật',
          ),
          todo('Hướng dẫn sử dụng'),
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
