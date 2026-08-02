# IMPLEMENTATION STATUS

Bốn trạng thái duy nhất (Phần 74.2): `not_started` · `in_progress` · `blocked` · `done`.
Không dùng "90% done". Một gate fail thì phase chưa xong.

| Phase | Tên                                    | Trạng thái |
| ----- | -------------------------------------- | ---------- |
| 0     | Khảo sát và đóng hợp đồng              | **done**   |
| 1     | Lõi deterministic                      | **done**   |
| 2     | Persistence, migration và nhánh        | **done**   |
| 3     | Vertical slice offline                 | **done**   |
| 4     | Intent, tri thức và Project            | **done**   |
| 5     | Living World substrates                | **done**   |
| 6     | Tầng Thần hoàn chỉnh                   | **done**   |
| 6b    | Cổng AI bắt buộc + nợ Phase 6          | **done**   |
| 7     | Tầng Phàm Nhân hoàn chỉnh              | **done**   |
| 8     | Storyline, projection và AI            | **done**   |
| 9     | Preset Bridge                          | **done**   |
| 10    | Lorebook, Workflow, RAG và hệ nâng cao | **done**   |
| 11    | UI hoàn chỉnh                          | **done**   |
| 12    | Hardening và phát hành                 | **done**   |

---

## Baseline repo (đo lúc bắt đầu Phase 0)

| Mục                                 | Trạng thái đầu                                   |
| ----------------------------------- | ------------------------------------------------ |
| Thư mục                             | `E:\godsimulator` — chỉ có hai file `.md` đặc tả |
| Git                                 | không phải repo → `git init` (ADR-0001)          |
| `AGENTS.md`                         | không tồn tại                                    |
| `package.json`                      | không tồn tại                                    |
| Test                                | không có                                         |
| Thay đổi chưa commit của người dùng | không có                                         |
| Node / npm                          | v25.4.0 / 11.7.0                                 |

Hai file đặc tả **chưa từng bị sửa**.

---

## Phase 0 — done

### Checklist deliverable

- [x] Repo scaffold: Vite 6 + React 18 + TypeScript strict + Zod 4 + Dexie 4 + Zustand +
      Tailwind + EJS + Framer Motion + Vitest
- [x] Zod 4 khóa ở `4.4.3`; `.prefault()` xác nhận có thật và **khác** `.default()`
- [x] Khai đủ **12 registry** (`R`), có bằng chứng kiểu compile-time
- [x] Tách **manifest thuần JSON** khỏi **runtime handler** (`manifest.ts` / `catalog.ts`)
- [x] Tuning đầy đủ: 6 nhóm gốc (7.1) + 4 nhóm v3 (61.4) + nhóm `rerank` (77.4) = 11 nhóm
- [x] Bốn hợp đồng lõi: `World`, `Event`, `Scene`, `Patch` (61.3) + `PlayerState`
- [x] `EntityRef`, `StatePath`, `ExprNode`, `PatchTemplate`, `ImportIssue`, `BlockReason`,
      `ConditionRecord`, `Claim`, `Debt`, `Obligation`, `ScheduleBlock`, `FlowRef`
- [x] Error contract có cấu trúc (`StructuredError`, `KetQua`, `parseAnToan`) — không throw
- [x] Mười hai aspect schema, mười bốn kind, sáu động từ, 43 quan hệ
- [x] `WorldView` + `ProjectedEntity` / `ProjectedLaw` / `ProjectedConcept` + `visibilityHash`
- [x] Khối U: `PlayerProfile`, `CreatorIdentity`, `StartingPresenceDraft`,
      `ProjectedPlayerPersona`, `PronounSet`
- [x] Khối U: `RerankConfig`, `RerankQuery`, `RerankCandidate`, `RerankResult`,
      `RerankCacheEntry`, `RetrievalRun`, `RetrievalEvalCase`, `RetrievalEvalMetrics`
- [x] **Ma trận riêng tư** `hồ sơ riêng → persona chiếu → canon` với 7 biên
- [x] Fixture world nhỏ (7 entity, 12 link, không thực thể mồ côi)
- [x] Fixture retrieval-eval: chunk đúng / nhiễu / trùng nguồn / **cấm**
- [x] Fixture preset chỉ đọc, đã ẩn danh (ADR-0007)
- [x] Sáu tài liệu sống trong `docs/`

### Gate Phase 0

| #   | Cổng                                              | Kết quả  | Bằng chứng                                             |
| --- | ------------------------------------------------- | -------- | ------------------------------------------------------ |
| 1   | `typecheck` pass                                  | **PASS** | `tsc -b --force` — 0 lỗi                               |
| 2   | Không `R.*` chưa khai                             | **PASS** | `registry.test.ts` — `Object.keys(R) === REGISTRY_IDS` |
| 3   | Không `tuning.*` ngoài schema                     | **PASS** | `tuning.test.ts` — 53 đường dẫn đặc tả dùng đều có     |
| 4   | Manifest JSON round-trip                          | **PASS** | 128 manifest, `roundTripManifest` bằng nhau            |
| 5   | Không executable code trong registry import       | **PASS** | `quetDauVetCode` sạch trên 128 manifest                |
| 6   | Không `eval` / `new Function` trong core          | **PASS** | `source-guards.test.ts` quét mã nguồn                  |
| 7   | `core/` không phụ thuộc UI/DB/network             | **PASS** | `source-guards.test.ts`                                |
| 8   | Không `Math.random` / thời gian máy / locale sort | **PASS** | `source-guards.test.ts`                                |
| 9   | Mọi schema dùng trong code có nơi lưu/test        | **PASS** | `docs/SCHEMA_DB_MATRIX.md`                             |
| 10  | Trường riêng tư không có trong projected type     | **PASS** | `privacy.test.ts` — 29 test                            |
| 11  | Config rerank sai → heuristic an toàn             | **PASS** | `rerank.test.ts` — 8 payload rác                       |
| 12  | Production build chạy                             | **PASS** | `vite build` — 132 module, 272 kB                      |

### Lệnh đã chạy và kết quả thật

```text
npm install              → added 300 packages
npx tsc -b --force       → 0 lỗi
npx eslint . --max-warnings 0
                         → 0 lỗi, 0 cảnh báo
npx prettier --check     → pass
npx vitest run           → 7 file, 222 test, 222 pass, 0 fail
npm run build            → tsc -b && vite build, ✓ built in 2.44s
                           dist/index.html 0.66 kB
                           dist/assets/index-*.css 6.20 kB
                           dist/assets/index-*.js 272.24 kB (gzip 83.17 kB)
```

### Xung đột đặc tả đã phát hiện và xử lý

| #   | Xung đột                                                                  | Xử lý    |
| --- | ------------------------------------------------------------------------- | -------- |
| 1   | `.prefault({})` trên schema có trường bắt buộc — Zod 4 từ chối ở mức kiểu | ADR-0002 |
| 2   | `lawful.dieuKien` là string cần "eval" vs. luật cấm `eval`                | ADR-0003 |
| 3   | Id metric camelCase vs. regex id manifest chỉ cho chữ thường              | ADR-0004 |
| 4   | `WorldView.dongTuKhaDung: VerbDef[]` chứa closure, không hash được        | ADR-0005 |

### Giới hạn đã biết của Phase 0

- `HandlerCatalog` chưa có handler nào. Mọi `handlerId` của `verb`, `action`, `gap`,
  `ending`, `mechanism`, `worldProcess` đang ở trạng thái `can_adapter` (ADR-0006).
  Đây là **thiết kế của Phase 0**, không phải nợ kỹ thuật ẩn.
- Chưa có RNG, Event bus, patch transaction, `chieu()`, DB, hay UI game — đó là Phase 1–3.
- `src/App.tsx` là **bảng chẩn đoán hợp đồng**, không phải giao diện game. Nó đọc dữ liệu
  thật từ registry/tuning/privacy để chứng minh build chạy được.

---

## Phase 1 — done

**Mục tiêu:** state chỉ đổi qua Event/Patch transaction.

### Checklist deliverable

- [x] Seeded RNG: `ke`, `nguyen`, `khoang`, `d100`, `co`, `chon`, `tron`, `softmax`,
      `nhanh`, snapshot/khôi phục trạng thái, `rngCuaTick` tách kênh — `core/engine/rng.ts`
- [x] Canonical state hash độc lập thứ tự khóa và thứ tự chèn — `core/engine/hash.ts`
- [x] Event bus append-only + `EventLog` — `core/engine/state.ts`
- [x] Patch validator 8 op, hai pha, optimistic `expectedVersion` — `core/engine/patch.ts`
- [x] Transaction + rollback chính xác — `core/engine/transaction.ts`
- [x] Trình thông dịch `ExprNode` 12 op thay cho `eval` (ADR-0003) — `core/engine/expr.ts`
- [x] Invariant runner, 7 bất biến lõi, có phạm vi — `core/engine/invariant.ts`
- [x] Repository in-memory (test không cần trình duyệt) — `taoKhoBoNho()`
- [x] Replay từ world khởi đầu + event log, hai chế độ nghiêm/khoan — `core/engine/replay.ts`
- [x] `kiemDeterminism()` — replay hai lần, so hash

### Gate Phase 1

| #   | Cổng                                               | Kết quả  | Bằng chứng                                               |
| --- | -------------------------------------------------- | -------- | -------------------------------------------------------- |
| 1   | 10.000 bước cùng seed cho cùng hash                | **PASS** | xem bằng chứng determinism bên dưới                      |
| 2   | Patch lỗi không để state nửa vời                   | **PASS** | 3 test: patch thứ hai hỏng, schema hỏng, `mul` lên chuỗi |
| 3   | Invariant nặng → rollback, Event không vào log     | **PASS** | `engine.test.ts`                                         |
| 4   | Event cause không cycle, không từ tương lai        | **PASS** | `kiemNhanQua` — 3 test                                   |
| 5   | Log append-only, id trùng bị từ chối               | **PASS** | `engine.test.ts`                                         |
| 6   | Event hash sai bị từ chối (chống sửa log)          | **PASS** | `engine.test.ts`                                         |
| 7   | `core/` không phụ thuộc UI/DB/network              | **PASS** | `source-guards.test.ts`                                  |
| 8   | Không `Math.random` / thời gian máy trong core     | **PASS** | `source-guards.test.ts`                                  |
| 9   | Prototype pollution bị chặn ở cả `expr` và `patch` | **PASS** | 2 test                                                   |
| 10  | Production build chạy                              | **PASS** | `vite build`                                             |

### Bằng chứng determinism

```text
seed            cong-phase-1
số bước         10.000 Event
entity cuối     3.063
tick cuối       9.876
state hash      b2614bec9e2788ce
replay lần 2    b2614bec9e2788ce   (khớp)
thời gian       ~0,9 s
```

Seed khác cho hash khác; đổi một giá trị patch cũng làm hash cuối đổi — cả hai đều
có test riêng, nên hash thật sự phản ánh nội dung chứ không phải hằng số.

### Lệnh đã chạy và kết quả thật

```text
npx tsc -b --force        → 0 lỗi
npx eslint . --max-warnings 0
                          → 0 lỗi, 0 cảnh báo
npx prettier --check      → pass
npx vitest run            → 8 file, 312 test, 312 pass, 0 fail
npm run build             → ✓ built in 2.91s
```

### Vấn đề kỹ thuật đã phát hiện và sửa trong phase

| #   | Vấn đề                                                            | Sửa                                                              |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Snapshot cả state mỗi Event → rollback O(thế giới), 10k bước treo | ADR-0011: hoàn tác chính xác theo bản ghi bị chạm                |
| 2   | Hash toàn state mỗi Event → replay O(n²)                          | ADR-0011: `tinhHash` mặc định tắt; replay chỉ hash ở cuối        |
| 3   | Invariant quét toàn bộ mỗi Event → O(n²)                          | ADR-0012: kiểm theo `PhamViThayDoi`; quét toàn cục ở cuối replay |
| 4   | Rollback tick/version ghi đè world vừa được khôi phục             | Chỉ khôi phục thủ công khi lô patch KHÔNG chạm bảng `worlds`     |

### Giới hạn đã biết của Phase 1

- `PatchTemplate` đã có schema và bộ thông dịch `ExprNode`, nhưng **compiler**
  `PatchTemplate → PatchOp` (thay `idExpr`/`valueExpr` bằng giá trị thật) chưa nối —
  nó cần `RuntimeCtx` có `WorldView`, tức cần `chieu()` của Phase 3.
- Bất biến toàn cục (`khong_thuc_the_mo_coi`) chỉ chạy ở `chayInvariantToanBo()`,
  không chạy mỗi transaction. Đây là đánh đổi hiệu năng có chủ ý, ghi ở ADR-0012.
- Chưa có `chieu()`, chưa có Dexie, chưa có UI game.

---

## Phase 2 — done

**Mục tiêu:** save/load/branch không mất dữ liệu.

### Checklist deliverable

- [x] Dexie repository sau interface `KhoState` của Phase 1 — `src/db/repo.ts`
- [x] `db.version(1)` giữ nguyên; v2 (compound key) và v3 (Khối U) thêm dần — `src/db/schema.ts`
- [x] Copy-on-write bằng `[branchId+id]` + bia mộ (ADR-0014)
- [x] Migration có checkpoint theo lô, idempotent, chạy tiếp được sau crash — `src/db/migration.ts`
- [x] Kiểm đếm + hash trước khi tuyên bố hoàn tất (61.5 quy tắc 3)
- [x] Export/import có `schemaVersion`; save mới hơn app bị từ chối tử tế
- [x] Secret stripping đệ quy, khớp không phân biệt hoa thường — `stripSecret()`
- [x] Autosave + snapshot, giữ 5 bản gần nhất mỗi nhánh mỗi scope — `src/db/save.ts`
- [x] Bảng v3: `playerProfiles`, `playerIdentities`, `rerankCache`, `retrievalRuns`, `retrievalEval`
- [x] Cache rerank khóa bảy phần, vô hiệu theo nhánh/visibility — `src/db/rerankCache.ts`
- [x] Migration save cũ đặt `setupCompleted = true` (Phần 78.10)

### Gate Phase 2

| #   | Cổng                                                | Kết quả  | Bằng chứng                                               |
| --- | --------------------------------------------------- | -------- | -------------------------------------------------------- |
| 1   | Fork rồi sửa cùng entity ở hai nhánh không đè nhau  | **PASS** | `db.test.ts` — ba nhánh, gốc giữ nguyên                  |
| 2   | Fork không sao chép dữ liệu                         | **PASS** | sau fork, `entities.count() === 1`                       |
| 3   | Bia mộ: xóa ở nhánh con không hồi sinh từ cha       | **PASS** | `db.test.ts`                                             |
| 4   | Chuỗi ba tầng: nhánh gần nhất thắng                 | **PASS** | `db.test.ts`                                             |
| 5   | Crash giữa migration phục hồi được                  | **PASS** | checkpoint dở dang thì chạy tiếp rồi hoàn tất            |
| 6   | Migration idempotent                                | **PASS** | lần hai `daBoQua = true`                                 |
| 7   | Kiểm đếm và hash trước khi hoàn tất                 | **PASS** | `settings['migration.v1_v2.hash']`                       |
| 8   | Save round-trip giữ hash, đi qua JSON thật          | **PASS** | `hashKhop === true`                                      |
| 9   | Export không chứa secret                            | **PASS** | không chuỗi mật khẩu, không khóa nào trong `KHOA_SECRET` |
| 10  | Export mặc định không chứa hồ sơ riêng              | **PASS** | `hoSoRiengTu === undefined`                              |
| 11  | Save mới hơn app bị từ chối tử tế                   | **PASS** | `SAVE_MOI_HON_APP`, kèm hướng dẫn                        |
| 12  | Save cũ mở thẳng vào game                           | **PASS** | `setupCompleted = true` sau v2 đến v3                    |
| 13  | Cache không đọc chéo nhánh                          | **PASS** | đổi `branchId` cho miss                                  |
| 14  | Cache không đọc chéo chủ thể                        | **PASS** | đổi `scopeKey` cho miss                                  |
| 15  | Cache vô hiệu khi visibility, model hoặc config đổi | **PASS** | ba test riêng                                            |
| 16  | Hạn cache theo tick, không theo giờ máy             | **PASS** | `db.test.ts`                                             |
| 17  | Xóa cache rerank không ảnh hưởng save hay replay    | **PASS** | hash không đổi                                           |
| 18  | Giữ 5 bản autosave mỗi nhánh mỗi scope              | **PASS** | tick 5 đến 9 còn lại                                     |

### Lệnh đã chạy và kết quả thật

```text
npx tsc -b --force        0 lỗi
npx eslint . --max-warnings 0
                          0 lỗi, 0 cảnh báo
npx prettier --check      pass
npx vitest run            9 file, 362 test, 362 pass, 0 fail
                          (src/db/db.test.ts: 50 test)
npm run build             built in 2.72s
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                          | Sửa                                                            |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Migration v1 đến v2 nhân đôi bản ghi thay vì di chuyển: đổi `branchId` chính là đổi primary key | ADR-0015 — ghi khóa mới rồi xóa khóa cũ trong cùng transaction |
| 2   | Đọc ở nhánh con hồi sinh entity đã xóa, vì phép đọc lần lên nhánh cha                           | Bảng `tombstones`, kiểm trước bản ghi ở mỗi tầng (ADR-0014)    |
| 3   | State nhánh con mang `branchId` của cha nên invariant `entity_dung_nhanh` báo sai               | `docState` gán lại `branchId` cho bản ghi kế thừa              |

### Giới hạn đã biết của Phase 2

- **Hợp nhánh (Phần 26.3) chưa cài** — đó là Phase 10 và đặc tả gọi nó là "đồ chơi cuối game".
- Dexie tự lo phần đổi index giữa các version; migration ở đây lo phần **di chuyển dữ liệu**.
  Test chạy trên `fake-indexeddb`, chưa chạy trên IndexedDB thật của trình duyệt — việc đó
  thuộc smoke test của Phase 3.
- `presetPacks`, `ragChunks`, `workflows`, `projects`, `knowledge` chưa thêm vào Dexie vì
  chưa có schema runtime nào dùng tới. Sẽ thêm ở đúng phase cần (9, 10, 4, 5).
- Chưa có UI cho save/load — Phase 3.

---

## Phase 3 — done

**Mục tiêu:** có một lát game chơi được, không AI.

### Checklist deliverable

- [x] `chieu()` — ba phép chiếu trên cùng một database — `core/project/chieu.ts`
- [x] `bopMeo()` — sai CÓ CẤU TRÚC: tên, số, thời gian, động cơ — `core/project/distort.ts`
- [x] Ba cửa vào (`hu_vo` / `mot_cau` / `day_du`) — `core/world/khoiTao.ts`
- [x] Hạt giống: 1 Luật Nền, 1 luật thường, 1 khái niệm + phản nghĩa, 1 thần, 1 phàm nhân, 2 nơi
- [x] Hiện diện ban đầu ba tầng qua Intent/validator/Event — `core/world/hienDien.ts`
- [x] Chuyển tầng không tạo save mới — `eventChuyenTang`
- [x] Tick engine, mười bốn bước khai đủ, năm bước đã nối — `core/engine/tick.ts`
- [x] Store Zustand chỉ gọi `apDungEvent`, không sửa state trực tiếp — `store/game.ts`
- [x] UI thô: Khởi Nguyên + Sảnh, input tự do, scene, tick, chuyển tầng, gợi ý, bảng debug
- [x] Không AI ở bất kỳ đâu trong đường chơi

### Gate Phase 3

| #   | Cổng                                            | Kết quả  | Bằng chứng                                                  |
| --- | ----------------------------------------------- | -------- | ----------------------------------------------------------- |
| 1   | Chơi kịch bản Sáng Thế → Thần → Phàm → Sáng Thế | **PASS** | `chieu.test.ts` + smoke test trình duyệt                    |
| 2   | `Nhanh` và `Bỏ qua` đều vào game được           | **PASS** | smoke test: bấm "Bỏ qua tất cả" vào thẳng Sảnh              |
| 3   | Ba kiểu hiện diện tạo đúng loại state           | **PASS** | `chieu.test.ts` — 10 test hiện diện                         |
| 4   | UI không ghi World trực tiếp                    | **PASS** | store chỉ gọi `apDungEvent`; kiểm ở `source-guards.test.ts` |
| 5   | Cùng Event được chiếu khác nhau                 | **PASS** | ba `visibilityHash` khác nhau                               |
| 6   | **Phàm nhân không thấy luật thật**              | **PASS** | 6 test rò rỉ + kiểm DOM thật                                |
| 7   | Save/load giữ hash                              | **PASS** | Phase 2 `db.test.ts`                                        |
| 8   | Production build chạy offline                   | **PASS** | `vite preview`, 0 lỗi console                               |
| 9   | 200 tick không LLM cho cùng hash với cùng seed  | **PASS** | `chieu.test.ts`                                             |
| 10  | Lát dọc replay được từ event log                | **PASS** | `chieu.test.ts`                                             |

### Bằng chứng smoke test trình duyệt

```text
Khởi Nguyên → "Bỏ qua tất cả"  → vào thẳng Sảnh
Sáng Thế                        8 rõ · 0 mờ · 0 tin đồn · 0 chưa biết tới
Thần                            1 rõ · 4 mờ · 3 tin đồn · 0 chưa biết tới
Phàm Nhân                       2 rõ · 0 mờ · 5 tin đồn · 1 chưa biết tới

Kiểm DOM ở tầng Phàm Nhân:
  văn bản luật gốc      KHÔNG có
  văn bản Luật Nền      KHÔNG có
  kẽ hở engine          KHÔNG có
  tên đã bóp méo        CÓ ("Người ta gọi Ô Uế", "Kẻ gọi là …")

Console errors: 0
```

### Giới hạn đã biết của Phase 3

- UI chưa nối save/load qua Dexie — Phase 2 đã có toàn bộ hạ tầng, chỉ chưa gắn nút.
  Đây là việc của Phase 11.
- Layout hai cột chưa co lại ở khung hẹp (dưới ~800 px). Responsive là cổng Phase 11.
- Bước 2 (áp luật), 3 (utility AI), 5, 6, 9 của tick chưa nối handler — Phase 5 và 6.

---

## Phase 4 — done

**Mục tiêu:** ô nhập thật sự tự do.

### Checklist deliverable

- [x] `Intent` schema, `rawText` bất biến — `core/intent/schema.ts`
- [x] Rule parser tiếng Việt, khớp theo TỪ + mẫu có khoảng nhảy — `core/intent/parser.ts`
- [x] `suaIntent()` cho phép sửa cách hiểu, không sửa điều đã nói
- [x] `KnowledgeRecord` với nguồn, số chặng, độ tin
- [x] Affordance collector thu từ aspect, quan hệ, nơi, vật, luật, `R.action`
- [x] `ActionPlan` / `ActionOutcome` + validator luật, tri thức, quyền tầng
- [x] `Project` + milestone + requirement — `core/intent/resolve.ts`
- [x] Xác nhận cho hành động không thể hoàn tác
- [x] 50 input fixture mỗi tầng, tổng 150 — `test/fixtures/inputs.ts`

### Gate Phase 4

| #   | Cổng                                         | Kết quả  | Bằng chứng                                                            |
| --- | -------------------------------------------- | -------- | --------------------------------------------------------------------- |
| 1   | Không input nào trả "không hiểu" chung chung | **PASS** | 150 input, mỗi câu có lời kể; quét cả "không nhận ra", "lỗi hệ thống" |
| 2   | Impossible có `BlockReason` từ world         | **PASS** | `failure` luôn kèm `blockedBy` có code và message                     |
| 3   | Intent không dùng tri thức mù                | **PASS** | mục tiêu ngoài view bị chặn `KHONG_BIET_MUC_TIEU`                     |
| 4   | Mục tiêu dài hạn thành Project               | **PASS** | mọi fixture đánh dấu `project` đều mở Project                         |
| 5   | Partial / alternative thay vì dựng tường     | **PASS** | thất bại trả `partial` kèm `newAffordances`                           |
| 6   | Việc đời thường lặp không thành luật vũ trụ  | **PASS** | 200 lần "pha trà" — số luật và văn bản luật không đổi                 |
| 7   | Hành động không hoàn tác phải xác nhận       | **PASS** | 4 test + hộp thoại thật trong trình duyệt                             |
| 8   | Khởi tạo Thần/Phàm không tự cấp quyền lực    | **PASS** | Phase 3 test hiện diện (`suc` do engine, ngân sách kỹ năng 3)         |
| 9   | Canon diff xác nhận trước Event đầu tiên     | **PASS** | `CanonDiff` trả về trước commit; UI hiện trước khi chơi tiếp          |
| 10  | `giaiQuyet` không sửa state                  | **PASS** | hash không đổi sau khi giải ý định                                    |
| 11  | Cùng seed + cùng câu cho cùng kết quả        | **PASS** | outcome và event hash trùng khớp                                      |
| 12  | `[BB]` 5.3 — luật cấm trả về ID LUẬT cụ thể  | **PASS** | `lawId` khớp `/^law_/`                                                |

### Lệnh đã chạy và kết quả thật

```text
npx tsc -b --force        0 lỗi
npx eslint . --max-warnings 0
                          0 lỗi, 0 cảnh báo
npx prettier --check      pass
npx vitest run            11 file, 450 test, 450 pass, 0 fail
                          (chieu.test.ts 50, intent.test.ts 38)
npm run build             built in 2.08s, 151 module, 329 kB (gzip 102 kB)
vite preview + browser    0 lỗi console
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                        | Sửa                                                                                     |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Khớp chuỗi con trên tiếng Việt bỏ dấu báo nhầm liên tục ("thứ" khớp "thu", "khởi" khớp "hoi") | Chuyển sang khớp theo TỪ; thêm mẫu có khoảng nhảy `thu * ve` để bắt "thu vị thần đó VỀ" |
| 2   | Ba loại việc dài hơi không được nhận là Project: tranh domain, ký giao ước, cải cách giáo lý  | Bổ sung tín hiệu Project theo đúng ví dụ 68.4 — tất cả đều là chiến dịch nhiều bước     |
| 3   | `CanonDiff.seTao` khai `readonly` nhưng cần `push` khi dựng                                   | Dùng mảng ghi được bên trong, `readonly` ở biên ra ngoài                                |

### Giới hạn đã biết của Phase 4

- Parser là **rule-based**; model parser adapter là Phase 8. Đây đúng thứ tự đặc tả
  yêu cầu ("rule parser trước, model parser adapter sau").
- `CrystallizationCandidate` đã có schema và sáu cấp (`personal → … → law`) nhưng
  bộ tích lũy mẫu chưa chạy — nó cần world process của Phase 5. Hiện tại điều được
  bảo đảm là chiều ngược lại: việc đời thường **không** kết tinh (đã có test).
- `ActionPlan.steps[].expectedEffects` còn rỗng: sinh `PatchTemplate` từ kế hoạch cần
  `PatchTemplate` compiler, vốn chờ `RuntimeCtx` đầy đủ (Phase 5).
- `Project` chưa tiến triển theo tick — `nextTick` đã có, world process chạy nó ở Phase 5.
- `KnowledgeRecord` đã có schema và được validator dùng, nhưng chưa có hệ truyền tin
  (ai kể cho ai, mấy chặng) — Phase 5 mục `di_chuyen_lien_lac`.

---

## Phase 5 — done

**Mục tiêu:** thế giới tự chạy bằng engine.

> Nói cho đúng vai trò: Phase 5 không phải một tính năng người chơi bấm vào. Nó là lý do
> mà khi người chơi quay lại bàn nói chuyện, NPC không đứng nguyên ở chỗ cũ. Sản phẩm
> thật của nó là **bản tin** — chuyện đã xảy ra ngoài kia — chứ không phải bảng số.

### Checklist deliverable

- [x] Bảy aspect nền, mỗi cái là móc _State_ của một hàng trong ma trận 72.4 —
      `core/schema/aspect/substrate.ts` (ADR-0021)
- [x] Hai bảng mới `knowledge` và `debts`, Dexie v4, migration v3→v4 có checkpoint (ADR-0020)
- [x] Hợp đồng `WorldProcessDef` đúng 71.1: `scope`, `cadence{unit,every,eventTypes}`,
      `reads`/`writes` là `StatePath` thật, `invariants`, `resolution`, `uuTien`, `baoToan`
- [x] **Mười hai** tiến trình của 71.2, mỗi cái có state, cadence, reads/writes, invariant,
      event và projection — `core/world/process/`
- [x] Scheduler 71.4 đủ năm quy tắc: đồ thị reads/writes, gộp `add`, `set`×`set` theo ưu
      tiên, chu trình chia theo SCC, invariant sau mỗi stage, rollback + chẩn đoán chỉ tên
- [x] Khai báo `baoToan` cưỡng chế ở mức cơ chế: trao đổi tổng 0, thuế tổng 0,
      gỗ-vào-kho + gỗ-rời-rừng tổng 0
- [x] Mười một bất biến mới, phủ đủ bảy mục tối thiểu của 71.4 — `core/world/batBien.ts`
- [x] Ba độ phân giải + `vatChatHoa()` bảo toàn dân số, vật chất, sở hữu và lịch sử đã biết
- [x] Catch-up gộp bước bằng công thức macro + Smart Stop theo sự kiện trọng đại (47.3)
- [x] Chiếu aspect nền theo tầng: phàm nhân **không đọc được** con số của engine (56.2)
- [x] `banTin.ts` — thứ tiến trình nền trả về cho vòng chat, lọc theo điều chủ thể biết (72.2)
- [x] Gieo nền cho thế giới mới và cho save cũ; tuyến đường là thực thể có thật

### Gate Phase 5

| #   | Cổng                                  | Kết quả  | Bằng chứng                                                  |
| --- | ------------------------------------- | -------- | ----------------------------------------------------------- |
| 1   | 100 năm offline không LLM             | **PASS** | 400 tick, 0 chẩn đoán mức `loi`, invariant toàn cục sạch    |
| 2   | Bảo toàn dân số theo rule             | **PASS** | `spatial.danSo === Σcohort` kiểm mỗi tick trong 120 tick    |
| 3   | Di cư không sinh/nuốt người           | **PASS** | Σ(nhập − xuất) toàn thế giới = 0 ở cả 200 tick              |
| 4   | Bảo toàn vật chất                     | **PASS** | trao đổi tổng 0; gỗ vào kho = gỗ rời rừng; kho không âm     |
| 5   | Tài nguyên không vượt sức chứa        | **PASS** | không có phục hồi từ hư không sau 200 tick                  |
| 6   | Không tri thức teleport               | **PASS** | mọi dòng `hops > 0` truy được về nguồn + tuyến + độ trễ     |
| 7   | Bất biến BẮT được tri thức giả        | **PASS** | nhét một dòng không nguồn → `KHONG_TRI_THUC_TELEPORT`       |
| 8   | Tua thời gian có Smart Stop           | **PASS** | dừng thật ở mốc trọng đại, không dừng vì hết lượt           |
| 9   | Catch-up không chạy micro vô hạn      | **PASS** | 400 tick truyện → **10** bước engine ở nhịp `the_dai`       |
| 10  | Macro→micro bảo toàn state            | **PASS** | cohort giảm đúng số người được đặt tên; không bịa người     |
| 11  | Không materialize giàu trong vùng đói | **PASS** | tài sản rỗng, kỹ năng ≤ trình độ vùng, thể lực theo cái đói |
| 12  | Deterministic replay                  | **PASS** | cùng seed → cùng hash sau 100 năm; replay từ log khớp       |
| 13  | Thứ tự chạy không đổi kết quả         | **PASS** | đảo ngược danh sách tiến trình → patch giống hệt            |
| 14  | Benchmark trong ngân sách             | **PASS** | 100 năm ≈ 0,7 s; số giai đoạn không nở theo thời gian       |
| 15  | Mọi `handlerId` tra được              | **PASS** | `tienTrinhThieuHandler()` rỗng — đóng ADR-0006              |
| 16  | Phàm nhân không thấy số engine        | **PASS** | `kho`, `thieuHut`, `tyLeMac`, `cohort` bị XÓA khỏi view     |

### Bằng chứng một trăm năm

```text
seed                 cong-phase-5
số tick              400 (100 năm, 4 tick/năm — ADR-0019)
năm cuối             100
entity cuối          9
dòng tri thức        39
dân số đầu → cuối    3.058 → 3.551
kho lương thực cuối  393
sự kiện sinh ra      328 (lớn/trọng đại: 308)
event log            402
state hash           77cc44e9e3203765
giai đoạn scheduler  3
cụm phụ thuộc vòng   10 tiến trình (xem ADR-0023)
bất biến đã đăng ký  19
invariant toàn cục   PASS
thời gian            ~0,7 s
```

Số liệu này in ra từ `bangChung.test.ts`, không chép tay — nó không mục được.

Dân số đi từ 3.058 lên 3.551 rồi dừng lại quanh đó: trần Malthus có thật, do đất và rừng
chặn sản lượng chứ không do một hằng số nào trong code. Đổi seed cho hash khác.

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check     pass
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           13 file, 496 test, 496 pass, 0 fail
                         (world.test.ts: 45 test)
npm run build            ✓ built in 3,24 s — 165 module, 385 kB (gzip 121 kB)
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                                                                                                                                                             | Sửa                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Chia giai đoạn bằng Kahn dồn **mọi** nút còn lại vào một stage khi gặp chu trình, kéo cả tiến trình chỉ đứng _sau_ chu trình vào chung. Ba tiến trình cùng rút một kho từ cùng ảnh chụp → kho âm 16 lần trong 400 tick                                                                                             | ADR-0023: Tarjan SCC + đồ thị rút gọn                                                                              |
| 2   | Ngay cả với SCC đúng, cụm vòng thật vẫn có 10 tiến trình, trong đó ba cái cùng rút kho                                                                                                                                                                                                                             | ADR-0023: `PHAN_KHO` chia phần, có test khẳng định tổng < 1                                                        |
| 3   | `exchange_debt` ghi `an_ninh.deDoa` mà **không khai** trong `writes` → scheduler thiếu cạnh về `conflict_security`                                                                                                                                                                                                 | Khai đủ; rà lại cả mười hai tiến trình                                                                             |
| 4   | Bốn tiến trình khai `reads` rộng quá mức (`kinh_te.kho` trong khi chỉ chạm `kho.vatLieu`), làm cụm vòng phình vô cớ                                                                                                                                                                                                | Thu hẹp về đúng đường dẫn handler chạm tới                                                                         |
| 5   | Một vùng vừa tự bùng dịch vừa bị hàng xóm lây nhận hai `set` lên cùng `y_te.dichId` trong một lô — kết quả phụ thuộc thứ tự duyệt id                                                                                                                                                                               | Gom lây lan lại, phát patch sau khi đã biết vùng nào tự bùng                                                       |
| 6   | Làm tròn số chết theo **từng** nhóm tuổi đánh rơi vài người mỗi tick; 400 tick sau sai số lớn hơn một cái làng                                                                                                                                                                                                     | Tính kỳ vọng thực trên cả bốn nhóm, làm tròn **một lần** trên tổng, chia lại theo tỷ trọng                         |
| 7   | `datLaiInvariant()` của test dựng lại **chỉ** bất biến lõi, âm thầm tắt toàn bộ bất biến Phase 5                                                                                                                                                                                                                   | `dangKyBoNapInvariant()` — tầng trên tự đăng ký bộ nạp                                                             |
| 8   | Bước 1 của tick (Phase 3) còn random-walk `spatial.danSo`, đá nhau với `population_household`                                                                                                                                                                                                                      | Bước 1 chỉ còn lo vùng **chưa** có aspect nền                                                                      |
| 9   | `travel_communication` và `settlement_infrastructure` cùng `set` lên `duong.luuLuong`; cái có `uuTien` cao hơn luôn đặt lại về 0, nên mọi con đường trông như chưa ai đi. Sau ~60 tick đường tụt về 0 chất lượng, `thongSuot = false`, hai làng **đứt liên lạc vĩnh viễn** — tin, hàng, bệnh và người đều dừng lại | Lưu lượng thành `add` từ nhiều nguồn (người đưa tin **và** thương đoàn), hao mòn cũng là `add` âm. Có test hồi quy |

### Giới hạn đã biết của Phase 5

- **Cụm phụ thuộc vòng có mười tiến trình.** Cả cụm đọc chung ảnh chụp đầu giai đoạn, tức
  là trong một mùa chúng "xảy ra đồng thời". Đây là ngữ nghĩa hợp lệ theo 71.4 quy tắc 3
  và là vòng phản hồi thật của thế giới, nhưng nó có nghĩa: hai tiến trình trong cụm không
  thấy được thay đổi của nhau **trong cùng một mùa**. Nếu sau này cần độ phân giải cao hơn
  thì đường đi là fixed-point có giới hạn, và 71.6 sẽ phải cấp ngân sách cho nó.
- Độ phân giải `micro` mới dùng ở `vatChatHoa()`. Tiến trình chạy ở `meso`/`macro`;
  mô phỏng từng người có tên theo lịch là Phase 7 (70.2).
- `household` đã có kind và quan hệ nhưng chưa có tiến trình riêng — hộ hiện là con số
  `dan_cu.soHo`. Vòng đời hộ (cưới, tách hộ, thừa kế) là Phase 7.
- Smart Stop mới nghe **sáu** điều kiện engine tự tính được. Bốn điều kiện còn lại của
  bảng 47.3 (`mach_dat_cao_trao`, `phuc_but_qua_han`, `ky_vong_lorebook_bi_lech`,
  `than_mat_domain`) cần Storyline (Phase 8) và Lorebook (Phase 10).
- `institution_governance` chưa có tranh chấp và chưa có toà án — mới có thuế, kho công,
  kế vị và ổn định. Phần còn lại thuộc Phase 7.
- Chưa nối `banTin` vào Narrator: hiện nó ra thẳng dòng scene bằng câu engine sinh.
  Narrator chọn và kể là Phase 8 — và [BB] 71.5 vẫn giữ: **LLM không giữ sổ**.

---

## Phase 6 — done

**Mục tiêu:** chơi Thần không bị thu vào tranh domain.

### Checklist deliverable

- [x] `DivineIdentity` bốn lớp trong aspect `ban_nga` (69.1) — ADR-0024
- [x] Dị Hóa thành **áp lực và tình huống**; bốn cách đáp, mỗi cách một `loaiEvent` riêng
- [x] Mười kênh can thiệp của 69.2, mỗi kênh có **giá tự nhiên** thật — `core/than/kenh.ts`
- [x] Giao ước hai chiều (kind `covenant`); một chiều bị bất biến từ chối
- [x] `Prayer` + bảng `prayers` (Dexie v5); lời cầu sinh từ bế tắc đo được (22.2)
- [x] Bốn cách trả lời đều có hậu quả; `lam_ngo` ngang hàng trong cả dữ liệu lẫn UI (22.3)
- [x] Tranh đoạt domain bằng **quy kết**, bốn hệ số từ `tuning.than`, không HP (19.2)
- [x] Vòng đời domain tám trạng thái; `suc = 0` **không** tự động là `lost` (69.4)
- [x] Ba tiến trình nền: `divine_alienation`, `prayer_flow`, `divine_agency`
- [x] Sáu bất biến tầng Thần — `core/world/batBienThan.ts`
- [x] Giao diện ba cột (rail · khung kể · bảng), Bảng Lãnh Địa 56.4, thẻ lời cầu 22.4
- [x] `tokens.css` chỉnh về đúng bảng 36.2 (ADR-0027); hai mươi ký hiệu SVG vẽ tay

### Gate Phase 6

| #   | Cổng                                    | Kết quả  | Bằng chứng                                                              |
| --- | --------------------------------------- | -------- | ----------------------------------------------------------------------- |
| 1   | Playtest không dùng Sáng Thế            | **PASS** | test chơi trọn vòng qua đúng API của UI, `mode` giữ `than` suốt         |
| 2   | Ba mục tiêu ngoài tranh domain          | **PASS** | trả lời cầu · đáp Dị Hóa · lập giao ước — không mục nào là tranh domain |
| 3   | Thần NPC tiếp tục sống khi vắng         | **PASS** | NPC tự đáp Dị Hóa và tự trả lời cầu trong 60 năm không ai bấm gì        |
| 4   | Thần người chơi KHÔNG bị AI quyết thay  | **PASS** | tình huống mở, `lichSuLoi` rỗng                                         |
| 5   | Không mana / cooldown giả               | **PASS** | `khong_tai_nguyen_meta` quét mọi aspect; mười kênh trả giá bằng hậu quả |
| 6   | CoreSelf không bị tick âm thầm sửa      | **PASS** | 200 tick nạn đói: hình ảnh trôi xa, lõi bất động, `lichSuLoi` rỗng      |
| 7   | Lõi chỉ đổi qua Event, có `eventId`     | **PASS** | `dapDiHoa` sinh ba patch đi cùng nhau; bất biến bắt được sửa lén        |
| 8   | Lời cầu truy được về bế tắc thật        | **PASS** | `loi_cau_co_goc_that`; vùng đói vừa phải thì tự lo, không cầu           |
| 9   | Domain mất hẳn chỉ khi hết neo          | **PASS** | `suc = 0` + còn neo → `reclaimable`; bất biến bắt được ghi sai          |
| 10  | Giao ước ràng buộc cả hai bên           | **PASS** | `giao_uoc_rang_buoc_hai_ben`                                            |
| 11  | Determinism không vỡ                    | **PASS** | cùng seed → cùng hash sau 100 năm với đủ ba tiến trình Thần             |
| 12  | Một trăm năm sạch chẩn đoán và bất biến | **PASS** | 0 chẩn đoán mức `loi`                                                   |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check     pass
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           14 file, 529 test, 529 pass, 0 fail
                         (than.test.ts: 30 test)
npm run build            ✓ built in 3,04 s
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                 | Sửa                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | Khoảng cách bản ngã chuẩn hóa theo cạnh huyền sáu chiều → một vụ đánh tráo danh tính ra "lệch 16", dưới mọi ngưỡng, Dị Hóa **không bao giờ** nổ ra                     | ADR-0025: đo bằng trục lệch nhất              |
| 2   | Khổ kéo `followerImage` về một **mốc** thay vì đẩy nó → thần đã bị tin là tàn nhẫn gặp nạn đói thì hình ảnh _dịu đi_                                                   | ADR-0026: đẩy tích lũy, nguội khi yên         |
| 3   | `khaThi` của bế tắc dùng `1 − thieuHut` → vùng đói 42% vẫn trên ngưỡng "tự lo được" và **không ai cầu gì**; thấy được khi mở trình duyệt, không thấy khi đọc công thức | `1 − thieuHut × 2`; ngưỡng để ý hạ xuống 0,15 |
| 4   | Test ép nạn đói bằng cách gán `thieuHut`, nhưng `production_consumption` tính lại con số ấy mỗi tick nên phép gán bị xóa ngay                                          | Helper `epDoi()` làm cạn cả kho lẫn đất       |
| 5   | Ba bài test Phase 5 kiểm bằng **số đếm** tiến trình/aspect nên đỏ ngay khi Phase 6 thêm mục hợp lệ                                                                     | Đổi sang so **danh sách** (cùng lẽ ADR-0021)  |
| 6   | `PhamViThayDoi` dựng bằng tay ở test — vỡ lần thứ ba khi thêm bảng `prayers`                                                                                           | Helper `phamVi()` giữ hình dạng ở một chỗ     |

### Giới hạn đã biết của Phase 6

- **Nút chuyển tầng trong trình duyệt chưa đáng tin.** Khi thử tự động, bấm "Thần" có lần
  vào đúng tầng Thần (Bảng Lãnh Địa hiện đủ dữ liệu thật), có lần rơi vào Phàm Nhân.
  `doiHienDien()` là mã Phase 3 chọn "entity `deity` đầu tiên trong view"; nó cần một bộ
  chọn chủ thể tử tế. **Chưa truy tới cùng** — engine và panel đã có test phủ, nhưng đường
  bấm chuột thì chưa. Đây là việc phải làm trước khi coi là chơi được thật.
- Hóa thân (19.4) mới có schema và ràng buộc; `chieu()` **chưa** tụt xuống mức phàm nhân
  khi thần đang hóa thân. Đó là một dòng [BB] còn nợ.
- Phân thân (12.3) mới có `doPhanKy`; tách bản thể thành entity riêng chưa cài.
- Hội đồng thần và kế vị giữa thần (69.3) chưa có; `institutional` mới phục vụ thiết chế
  phàm nhân.
- Utility AI của thần NPC chọn theo softmax trên năm phương án cố định, chưa đi qua
  `Intent`/`Project` như 69.3 đòi. Thần NPC **sống**, nhưng chưa **theo đuổi** việc dài hơi.
- Ba font của 36.3 chưa nhúng; đang dùng fallback hệ thống (ADR-0027).

---

## Phase 6b — done

**Mục tiêu:** hai việc, và việc thứ hai đổi hướng cả dự án.

1. Đóng năm giới hạn mà Phase 6 tự ghi ra là chưa làm được.
2. **Không có AI thì không chơi** — ADR-0028. Đây là quyết định của chủ dự án và nó thay
   thế dòng "endpoint chết vẫn chơi được" của cổng Phase 8.

> Ranh giới KHÔNG đổi: [BB] 71.5 — LLM không giữ sổ. AI trở thành **bắt buộc**, không trở
> thành **có thẩm quyền**. Test một trăm năm ở tầng `core/` vẫn chạy không LLM.

### Checklist deliverable — cổng AI

- [x] `core/ai/cauHinh.ts` — ba điểm cuối của 46.1; `thieuGiDeChoi()` trả **danh sách**
      việc cần làm chứ không trả một chữ "sai"
- [x] `core/ai/cong.ts` — máy trạng thái bốn trạng thái + ngắt mạch **đếm lần, không đếm
      giây** (luật bất biến #7 cấm đồng hồ trong `core/`)
- [x] `core/ai/bienSoan.ts` — sáu tầng của 33.1, bảy quy tắc Narrator của 29.2; nhận
      `WorldView` chứ không nhận `World` (33.3)
- [x] `core/ai/bocTach.ts` — ba lớp duyệt patch, **mặc định từ chối**: bảng trắng bốn
      bảng, chín đường dẫn cấm, trần 12 patch một lượt
- [x] `src/ai/` — bốn phương ngữ; `fetchImpl` bơm vào được nên mock pass trước network
- [x] Dexie v6 `aiConfigs` — khóa theo MÁY, không theo nhánh
- [x] `store/ai.ts` + `store/game.ts` — mọi hành động chơi qua `doiCong()` trước
- [x] `ui/screens/CongAi.tsx` — màn đầu tiên, ba cột của 46.3

### Checklist deliverable — nợ Phase 6

- [x] `core/than/chuThe.ts` — bộ chọn chủ thể (ADR-0029)
- [x] Hóa thân hạ `chieu()` xuống mức phàm nhân (ADR-0030) — `core/than/hoaThan.ts`
- [x] Phân thân tách thành entity `deity` thật — `core/than/phanThan.ts`
- [x] Hội đồng thần, phiếu và kế vị — `schema/aspect/hoiDong.ts` + `core/than/hoiDong.ts`
- [x] Thần NPC đi qua `Project` — `core/than/duAn.ts`, nối vào `divine_agency`

### Gate Phase 6b

| #   | Cổng                                          | Kết quả  | Bằng chứng                                                       |
| --- | --------------------------------------------- | -------- | ---------------------------------------------------------------- |
| 1   | Chưa cấu hình AI thì không vào game được      | **PASS** | `ai.test.ts`; trình duyệt: `App` hiện Cổng AI                    |
| 2   | Cổng nói rõ thiếu Ô NÀO, không "cấu hình sai" | **PASS** | ba mục `proxyUrl` · `modelId` · `probe`, mỗi mục một câu việc    |
| 3   | Ba lần hỏng liên tiếp thì đóng cổng           | **PASS** | tắt proxy giữa chừng: rơi về Cổng AI ở lần bấm thứ ba            |
| 4   | Đứt đường KHÔNG mất thế giới                  | **PASS** | nối lại thì về đúng nhịp 4, đúng tầng Thần                       |
| 5   | Model trả rỗng tính là HỎNG, không phải xong  | **PASS** | mã `IM_LANG`                                                     |
| 6   | Thử đường bắt model NGHE LỆNH, không chỉ sống | **PASS** | trả "Xin chào" cho `KHONG_NGHE_LENH`                             |
| 7   | Prompt không rò văn bản luật ở tầng phàm nhân | **PASS** | so với `World` thô: 0 khớp                                       |
| 8   | Prompt không rò số engine ở tầng phàm nhân    | **PASS** | năm khóa `thieuHut`/`tyLeMac`/`cohort`/`suyThoai`/`deDoa` vắng   |
| 9   | Patch AI sai thẩm quyền bị từ chối            | **PASS** | năm loại: bảng `worlds`, `coreSelf`, `domains`, `vanBan`, id lạ  |
| 10  | Model không tự khai được `sourceEventId`      | **PASS** | luôn bị ghi đè bằng eventId của lượt                             |
| 11  | Mật khẩu proxy không vào bản xuất             | **PASS** | `KHOA_SECRET` + `cheMatKhau()`                                   |
| 12  | Đổi tầng ra ĐÚNG tầng, mọi lần                | **PASS** | `chonChuThe` cho cùng danh sách ở cả ba tầng đứng                |
| 13  | Hóa thân hạ tầm nhìn, giữ danh tính           | **PASS** | `mode = than`, `mucChieu = pham_nhan`; mất sổ đền của chính mình |
| 14  | Phân thân sinh entity thật, chia đúng tín đồ  | **PASS** | 80/20; gốc mất sạch đền; áp lực Dị Hóa về 0                      |
| 15  | Hội đồng: vắng mặt KHÁC bác bỏ                | **PASS** | `khong_du_phieu` khi quá nửa ghế không tới                       |
| 16  | Ghế đầu trống KHÔNG tự lấp                    | **PASS** | `boTrongGheDau` trả ứng viên, không trao ghế                     |
| 17  | Thần NPC theo đuổi việc dài, tối đa hai việc  | **PASS** | 60 tick vắng người chơi                                          |
| 18  | Tiến độ Project đo TỪ THẾ GIỚI (68.3)         | **PASS** | không xây đền thì rà bao nhiêu lần cũng bằng 0                   |
| 19  | Thần người chơi KHÔNG bị mở việc thay         | **PASS** | `du_an.danhSach` rỗng suốt 20 tick                               |
| 20  | Determinism không vỡ                          | **PASS** | cùng seed cho cùng hash sau 40 tick có đủ Project                |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check     pass
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           16 file, 612 test, 612 pass, 0 fail
                         (ai.test.ts: 42 test, than6.test.ts: 41 test)
npm run build            ✓ built in 3,00 s — 196 module, 577 kB (gzip 184 kB)
```

### Smoke test trình duyệt — chạy với một proxy giả

```text
mở app                      Cổng AI, không phải Khởi Nguyên
điền proxy + Quét danh sách 1 model
chọn model + Thử đường      thông, tự sang Khởi Nguyên
"Bỏ qua tất cả"             thế giới mở, lời kể do MODEL viết
bấm "Thần"                  "Đang nhìn bằng mắt của Thần"   ← lỗi Phase 6 đã hết
"Trôi một nhịp"             nhịp 1, model kể tiếp
tắt proxy rồi bấm ba lần    rơi về Cổng AI: "Model không trả lời 3 lượt liên tiếp",
                            kèm "Thế giới của bạn vẫn còn nguyên" và nút Thử lại đường
bật lại proxy, Thử lại      về thẳng trong game, nhịp 4, vẫn tầng Thần

Console errors: 0
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                                                       | Sửa                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 1   | `cong()` trả object mới mỗi lần gọi; Zustand đọc qua `useSyncExternalStore` nên React so bằng `Object.is` và **lặp vô tận** — màn hình trắng ngay lần mở đầu tiên                                            | Nhớ kết quả theo ba đầu vào, ở tầng store  |
| 2   | Phân thân đặt id `deity_pt_<than>_<tick>`; tách hai lần trong CÙNG một nhịp thì `LINK_TRUNG` từ chối cả lô, tức lựa chọn tốn kém nhất của tầng Thần im lặng không làm gì                                     | Thêm số thứ tự lấy từ `phanThanIds.length` |
| 3   | Phân thân `set` vào `aspects.divisible.phanThanIds` khi thần chưa có aspect ấy, tạo ra object thiếu `nguongHopNhat`; `hopNhatDuoc()` so `khoảng cách < undefined` nên hai bản thể KHÔNG BAO GIỜ hợp lại được | Ghi cả aspect qua `DivisibleSchema.parse`  |
| 4   | `divine_agency` đọc `kinh_te.thieuHut` và `an_ninh.deDoa` cho Project mà không khai trong `reads`, làm scheduler thiếu cạnh (đúng lỗi #3 của Phase 5)                                                        | Khai đủ `doc`/`ghi` cho aspect `du_an`     |

### Giới hạn đã biết của Phase 6b

- **Không chơi được offline.** Hệ quả trực tiếp và có chủ ý của ADR-0028.
- Điểm cuối **Cập Nhật Biến** và **Diễn Hóa** mới có cấu hình, quét model và thử đường;
  chúng chưa được gọi trong đường chơi. Narrator đang gánh cả hai vai qua khối `<CapNhat>`,
  tức chế độ `gop_vao_narrator` của 46.2. Tách call riêng là Phase 8.
- Chưa có retrieval, rerank và assembler ngân sách (33.2, 34, 77). Prompt hiện lấy top-K
  theo thứ tự id, không theo điểm tiêu điểm. Phase 8 sẽ đổi hình dạng tầng 4–6, nhưng
  không đổi ranh giới `WorldView`.
- Chưa có streaming: người chơi chờ trọn lượt mới thấy chữ.
- `chieuLaw()` có nhánh cho thần đọc `vanBan` khi `muc === 'ro'`, nhưng `KindDef.phanChieu`
  của `law` chặn trần ở `mo`, nên nhánh ấy hiện không bao giờ chạy. Không sửa ở phase này
  vì nó chạm cổng Phase 3; ghi lại để Phase 8 quyết.
- Hội đồng thần chưa có tiến trình nền: kết nạp, bỏ phiếu và kế vị phải do người chơi gọi.
  Thần NPC tự vận động hội đồng là Phase 7 (`institution_governance`).
- Hóa thân chưa nối vào `divine_agency`: thần NPC chưa tự hạ phàm.

---

## Phase 7 — done

**Mục tiêu:** một đời sống có thân thể, việc làm, nhà và cộng đồng.

> Tầng Thần trả lời câu "ta làm gì với thế giới". Tầng Phàm Nhân trả lời câu khó
> hơn: **"một đời bình thường thì có gì để kể"**. Nếu câu trả lời là "không có
> gì" thì hai phần ba trò chơi này không tồn tại.

### Checklist deliverable

- [x] Thân thể thật (70.5): thương tích có **vị trí, chuỗi nguyên nhân, người
      chăm, biến chứng, di chứng**; đói/mệt/đau **chặn việc** chứ không trừ điểm —
      `core/pham/thanThe.ts` (ADR-0032)
- [x] Sinh kế (70.2): nghề, bậc, thầy trò, làm–học–đổi–truyền; kỹ năng lên từ
      `soNhipDaLam`, không từ nút bấm — `core/pham/sinhKe.ts` (ADR-0035)
- [x] Hộ (70.2): lập, nhập, tách, tan; **kho chung** nên đói chung; thừa kế qua
      `Claim` chứ không qua phép cộng — `core/pham/ho.ts`
- [x] Căn cước: hội đoàn, trạng thái pháp lý, án đã chịu, `duocNhoBoi` — nuôi
      đường Anh Linh của 20.3
- [x] Đối thoại là hành động (70.4): sáu loại phát ngôn có hậu quả, mức hiểu,
      nghe lỏm suy từ vị trí, **nói dối là dữ liệu** — `core/pham/doiThoai.ts`
- [x] Quan hệ một chiều trong hồn của chính chủ thể (11.2) — `core/pham/quanHe.ts`
      (ADR-0033)
- [x] Lịch là **hàm thuần** của hoàn cảnh — `core/pham/lich.ts` (ADR-0031)
- [x] Thăng/giáng hạng T1↔T2 giữ đời sống, nén quan hệ yếu **có đường khôi phục**
      (70.3) — `core/pham/phanGiaiNguoi.ts`
- [x] Chết và ba đường của 20.3: kế thừa · chứng kiến · **Anh Linh Hóa Thần**
      (thêm aspect vào đúng entity ấy) — `core/pham/caiChet.ts`
- [x] Project của người: nghề và quan hệ, tiến độ đo từ thế giới (68.3) —
      `core/pham/duAnNguoi.ts`
- [x] **Sổ Tay** thay hẳn Bảng Thiên Diễn ở tầng phàm nhân (56.1, 56.2) —
      `core/pham/soTay.ts` + `ui/panels/SoTay.tsx`
- [x] Hai tiến trình nền `mortal_daily` và `household_lifecycle`
- [x] Năm bất biến tầng Phàm Nhân — `core/world/batBienPham.ts`

### Gate Phase 7

| #   | Cổng                                                 | Kết quả  | Bằng chứng                                                        |
| --- | ---------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| 1   | Chơi trọn một vòng KHÔNG cần thần can thiệp          | **PASS** | nói chuyện → lập nhà → làm nghề → 30 nhịp, `mode` giữ `pham_nhan` |
| 2   | Mở được Project nghề nghiệp VÀ Project quan hệ       | **PASS** | `ra_nghe` và `gan_lai`, mỗi cái hai chặng đo được                 |
| 3   | NPC ngoài cảnh giữ lịch và vị trí                    | **PASS** | 40 nhịp không ai nhìn, vẫn đúng nơi, vẫn đang làm việc            |
| 4   | Materialize T0 không bịa nguồn lực                   | **PASS** | hộ mới kho RỖNG; tách hộ chia chứ không nhân đôi                  |
| 5   | Một đời bình thường vẫn để lại di sản                | **PASS** | event, học trò mang nghề đi tiếp, và ba đường mở ra               |
| 6   | Sống bằng nghề, học, đổi, truyền nghề                | **PASS** | 4 test; thầy chưa đủ bậc thì không ai học                         |
| 7   | Gãy tay thì KHÔNG tiến bộ nghề mộc                   | **PASS** | `canTroLamNghe` chặn, `lamMotNhip` trả 0 patch                    |
| 8   | Hộ: mở, sở hữu, chia, mất tài sản                    | **PASS** | 5 test; kho hộ tan thì về VÙNG, không bốc hơi                     |
| 9   | Lời hứa và tin đồn tạo Event/Knowledge               | **PASS** | `loi_hua` sinh `Obligation`; nghe lỏm sinh dòng `rumor` 2 chặng   |
| 10  | Bệnh không do Narrator tự quyết                      | **PASS** | thương tích chỉ sinh từ `gayThuongTich`; AI không chạm `mortal`   |
| 11  | Chấn thương tạo giới hạn CỤ THỂ, có đường thích nghi | **PASS** | gãy chân chặn `di_xa`/`chay`, KHÔNG chặn `che_tac`                |
| 12  | Có người chăm thì lành nhanh hơn hẳn                 | **PASS** | so hai nhánh cùng số bước                                         |
| 13  | Chết KHÔNG Game Over; kế thừa giữ claim đúng         | **PASS** | chia đôi ra hai `share = 0.5`, `status = disputed`, tổng = 1      |
| 14  | Anh Linh Hóa Thần giữ nguyên hồn và quan hệ          | **PASS** | `soul` khớp từng byte trước/sau; chỉ THÊM `domain` + `venerable`  |
| 15  | Giáng hạng không xóa đời sống                        | **PASS** | ba quan hệ mạnh giữ nguyên, phần nén mở lại đủ số người           |
| 16  | UI không lộ số engine                                | **PASS** | `quetSoRo()` rỗng trên 20 khóa cấm; trình duyệt xác nhận          |
| 17  | Quan hệ bất đối xứng, không đồng bộ hai chiều        | **PASS** | đổi một chiều, chiều kia đứng yên                                 |
| 18  | Một trăm nhịp có hai tiến trình mới: invariant sạch  | **PASS** | `chayInvariantToanBo().dat`                                       |
| 19  | Determinism không vỡ                                 | **PASS** | cùng seed → cùng hash sau 60 nhịp                                 |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check     pass
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           17 file, 663 test, 663 pass, 0 fail
                         (pham.test.ts: 50 test)
npm run build            ✓ built in 4,46 s
```

### Smoke test trình duyệt

```text
Cổng AI → Khởi Nguyên → "Bỏ qua tất cả" → bấm "Phàm Nhân"

  "Đang nhìn bằng mắt của Phàm Nhân"
  Bảng "NGƯƠI THẤY" (8 rõ · 3 mờ · …)     KHÔNG còn — đúng 56.1
  Sổ Tay                                   hiện, và nó viết:

    Ta là Nga Uyên, thợ bạn nghề đan lưới.
    Ta đang tuổi làm lụng.
    Lúc này ta đang làm nghề đan lưới.

    ĐIỀU TA TIN
    Mọi việc làm đều để lại dấu, và dấu ấy đòi được trả.
    Kẻ mang dấu máu làm ô uế người đứng gần. Phải sống ngoài làng.

    ĐIỀU TA MUỐN
    Sống qua mùa đông này               CHƯA XONG

"Trôi ba mươi nhịp" → nhịp 30 · năm 7, nhân vật còn sống, Sổ Tay cập nhật
Console errors: 0
```

Hai dòng "ĐIỀU TA TIN" là **bản diễn giải của vùng**, không phải văn bản luật gốc
— đó chính là điều 56.3 nói: cùng một database, ở tầng trên "Ô Uế" là một định
luật có hiệu lực đo được; ở đây nó là một tập tục mà không ai giải thích được.

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                                                                                          | Sửa                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `raSoatDuAnThan` (Phase 6b) tách loại Project bằng `id.split('_')[3]`; với `deity_1` nó cho `'1'`, không khớp loại nào, nên **mọi tiến độ đứng ở 0 vĩnh viễn**. Bài test phủ nó lại `return` sớm khi không tìm được ứng viên — hai lỗi che nhau | Khớp theo tên loại có ranh giới `_…_`; test khẳng định ứng viên có thật |
| 2   | Người nói sinh tri thức cho người nghe mà **bản thân không có dòng nào** cho mệnh đề ấy → `khong_tri_thuc_teleport` đỏ ở playtest đầu tiên                                                                                                      | Ghi dòng `witness` cho người nói trước (ADR-0034)                       |
| 3   | `khong_tri_thuc_teleport` đòi tuyến đường giữa hai **người** đứng cùng làng — đúng chữ, sai nghĩa                                                                                                                                               | Cùng nơi thì bỏ phép kiểm quãng đường (ADR-0034)                        |
| 4   | `tachHo()` gọi `lapHo()`, và `lapHo()` đọc state CHƯA áp lô patch nên thấy người kia vẫn ở nhà cũ → **tách hộ tự chặn chính mình**                                                                                                              | Cờ `dangTachTuHo`                                                       |
| 5   | `sinhKe` đọc cứng `kyNang['nghe_chinh']` trong khi fixture dùng tên nghề → thợ cả có tay nghề 0 mà không ai thấy                                                                                                                                | `kyNangCuaNghe()` (ADR-0035)                                            |
| 6   | Sổ Tay in id nghề thô: "thợ bạn dan luoi" — phá đúng thứ mà 56.1 dựng lên                                                                                                                                                                       | `NHAN_NGHE` + `nhanNghe()`                                              |

### Giới hạn đã biết của Phase 7

- **Cưới xin chưa có nghi thức riêng.** `nhapHo(..., 'ban_doi')` làm được phần
  cấu trúc, nhưng lời thề, chứng nhân và của hồi môn thì chưa. Chúng thuộc cùng
  họ với giao ước (69.2) và nên dùng lại cơ chế ấy.
- **Sinh con chưa nối vào hộ.** `population_household` của Phase 5 vẫn cộng vào
  cohort; đứa trẻ chỉ thành entity có tên khi ai đó `vatChatHoa()`. Nối trực tiếp
  "hộ có con mới" là việc của Phase 8 cùng Storyline.
- **Vật là `Claim`, chưa là entity.** Chế tác, buôn bán và trộm cắp hiện chạy trên
  `soHuu: Claim[]` với `targetId` tự do. Kind `item` với `carrier` (lịch sử những
  bàn tay đã cầm) là việc còn nợ; `artifact` hiện chỉ dành cho thần khí.
- **Xét xử chưa có.** `can_cuoc.an` có schema và `phapLy` có năm trạng thái, nhưng
  chưa ai tuyên án: `institution_governance` mới có thuế, kho công và kế vị.
- **Giáng hạng chưa tự động.** `hangNenO()` khai chính sách, nhưng scheduler chưa
  gọi nó theo khoảng cách ống kính — hiện thăng/giáng chỉ chạy khi có người gọi.
- **Trần xử lý mỗi nhịp** là `maxEventsPerTick / 10` người. Đủ cho vài chục người
  có tên; một thành phố nghìn người có tên sẽ cần chia lô theo ống kính.
- Sổ Tay chưa có mục "điều ta nghe được" ở thế giới hạt giống vì chưa ai nói gì —
  nó chỉ đầy lên sau vài lượt đối thoại. Đó là đúng, nhưng nó làm màn đầu tiên
  trông thưa hơn ví dụ trong 56.1.

---

## Phase 8 — done

**Mục tiêu:** AI chỉ kể và đề xuất **trên sự thật engine**.

> Ba phase trước dựng một thế giới chạy được. Phase này trả lời câu hỏi còn lại:
> **thế giới ấy có gì để kể, và ai quyết định kể chuyện nào.** Câu trả lời không
> phải "model tự chọn". Engine giữ mạch truyện, engine chạy nhịp, engine nhớ thứ
> đã gieo, engine chọn chỗ chiếu ống kính — model chỉ viết văn lên cái khung đó.

### Checklist deliverable

- [x] **Mười bốn loại mạch truyện**, tiền đề DÒ từ world state (28.3, 28.4) —
      `core/truyen/loaiMach.ts` (ADR-0037)
- [x] Bảng `storylines` + `foreshadows`, Dexie v7, copy-on-write (ADR-0036)
- [x] Nhịp truyện chạy **bằng engine, không LLM** (28.5) —
      `core/truyen/machTruyen.ts` + tiến trình nền `storyline_beat`
- [x] `chet_yeu` là **kết cục hợp lệ** có `ketCuc` và `tickKet`, không phải lỗi
- [x] **Hạn ngạch vắng mặt** đo theo SỐ CẢNH (28.6) — `hanNgachVangMat()` +
      bất biến `mach_truyen_khong_lay_nguoi_choi_lam_tam`
- [x] Ống kính năm loại mục tiêu, chế độ `tu_dong` seeded, **đổi không tốn lượt**
      (29.1) — `core/truyen/ongKinh.ts`
- [x] Bảy quy tắc Narrator + quy tắc 5 cưỡng chế bằng dữ liệu (29.2)
- [x] **Sổ Phục Bút** (30.2): gieo, trả, quá hạn thành `gap` loại `nhan_qua`;
      bất biến `phuc_but_khong_bien_mat` — `core/truyen/phucBut.ts`
- [x] **Nén có hình dạng truyện** (30.3) với `kiemNenKhongMat()` — `core/truyen/kyUc.ts`
- [x] `moRong()` (6.4) chỉ nhận `WorldView`; `links` và `machTruyen` vào view (ADR-0039)
- [x] Chunk và nhãn tầm nhìn gán **lúc index** (54.2, 54.3) — `core/retrieval/chunk.ts`,
      `chiMuc.ts`; mỗi diễn giải luật là một chunk riêng gắn `vungId`
- [x] **Ba kênh và RRF** (54.1) — `core/retrieval/kenh.ts`; tắt ngữ nghĩa vẫn chạy
- [x] **Ba truy vấn** Q1/Q2/Q3 (54.6) — `dungBaTruyVan()`
- [x] Heuristic rerank deterministic, fusion theo thứ hạng, **MMR** (77.4, 77.6)
- [x] **Token-aware packer** sáu quy tắc, có trace chunk bị cắt (77.7)
- [x] Adapter semantic: mock (`mockAdapter.ts`) và thật (`src/ai/rerankClient.ts`)
- [x] **Circuit breaker** đếm LẦN, fallback heuristic (77.9)
- [x] Bộ đánh giá retrieval và cổng, `forbiddenRecall` bắt buộc 0 (77.10) — `danhGia.ts`
- [x] Ngân sách 34.1, `uocLuong` tiếng Việt 34.2, tự hiệu chỉnh 34.3 — `core/ai/nganSach.ts`
- [x] Assembler tầng 4–6 lấy từ truy hồi; Sổ Phục Bút nằm CUỐI (33.1)
- [x] **Điểm cuối Cập Nhật Biến tách riêng** — món nợ Phase 6b (46.1) — `core/ai/capNhat.ts`
- [x] `<Foreshadow>` và `<Unverified>` (30.2, 54.10) — `bocTach()` mở rộng
- [x] Panel Ống Kính và tab Truy hồi (77.11) — `ui/panels/OngKinh.tsx`, `CongAi.tsx`

### Gate Phase 8

| #   | Cổng                                                 | Kết quả  | Bằng chứng                                                           |
| --- | ---------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| 1   | Mock pass TRƯỚC network                              | **PASS** | `mockReranker`/`mockBoNhung`; 57 test truy hồi chạy không mạng       |
| 2   | Narrator output KHÔNG tự đổi state                   | **PASS** | mọi patch qua `bocTach()`; `ai8.test.ts` bốn bài thẩm quyền          |
| 3   | Updater patch sai bị từ chối                         | **PASS** | có điểm cuối riêng vẫn bị `DUONG_DAN_CAM`/`BANG_CAM` chặn            |
| 4   | Ba tầng KHÔNG rò                                     | **PASS** | `forbiddenCount = 0` ở cả `pham_nhan`/`than`/`sang_the`              |
| 5   | Chunk cấm không có ở candidate, trace, cache, prompt | **PASS** | kiểm ba đường; `ChunkDaChieu` không có trường `noiDung`              |
| 6   | Heuristic cùng input cho cùng thứ hạng               | **PASS** | đảo thứ tự đầu vào cho cùng kết quả; tie-break bằng `chunkId`        |
| 7   | Semantic lỗi/timeout trả heuristic, KHÔNG chặn lượt  | **PASS** | kết quả TRÙNG baseline heuristic; trình duyệt: "Failed to fetch"     |
| 8   | Ngắt mạch ba lần hỏng, hai mươi request bỏ qua       | **PASS** | `machSauHong`/`machSauBoQua`; mạch mở thì KHÔNG gọi endpoint         |
| 9   | Metric retrieval-eval ĐƯỢC LƯU, có baseline          | **PASS** | `retrievalRuns` ghi mỗi lượt; `congEval(hienTai, baseline)`          |
| 10  | Endpoint rerank chết vẫn chơi được                   | **PASS** | trình duyệt: cổng 9009 chết, lượt vẫn xong, mode về `heuristic`      |
| 11  | Token budget CÓ TRACE block bị cắt                   | **PASS** | `PromptGoi.vetCat` và `chunkBiCat`; panel hiện "Đã cắt vì ngân sách" |
| 12  | Mạch truyện chạy khi KHÔNG ai nhìn                   | **PASS** | 60 nhịp không người chơi: mạch sinh, tiến giai đoạn, có mạch kết     |
| 13  | Đa số mạch là chuyện người chơi CHƯA nghe (28.2)     | **PASS** | 40 nhịp cho tỉ lệ vắng từ 40% trở lên; bất biến bắt khi tụt dưới     |
| 14  | Thứ đã gieo KHÔNG biến mất (30.2)                    | **PASS** | quá hạn gấp đôi thành `gap` `nhan_qua`; dòng phục bút vẫn còn        |
| 15  | Nén KHÔNG làm mất nhân quả tự sự (30.3)              | **PASS** | `kiemNenKhongMat()` rỗng; văn giữa chừng mất, nút thắt còn           |
| 16  | Nhịp truyện KHÔNG gọi LLM                            | **PASS** | `choPhepLlm` mặc định false suốt 100 nhịp                            |
| 17  | Ống kính đổi KHÔNG tốn thời gian trong game          | **PASS** | `tick` và `hashState` không đổi sau khi chĩa                         |
| 18  | `moRong()` không thành đường rò                      | **PASS** | mọi nốt trả về đều nằm trong `view.entities`                         |
| 19  | Tầng phàm nhân không nhận khóa engine qua RAG        | **PASS** | chín khóa vắng mặt; không cặp `khóa=số` nào sót                      |
| 20  | Determinism không vỡ                                 | **PASS** | cùng seed cho cùng hash sau 60 nhịp CÓ mạch truyện                   |
| 21  | Save trước v6 vẫn mở được                            | **PASS** | ba Map rỗng, hash khớp; `PHIEN_BAN_SCHEMA = 6`                       |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check .   All matched files use Prettier code style!
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           20 file, 802 test, 802 pass, 0 fail
                         (truyen.test.ts 47 · retrieval.test.ts 62 · ai8.test.ts 27)
npm run build            built in 5,55 s
```

### Smoke test trình duyệt — proxy giả, có cả đường rerank

```text
Cổng AI, quét, chọn "mo-hinh-gia", Sao sang Cập Nhật Biến, Thử đường
                            thông, tự sang Khởi Nguyên
"Bỏ qua tất cả"             thế giới mở; lời kể do MODEL viết
"Trôi ba mươi nhịp"         mạch truyện sinh ra, panel Ống Kính hiện:

  ỐNG KÍNH
  "Cách làm mới của Nga Uyên" — âm ỉ
  "Cách làm mới của Nga Uyên" là mạch căng nhất trong số người chơi biết (15).
  CHĨA SANG (không tốn lượt, không tốn thời gian trong game)
  THẾ GIỚI NGOÀI NGƯỜI CHƠI
  Mới 1/2 cảnh vắng người chơi; kỷ nguyên này cần ít nhất 3 cảnh như thế.
  TRUY HỒI LƯỢT VỪA RỒI
  heuristic · 24 ứng viên, 20 chọn, 22 ms
  1  Nga Uyên sống tiếp, và không ai ghi lại điều đó. · đáng tin, vừa xảy ra, khác nguồn
  2  Ở Trách Trách có người tìm ra cách ủ hạt qua đông. · nghe kể lại · nhân quả

bấm "Phàm Nhân"             lọc tầm nhìn siết còn 4 ứng viên, và trong đó có:
  2  Việc bà đã hứa với người đã chết vẫn chưa làm. (CHƯA TRẢ)
                            phục bút do UPDATER khai, engine ghi sổ,
                            chỉ mục hóa, rồi truy hồi trả về đúng nó

rerank sang proxy thật      "proxy · 3 ứng viên, 3 chọn, 17 ms", lý do "gần nghĩa"
đổi rerank sang cổng chết   "Đã rơi về heuristic: adapter lỗi: Failed to fetch.
                             Lượt chơi không bị chặn." — và lượt vẫn xong

Console errors: 0
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                                                      | Sửa                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | Event phục bút khai `causeEventIds: [evId]`, mà `evId` chỉ vào log khi lượt kể CÓ patch — lượt không đổi gì thì nó trỏ vào hư không. Lỗi hiện ngay ở lượt đầu tiên trong trình duyệt, không hiện trong test | Kể trước, phục bút sau; chỉ khai nhân quả khi Event kể có thật          |
| 2   | Chunk `banTinhTinDoTin` in thẳng `kieuNgao_khiemNhuong=44` xuống tầng phàm nhân — đưa thang đo engine vào miệng dân làng, phá 56.2 quy tắc 1                                                                | `tinhCachThanhLoi()`: dịch trục thành CHỮ, bỏ trục dưới ngưỡng 35       |
| 3   | Mười bốn bộ dò tiền đề chạy MỖI tick làm bài test một trăm năm chậm gấp năm; `tinh_ai` còn `find()` một luật bên trong hai vòng lặp lồng nhau                                                               | Quét tiền đề mỗi NĂM (4 tick); hoist phép `find` ra ngoài vòng lặp      |
| 4   | MMR đặt độ giống cùng nguồn ở 0.85 — với λ = 0.72 thì hai bản kể của cùng sự kiện vẫn vào chung top khi điểm gần nhau, tức đúng cái 54.11 mục 40 gọi là "MMR hỏng"                                          | Cùng `nguonId` cho độ giống bằng **1**; trần cứng ở packer (77.7 mục 3) |
| 5   | Ống kính `tu_dong` lọc theo `nguoiChoiBiet` ở MỌI tầng, nên Sáng Thế Thần — tầng nhìn từ trên xuống — bị khóa mắt vào một chỗ trong khi cả thế giới đang chạy ngay dưới                                     | Tầng `sang_the` thấy hết; hai tầng dưới giữ nguyên luật 28.2            |
| 6   | `hanNgachVangMat` gộp hai điều kiện thành một câu, nên hai cảnh đầu ván mới (100% vắng người chơi) vẫn báo "dưới ngưỡng 40%" — người đọc đi tìm một lỗi không tồn tại                                       | Tách hai câu: chưa đủ TỈ LỆ khác chưa đủ SỐ CẢNH                        |
| 7   | `ongKinhOChoNguoiChoi` trả `true` cho mục tiêu `nguoi_choi` kể cả khi chủ thể là `null`, nên Sáng Thế Thần bị tính là "có mặt trong cảnh" — trái 29.2 quy tắc 7                                             | Không thân xác thì không đứng ở đâu: kiểm `chuTheId === null` TRƯỚC     |
| 8   | `vite.config.ts` khóa cứng cổng 5173; phiên thứ hai trên cùng máy im lặng nhảy cổng và công cụ bên ngoài không biết                                                                                         | Đọc `PORT` từ môi trường, `strictPort` khi được chỉ định                |

### Vòng siết Phase 8

Sáu trong tám giới hạn tự ghi ở vòng đầu đã được đóng. Mục này ghi **cái gì đã
đổi và vì sao**, để không ai phải so hai bản tài liệu với nhau.

| Giới hạn vòng đầu                             | Trạng thái | Đóng bằng                                                       |
| --------------------------------------------- | ---------- | --------------------------------------------------------------- |
| Nhịp truyện chưa ĐỔI thế giới (28.5)          | **đóng**   | `BienDoiTuSu`: ký ức và cảm xúc, không chạm vật chất (ADR-0040) |
| `nenCuoiKyNguyen()` chưa có ai gọi (30.3)     | **đóng**   | Mốc kỷ nguyên là phép chia trên tick (ADR-0041)                 |
| Cache rerank chưa nối vào đường chơi (77.8)   | **đóng**   | Hợp đồng cache thành bất đồng bộ; store nối `KhoRerankCache`    |
| `tuHieuChinh()` chưa nhận số thật (34.3)      | **đóng**   | `rutSoDung()` đọc `usage` của cả bốn phương ngữ                 |
| Nút "Chạy bộ đánh giá" chưa có (77.11)        | **đóng**   | Bộ đề tự nhãn từ luật 18.2 (ADR-0042), nút ở panel Ống Kính     |
| Ống kính chỉ chĩa được mạch và tự động (29.1) | **đóng**   | Thêm `nhan_vat` và `vung`; lọc còn người và thần                |
| Kênh ngữ nghĩa chưa có endpoint thật (54.4)   | còn nợ     | cần chỉ mục tăng dần của 54.8 — xem dưới                        |
| Không có cửa vào Cài Đặt AI khi đang chơi     | còn nợ     | router cài đặt là Phase 11                                      |

**Ba lỗi thật bắt được trong vòng siết:**

| #   | Vấn đề                                                                                                                                                                                                             | Sửa                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 9   | `tyLeTrungNguon` chia cho SỐ CHUNK TRẢ VỀ, nên một truy vấn hẹp trả ba chunk mà hai cùng nguồn ra 67% và đỏ cổng — trong khi 54.11 nói hai chunk cùng nguồn là bình thường. Đơn vị của quy tắc là CHỖ trong top-10 | Mẫu số cố định bằng 10; cổng đọc đúng "hơn 6 trong 10"                   |
| 10  | Ống kính `nhan_vat` liệt kê cả khái niệm và điều luật ("theo Ô Uế", "theo Luật Nền") — một khái niệm không đứng ở đâu để mà chiếu vào                                                                              | Lọc còn `mortal` và `deity`                                              |
| 11  | Cache ghi cả kết quả SINH RA TỪ FALLBACK, tức khóa cả nhánh vào một tai nạn mạng suốt `cacheTtlTicks` nhịp kể cả sau khi endpoint sống lại                                                                         | Chỉ cache khi `fallbackReason === ''`; ngắt mạch đã đủ để tránh gọi mạng |

**Bằng chứng trình duyệt của vòng siết** (proxy giả, cùng phiên):

```text
"Chạy bộ đánh giá"          4 bài · Recall@20 63% · nDCG@10 0.454
                            dữ liệu vượt quyền lọt ra: 0
                            đạt · forbidden recall = 0 ở mọi mode
                            đạt · top-10 không quá 6 chunk cùng nguonId
                                  (nguồn dày nhất chiếm 1/10 chỗ)
                            đạt · fallback rate không quá 30%

CHĨA SANG                   Tự động · hai mạch · ở Sơ Trách · ở Trách Trách
                            · theo Lam Mộc · theo Nga Uyên

trôi tới nhịp 210 (năm 52)  qua mốc kỷ nguyên, 0 console error; ống kính đổi lý do:
                            "Cách làm mới của Nga Uyên" đang treo một phục bút chưa trả.
                            THẾ GIỚI NGOÀI NGƯỜI CHƠI: 8/8 cảnh không có người chơi
```

Dòng cuối là thứ đáng nhìn nhất: hạn ngạch vắng mặt của 28.6 đã tự đạt sau vài
chục nhịp, và ống kính đổi chỗ chiếu vì **một món nợ tự sự** chứ không vì căng
thẳng — tức 30.2 đang lái 29.1, đúng như đặc tả nói nó phải làm.

### Giới hạn đã biết của Phase 8

- **Kênh ngữ nghĩa chưa có endpoint thật.** `EmbedConfigSchema` (54.4) chưa được
  khai vào cấu hình, nên trong app RAG luôn chạy **hai kênh** (từ vựng và đồ thị)
  và panel nói đúng điều đó: _"Kênh ngữ nghĩa không chạy — RAG tiếp tục với hai
  kênh còn lại."_ Đây là suy giảm êm đúng như 54.4 đòi.

  **Vì sao KHÔNG làm trong vòng siết này:** chỉ mục hiện được dựng lại mỗi lượt
  (`dungChiMuc()` là hàm thuần trên `WorldState`). Nhúng lại toàn bộ chunk mỗi
  lượt là một lời gọi mạng cho mỗi chunk mỗi lần người chơi gõ một câu — không
  dùng được. Kênh ngữ nghĩa thật cần hàng đợi index tăng dần của 54.8, mà 54.8
  nằm ở Phase 10. Làm ngược thứ tự sẽ cho ra một tính năng đắt và chậm.

- **Bảng `chunks` của Dexie v7 vẫn chưa được ghi.** Nó có index sẵn cho ngày
  54.8 tới; hiện chỉ mục sống trong bộ nhớ một lượt.

- **Không có cửa vào Cài Đặt AI khi đang chơi.** Tab Truy hồi nằm trên màn Cổng
  AI, mà màn ấy chỉ hiện khi cổng đóng. Đổi cấu hình rerank giữa ván hiện phải
  qua ba lần hỏng liên tiếp. Router cài đặt là việc của Phase 11. (Nút "Chạy bộ
  đánh giá" thì **đã** vào được từ trong game — nó nằm ở panel Ống Kính.)

- **Hạn ngạch vắng mặt đo theo PHIÊN, chưa theo kỷ nguyên.** `canhDaKe` là một
  mảng trong store với cửa sổ 40 cảnh gần nhất. 28.6 nói "mỗi kỷ nguyên"; giờ đã
  có mốc kỷ nguyên (ADR-0041) nên cắt cửa sổ theo mốc là việc làm được, chỉ là
  chưa làm.

- **`tuHieuChinh()` chỉ chạy khi proxy khai `usage`.** Rất nhiều proxy không
  khai. Lúc ấy `tyLeToken` đứng ở 3.2 và hàm **không chỉnh gì** — cố ý: chỉnh
  theo một con số đoán còn tệ hơn để nguyên, vì sai số sẽ tích lũy mà không có
  gì bắt được. `finish_reason = 'length'` thì vẫn bắt được kể cả khi thiếu `usage`.

- **Bộ đánh giá chưa lưu lịch sử chỉ số.** Mỗi lần bấm là một lần đo mới;
  `retrievalRuns` giữ từng lượt truy hồi nhưng chưa có bảng "kết quả eval theo
  thời gian" để vẽ đường hồi quy. 77.10 đòi có baseline — điều đó **đã** đạt
  (mỗi lần chạy tự đo baseline heuristic trước), nhưng so giữa hai phiên thì chưa.

---

## Phase 9 — done

**Mục tiêu:** nhập được preset của người khác **mà không cho nó chạy**.

> Câu đứng trên cả phase: **nhập không phải kích hoạt; lưu được toàn bộ không có
> nghĩa là được phép chạy toàn bộ.** Mọi kiểu dữ liệu trong `core/preset/` được
> dựng quanh câu ấy — `PromptModule.activation` giữ SÁU trạng thái thay vì một cờ
> boolean, và `PresetActivation` là bản ghi riêng nên nhập một file không chạm tới nó.

### Checklist deliverable

- [x] `ImportEnvelope` giữ **raw source bất biến** theo hash (62.2) — `preset/schema.ts`
- [x] Sniff bằng **hình dạng**, không bằng tên file (63.2); dưới ngưỡng thì trả
      `unknown_json` **kèm danh sách khóa đã thấy** — `doDinhDang.ts`
- [x] SHA-256 thuần TS, đối chiếu `node:crypto` + vector NIST (ADR-0043) — `sha256.ts`
- [x] Pipeline **mười hai bước** (63.1), dừng đâu báo đó — `nhap.ts`
- [x] Chuẩn hóa order/enabled/marker/lane theo 63.3 và 63.4 — `chuanHoa.ts`
- [x] **Macro AST** (63.5): lồng nhau, namespace `preset.<packId>`, `{{random}}`
      seeded, cycle có đường dẫn, depth theo tuning — `macro.ts`
- [x] Tham số **giữ raw**, clamp theo `ModelProfile`, có bảng diff ba trạng thái (62.4)
- [x] Quét an toàn: secret, URL, `__proto__`, bảy nhãn rủi ro (64.4, 64.5) — `anToan.ts`
- [x] Regex sandbox ba lớp (ADR-0045) + sanitizer — `sandbox.ts`
- [x] Conflict key 15 khóa + sáu chiến lược; **cycle KHÔNG tự bẻ** (65.1, 65.2) — `xungDot.ts`
- [x] Compiler thứ tự **bất biến** 0–6; module ngoài không bao giờ được cấp tầng < 4 (63.6)
- [x] Thẻ output legacy thành **ứng viên trình bày**; suy luận bị BỎ (63.8) — `theLegacy.ts`
- [x] Kích hoạt là transaction, hoàn tác chỉ đổi con trỏ, diff sáu chiều (65.4, 65.5)
- [x] Wizard **bảy màn**, quay lại không parse lại; báo cáo sáu dòng số (66.1, 66.2)
- [x] Dexie v8: `presetPacks`, `presetRaw`, `presetActivations` (ADR-0046)

### Gate Phase 9

| #   | Cổng                                       | Kết quả  | Bằng chứng                                                               |
| --- | ------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| 1   | Hai fixture đúng hash / count / mismatch   | **PASS** | A: 182·175·75·**21**·7·8/4·5/3 · B: 179·178·134·0·1·21/20·4/3            |
| 2   | Import không network hoặc side effect      | **PASS** | quét mã nguồn 12 file: 0 `fetch`/DB/storage; cây JSON vào không bị sửa   |
| 3   | Không script nào chạy                      | **PASS** | 9 helper script vào `quarantined` dù nguồn bật; regex chỉ được BIÊN      |
| 4   | Không module ngoài vào Updater mặc định    | **PASS** | ba pipeline kia chỉ còn message `td:*`; ép `targetPipelines` vẫn bị chặn |
| 5   | Preset không đọc/ghi hồ sơ riêng hay canon | **PASS** | `{{user}}` chỉ nhận persona chiếu; `TEN_BI_CHE` vắng ở cả bốn pipeline   |
| 6   | Tắt pack trả prompt native đúng byte/hash  | **PASS** | bật → tắt cho lại ĐÚNG hash native ban đầu                               |
| 7   | 100 tick sau import, engine vẫn đúng       | **PASS** | hash trùng hệt bản không import; `world.tick = 100`, 0 tick bị từ chối   |

### Mười hai mục của 66.5

| Mục                                          | Kết quả  | Ghi chú                                                     |
| -------------------------------------------- | -------- | ----------------------------------------------------------- |
| Hash World/Event không đổi sau import        | **PASS** | `hashState` và số Event bằng nhau trước/sau                 |
| Không network request                        | **PASS** | không import nào tới `src/ai/` hay `src/db/`                |
| Không script execution                       | **PASS** | `quarantined`; không nhánh nào trong code chạy nó           |
| Không ghi localStorage                       | **PASS** | quét mã nguồn                                               |
| Không đổi endpoint                           | **PASS** | `nhapPreset()` không có tham số endpoint                    |
| Không module nào vào Updater                 | **PASS** | cổng 4                                                      |
| Compile Narrator không đọc `view.suongMu.mu` | **PASS** | `TEN_BI_CHE` không xuất hiện trong prompt                   |
| Output format không phá `PatchParser`        | **PASS** | `bocTach()` vẫn nhận `<CapNhat>` giữa đầy thẻ legacy        |
| Tắt pack trả prompt native                   | **PASS** | cổng 6                                                      |
| Hoàn tác không mất lịch sử                   | **PASS** | activation cũ giữ nguyên `selectedModuleIds`                |
| Import lại cùng hash không nhân đôi          | **PASS** | dừng ở bước 3, chỉ ra pack đã có                            |
| Export lại vẫn chứa raw phần chưa hỗ trợ     | **PASS** | `rawSource.noiDung` bằng từng byte; `unknown` giữ 4 tham số |

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                 | Sửa                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Bộ dò regex nguy hiểm bắt cả nhóm luân phiên lành tính, nên 21 regex thật của fixture B sẽ rơi hết vào `needs_adapter` | Chỉ chặn lượng từ LỒNG và nhóm có hai nhánh TRÙNG NHAU       |
| 2   | `motTick()` không sửa `state`; bài "100 tick" ban đầu so hai thế giới đều đứng yên nên xanh mà không chứng minh gì     | Áp Event của từng tick qua `apDungEvent` như `world.test.ts` |

### Giới hạn đã biết của Phase 9

- **Xưởng Preset chưa có UI.** `wizard.ts` là máy trạng thái đầy đủ bảy màn và
  `baoCaoNhap()` dựng đủ sáu dòng số, nhưng ba cột kính của 66.1 là việc Phase 11.
- **Adapter extension chưa có cái nào.** `ExtensionAdapterManifestSchema` đã khóa
  hợp đồng bốn capability; chưa adapter nào được viết, nên 9 helper script của hai
  fixture vẫn nằm nguyên ở `quarantined` — đúng trạng thái 64.2 mô tả.
- **Bundle nhiều loại phải nhập từng loại một.** `doDinhDang()` nhận ra lorebook và
  registry pack rồi từ chối **có lý do**, chỉ sang đúng trình nhập (`lore/nhap.ts`,
  `registry/packDsl.ts`) — nhưng chưa tách bundle hộ người dùng.

---

## Phase 10 — done

**Mục tiêu:** thế giới có **vật lý của riêng nó**, và lorebook thôi nói dối về
chuyện đã rồi.

> Khối L trả lời "một luật mạnh tới đâu": mạnh đúng bằng mắt xích yếu nhất của
> nó. Khối O trả lời "khi thần thoại nguồn va với lịch sử thật thì ai thắng":
> lịch sử, luôn luôn — vì **không được nói dối về chuyện đã rồi**.

### Checklist deliverable

- [x] **Tiếp Địa** (42.2) + `tinhHieuLuc()` dùng **min** (42.4) + kiểm tra thứ tám
      (42.6) + bảng panel (42.7) — `vatly/tiepDia.ts`
- [x] Ba chế độ `chat_che` / `tu_tiep_dia` / `tu_suy`; hai chế độ mềm **không bao
      giờ trượt**
- [x] Đánh vào khái niệm làm luật tụt hiệu lực **mà không bãi bỏ** (42.5), và
      đường ngược lại — mạch `phuc_hung`
- [x] **Bảy trục Luật Nền** (43.3, 43.4), vô danh/có tên, thứ tự phụ thuộc (43.5),
      sửa **bắt buộc phân nhánh** (43.6), tự kết tinh (43.7) — `vatly/luatNen.ts`
- [x] `khoangCach = 'y_nghia'` đổi định nghĩa lân cận — `canhLienKeYNghia()`
- [x] Mạch **`dat_ten`** (43.2 [BB]) với tiền đề DÒ từ luật nền
- [x] **Bốn Cơ Chế Phái Sinh** + phát hiện/công bố cuối kỷ nguyên (44.3, 44.4);
      `moTaKhiKhong` là trường **bắt buộc** — `vatly/coChe.ts`
- [x] Lorebook ba định dạng tự dò, `<user>` là **lỗi**, dải `order` năm khoảng
      (35.3, 51.5) — `lore/nhap.ts`
- [x] **Sử thắng Nguồn** (51.2), đối soát bốn quan hệ (51.3), khóa canon (51.4),
      chống ô nhiễm và vòng tự khẳng định (51.6) — `lore/doiSoat.ts`
- [x] Bảy op cấp AI + **bảng quyền** 52.2; op trượt thì bỏ op đó (52.4); xóa mềm + thùng rác ba kỷ nguyên (52.3); lịch sử 20 mục (52.5) — `lore/ops.ts`
- [x] `doTinCay` chỉ từ **sự kiện engine** (51.6, 53.4); keyword rút từ **văn bản
      thật** (53.2); trần token đòi **tách** (53.3); brief không câu hỏi mở (53.5)
- [x] `LoreExpectation` là **điểm hút** không phải kịch bản (35.4); **Dị Bản** đủ
      bốn thứ bắt buộc + gap (35.5); Bản Đồ Dị Biệt (35.6) — `lore/kyVong.ts`
- [x] Kiểu F của 51.1: kỳ vọng thành `bat_kha` → entry gốc bị che **cùng lúc**
- [x] `WorkflowTask` bảy giai đoạn, **bốn chế độ lịch** với thời gian truyện (50.4)
- [x] **Họ bản sao**: 30 mục → 30 call, lô 5, một cái hỏng không kéo sập 29 cái kia
- [x] Chuỗi dự phòng API; output ngắn hơn `doDaiToiThieu` coi là **trượt**
- [x] `json_patch` với op **`delta`** cộng dồn (50.6) — `workflow/dichGhi.ts`
- [x] Ba đích ghi; `ghi_lorebook` **chống đệ quy bắt buộc** và **không bao giờ**
      ghi lorebook người dùng (50.7, 50.10)
- [x] Bảy tác vụ dựng sẵn + năm preset + xuất/nhập một file JSON (50.8, 50.9)
- [x] Sáu chẩn đoán 31–36; mục 36 là **hỏng nặng** (50.12)
- [x] **Hợp nhánh** có conflict report, giá −35, NPC nhớ hai bản (26.3, ADR-0048)
- [x] **Diễn Hóa**: lằn ranh cứng lọc từng patch, chín điểm dừng thông minh, log + ảnh chụp, báo cáo giọng biên niên (47.3–47.6) — `world/dienHoa.ts`
- [x] **World pack DSL** bốn hàng rào; `handlerId` lạ vào `can_adapter` chứ không
      làm hỏng cả pack — `registry/packDsl.ts`
- [x] **Benchmark rerank** sau baseline heuristic, lịch sử chỉ số so được giữa hai
      phiên (77.10) — `retrieval/benchmark.ts`
- [x] Bảy bất biến mới, bốn mức `fatal` — `world/batBienP10.ts`
- [x] Ba nhóm tuning mới: `vatLy`, `lore`, `workflow` (7.1 [BB])

### Gate Phase 10

| #   | Cổng                                                    | Kết quả  | Bằng chứng                                                                    |
| --- | ------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| 1   | RAG không lộ chunk                                      | **PASS** | `forbiddenRecall = 0` ở mọi mode; entry `doTinCay < 20` không được nạp        |
| 2   | Rerank giữ/tăng nDCG, KHÔNG đánh đổi `forbidden recall` | **PASS** | rò chunk cấm → `khong_dung_duoc` **dù nDCG cao hơn baseline**                 |
| 3   | Workflow không ghi lorebook người dùng                  | **PASS** | `ghiLorebook()` trả `severity: fatal`; bất biến chặn ở mức transaction        |
| 4   | Imported registry không chứa code                       | **PASS** | 5 payload (eval, Function, script, `javascript:`, `__proto__`) đều bị từ chối |
| 5   | Merge có conflict report                                | **PASS** | thiếu một quyết định → `chuaQuyetDinh`, KHÔNG dùng đề xuất thay người chơi    |
| 6   | Tắt feature không làm core hỏng                         | **PASS** | 100 tick với năm Map rỗng: invariant sạch; bật rồi tắt cho lại đúng hash      |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check .   All matched files use Prettier code style!
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           22 file, 1040 test, 1040 pass, 0 fail
                         (preset.test.ts 107 · phase10.test.ts 126 · db.test.ts 58)
npm run build            ✓ built in 6,34s
                         235 module, dist/assets/index-*.js 744,60 kB (gzip 235,92 kB)
```

### Rà soát trình duyệt — Dexie v8 mở thật

```text
npm run dev              cổng 52104
màn Cổng AI hiện đủ      Tường Thuật · Cập Nhật Biến · Diễn Hóa · Truy hồi
Console errors           0

indexedDB.open('thien-dien'):
  version   80          (Dexie v8)
  soBang    32
  bangMoi   substrateLaws · coChe · lorebooks · loreExpectations · diBan
            presetPacks · presetRaw · presetActivations · benchmarkRuns
```

Chín bảng mới có mặt và app vẫn vào thẳng màn Cổng AI — nâng version không ép
người chơi làm lại gì, đúng cam kết của v4, v5 và v7.

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                      | Sửa                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | `\b` cuối một mẫu tiếng Việt không bao giờ khớp vì `\w` của JavaScript là ASCII và "trị" kết thúc bằng `ị`; bộ phân loại mâu thuẫn trả `bo_sung` cho mọi cặp entry, im lặng | Bỏ `\b` cuối mọi mẫu tiếng Việt; ghi lý do tại chỗ (ADR-0047) |
| 2   | `gopNhanh()` dùng `set` cho thực thể chung, nhưng nhánh đích là nhánh MỚI nên chưa có bản ghi nào — lỗi chỉ lộ khi người chơi thật sự bấm hợp                               | Mọi bản ghi vào nhánh đích dùng `link` (ADR-0048)             |
| 3   | `.prefault({})` trên bốn schema workflow có trường bắt buộc — Zod 4 từ chối ở mức kiểu, đúng lại ADR-0002 lần thứ hai                                                       | Bỏ `prefault`, dùng `.strict()`; nơi gọi tự truyền giá trị    |
| 4   | Bộ trích ứng viên keyword loại mọi từ xuất hiện quá 30% số cảnh — với một bộ đề ba cảnh thì chủ ngữ chính bị loại đầu tiên                                                  | Giữ luật 53.2; test dựng mười cảnh cho tỉ lệ có nghĩa         |

### Giới hạn đã biết của Phase 10

- **Panel Vật Lý Thế Giới, Bảng Đối Soát và Bản Đồ Dị Biệt chưa có UI.**
  `bangLuatNen()`, `bangCoChe()`, `bangTiepDia()`, `bangDoiSoat()` và
  `banDoDiBiet()` dựng đủ nội dung dạng dữ liệu; ba màn hình của 35.6, 44.5 và
  51.7 là việc Phase 11.
- **Vòng lặp Diễn Hóa chưa nối vào store.** `locPatchTheoLanRanh()`,
  `kiemDieuKienDung()` và `baoCaoDienHoa()` là ba mảnh đủ để chạy 47.2, nhưng nút
  bấm và thanh tiến trình của 47.7 cần router của Phase 11.
- **Bộ chạy workflow chưa cắm assembler thật.** `chayDuongOng()` nhận `dungPrompt`
  tiêm vào; đường chơi thật cần một bộ dựng đọc `TaskContext.tangAssembler` và
  `quyTacTrich` — hiện test tiêm hàm thuần.
- **Kênh ngữ nghĩa vẫn chưa có chỉ mục tăng dần (54.8).** Món nợ ghi ở cuối
  Phase 8 chưa trả: `benchmark.ts` đo được semantic khi có adapter, nhưng bảng
  `chunks` của Dexie vẫn chưa được ghi nên chỉ mục còn sống trong bộ nhớ một lượt.
- **Cơ chế phái sinh mới có phần PHÁT HIỆN.** `quetCoChe()` bật/tắt đúng và
  `hauQuaKhiTat()` liệt kê đúng thứ bị ảnh hưởng; `thanBi()`, `keoBanTinh()` và
  `hauQuaVuKhiKhaiNiem()` là công thức thuần chưa được tick gọi. Nối chúng vào
  vòng kỷ nguyên là việc còn lại.
- **Bundle 744 kB.** Vượt trần cảnh báo 500 kB của Vite. Code-split theo màn là
  việc Phase 11–12; hiện chưa ảnh hưởng cổng nào.

---

## Phase 11 — done

**Mục tiêu:** mọi hệ quan trọng quan sát và xử lý được — và preset nhập vào thì
thật sự chạy.

> Người dùng mở phase này bằng một câu: _"hình như nó đang làm chệch hướng, và
> tôi muốn các thứ trong preset phải tương thích và dùng được hết trong app mà
> không gây xung đột."_ Câu ấy đúng, và nguyên nhân cụ thể hơn cảm giác: repo có
> **hai bộ dựng prompt không bao giờ gặp nhau**. Xem ADR-0049.

### Checklist deliverable

- [x] **Phép chiếu mở rộng** — `thoiCuoc`, `chiSo`, `luatNen`, `coChe`, `diBiet`,
      `phucBut`, `loiCau`, `loHong` vào `WorldView`, cắt theo tầng đúng 55.5 và
      58.12 — `project/chieu.ts`
- [x] **Bảng Thiên Diễn** tám vùng thứ tự cố định (55.3), sáu quy tắc trình bày
      (55.6), sparkline một nét, delta theo hướng tốt/xấu — `core/bang/thienDien.ts`
- [x] **Thanh Thiên Tượng** (55.2) luôn hiện, ghim được, mọi cụm có nhãn chữ
- [x] **Ảnh chụp vật chất hoá** ở ranh giới tick (55.8); ảnh của tầng khác bị VỨT
      chứ không trộn; `tickXemCuoi` nullable để nhịp 0 không bị hiểu là "chưa mở"
- [x] Vùng **"Từ lần trước"** so TẬP TÊN chứ không so con số (55.4)
- [x] Vùng **"Cần chú ý"** tám nguồn, mỗi mục mang `dich` mở thẳng tới chỗ xử lý
- [x] **Bảng Thông Tin Thiên Địa** sáu tab, dải định vị dính khi cuộn (58.4), tìm
      kiếm chạy SAU chiếu (58.12), câu rỗng riêng từng tab (58.13)
- [x] Tab **Ta** đổi tên theo tầng; chuỗi hệ quả đi theo link THẬT, không bịa mắt xích
- [x] **`provenance`** (59.1) — aspect thứ 27, ghi tại nơi sinh, chiếu theo tầng
- [x] **Một đường prompt** — `bienSoanLuot()` là cửa duy nhất; marker lắp bằng nội
      dung native đã chiếu (63.4); slot pack không khai thì nội dung vẫn tới model
- [x] **Assistant prefill** qua cả ba phương ngữ; model không nhận thì bỏ kèm issue
- [x] **Tương thích MVU** — thẻ `<UpdateVariable>`, bản đồ đường dẫn 31.7, câu lệnh
      `_.set(...)`; đường dẫn ngoài thế giới thành biến pack, không thành patch
- [x] `<thinking>` bị cắt khỏi lời kể ở bộ bóc tách (66.6 hàng "COT cleaner")
- [x] **Xưởng Preset** — nhập, báo cáo sáu dòng (66.2), giải xung đột, bật/tắt,
      biến pack, script bị cách ly, bảng đường port 66.6
- [x] **Tự Chẩn Đoán** — mỗi mục hỏng kèm câu hành động cụ thể
- [x] **Router màn** + cửa vào Cài Đặt AI khi đang chơi — món nợ từ Phase 8
- [x] Phím `Tab` / `I` / `Esc`; [BB] 58.1 không bao giờ hai lớp phủ chồng nhau
- [x] **Dexie v9** — `presetVars` `[packId+branchId]`, `uiState` `[saveId+branchId]`
- [x] **Responsive** — dưới 900 px bố cục ba cột co thành cột dọc, rail thành thanh
      ngang, thân trang không bao giờ cuộn ngang

### Gate Phase 11

| #   | Cổng                                       | Kết quả  | Bằng chứng                                                                     |
| --- | ------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| 1   | Bảng mở < 16 ms với snapshot 50.000 entity | **PASS** | đo lần nhanh nhất trong năm lần; ngưỡng 16 ms giữ nguyên                       |
| 2   | Không rò rỉ giữa ba tầng                   | **PASS** | phàm nhân: `theGioiLaGi`/`coGiTonTai`/`dangTheNao` = `null`, `provenance` xóa  |
| 3   | Không thao tác chỉ dựa màu                 | **PASS** | delta có dấu + số; `●/○` thay bằng chữ "đã biết"/"chưa nghe"                   |
| 4   | Không raw id/enum trên UI                  | **PASS** | test máy kiểm mọi trường hiển thị; bắt được `vu_tru` lọt ra khi chạy thật      |
| 5   | Mobile dùng được                           | **PASS** | đo ở 739 px: khung `column`, rail `row`, thân trang không cuộn ngang           |
| 6   | Preset thật sự vào prompt                  | **PASS** | fixture A: 3 message, system 19 KB, prefill riêng, `<CapNhat>` ở message user  |
| 7   | Thứ tự quyền 65.3 giữ nguyên               | **PASS** | vị trí trong prompt: an toàn 2 → engine 280 → lõi native 896 → pack ngoài 3772 |
| 8   | Tắt pack trả prompt native                 | **PASS** | `compiled = null`, `packDaDung = []`, bảy quy tắc Narrator còn nguyên          |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --check .   All matched files use Prettier code style!
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           24 file, 1080 test, 1080 pass, 0 fail
                         (bang.test.ts 22 · hopNhat.test.ts 18)
npm run build            ✓ built in 5,08s
                         dist/assets/index-*.js 873,58 kB (gzip 279,85 kB)
```

### Rà soát trình duyệt — chạy thật, không phải đọc code

```text
npm run dev              cổng 5173
indexedDB version        90 (Dexie v9) · presetVars và uiState có mặt
Console errors           0

Nhập fixture A thật:     182 prompt · 8 regex · 5 helper script  (khớp đặc tả)
Báo cáo 66.2:            8 native · 174 adapted · 1 nhóm xung đột · 5 script cách ly
Sau khi giải xung đột:   pack bật được; 57/182 module vào prompt
Gọi model:               3 message · system 19.033 ký tự · prefill riêng
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                             | Sửa                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | `tickXemCuoi = 0` dùng làm dấu "chưa từng mở Bảng" — thế giới vừa khai thiên đứng ở nhịp 0, nên vùng "Từ lần trước" vĩnh viễn rỗng | Đổi sang `null`; test bắt đúng trường hợp này                                |
| 2   | `vu_tru` lọt lên bảng giữa hai cột tiếng Việt, vi phạm 58.13 — chỉ lộ khi chạy thật trong trình duyệt                              | Thêm `NHAN_PHAM_VI`, `NHAN_GIAI_DOAN`; test máy kiểm mọi trường hiển thị     |
| 3   | Fixture A có hai module cùng `history.wrapper`; không có màn giải xung đột nên pack **vĩnh viễn không bật được** (ADR-0052)        | Khối giải xung đột dựng từ THƯ VIỆN; lựa chọn lưu theo `packId`              |
| 4   | Mặc định chỉ bật module `native`, bỏ 174 module `adapted` — nhập vào rồi vẫn không dùng được                                       | [BB] 64.1: `adapted` là trạng thái hoạt động; loại đúng ba trạng thái bị cấm |
| 5   | `napTuDia()` của store UI nhận `WorldView`, mà `view` đổi mỗi lượt → `useEffect` nạp lại đĩa mỗi lượt và ghi đè ảnh chụp đang có   | Bỏ tham số `view`; ảnh chụp đầu tiên do `chupTheoTick()` dựng                |

### Giới hạn đã biết của Phase 11

- **Bốn màn còn nợ:** Xưởng Workflow (50.11), Xưởng Registry (5.4), Lorebook +
  Bảng Đối Soát (51.7) + Bản Đồ Dị Biệt (35.6), Bản Đồ Nhánh (26.2). Router đã
  khai đủ id màn và mục "Cần chú ý" đã trỏ tới chúng, nhưng component chưa có —
  bấm vào hiện Sảnh. Dữ liệu thì sẵn: `bangDoiSoat()`, `banDoDiBiet()`,
  `bangLuatNen()`, `bangCoChe()` đều dựng đủ nội dung từ Phase 10.
- **Wizard hồ sơ vẫn là hai chế độ.** 78.5 đòi bốn (`Nhanh | Gợi ý | Đầy đủ |
Bỏ qua`) kèm privacy diff; màn Khởi Nguyên hiện có `Nhanh` và `Bỏ qua`. Hai chế
  độ còn lại và bảng privacy diff là việc còn lại của cổng "onboarding dùng được
  hoàn toàn bằng bàn phím, có `Bỏ qua` rõ ràng".
- **Vòng lặp Diễn Hóa vẫn chưa nối vào store** — món nợ mang từ Phase 10 sang.
  Router đã có chỗ cho nó; `locPatchTheoLanRanh()` và `baoCaoDienHoa()` vẫn là ba
  mảnh rời.
- **Ghim vào Thanh Thiên Tượng chưa có menu chuột phải.** `thanhThienTuong()` đọc
  `anh.ghim` đúng và lưu theo save, nhưng chưa có đường bấm để thêm mục.
- **E2E ba tầng chưa tự động hoá.** Đã chạy tay trong trình duyệt (bằng chứng ở
  trên), chưa có bộ chạy tự động — việc Phase 12.
- **Bundle 873 kB.** Tăng thêm 129 kB so với Phase 10. Code-split theo màn là việc
  Phase 12; router đã tách sẵn ranh giới để làm việc đó.

---

## Phase 12 — done

**Mục tiêu:** hardening và phát hành — cộng bốn yêu cầu người dùng mở phase này
bằng một câu:

> _"bắt toàn bộ trong game phải có AI mới chơi được, bỏ đi việc không có cũng
> chơi được, cũng như chỉ khi chơi mới có mấy cái như quy luật đang có chứ không
> phải có sẵn như hiện tại, liên kết các chức năng lại với nhau, khi mới vào giao
> diện sẽ là bắt đầu / tiếp tục / file save, cài đặt có preset, lorebook,
> workflow và cài đặt proxy."_

Bốn yêu cầu ấy thành ADR-0053 tới ADR-0056. Phần hardening theo đúng danh sách
deliverable của Prompt IDE.

### Checklist deliverable — bốn yêu cầu người dùng

- [x] **Thế giới mở ra HƯ VÔ** (ADR-0055) — `moTheGioiTrong()` phát 0 entity, 0
      luật, 0 khái niệm. Hạt giống tám entity cũ lùi về làm fixture của test, và
      có cổng quét mã nguồn cấm `src/store` / `src/ui` nhập nó
- [x] Tầng 2 của prompt phát khối `HƯ VÔ` khi `view` rỗng, nói thẳng cách tạo
      thực thể qua `<CapNhat>` — không nói thì model tự lấp bằng thần thoại nó
      thuộc lòng rồi engine từ chối hết
- [x] `eventGieoNen()` chạy lại sau **mỗi** lượt có patch — `place` đầu tiên nay
      ra đời giữa một lượt kể, và vùng thiếu `dan_cu` bị 71.2 bỏ qua trong im lặng
- [x] **AI bắt buộc toàn phần** (ADR-0056) — gỡ `chi_engine` khỏi schema;
      `luotChuaKe` chặn mọi hành động cho tới khi `keLai()` thành công
- [x] Câu _"thế giới vẫn giữ nguyên chỗ đang dở"_ bị thay: nó **sai**, Event của
      lượt ấy đã vào log trước khi model được gọi
- [x] **Sảnh Vào** — Tiếp tục · Bắt đầu · File save · Cài đặt (ADR-0054)
- [x] `db/quanLySave.ts` — liệt kê, đổi tên, xóa (từ chối nhánh còn con), xuất
      một ván **không cần mở nó**
- [x] Tự lưu sau mỗi lượt kể trọn vẹn; `roiVan()` lưu trước khi rời
- [x] **Cài Đặt bốn tab** (ADR-0053) — Proxy AI · Preset · Lorebook · Workflow;
      bốn id màn cũ giữ nguyên và trỏ vào cùng component với tab mở sẵn khác nhau
- [x] Dựng hai màn còn nợ từ Phase 11: **Lorebook + Bảng Đối Soát + Bản Đồ Dị
      Biệt**, và **Xưởng Workflow + Diễn Hóa**
- [x] Nối vòng lặp **Diễn Hóa** vào store — món nợ mang từ Phase 10: Smart Stop
      mười một điều kiện, ảnh chụp trước khi chạy, Báo Cáo giọng biên niên sử
- [x] Nhập lorebook đi qua Event/Patch như mọi thay đổi state khác; kỳ vọng trích
      ngay lúc nhập
- [x] Màn chưa dựng nói thẳng "chưa dựng" thay vì âm thầm hiện Sảnh

### Checklist deliverable — hardening

- [x] **Mô hình đe dọa** — `docs/THREAT_MODEL.md`: bốn lối vào, tài sản, ngoài
      phạm vi, và một đánh đổi được ghi nhận tường minh (`connect-src`)
- [x] **CSP** đã có từ trước; cổng test khẳng định `default-src 'self'`,
      `object-src 'none'`, không `unsafe-eval`
- [x] **Sanitizer** — `core/anToan/veSinh.ts`: ký tự đảo chiều văn bản (Trojan
      Source), ký tự vô hình, ký tự điều khiển, trần độ dài. Đặt ở `themDong()`,
      cửa duy nhất lên khung kể; vết lọc vào Tự Chẩn Đoán chứ không bị nuốt
- [x] **Fuzz deterministic** năm cửa nhận dữ liệu lạ: 800 phản hồi model, 500 gói
      save, 500 lorebook, 400 gói preset, 400 cấu hình rerank, 400 cấu hình AI,
      2.000 chuỗi rác cho sanitizer
- [x] **Audit riêng tư** — strip secret mọi độ sâu, che mật khẩu bốn điểm cuối,
      prompt không chứa trường nào trong `KHOA_CAM_RA_NGOAI`
- [x] **Soak ngắt mạch** — ba lần hỏng đóng cổng; 200 lần hỏng không tràn số và
      không tự mở lại
- [x] **Backup/restore** — round-trip qua JSON thật giữ hash; phục hồi sang một
      cơ sở dữ liệu trắng rồi đọc lại, invariant sạch; file sửa hash thì nhập
      được kèm cảnh báo
- [x] **Migration mọi version** — và ADR-0057 bịt lỗ hổng lớn nhất tìm được ở
      phase này
- [x] **Soak hiệu năng** — save 10.000 nhịp ghi được, mở lại đúng hash, invariant
      toàn cục sạch
- [x] **Docs** — `CAI_DAT.md`, `CHOI.md`, `MOD_VA_PRESET.md`, `PHUC_HOI.md`,
      `THREAT_MODEL.md`

### Gate Phase 12

| #   | Cổng                                                     | Kết quả  | Bằng chứng                                                                  |
| --- | -------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| 1   | Clean install / build                                    | **PASS** | `npm run gate` sạch; `vite build` 284 module                                |
| 2   | Không TODO/FIXME/HACK trong đường chơi chính             | **PASS** | quét `src/core`, `src/store`, `src/ui` — `phase12.test.ts`                  |
| 3   | File độc hại không có side effect                        | **PASS** | 2.600 payload rác qua bốn cửa nhập, 0 throw, 0 prototype pollution          |
| 4   | Không payload nào lấy lại chunk đã bị visibility loại    | **PASS** | `tongForbidden` giữ 0; mục riêng ở Tự Chẩn Đoán                             |
| 5   | Không trường riêng tư trong World/prompt/export mặc định | **PASS** | `quetRoRi` sạch trên prompt; 300 vòng fuzz strip secret                     |
| 6   | Save 10.000 nhịp mở lại đúng                             | **PASS** | hash khớp, invariant toàn cục PASS, ~19 s                                   |
| 7   | Không có AI thì không chơi — **mọi** đường               | **PASS** | `chi_engine` gỡ khỏi schema; `luotChuaKe` chặn; kiểm thật trong trình duyệt |
| 8   | Thế giới mới có đúng 0 luật, 0 khái niệm, 0 thực thể     | **PASS** | test + DOM thật: `0 rõ · 0 mờ · 0 tin đồn · 0 chưa biết tới`                |
| 9   | Hư vô vẫn deterministic và sạch bất biến sau 200 nhịp    | **PASS** | cùng seed cho cùng hash; `chayInvariantToanBo` PASS                         |
| 10  | Sanitizer không sót ký tự cấm nào                        | **PASS** | 2.000 chuỗi rác; hai mẫu khẳng định viết độc lập với module                 |
| 11  | Migration không làm hỏng ván đã có                       | **PASS** | ADR-0057; test khẳng định cả hai vế của hợp đồng                            |
| 12  | Bốn màn Cài Đặt mở được cả trước lẫn trong ván           | **PASS** | rà soát trình duyệt bên dưới                                                |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --write     mọi file khớp
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           26 file, 1.125 test, 1.125 pass, 0 fail
                         (phase12.test.ts 30 · phase12Db.test.ts 15)
npm run build            built in 7,46 s — 284 module
                         dist/assets/index-*.js 949,41 kB (gzip 302,86 kB)
```

### Rà soát trình duyệt — chạy thật, không phải đọc code

```text
Cổng AI            hiện đúng ba cột, Tường Thuật là cột BẮT BUỘC
Sảnh Vào           Tiếp tục (xám khi chưa có ván) · Bắt đầu · File save · Cài đặt
Cài Đặt            bốn tab chạy; Xưởng Workflow liệt kê đủ bảy tác vụ 50.9
                   và khối lằn ranh 50.10 báo "không chạm bảng cấm nào"
Bắt đầu → Bỏ qua   vào thẳng Sảnh, thế giới có 0 rõ · 0 mờ · 0 tin đồn · 0 chưa biết
                   không có "Máu Không Rửa Được", không có "Ô Uế" — hạt giống đã đi
Narrator hỏng      khối "Nhịp này chưa ai kể" hiện, ô nhập KHÓA (disabled = true),
                   hai nút: Kể lại nhịp này · Mở Cài Đặt · Proxy AI
Rời ván            ván xuống đĩa; Sảnh Vào hiện "Ván mới — Sáng Thế — nhịp 0"
Mở lại ván         nạp đúng, ô nhập mở lại, thế giới vẫn rỗng
Console errors     0
```

### Vấn đề đã phát hiện và sửa trong phase

| #   | Vấn đề                                                                                                                                                                        | Sửa                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **`migration.ts` không có ai gọi.** Ba bước migration dữ liệu có đủ từ Phase 2, có 50 test phủ, và chưa từng chạy trong trình duyệt. Save v1 mở trong bản hôm nay đọc ra rỗng | ADR-0057 — `khoiDongDb()` chạy một lần lúc khởi động, trước mọi ván |
| 2   | Chạy migration **sau** khi đã có ván sẽ đặt `setupCompleted = true` cho ván mới, làm nó nhảy qua wizard hiện diện                                                             | Thứ tự gọi thành một phần hợp đồng, có test khẳng định cả hai vế    |
| 3   | Store nói _"thế giới vẫn giữ nguyên chỗ đang dở"_ khi Narrator hỏng — sai: Event đã vào log. Người chơi bấm tick tiếp thì mất trắng các nhịp đó                               | ADR-0056 — `luotChuaKe` + `keLai()`, và thông báo nói đúng sự thật  |
| 4   | Regex literal chứa ký tự điều khiển làm file nguồn có **byte NUL** bên trong; `git diff` và vài công cụ khác hỏng khi đọc nó                                                  | `new RegExp` với chuỗi escape; ghi lý do ngay trong file            |
| 5   | Cổng "không dùng `dangerouslySetInnerHTML`" khớp cả chữ trần, nên một chú thích giải thích _vì sao không dùng_ cũng bị bắt — dạy người ta bỏ chú thích thay vì bỏ thói quen   | Khớp dạng DÙNG (`prop=` / `prop:`), không khớp chữ trần             |
| 6   | Hai bài fuzz dùng lại chính hằng số của module đang kiểm — chỉ chứng minh module nhất quán với chính nó                                                                       | Viết lại hai mẫu khẳng định độc lập, làm bản đối chứng              |

### Giới hạn đã biết của Phase 12

- **Ba màn vẫn chưa dựng:** Xưởng Registry (5.4), Bản Đồ Nhánh (26.2), Vật Lý
  Thế Giới. Dữ liệu sẵn (`bangLuatNen()`, `bangCoChe()`, `danhSachSave()` đã trả
  đúng cây nhánh), nhưng component chưa có. Khác Phase 11 ở một điểm: bấm vào nay
  hiện màn "chưa dựng" nói rõ đây là nợ công khai, không phải lỗi vừa gây ra.
- **Wizard hồ sơ vẫn là hai chế độ.** 78.5 đòi bốn (`Nhanh | Gợi ý | Đầy đủ | Bỏ
qua`) kèm privacy diff; Khởi Nguyên hiện có `Nhanh` và `Bỏ qua`.
- **Diễn Hóa chạy engine, chưa chạy đường ống workflow.** `chayDienHoa()` tua
  nhịp bằng `motTick` + Smart Stop và kể MỘT lượt ở cuối; nó chưa gọi bảy tác vụ
  của 50.9 qua điểm cuối Diễn Hóa. `chay.ts` có đủ hợp đồng `BoGoiModel`, phần
  còn thiếu là bộ nối giữa nó và `useAi`.
- **Bundle 949 kB** (gzip 303 kB). Code-split theo màn vẫn chưa làm; router đã
  tách sẵn ranh giới. Với một app chạy offline sau lần tải đầu, đây là đánh đổi
  chấp nhận được, nhưng nó vẫn là nợ.
- **Ghim vào Thanh Thiên Tượng chưa có menu chuột phải** — nợ mang từ Phase 11.
- **E2E ba tầng vẫn chạy tay.** Rà soát trình duyệt ở trên là thật và có số liệu,
  nhưng chưa có bộ chạy tự động. Đây là món nợ Phase 11 ghi ra và Phase 12 **không
  trả** — nói thẳng thay vì đánh dấu xong.

---

## Phase 12 — hoàn thiện: trả nốt sổ nợ

Người dùng đọc phần "Giới hạn đã biết" ở trên và trả lời bằng một chữ:
_"hoàn thiện"_. Mục này trả sáu món ghi ở đó, và ghi lại bốn lỗi thật mà việc trả
nợ làm lộ ra.

### Deliverable

- [x] **Ba màn cuối cùng** — Xưởng Registry (5.4), Bản Đồ Nhánh (26.2), Vật Lý
      Thế Giới (43 – 44). Không màn nào còn hiện "chưa dựng".
- [x] Vật Lý: bảy trục với tham số thật, đặt tên qua `datTenTruc()` có đủ ba điều
      kiện chặn, kẽ hở sinh ra khi `co_ten`, bốn cơ chế phái sinh kèm "còn thiếu
      gì" (44.5)
- [x] Bản Đồ Nhánh: cây theo `gocId`, tách nhánh có **lý do tách** được lưu, nhảy
      nhánh, và nhánh cha giữ nguyên
- [x] Xưởng Registry: mười hai registry, 164 manifest, trạng thái handler/schema,
      nhập world pack có `quetDauVetCode()` chặn trước
- [x] **Wizard hồ sơ bốn chế độ** (78.5) — `Bỏ qua | Nhanh | Gợi ý | Đầy đủ` kèm
      **bảng riêng tư ba cột** cập nhật ngay khi gõ, dựng từ `diffCongBo()` của
      `core/privacy` chứ không tự phân loại
- [x] `suaHoSo()` — sửa hồ sơ sau khi bắt đầu KHÔNG sinh Event và không chạm
      `WorldState`; nó chỉ dựng lại persona chiếu
- [x] **Diễn Hóa chạy đường ống workflow thật** — `chayDuongOng()` nối vào
      `useAi` qua `goiTacVuWorkflow()`; bảy tác vụ của 50.9 gọi điểm cuối Diễn
      Hóa theo giai đoạn, output giai đoạn trước vào ngữ cảnh giai đoạn sau
      (50.3); `kiemLanRanh()` chạy TRƯỚC; vết từng tác vụ hiện ở Xưởng Workflow
- [x] `bienSoanTacVu.ts` — thay macro bằng **tra bảng**, không thông dịch EJS:
      `<% %>` là JavaScript, và chạy mã từ file người lạ là đúng thứ luật bất
      biến #10 cấm. Macro không có trong bảng thì giữ nguyên văn và được khai
- [x] **Ghim Thanh Thiên Tượng** (58.11) — bảng chọn có bàn phím, chuột phải là
      lối tắt bỏ ghim, trần 12 mục yêu cầu bỏ bớt chứ không tự bỏ mục cũ
- [x] **Code-split** — bốn màn phụ thành chunk riêng; `manualChunks` tách
      react/zod/dexie/ejs khỏi mã ứng dụng
- [x] **E2E ba tầng tự động** — `src/test/e2e.test.ts`, 14 bài chạy qua đúng API
      của store với một Narrator giả

### Gate

| #   | Cổng                                                      | Kết quả  | Bằng chứng                                                     |
| --- | --------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| 1   | E2E ba tầng, tự động                                      | **PASS** | 14 bài: hư vô → lời kể dựng thế giới → ba tầng → lưu → mở lại  |
| 2   | Phàm nhân không đọc được văn bản luật, Sáng Thế thì có    | **PASS** | `vanBan` là `null` ở phàm nhân, có thật ở Sáng Thế             |
| 3   | Ba tầng cho ba `visibilityHash` khác nhau                 | **PASS** | tập ba phần tử                                                 |
| 4   | Patch vượt quyền bị từ chối trên đường chơi thật          | **PASS** | `worlds.playerState.mode` bị chặn, `mode` giữ nguyên           |
| 5   | Narrator không làm treo được engine                       | **PASS** | ADR-0058; fuzz 2.400 bản ghi rác, 0 throw                      |
| 6   | `await luuVan()` nghĩa là đã xuống đĩa                    | **PASS** | ADR-0059; rời ván rồi mở lại cho đúng hash                     |
| 7   | Gói save mang mọi Map của `WorldState`                    | **PASS** | ADR-0060; cổng so DANH SÁCH KHÓA, không so ví dụ               |
| 8   | Nhánh vừa fork hiện ra ngay và đếm đúng thực thể kế thừa  | **PASS** | ADR-0061                                                       |
| 9   | Bốn chế độ wizard, có privacy diff, không ép dữ liệu thật | **PASS** | rà soát trình duyệt: ba cột đổi ngay khi gõ                    |
| 10  | Chỉnh hồ sơ sau khi bắt đầu không làm World đổi âm thầm   | **PASS** | `suaHoSo()` không sinh Event; `stateHash` không đổi            |
| 11  | Bảng 50.000 entity vẫn mở dưới 16 ms                      | **PASS** | ngưỡng giữ nguyên; số mẫu 5 → 20 vì bài soak mới chiếm CPU     |
| 12  | Mọi id màn đều có màn thật                                | **PASS** | rà soát trình duyệt: rail 12 nút, không nút nào ra "chưa dựng" |

### Lệnh đã chạy và kết quả thật

```text
npx prettier --write     mọi file khớp
npx eslint . --max-warnings 0
                         0 lỗi, 0 cảnh báo
npx tsc -b --force       0 lỗi
npx vitest run           27 file, 1.145 test, 1.145 pass, 0 fail
                         (e2e.test.ts 14 · phase12.test.ts 36 · phase12Db.test.ts 16)
npm run build            built in 6,31 s — 293 module
                         index    632,58 kB (gzip 204,77 kB)
                         react    139,04 kB (gzip  44,51 kB)
                         dexie     96,37 kB (gzip  32,46 kB)
                         zod       75,57 kB (gzip  20,18 kB)
                         CaiDat    28,73 kB · XuongRegistry 9,82 · VatLy 7,20
                         BanDoNhanh 5,14 · ChanDoan 4,85
```

### Rà soát trình duyệt

```text
Wizard bốn chế độ  chọn "Đầy đủ", gõ danh xưng + bật công bố:
                   CHỈ MÌNH BẠN THẤY  → Ghi chú riêng
                   GỬI CHO NARRATOR   → Mô tả công khai: Kẻ Đứng Ngoài
                   THÀNH CANON        → Thế giới sẽ biết danh xưng: Kẻ Đứng Ngoài
Rail Sảnh          12 nút, có Vật Lý · Bản Đồ Nhánh · Xưởng Registry
Vật Lý             bảy trục hiện tham số thật; Nhân Quả và Vận Mệnh bị chặn kèm
                   câu giải thích thứ tự phụ thuộc (43.5)
Bản Đồ Nhánh       tách nhánh → cây hiện hai nút, con có "Tách vì: …"
Ghim               chọn "Tự quyết" → thanh trên cùng hiện "TỰ QUYẾT 100"
Xưởng Registry     12 registry · 164 manifest · 71 mục cần adapter · 0 cảnh báo
Lỗi runtime        0
```

### Vấn đề đã phát hiện và sửa

Cả bốn đều do E2E và rà soát trình duyệt làm lộ ra — không cái nào đọc code mà
thấy được.

| #   | Vấn đề                                                                                                                                                | Sửa      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | **Narrator làm treo được engine.** Bản ghi model tạo không đi qua schema, nên một aspect thiếu trường làm bất biến nổ `TypeError` thay vì trả vi phạm | ADR-0058 |
| 2   | **`luuVan()` bỏ lượt khi có lượt ghi khác đang chạy**, nên `roiVan()` trả về trước lúc ván xuống đĩa và mở lại ra thế giới lùi một nhịp               | ADR-0059 |
| 3   | **Gói save bỏ sót mười bảng** của Phase 5 – 10 — xuất rồi nhập làm mất Luật Nền, lorebook, mạch truyện, phục bút, tri thức, nợ, lời cầu, im lặng      | ADR-0060 |
| 4   | **Nhánh vừa fork vô hình.** `danhSachSave()` liệt kê từ `worlds`, mà copy-on-write nghĩa là nhánh con chưa có hàng world riêng                        | ADR-0061 |

Món thứ năm không thành ADR nhưng đáng ghi: cổng hiệu năng "bảng 50.000 entity
dưới 16 ms" bắt đầu chập chờn khi bài soak mười ngàn nhịp vào bộ test và chiếm
CPU. Ngưỡng **giữ nguyên**; số mẫu "lần nhanh nhất trong N" tăng từ 5 lên 20. Một
cổng hiệu năng chập chờn là một cổng người ta học cách bỏ qua, và lúc ấy nó thôi
bảo vệ được gì.

### Giới hạn còn lại

Ngắn hơn trước, và không món nào nằm trên đường chơi chính.

- **Xưởng Registry mới đọc, chưa ghi.** Nhập một world pack cho ra báo cáo đầy
  đủ — trạng thái từng mục, lý do cách ly, dấu vết code — nhưng bước "duyệt rồi
  đăng ký vào `R` đang chạy" chưa có. `napPack()` đã sẵn ở tầng registry; phần
  thiếu là màn duyệt và quyết định nó ghi vào nhánh nào.
- **Đường ống workflow chưa áp `dichGhi`.** Output tác vụ đi vào ngữ cảnh giai
  đoạn sau và vào lượt kể cuối, không đi vào lorebook hay world. Cố ý: [BB] 50.10
  xếp "ghi vào lorebook người dùng" là hỏng NẶNG, và đường ghi an toàn cần một bộ
  định tuyến riêng qua `dichGhi.ts`. Nối một nửa đường ghi tệ hơn không nối — nó
  tạo ấn tượng rằng lằn ranh đã được kiểm.
- **Hợp nhánh (26.3) chưa có giao diện.** `soSanhNhanh()` và `gopNhanh()` đã có
  từ Phase 10 với báo cáo tranh chấp đầy đủ; Bản Đồ Nhánh hiện mới cho tách và
  nhảy, chưa cho gộp.
- **Chunk chính vẫn 632 kB.** Tách được 321 kB sang vendor và bốn màn phụ, nhưng
  phần còn lại nằm ở `store/game.ts` — nó import preset, lore, workflow, retrieval
  và mọi thứ khác, và mọi màn đều cần store. Tách tiếp đòi chia store, không đòi
  chia màn.
- **E2E chạy ở tầng store, không qua DOM.** Nó đi đúng đường người chơi đi và bắt
  được bốn lỗi thật, nhưng nó không bấm nút. Kiểm bằng chuột vẫn là việc tay.
