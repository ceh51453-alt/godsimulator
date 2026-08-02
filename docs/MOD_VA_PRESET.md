# Mod: preset, lorebook và workflow

Ba thứ mở rộng được, cả ba nằm trong **Cài Đặt**. Không cái nào cần biết lập
trình, và không cái nào chạy được mã tùy ý — xem `docs/THREAT_MODEL.md`.

---

## 1. Ranh giới không thương lượng

Đọc mục này trước, vì nó giải thích mọi thứ "vì sao không làm được" ở dưới.

| Ai           | Được làm gì                                                          |
| ------------ | -------------------------------------------------------------------- |
| **Engine**   | Quyết điều gì xảy ra và giữ **mọi con số**                           |
| **AI**       | Kể lại điều đã xảy ra; đổi thế giới **chỉ** qua `<CapNhat>` đã duyệt |
| **Preset**   | Đổi **cách** prompt được xếp; không đổi nội dung engine giữ          |
| **Lorebook** | Đổi **cái thế giới hướng tới**; không ra lệnh cho nó                 |
| **Workflow** | Đổi **cái chạy khi bạn không gõ gì**                                 |

Ba bảng không ai ngoài engine ghi được, kể cả workflow ở giai đoạn cuối:
`substrateLaws` (Luật Nền), `branches`, `aiConfigs`, cộng `tuning`,
`playerProfiles` và `playerIdentities`.

---

## 2. Preset

**Cài Đặt · Preset**

### Nhập

Kéo thả một file preset (định dạng SillyTavern và tương thích). Pipeline nhập
chạy tám bước và báo cáo sáu dòng:

```text
tổng module · native · adapted · cần adapter · bị cách ly · nhóm xung đột
```

- **native** — chạy thẳng, có chỗ tương đương trong Thiên Diễn.
- **adapted** — đã ánh xạ sang khái niệm của Thiên Diễn. Đây là **trạng thái hoạt
  động**, và nó được bật mặc định.
- **cần adapter** — hiểu được nhưng chưa có đường ánh xạ. Tắt.
- **bị cách ly** — quét an toàn gắn nhãn vượt quyền (đòi ghi state, đòi gọi tool,
  đòi đổi tầm nhìn). Không bật được, và **không bị xóa**: bạn xem được nguyên văn
  lý do.

### Giải xung đột

Hai module cùng chiếm một chỗ (ví dụ `history.wrapper`) thì pack **không bật
được** cho tới khi bạn chọn giữ cái nào. Lựa chọn lưu theo `packId`, nên nhập lại
cùng file không bắt bạn chọn lần nữa.

### Thứ tự quyền trong prompt

Cố định và không đổi được:

```text
an toàn  →  engine  →  lõi native  →  pack ngoài
```

Một module preset không bao giờ ghi đè bảy quy tắc Narrator hay luật "engine giữ
sổ". Nó xếp sau.

### Biến pack

Thẻ bài kiểu MVU chạy được: cú pháp `<UpdateVariable>` và `_.set(...)` đều đọc
được. Nhưng đường dẫn **không** trỏ tới thực thể có thật sẽ thành **biến của
pack** (`preset.<packId>`, theo nhánh) chứ không thành thay đổi thế giới. Một thẻ
bài đổi được bảng trạng thái của chính nó và không đổi được một dòng nào trong
thế giới.

### Regex hiển thị

Regex của preset chạy trên **bản sao** của lời kể, ngay trước lúc hiển thị. Không
regex nào chạm được vào Event, Patch hay trạng thái thế giới. Có ngân sách thời
gian; một mẫu chạy quá lâu bị dừng và bị ghi vào Tự Chẩn Đoán.

---

## 3. Lorebook

**Cài Đặt · Lorebook**

Nhận SillyTavern V2, V3 và định dạng Thiên Diễn.

### Nguồn và Sử — luật quan trọng nhất

| Loại      | Là gì                                               |
| --------- | --------------------------------------------------- |
| **Nguồn** | Sách bạn nhập: điều thế giới _lẽ ra_ phải trở thành |
| **Sử**    | Sách thế giới tự ghi: điều nó _đã_ trở thành        |

Mâu thuẫn thì **Sử thắng**. Không phải vì Sử đúng hơn, mà vì không được nói dối
về chuyện đã rồi.

### Lorebook là lực hấp dẫn, không phải kịch bản

`lucHapDan` từ 0 tới 100. Ở 0 nó chỉ làm ngữ cảnh; ở 100 thế giới cố hết sức trở
thành thần thoại đó. Nó **không bao giờ** ép: thế giới có quyền đi lối khác, và
khi nó đi lối khác thì chỗ lệch hiện ở **Bản Đồ Dị Biệt**.

Bản Đồ Dị Biệt không phải bảng lỗi. Nó là hồ sơ về việc thế giới của bạn đã trở
thành cái gì.

### Che, không xóa

AI **không bao giờ** sửa hay xóa entry bạn viết. Nó chỉ được **che**, và mọi lần
che đều hiện ở **Bảng Đối Soát** kèm lý do. Entry đánh dấu `khoaCanon` thì không
che được — và điều đó có giá: thế giới sẽ phải mang một mâu thuẫn.

### Độ tin cậy

`doTinCay` chỉ tăng do **sự kiện engine**, không bao giờ tăng do được nhắc lại
trong văn AI. Một văn bản không tự chứng minh được chính nó. Entry dưới ngưỡng
tin cậy vẫn nằm trong sách nhưng không vào prompt.

---

## 4. Workflow và Diễn Hóa

**Cài Đặt · Workflow**

### Đường ống tác vụ

Mỗi tác vụ có model riêng, nhịp riêng và ngữ cảnh riêng. Gộp tất cả vào một call
là chọn model tệ nhất cho việc khó nhất — đó là lý do khối này tồn tại.

Preset dựng sẵn:

| Preset            | Việc                          |
| ----------------- | ----------------------------- |
| Trống             | Rỗng, để tự dựng              |
| Engine hậu trường | Đủ bảy tác vụ                 |
| Chỉ NPC           | Rẻ nhất — chỉ hành động NPC   |
| Chỉ thế giới      | Chỉ vĩ mô, bỏ NPC             |
| Nén kỷ nguyên     | Chỉ chạy ở mốc cuối kỷ nguyên |

Khối **Lằn ranh cứng** dưới danh sách chạy `kiemLanRanh()` và từ chối nạp preset
chạm bảng cấm. Nó chạy **trước** khi preset được coi là dùng được, không phải lúc
đang chạy dở.

### Diễn Hóa

Tua thế giới nhiều nhịp liền:

| Nhịp mỗi lượt | Dài         |
| ------------- | ----------- |
| Niên          | một năm     |
| Thế đại       | ba mươi năm |
| Vĩnh kiếp     | một thế kỷ  |

Mười một điều kiện dừng bật/tắt được. Diễn Hóa ghi **ảnh chụp trạng thái trước
khi chạy** — không có nút lùi thì một tính năng tua trăm năm đáng sợ hơn đáng
dùng.

Diễn Hóa vẫn cần cổng AI mở. Không có ngoại lệ cho chế độ tua.

Bật **điểm cuối Diễn Hóa** ở tab Proxy AI thì đường ống tác vụ chạy thật sau mỗi
lượt tua, và bảng vết bên dưới nút hiện từng tác vụ: giai đoạn, số call, số ký tự
trả về, và lý do nếu nó bỏ lượt. Không bật thì lượt tua chỉ có engine chạy — hợp
lệ, và màn nói rõ điều đó trước khi bạn bấm.

Output tác vụ đi vào ngữ cảnh của giai đoạn sau và vào lượt kể cuối. Nó **chưa**
ghi vào lorebook hay world: đường ghi ấy cần bộ định tuyến riêng có đủ kiểm lằn
ranh, và nối một nửa thì tệ hơn không nối.

Kết quả là **Báo Cáo Diễn Hóa**, viết bằng giọng biên niên sử: chuyện gì đã xảy
ra, dừng vì cái gì, và hai chỉ số thực tại/sống động trước–sau.

---

## 5. Gỡ lỗi

**Tự Chẩn Đoán** (biểu tượng sổ sách ở thanh bên trái) là chỗ duy nhất cần nhớ.
Mỗi mục hỏng đi kèm **việc cần làm**, không phải một dấu đỏ. Bốn mục hay dùng
nhất khi mod:

| Mục                             | Nghĩa khi khác 0                                  |
| ------------------------------- | ------------------------------------------------- |
| Macro chưa có ánh xạ            | Macro giữ nguyên văn trong prompt — tắt module đó |
| Module bị cắt khỏi prompt       | Ngân sách token chật; tăng context hoặc tắt bớt   |
| Patch AI bị từ chối             | Bật Cập Nhật Biến thành điểm cuối riêng           |
| Lần bộ vệ sinh phải lọc văn bản | File hoặc phản hồi có ký tự vô hình / đảo chiều   |

Mục **Chunk cấm lọt vào kết quả truy hồi** phải **luôn** bằng 0. Khác 0 là rò rỉ
tầm nhìn: dừng chơi nhánh đó và báo lỗi kèm ảnh chụp tab Truy hồi.
