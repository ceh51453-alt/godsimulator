# PRESET COMPAT

Format, macro và extension được hỗ trợ — Phần 62–66, Phase 9 và 11.

> **Nhập không phải kích hoạt. Lưu được toàn bộ không có nghĩa là được phép chạy toàn bộ.**

---

## Trạng thái hiện tại

**Phase 11 done.** Pipeline nhập mười hai bước chạy thật ở `src/core/preset/`, và
mọi con số trong bảng dưới đây được `preset.test.ts` đọc lại từ hai fixture trong
mỗi lần chạy test — không có số nào chép tay vào tài liệu rồi để đó.

**Từ Phase 11, pack đã nhập THẬT SỰ chạy.** Suốt Phase 9–10 nó không: repo có hai
bộ dựng prompt không bao giờ gặp nhau, nên preset nhập vào rồi nằm im (ADR-0049).

---

## Preset đi vào prompt bằng đường nào

```text
bienSoanPromptKe()  →  sáu tầng của 33.1
  → dungLoiNative()      chia thành: lõi hệ thống · nội dung slot · khối lượt-này
  → bienDichPromptPreset()  lắp slot vào marker, xếp module ở tầng 4
  → một CompiledPrompt duy nhất  → PromptGoi  → goiKe()
```

`bienSoanLuot()` (`core/preset/hopNhat.ts`) là **cửa duy nhất** store gọi. Không
pack nào bật thì bước giữa không chạy và prompt native đi thẳng.

### Marker nhận nội dung native nào

| Marker của preset    | Nội dung native lắp vào                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worldInfoBefore`    | tầng 5 — bản tin thế giới + chunk đã truy hồi                           |
| `charDescription`    | tầng 3 — bối cảnh chủ thể đã chiếu                                      |
| `scenario`           | tầng 4 — mạch truyện đang chiếu + những gì trong tầm mắt                |
| `chatHistory`        | vài nhịp cảnh gần nhất                                                  |
| `personaDescription` | `ProjectedPlayerPersona` — [BB] 78.11, không bao giờ hồ sơ riêng        |
| `charPersonality`    | _để trống_ — engine không có personality sheet; giữ nội dung module gốc |
| `dialogueExamples`   | _để trống_ — cùng lẽ                                                    |

**Marker pack không khai thì nội dung native của nó KHÔNG biến mất** — nó được gắn
vào cuối tầng 3. Pack thiếu `chatHistory` mất _bố cục_, không mất _trí nhớ_.

### Thứ tự quyền, đo trên fixture A thật

```text
vị trí 2     lõi an toàn sản phẩm     (tầng 0)
vị trí 280   hợp đồng engine          (tầng 1–2)
vị trí 896   lõi native, bảy quy tắc  (tầng 3)
vị trí 3772  module của pack ngoài    (tầng 4)
             ─────────────────────────────────
message user khối lượt-này + hợp đồng <CapNhat>
message assistant  prefill đã duyệt   (tầng 6)
```

Một pack khai `injection_order: -99999` vẫn nằm sau tầng 3, vì **không có nhánh
nào trong compiler đọc con số ấy để quyết vị trí tuyệt đối**.

---

## Thẻ bài MVU — nhận cú pháp, không nhận thẩm quyền

`bocTach()` đọc ba dạng khối cập nhật, cả ba qua **cùng ba lớp kiểm**:

| Dạng                      | Ví dụ                                          |
| ------------------------- | ---------------------------------------------- |
| native                    | `{"patches":[ … ]}`                            |
| bản đồ đường dẫn của 31.7 | `{"e.than.soul.x": {"_op":"add","_v":45}}`     |
| câu lệnh kiểu MVU         | `_.set('stat_data.hao_cam', 10, 25); // lý do` |

Thẻ `<CapNhat>` và `<UpdateVariable>` tương đương nhau.

**[BB] Ranh giới không được nhòe.** Đường dẫn trỏ tới thực thể có thật → thành
`PatchOp`, và vẫn phải qua bảng trắng bảng + đường dẫn cấm. Đường dẫn **không**
trỏ tới thứ gì trong thế giới → thành **biến của pack**, lưu ở `presetVars` khóa
`[packId+branchId]`, không chạm `WorldState`.

Đó là thứ cho phép một thẻ bài MVU giữ được bảng trạng thái của chính nó mà vẫn
không tự viết lại thế giới. Test chứng minh cả hai chiều:

```text
_.set('worlds.w1.playerState.mode', …)            → từ chối (bảng cấm)
_.set('deity_x.aspects.ban_nga.coreSelf.tuBi', …) → từ chối (đường dẫn cấm, 69.1)
_.set('stat_data.hao_cam', 10, 25)                → biến pack, không phải patch
{"concept_x.aspects.conceptual.trongSo": {"_op":"add","_v":45}}  → patch `add`
```

Câu lệnh được đọc bằng biểu thức chính quy trên **văn bản**. Không `eval`, không
`new Function` — luật bất biến #10.

---

## Hai fixture thật — số liệu đã đối chiếu

Đo bằng `tools/make-preset-fixture.mjs` trên hai file gốc. **Mọi con số khớp đặc tả.**

| Chỉ số                  | Fixture A   | đặc tả A | Fixture B    | đặc tả B    |
| ----------------------- | ----------- | -------- | ------------ | ----------- |
| SHA-256 (8 ký tự đầu)   | `5D43A1C3…` | ✓ khớp   | `3C305 23F…` | ✓ khớp      |
| Kích thước              | 632.916 B   | —        | 725.599 B    | —           |
| `prompts[]`             | **182**     | 182 ✓    | **179**      | 179 ✓       |
| `prompt_order[]` (khối) | 1           | —        | 1            | —           |
| order entry             | **175**     | 175 ✓    | **178**      | 178 ✓       |
| effective-enabled       | **75**      | 75 ✓     | **134**      | 134 ✓       |
| enabled mismatch        | **21**      | 21 ✓     | **0**        | (không nêu) |
| prompt ngoài order      | **7**       | 7 ✓      | **1**        | 1 ✓         |
| regex script            | **8**       | 8 ✓      | **21**       | 21 ✓        |
| regex source-enabled    | **4**       | 4 ✓      | **20**       | 20 ✓        |
| helper script           | **5**       | 5 ✓      | **4**        | 4 ✓         |
| helper source-enabled   | **3**       | 3 ✓      | **3**        | 3 ✓         |
| marker prompt           | 8           | —        | 8            | —           |

SHA-256 đầy đủ:

```text
A  5D43A1C3F9973027F4560FC97849C9EDBBBCE650E6078F061A9C87F7704A64DB
B  3C30523F8DFA0506DA25526C702A661DD8566EF107C7532309FE747BBAC87926
```

---

## Format nhận diện

| Format                      | Nhận diện bằng                                           | Trạng thái     |
| --------------------------- | -------------------------------------------------------- | -------------- |
| `sillytavern_openai_preset` | có `prompts[]` + `prompt_order[]` + `openai_max_context` | cả hai fixture |
| SillyTavern character card  | có `spec: 'chara_card_v2'`                               | chưa hỗ trợ    |
| Lorebook / world info       | có `entries` dạng bản đồ khóa số                         | Phase 10 ✓     |
| Regex script rời            | có `findRegex` + `replaceString`                         | Phase 9 ✓      |
| Registry pack Thiên Diễn    | `RegistryPackSchema`                                     | Phase 0 ✓      |

**[BB] Năm loại preset không được trộn** (Phần 62). Sniff sai loại → từ chối có giải thích,
không đoán.

---

## Nguồn chân lý về thứ tự và trạng thái [BB]

| Câu hỏi                                                    | Nguồn                           |
| ---------------------------------------------------------- | ------------------------------- |
| Thứ tự các prompt                                          | `prompt_order[].order[]`        |
| Prompt nào đang bật                                        | `order[].enabled`               |
| Nếu **toàn file** không có `prompt_order`                  | fallback về `prompts[].enabled` |
| Prompt có mặt trong `prompts[]` nhưng vắng trong `order[]` | **giữ lại, mặc định TẮT**       |

Fixture A có **21 mục** mà `prompts[].enabled` mâu thuẫn với `order[].enabled`. Đây chính là
lý do quy tắc trên tồn tại: đọc nhầm nguồn thì 21 prompt sẽ bật/tắt sai.

Fixture A còn có **7 prompt ngoài order** — chúng phải được lưu để round-trip, nhưng không
được tự bật.

---

## Chuẩn hóa

| Hạng mục                             | Quy tắc                                                 |
| ------------------------------------ | ------------------------------------------------------- |
| ID                                   | namespace theo `pack/hash`, tránh đụng id native        |
| Raw source                           | giữ **bất biến** để round-trip lại đúng file gốc        |
| `context` / `output` / `top-k`       | giữ **raw**, rồi clamp theo `ModelProfile` + Probe      |
| Macro var                            | nằm trong namespace của pack, **không** ghi World       |
| Marker                               | đọc từ `WorldView` **đã chiếu**, không đọc từ World thô |
| `<thinking>` và yêu cầu lộ reasoning | **không hiển thị, không lưu**                           |
| `personaDescription`, `{{user}}`     | chỉ nhận `ProjectedPlayerPersona` (Phần 78.11)          |

---

## An toàn — hàng rào đã dựng ở Phase 0

| Rủi ro                  | Hàng rào                                                                                                                              | Nơi cài                           | Test                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| Code trong dữ liệu pack | `quetDauVetCode()` bắt `eval`, `new Function`, `Function(`, `import(`, `<script>`, `javascript:`, `on*=`, `__proto__`, giá trị là hàm | `registry/manifest.ts`            | `registry.test.ts`                   |
| Pack trỏ handler lạ     | `handlerId` không có trong `HandlerCatalog` → trạng thái `can_adapter`, **không kích hoạt**                                           | `registry/catalog.ts`             | `registry.test.ts`                   |
| Điều kiện tùy ý         | `ExprNodeSchema` — AST 12 op, từ chối op lạ                                                                                           | `contracts/primitives.ts`         | `contracts.test.ts`                  |
| Hiệu ứng tùy ý          | `PatchTemplateSchema` — 8 op, đi qua validator                                                                                        | `contracts/primitives.ts`         | `contracts.test.ts`                  |
| Prototype pollution     | bỏ qua khóa `__proto__` / `constructor` / `prototype` khi gộp và khi quét                                                             | `manifest.ts`, `tuning/schema.ts` | `registry.test.ts`, `tuning.test.ts` |
| `eval` lọt vào core     | quét **mã nguồn** thật, không chỉ quét dữ liệu                                                                                        | —                                 | `source-guards.test.ts`              |

Giới hạn kích thước lấy từ `tuning.preset` (Phần 61.4):

```text
maxJsonBytes    10.000.000
maxPromptBlocks      1.000
maxBlockChars      200.000
maxMacroDepth            3
maxRegexMs              20
```

---

## Script — cách ly, không chạy [BB]

| Loại                                      | Xử lý                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions.tavern_helper.scripts[]`      | **quarantine**. Không chạy. Hiện trong Xưởng Preset kèm cảnh báo. Chỉ chạy được qua adapter API do người dùng bật tay từng cái (Phase 9). |
| `extensions.regex_scripts[]`              | Chỉ port sang **transform giới hạn**, chạy trên **bản sao hiển thị**, có timeout `maxRegexMs`. **Không** sửa message/event/state gốc.     |
| Remote import, DOM hook, tool-like module | **quarantine** tuyệt đối                                                                                                                  |

Fixture A có 5 helper script (3 bật ở nguồn) và 8 regex (4 bật). Fixture B có 4 helper
(3 bật) và 21 regex (20 bật). **Không cái nào được chạy khi nhập.**

---

## Fixture trong repo

Vì lý do bản quyền, repo chỉ chứa bản **cấu trúc đã ẩn danh** (ADR-0007):

```text
src/test/fixtures/preset/fixture-A.anon.json   giữ hình dạng, thay nội dung
src/test/fixtures/preset/fixture-A.meta.json   SHA-256 file gốc + số đếm
src/test/fixtures/preset/fixture-B.anon.json
src/test/fixtures/preset/fixture-B.meta.json
```

Sinh lại trên máy có file gốc:

```bash
node tools/make-preset-fixture.mjs "<đường dẫn A>" "<đường dẫn B>"
```

---

## Cổng Phase 9 — đã chạy, PASS

- [x] Hai fixture đúng hash / count / mismatch
- [x] Import **không** network, **không** side effect
- [x] **Không** script nào chạy
- [x] **Không** module ngoài vào Updater mặc định
- [x] Preset không đọc hay ghi đè hồ sơ riêng / danh tính canon nếu chưa có diff và xác nhận
- [x] Tắt pack trả về prompt native
- [x] Chạy 100 tick sau import, engine vẫn đúng

---

## Bật một pack — làm gì, và cái gì chặn

1. **Xưởng Preset → Chọn file preset.** Pipeline mười hai bước chạy, báo cáo sáu
   dòng của 66.2 hiện ra. Chưa có gì được ghi đĩa.
2. **Nhập vào thư viện.** Giờ nó ở trong máy, và vẫn **chưa chạy**.
3. **Giải xung đột** nếu báo cáo nói "cần chọn". [BB] 65.2 — pack chưa giải xung
   đột thì không kích hoạt, và fixture A có một nhóm như vậy (`history.wrapper`).
4. **Bật cho nhánh này.** Lựa chọn xung đột lưu theo `packId` nên nó sống qua lần
   đóng tab (ADR-0052).

Mặc định bật những module mà **nguồn** khai là đang bật (`order[].enabled`, 63.3)
và có `activation` ngoài ba trạng thái bị cấm: `quarantined`, `needs_adapter`,
`disabled`. [BB] 64.1 — `adapted` là trạng thái **hoạt động**, không phải một dạng
bị tắt: fixture A có 8 native và 174 adapted, bỏ nhóm sau là bỏ gần cả pack.

Khối **"Lượt kể gần nhất đã dùng gì"** của Xưởng Preset trả lời câu quan trọng
nhất: pack nào góp mặt, module nào không vào được prompt, macro nào chưa có ánh
xạ. Không có nó, "đang bật" chỉ là một lời hứa không kiểm được.

---

## Cổng Phase 11 — đã chạy, PASS

- [x] Preset đã bật **thật sự** có mặt trong prompt gửi đi
- [x] Thứ tự quyền 65.3 giữ nguyên sau khi hợp nhất hai đường prompt
- [x] Marker pack không khai thì nội dung native vẫn tới model
- [x] Tắt pack trả về prompt native, bảy quy tắc Narrator còn nguyên
- [x] Cú pháp MVU không mở thêm cửa nào vào `WorldState`
- [x] Biến pack không đọc chéo nhánh (khóa kép `[packId+branchId]`)
- [x] Script bị cách ly hiện ra kèm đích native tương ứng, và **không có nút bật**
