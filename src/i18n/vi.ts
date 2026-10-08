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
    level: 'Mức',
    levels: { simple: 'Cơ bản', advanced: 'Nâng cao', pro: 'Chuyên nghiệp' },
    settings: 'Cài đặt',
    workspaces: 'Màn hình làm việc',
    workspace: { setup: 'Setup', fly: 'Tên bay', target: 'Bia thật', analysis: 'Phân tích' },
  },

  simulator: {
    title: 'Mô phỏng tune cung recurve',
    intro: 'Đổi một thông số và xem mũi tên rời cung thế nào.',
    show: 'Hiển thị',
    flight: 'Tên bay',
    compare: 'So sánh',
    explore: 'Toàn cảnh',
    bow: 'Cung 3D',
    target: 'Bia',
    sections: 'Phần của trang',
    section: { setup: 'Setup', result: 'Kết quả', advice: 'Gợi ý' },
    analysisShow: 'Phân tích',
    raiseLevel: (level) => `Chuyển sang ${level}`,
    nextStep: 'Việc nên làm tiếp',
    openSimulation: 'Mở màn hình mô phỏng',
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
    'bow.drawForceNear': {
      label: 'Lực ở trước full draw 2 in',
      hint: 'Đọc từ cân cung, ở đúng brace height của setup này. 0 nghĩa là chưa đo.',
    },
    'bow.drawForceMid': {
      label: 'Lực ở trước full draw 8 in',
      hint: 'Số đo thứ hai, chỉ dùng khi đã có số đo thứ nhất. 0 nghĩa là chưa đo.',
    },
    'bow.drawCurve': {
      label: 'Đường lực kéo',
      hint: 'Ước lượng lực tăng thế nào trong lúc kéo. Mức chuẩn hợp với phần lớn limb recurve.',
      options: { STRAIGHT: 'Thẳng', STANDARD: 'Chuẩn', FULL: 'Đầy giữa hành trình' },
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
    'arrow.fletchingHeight': { label: 'Chiều cao cánh', hint: 'Cánh nhô khỏi thân tên bao nhiêu.' },
    'arrow.fletchingPosition': {
      label: 'Cánh cách nock',
      hint: 'Từ rãnh nock tới giữa cánh.',
    },
    'arrow.pointLength': {
      label: 'Point nhô khỏi thân',
      hint: 'Phần point thò ra ngoài đầu thân tên.',
    },
  },

  panels: {
    detail: 'Mức chi tiết',
    simple: 'Cơ bản',
    advanced: 'Nâng cao',
    size: 'Cỡ cung',
    bowLength: (inches) => `Cung dài ${inches} in`,
    bow: 'Cung',
    arrow: 'Tên',
    curve: 'Lực kéo tự đo',
    groups: {
      bow: 'Cung',
      tuning: 'Điều chỉnh',
      arrow: 'Tên',
      string: 'Dây',
      balance: 'Cân bằng',
    },
    hiddenChanged: (count) =>
      `${count} thông số ở mức cao hơn đã đổi và vẫn ảnh hưởng tới kết quả.`,
    assuming: (count) => `Đang giả định ${count} thông số khác`,
    search: 'Tìm thông số',
    searchNone: 'Không có thông số nào tên như vậy.',
    preview: 'Xem trước',
    previews: { bow: 'Cung 3D', top: 'Từ trên', side: 'Từ bên', off: 'Tắt' },
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
    focOutside: (foc, low, high, above) =>
      `FOC ${foc} % nằm ${above ? 'trên' : 'dưới'} khoảng ${low} tới ${high} % mà sách Easton ghi cho tên bắn bia. Đây là khoảng để bắt đầu, không phải giới hạn: nó ảnh hưởng tới cách tên bay ở cự ly xa.`,
    energy: 'Động năng',
    braceOutside: (length, low, high) =>
      `Brace height nằm ngoài khoảng Easton khuyên cho cung ${length} in: ${low} tới ${high} cm.`,
    limbsOff: (shift) =>
      `Cánh cung lệch làm dây lệch theo, tương đương center shot lệch thêm ${shift} mm.`,
    clearanceCycles: 'Số chu kỳ uốn lúc đuôi tên qua cung',
    tooLight: (grainsPerPound, minimum) =>
      `Mũi tên này nhẹ so với lực kéo: ${grainsPerPound} gr/lb, dưới mức ${minimum} gr/lb mà các hãng cung thường yêu cầu. Bắn tên quá nhẹ thì cung chịu tải gần như bắn khan. Hãy xem giới hạn của hãng làm cung.`,
    belowMinimum: (arrow, minimum) =>
      `Mũi tên này nặng ${arrow} gr, dưới mức ${minimum} gr mà bảng AMO ghi là thấp nhất cho recurve ở lực kéo và draw length này. Bắn tên nhẹ hơn mức đó có thể làm gãy cung. Hãy dùng tên nặng hơn.`,
    note: 'Mô hình đơn giản hoá, chưa đối chiếu với bắn thật. Hãy thử trên cung của bạn trước khi đổi thiết bị.',
    showGauges: 'Xem các thước đo',
    hideGauges: 'Ẩn các thước đo',
    tabsLabel: 'Chi tiết kết quả',
    tabs: {
      gauges: 'Thước đo',
      bareShaft: 'Bareshaft',
      paper: 'Xé giấy',
      numbers: 'Số liệu',
      curve: 'Đường lực kéo',
    },
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

  curve: {
    marked: {
      open: 'Tôi chỉ biết số ghi trên limb',
      weight: 'Số ghi trên limb, lb',
      bolts: 'Limb bolt',
      bolt: { OUT: 'Nới ra hết', MIDDLE: 'Ở giữa', IN: 'Vặn vào hết' },
      estimate: (weight: string, length: string) =>
        `Khoảng ${weight} trên ngón tay ở chiều dài kéo ${length} của bạn.`,
      outOfRange: 'Số này nằm ngoài khoảng lực kéo mà ứng dụng nhận.',
      use: 'Dùng làm lực kéo',
      note: 'Chỉ là ước lượng: 5% mỗi inch tính từ 28 in, và 5% mỗi chiều cho limb bolt. Cân cung ở full draw thì chính xác hơn. Chiều dài kéo ở đây là AMO: từ nocking point tới pivot point của grip, cộng 1.75 in.',
    },
    notMeasured: 'Chưa đo',
    compared: 'Nét liền là setup đang mở; nét đứt là các setup đã lưu.',
    heading: 'Đường lực kéo',
    chart: (weight: string, length: string) =>
      `Lực trên ngón tay trong lúc kéo, đạt ${weight} ở ${length}.`,
    drawAxis: (unit: string) => `Chiều dài kéo, ${unit}`,
    forceAxis: (unit: string) => `Lực, ${unit}`,
    clicker: 'Clicker',
    storedEnergy: 'Năng lượng tích trong cung',
    gain: 'Lực tăng ở clicker',
    perLength: (value: string, force: string, length: string) => `${value} ${force} mỗi ${length}`,
    reading: {
      USUAL: 'Ngang mức thường gặp ở recurve gần full draw: 5% lực kéo mỗi inch.',
      GENTLER: 'Nhẹ hơn mức 5% mỗi inch thường gặp ở recurve gần full draw.',
      STEEPER: 'Dốc hơn mức 5% mỗi inch thường gặp ở recurve gần full draw.',
    },
    estimated:
      'Ước lượng từ cỡ cung và kiểu đường cong. Đây không phải đường lực kéo của chính bộ limb của bạn.',
    measured: (points: number) => `Dựng từ ${points} số đo trên cân cung của bạn.`,
    measureAgain:
      'Số đo chỉ đúng với một lực kéo, một chiều dài kéo và một brace height. Đổi một trong ba thì phải đo lại.',
    notUsed:
      'Các số đo đã nhập không khớp với một đường lực kéo, nên đang hiện đường ước lượng. Lực ở trước full draw 2 in phải nhỏ hơn lực kéo, lực ở trước 8 in phải nhỏ hơn nữa; số đo thứ hai chỉ dùng khi đã có số đo thứ nhất.',
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

  target: {
    heading: 'Đọc bia',
    realWorld: 'Từ mũi tên thật của bạn trên bia. Không phải kết quả của mô hình.',
    faceLabel: (cm, fletched, bare) =>
      `Mặt bia ${cm} cm, đã chấm ${fletched} tên có cánh và ${bare} bareshaft. Bấm vào chỗ mũi tên cắm để chấm.`,
    how: 'Bắn tên có cánh và bareshaft vào cùng một điểm ngắm, rồi bấm vào chỗ từng mũi cắm.',
    keyboardLabel:
      'Mặt bia. Phím mũi tên dời con trỏ, giữ Shift để dời từng chút, Enter để chấm một mũi tên.',
    cursor: (x, y) =>
      `Con trỏ cách tâm ${(Math.abs(x) / 10).toFixed(1)} cm về bên ${x < 0 ? 'trái' : 'phải'}, ${(Math.abs(y) / 10).toFixed(1)} cm ${y < 0 ? 'phía dưới' : 'phía trên'}.`,
    kind: 'Mũi sắp chấm',
    fletched: 'Có cánh',
    bare: 'Bareshaft',
    distance: 'Cự ly',
    face: 'Mặt bia',
    end: (end, arrows) => `Lượt ${end}: đã chấm ${arrows} mũi`,
    nextEnd: 'Lượt kế',
    removeLast: 'Bỏ mũi vừa chấm',
    clear: 'Xoá hết',
    need: (fletched, bare, haveFletched, haveBare) =>
      `Cần ít nhất ${fletched} tên có cánh và ${bare} bareshaft mới đọc được. Đã chấm: ${haveFletched} có cánh, ${haveBare} bareshaft.`,
    inconclusive: 'Chưa kết luận được.',
    inconclusiveWhy:
      'Bareshaft lệch khỏi cụm tên có cánh chưa nhiều hơn độ tản của chính cụm đó, hoặc chưa nhiều hơn mức một bareshaft tự lệch ở cự ly này. Bắn thêm vài lượt, hoặc bắn gần hơn.',
    offset: 'Bareshaft lệch khỏi cụm có cánh',
    offsetValue: (cm, clock) => `${cm} cm, hướng ${clock} giờ`,
    spread: 'Độ tản của cụm có cánh',
    counted: 'Số mũi đã tính',
    countedValue: (fletched, bare) => `${fletched} có cánh, ${bare} bareshaft`,
    modelAgrees: 'Mô hình cũng đọc setup bạn nhập như vậy.',
    modelDiffers:
      'Mô hình không đọc setup bạn nhập như vậy. Khác biệt có thể đến từ cách thả dây, hoặc từ một giá trị trên cung không đúng như đã nhập. Hãy chỉnh trên cung trước khi nghĩ tới đổi tên.',
    stepsHeading: 'Nên thử, theo thứ tự này',
    why: {
      centerShot:
        'Đầu tên đang đặt lệch về phía khiến bareshaft đi đúng như trên bia. Đặt lại trước khi chỉnh bất cứ thứ gì khác.',
      nockingPoint: 'Lên xuống làm trước: nó làm đổi cách đọc trái phải.',
      plunger: 'Plunger là thứ chỉnh đầu tiên cho trái phải. Mỗi lần vặn một phần tám vòng.',
      point: (cm, meters) =>
        `Lệch ngang quá khoảng ${cm} cm ở ${meters} m thì plunger thường không kéo về nổi.`,
      drawWeight:
        'Khi point chưa kéo được bareshaft về. Vặn hai limb bolt bằng nhau, từ nửa vòng tới một vòng.',
      shaft: (cm, meters) =>
        `Nếu đã làm hết các bước trên mà bareshaft vẫn lệch ngang quá ${cm} cm ở ${meters} m, sách Easton coi là thân tên không hợp với cung.`,
    },
    save: 'Lưu thành quan sát',
    saveHint: 'Giữ lại bia này cùng các giá trị của setup đang mở.',
    saved: 'Đã lưu cùng setup đang mở.',
    nowLive: 'Trong trang Simulator: chọn "Bia" ở mục Hiển thị.',
  },

  observation: {
    heading: 'Quan sát thực tế',
    intro:
      'Điều bạn thấy khi bắn setup này, để riêng với điều mô hình nói. Mỗi lần ghi giữ lại các giá trị của setup lúc đó.',
    failed: 'Trình duyệt không cho lưu hoặc đọc các quan sát.',
    formHeading: 'Ghi điều bạn thấy',
    labels: {
      stiffness: 'Tên phản ứng thế nào',
      bareHorizontal: 'Bareshaft, trái phải',
      bareVertical: 'Bareshaft, lên xuống',
      lateral: 'Cụm tên có cánh hay lệch về đâu',
      oscillation: 'Tên lắc khi bay',
      clearance: 'Dấu hiệu tên chạm cung',
    },
    values: {
      stiffness: { WEAK: 'Yếu', NEUTRAL: 'Hợp', STIFF: 'Cứng' },
      bareHorizontal: { LEFT: 'Bên trái cụm', TOGETHER: 'Chung cụm', RIGHT: 'Bên phải cụm' },
      bareVertical: { HIGH: 'Cao hơn cụm', TOGETHER: 'Ngang cụm', LOW: 'Thấp hơn cụm' },
      lateral: { LEFT: 'Sang trái', NEUTRAL: 'Đúng hướng', RIGHT: 'Sang phải' },
      oscillation: { LOW: 'Ít', MEDIUM: 'Vừa', HIGH: 'Nhiều' },
      clearance: { LOW: 'Không thấy', MEDIUM: 'Có thể có', HIGH: 'Có vết rõ' },
    },
    notNoted: 'Không ghi',
    notes: 'Ghi chú',
    save: 'Lưu quan sát',
    saveHint: 'Hãy ghi ít nhất một điều, hoặc viết một ghi chú.',
    saved: 'Đã lưu.',
    listHeading: (count) => `Đã ghi cho setup này (${count})`,
    none: 'Chưa có gì. Hãy lưu một bia, hoặc ghi điều bạn thấy ở trên.',
    fromTarget: (meters) => `Đọc từ bia ở ${meters} m`,
    byHand: 'Ghi tay',
    what: 'Điều được ghi',
    seenColumn: 'Bạn thấy',
    modelColumn: 'Mô hình nói',
    same: '(giống)',
    differs: '(khác)',
    agrees: (matches, total) => `Mô hình khớp ${matches} trên ${total} điều.`,
    remove: 'Xoá',
    removeLabel: (when) => `Xoá quan sát lúc ${when}`,
    export: 'Xuất tất cả quan sát',
    exportHint: (count) => `${count} quan sát trong trình duyệt này, tính mọi setup.`,
    exported: (count) => `Đã ghi ${count} quan sát ra file.`,
    fileName: 'recurve-observations.json',
  },

  sight: {
    heading: 'Vạch thước ngắm',
    intro:
      'Nhập các vạch bạn đã có, đúng như bạn đọc trên thước của mình. Mô hình khớp thước của bạn với các vạch đó rồi cho vạch khởi đầu ở các cự ly còn lại.',
    distance: 'Cự ly',
    yours: 'Vạch của bạn',
    predicted: 'Mô hình',
    range: 'Nhiều khả năng trong khoảng',
    markAt: (meters) => `Vạch thước ngắm của bạn ở ${meters} m`,
    between: (low, high) => `${low} tới ${high}`,
    outOfReach: 'Không tới',
    need: (marks) =>
      `Hãy nhập vạch của ít nhất ${marks} cự ly. Hai vạch đủ để xác định thước; từ ba vạch trở lên, vận tốc tên cũng được suy ra từ chúng.`,
    confirm:
      'Vạch mô hình đưa ra chỉ là chỗ bắt đầu, cần bắn để chỉnh lại. Cự ly càng xa các cự ly bạn đã bắn thì khoảng càng rộng.',
    poorFit: (miss) =>
      `Các vạch của bạn không nằm trên cùng một đường: có vạch lệch ${miss}. Hãy kiểm lại, và chắc rằng tất cả đều bắn với setup này.`,
    modelSpeed: 'Vận tốc tên do mô hình ước lượng',
    impliedSpeed: 'Vận tốc tên suy ra từ vạch của bạn',
    tooFew: 'Cần ba vạch',
    speedNote: (low, high) =>
      `Đây là ước lượng thô: nó dựa vào khoảng cách từ mắt bạn tới mũi tên. Lệch hai centimet thì nó nằm trong khoảng ${low} tới ${high} m/s.`,
    eyeHeight: 'Mắt cao hơn mũi tên lúc anchor',
    eyeHeightHint:
      'Đo từ mũi tên lên tới mắt ngắm, khi kéo hết. Khoảng 11 cm với anchor dưới cằm. Con số này ảnh hưởng nhiều nhất ở cự ly gần.',
    save: 'Lưu thành quan sát',
    saveHint: 'Giữ lại các vạch này cùng giá trị của setup đang mở.',
    saved: 'Đã lưu cùng setup đang mở.',
    limits:
      'Vạch chỉ đúng cho một setup: đổi tên, đổi lực kéo, đổi anchor hay đổi cần thước ngắm thì vạch cũ hết dùng được. Gió, nhiệt độ và độ cao so với mặt biển không được tính.',
    onBowHeading: 'Khoảng hở dưới đầu ngắm',
    onBowIntro:
      'Bia càng xa thì đầu ngắm càng hạ thấp, tiến dần về phía mũi tên. Phần này không cần vạch: nó suy ra từ anchor, thước ngắm và vận tốc tên của bạn.',
    extension: 'Đầu ngắm cách riser về phía trước',
    pinDiameter: 'Vòng ngắm, đường kính ngoài',
    pinAbove: 'Đầu ngắm cao hơn mũi tên',
    room: 'Khoảng hở cho cánh',
    clear: (cm) => `${cm} cm`,
    close: (cm) => `Sát: ${cm} cm`,
    blocked: 'Không còn: cánh sẽ chạm đầu ngắm',
    blockedAdvice:
      'Ở cự ly không còn khoảng hở, hãy đưa đầu ngắm lại gần riser bằng cần ngắn hơn, hoặc anchor thấp hơn. Cả hai đều nâng đầu ngắm ra xa mũi tên.',
    drawOnBow: 'Vẽ thước ngắm trên cung ở góc nhìn ngang',
    onBowLimits:
      'Mắt được coi là nằm ngay trên nock. Chiều cao cánh lấy theo giá trị đã nhập cho tên, ở Nâng cao. Lúc đi qua đầu ngắm tên vẫn chưa ổn định, nên khoảng hở dưới một centimet được gọi là sát.',
    sightLabel: {
      clear: 'Đầu ngắm cách xa mũi tên.',
      close: 'Đầu ngắm nằm sát mũi tên.',
      blocked: 'Đầu ngắm chắn đường mũi tên.',
    },
    kept: 'Vạch thước ngắm',
    keptMark: (meters, mark) => `${meters} m: ${mark}`,
    keptSpeed: (implied, model) => `Vạch cho ra ${implied} m/s; mô hình ước lượng ${model} m/s.`,
  },

  calibration: {
    heading: 'Chỉnh mô hình theo bạn',
    intro:
      'Tìm xem với bạn và cây cung của bạn thì "hợp" và "cân" nằm ở đâu, từ các quan sát bạn đã lưu. Chỉ các điểm đó dịch chuyển; mỗi giá trị tác động mạnh yếu ra sao thì giữ như mô hình gốc.',
    fit: 'Dò từ quan sát của tôi',
    fitAgain: 'Dò lại',
    have: (count) => `${count} quan sát trong trình duyệt này.`,
    tooFew: (least) =>
      `Cần ít nhất ${least} quan sát có ghi tên phản ứng thế nào hoặc bareshaft rơi ở đâu.`,
    fitted: 'Đã dò xong và đã bật.',
    noBetter:
      'Không có dịch chuyển nào khớp với điều bạn thấy nhiều hơn mô hình gốc, nên vẫn dùng mô hình gốc.',
    fittedAt: (when, used) => `Dò lúc ${when}, từ ${used} quan sát.`,
    nothingMoved:
      'Không có gì dịch chuyển: mô hình gốc đã đọc các setup của bạn đúng như bạn thấy.',
    weaker: (steps) => `Tên của bạn bắn yếu hơn mô hình gốc nghĩ, khoảng ${steps} bước spine 50.`,
    stiffer: (steps) => `Tên của bạn bắn cứng hơn mô hình gốc nghĩ, khoảng ${steps} bước spine 50.`,
    nockHigher: (mm) => `Nocking point của bạn cân ở mức cao hơn ${mm} mm.`,
    nockLower: (mm) => `Nocking point của bạn cân ở mức thấp hơn ${mm} mm.`,
    centerRight: (mm) => `Center shot của bạn cân ở ${mm} mm về bên phải.`,
    centerLeft: (mm) => `Center shot của bạn cân ở ${mm} mm về bên trái.`,
    agreement: (before, after, total) =>
      `Trong ${total} điều bạn đã ghi, mô hình gốc khớp ${before}, mô hình đã chỉnh khớp ${after}.`,
    use: 'Dùng mô hình đã chỉnh',
    forget: 'Bỏ kết quả dò',
    usingPersonal: 'Kết quả trên trang này đang tính bằng mô hình đã chỉnh theo bạn.',
    usingBase: 'Kết quả trên trang này đang tính bằng mô hình gốc.',
    limits:
      'Kết quả dò chỉ tốt bằng các quan sát đứng sau nó. Nó không phân biệt được tên yếu với center shot lệch, trừ khi bạn ghi cả việc tên phản ứng thế nào, hoặc đã bắn vài setup khác nhau.',
    active: 'Đã chỉnh theo quan sát của bạn, không phải mô hình gốc.',
  },

  plan: {
    heading: 'Cả buổi tune',
    intro:
      'Các gợi ý làm nối tiếp nhau: mỗi bước bắt đầu từ kết quả của bước trước. Mỗi giá trị chỉ đổi một lần, rồi tới lượt cách chỉnh kế tiếp.',
    tuned: (steps) => `Sau ${steps} bước này, mô hình đọc setup là đã cân.`,
    notTuned: (steps) =>
      `Sau ${steps} bước này, mô hình vẫn chưa đọc setup là đã cân. Cần thay đổi lớn hơn mức gợi ý đưa ra mỗi lần, nhiều khả năng là đổi thân tên.`,
    apply: 'Thử tất cả',
    applyHint: 'Đặt mọi giá trị của chuỗi này lên setup đang mở.',
    nowLive: 'Trong trang Simulator, dưới phần gợi ý tune.',
  },

  paperTear: {
    heading: 'Bài thử xé giấy',
    clean: 'Point và cánh đi qua cùng một lỗ.',
    above: 'cao hơn',
    below: 'thấp hơn',
    left: 'lệch trái',
    right: 'lệch phải',
    tearing: (where) => `Vết cánh rách ${where.join(' và ')} so với lỗ của point.`,
    clearance:
      'Tên chạm cung cũng làm giấy rách kiểu này, và ở setup này mô hình thấy có nguy cơ đó: có thể tên đang chạm cung lúc rời đi.',
    note: 'Bắn một mũi tên có cánh qua tờ giấy từ 1,2 tới 1,8 m, nhìn từ vạch bắn. Khi lỗ đã gọn, lùi thêm 1,8 m và bắn lại.',
    figure: (tearing) => `Tờ giấy sau phát bắn. ${tearing}`,
  },

  suggestions: {
    heading: 'Gợi ý tune',
    tuned: 'Mô hình đọc setup này là đã cân. Không có gì cần gợi ý.',
    tunedSlightlyOff:
      'Bareshaft rơi hơi thấp hoặc hơi lệch về phía cứng so với tên có cánh. Cung đã cân tốt thường như vậy, nên mô hình để yên.',
    none: 'Không có thay đổi đơn lẻ nào trong tầm chỉnh cải thiện được nhiều. Thử thân tên khác, hoặc đổi nhiều hơn một bước.',
    intro:
      'Mỗi nhóm xếp theo thứ tự sách tuning vẫn làm: chỉnh lên xuống trước, rồi trái phải bằng plunger, point, lực kéo, và sau cùng mới đổi thân tên. Mỗi gợi ý là một thay đổi riêng lẻ tính từ setup hiện tại, nên hãy thử một cái rồi xem lại danh sách.',
    groups: {
      adjust: { title: 'Chỉnh trực tiếp', about: 'Chỉnh ngay trên cung. Không phải mua gì.' },
      equipment: { title: 'Thiết bị', about: 'Đổi một bộ phận của tên, hoặc đổi tên.' },
    },
    emptyGroup: 'Nhóm này không có thay đổi nào giúp được nhiều.',
    tryIt: 'Thử',
    tryLabel: (action) => `Thử: ${action}`,
    more: 'Các gợi ý khác',
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
      riser: 'Riser',
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
      'Không có gì để vẽ cho lực kéo, spine, khối lượng thân tên, độ cứng plunger, khối lượng dây, độ khít nock, đường lực kéo, khối lượng cung, hay khối lượng insert, nock và cánh: chúng đổi cách tên bay, không đổi vị trí bộ phận nào.',
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
    menu: 'Các setup',
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
