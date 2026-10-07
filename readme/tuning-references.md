# Tài liệu tuning tham khảo

Tài liệu này ghi lại các nguồn tuning đã đọc, những điểm rút ra được cho mô hình, và chỗ nào mô hình khớp hay còn lệch với chúng. Công thức của mô hình nằm ở [physics-and-calculations.md](physics-and-calculations.md).

Bản gốc của các nguồn nằm trong thư mục `docs/` trên máy, không đưa vào repo vì thuộc bản quyền của người khác (`docs/` có trong `.gitignore`). Ở đây chỉ có ghi chú tự viết.

> **Nói đơn giản:** Sách tuning không cho công thức, nhưng cho biết đổi cái gì thì tên yếu đi hay cứng lên, nên chỉnh theo thứ tự nào, và lệch bao nhiêu thì phải đổi tên. Mô hình được đối chiếu với các điều đó. Một chỗ sai chiều (brace height) và một chỗ quá nhẹ (dây) đã sửa; các chỗ còn lệch được ghi lại để xử lý sau.

## 1. Các nguồn

Cột "Tin" xếp theo tác giả và cách tài liệu được làm ra: A là chuẩn ngành hoặc bài khoa học, B là huấn luyện viên hoặc người bắn có tên tuổi, C là một người viết và không dẫn nguồn, D là không dùng cho mô hình.

| Nguồn | Nội dung | Tin | Bản đang có |
|---|---|---|---|
| Easton, *Arrow Tuning and Maintenance Guide*, 2nd edition, Rev. 4 (4/99) và Rev. 5 (11/00). Phần tuning do Don Rabska biên soạn | Chuẩn bị cung, bare shaft, paper tuning, tuning cự ly ngắn, đọc cụm tên, fine và micro tuning, FOC, khối lượng tên tối thiểu theo AMO | A | Đủ 32 trang, có hình (từ 2026-10-07) |
| B.W. Kooi, *The Archer's Paradox and Modelling, a Review*, History of Technology 20 (1998) | Tên uốn quanh cung thế nào, các tiêu chuẩn ghép tên với cung, số đo của Pękalski | A | Đủ 16 trang |
| B.W. Kooi, *On the Mechanics of the Bow and Arrow*, luận án tiến sĩ, Groningen (1983) | Năng lượng tích trong cung, hiệu suất, vận tốc, ảnh hưởng của dây và brace height. Bỏ qua mọi chuyển động ngang | A | Đủ 175 trang. Mới đọc chương 1, các tóm tắt và vài bảng |
| Kisik Lee và Robert de Bondt, *Total Archery* (2005), chương 10 | Cách tuning của đội Olympic Úc: limb alignment, tiller, center shot, brace height, bare shaft, FOC | A− | Đủ, 10 trang về tuning. Tự nói là phần lớn theo sách Easton |
| Kisik Lee và Tyler Benner, *Total Archery: Inside the Archer* (2009) | 28 chương về tư thế và chu trình bắn | B | Bản scan không có lớp chữ. Mới xem bìa và mục lục; không có tuning |
| Archery Australia, *Advanced Shooting Technique*, version 3 (2007) | Kỹ thuật bắn; một mục về clearance | B | Đủ 41 trang |
| Archery Victoria, *Recurve Bow Tuning*, booklet 1213, Trevor Filmer (2012) | Chọn tên, quy trình tuning bảy bước, walk-back, tiller | C | Đủ 22 trang, mất các phân số. Phần vật lý có lỗi (ghi động năng bằng lực nhân khối lượng) |
| Kim Hyung-Tak, slide huấn luyện (2007) | Lộ trình tập theo tuổi, clicker, string alignment | D | 87 slide, phần lớn là hình |
| *The Nuts & Bolts of Archery* | Compound, gom từ diễn đàn | D | 159 trang |
| *The Physics of Archery*, bài trình bày của sinh viên | Định luật Hooke, động năng | D | 13 slide |
| *Basic Bow Tuning* (trang web, chưa rõ tác giả) | Vật liệu dây, brace height, nocking point | C | Khoảng 1,5 trên 15 trang |
| Murray Elliot (biên tập), *Reference guide for recurve archers*, edition 5, 2002 | Thiết bị, dây, tên, tuning; có kèm "Tuning for Tens" của Rick Stonebraker | B | Đủ 68 trang nhưng chữ dính liền, chưa dùng được |
| Jake Kaminski, video *Recurve Archery Draw Force Curves* (youtube.com/watch?v=teMO9oCl4YE) | Máy đo đường lực kéo tự chế; so ba mức limb rocker và hai mẫu limb | B | Ghi chú tóm tắt và transcript |
| Jake Kaminski, video *Recurve Limbs Shootout: Wood vs Foam* | MXT-XP lõi foam và lõi gỗ, cùng 42 lb: vận tốc tên và đường lực kéo | B | Phụ đề của video |
| Uukha, *Setup Your Bow* (uukha.com/en/setup-your-bow) | Tính lực kéo thật từ số ghi trên limb, draw length và vị trí limb bolt | B | Ghi chú về cách tính |

Mục 2 tới 7 viết từ sách Easton. Những gì rút thêm từ các nguồn đọc ngày 2026-10-07 nằm ở mục 9, và danh sách việc có thể làm cho engine ở mục 10. Khi hai nguồn nói khác nhau thì theo nguồn xếp cao hơn; các chỗ khác nhau đã gặp ghi ở mục 9.6.

Còn thiếu:

- Bảng chọn spine của Easton, cần cho việc đối chiếu vùng NEUTRAL (spec §25 Test 8).
- Kooi và Sparenberg, *On the mechanics of the arrow: Archer's Paradox*, Journal of Engineering Mathematics 31 (1997). Đây là bài có mô hình tên uốn quanh cung, tính cả chuyển động ngang của dây và tay cầm cung; bài 1998 chỉ tả nó bằng lời. Chưa có bài này thì chưa có nguồn nào cho độ lớn của weak và stiff.
- Bản sạch của sách Murray Elliot.

## 2. Chiều hướng: mô hình so với sách

Cho người bắn tay phải, finger release. Tay trái thì đổi trái phải.

| Điều sách nói | Mô hình | |
|---|---|---|
| Bare shaft rơi bên trái cụm tên có cánh: tên cứng. Bên phải: tên yếu | Giống | Khớp |
| Bare shaft rơi cao hơn cụm: nocking point quá thấp. Thấp hơn: quá cao | Giống | Khớp |
| Tên cứng thì tăng lực kéo, tăng point, hoặc giảm lực plunger | Lực kéo và point tăng làm tên yếu đi; plunger mềm hơn làm tên yếu đi | Khớp |
| Dây nặng hơn hoặc nhiều sợi hơn làm tên phản ứng cứng hơn | Cùng chiều | Khớp; độ lớn đã chỉnh (mục 4.1) |
| Tăng brace height làm tên bắn yếu đi; cả dải brace height tương đương khoảng 20 gr point | Trước đây ngược chiều. Đã sửa | Khớp, xem mục 3 |
| Tăng brace height làm mất một ít vận tốc vì power stroke ngắn lại | Vận tốc tính từ power stroke | Khớp |
| Nock quá chặt gây vấn đề, nhất là cung dưới 30 lb | Nock fit TIGHT cộng vào nguy cơ clearance | Khớp về chiều; chưa phụ thuộc lực kéo |

## 3. Brace height: đã sửa

Sách: tăng brace height nén limb nhiều hơn, lực ở full draw tăng lên, tên bắn yếu đi. Giảm brace height thì ngược lại. Thay đổi trong dải brace height dùng được có tác dụng lên spine ngang với đổi point khoảng 20 gr.

Mô hình cũ đưa brace height vào spine cần thiết qua power stroke (`drawLength − braceHeight`), nên brace height cao hơn cho ra tên **cứng** hơn. Sai chiều.

Mô hình hiện tại tách hai đại lượng trong luật spine cần thiết:

| Đầu vào | Số mũ | Ghi chú |
|---|---|---|
| drawLength | 0.72 | Giữ nguyên độ nhạy theo draw length như trước, tại setup tham chiếu |
| braceHeight | 0.3 | Đi hết dải 21,0 tới 24,1 cm cho độ lệch 0.041, so với 0.042 của 20 gr point |

Kết quả từ setup tham chiếu (brace 22 cm):

| Brace height | `dynamicBehavior` trước | sau |
|---|---|---|
| 21,0 cm | −0.030 | +0.042 |
| 24,1 cm | +0.065 | −0.082 |

Năng lượng và vận tốc vẫn tính từ power stroke như cũ.

## 4. Các điểm còn lệch

Trừ mục 4.1, chưa sửa. Mỗi điểm còn lại cần quyết định trước khi đụng vào engine.

### 4.1 Số sợi dây: đã chỉnh

Sách: thêm hoặc bớt sợi dây có thể đổi spine động tới mức phải chọn thân tên khác một cỡ. Mô hình cũ cho 16 lên 20 sợi kèm dây nặng thêm 25% chỉ +0.10, còn một cỡ spine (700 xuống 600) là +0.43.

Số mũ của khối lượng dây đã tăng từ −0.1 lên −0.2. Cùng thay đổi đó giờ cho +0.16, khoảng ba phần tư một bước spine 50. Không đẩy lên đủ một cỡ vì chữ "có thể" của sách là mức tối đa.

Còn mở: sách nói lớp serving giữa và loại nocking point (kim loại hay buộc chỉ) có tác dụng tương tự; mô hình chưa có hai thông số đó.

### 4.2 Center shot trung tính

Sách: với finger release, đầu point đặt lệch ra ngoài đường dây 1,6 tới 3,2 mm, để bù cho độ lún của plunger lúc thả dây. Người bắn recurve không dùng vị trí trong ngoài này để tuning; chỉ chỉnh lực plunger.

*Total Archery* nói cùng điều: trên recurve, tên nằm hơi lệch ra ngoài đường dây. Archery Victoria cũng đặt tên "vừa thấy ngoài center shot".

Mô hình coi center shot 0 mm là cân, và đặt center shot đúng như sách (2,4 mm ra ngoài) thì báo bare shaft lệch trái. Hai cách xử lý: dời điểm trung tính ra khoảng 2,4 mm phía ngoài, hoặc định nghĩa lại thông số là "lệch so với vị trí chuẩn". Liên quan: gợi ý tuning hiện có đề xuất chỉnh center shot, trái với lời khuyên của sách cho recurve.

### 4.3 Nocking point và tiller khởi đầu

Sách Easton: khởi đầu 13 mm trên vuông góc cho finger release. *Total Archery*: 4,8 tới 9,5 mm, đo tới mép dưới của nock, và tên dài (31 in) có thể cần cao hơn tên ngắn (26 in). Trang *Basic Bow Tuning*: 3 tới 10 mm. Mô hình coi 4 mm là cân và báo quá cao từ khoảng 7 mm. Con số này phụ thuộc cách đo và kiểu nock, nên chưa kết luận mô hình sai, nhưng điểm trung tính 4 mm nằm dưới khoảng của Easton và *Total Archery*, và ngưỡng báo quá cao rơi vào giữa khoảng mà *Total Archery* coi là bình thường.

Tiller cũng vậy: *Total Archery* ghi tiller trên lớn hơn tiller dưới 4,8 tới 6,4 mm làm mức khởi đầu, và nói đây là thứ chỉnh theo từng người. Mô hình coi 4 mm là cân.

### 4.4 Định nghĩa "đã cân"

Sách: setup tune tốt thường có bare shaft rơi hơi thấp và hơi cứng (hơi trái với tay phải), không trùng khít với cụm. Có khi bare shaft cao hơn cụm là dấu hiệu nocking point thấp, dễ ép cánh vào rest. Mô hình và phần gợi ý đang coi trùng khít là đích.

## 5. Quy trình và ngưỡng dùng được

### Thứ tự tuning

1. Chuẩn bị: lắp đủ phụ kiện, nocking point, center shot, plunger ở mức trung bình, brace height ở đầu thấp của dải.
2. Chiều dọc trước (porpoising): chỉnh nocking point.
3. Chiều ngang sau (fishtailing): chỉnh plunger, lực kéo, point.
4. Clearance.
5. Fine tuning và micro tuning theo cụm tên.

Mỗi lần chỉ đổi một thông số. Phần đọc bia ở trang "Xem trước" đã theo thứ tự dọc trước ngang sau; phần gợi ý của engine thì chưa có thứ tự này.

### Bare shaft

- Bắn ít nhất 3 tên có cánh và 2 bare shaft, ở 15 tới 20 m. Khi đã gần thì ra 25 tới 30 m để đọc tinh hơn.
- Bare shaft lệch ngang quá 15 cm ở 18 m sau khi đã chỉnh: phải đổi cỡ thân tên hoặc đổi thiết bị. Phần đọc bia đang dùng ngưỡng 6 cm.
- Bare shaft không về được gần cụm bằng các chỉnh ngang: spine sai.

### Bước chỉnh

| Thông số | Bước thô | Bước tinh |
|---|---|---|
| Nocking point | 1,6 mm | 0,8 mm |
| Plunger | | 1/8 vòng |
| Brace height | 3 tới 4 vòng xoắn dây | khoảng 0,8 mm |

### Brace height theo chiều dài cung

| Cung | Khởi đầu | Dải tối đa |
|---|---|---|
| 64 in | 21,0 – 21,6 cm | 19,7 – 22,9 cm |
| 66 in | 21,3 – 21,9 cm | 20,3 – 23,5 cm |
| 68 in | 21,6 – 22,2 cm | 21,0 – 24,1 cm |
| 70 in | 21,7 – 22,5 cm | 21,6 – 24,8 cm |

Brace height tốt nhất là chỗ cung êm và ít rung nhất. Từ 2026-10-06 mô hình có cỡ riser và cánh, tính ra chiều dài cung và dùng bảng này: bảng kết quả báo khi brace height nằm ngoài dải tối đa. Cung 62 và 72 in không có trong bảng, mô hình kéo dài theo cùng bước 1/8 in mỗi inch. Giới hạn nhập vẫn là 15 tới 30 cm.

### Các ngưỡng khác

- FOC nên nằm trong 7 tới 16%.
- Bộ tên thi đấu: nặng nhẹ chênh nhau không quá 3 gr; thẳng trong 0,004 in.
- Paper tuning: đứng cách giấy 1,2 tới 1,8 m, đạt rồi thì lùi thêm 1,8 m và bắn lại, để chắc tên không tình cờ đi qua giấy đúng lúc đang thẳng.

## 6. Ý cho các phase sau

- **Paper tear (V0.2).** Quy trình và các cách sửa đã có ở trên. Hướng rách đã có, ở mục 9.1.
- **Minnowing.** Đuôi tên lắc ngang nhanh hơn và biên độ nhỏ hơn fishtailing; là dấu hiệu chạm cung, thường do cánh chạm rest. Hoạt hình có thể vẽ riêng kiểu này khi nguy cơ clearance cao.
- **Đọc cụm tên theo cự ly (V0.4).** Cụm bình thường to dần đều theo cự ly. Cụm xa to bất thường còn cụm gần ổn: lực cản quá lớn, giảm cỡ hoặc góc cánh. Cụm gần không nhỏ đi tương ứng với cụm xa: vấn đề clearance.
- **Bay xấu mà cụm vẫn tốt.** Thường là tên cứng: lệch lúc rời cung nhưng hồi nhanh. Ngược lại, bare shaft trùng cụm hoặc lỗ giấy tròn chưa bảo đảm cụm tốt. Hợp với ý mô phỏng cụm tên ở spec §37.
- **Node của mũi tên.** Hai node phải nằm trên đường tới bia; node trước gần đầu point hơn vì point nặng. Có thể vẽ trong góc nhìn từ trên.
- **Vật liệu dây.** Dacron B50 giãn 2,6%, bền nhưng chậm; Kevlar nhanh hơn khoảng 2 m/s; Fastflite nhẹ hơn và nhanh hơn nữa. Dùng được nếu sau này thêm lựa chọn vật liệu dây.

## 7. Giới hạn của các nguồn này

- Sách Easton, *Total Archery* và các tập hướng dẫn là thực hành, không có số đo. Chúng xác nhận chiều và thứ tự, không xác nhận độ lớn của hệ số, trừ quy đổi brace height sang 20 gr point và vài ngưỡng bare shaft.
- Hai tài liệu của Kooi có số, nhưng luận án bỏ qua chuyển động ngang, còn bài 1998 chỉ tóm tắt. Chúng kiểm được năng lượng, vận tốc và nhịp uốn, không kiểm được weak và stiff.
- Sách Easton viết chung cho recurve và compound. Chỉ các phần ghi cho recurve finger release được dùng ở đây.
- Sách xuất bản quanh năm 2000; thiết bị hiện nay có thể khác.

## 8. Đường lực kéo (DFC)

Thêm ngày 2026-10-06, lọc từ bộ ghi chú của một dự án cũ về thiết bị. Dự án đó có một bảng 65 mẫu limb với các cột mô tả đường lực kéo; bảng không được dùng ở đây, lý do ở mục 8.3. Thiết kế tính năng nằm ở spec §39.

> **Nói đơn giản:** Đường lực kéo cho biết kéo tới đâu thì nặng bao nhiêu. Hai cây cung cùng số pound vẫn có thể khác nhau ở chỗ lực tăng nhanh hay chậm lúc gần clicker, và đó là thứ người bắn cảm thấy rõ nhất. Hình dạng đường này do hình học của cung quyết định, không do lõi foam hay gỗ.

### 8.1 Điều dùng được

| Điều | Dùng cho | Độ chắc |
|---|---|---|
| Năng lượng tích trong cung là diện tích dưới đường lực kéo | Vận tốc tên; thay cho hệ số cố định `drawCurveFactor` | Vật lý, chắc |
| Người bắn cảm thấy độ dốc của lực ở cuối hành trình (lb mỗi inch), không phải số pound | Một chỉ số mới: lực tăng mỗi inch ở clicker | Chiều thì chắc; ngưỡng "dễ" hay "khó" chưa có nguồn |
| Đường đầy ở giữa hành trình và đường dốc lên ở cuối là hai chuyện khác nhau. Loại đầu tích nhiều năng lượng mà vẫn dễ qua clicker; loại sau thì không | Hai số hình dạng tách rời nhau | Chắc |
| Lực kéo thật đổi khoảng 5% mỗi inch draw length quanh 28 in (khoảng 2 lb mỗi inch với cung 40 lb) | Đổi số ghi trên limb ra lực trên ngón tay | Quy tắc quen dùng, chỉ là ước lượng |
| Limb bolt đổi lực kéo khoảng ±5% quanh vị trí giữa | Như trên | Uukha ghi cho riser của họ; hãng khác thì là ước lượng |
| Draw length AMO bằng khoảng cách từ nocking point tới pivot point của grip cộng 1,75 in | Hướng dẫn cách đo | Chuẩn AMO |
| Chỉnh limb bolt làm đổi brace height và tiller | Lời nhắc trong gợi ý tuning | Hình học, chắc |
| Dây giãn theo thời gian làm brace height trôi, kéo theo vị trí clicker trên đường lực kéo | Ghi chú nếu sau này có lựa chọn vật liệu dây | Chiều thì chắc |

### 8.2 Số đo thật

Chỉ có số đo của Jake Kaminski, vài mẫu, một người đo:

- Đổi limb rocker trên Hoyt Xceed với limb Velos, giữ brace height và limb bolt: lệch khoảng 0,3 lb, đều trên cả đường cong. Hình dạng gần như không đổi.
- Thay Velos bằng Uukha SX+: hình dạng khác rõ, SX+ có "bướu" ở giữa hành trình. Hai mẫu limb khác nhau về độ cong.
- WIAWIS MXT-XP lõi foam và lõi gỗ, cùng mẫu, cùng 42 lb: 198,4 và 199 ft/s. Ông kết luận gần như không khác về số liệu; bản lõi gỗ hơi nặng tay hơn ở đầu hành trình.

Rút ra: hình dạng đường lực kéo đi theo hình học của limb (độ cong, độ dài so với draw length), không đi theo vật liệu lõi. Vật liệu đổi khối lượng limb, độ chống xoắn, độ ổn định theo nhiệt độ và cảm giác rung.

### 8.3 Điều không dùng

- **Bảng limb theo mẫu.** Trong 65 dòng, các cột về đường lực kéo để trống ở 44 tới 46 dòng. Chỗ có điền là suy từ lời giới thiệu sản phẩm, không phải số đo. Đúng một dòng có vận tốc và năng lượng tích. Điểm tin cậy của bảng chấm theo số ô đã điền và tên miền của nguồn, nên một mẫu không có số đo nào vẫn được 9 trên 10.
- **Đoán đường lực kéo từ lõi và vỏ.** Trái với số đo ở mục 8.2.
- **"Brace height cao thì stack sớm hơn", "brace height thấp dễ tha lỗi clicker hơn".** Không có nguồn. Ý thứ hai ngược với điều thường được chấp nhận: brace height thấp thì tên nằm trên dây lâu hơn, nên lỗi của người bắn có thêm thời gian tác động.
- **"Lực tụt nhanh sau clicker thì cần spine cứng hơn".** Suy đoán. Lực lớn nhất lên tên vẫn là lực ở full draw, thứ mô hình đã dùng cho spine cần thiết.
- **Ngưỡng "stack index" 1,05 và 1,20, điểm "tính cách" của limb.** Tự đặt, không có số đo đứng sau.

### 8.4 Còn mở

- Hai nhận xét về brace height ở mục 8.3 bị loại theo lập luận, chưa đối chiếu với một nguồn nào.
- Chưa có nguồn cho độ lớn của việc cung ngắn kéo dài thì dốc lên ở cuối. Cần số đo: của chủ dự án trên cung của mình (việc ghim trong ROADMAP), hoặc đường cong Kaminski công bố.
- Mô hình tính power stroke bằng draw length trừ brace height. Nếu draw length nhập vào là AMO thì con số đó dài hơn thật 1,75 in. Chưa sửa; xem spec §39.7.

## 9. Bổ sung từ các nguồn đọc ngày 2026-10-07

> **Nói đơn giản:** Lần này có thêm sách của nhà vật lý (Kooi) và của huấn luyện viên Olympic (Kisik Lee), cùng bản sách Easton đủ trang, có hình. Chúng cho biết giấy rách hướng nào thì tên yếu hay cứng, tên nhẹ tới đâu thì hại cung, và xác nhận ba chỗ mô hình tính theo vật lý là hợp lý. Vẫn chưa có nguồn nào cho biết tên yếu "bao nhiêu" thì lệch "bao nhiêu".

### 9.1 Hướng rách giấy (Easton, hình trang 7)

Lỗ tròn là chỗ point đi qua, ba vết xòe là cánh. Cho người bắn tay phải, finger release; tay trái thì đổi trái phải.

| Vết cánh nằm ở đâu so với lỗ point | Kết luận |
|---|---|
| Trùng một lỗ | Bay tốt |
| Dưới | Nocking point thấp. Nâng mỗi lần 1,6 mm |
| Trên | Nocking point cao, hoặc clearance. Hạ mỗi lần 1,6 mm; hạ vài lần không đổi thì là clearance |
| Bên phải | Tên cứng |
| Bên trái | Tên yếu, hoặc clearance |
| Chéo | Hai lỗi cùng lúc. Sửa chiều dọc trước |

Cùng chiều với bare shaft: tên cứng rời cung với đuôi lệch phải, mũi chỉ trái, nên bare shaft rơi bên trái. Cách sửa cho từng hướng giống bảng ở mục 2.

### 9.2 Khối lượng tên tối thiểu theo AMO (Easton, trang 31)

Bảng do AMO lập theo đề nghị của các hãng cung, vì cung gãy khi bắn tên quá nhẹ. Cột cho recurve, khối lượng cả mũi tên tính bằng grain, theo lực kéo thật và draw length AMO:

| Lực kéo (lb) | 25 in | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 |
|---|---|---|---|---|---|---|---|---|---|
| tới 33 | 150 | 150 | 150 | 150 | 150 | 150 | 150 | 150 | 150 |
| 34 – 41 | 150 | 150 | 150 | 150 | 150 | 150 | 150 | 151 | 165 |
| 42 – 46 | 150 | 150 | 150 | 150 | 150 | 163 | 179 | 195 | 211 |
| 47 – 52 | 150 | 150 | 150 | 167 | 185 | 203 | 222 | 240 | 258 |
| 53 – 58 | 150 | 163 | 183 | 203 | 224 | 244 | 264 | 285 | 305 |
| 59 – 63 | 172 | 195 | 217 | 240 | 262 | 284 | 307 | 329 | 352 |

- Bảng nói về an toàn của cung, không nói về đường bay. Nó được suy từ một phép thử trên compound 60 lb có riser đúc; sách ghi riser phay có thể chịu được tên nhẹ hơn, chưa biết bao nhiêu.
- Mốc 5 gr/lb mà mô hình đang dùng để cảnh báo không có trong bảng này. Nó chỉ xuất hiện trong *Nuts & Bolts*, viết cho compound. Với cung 38 lb ở 28 in, mô hình báo dưới 190 gr còn bảng AMO chỉ đòi 150 gr.
- Luận án Kooi cho lý do vật lý: tên quá nhẹ thì rời dây trước khi dây căng lại, và hiệu suất tụt mạnh.

### 9.3 FOC (Easton, trang 32)

```text
FOC % = 100 · (A − L/2) / L

L = từ đáy rãnh nock tới cuối thân tên, không tính point
A = từ đáy rãnh nock tới điểm cân bằng của mũi tên đã lắp đủ
```

| Loại tên | FOC khuyên |
|---|---|
| Nhôm, bắn bia | 7 – 9 % |
| A/C/C, bắn bia | 9 – 11 % |
| A/C/E, bắn bia | 11 – 16 % |
| Tên săn | 10 – 15 % |

- FOC quan trọng nhất ở cự ly xa (FITA tới 90 m); trong nhà thì không đáng kể. *Total Archery* nói cùng ý và khuyên point từ 100 gr trở lên vì giữ hướng trong gió tốt hơn.
- Công thức của mô hình (physics-and-calculations.md mục 7.7) cùng dạng, nhưng đặt toàn bộ khối lượng point và insert ở đúng cuối thân tên. Setup tham chiếu ra 19,3 %, nằm ngoài mọi khoảng trên. Hai lý do có thể: trọng tâm của point và insert thật nằm lùi vào trong thân tên, và setup tham chiếu đang nặng đầu (132 gr phía trước trên thân 162 gr). Chưa tách được phần nào do đâu.

### 9.4 Tên uốn quanh cung (Kooi 1998)

Bài tổng quan này là chỗ duy nhất trong các nguồn có số đo và tiêu chuẩn vật lý cho việc ghép tên với cung.

| Điều | So với mô hình |
|---|---|
| Tiêu chuẩn Pratt: thời gian đuôi tên đi hết quãng kéo phải bằng 1,25 chu kỳ rung của tên | Setup tham chiếu: 69,7 Hz × 16,8 ms = 1,17 chu kỳ trên dây. Gần, dù mô hình không được chỉnh theo con số này. Mô hình đo nhịp tới lúc đuôi tên qua cung (1,435), không phải tới lúc rời dây |
| Mọi tiêu chuẩn (Nagler và Rheingans, Pratt, Pękalski) đều cho lực kéo tỉ lệ thuận với độ cứng uốn `EI`; khối lượng tên triệt tiêu | Khớp: số mũ của draw weight là 1.0, và `shaftGpi` không có trong luật spine cần thiết |
| Pękalski mô hình hóa cung như lò xo có hiệu suất 75 % | Setup tham chiếu: động năng của tên 34,0 J trên 47,3 J tích trữ, tức 72 % |
| Tên rời rest trước khi rời dây. Lúc thả, dây bị các ngón đẩy sang trái (tay phải), tay cầm cung dịch sang phải | Mô hình chưa tính độ uốn khi tên còn trên dây (physics mục 9.1) |
| Phim 1000 hình mỗi giây của Pękalski (hình 3 trong bài): trong hệ gắn với cung, đuôi tên lệch ngang tới khoảng 1,8 cm sau 8 ms, rồi tới lượt nửa trước của tên lệch theo | Hoạt hình: ở 1×, tên cân uốn lệch 3 % chiều dài thân (khoảng 2 cm). Cùng cỡ |
| Máy bắn của Pękalski: vặn cung quanh trục đứng 1° làm tên lệch 15,8 cm ở 30 m theo một chiều và 21,9 cm theo chiều kia | Chưa có trong mô hình. Đây là số đo duy nhất hiện có cho độ lệch ngang tính bằng cm |
| Quayle: tên được giữ ở giữa cung và thả bằng kiểu kẹp, không đẩy dây lệch, thì spine nào cũng bay thẳng | Weak và stiff là chuyện của finger release. Hợp với việc mô hình chỉ làm recurve bắn ngón |
| Phép thử spine: 1,94 lb treo giữa nhịp 28 in, `spine = F·L³ / (48·EI)` | Đúng công thức ở physics mục 4.2 |

Tiêu chuẩn mất ổn định (Blyth) cho lực kéo thấp hơn nhiều so với các tiêu chuẩn kia, và Kooi coi nó quá dè dặt: tên hiện đại vượt ngưỡng đó mà vẫn bay, vì cú bắn xong trước khi thân tên kịp oằn. Không dùng.

### 9.5 Năng lượng và vận tốc (luận án Kooi 1983)

| Điều | So với mô hình |
|---|---|
| Khối lượng dây: cộng một phần ba vào khối lượng tên (quy tắc Hickman, Kooi dùng lại) | Khớp `stringMassShare = 1/3` |
| Tăng brace height thì vận tốc luôn giảm một ít, do cả năng lượng tích lẫn hiệu suất. Hickman từng đo thấy vận tốc tăng rồi mới giảm; lý thuyết của Kooi không ra như vậy | Khớp về chiều: vận tốc tính từ power stroke |
| Hiệu suất phụ thuộc mạnh vào khối lượng tên: 0,48 với tên rất nhẹ tới 0,98 với tên rất nặng (cung H trong bảng 3.10). "Khối lượng ảo" của Klopsteg vì vậy không phải hằng số | Mô hình dùng `limbVirtualMass = 5,5 g` cố định. Đúng chiều (tên nhẹ thì hiệu suất thấp hơn), nhưng độ lớn sẽ sai dần khi tên rất nhẹ hoặc rất nặng |
| Đổi số sợi dây: dây nặng hơn làm giảm hiệu suất, dây cứng hơn làm tăng. Từ 3 tới 12 sợi hai tác dụng gần như triệt nhau; trên 12 sợi thì hiệu suất giảm | Nói về vận tốc, không nói về spine. Mô hình chỉ tính phần khối lượng |
| Cung thẳng và ngắn thì "stack": dễ kéo ở phần lớn hành trình rồi nặng vọt lên ở cuối, và tích ít năng lượng hơn | Cùng chiều với số hạng `k` của đường lực kéo (cung ngắn so với draw length thì dốc hơn ở cuối) |
| Brace height quá thấp thì dây đập vào grip sau khi tên rời | Mô hình tăng nguy cơ clearance khi brace height dưới mức chuẩn, vì lý do khác |

Luận án viết rõ là nó bỏ qua chuyển động ngang của cung, dây và tên, nên không nói gì về stabilizer, torque hay nocking point. Phần động lực học của nó làm cho cung thẳng và cung static-recurve; với cung working-recurve hiện đại nó chỉ có phần tĩnh.

### 9.6 Chỗ các nguồn nói khác nhau

| Chuyện | Các nguồn | Theo |
|---|---|---|
| Brace height khởi đầu | Easton: đầu thấp của dải. *Total Archery*: giữa dải, vì mức thấp có thể cho vài mũi tên lạc không rõ lý do. Archery Victoria: nửa cao | Chưa chọn. Cả ba cùng nói phải thử để tìm chỗ cung êm nhất, và Easton lẫn *Total Archery* đều ghi thường có hai mức êm |
| Lực plunger khởi đầu và cách tune ngang | Easton: trung bình, rồi chỉnh 1/8 vòng. *Total Archery*: khoảng 60 % dải, rồi plunger trước, point sau, lực kéo sau cùng. Archery Victoria: đặt mềm rồi để yên, tune bằng lực kéo, dây và point | Easton và *Total Archery* |
| Số sợi dây | Easton: có thể đổi spine động tới một cỡ thân. Kooi: 3 tới 12 sợi gần như không đổi vận tốc | Không mâu thuẫn: hai đại lượng khác nhau |
| Limb alignment | *Total Archery*: không quá quan trọng; Darrell Pace thắng Olympic 1976 với cánh vặn, Rick McKinney thắng giải thế giới 1983 với riser lệch 4,8 mm. Nhưng cánh thẳng thì dễ đặt center shot | Mô hình tính cánh lệch thành center shot hiệu dụng, hợp với ý này |

### 9.7 Ngưỡng và quy trình mới

- **Bare shaft ở 30 m** (*Total Archery*): lệch ngang dưới 7,6 cm thì nhiều khả năng chỉnh plunger là đủ. Không đủ thì đổi point; rồi tới lực kéo, nửa vòng tới một vòng limb bolt, hai bolt bằng nhau để không đổi tiller. Vẫn không được thì đổi spine. Dùng ba bare shaft chứ không phải hai, để lộ ra thân nào lệch khỏi bộ.
- **Nocking point làm trước spine** (*Total Archery*): nocking point sai làm đổi cả kết quả ngang.
- **Loại nocking point** (*Total Archery*): hạt đồng thay cho chỉ buộc có thể làm bare shaft lệch tới 15 cm ở 30 m. Nock ngoài loại dài làm tên bắn hơi yếu.
- **Tune không cố định** (*Total Archery*): kết quả đổi theo ngày vì người bắn đổi. Kiểm lại khoảng mỗi tháng một lần.
- **Walk-back** (Archery Victoria, độ tin C): chỉnh thước ngắm cho trúng ở 10 m, rồi bắn ở cự ly xa nhất với cùng thước ngang. Tay phải: tên đi trái thì plunger đang thò ra quá, đi phải thì thụt vào quá. Trái với Easton, vốn dặn người bắn recurve không đụng vị trí trong ngoài sau khi đã đặt. Chưa có nguồn hạng A hay B nào tả walk-back.
- **Thử tiller** (*Total Archery*): kéo chậm và thẳng tới anchor, nhìn đầu stabilizer. Đi lên thì cánh trên mạnh hơn, tăng tiller trên; đi xuống thì ngược lại.
- **Clearance do người bắn** (Archery Australia): lúc thả, dây đi về phía mặt người bắn khoảng 15 mm. Dây chạm mặt, ngực hoặc bao tay là nguyên nhân clearance hay bị bỏ sót, ngoài chuyện cánh chạm rest.

### 9.8 Điều không dùng

- Bảng vận tốc của Archery Victoria (tên 100, 300 và 500 gr rời cung ở 290, 250 và 210 fps, còn 140, 160 và 180 fps ở 90 m): không ghi nguồn, và thời gian bay kèm theo không khớp với chính các vận tốc đó.
- "Thân tên barrelled chỉ uốn ở một phần ba cuối khi bắn", "cắt từ phía sau đổi spine nhiều hơn cắt từ phía trước" (Archery Victoria): một nguồn hạng C, không có số đo.
- Mốc 5 gr/lb: của compound, xem mục 9.2.

## 10. Việc có thể làm cho engine

Xếp theo độ chắc của nguồn. Chưa việc nào được làm; mỗi việc đổi kết quả mô hình cần quyết định của chủ dự án trước.

### 10.1 Đủ nguồn, làm được ngay

| Việc | Nguồn | Đụng tới |
|---|---|---|
| Phép thử xé giấy ảo: từ `verticalTendency` và `dynamicBehavior` ra hướng rách theo bảng 9.1; clearance cao thì ghi chú là rách trái hoặc rách trên có thể do chạm cung | Easton, A | Tính năng mới, không đổi hệ số |
| Cảnh báo tên nhẹ theo bảng AMO ở 9.2, thay hoặc đặt cạnh mốc 5 gr/lb | Easton, A | `derivedMetrics.ts`, lời cảnh báo |
| Gợi ý tuning theo thứ tự sách: dọc trước ngang; ngang thì plunger, rồi point, rồi lực kéo, rồi spine. Không gợi ý chỉnh center shot cho recurve, trừ khi clearance cao | Easton và *Total Archery* | `suggest.ts`: `cost` và danh sách thông số |
| Đích của "đã cân": chấp nhận bare shaft hơi thấp và hơi cứng, không đòi trùng khít | Easton, A (mục 4.4) | Điều kiện "đã cân" ở physics mục 11.1 |
| Ngưỡng đọc bia: lệch quá 15 cm ở 18 m thì đổi thân tên (Easton); dưới 7,6 cm ở 30 m thì plunger là đủ (*Total Archery*) | A và A− | Phần đọc bia ở trang "Xem trước", đang dùng 6 cm |

### 10.2 Đủ nguồn về chiều, cần quyết định về con số

| Việc | Nguồn | Vì sao phải quyết |
|---|---|---|
| Dời điểm trung tính của center shot ra ngoài khoảng 2,4 mm | Easton và *Total Archery* | Đổi kết quả của mọi setup đã lưu (mục 4.2) |
| Nâng điểm trung tính của nocking point và nới ngưỡng "quá cao" | Easton 13 mm, *Total Archery* 4,8 – 9,5 mm | Các nguồn cho con số khác nhau; phụ thuộc cách đo (mục 4.3) |
| Nâng điểm trung tính của tiller lên khoảng 5 – 6 mm | *Total Archery* | Một nguồn, và chính nó nói tiller tùy người |
| Cảnh báo FOC ngoài 7 – 16 %, sau khi lùi trọng tâm của point và insert vào trong thân tên | Easton, A | Phải chọn lùi bao nhiêu; chưa có số đo (mục 9.3) |
| Thông số "loại nocking point" (chỉ buộc hoặc hạt đồng) và khối lượng serving, đi vào spine cần thiết cùng chiều với khối lượng dây | Easton về chiều, *Total Archery* về độ lớn | Mốc độ lớn duy nhất là "tới 15 cm ở 30 m" |

### 10.3 Dùng làm phép kiểm, không đổi công thức

| Phép kiểm | Giá trị nguồn | Mô hình hiện ra |
|---|---|---|
| Số chu kỳ uốn của tên lúc rời dây | 1,25 (Pratt) | 1,17 |
| Hiệu suất của cung | 75 % (Pękalski giả định); 69 – 98 % với tên cỡ thường (Kooi, cung H) | 72 % |
| Tên nhẹ hơn thì hiệu suất thấp hơn và vận tốc cao hơn | Kooi, bảng 3.10 | Đúng chiều |
| Brace height cao hơn thì vận tốc thấp hơn | Kooi, bảng 3.5; Easton | Đúng chiều |
| Lực kéo cần tỉ lệ thuận với `EI` | Kooi 1998 | Số mũ 1.0 |

Hai dòng đầu có thể thành test trong `src/engine`, với khoảng cho phép rộng: chúng bắt được việc một lần chỉnh hệ số về sau đẩy mô hình ra khỏi vùng hợp lý.

### 10.4 Cho hoạt hình

- Thứ tự uốn khi bắn ngón (Easton): thân tên uốn vào phía cung trước, rồi uốn ra và rời rest, tới nhịp uốn kế tiếp thì nock rời dây. Kooi xác nhận tên rời rest trước khi rời dây.
- Đường đi của nock trên dây: lệch ngang khoảng 1,5 tới 2 cm trong 8 ms đầu rồi quay về (Pękalski; Archery Australia ghi 15 mm). Dùng được khi vẽ độ uốn lúc tên còn trên dây, hiện đang vẽ thẳng.

### 10.5 Cho các phase sau

- **Execution errors (ý tưởng ở V0.5).** Vặn cung 1° lệch 16 tới 22 cm ở 30 m là mốc độ lớn đầu tiên cho lỗi của người bắn.
- **Hiệu suất theo khối lượng tên.** Thay `limbVirtualMass` cố định bằng một hàm của khối lượng tên, khi có số đo vận tốc thật để chỉnh (V0.4).
- **Lời khuyên ngoài mô hình.** Dây chạm mặt hoặc ngực; kiểm lại tune mỗi tháng; chọn tên thi đấu bằng cách bắn bare shaft cả bộ ở 30 m.

### 10.6 Chưa làm được

Độ lớn của weak và stiff, tức các số mũ ở physics mục 6.1 và hệ số `gain`. Không nguồn nào ở đây cho con số, ngoài quy đổi brace height sang 20 gr point đã dùng. Cần bảng chọn spine của Easton hoặc bài Kooi và Sparenberg 1997.
