# DECISIONS — Quyết định kiến trúc

Ghi theo Phần 74.4 và 76.3. Mỗi mục nêu **bối cảnh**, **quyết định**, **lý do** và **hệ quả**.
Chỉ mâu thuẫn ảnh hưởng save format, luật game hoặc quyền truy cập dữ liệu mới cần ADR.

Thứ tự ưu tiên khi có mâu thuẫn (Phần 76.3 + Prompt IDE):

```text
yêu cầu mới nhất của người dùng
  > [BB] Khối U
  > [BB] Khối R–T
  > an toàn dữ liệu + chống rò rỉ + deterministic
  > [BB] các khối cũ
  > [MR] > [KN]
```

---

## ADR-0001 — Khởi tạo git repository

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng

**Bối cảnh.** Thư mục làm việc chỉ có hai file đặc tả, không phải git repo. Prompt IDE yêu cầu
"không phá, reset hoặc ghi đè thay đổi hợp lệ đang có của người dùng".

**Quyết định.** Chạy `git init` và thêm `.gitignore`. Không commit tự động.

**Lý do.** Không có version control thì không có đường lùi cho người dùng. Đây là thao tác
cộng thêm, không xóa gì.

**Hệ quả.** Hai file đặc tả gốc giữ nguyên, chưa từng bị sửa.

---

## ADR-0002 — Bỏ `.prefault({})` trên schema có trường bắt buộc

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** không

**Bối cảnh.** Đặc tả viết `.prefault({})` ở cuối `EntitySchema`, `LinkSchema`, `GapSchema`,
`AvatarSchema`, `RelationStateSchema` và `ModelProfileSchema`. Các schema này đều có trường
bắt buộc (`id`, `branchId`, `kind`, `ten`, `tickSinh`…). Zod 4 từ chối ở mức kiểu:

```text
Argument of type '{}' is not assignable to parameter of type
'{ id: string; branchId: string; ... }'
```

**Quyết định.** Thay `.prefault({})` bằng `.strict()` trên các schema đó. Giữ nguyên
`.prefault({})` ở những schema mà mọi trường đều có giá trị mặc định (`SoulSchema`,
`ConceptualSchema`, `LawfulSchema`, `DomainSchema`, `TuningSchema`, `PlayerStateSchema`…).

**Lý do.** `.prefault({})` trên một Entity là vô nghĩa về mặt ngữ nghĩa: không tồn tại
"Entity mặc định". `.strict()` mạnh hơn — nó chặn trường lạ, phù hợp với dữ liệu không tin
cậy đến từ preset/pack/save import.

**Hệ quả.** Parse `EntitySchema.parse(undefined)` giờ báo lỗi thay vì trả object rỗng — đúng
hành vi mong muốn. Cổng 61.1 #1 vẫn đạt: `.prefault()` vẫn được dùng xuyên suốt ở đúng chỗ,
và `contracts.test.ts` chứng minh nó khác `.default()`.

---

## ADR-0003 — `lawful.kichHoat.dieuKien` là ExprNode AST, không phải chuỗi

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** có

**Bối cảnh.** Phần 9.1 khai `dieuKien: z.string().prefault('true')`, và Phần 9.2 kiểm tra 2 nói
`dieuKien` phải "parse và eval được". Nhưng luật bất biến #10 và Phần 61.2 cấm tuyệt đối
`eval`, `new Function` và dynamic import — kể cả cho dữ liệu do người chơi nhập, vì luật có
thể đến từ preset pack.

**Quyết định.** `lawful.kichHoat.dieuKien` và `lawful.ngoaiLe[].dieuKien` dùng
`ExprNodeSchema` (Phần 61.2) thay vì `string`.

**Lý do.** Phần 61.2 là [BB] ở Khối R, đứng trên [BB] Khối C theo thứ tự ưu tiên 76.3.
ExprNode AST vẫn "parse và eval được" theo nghĩa của kiểm tra 2 — chỉ là bằng một
interpreter giới hạn, không bằng engine JavaScript.

**Hệ quả.** Phase 1 phải cài `evalExpr(node, ctx)` cho mười hai op của `EXPR_OPS`.
`lawFormalizer` (Phase 4) sinh ra AST, không sinh ra chuỗi. UI Xưởng Luật hiển thị AST bằng
trình dựng biểu thức, không bằng ô nhập text tự do.

---

## ADR-0004 — Id registry theo snake_case, tách khỏi tên trường camelCase

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** có (id metric nằm trong manifest xuất ra)

**Bối cảnh.** Phần 13.1 đặt tên chỉ số theo camelCase (`realityIntegrity`, `doSongDong`) vì
chúng là trường của `WorldMetricsSchema`. Phần 61.2 lại buộc `RegistryManifest.id` khớp
`/^[a-z0-9][a-z0-9_.-]*$/` — không cho chữ hoa. Bài test cổng phát hiện xung đột này.

**Quyết định.** Id trong `R.metric` dùng snake_case (`reality_integrity`, `do_song_dong`).
`MetricDef` thêm trường `truongWorldMetrics` trỏ về tên trường camelCase tương ứng.

**Lý do.** Regex id là [BB] Khối R và là ràng buộc an toàn thật (id đi vào khóa DB, tên file
pack, và URL). Tên trường schema là hợp đồng dữ liệu riêng, không nhất thiết trùng id registry.

**Hệ quả.** `registry.test.ts` kiểm mọi `truongWorldMetrics` trỏ về một trường có thật của
`WorldMetricsSchema`. UI hiển thị `MetricDef.ten` tiếng Việt, không hiển thị id thô
(Phần 41 "không raw id/enum trên UI").

---

## ADR-0005 — `WorldView.dongTuKhaDung` giữ `VerbHandle`, không giữ `VerbDef`

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** không

**Bối cảnh.** Phần 18.1 khai `dongTuKhaDung: VerbDef[]`. Nhưng `VerbDef` chứa closure
(`kiemTraTruoc`, `thucThi`, `heQua`) và Zod schema. Phase 1 cần `WorldView` hash được và
snapshot được; Phần 77.8 cần `visibilityHash` ổn định.

**Quyết định.** `WorldView.dongTuKhaDung` là `readonly VerbHandle[]` — dữ liệu thuần
(`id`, `ten`, `moTa`, `coChatHopLe`). Runtime tra `R.verb` khi thực thi.

**Lý do.** Phần 61.2 [BB] tách manifest khỏi runtime handler; WorldView là phép chiếu, nên nó
thuộc phía manifest. Hàm không serialize được, không hash được, và không nên đi qua biên
projection.

**Hệ quả.** Mọi nơi cần thực thi động từ phải `R.verb.lay(handle.id)`. Đổi lại `WorldView`
JSON hóa được, so sánh được, và đưa vào cache key được.

---

## ADR-0006 — Handler runtime nạp qua `dangKyHandler`, catalog rỗng ở Phase 0

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 61.2 khai `HandlerCatalog: ReadonlyMap<string, RuntimeHandler>` là hằng số.
Nhưng handler thật thuộc Phase 1 (patch/transaction) và Phase 5 (world process). Phase 0 mà
nhét handler giả vào catalog thì vi phạm luật bất biến #13.

**Quyết định.** `HandlerCatalog` là `ReadonlyMap` xuất ra từ một `Map` nội bộ; module engine
gọi `dangKyHandler(id, fn)` lúc khởi động. Manifest trỏ tới `handlerId` chưa đăng ký thì mục
ở trạng thái `can_adapter` và **không kích hoạt** — đúng cơ chế 61.2 quy định cho id lạ.

**Lý do.** Đây là cơ chế đặc tả đã có sẵn cho id lạ, dùng lại được cho "chưa nối". Nó trung
thực: bảng chẩn đoán hiện đúng mục nào chưa chạy được, thay vì một TODO trong comment.

**Hệ quả.** Cuối Phase 5, mọi `handlerId` của registry dựng sẵn phải tra được — đây là một
mục trong cổng Phase 5.

---

## ADR-0007 — Fixture preset lưu bản cấu trúc đã ẩn danh

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng quyền dữ liệu:** có

**Bối cảnh.** Prompt IDE: "Không sao chép nội dung có bản quyền của fixture vào source phát
hành; có thể dùng bản fixture cấu trúc đã ẩn danh trong test." Nhưng Phase 9 cần đối chiếu
đúng số đếm và hash của hai file thật.

**Quyết định.** `tools/make-preset-fixture.mjs` sinh hai cặp file trong
`src/test/fixtures/preset/`:

- `fixture-{A,B}.anon.json` — giữ nguyên hình dạng, số lượng, thứ tự, cờ `enabled`, tên khóa
  và kiểu marker; mọi văn bản tự do bị thay bằng `[noi-dung-an-danh:<sha1>:<độ dài>]…`.
- `fixture-{A,B}.meta.json` — SHA-256 của **file gốc**, kích thước, và toàn bộ số đếm.

**Lý do.** Test cần cấu trúc, không cần nội dung. Hash file gốc đủ để nhận diện ở Phase 9 mà
không phải phát hành nội dung.

**Hệ quả.** `preset-fixture.test.ts` đối chiếu từng con số với đặc tả và tất cả đều khớp —
xem `docs/PRESET_COMPAT.md`. Khi cần chạy lại trên máy khác:

```bash
node tools/make-preset-fixture.mjs "<đường dẫn A>" "<đường dẫn B>"
```

---

## ADR-0008 — Ma trận riêng tư mặc định CẤM, phép chiếu dùng danh sách trắng

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng quyền dữ liệu:** có

**Bối cảnh.** Luật bất biến #17/#18 và Phần 78 đòi hỏi `PlayerProfile` không lọt vào World,
lorebook, RAG, prompt, preset, log hay export mặc định.

**Quyết định.**

1. `src/core/privacy/matrix.ts` khai từng trường cấp một của `PlayerProfile` và
   `CreatorIdentity` với phân loại và danh sách biên được phép. **Trường chưa khai = CẤM.**
2. `chieuPersona()` dựng `ProjectedPlayerPersona` bằng **danh sách trắng tường minh** — không
   spread, không `delete`.
3. Test chứng minh mọi trường cấp một của cả hai schema đều có mặt trong ma trận, và số mục
   ma trận bằng đúng số trường.

**Lý do.** Lọc bằng `delete` hoặc `omit` thì trường mới thêm vào Profile sẽ tự lọt ra. Danh
sách trắng thì trường mới mặc định bị chặn, và bài test khai-thiếu sẽ đỏ.

**Hệ quả.** Thêm bất kỳ trường nào vào `PlayerProfileSchema` mà quên cập nhật ma trận →
`privacy.test.ts` fail. Đây là hàng rào tự động, không phải quy ước.

---

## ADR-0009 — `StartingPresenceDraft` không có trường sức mạnh

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** có

**Bối cảnh.** Phần 78.7: "không cho tự khai `domainStrength`". Phần 78.8: "Không cho người chơi
tự gõ tài sản/kỹ năng vô hạn rồi nhận thẳng."

**Quyết định.** `StartingPresenceDraftSchema.deity` chỉ có `domainConceptIds` (tối đa 3),
`pantheonId`, `primordial`. Không có `suc`, không có `domainStrength`. Phần `mortal` chỉ nhận
`skillIds`/`itemIds` là **tham chiếu** tới thứ có thật trong world, không nhận số.

**Lý do.** Chặn ở tầng schema mạnh hơn chặn ở tầng validator: không có đường biểu diễn thì
không có đường lách, kể cả qua preset hay save import thủ công.

**Hệ quả.** Phase 4 phải cài validator quyết định `suc` khởi đầu từ trạng thái world
(khái niệm đã tiếp địa chưa, có tín đồ chưa), không từ input người chơi.

---

## ADR-0010 — Không có cấp độ đo lường "phần trăm hoàn thành"

**Ngày:** Phase 0
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 74.2: một phase chỉ có bốn trạng thái, "không dùng 90% done".

**Quyết định.** `docs/IMPLEMENTATION_STATUS.md` chỉ ghi `not_started | in_progress | blocked |
done` cho từng phase, kèm bằng chứng lệnh đã chạy. Không có thanh tiến độ.

**Lý do.** Một gate fail thì phase chưa xong, bất kể bao nhiêu việc đã làm.

**Hệ quả.** Báo cáo cuối phase phải dán kết quả lệnh thật.

---

## ADR-0011 — Hoàn tác chính xác thay cho snapshot toàn state

**Ngày:** Phase 1
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** không (chỉ hiệu năng và hình dạng API)

**Bối cảnh.** Bản cài đầu của `apDungEvent` snapshot cả `WorldState` trước mỗi Event để
rollback, và tính `hashState` trước/sau mỗi Event. Cả hai đều là O(kích thước thế giới).
Với cổng "10.000 bước cùng seed cho cùng hash", thế giới lớn dần tới hơn 3.000 entity, nên
tổng chi phí là O(n²) — bài test chạy quá 300 giây mà chưa xong.

**Quyết định.**

1. `apPatch` trả thêm `ThongTinHoanTac` — bản gốc của **đúng** những bản ghi bị chạm — và
   `PhamViThayDoi`. `hoanTacPatch()` khôi phục chính xác từng bản ghi đó.
2. `apDungEvent` nhận `tuyChon.tinhHash`, **mặc định tắt**. Replay chỉ tính hash một lần ở
   cuối; ai cần hash từng bước thì bật tường minh.

**Lý do.** Tính atomic không đến từ việc sao chép cả thế giới — nó đến từ chỗ `apPatch` vốn
đã làm việc trên bản nháp và chỉ ghi ở pha cuối. Undo chính xác cho cùng bảo đảm với chi phí
tỷ lệ số bản ghi bị chạm.

**Hệ quả.** 10.000 bước chạy trong ~0,9 giây. `hashTruoc`/`hashSau` là chuỗi rỗng khi
`tinhHash` tắt — có test riêng cho hành vi này để không ai nhầm nó là hash thật.

**Bẫy đã gặp.** Nếu chính lô patch đã chạm bảng `worlds`, thông tin hoàn tác đã giữ bản gốc
của world; khôi phục `tick`/`version` thủ công sau đó sẽ ghi đè lên bản vừa khôi phục.
`apDungEvent` kiểm `hoanTac.truoc.has('worlds|worlds')` trước khi đụng tới hai trường này.

---

## ADR-0012 — Invariant kiểm theo phạm vi, quét toàn cục ở ranh giới

**Ngày:** Phase 1
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** có (thời điểm phát hiện vi phạm)

**Bối cảnh.** Chạy toàn bộ bất biến trên toàn bộ thế giới sau **mỗi** Event cũng là O(n²).
Riêng bất biến "không thực thể mồ côi" phải dựng bản đồ bậc của mọi entity mỗi lần.

**Quyết định.**

- `chayInvariant(state, phamVi)` nhận `PhamViThayDoi` do `apPatch` trả về, và chỉ kiểm
  những bản ghi đã bị chạm.
- Bất biến nào chỉ có nghĩa khi nhìn toàn cục khai `canToanCuc: true`; chúng bị bỏ qua khi
  phạm vi hẹp.
- `chayInvariantToanBo()` quét đầy đủ, và được gọi ở **cuối replay**, khi **nạp save**, và
  trong **bảng Chẩn Đoán**.

**Lý do.** Bất biến cục bộ (link treo, sai nhánh, chết trước khi sinh, chỉ số ngoài khoảng)
chỉ hỏng được bởi chính bản ghi vừa sửa, nên kiểm hẹp là đủ chặt. Bất biến toàn cục là loại
"lỗ hổng" của Phần 15 — chúng vốn được thiết kế để phát hiện theo chu kỳ rồi biến thành nội
dung, không phải để chặn từng transaction.

**Hệ quả.** Một entity vừa tạo mà chưa kịp nối link sẽ **không** làm transaction thất bại;
nó bị bắt ở lần quét toàn cục kế tiếp và đi vào bảng `gaps` với `loai = 'mo_coi'`. Đó đúng
là hành vi Phần 6.3 và Phần 15 mô tả.

---

## ADR-0013 — Trường dẫn xuất không vào state hash

**Ngày:** Phase 1
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** có

**Bối cảnh.** `Entity._degree` và `Entity._hash` được đặc tả gọi là "engine-only, cache bậc
đồ thị". Nếu đưa chúng vào state hash thì hai state giống hệt nhau về mặt ngữ nghĩa nhưng
lệch cache sẽ cho hai hash khác nhau, làm replay báo lệch giả.

**Quyết định.** `hashState()` loại `_degree` và `_hash` khỏi phép băm. `_version` thì **giữ**.

**Lý do.** `_degree` và `_hash` tính lại được từ state khác. `_version` thì không — nó quyết
định patch nào được optimistic concurrency chấp nhận, nên nó là state thật.

**Hệ quả.** Hai bài test tường minh: một chứng minh `_degree`/`_hash` lệch vẫn cho cùng hash,
một chứng minh `_version` lệch cho hash khác. Phase 2 khi thiết kế export phải nhớ cache có
thể dựng lại, nên không nhất thiết phải nằm trong file save.

---

## ADR-0014 — Copy-on-write bằng compound key, không dùng overlay

**Ngày:** Phase 2
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** có

**Bối cảnh.** Phần 61.5 yêu cầu chọn dứt khoát: _"Nếu chọn mô hình overlay thay compound key
thì phải chứng minh bằng test cùng mức. Không được giữ primary key `id` rồi tuyên bố hai
nhánh có thể chứa hai bản khác nhau của cùng entity."_

**Quyết định.** Dùng **compound key `[branchId+id]`** với ba quy tắc:

1. **Đọc** — đi từ nhánh hiện tại lần lên `gocId` tới gốc; bản ghi ở nhánh **gần nhất** thắng.
2. **Ghi** — LUÔN ghi vào nhánh hiện tại; `branchId` của bản ghi bị ép về nhánh đang ghi.
3. **Xóa** — đặt **bia mộ** (`tombstones[branchId+bang+id]`) ở nhánh hiện tại; không đụng
   bản ghi của cha.

**Lý do.** Compound key cho phép hai nhánh giữ hai bản khác nhau của cùng `id` mà không cần
tầng overlay trong bộ nhớ. Fork là O(1) — chỉ thêm một bản ghi `Branch`, không sao chép dữ
liệu. Đây đúng là "copy-on-write" theo nghĩa đen: bản sao chỉ sinh ra khi có ghi thật.

**Bia mộ là phần bắt buộc.** Thiếu nó, phép đọc lần lên cha sẽ **hồi sinh** thứ nhánh con đã
xóa. Đặc tả không nhắc chi tiết này; nó lộ ra ngay khi viết test xóa-ở-nhánh-con.

**Hệ quả.**

- `entities`, `links`, `gaps` đều dùng `[branchId+id]`; `worlds` và `metrics` khóa theo
  `branchId`.
- Khi nạp state cho nhánh con, bản ghi kế thừa từ cha được **gán lại** `branchId` của nhánh
  đang đọc, nếu không bất biến `entity_dung_nhanh` sẽ báo sai.
- Event thuộc về nhánh sinh ra nó; nhánh con đọc được toàn bộ lịch sử của cha, sắp xếp theo
  `(tick, id)` để deterministic.
- Hợp nhánh (Phần 26.3) chưa cài — nó là Phase 10.

---

## ADR-0015 — Đổi `branchId` trong migration là ĐỔI KHÓA, phải xóa bản ghi cũ

**Ngày:** Phase 2
**Trạng thái:** đã áp dụng
**Ảnh hưởng save format:** có

**Bối cảnh.** Migration v1→v2 gán `branchId` cho bản ghi cũ. Bản cài đầu chỉ gọi
`bang.put({ ...r, branchId })`. Bài test cổng phát hiện migration không bao giờ hoàn tất:
số bản ghi thiếu `branchId` **không giảm**.

**Nguyên nhân.** v1 dùng primary key `id` trần; v2 dùng `[branchId+id]`. Với khóa mới,
`put` một bản ghi đã đổi `branchId` sẽ **tạo hàng thứ hai** ở khóa mới, còn hàng cũ ở
`['', id]` vẫn nguyên. Dữ liệu bị nhân đôi thay vì được di chuyển.

**Quyết định.** Trong migration: `put` bản ghi ở khóa mới, **rồi `delete` khóa cũ**, cả hai
trong cùng một transaction lô.

**Lý do.** Đây là hệ quả trực tiếp của việc đổi hình dạng primary key. Bất kỳ migration nào
sau này chạm tới thành phần khóa đều phải theo cùng khuôn: ghi mới → xóa cũ → kiểm đếm.

**Hệ quả.** Cổng 61.5 quy tắc 3 ("không xóa v1 trước khi v2 kiểm hash và đếm record") được
cài như một bước riêng: migration **chỉ** ghi `hoanTat: true` sau khi đếm lại và xác nhận
không còn bản ghi thiếu `branchId`, đồng thời lưu hash + số đếm vào `settings`.

---

## ADR-0016 — Parser tiếng Việt khớp theo TỪ, không khớp chuỗi con

**Ngày:** Phase 4
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** có (quyết định câu nào được hiểu là hành động gì)

**Bối cảnh.** Rule parser bỏ dấu tiếng Việt để khớp từ khóa bất kể người chơi gõ có dấu
hay không. Bản cài đầu dùng `s.includes(tuKhoa)`. Bài test cổng phát hiện hai lỗi:

- "Thu vị thần đó về." không khớp mẫu `thu ve` vì hai từ không liền nhau;
- ngược lại, bỏ dấu xong thì "thứ" thành "thu", "khởi" thành "hoi", "thế" thành "the" —
  khớp chuỗi con báo nhầm liên tục.

**Quyết định.** Tách câu thành **từ**, rồi khớp mẫu là **dãy từ**. Mẫu hỗ trợ ký tự `*`
nghĩa là "cách vài từ cũng được" (giới hạn 6 từ), để bắt được `thu * ve`.
Mẫu nhiều từ thắng mẫu ít từ: câu càng khớp cụ thể thì càng đáng tin.

**Lý do.** Tiếng Việt sau khi bỏ dấu có rất nhiều từ đồng tự. Khớp theo từ loại bỏ gần
hết va chạm, và mẫu có khoảng nhảy xử lý được cấu trúc "động từ … bổ ngữ … tiểu từ" vốn
rất thường gặp.

**Hệ quả.** Bảng mồi giờ chứa mẫu chứ không chỉ chuỗi. Khi thêm động từ mới, phải nghĩ
theo dãy từ. Đây vẫn là **mồi**, không phải allowlist: câu không khớp mẫu nào vẫn tạo được
Intent và đi qua đường ứng biến của Phần 17.2.

---

## ADR-0017 — Tín hiệu Project lấy từ ví dụ của Phần 68.4, không lấy từ độ dài câu

**Ngày:** Phase 4
**Trạng thái:** đã áp dụng
**Ảnh hưởng luật game:** có

**Bối cảnh.** Ranh giới giữa "một hành động" và "một Project" quyết định thế giới có
trọng lượng hay không (Phần 68.1). Ban đầu chỉ có từ khóa xây/mở/lập, nên ba loại việc
rõ ràng dài hơi vẫn bị giải ngay trong một lượt:

- tranh đoạt domain (Phần 19.2 — hệ chiến đấu của tầng Thần, đi qua nhiều sự kiện);
- ký giao ước giữa hai thần hệ (Phần 68.4 nêu đúng ví dụ này);
- cải cách giáo lý, viết lại sử.

**Quyết định.** Tín hiệu Project bám theo **ví dụ đặc tả đưa ra**, không theo độ dài câu
hay số từ. Ba nhóm được bổ sung: tranh đoạt/đòi lại/trả thù, giao ước/liên minh/hòa giải,
và các việc đời người nhiều bước (cưới, gom góp, xin vào phường hội, trồng lại, tìm người).

**Lý do.** Phần 68.4 liệt kê chính xác ba ví dụ cho ba tầng, và cả ba đều phân rã thành
chuỗi bước. Dùng chúng làm chuẩn thì ranh giới có căn cứ trong đặc tả chứ không do cảm tính.

**Hệ quả.** `horizon` và `nenThanhProject()` là hai đường độc lập cùng dẫn tới Project:
một câu có thể thành Project vì nói rõ tầm nhìn dài ("suốt đời"), hoặc vì bản chất việc đó
nhiều bước. Phase 5 sẽ cho Project **tiến triển** theo tick; hiện tại chúng mới được mở ra.

---

## ADR-0018 — Handler tick nối dần, bước chưa nối vẫn khai đủ

**Ngày:** Phase 3
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 24.1 khóa thứ tự mười bốn bước và nói rõ đó là thứ tự **duy nhất**.
Nhưng nội dung của bước 2 (áp luật bốn tầng), 3 (utility AI), 5 (sổ nhân quả), 6 (kẻ thù),
9 (phân kỳ) thuộc Phase 5 và 6.

**Quyết định.** `MUOI_BON_BUOC` khai đủ mười bốn bước kèm cờ `canLlm`. Vòng lặp đi qua
đúng thứ tự đó; bước chưa nối handler thì không sinh patch. Phase 3 nối năm bước:
1 (thời gian), 7 (khái niệm), 10 (giáo lý sai lệch), 11 (quét lỗ hổng), 14 (chỉ số).

**Lý do.** Thứ tự là thứ [BB] khóa; nội dung từng bước thì đến theo phase. Khai đủ ngay
từ đầu giúp thứ tự không bao giờ bị sắp lại khi thêm bước, và bảng chẩn đoán hiện được
chính xác bước nào đang chạy thật.

**Hệ quả.** `motTick()` trả `buocBoQua` để test và bảng chẩn đoán biết bước nào bị bỏ vì
LLM tắt. Cuối Phase 6, mọi bước không cần LLM phải nối xong — đó là một mục trong cổng
Phase 6.

---

## ADR-0019 — Một tick là một MÙA; bốn tick là một năm

**Ngày:** Phase 5
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 24.2 cho bốn nhịp (`nhat` 1 ngày, `nien` 1 mùa, `the_dai` 10 năm,
`vinh_kiep` 100 năm) nhưng không nói tick _cơ sở_ của engine dài bao nhiêu. Mười hai tiến
trình của 71.2 thì cần biết: mùa màng, sinh tử và dịch bệnh đều tính theo một đơn vị.

**Quyết định.** Tick cơ sở = **một mùa**; `TICK_MOI_NAM = 4`. `world.year` được **suy** từ
tick (`Math.floor(tick / 4)`), không đếm riêng. Ba nhịp còn lại là hệ số gộp của catch-up
(`TICK_MOI_BUOC`), không phải đơn vị tick khác.

**Lý do.** 24.2 gọi `nien` là "tick thường, đủ 14 bước" — đó chính là định nghĩa của tick
cơ sở. Suy `year` từ tick thay vì đếm song song loại bỏ nguyên một lớp bug lịch lệch, và
làm bất biến `nam_khop_tick` viết được bằng một dòng.

**Hệ quả.** Nhịp `nhat` của tầng phàm nhân là đồng hồ **cảnh**, không phải đồng hồ world
process — Phase 7 phải nối nó qua đồng hồ Scene của 72.2, không phải bằng cách chia nhỏ tick.

---

## ADR-0020 — `knowledge` và `debts` là BẢNG, không phải trường trong aspect

**Ngày:** Phase 5
**Trạng thái:** đã áp dụng

**Bối cảnh.** Có thể nhét tri thức vào `aspects.van_hoa` và nợ vào `mortal.soHuu`. Rẻ hơn,
không phải đụng `WorldState`, `apPatch`, Dexie và migration.

**Quyết định.** Cả hai thành bảng cấp một: `state.knowledge`, `state.debts`; Dexie v4 với
compound key `[branchId+id]` như `entities`.

**Lý do.** Hai bất biến của 71.4 đòi **truy vấn ngược**:

- "tri thức không xuất hiện ở chủ thể nếu thiếu đường truyền" — phải tra được _ai biết
  trước, biết lúc nào, qua tuyến nào_. Nhét trong aspect thì phải quét toàn bộ entity
  mỗi lần kiểm, và không có khóa để nối dòng con về dòng cha.
- "nợ có hai đầu thật" — chủ nợ và con nợ thường ở hai vùng. Cất bản sao ở mỗi bên là
  mời gọi hai con số lệch nhau mà không ai phát hiện.

**Hệ quả.** `PHIEN_BAN_SCHEMA` lên 4. Migration v3→v4 **không** di chuyển dữ liệu (bảng
mới sinh ra rỗng) nhưng **có** gieo aspect nền cho `place` của save cũ — thiếu nó thì mười
hai tiến trình bỏ qua vùng đó trong im lặng và thế giới đứng hình mà không báo lỗi.

---

## ADR-0021 — Phase 5 thêm aspect ngoài bảng 4.2, và khóa bảng 4.2 bằng danh sách

**Ngày:** Phase 5
**Trạng thái:** đã áp dụng

**Bối cảnh.** Bảng 4.2 khai đúng mười hai aspect và cổng Phase 0 kiểm bằng
`expect(ASPECT_IDS).toHaveLength(12)`. Ma trận 72.4 lại đòi mỗi hệ nền có móc _State_ —
mà mười hai aspect ấy không chở nổi kho lương thực, trữ lượng rừng hay tỷ lệ mắc bệnh.

**Quyết định.** Tách hai danh sách: `ASPECT_IDS_42` (đóng, đúng bảng 4.2) và
`ASPECT_IDS_NEN` (bảy aspect nền của Phase 5). Test đổi từ **đếm** sang **so danh sách**.
Tương tự cho kind: `KIND_IDS_43` và `KIND_IDS_NEN` (`route`, `household`).

**Lý do.** Phần 4.2 mang dấu [MR] — mở rộng được — và chính đặc tả cũng thêm aspect ở
Phase 7 (70.1: `Embodied`, `SkillSet`, `Possession`, `Livelihood`, `CivicIdentity`). Nên
mười hai là danh sách **khởi đầu**, không phải trần. Nhưng nới cổng bằng cách sửa con số
12 thành 19 thì lần sau ai đó xóa nhầm `carrier` cũng không ai biết. So danh sách giữ
được đúng thứ đáng giữ: _bảng 4.2 không bị đổi_.

**Hệ quả.** Mọi phase sau thêm aspect phải thêm vào một danh sách nền có tên, kèm test
khẳng định nó không chồng lấn bảng gốc.

---

## ADR-0022 — Scheduler áp thử rồi hoàn tác, thay vì sao chép state

**Ngày:** Phase 5
**Trạng thái:** đã áp dụng

**Bối cảnh.** Tiến trình ở giai đoạn 2 phải đọc kết quả của giai đoạn 1, và 71.4 quy tắc 4
đòi chạy invariant _sau mỗi stage_. Nhưng [BB] luật bất biến #4 nói state chỉ đổi qua
Event → transaction. Scheduler không được commit.

**Quyết định.** Scheduler áp patch lên **chính** `WorldState` để các giai đoạn sau đọc
đúng, giữ `ThongTinHoanTac` của ADR-0011, rồi **hoàn tác toàn bộ theo thứ tự ngược** trước
khi trả về. Thứ đi ra là danh sách patch _đã được chứng minh an toàn_; tick gói chúng vào
Event và đi đường chính thức.

**Lý do.** `saoChepState()` mỗi tick là O(kích thước thế giới); chạy 400 tick cho một
trăm năm thì đó là 400 lần nhân bản cả thế giới. Hoàn tác chính xác là O(số bản ghi bị
chạm). Đo được: một trăm năm chạy ~0,7 s.

**Hệ quả.** Có một bài test riêng khẳng định `hashState` trước và sau `chayTienTrinhNen()`
bằng nhau. Nếu ai đó thêm đường ghi không qua `apPatch` vào scheduler, bài đó đỏ ngay.

---

## ADR-0023 — Chia giai đoạn theo SCC, và chia phần kho giữa các tiến trình cùng cụm

**Ngày:** Phase 5
**Trạng thái:** đã áp dụng

**Bối cảnh.** Bản đầu chia giai đoạn bằng Kahn; khi gặp chu trình thì **dồn toàn bộ nút
còn lại** vào một giai đoạn. Hệ quả: `production_consumption`, `exchange_debt` và
`institution_governance` rơi chung một giai đoạn dù hai cái sau chỉ _đứng sau_ chu trình
chứ không nằm trong nó. Cả ba tính phần mình từ cùng một ảnh chụp, mỗi bên tưởng kho còn
đầy, cộng lại thì kho âm — bài test một trăm năm bắt được mười sáu lần trong 400 tick.

**Quyết định.** Hai việc:

1. Chia giai đoạn bằng **Tarjan SCC + đồ thị rút gọn**. Chỉ tiến trình _thật sự nằm trong
   một vòng_ mới dùng chung ảnh chụp; tiến trình đứng sau vòng được giai đoạn riêng.
2. Ba tiến trình cùng rút kho khai phần của mình ở một chỗ: `PHAN_KHO`
   (`an` 0,75 · `traoDoi` 0,10 · `thue` 0,10). `phanKhoHopLe()` và một bài test khẳng định
   tổng nhỏ hơn 1.

**Lý do.** Việc 1 là sửa lỗi: dồn thừa vào một giai đoạn _tạo ra_ đúng cái bug mà quy tắc
4 phải đi dọn. Việc 2 là vì cụm phụ thuộc vòng thật của thế giới này có **mười** tiến
trình — trong một mùa thì dân số, lương thực, bệnh, chiến sự và tri thức quyết định lẫn
nhau, và không có cách chia stage nào tách được chúng. Với cụm ấy, chia phần trước là
cách duy nhất để hai bên cùng rút mà không âm.

Phần kho không ai được đụng tới cũng đúng về mặt thế giới: đó là **thóc giống**. Ăn vào
nó là dấu hiệu của nạn đói thật, không phải của một mùa kém.

**Hệ quả.** Khai `reads`/`writes` phải **hẹp và đúng**. Khai rộng (`aspects.kinh_te.kho`
trong khi chỉ chạm `kho.vatLieu`) kéo tiến trình vào cụm không cần thiết, và cụm càng to
thì càng nhiều tiến trình phải đọc ảnh chụp cũ. Trong lần rà này đã sửa bốn khai báo rộng
quá mức và một khai báo **thiếu** (`exchange_debt` ghi `an_ninh.deDoa` mà không khai —
scheduler vì thế thiếu một cạnh về `conflict_security`).

---

## ADR-0024 — Dị Hóa sinh ÁP LỰC, không sinh phép gán

**Ngày:** Phase 6
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 12.2 viết công thức kéo `soul.banTinh` về phía
`venerable.banTinhTinDoTin` "cuối mỗi kỷ nguyên". Cài đúng chữ đó thì **tick âm thầm sửa
tính cách nhân vật của người chơi**. Phần 69.1 sửa lại và nói thẳng: "Không tick nào tự
sửa tính cách lõi mà không có Event giải thích."

**Quyết định.** Tách bốn lớp (`coreSelf`, `followerImage`, `officialDoctrine`,
`currentManifestation`) trong aspect `ban_nga`. Tiến trình `divine_alienation` **chỉ** đẩy
`followerImage`, đo khoảng cách và **mở một tình huống**. Lõi chỉ đổi qua `dapDiHoa()`,
hàm duy nhất được phép, và nó luôn ghi kèm một dòng `lichSuLoi` có `eventId`.

**Lý do.** Bi kịch của 12.2 — "bạn trở thành thứ người ta tưởng bạn là" — vẫn còn nguyên,
nhưng người chơi phải **đồng ý từng bước**, và mỗi bước có tên trong sổ. Khác biệt giữa
một bi kịch và một cái bug nằm đúng ở chỗ ấy.

**Hệ quả.** `coreSelf` không nằm trong `writes` của `divine_alienation`. Bất biến
`coreself_co_giai_thich` so `coreSelf` với `soul.banTinh` và bắt mọi đường ghi chỉ chạm
một bên.

---

## ADR-0025 — Khoảng cách bản ngã đo bằng TRỤC LỆCH NHẤT

**Ngày:** Phase 6
**Trạng thái:** đã áp dụng

**Bối cảnh.** Bản đầu chuẩn hóa khoảng cách hai vector bản tính theo cạnh huyền sáu chiều
(`√Σd² / √(6·200²)`). Chạy thật thì Dị Hóa **không bao giờ** kích hoạt: một vị thần từ bi
bị tin là tàn nhẫn cho ra "lệch 16", dưới ngưỡng `nguongDiHoa = 40`.

**Quyết định.** Đo bằng `max|a−b| / 200 × 100`.

**Lý do.** Đây là chuyện ngữ nghĩa, không phải toán. Bị tin là tàn nhẫn trong khi mình
từ bi là **xuyên tạc toàn phần**, dù năm trục còn lại khớp hoàn hảo. Chia con số ấy cho
√6 biến một vụ đánh tráo danh tính thành một sai số nhỏ.

**Hệ quả.** Chỉ đo được khi chạy, không khi đọc lại công thức — bài test một trăm năm là
chỗ nó lộ ra.

---

## ADR-0026 — Khổ ĐẨY hình ảnh tín đồ, không kéo nó về một mốc

**Ngày:** Phase 6
**Trạng thái:** đã áp dụng

**Bối cảnh.** Bản đầu cho `followerImage` tiệm cận một mốc tính từ mức khổ
(`tuBi_tanNhan: apLucSong × 70`). Hệ quả quan sát được: một vị thần **đã** bị tin là tàn
nhẫn ở mức 52 gặp nạn đói (mốc 35) thì hình ảnh **dịu đi**.

**Quyết định.** Khổ cộng dồn vào hình ảnh (`anh += apLucSong × 1.2 × soBuoc`, kẹp ±100).
Thời yên thì hình ảnh nguội **về phía `coreSelf`**, rất chậm (1% mỗi lần chạy).

**Lý do.** Chịu khổ càng lâu, người ta càng kể về một vị thần khắc nghiệt hơn — đó là
chiều đúng. Và nó không được là bánh cóc một chiều: khi yên trở lại, không ai còn lý do
dựng chuyện, nên ký ức tập thể trôi về phía sự thật.

**Hệ quả.** Hai chiều này làm `doLechDiHoa` trở thành một đại lượng **có nhịp**, không
phải một con số chỉ tăng — và Bảng Lãnh Địa (56.4) hiện đúng nhịp ấy cho người chơi thấy.

---

## ADR-0027 — `tokens.css` chỉnh về đúng bảng 36.2

**Ngày:** Phase 6
**Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 36.2 mang dấu [BB] và cho **giá trị hex cụ thể**. Bản Phase 3 dùng tên
khác và màu bão hòa cao hơn hẳn (`--mau-dong: #c8964f` so với `--dong: #9B8A6B`), vi phạm
luật cấm số 4 của 36.1 ("màu ít bão hòa, tương phản thấp").

**Quyết định.** Lấy đúng bảng 36.2 làm nguồn chân lý; giữ tên cũ (`--mau-dong`, `--nen-0`,
`--chu-1`…) làm **bí danh** trỏ vào token mới.

**Lý do.** Đổi thẳng tên sẽ làm vỡ mọi component Phase 3 trong một lần commit. Bí danh cho
phép màu đúng ngay lập tức, và component chuyển dần sang tên chuẩn khi được viết lại.

**Hệ quả.** Ba font của 36.3 mới khai `font-family` với fallback hệ thống. Nhúng bản thật
(có đủ dấu tiếng Việt) là việc của Phase 11 — tải từ CDN sẽ phá cổng "chạy offline" của
Phase 3.

---

## ADR-0028 — Không có AI thì không chơi

**Ngày:** Phase 6 (đóng nợ) · **Trạng thái:** đã áp dụng
**Thay thế:** dòng "endpoint chết vẫn chơi được" của cổng Phase 8; chế độ `chi_engine` của 46.2

**Bối cảnh.** Đặc tả v3.1 thiết kế AI như một **lớp phủ**: engine chạy đủ không LLM, và
46.2 gọi `chi_engine` là "chế độ chơi hợp lệ". Cổng Phase 8 chốt lại bằng một dòng rất
rõ: _"endpoint chết vẫn chơi được"_.

Chủ dự án quyết định ngược lại: **Thiên Diễn chỉ chơi được khi có AI, và mọi thứ phục vụ
cho AI.**

**Quyết định.**

1. `core/ai/cong.ts` là máy trạng thái thuần quyết định cửa vào. `choPhepChoi = false` thì
   không hành động chơi nào chạy — nhập câu, tick, trả lời cầu, đáp Dị Hóa, đổi tầng, mở
   thế giới mới.
2. Cổng AI là màn **đầu tiên**, đứng trước Khởi Nguyên (`App.tsx`).
3. Mọi lượt chơi đi qua Narrator. Lời kể của engine không còn ra thẳng khung kể; nó thành
   `ketQuaEngine` trong prompt, và thứ người chơi đọc là văn của model.
4. Ngắt mạch ba lần hỏng liên tiếp thì đóng cổng, **không** rơi về văn engine.

**Vì sao đổi hướng này chấp nhận được — và ranh giới không đổi.**

Điều đặc tả thật sự bảo vệ không phải "chơi được khi mất mạng", mà là [BB] 71.5 —
**LLM không giữ sổ**. Ranh giới ấy giữ nguyên và còn được siết thêm:

- engine vẫn quyết mọi con số, và test một trăm năm vẫn chạy **không LLM** ở tầng `core/`;
- `bocTach()` mặc định TỪ CHỐI: model chỉ chạm được bốn bảng, không chạm `worlds`, không
  chạm `coreSelf`, `domain.domains`, `lawful.vanBan`, và tối đa 12 patch một lượt;
- prompt dựng từ `WorldView` chứ không từ `World` (33.3), nên AI bắt buộc không thể kể
  thứ tầng đang chơi không được biết.

Nói gọn: AI trở thành **bắt buộc**, nhưng không trở thành **có thẩm quyền**.

**Cái giá, ghi rõ để không ai ngạc nhiên sau.**

- Không chơi được offline. Đây là mất mát thật so với đặc tả, và nó là mất mát có chủ ý.
- Mỗi lượt tốn tiền. Tua ba mươi nhịp là một lời gọi, không phải ba mươi — nhưng vẫn là một.
- Mất mạng giữa chừng thì **thế giới còn nguyên** và lượt ấy không có lời kể. Cổng nói
  thẳng điều đó thay vì lặng lẽ đưa ra câu engine và giả vờ AI vẫn chạy.
- `cheDoKhiTat = 'chi_engine'` vẫn còn trong schema để save cũ parse được, nhưng nó chỉ
  còn nói về điểm cuối _Cập Nhật Biến_. Điểm cuối _Tường Thuật_ không có chế độ tắt.

**Hệ quả kỹ thuật.** Dexie v6 thêm bảng `aiConfigs` (khóa theo MÁY, không theo nhánh).
`proxyPassword` đã có sẵn trong `KHOA_SECRET` nên không đi vào bản xuất. Trạng thái ngắt
mạch nằm ở store chứ **không** nằm trong `WorldState`: sự cố mạng không phải sự kiện của
thế giới, và nhét nó vào state sẽ làm hash đổi theo chất lượng wifi — vỡ cổng Phase 1.

---

## ADR-0029 — Bộ chọn chủ thể đọc thế giới thật, không đọc `WorldView`

**Ngày:** Phase 6 (đóng nợ) · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phase 6 đóng lại kèm một giới hạn được ghi thẳng vào tài liệu: bấm "Thần"
trong trình duyệt có lần vào đúng tầng Thần, có lần rơi xuống Phàm Nhân. Nguyên nhân không
ở React. `doiHienDien()` chọn "entity `deity` **đầu tiên trong `view`**", mà `view` là kết
quả của `chieu()` — tập entity thấy được **đổi theo tầng đang đứng**. Đứng ở Phàm Nhân thì
phần lớn thần chỉ còn ở mức tin đồn hoặc bị lọc mất, nên "đầu tiên" hôm nay và "đầu tiên"
hôm qua là hai người khác nhau, và có lúc là không ai cả.

**Quyết định.** `core/than/chuThe.ts` xếp hạng ứng viên trên `WorldState`, theo luật ổn
định (đang nhập → do người chơi tạo → có chỗ đứng trong thế giới → id). UI **hỏi** khi có
nhiều hơn một ứng viên, và báo lỗi tử tế khi không có ai.

**Lý do.** Chọn chủ thể là một quyết định về **thế giới**, không về **tầm nhìn**. Không
có rò rỉ ở đây: danh sách chỉ gồm entity người chơi hợp lệ nhập vào, và nhập vai là hành
động đổi tầm nhìn chứ không phải hành động đọc lén.

**Hệ quả.** `tangKhaDung()` cho UI làm mờ nút trước khi bấm thay vì báo lỗi sau khi bấm.

---

## ADR-0030 — Hóa thân hạ `chieu()`, không hạ danh tính

**Ngày:** Phase 6 (đóng nợ) · **Trạng thái:** đã áp dụng

**Bối cảnh.** 19.4 nói "khi hóa thân, `chieu()` của thần tụt xuống mức phàm nhân". Phase 6
mới có `AvatarSchema` và ràng buộc; `chieu()` chưa đọc nó. Hóa thân vì thế là một lựa chọn
không có hậu quả nào.

**Quyết định.** `WorldView` thêm hai trường: `mucChieu` (tầng dùng để LỌC) và `dangHoaThan`.
`mode` vẫn là tầng người chơi đứng. Thần đang hóa thân chưa thức tỉnh có
`mode = 'than'`, `mucChieu = 'pham_nhan'`; vị trí và quan hệ lấy theo **thân xác** đang mượn.

**Lý do.** Hạ phàm là mất tầm nhìn, không mất danh tính. Ép `mode = 'pham_nhan'` sẽ làm UI
tự xưng sai và làm mọi thao tác tầng Thần biến mất giữa chừng.

**Hệ quả.** `visibilityHash` băm `mucChieu` và `dangHoaThan`, nên cache rerank cũ vô hiệu
đúng lúc tầm nhìn đổi (77.8).

---

## ADR-0031 — Lịch là hàm thuần, không phải thứ được mô phỏng

**Ngày:** Phase 7 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Cổng Phase 7 đòi _"NPC ngoài cảnh giữ lịch và vị trí"_. Cách hiển
nhiên là mô phỏng từng người từng nhịp và lưu vị trí vào state. Với vài nghìn dân
thì nó vỡ benchmark "một trăm năm dưới mười giây" của cổng Phase 5, và với tua
một kỷ nguyên thì nó không bao giờ về.

**Quyết định.** `pham/lich.ts` không lưu gì cả. `lichCua()` và `dangODau()` là
hàm thuần của `WorldState`: nghề, tuổi, thân thể, hộ, nơi ở. Hỏi lúc nào cũng ra
cùng câu trả lời, và câu trả lời đổi khi hoàn cảnh đổi.

**Lý do.** Vị trí của một nông dân lúc giữa buổi không phải một sự kiện cần ghi;
nó là **hệ quả** của việc họ có ruộng và còn đi được. Lưu nó là lưu một thứ suy
ra được, và mọi thứ suy ra được mà đem lưu thì sớm muộn cũng lệch khỏi nguồn.

**Hệ quả.** Một NPC không ai nhìn suốt bốn mươi năm vẫn "đang ở ngoài ruộng lúc
này" mà không tốn một phép tính nào. `aiDangO()` cũng thành hàm thuần, nên
"ai đứng đủ gần để nghe lỏm" (70.4) suy được thay vì phải tung xúc xắc.

Đánh đổi: không mô phỏng được lịch **bất thường** (hôm nay Ankhtu bỏ ruộng đi
chợ) trừ khi nó được ghi thành một Event. Đó là đúng thứ tự: chuyện bất thường
mới đáng ghi.

---

## ADR-0032 — Nới rộng `mortal.thanThe` thay vì dựng aspect `than_the` song song

**Ngày:** Phase 7 · **Trạng thái:** đã áp dụng

**Bối cảnh.** 70.5 đòi thân thể có thương tích với vị trí, nguyên nhân, người
chăm, biến chứng và di chứng. `mortal.thanThe` của Phase 0 chỉ có ba con số.
Cách gọn là thêm một aspect `than_the` đầy đủ và để `mortal.thanThe` làm bản tóm.

**Quyết định.** Nới rộng `MortalSchema.thanThe` tại chỗ. Không có aspect thứ hai.

**Lý do.** Đây đúng là bài học của `coreSelf` (ADR-0025, 69.1): cùng một sự thật
ghi ở hai chỗ thì sẽ có đúng một đường ghi chỉ chạm một bên, và nó lệch âm thầm.
Phase 6 đã trả giá một lần cho điều đó; không có lý do trả lần nữa.

**Hệ quả.** Trường mới đều có `prefault`, nên save Phase 5–6 parse nguyên vẹn.
Bất biến `than_the_hop_le` cưỡng chế `dau` phải suy được từ những vết còn mở —
một bộ đếm đau trôi tự do là cách êm ái nhất để "sức khỏe không phải thanh máu"
lặng lẽ quay lại thành thanh máu.

---

## ADR-0033 — Quan hệ một chiều cất trong hồn của chính chủ thể

**Ngày:** Phase 7 · **Trạng thái:** đã áp dụng

**Bối cảnh.** 11.2 [BB] đòi quan hệ **bất đối xứng**: "hai record riêng, không
đồng bộ". `RelationStateSchema` có từ Phase 0 nhưng chưa có nơi lưu; ma trận
schema đặt chỗ cho một bảng `relations` khóa `[branchId+tuId+denId]`.

**Quyết định.** Không dựng bảng. Thêm `soul.quanHe: Record<id, QuanHeMotChieu>` —
điều CHỦ THỂ NÀY nghĩ về từng người khác, cất trong hồn của chính họ.

**Lý do.** Cưỡng chế 11.2 ở mức **cấu trúc**: không có chỗ nào để viết một quan
hệ "chung" cho cả hai, nên không ai vô tình đồng bộ chúng. Một bảng hai đầu thì
ngược lại — nó mời gọi đúng cái hàm `datQuanHe(a, b, x)` ghi cả hai chiều.

`QuanHeMotChieuSchema` khác `RelationStateSchema` đúng một chỗ: không có
`tuId`/`denId`, nên **mọi trường đều có prefault**. Đó là điều kiện bắt buộc để
một patch chỉ chạm `anTuong` vẫn cho ra bản ghi hợp lệ — nếu không, pha 2 của
`apDungPatch` từ chối cả lô.

**Hệ quả.** Mọi thay đổi quan hệ đi qua `pham/quanHe.ts`: đọc bản cũ, gộp, phát
**một** `set` với object đã parse. Viết `add` thẳng lên
`aspects.soul.quanHe.<id>.tinNgo` hỏng theo hai cách cùng lúc, nên nó không được
là đường đi.

---

## ADR-0034 — "Tin không teleport" nghĩa là không teleport, không phải "phải đi trên đường"

**Ngày:** Phase 7 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bất biến `khong_tri_thuc_teleport` viết ở Phase 5, khi `knowerId`
luôn là một **vùng** và tin chỉ đi giữa các vùng qua `route`. Phase 7 thêm đối
thoại mặt đối mặt (70.4): nguồn và người biết là hai **con người** trong cùng một
làng. Giữa họ không có tuyến đường nào, và bất biến đỏ ngay ở bài playtest đầu.

**Quyết định.** Trước khi đòi tuyến đường, kiểm xem hai bên có đang ở **cùng một
nơi** không. Cùng nơi thì bỏ qua phép kiểm quãng đường.

**Lý do.** Luật thật sự là "tin không xuất hiện ở chủ thể nếu thiếu đường truyền".
Hai người nói chuyện trong cùng một làng **có** đường truyền — đó là cái miệng.
Đòi thêm một `route` giữa họ là đọc chữ mà bỏ nghĩa.

**Hệ quả.** Ba phép kiểm còn lại giữ nguyên và vẫn là phần đắt nhất của bất biến:
nguồn phải thật sự biết, nguồn phải biết **trước**, và tin qua nhiều vùng vẫn
phải trả đủ số nhịp của tuyến.

Cùng lúc, `pham/doiThoai.ts` phải ghi thêm một dòng tri thức cho **người nói**
(`witness`, `hops = 0`) trước khi ghi dòng của người nghe. Bỏ bước ấy thì người
nghe khai nguồn là người nói, trong khi người nói không hề biết mệnh đề — và đó
chính là lỗi mà bất biến bắt được. Nó cũng làm nói dối thành dữ liệu đầy đủ: bên
nói giữ `dieuNguoiNoiTin`, bên nghe giữ `dieuMuonNguoiNgheTin`, cùng một `factId`.

---

## ADR-0035 — Kỹ năng đọc theo TÊN NGHỀ, không theo một khóa cố định

**Ngày:** Phase 7 · **Trạng thái:** đã áp dụng

**Bối cảnh.** `mortal.kyNang` là `Record<string, number>` tự do, và thế giới đang
có hai quy ước cùng lúc: fixture đặt tên theo nghề (`dan_luoi: 62`), còn
`vatChatHoa()` của Phase 5 đặt `nghe_chinh`. Bản đầu của `sinhKe.ts` đọc cứng
`kyNang['nghe_chinh']`.

**Quyết định.** `kyNangCuaNghe(m, ngheId)` trả về **cả khóa lẫn giá trị**: thử
tên nghề (bỏ tiền tố `nghe_`), rồi `nghe_chinh`, rồi kỹ năng cao nhất đang có.
Mọi phép ghi dùng lại đúng khóa vừa đọc.

**Lý do.** Đọc cứng một khóa làm một nửa dân số có tay nghề bằng 0 trong khi bậc
của họ là "thợ cả" — và **không ai thấy**, vì cả hai con số đều tồn tại và đều
hợp lệ. Nó lộ ra khi một bài test đòi "làm sáu nhịp thì kỹ năng phải tăng" và
con số vẫn đứng ở 0.

**Hệ quả.** Không sinh thêm quy ước thứ ba. Đổi nghề giữ tay nghề của nghề cũ ở
đúng khóa của nghề cũ, nên "quay lại nghề cũ sau mười năm" nhanh hơn học lại từ
đầu — đó là lý do `ngheDaTung` tồn tại.

---

## ADR-0036 — `storylines` và `foreshadows` là BẢNG, không phải aspect

**Ngày:** Phase 8 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phần 28.1 nói lý do Mạch Truyện tồn tại: "nếu câu chuyện chỉ tồn
tại trong lịch sử chat, thì khi người chơi đi chỗ khác, câu chuyện biến mất."
Nhưng đặc tả không nói nó **nằm ở đâu** trong mô hình dữ liệu, và mô hình
Entity–Aspect của Phần 4 luôn cám dỗ ta nhét mọi thứ vào một aspect.

**Quyết định.** Hai bảng mới ở `WorldState`, Dexie v7, copy-on-write theo
`[branchId+id]` — cùng khuôn với `knowledge`/`debts` (ADR-0020) và `prayers`.
`PHIEN_BAN_SCHEMA` lên 6.

**Lý do.** Một mạch truyện có **nhiều nhân vật**, và nhân vật vào ra giữa chừng.
Cất nó trong aspect của một entity là chọn sẵn một nhân vật làm chủ — đúng cái
bệnh lấy người chơi làm tâm mà 28.6 tồn tại để chống. Phục bút còn rõ hơn: nó có
thể **không thuộc mạch nào** (`machId = null`), nên nó không có chủ để mà gắn.

**Hệ quả.** Ba bảng mới sinh ra RỖNG nên không cần migration dữ liệu; save cũ mở
ra với ba Map rỗng và `quetMachTruyen()` dựng lại mạch từ chính world state ở
nhịp kế. Đó là điểm mạnh của việc tiền đề được **dò** chứ không được **lưu**
(xem ADR-0037). `hashState()` băm cả hai bảng, nên determinism vẫn kiểm được.

---

## ADR-0037 — Giữ id loại mạch của Phase 0, dùng tiền đề của 28.3

**Ngày:** Phase 8 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phase 0 đã đăng ký tám `storyKind` với id riêng (`bao_thu`,
`troi_day`, `di_cu`, `phat_kien`, `tranh_domain`, `doi_thuong`, `ke_vi`,
`ly_giao`). Bảng 28.3 [MR] liệt kê mười id, trong đó `phuc_thu` và `cuu_the`
trùng ý niệm với `bao_thu` và `troi_day` nhưng khác chữ.

**Quyết định.** Không đổi tên id cũ. Thêm sáu id còn thiếu (`chien_tranh`,
`am_muu`, `tinh_ai`, `kham_pha`, `suy_tan`, `phan_boi`) → tổng **mười bốn** loại.
`bao_thu` và `troi_day` cài **đúng tiền đề** mà 28.3 mô tả cho `phuc_thu` và
`cuu_the`.

**Lý do.** Id registry là khóa dữ liệu: nó đi vào `Storyline.loai`, vào
`handlerId` của manifest, và sẽ đi vào save. Đổi tên để khớp một bảng [MR] là
đổi khóa dữ liệu để khớp một **gợi ý** — đúng thứ tự ưu tiên nhãn nói không nên
làm. Điều quan trọng là tiền đề, và tiền đề thì được cài đúng.

**Hệ quả.** `docs/TRACEABILITY.md` phải ghi ánh xạ hai chiều, nếu không người
đọc 28.3 sẽ đi tìm `phuc_thu` và kết luận là thiếu.

---

## ADR-0038 — `suy_tan` đọc trạng thái cuối, không đọc xu hướng ba kỷ nguyên

**Ngày:** Phase 8 · **Trạng thái:** đã áp dụng, có nợ

**Bối cảnh.** 28.3 định nghĩa tiền đề `suy_tan` là "một thần `domainStrength`
giảm liên tục 3 kỷ nguyên". `DomainStateSchema` (Phase 6) không lưu lịch sử
`suc` theo kỷ nguyên — nó chỉ có giá trị hiện tại và `tickDoiTrangThai`.

**Quyết định.** Tiền đề đọc **trạng thái cuối của cùng một đường suy**: `suc ≤ 25`
hoặc `trangThai` đã rời khỏi `held`/`contested`. Không thêm trường lịch sử.

**Lý do.** Thêm một mảng `lichSu` vào `DomainState` là thêm một chỗ có thể lệch
với `suc` — đúng bài học của `coreSelf` ở 69.1 và của ADR-0032. Và mạch truyện
chỉ cần biết "thần này đang tàn", không cần biết nó tàn theo đường nào.

**Nợ đã ghi.** Tiền đề hiện **bắt cả** trường hợp một thần vừa mất domain trong
một kỷ nguyên duy nhất — nhanh hơn "ba kỷ nguyên" mà 28.3 mô tả. Khi Phase 10
thêm nén biên niên theo kỷ nguyên, xu hướng có thể đọc từ đó thay vì từ aspect.

---

## ADR-0039 — Đưa `links` và `machTruyen` vào `WorldView`

**Ngày:** Phase 8 · **Trạng thái:** đã áp dụng

**Bối cảnh.** 6.4 bắt `moRong()` nhận `view` và **lọc bỏ mọi entity mà view không
cho phép chủ thể biết**. 33.2 nhắc lại bằng chữ in đậm. Nhưng `WorldView` của
Phase 1 không mang cạnh đồ thị, nên `moRong()` không có gì để đi.

**Quyết định.** `WorldView` thêm hai trường: `links` (chỉ cạnh có **cả hai đầu**
nằm trong `entities`) và `machTruyen` (chỉ mạch chủ thể được biết, hoặc mạch có
chính chủ thể là nhân vật, hoặc mọi mạch khi ở tầng Sáng Thế).

**Lý do.** Đây là cách biến một quy tắc quy trình thành ràng buộc kiểu dữ liệu.
`moRong()` chỉ nhận `WorldView` — **không có** phiên bản nhận `WorldState` để mà
gọi nhầm — và cạnh cấm đơn giản không tồn tại trong thứ nó đọc được. Cùng lẽ ấy,
`ChunkDaChieu` không có trường `noiDung` gốc: 77.3 nói "không truyền `noiDung`
gốc rồi yêu cầu reranker đừng dùng", nên ở đây thì không có gì để yêu cầu.

**Hệ quả.** `visibilityHash` không đổi công thức: hai trường mới đều **suy ra**
từ tập entity đã lọc, nên chúng không mang thêm thông tin về tầm nhìn.

---

## ADR-0040 — Nhịp truyện đổi thế giới qua KÝ ỨC và CẢM XÚC, không qua vật chất

**Ngày:** Phase 8 (vòng siết) · **Trạng thái:** đã áp dụng

**Bối cảnh.** 28.5 nói nhịp truyện "áp `bienDoiTrangThai` vào world (engine)".
Bản Phase 8 đầu chỉ đổi `cangThang`, `giaiDoan`, nút thắt và phục bút — tức mạch
truyện là một lớp tự sự chạy **song song** thế giới chứ không tác động lên nó.
Nhưng đặc tả không nói nhịp được ghi vào ĐÂU, và mười hai tiến trình nền của
71.2 đã sở hữu toàn bộ phần vật chất.

**Quyết định.** `BienDoiTuSu` có đúng hai dạng: `ky_uc` (đẩy vào `soul.kyUc`) và
`cam_xuc` (đẩy vào `soul.tamTrang`). Cả hai chỉ dùng `push`. Không dạng nào chạm
kho, dân số, thương vong hay tài sản. Chỉ hai giai đoạn để lại dấu: `cao_trao`
và `ha_man`.

**Lý do.** Ba lớp, xếp theo mức nghiêm trọng:

1. **Hai đường ghi cho một sự thật thì chúng sẽ lệch.** Một mạch `chien_tranh`
   trừ dân số bên cạnh `conflict_security` sẽ trừ hai lần, và không ai thấy vì
   cả hai đều hợp lệ. Đây đúng là bài học của `coreSelf` (69.1) và ADR-0032.
2. **`set` đụng `set` mỗi tick.** 71.4 quy tắc 1 gộp được `add`/`push`, còn `set`
   thì cần priority manifest. `soul.kyUc` và `soul.tamTrang` không tiến trình
   nào khai `ghi`, nên scheduler không bao giờ phải phân xử ở đây.
3. **Đó mới là thứ tầng tự sự thật sự sở hữu.** Utility AI (23) đọc `tamTrang`;
   `soul.kyUc` thành chunk `ky_uc_thuc_the` cho truy hồi (54.2). Nghĩa là một
   nhịp truyện đổi cách nhân vật hành động ở nhịp sau, và đổi cả thứ Narrator
   nhớ được — mà không dời một hạt thóc nào.

**Hệ quả.** Ký ức có trần 24 mảnh mỗi người, cảm xúc trần 8. Không có trần thì
sau một trăm năm chỉ mục truy hồi phình lên và MMR phải làm việc của bộ lọc rác.
Mười ba loại mạch mang mười ba cảm xúc khác nhau — đó là chỗ "mạch truyện đa
dạng" của 28.3 hiện ra trong **dữ liệu**, không chỉ trong câu chữ.

---

## ADR-0041 — Kỷ nguyên là phép chia trên tick, không phải một bộ đếm được lưu

**Ngày:** Phase 8 (vòng siết) · **Trạng thái:** đã áp dụng

**Bối cảnh.** 30.3 nói phép nén chạy "cuối mỗi kỷ nguyên", nhưng trước Phase 8
engine không có mốc kỷ nguyên nào: `world.eraId` được đặt một lần lúc khai thiên
rồi đứng yên mãi mãi. Phép nén vì thế không có chỗ để chạy.

**Quyết định.** `kyNguyenCua(tick, tickMoiKyNguyen) = floor(tick / n)` với
`n = tuning.truyen.tickMoiKyNguyen` (mặc định 200 tick = 50 năm). Tiến trình
`storyline_beat` nhận mốc, chạy `nenCuoiKyNguyen()` và đặt `world.eraId`.

**Lý do.** Một bộ đếm được lưu sẽ lệch sau mỗi lần fork nhánh hoặc replay —
nhánh con kế thừa số đếm của cha rồi hai bên cùng tăng, và hai nhánh cùng gốc
cho hai `eraId` khác nhau ở cùng một tick. Phép chia thì không: nó là hàm thuần
của `tick`, nên nó replay được và fork được mà không cần ai đồng bộ gì.

**Hệ quả.** `Storyline.nhipGanDay` là bộ đệm văn chưa nén, trần 12. Nén xong thì
bộ đệm được dọn — phần đáng giữ đã nằm trong `kyUcMach` theo bốn khối bất khả
xâm phạm của 30.3, phần còn lại là thứ 30.3 cho phép mất. Biên niên sử thật vẫn
nằm ở Event log, không nằm ở bộ đệm này.

---

## ADR-0042 — Bộ đánh giá retrieval tự nhãn từ luật chống rò rỉ

**Ngày:** Phase 8 (vòng siết) · **Trạng thái:** đã áp dụng

**Bối cảnh.** 77.10 đòi `relevantChunkIds` và `forbiddenChunkIds`, tức đòi nhãn.
Nhãn viết tay chỉ đúng cho đúng một thế giới, nên nút "Chạy bộ đánh giá" của
77.11 sẽ vô nghĩa với mọi ván chơi khác — mà đó chính là những ván cần đo nhất.

**Quyết định.** `boDeTuTheGioi(state)` dựng bộ đề từ ba luật tuyệt đối của 18.2:
văn bản luật gốc cấm với phàm nhân trong khi diễn giải vùng họ là đúng; bản tính
thật của thần cấm trong khi `banTinhTinDoTin` là đúng; kẽ hở chưa ai khai thác
cấm với cả tầng Thần. Bài thi chạy qua **đúng** `truyHoi()` của lượt chơi.

**Lý do.** Thế giới đã tự khai nhãn rồi, chỉ là ở chỗ khác. Đọc nhãn từ luật
chống rò rỉ có ba cái lợi cùng lúc: không ai phải gán tay, mọi thế giới đều đo
được, và bài thi đo đúng **thứ quan trọng nhất** — `forbidden recall`, cái mà
54.3 gọi là "hỏng nặng".

**Hệ quả.** Fixture `src/test/fixtures/retrievalEval.ts` vẫn còn và vẫn dùng cho
test đơn vị; nó không còn là nguồn duy nhất. Nút "Chạy bộ đánh giá" nằm ở panel
Ống Kính chứ không ở tab Truy hồi như 77.11 mô tả, vì màn Cổng AI đứng **trước**
Khởi Nguyên nên ở đó chưa có thế giới nào để dựng đề.

---

## ADR-0043 — SHA-256 viết tay trong `core/`, không dùng WebCrypto

**Ngày:** Phase 9 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bước 3 của pipeline nhập (63.1) cần SHA-256 để nhận diện file và
để phát hiện bản đã nhập. Đặc tả 66.3/66.4 ghi hash của hai fixture bằng SHA-256
chữ hoa, nên một hàm băm khác sẽ không bao giờ khớp con số ấy. `bam()` sẵn có ở
`engine/hash.ts` là FNV-1a — dùng cho hash trạng thái nội bộ, không dùng để nhận
diện file người dùng.

**Quyết định.** Viết SHA-256 thuần TypeScript ở `core/preset/sha256.ts`, kèm
`utf8Bytes()` tự cài thay vì `TextEncoder`.

**Lý do.** `crypto.subtle.digest` **bất đồng bộ** và không có mặt trong mọi ngữ
cảnh (`file://`, vài WebView, Node cũ). Bước 3 nằm giữa một chuỗi kiểm đồng bộ,
và luật bất biến #3 cấm `core/` phụ thuộc API trình duyệt. Toàn bộ phép tính là
số học 32-bit nên kết quả giống nhau trên mọi engine.

**Hệ quả.** Test đối chiếu trực tiếp với `node:crypto` trên năm chuỗi mẫu và
một vector NIST. Đây là chỗ **duy nhất** trong repo cần SHA-256 thật; mọi hash
nội bộ khác vẫn dùng `bam()`.

---

## ADR-0044 — Fixture ẩn danh có hash khác file gốc, và điều đó là cố ý

**Ngày:** Phase 9 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Cổng Phase 9 đòi "hai fixture đúng hash". ADR-0007 đã quyết chỉ
đưa **bản cấu trúc đã ẩn danh** vào repo vì lý do bản quyền. Hai điều này va nhau:
băm bản ẩn danh không bao giờ ra con số của 66.3.

**Quyết định.** `fixture-X.meta.json` giữ `sourceSha256` của **file gốc**; test
kiểm ba việc riêng biệt thay vì gộp làm một:

1. `sha256()` đúng — đối chiếu `node:crypto` và vector NIST;
2. hash pipeline tính ra **bằng đúng** hash của bytes nó vừa nhận;
3. hash file gốc trong meta khớp định dạng và **khác** hash bản ẩn danh.

**Lý do.** Cổng thật sự muốn chứng minh hai điều: hàm băm đúng, và pipeline băm
đúng thứ nó nhận. Ép một con số của file không có trong repo là kiểm một thứ
không kiểm được, và cách duy nhất để "đạt" nó là hardcode — tức là không kiểm gì.

**Hệ quả.** Ai có hai file gốc chạy lại `tools/make-preset-fixture.mjs` sẽ thấy
`sourceSha256` khớp 66.3/66.4 từng ký tự. Số đếm (182/175/75/21/7/8/5 và
179/178/134/1/21/4) thì kiểm được ngay trong repo vì bản ẩn danh giữ nguyên hình dạng.

---

## ADR-0045 — `maxRegexMs` cài bằng ba lớp, và lớp thứ ba là "lần sau"

**Ngày:** Phase 9 · **Trạng thái:** đã áp dụng

**Bối cảnh.** 64.3 đòi "engine regex có timeout/giới hạn" và "timeout → bỏ
transform, giữ text gốc, ghi chẩn đoán; không làm mất lượt". JavaScript **không**
ngắt được một `RegExp.exec` đang chạy trong luồng chính.

**Quyết định.** Ba lớp, ghi rõ trong `core/preset/sandbox.ts`:

1. **Chặn trước** — pattern có lượng từ lồng (`(a+)+`) hoặc nhóm luân phiên có
   hai nhánh trùng nhau rồi bị lặp (`(x|x)*`) → `needs_adapter`, không thử chạy.
2. **Giới hạn đầu vào** — chỉ chạy trên chuỗi dưới `MAX_KY_TU = 200.000`.
3. **Đo sau** — quá `tuning.preset.maxRegexMs` thì **bỏ kết quả**, giữ text gốc,
   và tắt transform ấy cho các lượt sau.

**Lý do.** Lớp 3 không cứu được lượt đầu tiên và tài liệu nói thẳng điều đó. Nó
cứu mọi lượt sau, tức đúng thứ 64.3 cần: một regex tham lam không được phép làm
hỏng cả ván. Bộ dò ở lớp 1 cố ý HẸP — fixture B có 21 regex thật, và một bộ dò
rộng sẽ ném cả `(foo|bar)*` lành tính vào `needs_adapter`.

**Hệ quả.** `apTransform()` nhận `dongHo` tiêm vào thay vì gọi `performance.now()`
— vừa giữ luật "không đọc đồng hồ máy trong `core/`", vừa để test đo được đường
"quá chậm" mà không phải chờ thật.

---

## ADR-0046 — Năm bảng Phase 10 vào `WorldState`; ba bảng preset ở lại máy

**Ngày:** Phase 10 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phase 10 thêm chín bảng. Câu hỏi duy nhất đáng tranh luận: cái nào
theo **nhánh**, cái nào theo **máy**.

**Quyết định.**

| Theo nhánh (`WorldState` + Dexie v8, copy-on-write)                | Theo máy (chỉ Dexie v8)                                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `substrateLaws`, `coChe`, `lorebooks`, `loreExpectations`, `diBan` | `presetPacks`, `presetRaw`, `presetActivations`, `benchmarkRuns` |

**Lý do.** [BB] 43.6 bắt sửa Luật Nền phải **phân nhánh**, và "người chơi có thể
so hai vũ trụ với hai bộ vật lý khác nhau ở Bản Đồ Nhánh". Điều đó chỉ đúng nếu
luật nền là dữ liệu theo nhánh. Lorebook cũng vậy: 35.5 nói Dị Bản là hồ sơ về
việc **thế giới này** đã trở thành cái gì.

Ngược lại, một pack preset là thứ **máy này đã nhập**. Cùng lý do với `aiConfigs`
(ADR-0028): đổi nhánh không được làm mất thư viện, và mang save sang máy khác thì
phải nhập lại pack của máy đó.

**Hệ quả.** Năm bảng đầu vào `BANG` của `state.ts`, `hashState()` và bộ dispatch
của `apPatch` — nên chúng đi qua đúng một đường ghi như mọi bảng khác, và một
workflow không có cửa hậu nào để chạm chúng. `presetRaw` khóa theo
`ref = sha256:<HEX>` nên nhập lại đúng file cũ ghi đè chính nó thay vì nhân đôi blob.

`LorebookSchema` của 35.2 phải thêm `branchId` — đặc tả phần ấy viết trước khi có
hệ nhánh. Không thêm thì bản đọc lại từ Dexie mang một trường mà bản trong bộ nhớ
không có, và `hashState()` của hai bên khác nhau dù dữ liệu giống hệt. Trường dùng
`.prefault('')` nên một file nhập vào không phải biết nhánh nào sẽ nhận nó;
`ghiState()` ép đúng nhánh lúc ghi, giống mọi bảng copy-on-write khác.

---

## ADR-0047 — `\b` không dùng được với tiếng Việt có dấu

**Ngày:** Phase 10 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bộ phân loại mâu thuẫn lorebook (51.3) tìm vị ngữ độc quyền như
"cai trị", "đứng đầu". Bản đầu viết `/\bcai trị\b/i` — trông đúng, chạy không
lỗi, và **không bắt được gì**.

**Quyết định.** Bỏ `\b` ở cuối mọi mẫu tiếng Việt trong `lore/doiSoat.ts`, và ghi
lý do ngay trên khai báo.

**Lý do.** Trong JavaScript, `\b` là biên giữa `\w` và không-`\w`, mà `\w` chỉ là
ASCII. "trị" kết thúc bằng `ị` — không thuộc `\w` — nên không có biên nào ở đó.
Đây là lỗi im lặng cổ điển: mọi test dùng dữ liệu tiếng Anh sẽ xanh, và bộ phân
loại sẽ trả `bo_sung` cho mọi cặp entry tiếng Việt mâu thuẫn nhau.

**Hệ quả.** Áp cho mọi regex khác đọc tiếng Việt trong repo. `preset/anToan.ts`
đã viết đúng từ đầu vì các nhánh tiếng Việt ở đó không dùng `\b`.

---

## ADR-0048 — Hợp nhánh ghi bằng `link`, và giữ hai bản thay vì trộn trường

**Ngày:** Phase 10 · **Trạng thái:** đã áp dụng

**Bối cảnh.** 26.3 cho phép hợp nhánh nhưng nói rõ "thế giới nhớ **hai** lịch sử".
Hai câu hỏi cài đặt: ghi vào nhánh đích bằng op nào, và làm gì với một thực thể
khác nhau ở tám trường.

**Quyết định.** Mọi bản ghi vào nhánh đích dùng `link`. Với lựa chọn `ca_hai`,
giữ bản A làm bản chính và ghi **hash của cả hai bản** vào `kyUcHaiBan`.

**Lý do.** Hợp nhánh tạo một nhánh MỚI: ở đó chưa có bản ghi nào để mà `set`, và
`set` sẽ trả `BAN_GHI_THIEU` cho từng thực thể — một lỗi chỉ lộ ra khi người chơi
thật sự bấm hợp.

Trộn trường thì tệ hơn: nó cho ra một thực thể **chưa từng tồn tại ở nhánh nào**,
và thanh tra mạch lạc sẽ không truy được nó về đâu cả. "NPC nhớ hai phiên bản quá
khứ" của 26.3 là hai phiên bản thật, không phải một phiên bản lai.

**Hệ quả.** `gopNhanh()` từ chối chạy khi còn tranh chấp chưa quyết định — nó trả
`chuaQuyetDinh` chứ không dùng `deXuat` thay người chơi. `deXuat` chỉ là gợi ý
hiển thị, và nó luôn ưu tiên bản còn sống khi một nhánh đã chôn thực thể ấy.

---

## ADR-0049 — Một đường prompt: preset lắp vào assembler native, không chạy song song

**Ngày:** Phase 11 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Từ Phase 9 tới hết Phase 10, repo có **hai** bộ dựng prompt:

```text
bienSoanPromptKe()       sáu tầng của 33.1 — đường chơi thật dùng
bienDichPromptPreset()   bảy tầng của 63.6 — chỉ test dùng
```

Pipeline nhập mười hai bước chạy đúng, hai fixture khớp từng con số, và **không
một dòng nào của pack tới được model**. Nhìn từ phía người chơi, đó là một app
nhận file preset rồi không làm gì với nó.

**Quyết định.** `bienSoanLuot()` ở `core/preset/hopNhat.ts` là **cửa duy nhất**
store được gọi để dựng prompt một lượt. Nó gọi `bienSoanPromptKe()` bên trong,
chia sáu tầng ấy thành lõi hệ thống · nội dung slot · khối lượt-này, rồi đưa cho
`bienDichPromptPreset()` lắp vào marker của pack.

Không pack nào bật thì bước giữa **không chạy** và prompt native đi thẳng — 65.4
"tắt pack trả prompt native" đúng theo nghĩa đen.

**Lý do.** Hai đường prompt song song không có cách nào hội tụ mà không mất một
bên: bật preset thì mất sáu tầng của 33.1, giữ sáu tầng thì preset vô dụng. Ánh
xạ marker → nội dung native (63.4) là chỗ hai thứ gặp nhau mà không ai phải nhường:
**cấu trúc của pack được giữ, sự thật vẫn do engine cấp.**

**Hệ quả.**

- Marker nào pack không khai thì nội dung native của nó được gắn vào cuối tầng 3.
  Pack thiếu `chatHistory` mất **bố cục**, không mất **trí nhớ**.
- Thứ tự quyền của 65.3 giữ nguyên: đo trên fixture A thật, vị trí trong prompt là
  an toàn (2) → hợp đồng engine (280) → lõi native (896) → module ngoài (3772).
- Khối lượt-này mang hợp đồng `<CapNhat>` nằm **sau** mọi module ngoài, nên một
  preset không thể dặn model bỏ khối ấy bằng cách khai `injection_order` cực nhỏ.
- `PromptGoi` thêm `moiTraLoi`, và ba phương ngữ đều gửi được assistant prefill.

---

## ADR-0050 — Nhận cú pháp MVU, không nhận thẩm quyền MVU

**Ngày:** Phase 11 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Người dùng chơi bằng thẻ bài MVU của SillyTavern mong đợi ba thứ:
một khối cập nhật mỗi lượt, một bảng trạng thái đọc được ngay, và con số đổi có
lý do. Thiên Diễn có cả ba — khối `<CapNhat>` của 31.7, Bảng Thiên Diễn của Phần
55, Event/Patch làm lý do — nhưng khác **cú pháp**: thẻ bài viết
`<UpdateVariable>` và `_.set('đường.dẫn', cũ, mới)`.

**Quyết định.** `bocTach()` nhận ba dạng khối, và cả ba đi qua **cùng ba lớp**
(schema → bảng trắng bảng → đường dẫn cấm):

```text
{"patches":[ … ]}                      native
{"e.than.soul.x": {"_op":"add",…}}     bản đồ đường dẫn của 31.7
_.set('path', cũ, mới); // lý do       câu lệnh kiểu MVU
```

Đường dẫn **không** trỏ tới thực thể có thật thì thành **biến của pack**
(`preset.<packId>`, theo nhánh), không thành patch.

**Lý do.** Trong MVU, biến thẻ bài **là** trạng thái trò chơi. Ở đây thì không:
[BB] 66.6 xếp macro biến về namespace pack, và luật bất biến #5 cấm preset ghi
thẳng World. Ranh giới ấy là thứ cho phép một thẻ bài MVU chạy được ở đây mà vẫn
không tự viết lại thế giới.

Câu lệnh được đọc bằng biểu thức chính quy trên **văn bản**. Không `eval`, không
`new Function` — luật bất biến #10, và một thẻ bài là dữ liệu không tin cậy dù nó
trông giống JavaScript đến đâu.

**Hệ quả.** `KetQuaBocTach` thêm `bienPack`; store ghi nó vào `presetVars` khóa
`[packId+branchId]`. Test chứng minh `_.set('worlds.w1.playerState.mode', …)` và
`_.set('deity_x.aspects.ban_nga.coreSelf.tuBi', …)` đều bị từ chối: cú pháp mới
không mở thêm một cánh cửa nào.

---

## ADR-0051 — `provenance` là aspect, không phải suy đoán từ `tickSinh`

**Ngày:** Phase 11 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bảng Tạo Vật (58.7) có cột "Nguồn sinh" và Tab Ta (58.10) hỏi "ta
đã để lại gì". Cả hai cần biết ai tạo ra một thực thể.

**Quyết định.** Cài `provenance` theo 59.1 làm aspect áp được lên mọi kind, ghi
tại nơi sinh. Thiếu thì `docNguonGoc()` trả `nhap_du_lieu` và **không bịa**
`actorId`.

**Lý do.** [BB] 59.1 mở đầu bằng đúng câu ấy. Hai thực thể sinh cùng một nhịp có
thể đến từ hai nguồn hoàn toàn khác nhau, và cột "Nguồn sinh" sẽ nói dối ở đúng
chỗ người chơi tin nó nhất.

**Hệ quả.** `chieu()` xóa `provenance` ở hai tầng dưới, trừ khi chính chủ thể là
người đã tạo ra nó — một con quái vật không mang biển ghi "do Sáng Thế Thần tạo".
Save cũ mở bình thường và mọi thực thể cũ hiện "không còn dấu vết nguồn".

---

## ADR-0052 — Lựa chọn xung đột preset thuộc về PACK, không thuộc về phiên wizard

**Ngày:** Phase 11 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Nhập fixture A thật trong trình duyệt: hai module cùng khai
`history.wrapper`, `lintTruocKhiBat()` từ chối kích hoạt, và không có màn nào để
giải. Pack nằm trong thư viện mà **vĩnh viễn không bật được**.

**Quyết định.** Lựa chọn xung đột lưu theo `packId` trong store preset, và khối
giải xung đột của Xưởng Preset dựng từ **thư viện**, không từ `wizard.ketQua`.

**Lý do.** Wizard là một phiên; thư viện sống qua lần đóng tab. Buộc người dùng
nhập lại file chỉ để giải một xung đột đã giải một lần là bắt họ trả giá cho một
chi tiết cài đặt.

**Hệ quả.** Cùng lần chạy ấy lộ ra lỗi thứ hai: mặc định chỉ bật module
`activation === 'native'`, bỏ 174 module `adapted` của fixture A. [BB] 64.1 xếp
`adapted` là trạng thái **hoạt động**, nên mặc định nay loại đúng ba trạng thái mà
`locModuleChoPipeline()` loại: `quarantined`, `needs_adapter`, `disabled`.

---

## ADR-0053 — Cài Đặt gộp bốn tab; bốn id màn cũ trỏ vào cùng một component

**Ngày:** Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Cuối Phase 11 có bốn thứ người dùng chỉnh và chúng ở bốn nơi khác
nhau: Cổng AI là một màn chặn ở đầu đường, Xưởng Preset là một mục trong router,
còn Lorebook và Xưởng Workflow chỉ có **id màn** mà không có component — bấm vào
thì hiện lại Sảnh. Người muốn đổi proxy giữa ván phải nhớ một đường đi khác với
người muốn bật một pack.

**Quyết định.** Một màn `CaiDat` với bốn tab (Proxy AI · Preset · Lorebook ·
Workflow). Bốn id màn cũ (`cai_dat_ai`, `xuong_preset`, `lorebook`,
`xuong_workflow`) **giữ nguyên** và cùng dựng `CaiDat` với `tabDau` khác nhau.

**Lý do.** [BB] 58.9 — mục "Cần chú ý" của Bảng Thiên Diễn phải mở đúng **chỗ xử
lý**, không phải một trang mục lục. Gộp bốn id thành một id sẽ làm mọi mục ấy đổ
về cùng một chỗ và người chơi phải tự tìm tiếp.

**Hệ quả.** Cài Đặt mở được **trước khi vào ván**: nhập preset hay đổi proxy
không còn buộc phải tạo một thế giới trước, và thế giới ấy không còn nằm lại
trong danh sách như một ván rác. Màn chưa dựng (Xưởng Registry, Bản Đồ Nhánh,
Vật Lý) nay nói thẳng "chưa dựng" thay vì âm thầm hiện Sảnh — một cú bấm không có
phản hồi trông giống hệt một cú bấm bị hỏng.

---

## ADR-0054 — Một ván là một NHÁNH; không có bảng `saves` riêng

**Ngày:** Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phase 2 dựng đủ hạ tầng lưu trữ — copy-on-write theo nhánh, bia mộ,
snapshot, export có `schemaVersion` — và suốt mười phase **không màn nào gọi tới
nó**. Đóng tab là mất ván. Màn chính của Phase 12 cần một danh sách "Tiếp tục".

**Quyết định.** Đơn vị của một ván là `branchId`. `db/quanLySave.ts` liệt kê từ
`worlds` + `branches`, không thêm bảng mới. `luuVan()` chạy sau **mỗi** lượt kể
trọn vẹn.

**Lý do.** Nhánh vốn đã là đơn vị của mọi thứ có trạng thái (`entities`, `links`,
`uiState`, `presetVars`, `lorebooks`…). Một lớp "save" bọc ngoài nhánh tạo ra hai
định danh cho cùng một thứ, và sớm muộn hai định danh ấy sẽ lệch nhau. Bản Đồ
Nhánh (26.2) đọc đúng danh sách này chứ không đọc một danh sách thứ hai.

**Hệ quả.** `xoaVan()` từ chối xóa nhánh **còn con**: phép đọc lần lên của nhánh
con sẽ rơi vào hư không, và Dexie không có ràng buộc khóa ngoại để bắt điều đó.
Ghi lại toàn bộ event log mỗi lần lưu là idempotent nhờ khóa kép `[branchId+id]`
— đắt hơn ghi tăng dần, nhưng đúng kể cả sau khi nạp lại từ file, và một save sai
thì không có cách nào biết trước lúc mở lại.

---

## ADR-0055 — Đường chơi mở ra HƯ VÔ; hạt giống cũ thành fixture của test

**Ngày:** Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** `moThuGioi()` phát **tám entity** ngay ở nhịp 0 cho cả ba cửa vào:
hai Luật, một Khái Niệm và phản nghĩa của nó, một Thần, một Phàm Nhân, hai vùng
đất. Người chơi chưa gõ chữ nào đã có sẵn một thần thoại của người khác — và tệ
hơn, "Máu Không Rửa Được" xuất hiện ở **mọi** ván, nên nó thôi là luật của thế
giới này và thành đồ trang trí của phần mềm. Ba cửa của 17.4 cũng mất hết ý
nghĩa: `hu_vo` và `mot_cau` cho ra cùng một thế giới với hai lời quảng cáo khác
nhau.

**Quyết định.** Tách hai đường:

- `moTheGioiTrong()` — **đường chơi**. Nhịp 0 có 0 entity, 0 luật, 0 khái niệm.
  Event `khai_thien_hu_vo` không có patch nào; nó chỉ ghi cửa nào đã dùng và câu
  người chơi đã viết.
- `moThuGioi()` — **fixture** cho test và benchmark, vốn cần một thế giới có sẵn
  hình dạng để đo phép chiếu, ba tầng và một trăm năm mô phỏng.

Một cổng ở `phase12.test.ts` cấm `src/store` và `src/ui` nhập fixture ấy.

**Lý do.** Yêu cầu của chủ dự án, và nó đúng với chính đặc tả: 17.4 mô tả `hu_vo`
là "không nói gì", không phải "phát sẵn tám thứ". Luật chỉ có nghĩa khi nó ra đời
từ một lượt chơi cụ thể và truy được về lượt ấy qua `provenance` (59.1).

**Hệ quả.** Ba chỗ phải đổi theo:

1. Tầng 2 của prompt phát khối `HƯ VÔ` khi `view` rỗng — nói thẳng rằng chưa có
   gì tồn tại và thứ đáng tồn tại phải được tạo ở `<CapNhat>`. Không nói ra thì
   model đọc một prompt không có mục nào và tự lấp bằng thần thoại nó thuộc lòng,
   rồi engine từ chối những patch trỏ vào các thực thể nó vừa tưởng tượng.
2. `eventGieoNen()` chạy lại sau **mỗi** lượt có patch, không chỉ lúc khởi tạo:
   `place` đầu tiên nay xuất hiện giữa một lượt kể, và một vùng thiếu `dan_cu` bị
   mười hai tiến trình của 71.2 bỏ qua trong im lặng.
3. `kiemNhapHienDien()` đã sẵn đúng — nó chặn tạo phàm nhân khi thế giới chưa có
   nơi nào, kèm câu "Hãy tạo thế giới trước". Câu ấy viết từ Phase 3 và tới Phase
   12 mới thật sự có dịp dùng.

Thế giới hư vô vẫn deterministic và vẫn sạch bất biến sau 200 nhịp — có test.

---

## ADR-0056 — Gỡ `chi_engine`; một nhịp chưa được kể chặn mọi nhịp sau

**Ngày:** Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** ADR-0028 đã tuyên bố "không có AI thì không chơi", nhưng hai lối
thoát vẫn còn:

1. `cheDoKhiTat: 'chi_engine'` còn trong schema — một chế độ "thế giới tự chạy
   bằng engine, không cập nhật gì".
2. Nghiêm trọng hơn: khi Narrator hỏng **giữa** một lượt, Event của lượt ấy đã
   vào log rồi. Store in ra câu _"thế giới vẫn giữ nguyên chỗ đang dở"_ — và câu
   ấy **sai**. Thế giới đã đi tiếp. Người chơi bấm tick tiếp mười lần nữa thì mất
   trắng mười nhịp mà không có gì báo.

**Quyết định.**

- `cheDoKhiTat` chỉ còn `gop_vao_narrator`. `.catch()` kéo giá trị cũ về giá trị
  ấy nên cấu hình cũ vẫn đọc được, nhưng không còn cách nào chọn lại.
- Thêm `luotChuaKe` vào store. Khác `null` thì `doiCong()` **chặn mọi hành động**
  cho tới khi `keLai()` thành công. UI khóa ô nhập và hiện một khối có đúng hai
  nút: _Kể lại nhịp này_ và _Mở Cài Đặt · Proxy AI_.

**Lý do.** "Không có AI thì không chơi" chỉ đúng ở **cửa vào** nếu không có mục
thứ hai. Mất mạng giữa ván là trường hợp thường gặp nhất, và nó là đúng trường
hợp mà lối thoát cũ dẫn tới mất dữ liệu câu chuyện.

**Hệ quả.** Không có nút "bỏ qua nhịp này" và cố ý không có: bỏ qua nghĩa là chôn
hẳn đoạn ấy. Ngắt mạch ba-lần-hỏng của Phase 6b vẫn giữ nguyên và chạy song song
— nó đóng **cổng**, còn `luotChuaKe` giữ **chỗ đang dở**.

---

## ADR-0057 — Migration dữ liệu chạy lúc khởi động, đúng một lần

**Ngày:** Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Phase 12 quét lại đường chạy thật và tìm ra: `db/migration.ts` có
đủ ba bước từ Phase 2, có 50 test phủ, và **không có ai gọi nó**. Dexie tự lo
phần đổi _index_; phần đổi _dữ liệu_ — dời bản ghi sang khóa kép theo nhánh
(ADR-0015), đặt `setupCompleted` cho save cũ (78.10), gieo aspect nền cho `place`
của save trước Phase 5 — chưa từng chạy trong trình duyệt. Một save v1 mở trong
bản hôm nay đọc ra rỗng, và người chơi mất ván mà không có thông báo nào.

**Quyết định.** `khoiDongDb()` trong `db/instance.ts` chạy `chayMoiMigration()`
đúng một lần cho cả phiên, và `App` gọi nó ở `useEffect` đầu tiên — **trước** khi
bất kỳ ván nào được tạo hay mở.

**Lý do.** Thứ tự ấy không phải chi tiết. `chayMigrationV2V3` đặt
`setupCompleted = true` cho **mọi** world nó thấy; chạy nó sau khi người chơi vừa
tạo một ván mới sẽ làm ván ấy nhảy qua wizard hiện diện mà không ai bấm gì. Chạy
trước thì bảng `worlds` còn rỗng và nó là no-op thật sự. Checkpoint trong
`migration.ts` giữ cho lần khởi động thứ hai không đụng vào gì.

**Hệ quả.** Migration hỏng **không** chặn đường vào: người dùng vẫn phải mở được
Cài Đặt để xuất dữ liệu ra khỏi một máy đang hỏng. Nhưng nó hiện một khối cảnh
báo thường trực — một save đọc ra rỗng vì migration trượt trông y hệt một save bị
mất. Test `phase12Db.test.ts` khẳng định cả hai vế của hợp đồng này.

---

## ADR-0058 — Bản ghi model tạo phải đi qua schema trước khi vào thế giới

**Ngày:** Phase 12 (hoàn thiện) · **Trạng thái:** đã áp dụng

**Bối cảnh.** E2E ba tầng vừa dựng xong đã đỏ ngay lần chạy đầu, và không đỏ vì
một khẳng định sai — nó đỏ vì engine **nổ**:

```text
TypeError: Cannot read properties of undefined (reading 'thuongTich')
  ở core/world/batBienPham.ts, trong lúc chạy invariant
```

Nguyên nhân: `bocTach()` có ba lớp — cú pháp, hình dạng, thẩm quyền — nhưng lớp
"hình dạng" chỉ kiểm **PatchOp**, không kiểm **giá trị bên trong nó**. Với
`op: 'link'`, giá trị ấy là cả một bản ghi mới, và `PatchOpSchema` khai nó là
`unknown`.

Model viết `"mortal": {"tuoiTho": 60}` — một câu hoàn toàn hợp lý với người đọc.
`MortalSchema` còn mười trường nữa và `.prefault()` chỉ điền khi có ai đó
_parse_. Không ai parse, nên `m.thanThe` là `undefined`, và bất biến chạm vào nó
trước khi kịp trả về một vi phạm có cấu trúc.

Nói thẳng: **Narrator làm treo được engine.** Ba lớp thẩm quyền của 61.3 giữ
được chuyện model _đổi thứ nó không được đổi_, và hoàn toàn không giữ chuyện
model _đưa vào một bản ghi không đủ hình dạng_.

**Quyết định.** Thêm lớp 2b — `chuanHoaBanGhi.ts`. Mọi `op: 'link'` đi qua schema
của đúng bảng nó nhắm tới; với `entities`, từng aspect còn đi qua schema đã đăng
ký trong `SchemaCatalog`. `branchId` bị ÉP về nhánh đang chơi, cùng lẽ với
`sourceEventId`.

**Lý do.** `.prefault()` của Zod là hợp đồng "giá trị mặc định an toàn của trường
này". Chạy schema qua bản ghi model gửi không phải bịa thêm dữ liệu — nó là đọc
đúng hợp đồng ấy. Sửa ở đây thay vì làm bất biến phòng thủ vì bất biến có mười
mấy chỗ chạm vào aspect, và vá từng chỗ là đuổi theo triệu chứng.

**Hệ quả.** Aspect engine **không biết tên** thì bị bỏ kèm lý do, không giữ lại
làm dữ liệu tự do — một mảnh không ai đọc được vẫn đi vào `stateHash` và làm
hỏng determinism. Fuzz 2.400 bản ghi rác qua bốn bảng: hoặc từ chối có lý do,
hoặc trả về bản ghi đủ. Không trường hợp nào throw.

---

## ADR-0059 — `luuVan()` xếp hàng, không bỏ lượt

**Ngày:** Phase 12 (hoàn thiện) · **Trạng thái:** đã áp dụng

**Bối cảnh.** Lỗi thứ hai mà E2E bắt được. `luuVan()` bản đầu trả về ngay khi
`dangLuu === true`, với lý luận "đã có người ghi rồi". Nhưng người ấy đang ghi
ảnh chụp của một nhịp **cũ hơn**, và lần ghi bị bỏ là lần duy nhất biết về nhịp
mới.

Hậu quả đúng theo chuỗi: `keLuot()` gọi `void luuVan()` không chờ → người chơi
bấm "Rời ván" → `roiVan()` `await luuVan()` và nó trả về **ngay lập tức** vì lần
ghi trước còn đang chạy → ván xuống đĩa thiếu nhịp cuối → mở lại ra một thế giới
lùi một nhịp, và `world.version` lệch nên hash không khớp.

**Quyết định.** Một hàng đợi promise ở tầng module: mỗi lần `luuVan()` nối vào
đuôi thay vì bỏ lượt. `await luuVan()` từ nay thật sự có nghĩa là "đã xuống đĩa".

**Lý do.** Cờ `dangLuu` là một cái khóa _loại trừ_, trong khi thứ cần ở đây là
một hàng _tuần tự_. Hai thứ nhìn giống nhau và khác nhau ở đúng chỗ này: khóa
loại trừ vứt công việc đi, hàng tuần tự thì không.

**Hệ quả.** Hàng đợi ở tầng module chứ không trong store — nó khóa **tài nguyên
đĩa**, không phải một trạng thái của trò chơi; nhét vào store sẽ làm mọi
component render lại mỗi lần một lượt ghi bắt đầu và kết thúc.

---

## ADR-0060 — Gói save phải mang MỌI Map của `WorldState`

**Ngày:** Phase 12 (hoàn thiện) · **Trạng thái:** đã áp dụng

**Bối cảnh.** Lỗi thứ ba từ E2E, và là lỗi im lặng nhất trong ba lỗi.
`SaveExportSchema` viết ở Phase 2, khi `WorldState` mới có bốn Map. Phase 5 thêm
`knowledge` và `debts`; Phase 6 thêm `prayers`; Phase 8 thêm `storylines` và
`foreshadows`; Phase 9–10 thêm năm bảng nữa. **Không phase nào mở rộng gói
export.**

Test round-trip vẫn xanh suốt bốn phase, vì fixture của chúng để mười bảng ấy
rỗng. Với người chơi: xuất một ván ra file rồi nhập lại làm mất Luật Nền,
lorebook, mạch truyện, sổ phục bút, tri thức, nợ và lời cầu — không báo gì, và
chỉ lộ ra khi thế giới bắt đầu cư xử khác.

**Quyết định.** `PHIEN_BAN_SCHEMA` lên **v7**; gói mang đủ mười bảng. Save v6 vẫn
nhập được — mười trường mới đều `.prefault([])`, nên file cũ mở ra với mười Map
rỗng, đúng trạng thái nó vốn mô tả.

**Lý do.** Một định dạng save thiếu bảng không phải "tính năng chưa làm"; nó là
**mất dữ liệu có hệ thống**, và nó mất đúng thứ người chơi bỏ nhiều giờ nhất để
dựng.

**Hệ quả.** Thêm một cổng **cấu trúc**, không phải cổng ví dụ: test so DANH SÁCH
KHÓA của `SaveExportSchema` với danh sách Map trong `WorldState`. Lần thêm Map
thứ mười một sẽ đỏ ngay, kể cả khi chưa ai viết fixture cho nó. Cổng theo ví dụ
đã im lặng suốt bốn phase; cổng theo cấu trúc thì không im được.

---

## ADR-0061 — Danh sách ván liệt kê từ NHÁNH, không từ `worlds`

**Ngày:** Phase 12 (hoàn thiện) · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bấm thử Bản Đồ Nhánh trong trình duyệt: tách nhánh báo "Đã tách và
nhảy sang nhánh mới", rồi nhánh ấy **không hiện ở đâu cả** — không ở cây nhánh,
không ở Sảnh Vào. Nguyên nhân là chính điều làm fork rẻ: copy-on-write nghĩa là
nhánh con **chưa có hàng `worlds` riêng**, nó lần lên cha để đọc. Còn
`danhSachSave()` thì liệt kê từ bảng `worlds`.

**Quyết định.** Liệt kê từ **hợp** của `branches` và `worlds`, đọc world qua
`KhoNhanh.docWorld()` (có lần lên cha), và đếm thực thể theo cả chuỗi tổ tiên.
Thêm `ghiVanNhe()` — ghi bản ghi nhánh và hàng world, KHÔNG ghi entity — chạy
ngay sau khi fork.

**Lý do.** Đếm riêng hàng của nhánh này sẽ báo "0 thực thể" cho một nhánh vừa
fork từ một thế giới ba trăm thực thể: đúng về mặt lưu trữ, hoàn toàn sai về mặt
điều người chơi đang hỏi.

**Hệ quả.** Chiều ngược lại cũng được giữ: một hàng `worlds` mồ côi (bản ghi
nhánh mất vì crash giữa chừng) vẫn hiện ra, vì trong đó là dữ liệu thật. Mất dữ
liệu mà không báo là hỏng nặng hơn hiện ra một dòng khó hiểu.

---

## ADR-0062 — Bảng Lãnh Địa thành Bảng Thần Điện; thần khác chỉ có chữ, không có số

**Ngày:** sau Phase 12 · **Trạng thái:** đã áp dụng

**Bối cảnh.** Bảng bên phải của tầng Thần (56.4) đếm tín đồ, đền và hiển thánh,
kèm hai dòng Dị Hóa "Tín đồ tin ta / Ta thật sự là". Nó trả lời đúng một câu:
_bao nhiêu người tin ngươi_. Nhưng thứ người chơi hỏi khi đang là một vị thần
trong một thần điện lại là ba câu khác — **ta ngồi ghế nào, luật nào ràng ta,
ta mạnh tới đâu** — và không câu nào trong ba có chỗ trên bảng cũ. Hội đồng thần
(69.3) đã có ghế, phiếu, kế vị và trọng số tiếng nói từ Phase 6, nhưng chưa từng
hiện lên mặt chơi.

**Quyết định.** Thay bảng cũ bằng **Bảng Thần Điện** với ba khối: VỊ TRÍ (thần hệ,
ghế, hạng, lối cai trị), QUY LUẬT (luật kế vị, ngưỡng thông qua, lời đã thề, luật
nền đã có tên), SỨC MẠNH (thẩm quyền được quy cho, so với vị nặng nhất, và từng
domain). Phép tính chuyển hẳn xuống `core/than/thanDien.ts`; bảng cũ dựng dữ liệu
ngay trong component nên không có cách nào kiểm nó mà không dựng React.

**Lý do giữ số cho mình mà không giữ cho người khác.** `tiengNoiCua` suy từ tín đồ,
đền và sức domain — với vị thần khác, đó là dữ liệu NGOÀI lãnh địa người chơi, và
[BB] 56.4 + 19.1 cấm in số cho thứ ngoài lãnh địa. Nhưng ghế và vai trong hội đồng
là chuyện công khai của thiết chế, in thẳng được. Nên thần khác nhận vai đầy đủ và
một chữ so sánh — _nặng hơn, ngang, nhẹ hơn_ — chứ không nhận con số. Kiểu
`ThanhVienThanDien` không có trường số nào, và test cưỡng chế đúng danh sách trường
ấy để không ai vô tình mở đường rò rỉ về sau.

**Hệ quả.** Hai dòng Dị Hóa mất chỗ hiển thị. Cơ chế không mất: tình huống Dị Hóa
(69.1) vẫn nổi lên thành thẻ chọn cách đáp ở cột giữa, tức là người chơi vẫn gặp
Dị Hóa ở đúng lúc nó có nghĩa — lúc phải chọn — thay vì đọc nó như một chỉ số.
