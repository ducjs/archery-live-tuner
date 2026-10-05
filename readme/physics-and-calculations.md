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

E = ½ · drawWeight · powerStroke · drawCurveFactor             J   (powerStroke đổi ra m)
    drawCurveFactor = 1.14

m_động = m_tổng + limbVirtualMass + stringMass · stringMassShare
    limbVirtualMass = 5.5 g,  stringMassShare = 1/3

v = √(2·E / m_động)                                            m/s (m_động đổi ra kg)
```

`½·F·s` là năng lượng của đường lực kéo tuyến tính; `drawCurveFactor` bù cho việc cung recurve tích nhiều hơn thế. `limbVirtualMass` là phần khối lượng của limb và dây cùng chuyển động với tên, nên ăn bớt năng lượng. Không có hệ số hiệu suất riêng.

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
| powerStroke | 0.5 | cần thân cứng hơn |
| arrow length | 2.5 | cần thân cứng hơn (ảnh hưởng mạnh nhất) |
| m_trước (point + insert) | 0.3 | cần thân cứng hơn |
| m_sau (nock + fletching) | −0.1 | cần thân mềm hơn |
| stringMass | −0.1 | cần thân mềm hơn |
| strandCount | −0.05 | cần thân mềm hơn |

`shaftGpi` và `shaftDiameter` không có mặt trong luật này.

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

### 7.5 Lệch dọc

```text
verticalTendency = tanh(
    0.25 · (nockingPointHeight − 4)          mỗi mm
  − 0.08 · (tiller − 4) )                    mỗi mm

pitch = −0.015 · verticalTendency            rad
```

Nock cao thì đuôi tên rời cung ở trên, tức mũi chúi xuống, nên `pitch` mang dấu âm. Nocking point là đầu vào chính, tiller là phụ.

### 7.6 Nguy cơ chạm cung (clearance)

```text
clearanceRisk = clamp01(
    0.15
  + 0.50 · |dynamicBehavior|
  + 0.06 · max(0, centerShot)                mỗi mm về phía riser
  + nockFit                                  TIGHT +0.10, NORMAL 0, LOOSE −0.03
  + 0.60 · max(0, ln(220 / braceHeight))     chỉ khi brace height thấp hơn 220 mm
  + 0.10 · |verticalTendency|
  + 0.03 · (shaftDiameter − 4.2) )           mỗi mm
```

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

flex(t) = hướng · flexAmplitude · exp(−14 · t) · cos(2π · f · t)
```

- `hướng` bằng `side`: nhịp uốn đầu tiên là về phía riser.
- Lắc đuôi (fishtail) và nhấp nhô (porpoise) là chuyển động của cả mũi tên, tần số cố định 6 Hz, chậm hơn nhiều so với rung uốn `f` (khoảng 70 Hz).
- Độ trôi `y` và `z` tăng tuyến tính theo khoảng cách. Ở lệch ngang tối đa, tên trôi 1 mm mỗi 120 mm đường bay. Đây là minh họa, không phải vị trí trúng bia.

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
- Clearance chưa tính theo pha dao động so với thời gian tên còn trên dây (§34.2). Tần số uốn đã có nhưng chưa được dùng cho việc này.
- `shaftGpi` chỉ ảnh hưởng tần số uốn và vận tốc, không ảnh hưởng weak / stiff. `shaftDiameter` chỉ ảnh hưởng clearance.
- Bow mass và stabilizer chỉ ảnh hưởng mức dao động.
- Tốc độ tắt của rung uốn (14 /s) và tần số lắc đuôi (6 Hz) là hằng số, không phụ thuộc setup.
- Độ trôi ngang và dọc tuyến tính theo khoảng cách và không có đơn vị thật.
- Không mô hình hóa người bắn: release, tay cầm cung, collapse (§7, §37).
- Hệ số còn nằm trong code (`heuristicV0.ts`), chưa chuyển sang JSON có phiên bản (§34.7).
- Chưa đối chiếu với bảng spine của nhà sản xuất (§25 Test 8).

## 14. Tính toán ở trang "Xem trước"

Các công thức dưới đây chỉ chạy trong demo (`src/pages/demos/logic/`), chưa thuộc engine.

```text
grains per pound = m_tổng (gr) / drawWeight (lb)

FOC % = (điểm_cân_bằng − L/2) / L · 100
điểm_cân_bằng = (m_thân · L/2 + m_trước · L + m_cánh · 0.08·L) / m_tổng
        vị trí đo từ nock; nock đặt ở 0, cánh ở 8 % chiều dài

động năng = ½ · m_tổng · v²                                    J
```

- Landscape: `dynamicBehavior` trên lưới spine 500..900 (bước 50) × point 80..140 gr (bước 10), các giá trị khác giữ nguyên.
- Sensitivity: tăng từng thông số thêm 1/10 khoảng giới hạn của nó (giảm nếu hết chỗ tăng), ghi độ đổi của `dynamicBehavior`, bỏ mức dưới 0.005, xếp theo độ lớn.
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

- Chuyển động chậm: tốc độ thường là chậm 12 lần so với thật; các mức là 1/48, 1/24, 1/12, 1/6 và tốc độ thật.
- Phóng đại độ uốn: 1× tới 5×, mặc định 3×. Hình vẽ không theo tỉ lệ.
- Dạng uốn của thân tên theo mode 1: điểm cách nock một phần `s` (0..1) lệch ngang `bend · cos(2π · (s − ½))`, tức giữa thân đi một phía, hai đầu đi phía kia.
- Vị trí giữa hai mẫu đường bay được nội suy tuyến tính.

## 16. Code nằm ở đâu

| Nội dung | File |
|---|---|
| Mọi hệ số và ngưỡng | `src/engine/coefficients/heuristicV0.ts` |
| Khối lượng tên | `src/models/arrow.ts` |
| `EI`, tần số uốn | `src/engine/simulation/arrowModel.ts` |
| Năng lượng, vận tốc, quán tính cung | `src/engine/simulation/bowModel.ts` |
| Spine cần thiết, mismatch | `src/engine/simulation/dynamicSpine.ts` |
| Plunger | `src/engine/simulation/plungerModel.ts` |
| Các chỉ số, bare shaft | `src/engine/simulation/simulate.ts` |
| Ngưỡng phân loại | `src/engine/simulation/classification.ts` |
| Đường bay | `src/engine/simulation/trajectory.ts` |
| Gợi ý | `src/engine/recommendation/suggest.ts` |
| Đổi đơn vị | `src/utils/units.ts` |
| Giới hạn và mặc định của thông số | `src/models/parameters.ts` |
