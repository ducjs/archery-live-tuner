# Tài liệu tuning tham khảo

Tài liệu này ghi lại các nguồn tuning đã đọc, những điểm rút ra được cho mô hình, và chỗ nào mô hình khớp hay còn lệch với chúng. Công thức của mô hình nằm ở [physics-and-calculations.md](physics-and-calculations.md).

Bản gốc của các nguồn nằm trong thư mục `docs/` trên máy, không đưa vào repo vì thuộc bản quyền của người khác (`docs/` có trong `.gitignore`). Ở đây chỉ có ghi chú tự viết.

> **Nói đơn giản:** Sách tuning không cho công thức, nhưng cho biết đổi cái gì thì tên yếu đi hay cứng lên, nên chỉnh theo thứ tự nào, và lệch bao nhiêu thì phải đổi tên. Mô hình được đối chiếu với các điều đó. Một chỗ sai chiều (brace height) đã sửa; ba chỗ còn lệch được ghi lại để xử lý sau.

## 1. Các nguồn

| Nguồn | Nội dung | Bản đang có |
|---|---|---|
| Easton, *Arrow Tuning and Maintenance Guide*, 2nd edition. Phần tuning do Don Rabska biên soạn | Chuẩn bị cung, bare shaft, paper tuning, tuning cự ly ngắn, đọc cụm tên, fine và micro tuning | Trang 1–16 trên 32. Phần tuning đủ, mất hình |
| Easton, cùng sách, bản in khác | Như trên | Trang 2–10 trên 32. Trùng nguồn trên |
| *Basic Bow Tuning* (trang web, chưa rõ tác giả) | Vật liệu dây, brace height, nocking point | Khoảng 1,5 trên 15 trang |
| Murray Elliot (biên tập), *Reference guide for recurve archers*, edition 5, 2002 | Thiết bị, dây, tên, tuning; có kèm "Tuning for Tens" của Rick Stonebraker | Đủ 68 trang nhưng chữ dính liền, chưa dùng được |

Các bản đang có là trang nhúng Scribd lưu về, nên mất toàn bộ hình minh họa. Phần lớn nội dung bên dưới lấy từ sách Easton.

Còn thiếu:

- Bảng chọn spine của Easton, cần cho việc đối chiếu vùng NEUTRAL (spec §25 Test 8).
- Trang 17–32 của sách Easton: cách tính FOC, khối lượng tên tối thiểu theo AMO.
- Hình các kiểu rách giấy trong paper tuning. Thiếu hình thì không biết hướng rách nào ứng với yếu hay cứng.
- Bản sạch của sách Murray Elliot.

## 2. Chiều hướng: mô hình so với sách

Cho người bắn tay phải, finger release. Tay trái thì đổi trái phải.

| Điều sách nói | Mô hình | |
|---|---|---|
| Bare shaft rơi bên trái cụm tên có cánh: tên cứng. Bên phải: tên yếu | Giống | Khớp |
| Bare shaft rơi cao hơn cụm: nocking point quá thấp. Thấp hơn: quá cao | Giống | Khớp |
| Tên cứng thì tăng lực kéo, tăng point, hoặc giảm lực plunger | Lực kéo và point tăng làm tên yếu đi; plunger mềm hơn làm tên yếu đi | Khớp |
| Dây nặng hơn hoặc nhiều sợi hơn làm tên phản ứng cứng hơn | Cùng chiều | Khớp về chiều, lệch về độ lớn (mục 4) |
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

Chưa sửa. Mỗi điểm cần quyết định trước khi đụng vào engine.

### 4.1 Số sợi dây ảnh hưởng quá nhẹ

Sách: thêm hoặc bớt sợi dây có thể đổi spine động tới mức phải chọn thân tên khác một cỡ. Trong mô hình, 16 lên 20 sợi kèm dây nặng thêm 25% cho `dynamicBehavior` +0.10, còn một cỡ spine (700 xuống 600) cho +0.43. Chữ "có thể" của sách là mức tối đa, nên chưa rõ nên tăng bao nhiêu. Sách cũng nói lớp serving giữa và loại nocking point (kim loại hay buộc chỉ) có tác dụng tương tự; mô hình chưa có hai thông số đó.

### 4.2 Center shot trung tính

Sách: với finger release, đầu point đặt lệch ra ngoài đường dây 1,6 tới 3,2 mm, để bù cho độ lún của plunger lúc thả dây. Người bắn recurve không dùng vị trí trong ngoài này để tuning; chỉ chỉnh lực plunger.

Mô hình coi center shot 0 mm là cân, và đặt center shot đúng như sách (2,4 mm ra ngoài) thì báo bare shaft lệch trái. Hai cách xử lý: dời điểm trung tính ra khoảng 2,4 mm phía ngoài, hoặc định nghĩa lại thông số là "lệch so với vị trí chuẩn". Liên quan: gợi ý tuning hiện có đề xuất chỉnh center shot, trái với lời khuyên của sách cho recurve.

### 4.3 Nocking point khởi đầu

Sách Easton: khởi đầu 13 mm trên vuông góc cho finger release. Trang *Basic Bow Tuning*: 3 tới 10 mm. Mô hình coi 4 mm là cân và báo quá cao từ khoảng 7 mm. Con số này phụ thuộc cách đo và kiểu nock, nên chưa kết luận mô hình sai, nhưng điểm trung tính 4 mm nằm ở đầu thấp của các nguồn.

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

Brace height tốt nhất là chỗ cung êm và ít rung nhất. Mô hình chưa có thông số chiều dài cung; giới hạn nhập hiện là 15 tới 30 cm.

### Các ngưỡng khác

- FOC nên nằm trong 7 tới 16%.
- Bộ tên thi đấu: nặng nhẹ chênh nhau không quá 3 gr; thẳng trong 0,004 in.
- Paper tuning: đứng cách giấy 1,2 tới 1,8 m, đạt rồi thì lùi thêm 1,8 m và bắn lại, để chắc tên không tình cờ đi qua giấy đúng lúc đang thẳng.

## 6. Ý cho các phase sau

- **Paper tear (V0.2).** Quy trình và các cách sửa đã có ở trên. Cần thêm hình để biết hướng rách.
- **Minnowing.** Đuôi tên lắc ngang nhanh hơn và biên độ nhỏ hơn fishtailing; là dấu hiệu chạm cung, thường do cánh chạm rest. Hoạt hình có thể vẽ riêng kiểu này khi nguy cơ clearance cao.
- **Đọc cụm tên theo cự ly (V0.4).** Cụm bình thường to dần đều theo cự ly. Cụm xa to bất thường còn cụm gần ổn: lực cản quá lớn, giảm cỡ hoặc góc cánh. Cụm gần không nhỏ đi tương ứng với cụm xa: vấn đề clearance.
- **Bay xấu mà cụm vẫn tốt.** Thường là tên cứng: lệch lúc rời cung nhưng hồi nhanh. Ngược lại, bare shaft trùng cụm hoặc lỗ giấy tròn chưa bảo đảm cụm tốt. Hợp với ý mô phỏng cụm tên ở spec §37.
- **Node của mũi tên.** Hai node phải nằm trên đường tới bia; node trước gần đầu point hơn vì point nặng. Có thể vẽ trong góc nhìn từ trên.
- **Vật liệu dây.** Dacron B50 giãn 2,6%, bền nhưng chậm; Kevlar nhanh hơn khoảng 2 m/s; Fastflite nhẹ hơn và nhanh hơn nữa. Dùng được nếu sau này thêm lựa chọn vật liệu dây.

## 7. Giới hạn của các nguồn này

- Đều là hướng dẫn thực hành, không có số đo. Chúng xác nhận chiều và thứ tự, không xác nhận độ lớn của hệ số, trừ quy đổi brace height sang 20 gr point.
- Sách Easton viết chung cho recurve và compound. Chỉ các phần ghi cho recurve finger release được dùng ở đây.
- Sách xuất bản quanh năm 2000; thiết bị hiện nay có thể khác.
