# Chơi Thiên Diễn

---

## 1. Thế giới bắt đầu từ hư vô

Đây là điều khác nhất so với phần lớn game mô phỏng, và cũng là điều dễ làm người
mới bối rối nhất trong năm phút đầu.

Khi bạn bấm **Bắt đầu**, thế giới có đúng:

```text
0 thực thể · 0 luật · 0 khái niệm · 0 nơi chốn · 0 vị thần · 0 con người
```

Không có bản đồ dựng sẵn, không có thần thoại mẫu, không có "Máu Không Rửa Được"
chờ bạn khám phá. Mọi thứ tồn tại trong thế giới của bạn đều tồn tại vì **một lượt
chơi cụ thể đã tạo ra nó**, và bạn tra ngược được tới đúng lượt ấy (cột "Nguồn
sinh" ở Bảng Thông Tin).

Xem ADR-0055 trong `docs/DECISIONS.md` nếu muốn biết vì sao.

### Ba cửa vào

Cả ba đều mở ra hư vô. Chúng khác nhau ở chỗ **bạn nói gì trước nhịp đầu tiên**:

| Cửa     | Nghĩa                                                           |
| ------- | --------------------------------------------------------------- |
| Hư Vô   | Không nói gì. Nhịp đầu diễn ra trong cái chưa có tên.           |
| Một Câu | Một câu. Nó là toàn bộ tiền đề, và thế giới lớn lên từ đó.      |
| Đầy Đủ  | Thêm nguyên mẫu sáng thế — vẫn là tiền đề, không phải nội dung. |

Ví dụ một câu tốt: _"Một thế giới nơi máu đã đổ thì không rửa được."_ — nó cho
người kể một luật để dựng và một hệ quả để đi theo.

Ví dụ một câu kém: _"Một thế giới thú vị có nhiều nhân vật."_ — nó không ràng buộc
gì cả, nên nhịp đầu tiên sẽ trôi tuột.

---

### Bốn chế độ khai hồ sơ

Màn Khởi Nguyên hỏi bạn muốn khai bao nhiêu, và bốn mức là bốn mức thật:

| Chế độ | Có gì                                                            |
| ------ | ---------------------------------------------------------------- |
| Bỏ qua | Vào thẳng, hồ sơ trống.                                          |
| Nhanh  | Một cái tên và một cửa vào.                                      |
| Gợi ý  | Thêm đại từ và cách kể — đã điền sẵn, bạn chỉ sửa chỗ không vừa. |
| Đầy đủ | Thêm danh tính Sáng Thế và phần bạn chọn công bố.                |

Dưới cùng luôn có bảng **Cái gì đi đâu**, cập nhật ngay khi bạn gõ, chia mọi thứ
vừa nhập thành ba cột: _chỉ mình bạn thấy_ · _gửi cho Narrator_ · _thành canon_.
Cột thứ nhất không rời khỏi máy bạn, kể cả trong file save.

Sửa lại sau khi bắt đầu lúc nào cũng được, và sửa nó **không** làm thế giới đổi.

---

## 2. Sảnh Vào

Màn đầu tiên sau Cổng AI có bốn lối:

| Lối       | Việc                                                      |
| --------- | --------------------------------------------------------- |
| Tiếp tục  | Mở ván có nhịp cao nhất. Ván tự lưu sau mỗi nhịp được kể. |
| Bắt đầu   | Mở một thế giới hư vô mới.                                |
| File save | Nhập/xuất `.json`, đổi tên, xóa ván.                      |
| Cài đặt   | Preset · Lorebook · Workflow · Proxy AI.                  |

---

## 3. Ba tầng

Cùng một thế giới, ba thứ nhìn thấy được hoàn toàn khác nhau. Đổi tầng **không**
tạo ván mới và không tốn nhịp.

| Tầng          | Bạn là ai                    | Bạn thấy gì                                                       |
| ------------- | ---------------------------- | ----------------------------------------------------------------- |
| Sáng Thế Thần | Không thân xác, không vị trí | Luật gốc, khái niệm, số liệu engine. Bạn không có mặt trong cảnh. |
| Thần          | Một vị thần cụ thể           | Lãnh địa mình rõ; phần còn lại mờ hoặc qua lời đồn.               |
| Phàm Nhân     | Một con người cụ thể         | Không đọc được luật vũ trụ, không thấy con số nào của engine.     |

Ở tầng Phàm Nhân, tên và mô tả của những thứ xa sẽ **méo đi** — đó không phải lỗi
hiển thị, đó là cách tin đồn hoạt động.

---

## 4. Ô nhập tự do

Gõ điều bạn muốn làm. Không có danh sách lệnh và không có cú pháp.

Bốn điều engine bảo đảm:

1. **Không câu nào bị trả lời bằng "không hiểu".** Việc không làm được thì có một
   lý do cụ thể **trong thế giới** — thiếu người, thiếu vật, hoặc một luật cấm
   (và nó nói tên luật ấy).
2. **Việc dài hơi thành Project**, không thành một cú tung xúc xắc. "Ta muốn hợp
   nhất ba bộ lạc" không xong trong một câu.
3. **Việc không hoàn tác được thì hỏi trước.**
4. **Việc đời thường lặp lại không thành luật vũ trụ.** Pha trà hai trăm lần vẫn
   chỉ là pha trà.

Các chip gợi ý dưới ô nhập là **gợi ý**, không phải biên giới. Bỏ qua chúng thoải
mái.

---

## 5. Thời gian

| Nút               | Việc                                                          |
| ----------------- | ------------------------------------------------------------- |
| Trôi một nhịp     | Một mùa. Mười hai tiến trình nền chạy, NPC làm việc của họ.   |
| Trôi ba mươi nhịp | Bảy năm rưỡi.                                                 |
| Diễn Hóa          | Tua hàng chục tới hàng trăm năm, dừng khi có chuyện đáng xem. |

Diễn Hóa nằm trong **Cài Đặt · Workflow**. Nó dừng theo mười một điều kiện của
Smart Stop (mạch truyện lên cao trào, nhân vật bạn lâm nguy, một vị thần mất
domain…), không dừng vì hết lượt — trừ khi không có gì đáng xem xảy ra cả.

Thế giới **không** đứng yên giữa hai lượt bạn gõ. Bản tin ở đầu mỗi lượt kể là
chuyện đã xảy ra ngoài kia, đã lọc theo đúng những gì chủ thể của bạn biết được.

---

## 6. Hai lớp phủ

| Phím  | Mở                       | Nội dung                                                   |
| ----- | ------------------------ | ---------------------------------------------------------- |
| `Tab` | Bảng Thiên Diễn          | Tám vùng, "Từ lần trước", "Cần chú ý" (mở thẳng chỗ xử lý) |
| `I`   | Bảng Thông Tin Thiên Địa | Sáu tab, tìm kiếm, chuỗi hệ quả                            |
| `Esc` | Đóng, hoặc về Sảnh       |                                                            |

Thanh trên cùng (Thanh Thiên Tượng) ghim thêm chỉ số được: bấm **Ghim** ở góc
phải để chọn, hoặc chuột phải lên một cụm đã ghim để bỏ nó ra.

Không bao giờ có hai lớp phủ chồng nhau. Lớp phủ **không** dừng thời gian và
không chặn tương tác.

Ở tầng Phàm Nhân, Bảng Thiên Diễn được thay hẳn bằng **Sổ Tay** — một con người
không đọc được bảng điều khiển của vũ trụ.

---

## 7. Khi AI đứt giữa chừng

Nếu Tường Thuật hỏng ngay giữa một lượt, engine **đã** ghi Event của lượt ấy rồi.
Trò chơi dừng lại ở đó và hiện một khối:

> **Nhịp này chưa ai kể.** Thế giới đã đi tiếp, nhưng bạn chưa được đọc nó.

Ô nhập bị khóa cho tới khi bạn bấm **Kể lại nhịp này** và nó thành công. Cố ý
không có nút "bỏ qua": bỏ qua nghĩa là chôn hẳn đoạn ấy.

Ba lần hỏng liên tiếp thì cổng AI tự đóng và bạn quay về màn cấu hình proxy. Bấm
**Thử đường** thành công là mở lại được ngay.

---

## 8. Chết không phải Game Over

Ở tầng Phàm Nhân, khi nhân vật của bạn chết, bạn có ba đường đi tiếp: kế thừa một
người khác, chuyển sang một người khác, hoặc **Anh Linh Hóa Thần** — lên tầng
Thần trong chính thế giới ấy.

Danh sách rỗng nghĩa là bạn chưa chết, hoặc thế giới không còn ai. Cả hai đều
không phải Game Over.
