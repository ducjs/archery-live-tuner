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
| Đường bay dọc (cung đạn đạo) | Vật lý | Không có lực cản không khí |
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

FOC % = (điểm_cân_bằng − L/2) / L · 100
điểm_cân_bằng = (m_thân · L/2 + m_trước · L + m_cánh · 0.08·L) / m_tổng
        vị trí đo từ nock; nock đặt ở 0, cánh ở 8 % chiều dài

động năng = ½ · m_tổng · v²                                    J
```

- Setup tham chiếu: 308 gr trên cung 38 lb là 8,1 gr/lb; FOC 19,3 %.
- Dưới 5 gr/lb thì bảng kết quả hiện cảnh báo tên quá nhẹ, ở cả Cơ bản và Nâng cao. 5 gr/lb là mức tối thiểu theo AMO mà các hãng cung hay dẫn; chưa đối chiếu được với trang 17–32 của sách Easton vì bản đang có thiếu các trang đó.
- Ba con số chỉ hiện ở chế độ Nâng cao.
- FOC chưa có cảnh báo. Sách Easton ghi 7 tới 16 %, nhưng cách tính ở đây đặt cả point lẫn insert ở đúng đầu thân tên và không tính chiều dài point, nên ra số cao hơn cách đo của sách: setup tham chiếu đã là 19,3 %. So với khoảng của sách thì sẽ báo sai.

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

Cung đạn đạo không lực cản, ngắm vào tâm bia ở khoảng cách `D` (18, 30, 50, 70 hoặc 90 m):

```text
g = 9806.65 mm/s²

góc_nâng = ½ · asin(min(1, g·D / v²))
v_x      = v · cos(góc_nâng)
T        = D / v_x                             thời gian bay
```

Mẫu cách nhau 1 ms, tối đa 5000 điểm. Tại thời điểm `t`, với `x = v_x · t`:

```text
y(t)    = v · sin(góc_nâng) · t − ½·g·t² − verticalTendency · driftFactor · (1/200) · x
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

## 11. Gợi ý tuning

### 11.1 Điểm sai lệch

```text
tuningError = |dynamicBehavior|
            + |lateralDeviation của bare shaft|
            + |verticalTendency|
            + 0.5 · clearanceRisk
            + 0.3 · oscillation
```

Setup được coi là đã cân khi cả năm phân loại đều NEUTRAL hoặc LOW và bare shaft TOGETHER ở cả hai chiều.

### 11.2 Tìm và xếp hạng

Với từng thông số trong bảng dưới: thử 24 giá trị, 12 bước mỗi phía trong khoảng ±`maxMove`, làm tròn về bước của thanh trượt, bỏ giá trị ngoài giới hạn. Giữ giá trị cho `tuningError` thấp nhất; nếu hòa thì chọn thay đổi nhỏ hơn. Bỏ thông số nào giảm sai lệch chưa tới 0.03.

```text
improvement = (sai_lệch_gốc − sai_lệch_tốt_nhất) / sai_lệch_gốc      hiển thị
rank        = (sai_lệch_gốc − sai_lệch_tốt_nhất) / cost              xếp hạng
```

| Thông số | Nhóm | `cost` | `maxMove` |
|---|---|---|---|
| nocking point height | chỉnh trên cung | 1 | 6 mm |
| plunger stiffness | chỉnh trên cung | 1 | 0.6 |
| plunger preload | chỉnh trên cung | 1 | 1.5 mm |
| center shot | chỉnh trên cung | 1.2 | 2 mm |
| brace height | chỉnh trên cung | 1.2 | 1 cm |
| tiller | chỉnh trên cung | 1.2 | 4 mm |
| draw weight | chỉnh trên cung | 1.5 | 3 lb |
| point weight | đổi phụ kiện tên | 1.8 | 20 gr |
| nock weight | đổi phụ kiện tên | 1.8 | 4 gr |
| arrow length | mua tên mới | 3 | 1 in |
| spine | mua tên mới | 3 | 150 |

Mỗi gợi ý là một thay đổi đơn lẻ từ setup hiện tại, không phải một chuỗi. Ở chế độ Simple chỉ gợi ý thông số Simple.

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
| Thời gian bay 18 m / 70 m | 0.308 s / 1.204 s |
| `dynamicBehavior`, lệch ngang, lệch dọc | 0, 0, 0 |
| `flexAmplitude` / `oscillation` / `clearanceRisk` | 0.40 / 0.20 / 0.15 |
| `oscillationDecay` / `stabilityTime` | 22 /s / 0.063 s |

## 13. Giới hạn đã biết

- Không có lực cản không khí. Vận tốc không giảm trên đường bay, nên thời gian bay ở cự ly xa bị ngắn hơn thực tế.
- `shaftGpi` chỉ ảnh hưởng tần số uốn và vận tốc (và qua đó clearance), không ảnh hưởng weak / stiff. `shaftDiameter` chỉ ảnh hưởng clearance.
- Bow mass và stabilizer chỉ ảnh hưởng mức dao động.
- Tốc độ tắt của rung uốn (14 /s) và tần số lắc đuôi (6 Hz) là hằng số, không phụ thuộc setup.
- Độ trôi ngang và dọc tuyến tính theo khoảng cách và không có đơn vị thật.
- Không mô hình hóa người bắn: release, tay cầm cung, collapse (§7, §37).
- Chưa đối chiếu với bảng spine của nhà sản xuất (§25 Test 8).
- Vài điểm còn lệch với tài liệu tuning (vị trí center shot trung tính, nocking point khởi đầu), ghi ở [tuning-references.md](tuning-references.md).

## 14. Tính toán ở trang "Xem trước"

Các công thức dưới đây chỉ chạy trong demo (`src/pages/demos/logic/`), chưa thuộc engine. Mã hoá setup vào đường link đã chuyển thành tính năng thật, ở `src/utils/setupTransfer.ts`. Chỉ số phụ (grains per pound, FOC, động năng) đã chuyển vào engine, xem mục 7.7.

- Landscape và sensitivity đã chuyển vào engine (`src/engine/explore/explore.ts`) và hiện ở trang Simulator, mục "Hiển thị: Toàn cảnh". Landscape: `dynamicBehavior` trên lưới spine 400..1000 (bước 50) × point 80..140 gr (bước 10), các giá trị khác giữ nguyên. Sensitivity: tăng từng thông số thêm 1/10 khoảng giới hạn của nó (giảm nếu hết chỗ tăng), ghi độ đổi của `dynamicBehavior`, bỏ mức dưới 0.005, xếp theo độ lớn. Cả hai tính trong Web Worker (`src/workers/explore.worker.ts`).
- Tuning plan: áp gợi ý đứng đầu lặp lại, tối đa 5 bước.
- Đọc bia (target plot), tọa độ tính bằng cm:

```text
tâm_cụm = trung bình vị trí tên có cánh              cần ít nhất 3 tên có cánh và 1 bare shaft
độ_tản  = trung bình khoảng cách từ từng tên tới tâm_cụm
offset  = tâm bare shaft − tâm_cụm
đủ_kết_luận = |offset| > max(1.5 cm, 0.75 · độ_tản)
một chiều chỉ được tính khi thành phần của nó > 0.4 · |offset|
đề nghị đổi thân tên khi |offset| > max(6 cm, 2.5 · độ_tản)
```

## 15. Hiển thị

Không thuộc mô hình, nhưng quyết định cái người dùng thấy:

- Đoạn phim mở đầu ở tư thế kéo hết dây và đứng yên tới khi bấm chạy. Dây kéo lùi đúng bằng power stroke theo tỉ lệ của cung. Cánh cung cong theo: đầu cánh lùi về sau và khép vào vừa đủ để dây giữ nguyên chiều dài (đầu cánh lùi 35% quãng kéo, con số chọn cho hợp mắt).
- Quãng dây đẩy tên được chiếu chậm hơn quãng bay. Cung vẽ to hơn nhiều so với cự ly tới bia, nên nếu chiếu cùng nhịp thì tên vọt khỏi dây rồi như bị phanh lại. Nhịp chiếu được chọn để tên rời dây đúng bằng tốc độ nó bay trên màn hình sau đó, tối đa 1,2 giây. Số mili giây hiển thị vẫn là thời gian thật.
- Góc nhìn ngang: cung nghiêng theo hướng tên rời cung, thanh cân bằng vuông góc với dây. Tên trên dây chúc mũi xuống theo `nockAngle`, nhân với mức phóng đại.
- Chuyển động chậm: tốc độ thường là chậm 12 lần so với thật; các mức là 1/48, 1/24, 1/12, 1/6 và tốc độ thật.
- Cung và mũi tên vẽ cùng một tỉ lệ: cung 68 in cao 187 đơn vị, nên tên 27 in dài khoảng 74 đơn vị. Cự ly tới bia, độ uốn và độ trôi mỗi thứ có tỉ lệ riêng, nên toàn cảnh vẫn không theo tỉ lệ.
- Phóng đại độ uốn: 1× tới 5×, mặc định 2×. Ở 1×, tên cân (`flexAmplitude` 0.4) uốn lệch 3% chiều dài thân; công thức là `flex · 0.075 · chiều dài · mức phóng đại`.
- Góc nhìn ngang vẽ góc bắn gấp 3 lần thật: 1,5° ở 18 m thành 4,5°, 7,6° ở 90 m thành 23°. Chiều cao của đường bay được co giãn cho khớp với góc đó, nên cự ly càng xa cung càng ngửa và cung bay càng cao (tối đa 105 đơn vị). Đường bay đi từ dây tới mặt bia; mũi tên bám vào nó bằng nock lúc đầu và bằng đầu point lúc cuối, nên rời dây không giật và đầu tên cắm đúng chỗ đường bay chạm bia.
- Điểm chạm vẽ theo một trong hai chế độ, chọn cạnh nút góc nhìn. Chế độ chỉ đổi hình vẽ, không đổi kết quả của mô hình.
- "Một điểm chạm" (mặc định), tên có cánh làm chuẩn: coi như thước ngắm đã chỉnh để nó vào tâm vàng, đúng như cách làm phép thử bareshaft. Độ trôi của tên có cánh được trừ khỏi cả hai đường bay, nên tên có cánh luôn cắm tâm, còn bareshaft cắm lệch đúng bằng `offset` ở mục 10. Xu hướng lệch của tên có cánh chỉ còn thấy qua tư thế bay (lắc, chúc, uốn) và qua bảng kết quả. Thang vẽ: `offset` lớn nhất thường gặp (khoảng 0,46) cắm ngay ngoài mép bia.
- "Hai điểm chạm": không trừ gì cả, mỗi mũi tên cắm đúng chỗ mô hình tính. Xu hướng lệch ngang và dọc của tên có cánh hiện thành trượt tâm. Thang vẽ nhỏ hơn (1,4 lần bán kính mặt bia cho xu hướng tối đa không có cánh lái về, so với 2,4 lần ở chế độ kia): bareshaft ở mức tối đa cắm ra ngoài bia một chút, tên có cánh được lái về nên vẫn nằm trên bia.
- Độ lệch vẽ theo một thang riêng cho từng chế độ, giống nhau ở hai góc nhìn và không đổi khi bật hay tắt bareshaft. Ở góc nhìn ngang, đường bay được tách thành cung đạn đạo (vẽ theo thang của góc bắn) cộng độ lệch (vẽ theo thang này); vẽ chung một thang thì khoảng cách giữa hai mũi tên chỉ còn vài đơn vị, không đọc được.
- Góc cung được ghi bằng số ở góc nhìn ngang. Con số là góc bắn thật của mô hình (không có lực cản không khí); cung tròn đánh dấu thì vẽ theo góc đã phóng to 3 lần.
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
| Grains per pound, FOC, động năng | `src/engine/simulation/derivedMetrics.ts` |
| Ngưỡng phân loại | `src/engine/simulation/classification.ts` |
| Đường bay | `src/engine/simulation/trajectory.ts` |
| Gợi ý | `src/engine/recommendation/suggest.ts` |
| Đường lực kéo: hình dạng, ước lượng, dựng từ số đo | `src/engine/simulation/drawCurve.ts` |
| Số ghi trên limb ra lực trên ngón tay | `src/utils/markedDrawWeight.ts` |
| Đổi đơn vị | `src/utils/units.ts` |
| Giới hạn và mặc định của thông số | `src/models/parameters.ts` |
