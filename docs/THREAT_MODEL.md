# Mô hình đe dọa — Phase 12

Thiên Diễn là một ứng dụng chạy hoàn toàn ở phía trình duyệt, không tài khoản,
không máy chủ. Bề mặt tấn công vì thế hẹp, nhưng **không rỗng** — và ba trong bốn
lối vào dưới đây là lối mà người dùng tự mở khi họ làm đúng thứ ứng dụng mời họ
làm.

---

## 1. Tài sản cần bảo vệ

| Tài sản                   | Vì sao đáng                                            |
| ------------------------- | ------------------------------------------------------ |
| Mật khẩu proxy / khóa API | Tiền thật. Rò một lần là mất.                          |
| Hồ sơ riêng tư người chơi | 78.2 — chỉ ra ngoài khi người dùng **chủ động** bật.   |
| Nội dung ván chơi         | Hàng trăm giờ, không có bản sao trên máy chủ.          |
| Ranh giới ba tầng         | Rò tầm nhìn phá hỏng trò chơi không cách nào sửa được. |

---

## 2. Bốn lối vào

### 2.1 File preset và lorebook người dùng nhập

**Ai gửi:** người lạ trên internet. Người dùng tải về rồi kéo vào.

| Đe dọa                                    | Hàng rào                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Mã chạy được nhúng trong file             | Không `eval`, không `new Function` — cấm ở eslint **và** quét mã nguồn. Điều kiện luật là `ExprNode` (ADR-0003), không phải chuỗi. |
| Prototype pollution (`__proto__`)         | `locKhoaNguyHiem()` **từ chối node**, không "làm sạch rồi nhận" (64.4). Chặn ở cả `expr` và `patch`.                               |
| Prompt injection đòi ghi state / gọi tool | `quetAnToan()` gắn nhãn và **cách ly**; ba nhãn vượt quyền không bật được.                                                         |
| Regex bom (catastrophic backtracking)     | Ngân sách thời gian ba lớp; mẫu chạy quá lâu bị dừng và ghi vào Tự Chẩn Đoán.                                                      |
| Ghi đè quy tắc Narrator                   | Thứ tự quyền cố định: an toàn → engine → lõi native → pack ngoài (65.3).                                                           |
| Ghi vào lorebook người dùng               | 50.10 — workflow không có quyền ấy; AI chỉ **che**, không sửa, không xóa (52.2).                                                   |
| File 40 MB làm treo tab                   | Trần độ dài ở bộ vệ sinh và ở pipeline nhập.                                                                                       |

**Fuzz:** 400 gói preset và 500 lorebook rác deterministic mỗi lần chạy test.

### 2.2 Phản hồi từ model

**Ai gửi:** proxy của chính người dùng — nhưng nội dung do model sinh, và model
có thể bị dẫn dụ bởi chính file preset ở mục 2.1.

| Đe dọa                                          | Hàng rào                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Patch sửa bảng không được phép                  | Bảng trắng: chỉ `entities`, `links`, `gaps`, `prayers`. `worlds` vắng mặt có chủ ý. |
| Patch sửa lõi bản ngã, sức domain, văn bản luật | Danh sách đường dẫn cấm; mặc định là **từ chối**.                                   |
| Patch gắn vào Event của người khác              | `sourceEventId` do engine gán, không nhận từ model.                                 |
| Model tự viết lại thế giới trong một lượt       | Trần 12 patch một lượt.                                                             |
| Ký tự đảo chiều văn bản (Trojan Source)         | `veSinh()` ở `themDong()` — cửa duy nhất lên khung kể.                              |
| Chuỗi suy luận `<thinking>` lộ ra               | Cắt ở bộ bóc tách, không hiển thị và không lưu.                                     |
| Model bịa số dân, số của cải                    | 71.5 — engine giữ sổ. Patch trỏ tới thực thể không tồn tại bị từ chối.              |

**Fuzz:** 800 phản hồi model rác mỗi lần chạy test.

### 2.3 File save từ máy khác

| Đe dọa                               | Hàng rào                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Trạng thái mâu thuẫn với luật engine | Toàn bộ bất biến chạy ở ranh giới nạp; vi phạm nặng thì **từ chối**.       |
| Save từ bản mới hơn                  | Từ chối tử tế kèm hướng dẫn. Không đoán cấu trúc chưa biết.                |
| JSON rác / cắt cụt                   | `safeParse` từng phần; bản ghi hỏng bị bỏ **kèm cảnh báo**, không im lặng. |
| Bơm hồ sơ riêng tư của người khác    | Chỉ nạp khi gói khai tường minh; ma trận riêng tư 7 biên.                  |

**Fuzz:** 500 gói save rác mỗi lần chạy test.

### 2.4 Chính trình duyệt

| Đe dọa                        | Hàng rào                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Script từ bên thứ ba          | CSP `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. Không `unsafe-eval`. |
| XSS qua nội dung game         | React escape mọi thứ; **không nơi nào** dùng `dangerouslySetInnerHTML` — có cổng quét mã nguồn.                                   |
| Rò dữ liệu qua URL            | Không tham số truy vấn nào mang dữ liệu người chơi.                                                                               |
| Rò dữ liệu qua console        | Cổng quét mã nguồn cấm log mật khẩu / khóa.                                                                                       |
| Kết nối ra ngoài ngoài ý muốn | `connect-src` cho phép http/https vì proxy do người dùng khai — đây là **đánh đổi có ý thức**, xem mục 4.                         |

---

## 3. Ngoài phạm vi

Nói rõ để không ai nhầm là đã được bảo vệ:

- **Máy đã bị chiếm quyền.** Malware đọc IndexedDB thì đọc được mật khẩu proxy.
  Không có kho khóa nào trong trình duyệt chống lại điều đó.
- **Proxy độc hại.** Người dùng tự khai địa chỉ. Một proxy độc đọc được toàn bộ
  prompt — tức là toàn bộ nội dung ván chơi. Chỉ khai proxy bạn tin.
- **Extension trình duyệt.** Extension có quyền cao hơn CSP của trang.
- **Người dùng tự dán mật khẩu vào ô lời kể.** Không có cách nào phân biệt điều
  đó với một câu chuyện có nhắc tới mật khẩu.

---

## 4. Đánh đổi đã ghi nhận

**`connect-src http: https:`** rộng hơn mức lý tưởng. Lý do: proxy AI do người
dùng khai lúc chạy, nên không có danh sách cho phép nào viết trước được. Thu hẹp
nó đòi hoặc một máy chủ trung gian (dự án không có) hoặc bắt người dùng sửa CSP
tay (tệ hơn nhiều). Hàng rào thay thế: `script-src 'self'` giữ nguyên, nên một
endpoint độc **nhận** được dữ liệu nhưng không **chạy** được gì.

---

## 5. Cổng tự động

Mọi mục ở trên đều có test, chạy trong `npm run gate`:

| File                               | Phủ                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `src/test/phase12.test.ts`         | Vệ sinh văn bản, fuzz bốn cửa nhập, audit riêng tư, soak ngắt mạch, quét mã nguồn |
| `src/db/phase12Db.test.ts`         | Backup/restore, migration mọi version, soak 10.000 nhịp                           |
| `src/test/source-guards.test.ts`   | `eval`, `Math.random`, đồng hồ máy, ranh giới `core/`                             |
| `src/core/privacy/privacy.test.ts` | Ma trận riêng tư bảy biên                                                         |
| `src/core/preset/preset.test.ts`   | Pipeline nhập tám bước, cách ly, ngân sách regex                                  |

Fuzz **deterministic** (`taoRng` với seed cố định). Một bài fuzz đổi kết quả mỗi
lần chạy là một bài không ai sửa được khi nó đỏ.
