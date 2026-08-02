# Sao lưu, phục hồi và sự cố

---

## 1. Ván lưu ở đâu

Trong IndexedDB của trình duyệt, tên `thien-dien`. Không có bản sao trên máy chủ,
vì không có máy chủ. **Xóa dữ liệu trang web là mất sạch.**

Ván **tự lưu sau mỗi nhịp được kể trọn vẹn**. Không có nút "Lưu" và cố ý không
có: một nút lưu là một nút người ta quên bấm.

Một ván = một nhánh. Danh sách ở **Sảnh Vào · File save**.

---

## 2. Sao lưu

**Sảnh Vào → File save → chọn ván → Xuất ra file**

Tải về một `.json`. Trong ván, cũng xuất được ván đang chơi.

File xuất **không bao giờ** chứa:

- mật khẩu proxy hay bất kỳ khóa API nào (cắt theo tên khóa, mọi độ sâu);
- hồ sơ riêng tư của bạn — trừ khi bạn chủ động bật "Kèm hồ sơ riêng tư".

Cả hai đều có test khẳng định, và một hàng rào cuối quét lại gói trước khi nó ra
file: nếu có trường riêng tư lọt vào bản mặc định, việc xuất **bị hủy** kèm danh
sách trường vi phạm, chứ không xuất ra một file rò rỉ.

Nên xuất khi:

- trước khi nâng cấp bản app;
- trước khi xóa dữ liệu trình duyệt hay đổi máy;
- trước khi chạy một lượt Diễn Hóa dài;
- sau một nhịp bạn thấy đáng giữ.

---

## 3. Phục hồi

**Sảnh Vào → File save → Nhập từ file .json**

Khi nhập, engine:

1. kiểm định dạng và `schemaVersion`;
2. dựng lại trạng thái và so **hash** với hash ghi trong file;
3. chạy **toàn bộ bất biến** — nạp save là một ranh giới, nên phép quét đầy đủ
   chạy ở đây;
4. bù aspect nền cho nơi chốn nào còn thiếu;
5. ghi ván xuống máy này rồi mở nó.

Bản ghi hỏng lẻ tẻ bị **bỏ qua kèm cảnh báo** thay vì làm hỏng cả file. Bạn thấy
đúng số bản ghi bị bỏ.

---

## 4. Bảng sự cố

### "Save này được tạo bởi bản mới hơn"

Đúng như nó nói. Nâng cấp app rồi mở lại. App **không** đoán bừa cấu trúc của một
phiên bản nó chưa biết — đoán bừa là cách chắc chắn nhất để làm hỏng dữ liệu.

### "Hash trong save không khớp state dựng lại được"

Cảnh báo, không phải lỗi chặn. Ván vẫn mở. Nguyên nhân thường gặp: file bị sửa
tay, hoặc bị cắt cụt lúc tải. Nếu bạn không sửa gì thì nên xuất lại một bản mới
từ ván vừa mở.

### "Save vi phạm bất biến, không nạp được"

Chặn thật. Trạng thái trong file mâu thuẫn với luật của engine (ví dụ một liên
kết trỏ tới thực thể không tồn tại). Dùng bản sao trước đó. Nếu không có, mở
**Tự Chẩn Đoán** — danh sách bất biến bị vi phạm nói chính xác chỗ hỏng.

### "Nâng cấp dữ liệu chưa xong" (khối đỏ ở đầu màn hình)

Migration lúc khởi động trượt. **Đừng tạo ván mới.** Xuất mọi ván ra file trước,
rồi báo lỗi kèm nội dung khối đỏ. App vẫn cho vào Cài Đặt để bạn làm đúng việc
đó.

### "Nhịp này chưa ai kể"

Không phải sự cố dữ liệu. Tường Thuật hỏng giữa lượt: thế giới đã đi tiếp, lời kể
thì chưa có. Ô nhập khóa cho tới khi bấm **Kể lại nhịp này** thành công. Nếu proxy
chết hẳn, mở **Cài Đặt · Proxy AI**, thử đường lại, rồi kể lại.

Ván **không** mất gì trong lúc chờ — nó đã lưu tới nhịp đó rồi.

### "Ván này là gốc của N nhánh khác"

Không xóa được nhánh còn con: phép đọc lần lên của các nhánh con sẽ rơi vào hư
không. Xóa nhánh con trước.

### Danh sách "Tiếp tục" rỗng dù chắc chắn đã chơi

Ba khả năng, theo thứ tự hay gặp:

1. Đang ở cửa sổ riêng tư — IndexedDB không dùng được (xem `docs/CAI_DAT.md`).
2. Đang mở ở một địa chỉ khác. IndexedDB tách theo origin, nên
   `localhost:5173` và `localhost:4173` là hai kho hoàn toàn khác nhau.
3. Dữ liệu trang web đã bị xóa.

### Trình duyệt chậm dần sau một ván rất dài

Save 10.000 nhịp mở lại đúng và có test đo điều đó. Nhưng cache rerank và ảnh
chụp autosave lớn dần. Xóa cache rerank là an toàn: nó **không** ảnh hưởng save
hay replay, và có test khẳng định hash không đổi sau khi xóa.

---

## 5. Điều engine bảo đảm

Bốn điều dưới đây đúng ở mọi phiên bản và đều có test:

1. **Ván không mất khi đổi nhánh.** Copy-on-write theo `[branchId+id]`; sửa cùng
   một thực thể ở hai nhánh không đè nhau.
2. **Xóa ở nhánh con không hồi sinh từ nhánh cha.** Bia mộ chặn điều đó.
3. **Round-trip qua file giữ nguyên hash.** Xuất rồi nhập lại cho cùng trạng thái,
   đi qua JSON thật chứ không qua tham chiếu trong bộ nhớ.
4. **Migration crash giữa chừng chạy tiếp được.** Checkpoint theo lô, idempotent,
   và có kiểm đếm trước khi tuyên bố hoàn tất.
