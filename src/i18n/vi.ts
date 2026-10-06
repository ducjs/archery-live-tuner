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
    explore: 'Toàn cảnh',
    bow: 'Cung 3D',
    sections: 'Phần của trang',
    section: { setup: 'Setup', result: 'Kết quả', advice: 'Gợi ý' },
    disclaimer:
      'Trình mô phỏng này dùng một mô hình đơn giản hoá về cung recurve và mũi tên. Kết quả dùng để tìm hiểu và hình dung việc tune, không thay cho việc tune thực tế, thông số của nhà sản xuất hay huấn luyện viên.',
    modelOnly:
      'Mọi thứ trên trang này là kết quả của mô hình. Không có gì là quan sát từ bắn thật.',
  },

  parameter: {
    'bow.riserSize': { label: 'Riser', options: { H23: 'H23', H25: 'H25', H27: 'H27' } },
    'bow.limbSize': {
      label: 'Cánh cung',
      hint: 'Theo số ghi trên cánh: chiều dài cung khi lắp vào riser 25 in.',
      options: { '66': '66', '68': '68', '70': '70' },
    },
    'bow.handedness': { label: 'Tay thuận', options: { RH: 'Tay phải', LH: 'Tay trái' } },
    'bow.limbAlignmentTop': {
      label: 'Cánh trên lệch ngang',
      hint: 'Đầu cánh so với đường tâm riser. Âm là lệch trái, dương là lệch phải.',
    },
    'bow.limbAlignmentBottom': {
      label: 'Cánh dưới lệch ngang',
      hint: 'Đầu cánh so với đường tâm riser. Âm là lệch trái, dương là lệch phải.',
    },
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
    size: 'Cỡ cung',
    bowLength: (inches) => `Cung dài ${inches} in`,
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
    decrease: (label) => `Giảm ${label}`,
    increase: (label) => `Tăng ${label}`,
    changed: (count) => `${count} đã đổi`,
    fold: (title) => `Ẩn ${title}`,
    unfold: (title) => `Hiện ${title}`,
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
    grainsPerPound: 'Grains mỗi pound',
    frontOfCenter: 'FOC (trọng tâm lệch về trước)',
    energy: 'Động năng',
    braceOutside: (length, low, high) =>
      `Brace height nằm ngoài khoảng Easton khuyên cho cung ${length} in: ${low} tới ${high} cm.`,
    limbsOff: (shift) =>
      `Cánh cung lệch làm dây lệch theo, tương đương center shot lệch thêm ${shift} mm.`,
    clearanceCycles: 'Số chu kỳ uốn lúc đuôi tên qua cung',
    tooLight: (grainsPerPound, minimum) =>
      `Mũi tên này quá nhẹ so với lực kéo: ${grainsPerPound} gr/lb, dưới mức ${minimum} gr/lb mà các hãng cung thường đặt làm tối thiểu. Bắn tên quá nhẹ thì cung chịu tải gần như bắn khan. Hãy xem giới hạn của hãng làm cung.`,
    note: 'Mô hình đơn giản hoá, chưa đối chiếu với bắn thật. Hãy thử trên cung của bạn trước khi đổi thiết bị.',
    showGauges: 'Xem các thước đo',
    hideGauges: 'Ẩn các thước đo',
    reading: {
      matched: 'Tên hợp với cung.',
      little: { WEAK: 'Tên hơi yếu.', STIFF: 'Tên hơi cứng.' },
      clearly: { WEAK: 'Tên yếu rõ.', STIFF: 'Tên cứng rõ.' },
      nock: {
        NOCK_HIGH: 'Nocking point đang quá cao.',
        NOCK_LOW: 'Nocking point đang quá thấp.',
      },
      clearance: 'Tên dễ chạm cung lúc rời dây.',
      oscillation: 'Tên lắc nhiều trước khi ổn định.',
    },
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
    viewNames: { top: 'Nhìn từ trên', side: 'Nhìn từ bên', both: 'Hai góc nhìn' },
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
    options: 'Tùy chọn hiển thị',
    hideDrawing: 'Ẩn hình vẽ',
    showDrawing: 'Hiện hình vẽ',
    summary: (view, distance, impact) => `${view}, ${distance} m, ${impact.toLowerCase()} chạm.`,
    notToScale: 'Không theo tỉ lệ.',
    about: 'Về hình vẽ này',
    amplify: 'Phóng đại',
    realSpeed: 'Tốc độ thật.',
    slowed: (times) => `Chậm ${times} lần.`,
    amplified: {
      one: {
        top: 'Độ uốn và độ lệch của bareshaft được phóng đại.',
        side: 'Góc của tên và độ lệch của bareshaft được phóng đại.',
        both: 'Độ uốn, góc của tên và độ lệch của bareshaft được phóng đại.',
      },
      two: {
        top: 'Độ uốn và độ lệch được phóng đại.',
        side: 'Góc của tên và độ lệch được phóng đại.',
        both: 'Độ uốn, góc của tên và độ lệch được phóng đại.',
      },
    },
    landing: {
      one: 'Cung, mũi tên, cự ly và độ lệch mỗi thứ vẽ theo một tỉ lệ riêng. Tên có cánh được coi là đã chỉnh thước vào tâm.',
      two: 'Cung, mũi tên, cự ly và độ lệch mỗi thứ vẽ theo một tỉ lệ riêng. Mỗi mũi tên cắm đúng chỗ mô hình tính, thước ngắm để nguyên.',
    },
    topViewLabel: (stiffness, oscillation, lateral) =>
      `Tên bay từ cung tới bia, nhìn từ trên. Độ cứng động: ${stiffness}. Dao động: ${oscillation}. Lệch ngang: ${lateral}.`,
    sideViewLabel: (vertical) => `Tên bay từ cung tới bia, nhìn từ bên. Tên rời cung: ${vertical}.`,
    level: 'cân',
  },

  viewer: {
    views: 'Góc nhìn',
    equipment: 'Thiết bị',
    focus: {
      bow: 'Cả cây cung',
      front: 'Từ phía bia',
      top: 'Từ trên xuống',
      alongString: 'Dọc theo dây',
    },
    part: {
      limbs: 'Cánh cung',
      string: 'Dây',
      nockingPoint: 'Nocking point',
      rest: 'Rest',
      plunger: 'Plunger',
      arrow: 'Mũi tên',
      stabilizer: 'Stabilizer',
    },
    goTo: (label) => `Bấm để chỉnh: ${label}`,
    drawn: 'Kéo hết dây',
    notDrawn:
      'Không có gì để vẽ cho lực kéo, spine, khối lượng thân tên, độ cứng plunger, khối lượng dây, độ khít nock, khối lượng cung, hay khối lượng insert, nock và cánh: chúng đổi cách tên bay, không đổi vị trí bộ phận nào.',
    amplify: (times) => `Vẽ độ lệch lớn gấp ${times} lần`,
    about:
      'Cây cung đi theo setup. Đổi một thông số thì camera bay tới bộ phận đó và ghi giá trị ngay tại chỗ. Bấm vào một bộ phận trên cung, hoặc nút của thiết bị đó, để tới thanh trượt của nó. Kéo để xoay cung, cuộn hoặc chụm ngón để phóng to. Đường vàng đứt là đường dây khi nhìn từ trên, và là đường vuông góc với dây khi nhìn từ bên. Các độ lệch vài mm khó thấy ở tỉ lệ thật; bật công tắc để vẽ lớn hơn. Nhãn luôn ghi giá trị thật. Cây cung là hình đơn giản hoá, không phải thiết bị của bạn.',
    loading: 'Đang tải hình 3D.',
    failed:
      'Hình 3D không chạy được ở đây: nó cần WebGL, mà trình duyệt hoặc thiết bị này đang tắt. Dưới đây là hình vẽ phẳng thay thế.',
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

  explore: {
    landscape: 'Thân tên và point nào hợp với cung này',
    landscapeIntro:
      'Mọi cặp spine và point weight, các thông số khác giữ nguyên như setup đang mở. Bấm một ô để đưa cặp đó vào setup.',
    landscapeCaption: (unit) =>
      `Độ cứng động theo spine (hàng) và point weight tính bằng ${unit} (cột)`,
    axes: (unit) => `Spine \\ ${unit}`,
    cell: (spine, pointWeight, rating) => `Spine ${spine}, point ${pointWeight}: ${rating}`,
    letter: { WEAK: 'Y', NEUTRAL: 'TT', STIFF: 'C' },
    sensitivity: 'Thông số nào ảnh hưởng mạnh nhất',
    sensitivityIntro:
      'Độ yếu / cứng đổi bao nhiêu khi tăng một thông số thêm một phần mười khoảng cho phép. Thanh dài nhất là thứ nên xem trước với setup này.',
    weaker: 'làm tên yếu hơn',
    stiffer: 'làm tên cứng hơn',
    effect: (weaker, amount) => `${weaker ? 'yếu hơn' : 'cứng hơn'} ${amount}`,
  },

  transfer: {
    heading: 'Chia sẻ và sao lưu',
    copyLink: 'Chép link tới setup này',
    link: 'Link tới setup này',
    copied: 'Đã chép link.',
    copyByHand: 'Trình duyệt không cho chép. Hãy chọn link và chép bằng tay.',
    linkNote:
      'Link chứa đủ mọi giá trị của setup đang mở, nên mở trên máy nào cũng ra y như vậy. Không có gì được gửi lên máy chủ.',
    exportFile: 'Xuất ra file',
    importFile: 'Nhập từ file',
    chooseFile: 'File setup cần nhập',
    fileName: 'recurve-setups.json',
    exported: (count) => `Đã ghi ${count} setup vào file.`,
    imported: (added, known, invalid) =>
      [
        `Đã thêm ${added} setup.`,
        known > 0 ? `${known} cái đã có sẵn.` : '',
        invalid > 0 ? `${invalid} cái không đọc được.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    notAFile: 'File này không chứa setup của ứng dụng này.',
    fileNote:
      'File chứa các setup đã lưu và setup đang mở. Nhập file chỉ thêm setup, không bao giờ ghi đè setup đã lưu.',
    offered: (name) => `Link này mang theo một setup: ${name}`,
    replaces: 'Mở nó sẽ thay setup đang mở. Hãy lưu setup của bạn trước nếu muốn giữ.',
    openShared: 'Mở setup này',
    notNow: 'Để sau',
    unreadable: 'Link này không chứa setup nào đọc được.',
    dismiss: 'Đóng',
  },

  compare: {
    with: 'So sánh với',
    empty: 'Hãy lưu một setup trước. Sau đó đổi một thông số rồi quay lại đây để xem trước và sau.',
    saved: 'Đã lưu',
    now: 'Hiện tại',
    openSetup: 'setup đang mở',
    differences: 'Khác nhau ở đâu',
    value: 'Thông số',
    upTo: (most) => `(tối đa ${most})`,
    same: 'Hai setup có cùng thông số.',
    sameAll: 'Các setup này có cùng thông số.',
    note: 'Cả hai cột là kết quả của mô hình, không phải quan sát từ bắn thật.',
    noteAll: 'Mọi cột đều là kết quả của mô hình, không phải quan sát từ bắn thật.',
  },
}
