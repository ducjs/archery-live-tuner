import type { Messages } from './en.ts'

// Archers in Vietnam keep the English names of the parts (spine, point, plunger,
// nocking point, brace height, tiller, bareshaft), so those are not translated.
export const vi: Messages = {
  nav: {
    pages: 'Trang',
    simulator: 'Mô phỏng',
    roadmap: 'Lộ trình',
    previews: 'Xem trước',
    language: 'Ngôn ngữ',
    units: 'Đơn vị',
  },

  simulator: {
    title: 'Mô phỏng tune cung recurve',
    intro: 'Đổi một thông số và xem mũi tên rời cung thế nào.',
    show: 'Hiển thị',
    flight: 'Tên bay',
    compare: 'So sánh',
    bow: 'Cung 3D (xem thử)',
    disclaimer:
      'Trình mô phỏng này dùng một mô hình đơn giản hoá về cung recurve và mũi tên. Kết quả dùng để tìm hiểu và hình dung việc tune, không thay cho việc tune thực tế, thông số của nhà sản xuất hay huấn luyện viên.',
    modelOnly:
      'Mọi thứ trên trang này là kết quả của mô hình. Không có gì là quan sát từ bắn thật.',
  },

  parameter: {
    'bow.handedness': { label: 'Tay thuận', options: { RH: 'Tay phải', LH: 'Tay trái' } },
    'bow.drawWeight': { label: 'Lực kéo', hint: 'Lực trên ngón tay khi kéo hết.' },
    'bow.drawLength': { label: 'Chiều dài kéo' },
    'bow.braceHeight': { label: 'Brace height' },
    'bow.nockingPointHeight': {
      label: 'Độ cao nocking point',
      hint: 'Tính từ đường vuông góc với dây trở lên.',
    },
    'bow.centerShot': {
      label: 'Center shot',
      hint: 'Đầu tên so với đường dây. Âm là lệch trái, dương là lệch phải.',
    },
    'bow.plungerStiffness': {
      label: 'Độ cứng plunger',
      hint: '0 là rất mềm, 1 là vừa, 2 là rất cứng.',
    },
    'bow.tiller': { label: 'Tiller', hint: 'Tiller trên trừ tiller dưới.' },
    'bow.plungerPreload': { label: 'Độ nén trước của plunger' },
    'bow.bowMass': {
      label: 'Khối lượng cung',
      hint: 'Mọi thứ tay cầm cung phải giữ, kể cả stabilizer.',
    },
    'bow.stabilizerMass': { label: 'Khối lượng stabilizer' },
    'bow.stabilizerPosition': { label: 'Vị trí stabilizer', hint: 'Tạ nằm trước riser bao xa.' },
    'bow.string.strandCount': { label: 'Số sợi dây' },
    'bow.string.stringMass': { label: 'Khối lượng dây' },
    'bow.string.nockFit': {
      label: 'Độ khít nock',
      options: { LOOSE: 'Lỏng', NORMAL: 'Vừa', TIGHT: 'Chặt' },
    },
    'arrow.length': {
      label: 'Chiều dài tên',
      hint: 'Từ rãnh nock tới cuối thân tên, không tính point.',
    },
    'arrow.spine': { label: 'Spine', hint: 'Số càng nhỏ thì thân tên càng cứng.' },
    'arrow.pointWeight': { label: 'Khối lượng point' },
    'arrow.shaftGpi': { label: 'Khối lượng thân tên' },
    'arrow.shaftDiameter': { label: 'Đường kính thân tên' },
    'arrow.insertWeight': { label: 'Khối lượng insert' },
    'arrow.nockWeight': { label: 'Khối lượng nock' },
    'arrow.fletchingWeight': { label: 'Khối lượng cánh', hint: 'Tính tổng tất cả các cánh.' },
  },

  panels: {
    detail: 'Mức chi tiết',
    simple: 'Cơ bản',
    advanced: 'Nâng cao',
    bow: 'Cung',
    arrow: 'Tên',
    advancedChanged: (count) => `${count} thông số nâng cao đã đổi và vẫn ảnh hưởng tới kết quả.`,
    showThem: 'Xem',
    resetThem: 'Đặt lại',
    assumed: (count) => `Chế độ Cơ bản đang giả định ${count} thông số khác`,
    assumedExamples: (examples, rest) =>
      `${examples.join(', ')} và ${rest} thông số nữa. Đồ của bạn khác thì kết quả lệch theo.`,
    assumedShow: 'Xem tất cả',
    assumedHide: 'Ẩn danh sách',
    assumedEnter: 'Tự nhập các giá trị này',
    totalMass: 'Khối lượng tên ước tính',
    resetLabel: (label, value) => `Đặt lại ${label} về ${value}`,
    resetTitle: (value) => `Đặt lại về ${value}`,
    slider: (label) => `Thanh trượt ${label}`,
  },

  rating: {
    WEAK: 'Yếu',
    NEUTRAL: 'Trung tính',
    STIFF: 'Cứng',
    LOW: 'Thấp',
    MEDIUM: 'Vừa',
    HIGH: 'Cao',
    LEFT: 'Trái',
    RIGHT: 'Phải',
    NOCK_LOW: 'Nock thấp',
    NOCK_HIGH: 'Nock cao',
  },

  result: {
    heading: 'Kết quả mô hình',
    stiffness: 'Độ cứng động',
    lateral: 'Xu hướng lệch ngang',
    vertical: 'Xu hướng lệch dọc',
    oscillation: 'Dao động',
    clearance: 'Nguy cơ chạm cung',
    short: {
      stiffness: 'Độ cứng',
      oscillation: 'Dao động',
      lateral: 'Lệch ngang',
      clearance: 'Chạm cung',
    },
    bareShaftHeading: 'Bài thử bareshaft',
    bareShaftNote:
      'Bareshaft được thêm tạ cho bằng khối lượng tên có cánh. Plunger và center shot cũng đẩy nó sang ngang, không riêng gì spine.',
    speed: 'Tốc độ ước tính',
    reaching: (metres) => `, tới bia ${metres} m sau`,
    note: 'Đây là xu hướng từ một mô hình đơn giản hoá, chưa được đối chiếu với bắn thật. Hãy thử trên cung của bạn trước khi đổi thiết bị.',
  },

  bareShaft: {
    together: 'Bareshaft cắm chung cụm với tên có cánh.',
    matched: 'Đó là dấu hiệu của một setup đã cân.',
    above: 'cao hơn',
    below: 'thấp hơn',
    left: 'lệch trái',
    right: 'lệch phải',
    landing: (where) => `Bareshaft cắm ${where.join(' và ')} so với cụm tên có cánh.`,
    weak: 'tên yếu',
    stiff: 'tên cứng',
    nockHigh: 'nocking point quá cao',
    nockLow: 'nocking point quá thấp',
    meaning: (conclusions) => `Đó là dấu hiệu của ${conclusions.join(' và ')}.`,
  },

  suggestions: {
    heading: 'Gợi ý tune',
    tuned: 'Mô hình đọc setup này là đã cân. Không có gì cần gợi ý.',
    none: 'Không có thay đổi đơn lẻ nào trong tầm chỉnh cải thiện được nhiều. Thử thân tên khác, hoặc đổi nhiều hơn một bước.',
    intro:
      'Mỗi nhóm xếp theo thứ tự ưu tiên: lợi nhiều nhất mà tốn công ít nhất. Mỗi gợi ý là một thay đổi riêng lẻ tính từ setup hiện tại, nên hãy thử một cái rồi xem lại danh sách.',
    groups: {
      adjust: { title: 'Chỉnh trực tiếp', about: 'Chỉnh ngay trên cung. Không phải mua gì.' },
      equipment: { title: 'Thiết bị', about: 'Đổi một bộ phận của tên, hoặc đổi tên.' },
    },
    emptyGroup: 'Nhóm này không có thay đổi nào giúp được nhiều.',
    tryIt: 'Thử',
    tryLabel: (action) => `Thử: ${action}`,
    footnote:
      'Gợi ý lấy từ chính mô hình đơn giản này, không phải lời khuyên tune đã qua kiểm chứng.',
    actions: {
      'bow.nockingPointHeight': { increase: 'Nâng nocking point', decrease: 'Hạ nocking point' },
      'bow.plungerStiffness': {
        increase: 'Tăng độ cứng plunger',
        decrease: 'Giảm độ cứng plunger',
      },
      'bow.plungerPreload': {
        increase: 'Tăng độ nén trước của plunger',
        decrease: 'Giảm độ nén trước của plunger',
      },
      'bow.centerShot': { increase: 'Dời đầu tên sang phải', decrease: 'Dời đầu tên sang trái' },
      'bow.braceHeight': { increase: 'Tăng brace height', decrease: 'Giảm brace height' },
      'bow.tiller': { increase: 'Tăng tiller', decrease: 'Giảm tiller' },
      'bow.drawWeight': { increase: 'Tăng lực kéo', decrease: 'Giảm lực kéo' },
      'arrow.pointWeight': { increase: 'Dùng point nặng hơn', decrease: 'Dùng point nhẹ hơn' },
      'arrow.nockWeight': { increase: 'Dùng nock nặng hơn', decrease: 'Dùng nock nhẹ hơn' },
      'arrow.length': { increase: 'Dùng tên dài hơn', decrease: 'Dùng tên ngắn hơn' },
      'arrow.spine': { increase: 'Dùng thân tên yếu hơn', decrease: 'Dùng thân tên cứng hơn' },
    },
    effort: {
      bow: 'Chỉnh trên cung',
      arrowPart: 'Đổi một bộ phận của tên',
      newArrows: 'Cần tên mới',
    },
    value: (to, from) => `Thử khoảng ${to}. Hiện là ${from}.`,
    goes: (title, from, to) => `${title} đổi từ ${from} sang ${to}.`,
    bareLands: (where) => `Bareshaft cắm ${where}.`,
    bareHorizontal: {
      LEFT: 'lệch trái cụm tên',
      TOGETHER: 'chung cụm tên',
      RIGHT: 'lệch phải cụm tên',
    },
    bareVertical: {
      LOW: 'thấp hơn cụm tên',
      TOGETHER: 'ngang cụm tên',
      HIGH: 'cao hơn cụm tên',
    },
    closer: 'Tiến gần mức trung tính hơn, chưa đổi mức đánh giá nào.',
  },

  stage: {
    fletched: 'Có cánh',
    bareShaft: 'Bareshaft',
    archerLeft: 'Bên trái người bắn',
    archerRight: 'Bên phải người bắn',
    high: 'Cao',
    low: 'Thấp',
    view: 'Góc nhìn',
    views: { top: 'Từ trên', side: 'Từ bên', both: 'Cả hai' },
    distance: 'Cự ly',
    impact: 'Điểm chạm',
    impacts: { one: 'Một điểm', two: 'Hai điểm' },
    speed: 'Tốc độ',
    real: 'Thật',
    bowAngle: (degrees) => `Cung ngửa ${degrees.replace('.', ',')}°`,
    moment: 'Thời điểm',
    momentText: (milliseconds, metres) =>
      `${milliseconds} mili giây sau khi rời dây, cách ${metres} mét`,
    momentOnString: (milliseconds) => `Còn trên dây, ${milliseconds} mili giây nữa thì rời dây`,
    play: 'Chạy',
    pause: 'Dừng',
    restart: 'Chạy lại',
    flyBare: 'Bắn kèm một bareshaft',
    amplify: 'Phóng đại',
    realSpeed: 'Tốc độ thật.',
    slowed: (times) => `Chậm ${times} lần.`,
    amplified: {
      one: {
        top: 'Độ uốn và độ lệch của bareshaft được phóng đại, hình vẽ không theo tỉ lệ.',
        side: 'Góc của tên và độ lệch của bareshaft được phóng đại, hình vẽ không theo tỉ lệ.',
        both: 'Độ uốn, góc của tên và độ lệch của bareshaft được phóng đại, hình vẽ không theo tỉ lệ.',
      },
      two: {
        top: 'Độ uốn và độ lệch được phóng đại, hình vẽ không theo tỉ lệ.',
        side: 'Góc của tên và độ lệch được phóng đại, hình vẽ không theo tỉ lệ.',
        both: 'Độ uốn, góc của tên và độ lệch được phóng đại, hình vẽ không theo tỉ lệ.',
      },
    },
    landing: {
      one: 'Tên có cánh được coi là đã chỉnh thước vào tâm.',
      two: 'Mỗi mũi tên cắm đúng chỗ mô hình tính, thước ngắm để nguyên.',
    },
    topViewLabel: (stiffness, oscillation, lateral) =>
      `Tên bay từ cung tới bia, nhìn từ trên. Độ cứng động: ${stiffness}. Dao động: ${oscillation}. Lệch ngang: ${lateral}.`,
    sideViewLabel: (vertical) => `Tên bay từ cung tới bia, nhìn từ bên. Tên rời cung: ${vertical}.`,
    level: 'cân',
  },

  viewer: {
    lookAt: 'Nhìn vào',
    focus: { bow: 'Cả cây cung', centerShot: 'Center shot', nockingPoint: 'Nocking point' },
    amplify: (times) => `Vẽ độ lệch lớn gấp ${times} lần`,
    about:
      'Bản xem thử: hiện chỉ center shot và độ cao nocking point làm mô hình thay đổi. Đổi một trong hai thì camera tự quay tới đó. Kéo để xoay cung, cuộn hoặc chụm ngón để phóng to. Đường vàng đứt là đường dây khi nhìn từ trên, và là đường vuông góc với dây khi nhìn từ bên. Nhãn ghi giá trị thật; cây cung là hình đơn giản hoá, không phải thiết bị của bạn.',
    loading: 'Đang tải hình 3D.',
    failed:
      'Không mở được hình 3D. Nó cần WebGL, mà trình duyệt hoặc thiết bị này đang tắt. Các góc nhìn tên bay vẫn dùng được.',
    sceneLabel: 'Mô hình 3D của cây cung. Kéo để xoay, cuộn hoặc chụm ngón để phóng to.',
    nockingPoint: 'Nocking point',
    centerShot: 'Center shot',
    centerShotValue: (centerShot) =>
      Math.abs(centerShot) < 0.05
        ? 'nằm trên đường dây'
        : `lệch ${centerShot < 0 ? 'trái' : 'phải'} đường dây ${Math.abs(centerShot).toFixed(1)} mm`,
    nockingPointValue: (height) =>
      Math.abs(height) < 0.05
        ? 'vuông góc với dây'
        : `${height > 0 ? 'cao' : 'thấp'} hơn đường vuông góc ${Math.abs(height).toFixed(1)} mm`,
  },

  setups: {
    heading: 'Setup của bạn',
    defaultName: 'Setup của tôi',
    name: 'Tên setup',
    notSaved: 'Chưa lưu',
    saved: 'Đã lưu',
    changed: 'Có thay đổi chưa lưu',
    save: 'Lưu',
    saveAsNew: 'Lưu thành bản mới',
    startNew: 'Setup mới',
    copyName: (name) => `${name} (bản sao)`,
    list: (count) => `Setup đã lưu (${count})`,
    empty: 'Chưa lưu setup nào. Lưu setup này để giữ lại và so sánh về sau.',
    open: 'Mở',
    openNow: 'Đang mở',
    compare: 'So sánh',
    rename: 'Đổi tên',
    remove: 'Xoá',
    rowAction: (action, name) => `${action}: ${name}`,
    newName: (name) => `Tên mới cho ${name}`,
    done: 'Xong',
    cancel: 'Huỷ',
    discardQuestion: 'Thay đổi chưa lưu sẽ mất.',
    discard: 'Bỏ thay đổi',
    removeQuestion: (name) => `Xoá "${name}"? Không khôi phục lại được.`,
    storageError: 'Không dùng được bộ nhớ của trình duyệt. Setup chưa được lưu.',
    localOnly: 'Chỉ lưu trên trình duyệt này.',
  },

  compare: {
    with: 'So sánh với',
    empty: 'Hãy lưu một setup trước. Sau đó đổi một thông số rồi quay lại đây để xem trước và sau.',
    saved: 'Đã lưu',
    now: 'Hiện tại',
    openSetup: 'setup đang mở',
    differences: 'Khác nhau ở đâu',
    value: 'Thông số',
    same: 'Hai setup có cùng thông số.',
    note: 'Cả hai cột là kết quả của mô hình, không phải quan sát từ bắn thật.',
  },
}
