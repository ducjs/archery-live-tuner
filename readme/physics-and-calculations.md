# Vật lý và tính toán của mô hình

Tài liệu này gom mọi công thức, hằng số và quy ước mà ứng dụng đang dùng để tính, lấy từ code trong `src/engine/` (phiên bản mô hình `heuristic-0.1`). Đặc tả gốc nằm ở [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md); số mục (§) bên dưới trỏ về đó.

Khi code và tài liệu này khác nhau thì code đúng. Sửa công thức hoặc hệ số trong engine thì sửa luôn ở đây.

> **Nói đơn giản:** Mô hình trả lời bốn câu hỏi: tên yếu hay cứng, lắc nhiều hay ít, lệch trái hay phải, có dễ chạm cung không. Chỉ ba chỗ dựa trên vật lý thật: độ cứng uốn của thân tên, tần số rung của nó, và vận tốc rời cung. Phần còn lại là hệ số ước chừng, chỉnh sao cho bộ setup tham chiếu ra "cân" và mọi thay đổi đi đúng hướng người bắn vẫn quen.

## 1. Cái gì là vật lý, cái gì là ước chừng

| Phần | Cơ sở | Ghi chú |
|---|---|---|
| Độ cứng uốn `EI` từ spine | Vật lý | Suy thẳng từ định nghĩa phép thử spine |
| Tần số uốn của thân tên trần | Vật lý | Dầm tự do hai đầu, mode 1 |
| Hiệu chỉnh tần số cho point và nock | Ước chừng | Một hệ số duy nhất |
| Năng lượng tích trữ, vận tốc rời cung | Vật lý đơn giản | Cân bằng năng lượng với khối lượng ảo; hai hằng số là ước chừng |
| Đường bay dọc (cung đạn đạo) | Vật lý | Có lực cản không khí; hệ số cản là ước chừng |
| Spine cần thiết, weak / stiff | Ước chừng | Luật lũy thừa quanh setup tham chiếu |
| Dao động, lệch ngang, lệch dọc, clearance | Ước chừng | Tổng có trọng số, chuẩn hóa về thang 0..1 hoặc −1..+1 |
| Độ trôi ngang / dọc trên đường bay | Minh họa | Không phải vị trí trúng bia |

Chưa hệ số nào được kiểm chứng bằng dữ liệu bắn thật. Kết quả là xu hướng, không phải số đo (§2.1).

## 2. Đơn vị và quy ước dấu

Đơn vị nội bộ, dùng ở mọi nơi trong engine:

| Đại lượng | Đơn vị | Đổi |
|---|---|---|
| Chiều dài | mm | 1 in = 25.4 mm |
| Khối lượng | g | 1 gr (grain) = 0.06479891 g |
| Lực | N | 1 lbf = 4.4482216152605 N; 1 kgf = 9.80665 N |
| Góc | rad | |
| Thời gian | s | |
| Khối lượng theo chiều dài | g/mm | 1 gpi = 0.06479891 / 25.4 g/mm. Số g/mm bằng đúng số kg/m |
| Spine | số ghi trên thân tên | 700 nghĩa là võng 0.700 in |
| Độ cứng plunger | không thứ nguyên | 0 rất mềm, 1 trung bình, 2 rất cứng |

Quy ước dấu:

- Trục: `x` dọc đường bắn, `y` thẳng đứng (dương là lên), `z` ngang (âm là trái, dương là phải).
- Center shot: âm là trái, dương là phải, tính từ đường dây.
- `dynamicBehavior`: −1 rất yếu, 0 cân, +1 rất cứng.
- `lateralDeviation`: −1 lệch hẳn trái, +1 lệch hẳn phải.
- `verticalTendency`: −1 nock quá thấp, +1 nock quá cao.
- Tay thuận: mô hình tính trong hệ tay phải (riser nằm bên phải mũi tên). Với `side = +1` cho RH, `−1` cho LH, center shot được nhân `side` trước khi tính, và độ lệch ngang được nhân `side` sau khi tính. Đổi RH sang LH chỉ lật dấu ngang, không đổi gì khác (§25 Test 6).

## 3. Chuỗi tính

```text
setup (bow + arrow)
  ├─ thân tên:  khối lượng → EI → tần số uốn
  ├─ cung:      power stroke → năng lượng → vận tốc rời cung, quán tính cung
  ├─ spine cần thiết → độ lệch độ cứng (log) + plunger → dynamicBehavior
  ├─ flexAmplitude, oscillation, lateralDeviation, verticalTendency, clearanceRisk
  ├─ phân loại theo ngưỡng (WEAK / NEUTRAL / STIFF ...)
  └─ đường bay: cung đạn đạo + trôi + lắc + uốn theo thời gian
```

`analyze()` dừng trước bước đường bay, đủ rẻ để chạy trên cả lưới setup. `simulate()` thêm đường bay. `compareBareShaft()` chạy `simulate()` hai lần, có cánh và không cánh.

## 4. Mũi tên

### 4.1 Khối lượng

```text
m_thân   = shaftGpi · length
m_trước  = pointWeight + insertWeight
m_sau    = nockWeight + fletchingWeight
m_tổng   = m_thân + m_trước + m_sau
```

`length` là từ rãnh nock tới cuối thân tên, không tính point.

### 4.2 Độ cứng uốn từ spine (vật lý, §34.1)

Phép thử spine: thân tên gác trên hai gối cách nhau 28 in, treo tải 1.94 lbf ở giữa, độ võng tính bằng phần nghìn inch chính là số spine. Dầm gác hai đầu chịu tải giữa nhịp có độ võng `δ = F·L³ / (48·EI)`, nên:

```text
EI = F · L³ / (48 · δ)

F = 1.94 lbf = 8.6296 N
L = 28 in    = 0.7112 m
δ = (spine / 1000) · 0.0254 m
```

`EI` tỉ lệ nghịch với số spine. Spine 700 cho `EI ≈ 3.64 N·m²`; spine 500 cho `≈ 5.09 N·m²`.

### 4.3 Tần số uốn mode 1

Thân tên trần, coi như dầm tự do hai đầu:

```text
f_trần = (βL)² / (2π · L²) · √(EI / μ)

(βL)² = 22.3733        mode uốn thứ nhất của dầm tự do hai đầu
L     = length, tính bằng m
μ     = shaftGpi, tính bằng kg/m
```

Point và nock làm tần số thấp xuống. Phần này là ước chừng:

```text
f = f_trần / √(1 + endMassFactor · (m_trước + m_sau) / m_thân)      endMassFactor = 2
```

Tần số này chỉ điều khiển tốc độ uốn trong hoạt hình. Nó chưa tham gia vào weak / stiff hay clearance (xem mục 13).

## 5. Cung

### 5.1 Power stroke, năng lượng, vận tốc

```text
powerStroke = drawLength − braceHeight                         mm

E = ½ · drawWeight · powerStroke · (1 + h / 3)                 J   (powerStroke đổi ra m)
    h = độ đầy của đường lực kéo: 0.15 thẳng, 0.42 chuẩn, 0.60 đầy giữa hành trình

m_động = m_tổng + limbVirtualMass + stringMass · stringMassShare
    limbVirtualMass = 5.5 g,  stringMassShare = 1/3

v = √(2·E / m_động)                                            m/s (m_động đổi ra kg)
```

`limbVirtualMass` là phần khối lượng của limb và dây cùng chuyển động với tên, nên ăn bớt năng lượng.

`½·F·s` là năng lượng của đường lực kéo thẳng; `1 + h / 3` là phần cung recurve tích thêm nhờ đường cong phồng lên ở giữa hành trình. Mức chuẩn cho đúng hệ số 1.14 mà mô hình dùng từ trước (từ `heuristic-0.4` hệ số cố định `drawCurveFactor` không còn).

Đường lực kéo, với `u` là phần power stroke đã kéo (0 ở brace height, 1 ở full draw):

```text
F(u) = drawWeight · ( u + h·u(1−u) + k·u(1−u)(1−2u) )

k = 0.39 + 0.10 · (drawLength − drawVừa)          inch, giữ trong 0 … 0.8
    drawVừa = 28 in + (chiều dài cung − 68 in)

lực tăng ở clicker = drawWeight / powerStroke · (1 − h + k)
```

`k` (độ dốc cuối) không đổi năng lượng: số hạng của nó thêm bao nhiêu diện tích ở nửa đầu thì bớt bấy nhiêu ở nửa sau. Nó chỉ đổi lực tăng ở clicker. 0.39 làm setup tham chiếu tăng 5% lực kéo mỗi inch ở full draw; 0.10 mỗi inch là ước đoán về độ lớn, chưa có số đo. Chi tiết ở spec §39. Không có hệ số hiệu suất riêng.

Khi người bắn nhập lực đo bằng cân cung, hai số `h` và `k` lấy từ số đo thay cho ước lượng. Với `L = F_đo / drawWeight − u` tại mỗi điểm:

```text
một điểm (trước full draw 2 in):   k = (L₁ − h·u₁(1−u₁)) / (u₁(1−u₁)(1−2u₁))      h giữ theo kiểu đường cong
hai điểm (thêm trước full draw 8 in): giải hệ hai phương trình bậc nhất theo h và k
```

Số đo bị bỏ, và ước lượng được dùng lại, khi: điểm gần không nhỏ hơn lực kéo, điểm xa không nhỏ hơn điểm gần, `h` ra ngoài −0.3 … 0.9, hoặc đường cong không tăng suốt hành trình. "Tăng suốt hành trình" nghĩa là độ dốc không bao giờ xuống dưới 0.05 độ dốc trung bình (hằng `LEAST_SLOPE` trong `drawCurve.ts`). Điểm xa nằm trước brace height thì không tính, và điểm xa nằm trong 5% đầu của power stroke cũng không dùng.

### 5.1b Từ số ghi trên limb ra lực trên ngón tay

Không thuộc mô hình; chỉ là quy tắc quen dùng, để người chưa có cân cung điền được lực kéo:

```text
lực_trên_ngón = số_ghi · (1 + 0.05 · (drawLength − 28 in)) · (1 + bolt)        bolt từ −5% tới +5%
```

Số ghi trên limb được hiểu là ở 28 in AMO, riser 25 in, limb bolt ở giữa. Nguồn và giới hạn ở tuning-references.md mục 8.1.

### 5.2 Quán tính của cung

```text
I(m, m_stab, d) = m + m_stab · (d / 500)²           d = stabilizerPosition, mm
quán_tính_tương_đối = I(setup) / I(tham chiếu)
```

Cung nặng hơn, hoặc tạ đặt xa hơn, thì khó bị cú bắn xô lệch. Giá trị này chỉ đi vào mức dao động (mục 7.2).

## 6. Weak / stiff

### 6.1 Spine cần thiết

Luật lũy thừa quanh setup tham chiếu. Tải nặng hơn thì cần thân cứng hơn, tức số spine nhỏ hơn:

```text
logLoad = Σ eᵢ · ln(xᵢ / xᵢ_thamchiếu)
spine_cần = spine_thamchiếu · exp(−logLoad)
```

| Đầu vào `xᵢ` | Số mũ `eᵢ` | Tăng đầu vào thì |
|---|---|---|
| drawWeight | 1.0 | cần thân cứng hơn |
| drawLength | 0.72 | cần thân cứng hơn |
| braceHeight | 0.3 | cần thân cứng hơn, tức tên đang có sẽ bắn yếu đi |
| arrow length | 2.5 | cần thân cứng hơn (ảnh hưởng mạnh nhất) |
| m_trước (point + insert) | 0.3 | cần thân cứng hơn |
| m_sau (nock + fletching) | −0.02 | cần thân mềm hơn |
| stringMass | −0.2 | cần thân mềm hơn |
| strandCount | −0.05 | cần thân mềm hơn |

`shaftGpi` và `shaftDiameter` không có mặt trong luật này.

Số mũ của khối lượng đuôi cố ý để nhỏ. Đuôi tên chỉ nặng khoảng một phần mười đầu tên (14 gr so với 132 gr), nên cùng một số mũ sẽ làm một grain ở nock nặng ký gấp mười lần một grain ở point. Với −0.02, một grain ở nock có tác dụng nhỏ hơn một grain ở point một chút, theo chiều ngược lại. Trước đây số mũ là −0.1, khiến đổi nock từ 9 xuống 2 gr đã đủ đẩy kết quả sang WEAK.

Số mũ của khối lượng dây lấy theo sách Easton: đổi số sợi dây "có thể" cần thân tên khác một cỡ. Với −0.2 cùng −0.05 của số sợi, thêm 4 sợi vào dây 16 sợi (dây nặng thêm 25%) tương đương khoảng ba phần tư một bước spine 50.

Số mũ của brace height lấy theo sách Easton: tăng brace height làm tên bắn yếu đi, và cả dải brace height dùng được của một cây recurve (khoảng 21,0 tới 24,1 cm với cung 68 in) tương đương khoảng 20 gr point. Với 0.3, đi hết dải đó cho `0.3 · ln(241/210) = 0.041`, so với `0.042` của 20 gr point. Brace height vẫn làm giảm power stroke và vận tốc ở mục 5.1; hai tác dụng này tính riêng. Nguồn và các điểm đối chiếu khác: [tuning-references.md](tuning-references.md).

### 6.2 Độ lệch độ cứng và dynamicBehavior

```text
mismatch = ln(spine_cần / spine_thật) + plungerShift · (plungerStiffness − 1)
           plungerShift = 0.08

dynamicBehavior = tanh(gain · mismatch)          gain = 3
```

`mismatch = 0` là khớp, dương là thân cứng hơn cần thiết, âm là yếu hơn. Plunger cứng hơn đẩy kết quả về phía cứng. `tanh` ép kết quả vào −1..+1 và làm nó bão hòa khi lệch nhiều.

Ví dụ, từ setup tham chiếu tăng point 20 gr: `m_trước` từ 132 lên 152 gr, `mismatch = −0.3 · ln(152/132) = −0.042`, `dynamicBehavior = tanh(−0.127) = −0.126`. Vẫn xếp NEUTRAL (ngưỡng 0.2) nhưng bare shaft đã lệch phải.

### 6.3 Chỉnh theo từng người

Mô hình nhận thêm ba số dịch chuyển, mặc định bằng 0 (`src/models/calibration.ts`):

```text
mismatch         = … + behaviorShift
centerShot       = (centerShot_hiệu_dụng − centerShotNeutral) · side
verticalTendency = tanh(0.25 · (nockingPointHeight − 4 − nockingPointNeutral) − …)
```

Chúng không đổi độ nhạy nào, chỉ dời chỗ mô hình coi là "hợp" và "cân". Khi có số nào khác 0, tên phiên bản của mô hình thêm đuôi `+personal`.

Ba số này được dò từ quan sát thật (`src/engine/calibration/fit.ts`, spec §18). Mỗi điều đã ghi là một dải: yếu, hợp hay cứng; trái, chung cụm hay phải. Với mỗi điều, phép dò tính con số của mô hình nằm ngoài dải đó bao xa, chia cho ngưỡng của dải rồi bình phương:

```text
sai_lệch = Σ (khoảng nằm ngoài dải / ngưỡng)²  +  0.02 · (dịch_chuyển / đơn_vị)²

đơn_vị:  behaviorShift 0.07 (khoảng một bước spine 50 ở spine 700),  hai số còn lại 1 mm
giới hạn: behaviorShift ±0.35,  nockingPointNeutral −6 … +8 mm,  centerShotNeutral ±3 mm
```

- Dải được thu vào 25 % ở mỗi mép, để kết quả rơi hẳn vào trong dải chứ không nằm sát mép.
- Số hạng thứ hai kéo mỗi dịch chuyển về 0, nên không gì dịch nếu không có lý do. Hệ số 0.02 đủ nhỏ để một quan sát rõ ràng thắng nó.
- Mỗi số được tìm dọc theo trục của nó: đi 28 bước qua cả khoảng, rồi thu hẹp quanh bước tốt nhất. Chiều dọc tìm một lần; hai số chiều ngang tựa vào nhau nên tìm hai vòng.
- Dịch chuyển nhỏ hơn một phần bảy đơn vị thì coi là 0.
- Cần ít nhất 3 quan sát có ghi tên phản ứng thế nào, bareshaft rơi đâu, hoặc cụm tên lệch đâu.
- Kết quả chỉ được bật khi mô hình đã chỉnh khớp nhiều điều đã ghi hơn mô hình gốc.

Mọi hệ số ở đây (0.02, 25 %, các giới hạn) là ước chừng. Phép dò mới được thử trên quan sát dựng sẵn từ một mô hình bị dời đi một lượng biết trước; chưa thử trên quan sát thật.

## 7. Các chỉ số còn lại

`clamp01` cắt giá trị vào 0..1. `preload_lệch = plungerPreload − 1 mm`. `centerShot` ở đây đã nhân `side`.

### 7.1 Biên độ uốn

```text
flexAmplitude = clamp01(0.4 · exp(−1.2 · mismatch))
```

Thân yếu uốn nhiều hơn, thân cứng uốn ít hơn.

### 7.2 Mức dao động

```text
oscillation = clamp01(
    0.20
  + 0.55 · |dynamicBehavior|
  + 0.15 · max(0, −dynamicBehavior)          yếu thì lắc thêm
  + 0.05 · |centerShot|                      mỗi mm
  + 0.05 · |preload_lệch|                    mỗi mm
  − 0.08 · ln(quán_tính_tương_đối) )
```

### 7.3 Tác dụng của cánh

```text
cánh_gr     = fletchingWeight tính bằng grain      (bare shaft: 0)
driftFactor = 1 − 0.6 · (1 − exp(−cánh_gr / 3.5))
```

`driftFactor` là phần sai số lúc rời cung còn lại sau khi cánh lái tên về. Bare shaft: 1. Cánh 5 gr: 0.544. Cánh rất nặng: tiến về 0.4.

Cánh cũng dập dao động:

```text
oscillationDecay = 12 + 2 · cánh_gr                                    1/s
stabilityTime    = ln(max(oscillation, 0.05) / 0.05) / oscillationDecay    s
```

`stabilityTime` là thời gian để mức dao động giảm còn 0.05.

### 7.4 Lệch ngang

```text
lateralDeviation = side · driftFactor · tanh(
    −0.9  · dynamicBehavior
  + 0.25 · centerShot                        mỗi mm
  − 0.15 · preload_lệch )                    mỗi mm

yaw = 0.02 · lateralDeviation                rad
```

Tay phải: tên yếu đi phải, tên cứng đi trái. Tăng preload đẩy tên ra xa riser, tức sang trái.

`centerShot` ở đây là center shot hiệu dụng, đã tính cánh cung lệch (từ `heuristic-0.3`):

```text
dây_lệch          = (limbAlignmentTop + limbAlignmentBottom) / 2          mm, dương là sang phải
centerShot_hiệu_dụng = centerShot − dây_lệch · (arrowLength / braceHeight)
cánh_vặn          = |limbAlignmentTop − limbAlignmentBottom|            mm
```

- Hai đầu cánh lệch cùng phía thì dây lệch theo, còn rest vẫn nằm trên riser. Tên xoay quanh nock, đầu tên lệch sang phía ngược lại so với đường dây. Đây là hình học thuần, không có hệ số: với tên 27 in và brace 22 cm, 1 mm lệch ở cánh bằng 3,1 mm center shot.
- Hai đầu cánh lệch ngược phía (`cánh_vặn`) thì mặt phẳng dây bị vặn. Mô hình cộng `0.04 · cánh_vặn` vào mức dao động và `0.04 · cánh_vặn` vào nguy cơ chạm cung. Không cộng vào lệch trái / phải vì chưa biết chiều. Hai hệ số này là ước chừng, chưa có số liệu.

### 7.5 Lệch dọc

```text
verticalTendency = tanh(
    0.25 · (nockingPointHeight − 4)          mỗi mm
  − 0.08 · (tiller − 4) )                    mỗi mm

pitch = −0.015 · verticalTendency            rad
```

Nock cao thì đuôi tên rời cung ở trên, tức mũi chúi xuống, nên `pitch` mang dấu âm. Nocking point là đầu vào chính, tiller là phụ.

### 7.6 Nguy cơ chạm cung (clearance)

Chạm cung là chuyện nhịp (§34.2): thân tên còn đang uốn khi đuôi của nó đi ngang qua cung. Lúc đó đuôi đang lệch ra xa hay áp vào cung là tùy thân tên đã uốn được bao nhiêu chu kỳ.

```text
t_qua_cung = timeOnString + braceHeight / v        từ lúc thả tới lúc đuôi tên qua cung
chu_kỳ     = f_uốn · t_qua_cung                     metrics.clearanceCycles
lệch_nhịp  = min(1, |chu_kỳ − 1.435| / 0.5)

clearanceRisk = clamp01(
    0.15
  + 0.25 · |dynamicBehavior|                 uốn mạnh thì đuôi văng rộng
  + 0.40 · lệch_nhịp
  + 0.06 · max(0, centerShot)                mỗi mm về phía riser
  + nockFit                                  TIGHT +0.10, NORMAL 0, LOOSE −0.03
  + 0.60 · max(0, ln(brace_chuẩn / braceHeight))   chỉ khi brace height thấp hơn brace_chuẩn
  + 0.04 · cánh_vặn                          mỗi mm, xem 7.4
  + 0.10 · |verticalTendency|
  + 0.03 · (shaftDiameter − 4.2) )           mỗi mm
```

### 7.7 Chỉ số phụ (§34.4)

Số học thuần từ setup, không dùng hệ số ước chừng nào ngoài vận tốc.

```text
grains per pound = m_tổng (gr) / drawWeight (lb)

FOC % = (điểm_cân_bằng − L/2) / L · 100                       công thức AMO
điểm_cân_bằng = ( m_thân · L/2
                + m_point · (L + (pointLength − 25 mm) / 2)
                + m_insert · (L − 10 mm)
                + m_cánh · fletchingPosition ) / m_tổng
        vị trí đo từ rãnh nock; nock đặt ở 0

động năng = ½ · m_tổng · v²                                    J
```

- Setup tham chiếu: 308 gr trên cung 38 lb là 8,1 gr/lb; FOC 19,0 %.
- Point được coi là một thanh đều từ cuối chuôi (nằm trong thân tên 25 mm) tới đầu nhọn; insert nằm lùi vào 10 mm. Hai con số 25 và 10 mm là ước chừng. `pointLength` (mặc định 18 mm) và `fletchingPosition` (mặc định 55 mm, tính tới giữa cánh) là thông số Nâng cao của tên. Chúng chỉ dời FOC vài phần mười phần trăm; khối lượng mới là thứ quyết định.
- Tên nhẹ có hai mức, hiện ở cả Cơ bản và Nâng cao. Dưới mức tối thiểu của bảng AMO (`minimumArrowMass`) thì cảnh báo cung có thể gãy. Chưa tới mức đó nhưng dưới 5 gr/lb thì chỉ nhắc là tên nhẹ. 5 gr/lb là quy tắc quen dùng, không phải của AMO, và cao hơn bảng AMO ở hầu hết recurve: cung 38 lb ở 28 in thì 5 gr/lb là 190 gr, bảng AMO là 150 gr.
- Bảng AMO chép từ sách Easton (tuning-references.md mục 9.2), tra theo lực kéo và draw length. Lực kéo nằm giữa hai hàng thì lấy hàng nặng hơn; draw length nằm giữa hai cột thì nội suy thẳng; ngoài 25 tới 33 in thì lấy cột gần nhất. Draw length nhập vào được coi là draw length AMO.
- Ba con số chỉ hiện ở chế độ Nâng cao.
- FOC nằm ngoài 7 tới 16 % (khoảng sách Easton ghi cho tên bắn bia, tuning-references.md mục 9.3) thì chế độ Nâng cao hiện một ghi chú, không phải cảnh báo: sách gọi khoảng đó là chỗ để bắt đầu. Setup tham chiếu ra 19,0 % nên có ghi chú này. Lý do không nằm ở cách tính mà ở chính setup: point 120 gr và insert 12 gr trên thân 27 in, 162 gr.

- `brace_chuẩn = 220 + (chiều_dài_cung − 68) · 3,175` mm: cung dài hơn thì brace height chuẩn cao hơn, theo đúng bước 1/8 in mỗi inch trong bảng của Easton. Chiều dài cung = số ghi trên cánh + (riser − 25), ví dụ H25 + 68 = 68 in. Khoảng brace height Easton khuyên là 8¼ tới 9½ in cho cung 68 in, dịch cùng bước đó; bảng kết quả báo khi brace height nằm ngoài khoảng. Cỡ cung không đổi weak / stiff.
- 1,435 chu kỳ là con số của setup tham chiếu (`neutralCycles`). Mô hình coi đó là nhịp tốt, giống cách nó coi setup tham chiếu là đã cân. Lệch nửa chu kỳ là tệ nhất; lệch hơn nữa vẫn tính là tệ nhất, không quay vòng lại thành tốt.
- Ví dụ: spine 900 uốn chậm hơn, 1,27 chu kỳ, lệch 0,17, nguy cơ 0,45. Spine 400 là 1,90 chu kỳ, lệch 0,46, nguy cơ 0,75 (mức Cao). Cung 48 lb bắn nhanh hơn nên thân tên có ít thời gian hơn: 1,28 chu kỳ.
- Khối lượng thân tên (`shaftGpi`) giờ có ảnh hưởng tới clearance qua tần số uốn và vận tốc, dù không đổi weak / stiff.
- Chỗ còn ước chừng: `f_uốn` là tần số của tên bay tự do, trong khi trên dây đuôi tên bị dây giữ; thời gian trên dây giả định lực đẩy đều; cung coi như nằm cách dây đúng bằng brace height.
- Từ phiên bản hệ số `heuristic-0.2`. Ở `heuristic-0.1` clearance chỉ dùng `0.50 · |dynamicBehavior|`, không có nhịp.

## 8. Phân loại

| Kết quả | Chỉ số | Ngưỡng |
|---|---|---|
| WEAK / NEUTRAL / STIFF | `dynamicBehavior` | dưới −0.2 / ở giữa / trên +0.2 |
| LOW / MEDIUM / HIGH (dao động) | `oscillation` | dưới 0.35 / từ 0.35 / từ 0.65 |
| LEFT / NEUTRAL / RIGHT | `lateralDeviation` | dưới −0.15 / ở giữa / trên +0.15 |
| LOW / MEDIUM / HIGH (clearance) | `clearanceRisk` | dưới 0.33 / từ 0.33 / từ 0.66 |
| NOCK_LOW / NEUTRAL / NOCK_HIGH | `verticalTendency` | dưới −0.15 / ở giữa / trên +0.15 |

## 9. Đường bay

Cung đạn đạo có lực cản không khí, ngắm vào tâm bia ở khoảng cách `D` (18, 30, 50, 70 hoặc 90 m). Mũi tên là một chất điểm; lực cản tỉ lệ với bình phương vận tốc, công thức và hệ số ở mục 9.2. Từ 2026-10-07 hoạt hình và vạch thước ngắm dùng chung một đường bay.

```text
góc_nâng = góc bắn để tên về đúng độ cao lúc rời cung sau quãng D, tìm bằng chia đôi khoảng
(x, y)   = tích phân từng bước 1 ms từ góc đó, tới khi x = D
T        = thời điểm x = D                      thời gian bay
```

Mẫu cách nhau 1 ms, tối đa 5000 điểm; mẫu cuối nằm đúng trên bia. Với `(x, y_đạn_đạo)` của từng mẫu:

```text
y(t)    = y_đạn_đạo − verticalTendency · driftFactor · (1/200) · x
z(t)    = lateralDeviation · (1/120) · x

lắng(t) = exp(−oscillationDecay · t)
yaw(t)   = yaw   · lắng + hướng · 0.03  · oscillation      · lắng · sin(2π · 6 · t)
pitch(t) = pitch · lắng +         0.015 · verticalTendency · lắng · sin(2π · 6 · t)

flex(t) = hướng · flexAmplitude · exp(−14 · t) · sin(2π · f · t)
```

- `hướng` bằng `side`: nhịp uốn đầu tiên là về phía riser. Dùng `sin` nên tên thẳng lúc rời dây (`t = 0`) rồi mới uốn.
- Lắc đuôi (fishtail) và nhấp nhô (porpoise) là chuyển động của cả mũi tên, tần số cố định 6 Hz, chậm hơn nhiều so với rung uốn `f` (khoảng 70 Hz).
- Độ trôi `y` và `z` tăng tuyến tính theo khoảng cách. Ở lệch ngang tối đa, tên trôi 1 mm mỗi 120 mm đường bay. Đây là minh họa, không phải vị trí trúng bia.

### 9.1 Trước khi tên rời dây

`t = 0` là lúc nock rời dây. Trước đó là quãng dây đẩy tên, tính riêng:

```text
timeOnString = 2 · powerStroke / v              coi lực đẩy đều suốt power stroke
quãng đã đi  = powerStroke · (τ / timeOnString)²     τ = thời gian từ lúc thả dây
nockAngle    = atan(nockingPointHeight / braceHeight)
```

Setup tham chiếu: `timeOnString` = 16,8 ms, `nockAngle` khoảng 1°. Lực đẩy đều là giả định đơn giản; dây thật đẩy mạnh lúc đầu và yếu dần. Trong quãng này tên được vẽ thẳng; mô hình chưa tính độ uốn khi tên còn trên dây.

### 9.2 Đường bay có lực cản, cho vạch thước ngắm

Đường bay của mục 9 và của vạch thước ngắm là một (`src/engine/ballistics/flight.ts`): mũi tên là một chất điểm, lực cản tỉ lệ với bình phương vận tốc.

```text
gia tốc = −g·ĵ − k · |v| · v

k = ½ · ρ · C_d · A / m          1/m: mỗi mét bay, tên mất chừng ấy phần vận tốc
    ρ   = 1,2 kg/m³              không khí khoảng 20 °C ở mực nước biển
    C_d = 2                      ước chừng, tính trên tiết diện thân tên
    A   = π · (shaftDiameter / 2)²
    m   = khối lượng cả mũi tên
```

- Setup tham chiếu: `k` = 0,00083 mỗi mét, tức tên mất khoảng 6 % vận tốc sau 70 m.
- `C_d = 2` là con số tròn trong khoảng 1,5 tới 2,6 mà các phép đo trong hầm gió trên mũi tên thường ghi. Chưa có nguồn cho nó trong tuning-references.md; cánh và point không được tính riêng.
- Tích phân bằng bước giữa (midpoint), bước 4 ms. Góc bắn cần cho một cự ly tìm bằng chia đôi khoảng.

Vạch thước ngắm (`src/engine/ballistics/sightMarks.ts`, spec §38.7):

```text
vạch(D) = offset + scale · tan(góc(D))

góc(D) = góc bắn, tính từ đường ngắm, để tên leo từ vị trí mũi tên lên ngang mắt sau quãng D
```

- `offset` và `scale` thuộc về thước ngắm và cách anchor, dò bằng bình phương tối thiểu từ các vạch đã có. Hai vạch là đủ.
- Từ ba vạch, vận tốc tên cũng được dò (tìm theo tỉ lệ vàng trong 35 tới 95 m/s). Việc này chỉ làm được vì chiều cao mắt so với mũi tên được coi là đã biết (mặc định 11 cm), nên vận tốc suy ra là ước lượng thô: lệch 2 cm ở chiều cao mắt làm nó đổi hơn 5 %.
- Lực cản không bao giờ được dò từ vạch. Trong tầm cự ly người ta bắn, vận tốc và lực cản uốn đường cong gần như cùng một kiểu.
- Khoảng của mỗi vạch đoán là độ trải của kết quả khi từng ước lượng lệch một mức: chiều cao mắt 2 cm, lực cản 50 %, vận tốc của mô hình 5 % (chỉ khi vận tốc chưa dò từ vạch), và vạch gần nhất cùng vạch xa nhất bị đọc lệch nửa milimet ngược chiều nhau. Mỗi lần đều khớp lại với các vạch đã biết, nên khoảng hẹp ở giữa các vạch đó và rộng dần khi ra xa. Cả bốn mức đều là giả định.
- Khoảng hở dưới đầu ngắm (`src/engine/ballistics/sightClearance.ts`, spec §38.7) là hình học thuần, không cần vạch:

```text
đầu_ngắm_trên_tên = chiều_cao_mắt − tầm · tan(góc(D))
tầm               = (drawLength − 44,45 mm) + cần_thước          từ mắt tới đầu ngắm
khoảng_hở         = đầu_ngắm_trên_tên − ½·vòng_ngắm − 12 mm − ½·shaftDiameter
```

  44,45 mm là 1,75 in mà draw length AMO tính thêm phía trước pivot point. 12 mm trong công thức là chiều cao cánh mặc định; từ 2026-10-08 nó là thông số `fletchingHeight` của tên. Hở dưới 10 mm gọi là "sát", âm là "chắn"; ngưỡng 10 mm cũng là ước chừng. Setup tham chiếu với cần 15 cm, mắt 11 cm: 84 mm ở 18 m, 22 mm ở 70 m (sát), −4 mm ở 90 m (chắn).
- Ví dụ của spec, vạch 15 ở 18 m và 30 ở 30 m: đường thẳng qua hai vạch cho 55, 80 và 105 ở 50, 70 và 90 m; mô hình cho khoảng 58, 88 và 120.

## 10. Bare shaft

Bare shaft được bay với `cánh_gr = 0` nhưng giữ nguyên khối lượng, như thân tên trần dán băng cho nặng bằng tên có cánh. Cánh che sai số lúc rời cung; bare shaft cho thấy nó.

Độ lệch của bare shaft so với tên có cánh, đưa về thang −1..+1:

```text
offset.lateral  = (z_trần − z_cánh) / (x · 1/120)
offset.vertical = (y_trần − y_cánh) / (x · 1/200)
```

Rút gọn, với `driftFactor` của tên có cánh:

```text
offset.lateral  =  side · tanh(…ngang…) · (1 − driftFactor)
offset.vertical = −verticalTendency     · (1 − driftFactor)
```

Trong khoảng ±0.05 là TOGETHER; ngoài đó là LEFT / RIGHT và LOW / HIGH.

Cách đọc thành lời:

| Bare shaft rơi | Kết luận |
|---|---|
| Phía xa riser của người bắn (RH: phải, LH: trái) | tên yếu |
| Phía còn lại | tên cứng |
| Thấp hơn cụm | nocking point quá cao |
| Cao hơn cụm | nocking point quá thấp |

### 10.1 Xé giấy

Phép thử xé giấy bắn một mũi tên có cánh qua tờ giấy ở cách 1,2 tới 1,8 m. Gần cung như vậy cánh chưa kịp lái tên, nên tờ giấy cho thấy đúng sai số lúc rời cung mà bare shaft cho thấy, nhìn từ đầu kia: tên rời cung với đuôi lệch phải thì bay sang trái. Mô hình vì vậy đọc vết rách từ chính `offset` của bare shaft, không có hệ số riêng:

```text
đuôi.ngang = −offset.lateral          dương là vết cánh nằm bên phải lỗ point
đuôi.dọc   = −offset.vertical         dương là vết cánh nằm trên lỗ point
```

| Bare shaft rơi | Vết cánh so với lỗ point | Kết luận (tay phải) |
|---|---|---|
| Trái | Phải | tên cứng |
| Phải | Trái | tên yếu |
| Thấp | Trên | nocking point quá cao |
| Cao | Dưới | nocking point quá thấp |

Ngưỡng "lỗ gọn" là ngưỡng TOGETHER của bare shaft, nên hai phép thử không bao giờ nói ngược nhau. Hướng rách lấy từ hình trong sách Easton (tuning-references.md mục 9.1). Sách cũng ghi rách lên trên và rách về phía yếu có thể do tên chạm cung; khi vết rách thuộc hai kiểu đó và nguy cơ chạm cung không ở mức Thấp, bảng kết quả ghi thêm câu đó.

Hình vẽ: lỗ point và chữ Y của ba cánh đặt đối xứng quanh giữa tờ giấy. Khoảng cách giữa chúng là `150 · |đuôi|` đơn vị trên tờ giấy 120 đơn vị, không quá 38, nên vết rách ở ngưỡng TOGETHER (0.05) vẫn thấy được và vết rách lớn nhất không ra ngoài giấy. Độ dài trên hình không phải cm thật.

## 11. Gợi ý tuning

### 11.1 Điểm sai lệch

```text
tuningError = |dynamicBehavior|
            + |lateralDeviation của bare shaft|
            + |verticalTendency|
            + 0.5 · clearanceRisk
            + 0.3 · oscillation
```

Setup được coi là đã cân khi cả năm phân loại đều NEUTRAL hoặc LOW, và bare shaft ở mỗi chiều hoặc là TOGETHER, hoặc lệch nhẹ về phía sách coi là bình thường: thấp hơn cụm, hay về phía cứng (trái với tay phải). "Nhẹ" là `offset` không quá 0.10, gấp đôi bề rộng của TOGETHER; sách Easton chỉ viết "hơi thấp và hơi cứng", con số là ước chừng. Lệch cùng mức về phía yếu hoặc cao hơn cụm thì chưa cân. Khi rơi vào trường hợp này, phần gợi ý ghi thêm một câu giải thích.

### 11.2 Tìm và xếp hạng

Với từng thông số trong bảng dưới: thử 24 giá trị, 12 bước mỗi phía trong khoảng ±`maxMove`, làm tròn về bước của thanh trượt, bỏ giá trị ngoài giới hạn. Giữ giá trị cho `tuningError` thấp nhất; nếu hòa thì chọn thay đổi nhỏ hơn. Bỏ thông số nào giảm sai lệch chưa tới 0.03.

```text
improvement = (sai_lệch_gốc − sai_lệch_tốt_nhất) / sai_lệch_gốc      hiển thị
rank        = (sai_lệch_gốc − sai_lệch_tốt_nhất) / cost              xếp trong cùng một bước
```

Danh sách xếp theo bước trước, `rank` sau. Bước là thứ tự sách tuning vẫn làm (tuning-references.md mục 5 và 9.7): một thay đổi ở bước trước mà có ích thì đứng trước mọi thay đổi ở bước sau, dù bước sau sửa được nhiều hơn. Phần trăm cải thiện vẫn hiện trên từng gợi ý.

| Bước | Thông số | Nhóm | `cost` | `maxMove` |
|---|---|---|---|---|
| 1. Lắp đặt | center shot | chỉnh trên cung | 1 | 2 mm |
| 2. Lên xuống | nocking point height | chỉnh trên cung | 1 | 6 mm |
| | tiller | chỉnh trên cung | 1.2 | 4 mm |
| 3. Plunger | plunger stiffness | chỉnh trên cung | 1 | 0.6 |
| | plunger preload | chỉnh trên cung | 1 | 1.5 mm |
| 4. Point | point weight | đổi phụ kiện tên | 1 | 20 gr |
| | nock weight | đổi phụ kiện tên | 1 | 4 gr |
| 5. Lực kéo | draw weight | chỉnh trên cung | 1 | 3 lb |
| 6. Brace height | brace height | chỉnh trên cung | 1 | 1 cm |
| 7. Thân tên | arrow length | mua tên mới | 1 | 1 in |
| | spine | mua tên mới | 1 | 150 |

Center shot chỉ được gợi ý quay về giá trị mặc định, không bao giờ ra xa nó: với recurve, sách đặt vị trí trong ngoài một lần lúc lắp cung rồi tune bằng lực plunger. Người bắn đã dời center shot thì được gợi ý đặt lại, và việc đó đứng đầu danh sách.

Mỗi gợi ý là một thay đổi đơn lẻ từ setup hiện tại. Ở chế độ Simple chỉ gợi ý thông số Simple.

### 11.3 Cả buổi tune

`planTuning` (`src/engine/recommendation/plan.ts`) xếp các gợi ý thành một chuỗi: lấy gợi ý đứng đầu, áp vào setup, rồi lại lấy gợi ý đứng đầu của setup vừa có, tối đa 7 bước, dừng khi setup đã cân hoặc không còn gợi ý nào. Mỗi thông số chỉ được đổi một lần trong chuỗi. Không có luật đó thì chuỗi sẽ vặn plunger mãi để bù cho thân tên sai; có nó thì mỗi cách chỉnh đi hết mức một gợi ý cho phép (`maxMove`), rồi nhường cho cách kế tiếp theo thứ tự ở mục 11.2. Chuỗi chỉ hiện khi có từ hai bước trở lên.

Ví dụ, setup tham chiếu với spine 800: plunger 1.0 lên 1.6, preload 1 lên 2,5 mm, point 120 xuống 100 gr, lực kéo 38 xuống 37 lb, và mô hình đọc là đã cân. Với spine 1000 thì sau sáu bước, kể cả đổi sang spine 850, vẫn chưa cân: chuỗi nói rõ điều đó.

## 12. Setup tham chiếu và các con số của nó

Setup mà mô hình coi là cân hoàn hảo (§19), cũng là giá trị mặc định:

| Cung | | Tên | |
|---|---|---|---|
| Draw weight | 38 lb (169.03 N) | Length | 27 in (685.8 mm) |
| Draw length | 28 in (711.2 mm) | Spine | 700 |
| Brace height | 220 mm | Point | 120 gr |
| Nocking point | 4 mm | Insert | 12 gr |
| Tiller | 4 mm | Nock | 9 gr |
| Center shot | 0 mm | Fletching | 5 gr |
| Plunger stiffness / preload | 1 / 1 mm | Shaft weight | 6 gpi |
| Bow mass | 3 kg | Shaft diameter | 4.2 mm |
| Stabilizer | 250 g ở 70 cm | | |
| String | 16 sợi, 105 gr, nock fit NORMAL | | |

Mô hình cho ra (chạy trực tiếp từ engine):

| Đại lượng | Giá trị |
|---|---|
| Khối lượng thân / tổng | 10.50 g / 19.96 g (308 gr) |
| `EI` | 3.637 N·m² |
| Tần số uốn | 69.7 Hz (thân trần: khoảng 116.7 Hz) |
| Power stroke | 491.2 mm |
| Năng lượng tích trữ | 47.3 J |
| Vận tốc rời cung | 58.4 m/s (khoảng 192 fps) |
| Thời gian bay 18 m / 70 m | 0.311 s / 1.242 s |
| Góc bắn 18 m / 70 m | 1,5° / 6,1° |
| Vận tốc khi tới bia 18 m / 70 m | 57,5 m/s / 55,1 m/s |
| `dynamicBehavior`, lệch ngang, lệch dọc | 0, 0, 0 |
| `flexAmplitude` / `oscillation` / `clearanceRisk` | 0.40 / 0.20 / 0.15 |
| `oscillationDecay` / `stabilityTime` | 22 /s / 0.063 s |

## 13. Giới hạn đã biết

- Lực cản không khí dùng một hệ số cản ước chừng (`C_d = 2`, mục 9.2), chưa có nguồn; cánh và point không được tính riêng. Thời gian bay ở cự ly xa vì vậy có thể lệch vài phần trăm. Gió không được tính.
- Bia quá xa so với vận tốc tên (cung rất nhẹ ở 90 m) thì đường bay được vẽ bằng một cung không lực cản ở 45°, chỉ để hình không bị đứt; con số thời gian bay khi đó không có nghĩa.
- Mọi nhiễu của mũi tên (góc lệch, lắc đuôi, uốn) đều lớn nhất lúc rời cung rồi chỉ tắt dần. Mô hình không tái hiện được trường hợp tên ra thẳng rồi gần bia đuôi mới đá, cũng không cho bareshaft lệch dần; cả hai đã được chủ dự án thấy trên phim quay chậm. Xem ROADMAP, V0.2.
- `shaftGpi` chỉ ảnh hưởng tần số uốn và vận tốc (và qua đó clearance), không ảnh hưởng weak / stiff. `shaftDiameter` chỉ ảnh hưởng clearance.
- Bow mass và stabilizer chỉ ảnh hưởng mức dao động.
- Tốc độ tắt của rung uốn (14 /s) và tần số lắc đuôi (6 Hz) là hằng số, không phụ thuộc setup.
- Độ trôi ngang và dọc tuyến tính theo khoảng cách và không có đơn vị thật.
- Không mô hình hóa người bắn: release, tay cầm cung, collapse (§7, §37).
- Chưa đối chiếu với bảng spine của nhà sản xuất (§25 Test 8).
- `limbVirtualMass` là hằng số. Luận án của Kooi cho thấy hiệu suất của cung đổi mạnh theo khối lượng tên, nên vận tốc sẽ lệch dần với tên rất nhẹ hoặc rất nặng. Ở setup tham chiếu hiệu suất ra 72 %, nằm trong vùng các nguồn ghi (tuning-references.md mục 10.3).
- Vài điểm còn lệch với tài liệu tuning (vị trí center shot trung tính, nocking point và tiller khởi đầu), ghi ở [tuning-references.md](tuning-references.md).

## 14. Tính toán ở trang "Xem trước"

Các công thức dưới đây chỉ chạy trong demo (`src/pages/demos/logic/`), chưa thuộc engine. Mã hoá setup vào đường link đã chuyển thành tính năng thật, ở `src/utils/setupTransfer.ts`. Chỉ số phụ (grains per pound, FOC, động năng) đã chuyển vào engine, xem mục 7.7.

- Landscape và sensitivity đã chuyển vào engine (`src/engine/explore/explore.ts`) và hiện ở trang Simulator, mục "Hiển thị: Toàn cảnh". Landscape: `dynamicBehavior` trên lưới spine 400..1000 (bước 50) × point 80..140 gr (bước 10), các giá trị khác giữ nguyên. Sensitivity: tăng từng thông số thêm 1/10 khoảng giới hạn của nó (giảm nếu hết chỗ tăng), ghi độ đổi của `dynamicBehavior`, bỏ mức dưới 0.005, xếp theo độ lớn. Cả hai tính trong Web Worker (`src/workers/explore.worker.ts`).
- Tuning plan: áp gợi ý đứng đầu lặp lại, tối đa 5 bước.
- Đọc bia (target plot) đã chuyển vào engine (`src/engine/diagnosis/targetPlot.ts`) và hiện ở trang Simulator, mục "Hiển thị: Bia". Đây là phần đọc dữ liệu thật, không phải kết quả của mô hình. Tọa độ tính bằng mm, cự ly do người bắn chọn:

```text
tâm_cụm = trung bình vị trí tên có cánh              cần ít nhất 3 tên có cánh và 1 bare shaft
độ_tản  = trung bình khoảng cách từ từng tên tới tâm_cụm
offset  = tâm bare shaft − tâm_cụm
đủ_kết_luận = |offset| > max(15 mm · cự_ly / 18 m, 0.75 · độ_tản)
một chiều chỉ được tính khi thành phần của nó > 0.4 · |offset|
tầm_plunger   = 7,6 cm · cự_ly / 30 m          lệch ngang trong tầm này: chỉ gợi ý plunger
giới_hạn_thân = 15 cm · cự_ly / 18 m           lệch ngang quá mức này: gợi ý thêm đổi thân tên
```

Giữa hai mức thì gợi ý plunger, rồi point, rồi lực kéo. 7,6 cm ở 30 m lấy từ *Total Archery*, 15 cm ở 18 m từ sách Easton; chia tỉ lệ theo cự ly là giả định của mô hình, hai sách chỉ cho mỗi con số ở một cự ly. Ở 18 m hai mức là 4,6 cm và 15 cm. Mức 15 mm cho "bareshaft tự lệch" là ước chừng, và việc nó lớn dần theo cự ly cũng vậy.

Chẩn đoán dùng setup đã nhập để chọn nguyên nhân: center shot đã bị dời về phía khiến bareshaft đi đúng như trên bia thì đứng đầu; plunger đã ở trong 10 % cuối của tầm chỉnh về phía cần vặn thì bỏ qua, và point cùng lực kéo được gợi ý ngay. Chẩn đoán còn báo mô hình có đọc setup đó giống bia hay không (so `horizontal` và `vertical` của bài thử bareshaft trong mô hình với bia).

## 15. Hiển thị

Không thuộc mô hình, nhưng quyết định cái người dùng thấy:

- Đoạn phim mở đầu ở tư thế kéo hết dây và đứng yên tới khi bấm chạy. Dây kéo lùi đúng bằng power stroke theo tỉ lệ của cung. Cánh cung cong theo: đầu cánh lùi về sau và khép vào vừa đủ để dây giữ nguyên chiều dài (đầu cánh lùi 35% quãng kéo, con số chọn cho hợp mắt).
- Quãng dây đẩy tên được chiếu chậm hơn quãng bay. Cung vẽ to hơn nhiều so với cự ly tới bia, nên nếu chiếu cùng nhịp thì tên vọt khỏi dây rồi như bị phanh lại. Nhịp chiếu được chọn để tên rời dây đúng bằng tốc độ nó bay trên màn hình sau đó, tối đa 1,2 giây. Số mili giây hiển thị vẫn là thời gian thật.
- Thước ngắm trên cung (bật ở mục "Vạch thước ngắm"): cần thước, thanh đứng và đầu ngắm vẽ cùng tỉ lệ với cung, riêng đầu ngắm không nhỏ hơn 2,2 đơn vị để còn nhìn thấy. Đầu ngắm đặt theo đường mũi tên đang vẽ lúc kéo hết dây, vốn chúc mũi nhiều hơn thật, để một đầu ngắm chắn đường cũng được thấy là chắn. Vòng rỗng là còn hở, vòng vàng là sát, đĩa đỏ đặc là chắn.
- Góc nhìn ngang: cung nghiêng theo hướng tên rời cung, thanh cân bằng vuông góc với dây. Tên trên dây chúc mũi xuống theo `nockAngle`, nhân với mức phóng đại.
- Chuyển động chậm: tốc độ thường là chậm 12 lần so với thật; các mức là 1/48, 1/24, 1/12, 1/6 và tốc độ thật.
- Cung và mũi tên vẽ cùng một tỉ lệ: cung 68 in cao 187 đơn vị, nên tên 27 in dài khoảng 74 đơn vị. Cự ly tới bia, độ uốn và độ trôi mỗi thứ có tỉ lệ riêng, nên toàn cảnh vẫn không theo tỉ lệ.
- Phóng đại độ uốn: 1× tới 5×, mặc định 2×. Ở 1×, tên cân (`flexAmplitude` 0.4) uốn lệch 3% chiều dài thân; công thức là `flex · 0.075 · chiều dài · mức phóng đại`.
- Góc nhìn ngang vẽ góc bắn gấp 3 lần thật: 1,5° ở 18 m thành 4,5°, 7,6° ở 90 m thành 23°. Chiều cao của đường bay được co giãn cho khớp với góc đó, nên cự ly càng xa cung càng ngửa và cung bay càng cao (tối đa 105 đơn vị). Đường bay đi từ dây tới mặt bia; mũi tên bám vào nó bằng nock lúc đầu và bằng đầu point lúc cuối, nên rời dây không giật và đầu tên cắm đúng chỗ đường bay chạm bia.
- Điểm chạm vẽ theo một trong hai chế độ, chọn cạnh nút góc nhìn. Chế độ chỉ đổi hình vẽ, không đổi kết quả của mô hình.
- "Một điểm chạm" (mặc định), tên có cánh làm chuẩn: coi như thước ngắm đã chỉnh để nó vào tâm vàng, đúng như cách làm phép thử bareshaft. Độ trôi của tên có cánh được trừ khỏi cả hai đường bay, nên tên có cánh luôn cắm tâm, còn bareshaft cắm lệch đúng bằng `offset` ở mục 10. Xu hướng lệch của tên có cánh chỉ còn thấy qua tư thế bay (lắc, chúc, uốn) và qua bảng kết quả. Thang vẽ: `offset` lớn nhất thường gặp (khoảng 0,46) cắm ngay ngoài mép bia.
- "Hai điểm chạm": không trừ gì cả, mỗi mũi tên cắm đúng chỗ mô hình tính. Xu hướng lệch ngang và dọc của tên có cánh hiện thành trượt tâm. Thang vẽ nhỏ hơn (1,4 lần bán kính mặt bia cho xu hướng tối đa không có cánh lái về, so với 2,4 lần ở chế độ kia): bareshaft ở mức tối đa cắm ra ngoài bia một chút, tên có cánh được lái về nên vẫn nằm trên bia.
- Độ lệch vẽ theo một thang riêng cho từng chế độ, giống nhau ở hai góc nhìn và không đổi khi bật hay tắt bareshaft. Ở góc nhìn ngang, đường bay được tách thành cung đạn đạo (vẽ theo thang của góc bắn) cộng độ lệch (vẽ theo thang này); vẽ chung một thang thì khoảng cách giữa hai mũi tên chỉ còn vài đơn vị, không đọc được.
- Góc cung được ghi bằng số ở góc nhìn ngang. Con số là góc bắn thật của mô hình (có lực cản không khí); cung tròn đánh dấu thì vẽ theo góc đã phóng to 3 lần.
- Bia vẽ theo chuẩn World Archery, cùng tỉ lệ với cung: mặt 40 cm ở 18 m, 80 cm ở 30 và 50 m, 122 cm ở 70 và 90 m. Năm màu, mỗi màu hai vòng điểm, mười vòng rộng bằng nhau. Độ trôi ngang và dọc của tên thì không theo tỉ lệ này: tên cắm lệch tâm bao nhiêu trên hình không phải là số cm thật.
- Dạng uốn của thân tên theo mode 1: điểm cách nock một phần `s` (0..1) lệch ngang `bend · cos(2π · (s − ½))`, tức giữa thân đi một phía, hai đầu đi phía kia.
- Vị trí giữa hai mẫu đường bay được nội suy tuyến tính.

## 16. Code nằm ở đâu

| Nội dung | File |
|---|---|
| Mọi hệ số và ngưỡng (con số) | `src/engine/coefficients/heuristic-0.4.json` |
| Ý nghĩa từng hệ số, kiểm tra file khi nạp | `src/engine/coefficients/coefficients.ts` |
| Khối lượng tên | `src/models/arrow.ts` |
| `EI`, tần số uốn | `src/engine/simulation/arrowModel.ts` |
| Năng lượng, vận tốc, quán tính cung | `src/engine/simulation/bowModel.ts` |
| Spine cần thiết, mismatch | `src/engine/simulation/dynamicSpine.ts` |
| Plunger | `src/engine/simulation/plungerModel.ts` |
| Các chỉ số, bare shaft | `src/engine/simulation/simulate.ts` |
| Xé giấy | `src/engine/simulation/paperTear.ts`; hình vẽ ở `src/components/tuning/paperTearGeometry.ts` |
| Grains per pound, FOC, động năng, khối lượng tên tối thiểu theo AMO | `src/engine/simulation/derivedMetrics.ts` |
| Ngưỡng phân loại | `src/engine/simulation/classification.ts` |
| Đường bay | `src/engine/simulation/trajectory.ts` |
| Gợi ý | `src/engine/recommendation/suggest.ts` |
| Đọc bia thật và chẩn đoán | `src/engine/diagnosis/targetPlot.ts` |
| Dịch chuyển riêng của từng người, phép dò | `src/models/calibration.ts`, `src/engine/calibration/fit.ts` |
| Đường bay có lực cản, vạch thước ngắm, khoảng hở dưới đầu ngắm | `src/engine/ballistics/flight.ts`, `sightMarks.ts`, `sightClearance.ts` |
| Quan sát thực tế: kiểu dữ liệu, kiểm tra, lưu | `src/models/observation.ts`, `src/utils/observations.ts`, `src/storage/observationRepository.ts` |
| Đường lực kéo: hình dạng, ước lượng, dựng từ số đo | `src/engine/simulation/drawCurve.ts` |
| Số ghi trên limb ra lực trên ngón tay | `src/utils/markedDrawWeight.ts` |
| Đổi đơn vị | `src/utils/units.ts` |
| Giới hạn và mặc định của thông số | `src/models/parameters.ts` |
