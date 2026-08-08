# PRESET COMPAT

Format, macro và extension được hỗ trợ — Phần 62–66, Phase 9 và 11.

> **Nhập không phải kích hoạt.** Nhập một file chỉ ghi nó vào thư viện; bật nó
> lên là một hành động riêng, và cho tới lúc ấy không dòng nào của nó chạy.

> **Bật rồi thì chạy THẬT.** Regex chạy đúng ngữ nghĩa SillyTavern, và script
> Tavern Helper chạy bằng chính JavaScript nguồn của nó. Không còn cách ly.

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

| Hạng mục                             | Quy tắc                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| ID                                   | namespace theo `pack/hash`, tránh đụng id native                    |
| Raw source                           | giữ **bất biến** để round-trip lại đúng file gốc                    |
| `context` / `output` / `top-k`       | giữ **raw**, rồi clamp theo `ModelProfile` + Probe                  |
| Macro var                            | nằm trong namespace của pack, **không** ghi World                   |
| Marker                               | đọc từ `WorldView` **đã chiếu**, không đọc từ World thô             |
| `<thinking>` và yêu cầu lộ reasoning | **không hiển thị, không lưu**                                       |
| `personaDescription`, `{{user}}`     | chỉ nhận `ProjectedPlayerPersona` (Phần 78.11)                      |
| `assistant_prefill` (trường cấp cao) | dựng thành module lane `prefill` — không nằm lại trong bảng tham số |

`assistant_prefill` không có trong `prompts[]`, nên nó từng đi lọt cả pipeline: lưu được,
export lại được, và không lượt kể nào nhận được nó. Giờ nó là một module bình thường và đi
đúng tầng 6 của 63.6 — model không nhận prefill thì nó bị bỏ **kèm** issue
`PREFILL_KHONG_HO_TRO`, chứ không biến mất lặng lẽ.

---

## An toàn — hàng rào còn lại sau khi bỏ cách ly

| Rủi ro                  | Hàng rào                                                                                                                              | Nơi cài                           | Test                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| Code trong dữ liệu pack | `quetDauVetCode()` bắt `eval`, `new Function`, `Function(`, `import(`, `<script>`, `javascript:`, `on*=`, `__proto__`, giá trị là hàm | `registry/manifest.ts`            | `registry.test.ts`                   |
| Pack trỏ handler lạ     | `handlerId` không có trong `HandlerCatalog` → trạng thái `can_adapter`, **không kích hoạt**                                           | `registry/catalog.ts`             | `registry.test.ts`                   |
| Điều kiện tùy ý         | `ExprNodeSchema` — AST 12 op, từ chối op lạ                                                                                           | `contracts/primitives.ts`         | `contracts.test.ts`                  |
| Hiệu ứng tùy ý          | `PatchTemplateSchema` — 8 op, đi qua validator                                                                                        | `contracts/primitives.ts`         | `contracts.test.ts`                  |
| Prototype pollution     | bỏ qua khóa `__proto__` / `constructor` / `prototype` khi gộp và khi quét                                                             | `manifest.ts`, `tuning/schema.ts` | `registry.test.ts`, `tuning.test.ts` |
| `eval` lọt vào core     | quét **mã nguồn** thật, không chỉ quét dữ liệu                                                                                        | —                                 | `source-guards.test.ts`              |

Hàng rào trên bảo vệ **engine** khỏi dữ liệu pack sai hình dạng, và chúng giữ nguyên:
một `PatchTemplate` lạ vẫn bị từ chối, một `handlerId` không có trong catalog vẫn không
kích hoạt. Cái đã bỏ là hàng rào bảo vệ **người dùng khỏi chính preset của họ**.

Giới hạn kích thước lấy từ `tuning.preset` (Phần 61.4):

```text
maxJsonBytes    10.000.000   trần file nhập
maxPromptBlocks      1.000
maxBlockChars      200.000
maxMacroDepth            3
maxRegexMs              20   nay là NGƯỠNG CHẨN ĐOÁN, không phải trần chặn
```

---

## Script — chạy thật, có vòng đời

Script `extensions.tavern_helper.scripts[]` được nạp bằng chính mã nguồn của nó,
qua host ở `src/runtime/tavern/`. Đây là thay đổi lớn nhất so với các phase trước,
nơi mọi script vào ở trạng thái cách ly và **không bao giờ** chạy.

### Cách host chạy một script

Mỗi script được bọc trong một `AsyncFunction` mà danh sách tham số chính là bảng
toàn cục của Tavern Helper. Ba lý do chọn cách này thay vì iframe:

1. Script thật khai `const Config = …` ở mức ngoài cùng. Chạy chung một scope thì
   script thứ hai nổ ngay dòng đầu vì trùng tên; bọc hàm là đủ để tách.
2. Script DOM cần **document thật** của trò chơi. Trong iframe chúng sẽ query một
   tài liệu rỗng rồi lặng lẽ không làm gì — hỏng theo kiểu không ai truy ra.
3. `await` ở mức ngoài cùng và `import()` động vẫn chạy được trong hàm async.

### API script thấy được

| Nhóm      | Hàm                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------ |
| Thư viện  | `_` (lodash), `z` (zod), `$` / `jQuery`, `toastr`, `SillyTavern.getContext()`, `TavernHelper`    |
| Danh tính | `getScriptId`, `getIframeName`, `getButtonEvent`, `getScriptButtons`                             |
| Biến      | `getVariables`, `replaceVariables`, `insertVariables`, `updateVariablesWith`, `deleteVariable`   |
| Sự kiện   | `eventOn/Once/RemoveListener/Emit/MakeFirst/MakeLast`, `tavern_events`, `iframe_events`          |
| Khung kể  | `getChatMessages`, `setChatMessages`, `getLastMessageId`, `getCurrentMessageId`                  |
| Preset    | `getPreset`, `getPresetNames`, `getLoadedPresetName`, `updatePresetWith`, `replacePreset`        |
| Văn bản   | `substitudeMacros`, `formatAsTavernRegexedString`, `getTavernRegexes`, `updateTavernRegexesWith` |
| Hành động | `generate`, `triggerSlash`, `errorCatched`, `console` (ghi vào nhật ký của chính script)         |

Cầu nối đầy đủ nằm ở `src/runtime/tavern/cauNoi.ts` — mỗi phương thức ở đó là một
quyền script thật sự có, và danh sách ngắn để câu hỏi "script làm được gì trong
ván này" trả lời được bằng cách **đọc**, không phải bằng cách chạy thử.

### Cái script vẫn KHÔNG làm được, và vì sao

| Không có         | Lý do                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Ghi `WorldState` | Replay xác định là bất biến của engine; mất nó là mất khả năng tái hiện một ván   |
| Tạo `Event`      | Cùng lẽ — sổ của thế giới chỉ engine ghi                                          |
| Gọi model riêng  | `generate()` đi đúng đường mà người chơi đi, nên ngân sách và vết cắt vẫn đo được |

Đây không phải hàng rào chống người dùng — preset là mã của chính họ. Đây là ba
chỗ mà một script ghi vào sẽ làm hỏng thứ không sửa lại được.

### Sự kiện phát ra trong một lượt

```text
người chơi gửi câu   → MESSAGE_SENT · USER_MESSAGE_RENDERED
trước khi gọi model  → GENERATE_AFTER_COMBINE_PROMPTS  (script SỬA ĐƯỢC prompt)
gọi model            → GENERATION_STARTED … GENERATION_ENDED
lời kể vào khung     → MESSAGE_RECEIVED
DOM đã vẽ xong       → CHARACTER_MESSAGE_RENDERED
```

`GENERATE_AFTER_COMBINE_PROMPTS` nhận một object sửa được `{ prompt, system }` và
kết quả được **đọc lại** — không có bước đọc lại thì handler chạy xong mà chẳng
đổi gì, đúng kiểu tính năng trông như có mà không có.

Hai sự kiện cuối cố ý tách nhau: `MESSAGE_RECEIVED` là "đã có dữ liệu",
`CHARACTER_MESSAGE_RENDERED` là "DOM đã có". Phát nhầm thứ tự thì script giao
diện query một node chưa tồn tại.

### Tắt script là tắt thật

`TheoDoi` giữ mọi thứ script cắm vào trang: `setTimeout`, `setInterval`,
`requestAnimationFrame`, `MutationObserver`, `addEventListener` trên
`document`/`window`, và handler trên bus sự kiện. Tắt script chạy ngược danh sách
đó. Node do script tạo mà tự khai `data-td-script="<id>"` cũng bị dọn.

Không có lớp này thì "tắt" chỉ là ngừng gọi, và bật lại lần nữa sẽ có hai bản
cùng chạy — triệu chứng là mỗi lượt kể mọc thêm một thẻ giao diện.

### DOM tương thích SillyTavern

Khung kể dựng đúng cấu trúc script mong đợi:

```html
<div id="chat">
  <div class="mes last_mes" mesid="7" is_user="false">
    <div class="mes_block"><div class="mes_text">…</div></div>
  </div>
</div>
```

HTML do preset sinh ra được render **thẳng vào DOM** (`NoiDungPreset`), không còn
nằm trong `<iframe sandbox="">`. Iframe an toàn, và nó cũng làm hỏng đúng thứ
preset dựng ra khối HTML để làm: script của chính preset không với tới được nội
dung bên trong. `<script>` trong `innerHTML` vẫn không chạy — đó là luật của trình
duyệt, không phải hàng rào ta dựng.

### Adapter native: đường lùi, không phải hàng rào

Các bản port viết tay (`cot_cleanup`, `prompt_merge`, `scene_switch`, `choice_ui`)
vẫn còn, nhưng **tự nhường chỗ** khi script nguồn của chúng đang chạy — nếu không
thì hai bản cùng làm một việc, và người dùng thấy tính năng "chạy một nửa". Script
tắt hoặc hỏng thì adapter quay lại và tính năng vẫn còn.

### CSP

Chạy mã nguồn script đòi hỏi `'unsafe-eval'`, nên `index.html` cho phép nó, cùng
`blob:` và `https:` cho script kiểu launcher nạp bundle từ CDN. `object-src 'none'`,
`base-uri 'none'` và `form-action 'none'` giữ nguyên — không tính năng nào cần tới
chúng, nên mất chúng là mất một hàng rào mà không đổi lấy gì.

## Regex — bám sát SillyTavern, không còn sandbox

Ba lớp rào cũ đã **bỏ hẳn**: không chặn trước pattern có hình dạng quay lui, không trần
200.000 ký tự, không tự tắt một transform chạy quá `maxRegexMs`. Ba lớp ấy có nghĩa khi
preset là dữ liệu của người lạ; với preset do chính người chơi viết thì chúng chỉ làm một
việc — khiến regex im lặng không chạy.

| Cái đã bỏ                             | Cái thay thế                                                     |
| ------------------------------------- | ---------------------------------------------------------------- |
| Chặn `(a+)+`, `(x\|x)*`, `{9999,}`    | Chạy. Lý do từ chối duy nhất còn lại: `RegExp` không biên được   |
| Trần 200.000 ký tự đầu vào            | Không trần                                                       |
| Quá `maxRegexMs` → bỏ + tắt vĩnh viễn | Giữ kết quả, ghi `REGEX_CHAY_LAU` mức `info`, hiện số ms ở Xưởng |

Còn **ngữ nghĩa** của pattern và chuỗi thay thế thì phải giống SillyTavern, vì người dùng đã
thử preset ở đó rồi mới mang sang. Lệch ở đây không làm hỏng lượt — nó chỉ cho ra một văn
bản khác, im lặng.

| Chi tiết                                | Quy tắc                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `"pattern"` viết trần                   | `new RegExp(pattern)` **không cờ** → thay **lần khớp đầu**       |
| `/pattern/flags`                        | cờ do preset khai; `/…/g` mới thay hết                           |
| `{{match}}` và `$&`                     | toàn bộ phần khớp                                                |
| `$0`–`$99`, `$<tên>`                    | nhóm tương ứng, đã lọc `trimStrings`                             |
| nhóm không tham gia · `$n` vượt số nhóm | **giữ nguyên `$n`** trong output                                 |
| `placement` rỗng                        | không chạy ở đâu (`placement.includes` của ST)                   |
| `markdownOnly` + `promptOnly` cùng bật  | chạy cả khi hiển thị lẫn khi ghép prompt                         |
| `minDepth < -1` · `maxDepth < 0`        | coi như **không đặt guard**, không phải "chặn tất"               |
| `disabled: true` trong file             | vẫn bật lại được từ cấu hình pack — công tắc UI có hiệu lực thật |
| `substituteRegex` 1 / 2                 | 1 = thay macro vào `findRegex`; 2 = thay macro rồi escape        |

Hai dòng giữa bảng là hai lỗi đã sửa, không phải lựa chọn phong cách: trả chuỗi rỗng cho
nhóm không tham gia là **nuốt nội dung**, và đếm `args` từ đầu mảng khiến `$4` của một regex
hai nhóm bốc phải cả chuỗi đầu vào rồi chèn nó vào output.

Đo trên 8 regex của fixture A: sau sửa, **cả 8 pattern cho ra cùng cờ với
`regexFromString` của ST**, kể cả mẫu trần `^([\s\S]*)$` đang bật.

### Regex nội tuyến `<regex>` trong prompt

Preset kiểu Tawa nhúng thẳng khối `<regex order=N>"/mẫu/cờ" : "thay thế"</regex>` vào nội dung
prompt. Ba luật:

- Chỉ chạy trên module **nhập**; message `td:*` giữ nguyên từng byte.
- Trần `maxBlockChars` áp cho **từng message**, không cho tổng. Cộng dồn cả mảng rồi hủy tất là
  đo sai đại lượng — Tawa v3.0.3 có 233.928 ký tự tổng nhưng message dài nhất chỉ 18.554, và
  cả 42 khối `<regex>` của nó từng không chạy lần nào.
- Mẫu được phép chứa dấu `/` thô (`"/<a>(.*?)</a>/gs"`) như `regexFromString` của ST. Khối sai
  dạng thì **báo ra**, không biến mất im lặng.

**Cố ý khác ST**, và đây là lý do:

| Chỗ khác                     | ST làm gì                              | Thiên Diễn làm gì và tại sao                                     |
| ---------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `$n` không có nhóm tương ứng | trả `''` (hoặc chèn nhầm offset)       | giữ `$n` — `replaceString` thật hay chứa `$5` là **giá số tiền** |
| regex chạy lâu               | không đo                               | vẫn dùng kết quả, chỉ ghi số ms để người viết preset tự quyết    |
| `placement` 3 / 5 / 6        | slash-command · world info · reasoning | đọc và giữ nguyên; đường chạy hiện dùng 1 và 2                   |

---

## Macro — bám sát ST, trừ ba chỗ có lý do

Đo trên fixture A: **10 tên macro khác nhau** trong 182 prompt, nhiều nhất là `{{trim}}`
(69 prompt) và `{{addvar}}` (63).

| Macro                                                 | Trạng thái                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `char` `user` `persona` `description`                 | từ `WorldView` đã chiếu + `ProjectedPlayerPersona`                   |
| `setvar` `getvar` `addvar` `incvar` `decvar`          | ngữ nghĩa ST đầy đủ (xem dưới), namespace `preset.<packId>`          |
| `setglobalvar` … `decglobalvar`                       | ánh xạ về biến pack, **kèm cảnh báo đổi phạm vi** (không xuyên save) |
| `random` `pick` `roll` `reverse`                      | cả `{{tên::a::b}}` lẫn `{{tên:a,b}}` và `{{roll d6}}`                |
| `newline` `noop` `{{//chú thích}}`                    | như ST                                                               |
| `lastusermessage`                                     | có                                                                   |
| `time` `date` `weekday` `idle_duration` …             | **không** — `core/` không đọc đồng hồ máy (luật bất biến #7)         |
| `input` `lastMessage` `lastCharMessage` `maxPrompt` … | chưa có — giữ nguyên văn kèm cảnh báo, không đoán bằng regex         |

**`addvar` không ép về số.** Đây là ngữ nghĩa `addLocalVariable` của ST: mảng JSON thì push,
hai vế đều đọc được thành số thì cộng số, **còn lại nối chuỗi**. Fixture A gọi `addvar` 64
lần và **62 lần giá trị là văn bản** — preset gom luật nhiều dòng vào biến rồi in lại bằng
`{{getvar}}`. Render tuần tự toàn bộ prompt đang bật cho ra **13 biến, trong đó 8 biến giữ
tổng cộng hơn 8.000 ký tự chỉ dẫn**, và cả 8 đều được đọc lại bằng `{{getvar}}` trong một
prompt đang bật. Ép số biến từng biến ấy thành `0`: preset vẫn chạy, prompt vẫn gửi, chỉ là
8.000 ký tự luật đã bốc hơi mà không có một cảnh báo nào.

`incvar` / `decvar` **in ra** giá trị mới (ST trả về nó); `setvar` / `addvar` ghi im lặng.

Ba chỗ cố ý khác ST:

| Chỗ khác         | ST làm gì                                     | Thiên Diễn làm gì và tại sao                                                                                                                        |
| ---------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{{random}}`     | entropy thật, mỗi lần render một khác         | seeded theo `sceneId + moduleId + turn` — replay xác định là bất biến của engine                                                                    |
| `{{trim}}`       | xóa `\r?\n` **hai bên** vị trí đặt macro      | cắt whitespace hai đầu khối. Đo fixture A: sau khi bỏ macro rỗng, 56 ở đầu khối, 13 ở cuối, **1 ở giữa** — hai cách cho cùng kết quả, nên không đổi |
| macro không biết | thử tra biến cùng tên, không có thì để nguyên | **luôn** giữ nguyên văn + ghi `MACRO_CAN_ADAPTER`; 63.5 cấm đoán mò                                                                                 |

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
- [x] Nhập một file **không** chạy script của nó — chạy là chuyện của bước bật
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

Mặc định bật những module mà **nguồn** khai là đang bật (`order[].enabled`, 63.3).
[BB] 64.1 — `adapted` là trạng thái **hoạt động**, không phải một dạng bị tắt:
fixture A có 8 native và 174 adapted, bỏ nhóm sau là bỏ gần cả pack.

Bật pack cũng nạp luôn **script** mà file nguồn khai `enabled: true`, và tắt pack
dừng chúng. Từng script có công tắc riêng theo nhánh (`__script_enabled`), tách
khỏi công tắc của bản port native (`__adapter_enabled`) — tắt cái này không tắt
cái kia.

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
- [x] Script chạy thật, có trạng thái, có nhật ký lỗi, và tắt được — tắt là dọn sạch
