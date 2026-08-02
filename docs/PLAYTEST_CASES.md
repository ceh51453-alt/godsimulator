# PLAYTEST CASES

Kịch bản Thần / Phàm Nhân / thế giới — Phần 74.4.

Mỗi kịch bản ghi **tiền đề**, **các bước**, **điều phải đúng** và **phase kiểm được**.
Trạng thái: `chua_chay` cho tới khi có phase tương ứng.

---

## PT-00 · Chuỗi nhân quả tích hợp bắt buộc

**Nguồn:** Prompt IDE "Scenario tích hợp bắt buộc".
**Phase kiểm:** 5 (engine) và 8 (kể chuyện). **Trạng thái:** `chua_chay`.

```text
Người chơi tạo hoặc bỏ qua hồ sơ
  → chọn phần được thế giới biết
  → chọn hiện diện Sáng Thế
  → Sáng Thế ban một luật
  → luật đổi điều kiện sống hai vùng
  → phàm nhân thích nghi khác nhau
  → hai truyền thống hình thành
  → một thần/giáo phái xuất hiện
  → thần can thiệp làm giáo lý phân nhánh
  → một phàm nhân chịu hậu quả và mở Project
  → kết quả quay lại đổi thần hoặc luật địa phương
```

**Điều phải đúng**

- [ ] **Mỗi mắt xích truy được về một Event/Patch thật.** Narrator không bù mắt xích thiếu.
- [ ] Hai vùng cho ra hai `dienGiai` khác nhau với `doLech` khác nhau.
- [ ] Giáo phái sinh ra từ trọng số khái niệm, không do script cứng.
- [ ] Phàm nhân mở Project vì hậu quả cụ thể, không vì bảng quest.

**Hạt giống đã có (Phase 0):** `src/test/fixtures/world.ts` đã dựng sẵn bốn mắt xích đầu —
luật `law_mau`, hai vùng `place_thung_lung` / `place_bo_song` với `doLech` 34 và 61, khái
niệm `concept_o_ue` đang `thanh_hinh`, và thần `deity_tay_ue`.

---

## PT-01 · Rò rỉ ba tầng — bài test quan trọng nhất

**Nguồn:** Phần 18.3 [BB] — "Dừng mọi việc khác và sửa."
**Phase kiểm:** 3 (chiếu), 8 (RAG). **Trạng thái:** `dat` ở phần chiếu; phần RAG chờ Phase 8.

**Tiền đề.** Đang chơi tầng phàm nhân, chủ thể `mortal_ly` cư trú ở `place_thung_lung`.

**Bước.** Hỏi "luật của thế giới này là gì?"

**Điều phải đúng**

- [x] Chunk chứa `lawful.vanBan` gốc nằm trong danh sách **cấm** của case eval —
      `rerank.test.ts` chứng minh nó không nhìn được ở tầng phàm nhân.
- [x] Chunk chứa `soul.banTinh` thật của thần cũng bị cấm.
- [x] Câu trả lời là **diễn giải của vùng chủ thể**, và nó **sai đúng chỗ** `doLech` lệch —
      `chieu.test.ts` kiểm mortal_1 ở place_a thấy bản "ô uế", không thấy bản bờ sông.
- [x] `ProjectedLaw.vanBan === null` ở mọi lượt chiếu tầng phàm nhân.
- [x] Cùng câu hỏi ở tầng Sáng Thế thì **thấy** văn bản gốc.
- [x] Kiểm trên DOM thật của bản build: không chuỗi luật gốc nào có mặt.

---

## PT-02 · Khởi Nguyên — `Bỏ qua` vẫn vào game

**Nguồn:** Phần 78.5, 79.4. **Phase kiểm:** 3. **Trạng thái:** `dat`.

**Bước.** Khởi Động → Khởi Nguyên → **Bỏ qua** → Hư Vô → Sáng Thế → Bắt đầu.

**Điều phải đúng**

- [x] `hoSoToiThieu()` tạo hồ sơ hợp lệ, `displayName = "Người Chơi"`, `privateNotes = ''`.
- [x] `chieuPersona()` với `profile: null` vẫn trả persona hợp lệ.
- [x] Vào thẳng Sảnh, không màn hình chặn nào — smoke test trình duyệt.
- [x] Không lần nào hỏi email, tuổi, giới tính hay ngày sinh — schema không có chỗ chứa.
- [ ] Dùng được **hoàn toàn bằng bàn phím** — kiểm đầy đủ ở Phase 11.

---

## PT-03 · Khởi Nguyên — `Đầy đủ` với diff riêng tư / canon

**Nguồn:** Phần 78.5, 78.9. **Phase kiểm:** 11. **Trạng thái:** `chua_chay`.

**Bước.** Chọn **Đầy đủ**, điền danh xưng "Kẻ Gieo Tro", bật `revealTitle`, tắt `revealForm`,
viết ghi chú riêng, rồi xem diff cuối.

**Điều phải đúng**

- [x] Diff chia đúng ba cột: riêng tư | gửi Narrator | thành canon (`diffCongBo()`).
- [x] Ghi chú riêng hiện ở cột **riêng tư** dưới dạng "có tồn tại", **không lộ nội dung**.
- [x] `manifestationDescription` chưa công bố → không vào cột canon.
- [ ] Bấm Bắt đầu sinh Event công bố danh xưng, và lore về sau nhắc tới nó như sự kiện thật.
- [ ] Sửa `displayName` sau khi bắt đầu **không** hồi tố biên niên đã kể.

---

## PT-04 · Bắt đầu ở tầng Thần không tự cấp quyền lực

**Nguồn:** Phần 78.7, 79.4. **Phase kiểm:** 4. **Trạng thái:** `dat`.

**Bước.** Chọn hiện diện **Thần**, tạo thần mới với 1 domain từ khái niệm đã có.

**Điều phải đúng**

- [x] Không có ô nhập `domainStrength` — schema không có trường đó.
- [x] Tối đa ba `domainConceptIds`.
- [x] `suc` khởi đầu do **engine** quyết từ trạng thái khái niệm, không từ input.
- [x] `primordial = true` bị từ chối nếu world đã có lịch sử.
- [x] Domain trỏ khái niệm chưa tồn tại bị chặn có lý do.
- [x] `coreSelf` lấy từ thông tin người chơi; các chỉ số còn lại do engine dựng.

---

## PT-05 · Bắt đầu ở tầng Phàm không tự cấp tài sản

**Nguồn:** Phần 78.8. **Phase kiểm:** 4. **Trạng thái:** `dat` phần ngân sách; phần hộ gia đình chờ Phase 7.

**Bước.** Chọn **Phàm Nhân** → "Sinh trong một hộ" → viết xuất thân tự do có nhắc tới
"gia truyền một thanh kiếm quý".

**Điều phải đúng**

- [ ] Engine tạo quan hệ cha mẹ, nơi ở, lịch sử ngắn — có Event thật.
- [x] Vật chưa tồn tại **không** vào tay ngay; validator trả `VAT_CHUA_TON_TAI` và diff
      ghi rõ nó thành thứ phải đi tìm.
- [x] Kỹ năng vượt ngân sách xuất thân thành mục tiêu để học, không được cấp sẵn.
- [x] Diff hiện rõ cách câu chuyện xuất thân được tiếp địa.

---

## PT-06 · Chuyển tầng giữ nguyên save và hash

**Nguồn:** Phần 21.3, cổng Phase 3. **Phase kiểm:** 3. **Trạng thái:** `dat`.

```text
Tạo luật → sinh thần → nhập thần → hạ phàm
→ phàm nhân làm một việc → Event
→ quay lại Sáng Thế → thấy CÙNG Event ở góc nhìn đầy đủ
→ save → reload → hash không đổi
```

**Điều phải đúng**

- [x] Chuyển tầng **không** tạo save mới, **không** đổi `branchId`, **không** reset gì.
- [x] Cùng một Event được chiếu **khác nhau** ở ba tầng — ba `visibilityHash` khác nhau.
- [x] `save → reload` giữ nguyên state hash (Phase 2).
- [x] Chạy được **không cần endpoint AI** — toàn bộ lát dọc là engine thuần.

---

## PT-07 · Thần NPC sống khi người chơi vắng mặt

**Nguồn:** Phần 21.2 [BB], cổng Phase 6. **Phase kiểm:** 6. **Trạng thái:** `chua_chay`.

**Bước.** Chơi 40 năm ở tầng phàm nhân, rồi quay lại tầng Sáng Thế.

**Điều phải đúng**

- [ ] Phân thân đã chạy bằng utility AI suốt thời gian đó; `doPhanKy` tăng thật.
- [ ] Hiện **Bản Tấu** viết bằng **giọng biên niên sử**, không phải giọng log.
- [ ] Không mana, không cooldown giả.
- [ ] `coreSelf` không bị tick sửa âm thầm.

---

## PT-08 · Dị Hóa — bạn trở thành thứ người ta tưởng bạn là

**Nguồn:** Phần 12.2 [BB]. **Phase kiểm:** 6. **Trạng thái:** `chua_chay`.

**Tiền đề.** `deity_tay_ue` trong fixture: bản tính thật `tuBi_tanNhan = -58` (hiền), bản
tính tín đồ tin `= +47` (tàn nhẫn), `doLechDiHoa = 71` — đã vượt `nguongDiHoa = 40`.

**Điều phải đúng**

- [ ] Cuối kỷ nguyên, `soul.banTinh` bị kéo về phía `banTinhTinDoTin` theo `tocDoDiHoa`.
- [ ] Người chơi **thấy được** điều đó đã xảy ra, và thấy nó xảy ra vì tín đồ hiểu sai.
- [ ] Phàm nhân vẫn chỉ thấy `banTinhTinDoTin`, không bao giờ thấy `banTinh`.

---

## PT-09 · Một đời phàm nhân bình thường vẫn có di sản

**Nguồn:** cổng Phase 7. **Phase kiểm:** 7. **Trạng thái:** `chua_chay`.

**Bước.** Chơi 30 phút ở tầng phàm nhân, **không** dùng thần can thiệp.

**Điều phải đúng**

- [ ] Mở được một Project nghề nghiệp và một quan hệ thật.
- [ ] NPC ngoài cảnh vẫn giữ lịch và vị trí đúng.
- [ ] Materialize T0 → named NPC **không bịa nguồn lực**.
- [ ] Chết đi vẫn để lại di sản truy được: người nhớ, vật để lại, hoặc một thay đổi nhỏ ở vùng.
- [ ] Sổ Tay **không lộ số engine**.

---

## PT-10 · Retrieval — forbidden recall bằng 0 ở cả ba mode

**Nguồn:** Phần 77.10, 79.3. **Phase kiểm:** 8. **Trạng thái:** `dat` — `retrieval.test.ts`.

**Tiền đề.** `src/test/fixtures/retrievalEval.ts` — 3 case, 8 chunk gồm đúng / nhiễu /
trùng nguồn / cấm.

**Điều phải đúng**

- [x] Chunk cấm thật sự không nhìn được ở mode tương ứng.
- [x] Không chunk nào vừa "đúng" vừa "cấm" trong cùng một case.
- [x] Chunk cấm **không xuất hiện** ở candidate, trace, cache, prompt hay eval output.
      Kiểm ba đường: sau `locTamNhin()`, sau cả đường ống, và qua `chamMotCase()`.
- [x] Heuristic cho cùng input luôn cho cùng thứ hạng; tie-break bằng `chunkId`.
- [x] MMR phạt hai chunk cùng `nguonId` — cùng nguồn cho độ giống bằng 1, và
      packer còn một trần cứng riêng (77.7 quy tắc 3).
- [x] Semantic timeout hoặc lỗi → trả heuristic, **không** mất lượt chơi. Kết quả
      trùng khít baseline heuristic, không phải "gần đúng".
- [x] Đổi `mode` hoặc `chuTheId` → **không** dùng cache cũ (`scopeKey` đổi).

**Điều còn nợ.** Cache chưa được nối vào đường chơi thật (store không truyền
`cacheDoc`/`cacheGhi`), nên dòng cuối mới chỉ kiểm ở tầng đơn vị.

---

## PT-11 · Endpoint chết vẫn chơi được

**Nguồn:** luật bất biến #8, cổng Phase 8. **Phase kiểm:** 8. **Trạng thái:** `dat`
cho endpoint **rerank**; đọc kèm ADR-0028 cho endpoint **Narrator**.

**Bước.** Trỏ endpoint rerank tới một cổng chết, rồi chơi tiếp.

**Điều phải đúng**

- [x] Config rerank hỏng → rơi về heuristic có cảnh báo có cấu trúc, không throw.
- [x] Endpoint rerank chết → lượt vẫn xong; panel hiện "Đã rơi về heuristic:
      adapter lỗi: Failed to fetch. Lượt chơi không bị chặn."
- [x] Không lượt nào bị mất; ba lỗi liên tiếp mở mạch 20 request rồi tự probe lại.
- [x] Bảng chẩn đoán ghi rõ fallback đã xảy ra và vì sao (`fallbackReason` vào
      `retrievalRuns`, và vào tab Truy hồi).

**Khác biệt có chủ ý với đặc tả.** Dòng "Narrator im lặng nhưng engine vẫn chạy"
KHÔNG còn đúng với dự án này: ADR-0028 nói không có AI thì không chơi, và nó thay
thế dòng "endpoint chết vẫn chơi được" của cổng Phase 8 **cho riêng Narrator**.
Với reranker thì dòng ấy giữ nguyên hiệu lực, và nó đã đạt.

---

## PT-12 · Nhập hai preset fixture an toàn

**Nguồn:** Phần 66.5, cổng Phase 9. **Phase kiểm:** 9.
**Trạng thái:** `da_chay` — `preset.test.ts` (107 test).

**Điều phải đúng**

- [x] Số đếm và hash khớp đặc tả (`preset-fixture.test.ts` — xem `docs/PRESET_COMPAT.md`).
- [x] Nhập **không** gọi network, **không** side effect.
- [x] **Không** script nào chạy — 5 + 4 helper script bị quarantine.
- [x] 21 mismatch của fixture A được giải đúng theo `order[].enabled`.
- [x] 7 prompt ngoài order được **giữ** nhưng **tắt**.
- [x] Regex chỉ chạy trên bản sao hiển thị, có timeout `maxRegexMs = 20`.
- [x] Tắt pack → trả về prompt native, **đúng hash cũ**.
- [x] Chạy 100 tick sau khi nhập, engine vẫn đúng.
- [x] `{{user}}` chỉ nhận `ProjectedPlayerPersona`; preset **không** đọc hay ghi hồ sơ riêng.

---

## PT-15 · Ban một luật ở thế giới rỗng

**Nguồn:** Phần 42.4, 42.7, lộ trình 45.1 mục 37. **Phase kiểm:** 10.
**Trạng thái:** `da_chay` — `phase10.test.ts`.

**Các bước**

```text
Thế giới vừa mở, chưa có gì
  → Sáng Thế ban "Máu đã đổ thì không rửa được"
  → engine phân rã thành bốn khái niệm nền
  → ba cái đã có trọng số, "Tẩy Uế" thì chưa từng tồn tại
```

**Điều phải đúng**

- [x] `hieuLuc = 0`, và panel nói rõ **mắt xích yếu nhất là Tẩy Uế**.
- [x] Dùng **min**, không dùng trung bình — ba khái niệm mạnh không cứu được câu luật.
- [x] Luật vẫn được **ghi vào sổ**; chế độ `tu_tiep_dia` không dựng tường.
- [x] Dòng cuối panel dạy cơ chế: "sẽ mạnh dần khi việc tẩy uế trở thành có thật ở đây".
- [x] Nuôi "Tẩy Uế" lên thì `hieuLuc` tăng và mắt xích yếu nhất **đổi sang cái khác**.
- [ ] Panel Hiệu Lực hiện trên màn thật — Phase 11.

---

## PT-16 · Người chép sách đặt tên cho Thời Gian

**Nguồn:** Phần 43.2, 43.5, 44.4. **Phase kiểm:** 10.
**Trạng thái:** `da_chay` — `phase10.test.ts`.

**Các bước**

```text
Khái niệm "Trước Sau" tích đủ trọng số và kết tinh
  → một người có tri thức cao viết câu đầu tiên về nó
  → trục Thời Gian chuyển vo_danh → co_ten
  → từ hôm ấy, thời gian có kẽ hở
```

**Điều phải đúng**

- [x] Đặt tên **sai thứ tự phụ thuộc** bị validator bắt (`van_menh` trước `thoi_gian`).
- [x] Khái niệm nền mới `manh_nha` thì chưa đủ — phải ít nhất `thanh_hinh`.
- [x] Trục `vo_danh` **không có kẽ hở nào**; kẽ hở chỉ sinh khi `co_ten`.
- [x] Kẽ hở suy từ **chính tham số**, không từ tên trục.
- [x] Dòng biên niên viết bằng giọng kể: "Ông không biết mình vừa làm gì".
- [x] Bất biến chặn ở mức transaction, không chỉ ở lúc gọi hàm.
- [ ] Mạch `dat_ten` hiện trên Bảng Thiên Diễn — Phase 11.

---

## PT-17 · Ra bị thu hồi, và lorebook thôi nói dối

**Nguồn:** Phần 35.5, 51.1 kiểu F, 51.2. **Phase kiểm:** 10.
**Trạng thái:** `da_chay` — `phase10.test.ts`.

**Các bước**

```text
Người chơi bật lorebook Ai Cập (nguon = 'nguoi_dung')
  → engine trích kỳ vọng "có một vị thần mặt trời cai trị thần điện"
  → kỳ vọng thỏa: Ra tồn tại, domainStrength > 70
  → người chơi THU Ra ở năm 1180
  → kỳ vọng chuyển bat_kha
```

**Điều phải đúng**

- [x] Sinh một **Dị Bản** đủ bốn thứ: kỳ vọng gốc, thực tế, nguyên nhân truy được, dòng biên niên.
- [x] Sinh một **gap** để thế giới tự lấp chỗ trống, `uuTien` nhân theo `lucHapDan`.
- [x] Entry "Ra cai trị thần điện" bị **che cùng lúc** — không còn được nạp vào ngữ cảnh.
- [x] Entry bị che **vẫn còn nguyên nội dung**, có lý do, và bỏ che được.
- [x] Nếu người chơi **khóa canon** entry ấy thì nó **không bao giờ** bị che.
- [x] Sử tự sinh thắng lorebook người dùng, nhưng chỉ bằng cách **che**, không bằng cách sửa.
- [ ] Bản Đồ Dị Biệt hiện hai cột — Phase 11.

---

## PT-18 · Hai mươi lượt kể một buổi tối

**Nguồn:** Phần 50.4 [BB]. **Phase kiểm:** 10.
**Trạng thái:** `da_chay` — `phase10.test.ts`.

**Điều phải đúng**

- [x] Tác vụ thời cục chạy **đúng một lần** trong hai mươi lượt chat cùng một nhịp.
- [x] Tua một thế kỷ trong một lượt → chạy **một trăm lần**, không phải một lần.
- [x] Không đọc được thời gian thì **bỏ lượt**, không chạy bừa.
- [x] Parse lỗi năm lần liên tiếp thì báo đúng chẩn đoán 33.
- [ ] Xưởng Workflow hiện "lịch kế tiếp" cho từng tác vụ — Phase 11.

---

## PT-13 · 100 năm offline không LLM

**Nguồn:** cổng Phase 5. **Phase kiểm:** 5. **Trạng thái:** `da_chay` — `world.test.ts`.

**Điều phải đúng**

- [x] Chạy 100 năm không endpoint AI, không crash (400 tick, 0 chẩn đoán mức `loi`).
- [x] Invariant dân số / vật chất / tri thức / vị trí pass ở mọi tick.
- [x] Không tri thức "teleport" — thông tin đi theo người và tuyến đường, đủ độ trễ.
- [x] Macro → micro bảo toàn state: cohort giảm đúng số người được đặt tên.
- [x] Catch-up không chạy micro vô hạn: 400 tick truyện → 10 bước engine.
- [x] Deterministic replay pass: cùng seed cho cùng hash (`752be49d0f285c41`).
- [x] Thế giới sống mà không cần người chơi: 310 sự kiện tự sinh trong 100 năm.

**Điều đã quan sát được trong lần chạy chuẩn**

Dân số 3.058 → 3.533 rồi chững lại: trần Malthus tới từ đất và rừng, không từ hằng số.
Có nạn đói, có dịch bùng phát rồi lui, có tin tức lan theo đường và mờ dần theo chặng.

---

## PT-14 · Riêng tư — không rò ở bất kỳ biên nào

**Nguồn:** Phần 79.4, cổng Phase 12. **Phase kiểm:** 12. **Trạng thái:** `chua_chay` (phần schema đã xong).

**Điều phải đúng**

- [x] `privateNotes`, `contentPreferences`, `accessibility` bị cấm ở **cả bảy biên**.
- [x] Trường chưa khai trong ma trận = cấm mặc định.
- [x] `chieuPersona()` dùng danh sách trắng — trường mới không tự lọt ra.
- [ ] Export save chia sẻ không chứa hồ sơ riêng nếu chưa opt-in.
- [ ] Log, crash report, URL, search index đều sạch.
- [ ] Debug snapshot sạch.
- [ ] Không secret (`proxyPassword`, API key) trong export hay log.

---

## Phase 11 — hai bảng và preset chạy thật

Chạy tay trong trình duyệt ngày đóng Phase 11. Mỗi ca ghi thao tác và kết quả
QUAN SÁT ĐƯỢC, không ghi "should work".

### PT-11.1 — Bảng Thiên Diễn mở bằng phím Tab

1. Vào thế giới bằng `Bỏ qua tất cả`.
2. Nhấn `Tab`.

**Quan sát.** Lớp phủ hiện tám vùng đúng thứ tự: Khi nào · Thế giới là gì · Có gì
tồn tại · Thế giới đang thế nào · Đã lệch bao xa · Đang xảy ra chuyện gì · Ai đáng
chú ý · Từ lần trước + Cần chú ý. Bảy trục Luật Nền đều "vô danh" kèm câu
_"đang đúng, nhưng chưa ai gọi tên nó"_. Bốn cơ chế đều "không · chưa quét".

### PT-11.2 — Phím I chuyển bảng, KHÔNG chồng lớp

1. Đang mở Bảng Thiên Diễn, nhấn `I`.

**Quan sát.** `document.querySelectorAll('.lop-phu').length === 1`, và section
`Bảng Thiên Diễn` biến mất. [BB] 58.1 đạt.

### PT-11.3 — Không tên enum nào lọt lên UI

1. Mở Bảng Thông Tin, tab Tổng quan.

**Quan sát.** Luật hiện `treo · hiệu lực 0 · toàn vũ trụ`. Trước khi sửa, cột thứ
ba là `vu_tru` — lỗi chỉ lộ khi chạy thật, nay có test máy kiểm chặn.

### PT-11.4 — Nhập fixture A thật qua giao diện

1. Rail → Xưởng Preset → Chọn file preset → `fixture-A.anon.json`.

**Quan sát.** Báo cáo sáu dòng:

```text
Đã đọc       182 prompt · 8 regex · 5 helper script
Hoạt động    8 native · 174 adapted
Cần chọn     1 nhóm xung đột
Cần adapter  0 macro · 8 transform
Cách ly      5 script · 0 module vượt quyền
Tham số      4 giữ nguyên · 3 bị giới hạn bởi model · 37 không hỗ trợ
Kích hoạt    Chưa
```

Con số prompt/regex/helper khớp đặc tả fixture A. Console 0 lỗi.

### PT-11.5 — Xung đột chặn kích hoạt, và giải được

1. Bấm `Nhập vào thư viện`, rồi bấm `Bật cho nhánh này`.

**Quan sát.** Pack vẫn "chưa bật", kèm cảnh báo:
_"Nhóm xung đột `history.wrapper` cần người chọn: Chỉ một trong số này được bật."_

2. Tải lại trang, vào lại Xưởng Preset.

**Quan sát.** Khối "Xung đột cần ngươi chọn" vẫn còn — nó dựng từ thư viện, không
từ phiên wizard (ADR-0052).

3. Chọn một module, bấm `Bật cho nhánh này`.

**Quan sát.** Pack chuyển sang "đang bật", cảnh báo biến mất.

### PT-11.6 — Preset THẬT SỰ vào prompt

1. Về Sảnh, gõ một câu, bấm Gửi. (Endpoint giả nên call sẽ hỏng — không sao, ta
   đo phần thân request.)

**Quan sát.**

```text
soMessage            3          system + user + assistant
daiHeThong           19.033     lõi native + module pack
coBayQuyTac          true       bảy quy tắc Narrator còn nguyên
coLuatEngineGiuSo    true
coHopDongCapNhat     true       <CapNhat> nằm ở message user
coMoiTraLoi          true       prefill là message riêng
```

Vị trí trong message system: an toàn 2 → hợp đồng engine 280 → lõi native 896 →
module pack 3772. [BB] 65.3 đạt.

2. Xưởng Preset → khối "Lượt kể gần nhất đã dùng gì".

**Quan sát.** _"Pack góp mặt: fixture-a-anon-c7706d97"_, và 125/182 module không
vào prompt (số còn lại bị nguồn tắt hoặc bị ngân sách cắt).

### PT-11.7 — Tắt pack trả về prompt native

1. Bấm `Tắt — trả về prompt native`, gửi một lượt nữa.

**Quan sát.** Khối trace đổi thành _"Lượt gần nhất chạy bằng prompt native. Không
module ngoài nào có mặt trong nó."_

### PT-11.8 — Khung hẹp

1. Thu cửa sổ xuống 739 px.

**Quan sát.**

```text
.khung-sanh        flex-direction: column
.khung-sanh__rail  flex-direction: row     (rail thành thanh ngang, cuộn được)
.khung-sanh__phai  flex-basis: 100%
thân trang         KHÔNG cuộn ngang
```

### PT-11.9 — Đứt đường AI không mất thế giới

1. Với endpoint hỏng, gửi ba lượt liên tiếp.

**Quan sát.** Mỗi lượt hiện _"Không ai kể được nhịp này: Failed to fetch — thế
giới vẫn giữ nguyên chỗ đang dở."_ Sau ba lần, cổng đóng và màn Cổng AI hiện nút
`Thử lại đường`. Bấm nó thì vào lại thẳng thế giới đang dở, không mất state.
