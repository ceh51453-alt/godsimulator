# Cài đặt và chạy Thiên Diễn

Thiên Diễn chạy hoàn toàn trong trình duyệt. Không có máy chủ, không có tài khoản,
không có dữ liệu nào rời khỏi máy bạn trừ đúng một thứ: **prompt gửi tới proxy AI
mà chính bạn khai báo**.

---

## 1. Yêu cầu

| Mục          | Tối thiểu                                      |
| ------------ | ---------------------------------------------- |
| Node         | 20 trở lên (dự án phát triển trên 25.4)        |
| npm          | 10 trở lên                                     |
| Trình duyệt  | Chromium 111+, Firefox 128+, Safari 17+        |
| IndexedDB    | Bắt buộc để lưu ván — xem mục 5                |
| Một proxy AI | **Bắt buộc.** Không có nó thì không chơi được. |

---

## 2. Cài và chạy

```bash
npm install
npm run dev
```

Mở địa chỉ mà Vite in ra (mặc định `http://localhost:5173`). Đặt biến môi trường
`PORT` nếu cổng ấy đã có người dùng.

Bản phát hành:

```bash
npm run build
npm run preview
```

`dist/` là một thư mục tĩnh — thả lên bất kỳ chỗ nào phục vụ file tĩnh là chạy.
Không cần Node ở phía máy chủ.

---

## 3. Cổng kiểm tra

Một lệnh chạy toàn bộ: định dạng, lint, kiểu, test, build.

```bash
npm run gate
```

Chạy riêng từng phần khi cần:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

---

## 4. Khai báo proxy AI

Màn đầu tiên là **Cổng AI**, và nó đứng trước mọi thứ khác vì một lý do đơn giản:
không có model thì không có người kể, và không có người kể thì không có trò chơi.
Xem `docs/DECISIONS.md`, ADR-0028 và ADR-0056.

Ba điểm cuối, chỉ **Tường Thuật** là bắt buộc:

| Điểm cuối     | Bắt buộc | Việc của nó                                   |
| ------------- | -------- | --------------------------------------------- |
| Tường Thuật   | **có**   | Kể lại điều engine vừa quyết                  |
| Cập Nhật Biến | không    | Xuất khối `<CapNhat>` riêng, sạch hơn         |
| Diễn Hóa      | không    | Chạy nhiều lượt tự động cho thế giới tiến hóa |

Với mỗi điểm cuối:

1. **Địa chỉ proxy** — phải bắt đầu bằng `http://` hoặc `https://`.
2. **Mật khẩu / khóa** — không bao giờ rời khỏi máy bạn. Nó nằm trong danh sách
   `KHOA_SECRET`, nên `stripSecret()` cắt nó khỏi mọi thứ đi ra ngoài, kể cả file
   save. Có test khẳng định điều đó.
3. **Phương ngữ** — `Tự do (dạng OpenAI)`, `OpenAI`, `Gemini` hoặc `Anthropic`.
4. **Quét model** rồi chọn một cái.
5. **Thử đường.** Bước này không bỏ qua được: nó chứng minh cả ba thứ — đường đi,
   model tồn tại, và model chịu nghe lệnh.

Đổi địa chỉ, model, phương ngữ hay mật khẩu sẽ **xóa kết quả thử cũ**. Đường của
model trước không chứng minh gì về model vừa chọn.

Sau khi vào ván, Cài Đặt mở lại bằng nút **Cài Đặt** ở thanh bên trái, hoặc phím
`Esc` để quay về Sảnh.

---

## 5. Trình duyệt riêng tư

Chế độ riêng tư của một số trình duyệt không cho dùng IndexedDB. Thiên Diễn vẫn
chạy, nhưng:

- ván **không được lưu** — đóng tab là mất;
- danh sách "Tiếp tục" luôn rỗng;
- cache rerank luôn trượt, nên mỗi lượt tốn thêm thời gian;
- cấu hình proxy phải nhập lại mỗi lần mở.

Không có thông báo chặn nào — bạn vẫn chơi được. Nếu định chơi lâu, dùng cửa sổ
thường.

---

## 6. Dữ liệu nằm ở đâu

Tất cả trong IndexedDB tên `thien-dien`, phiên bản schema 9. Xóa dữ liệu trang
web là xóa sạch mọi ván. Xuất file save trước khi làm việc đó — xem
`docs/PHUC_HOI.md`.

Lần mở đầu tiên sau khi nâng cấp, app chạy **migration dữ liệu** một lần trước
khi bất cứ ván nào được tạo. Nếu nó hỏng, một khối cảnh báo đỏ hiện thường trực ở
đầu màn hình và bạn nên xuất bản sao trước khi làm gì tiếp.
