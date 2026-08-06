# TRACEABILITY

Dòng đặc tả → module → test. Phần 74.4.

> Mỗi dòng "done" phải trỏ được tới test hoặc demo.

Cột **Test** ghi file test chứng minh. `—` nghĩa là chưa tới phase tương ứng.

---

## Khối A — Nền tảng

| Đặc tả                                                                                              | Module                                                | Test                                |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| 3.1 Stack: Vite + React 18 + TS strict + Zod 4 + Dexie 4 + Zustand + EJS + Tailwind + Framer Motion | `package.json`, `vite.config.ts`, `tsconfig.app.json` | `npm run build`                     |
| 3.1 [BB] không component library, không thư viện icon                                               | `package.json` (không có shadcn/MUI/lucide…)          | rà soát dependency                  |
| 3.2 Thư mục `src/core` cấm import React                                                             | `eslint.config.js` `no-restricted-imports`            | `source-guards.test.ts`             |
| 2.6 Mọi hằng số là dữ liệu                                                                          | `core/tuning/schema.ts`                               | `tuning.test.ts`                    |
| 2.7 Rò rỉ giữa ba tầng là bug nghiêm trọng nhất                                                     | `core/contracts/view.ts`, `core/privacy/*`            | `privacy.test.ts`, `rerank.test.ts` |

## Khối B — Kiến trúc

| Đặc tả                                                    | Module                                         | Test                |
| --------------------------------------------------------- | ---------------------------------------------- | ------------------- |
| 4.1 `EntitySchema`, `kind` là chuỗi không phải enum       | `core/schema/entity.ts`                        | `contracts.test.ts` |
| 4.2 Mười hai aspect dựng sẵn                              | `core/registry/aspects.ts`                     | `registry.test.ts`  |
| 4.3 `KindDef` là dữ liệu, `phanChieu` khai theo kind      | `core/registry/kinds.ts`                       | `registry.test.ts`  |
| 4.4 Truy cập aspect qua `co/lay/themAspect`               | — (Phase 1)                                    | —                   |
| 5.1 Mười hai registry                                     | `core/registry/index.ts`                       | `registry.test.ts`  |
| 5.2 Ba tầng nạp, ghi đè một phần, ghi đè hỏng không crash | `core/registry/createRegistry.ts`              | `registry.test.ts`  |
| 5.3 `VerbDef.kiemTraTruoc` trả **id luật** đang cấm       | `core/registry/types.ts` + `BlockReasonSchema` | `contracts.test.ts` |
| 6.1 `LinkSchema`                                          | `core/schema/entity.ts`                        | `contracts.test.ts` |
| 6.2 Quan hệ dựng sẵn + `nghichDao` đối xứng               | `core/registry/relations.ts`                   | `registry.test.ts`  |
| 6.3 quy tắc 3 — không thực thể mồ côi                     | `R.gap.mo_coi`                                 | `contracts.test.ts` |
| 6.3 quy tắc 4 — link không xóa cứng, để lại sẹo           | `LinkSchema.tickDut`                           | `contracts.test.ts` |
| 6.4 `moRong()` bắt buộc nhận `view`                       | — (Phase 1)                                    | —                   |
| 7.1 `TuningSchema` sáu nhóm                               | `core/tuning/schema.ts`                        | `tuning.test.ts`    |
| 7.2 Ba hồ sơ cân bằng                                     | `core/tuning/schema.ts` `HO_SO_CAN_BANG`       | `tuning.test.ts`    |

## Khối C — Hệ thống thế giới

| Đặc tả                                            | Module                                      | Test                      |
| ------------------------------------------------- | ------------------------------------------- | ------------------------- |
| 8.1 `ConceptualSchema`                            | `core/schema/aspect/conceptual.ts`          | `contracts.test.ts`       |
| 8.2 Phân đôi khi lưỡng lự quá hạn                 | `tuning.khaiNiem.tickLuongLuToiDa`          | `tuning.test.ts` (ngưỡng) |
| 8.3 Sinh phản nghĩa tự động                       | fixture `concept_thanh_sach`                | `contracts.test.ts`       |
| 9.1 `LawfulSchema` bảy trường logic               | `core/schema/aspect/lawful.ts`              | `contracts.test.ts`       |
| 9.2 Bảy kiểm tra luật                             | — (Phase 4)                                 | —                         |
| 9.5 Kẽ hở là cơ chế                               | fixture `law_mau.keHo`                      | `contracts.test.ts`       |
| 10.1 Bốn tầng lan truyền, tầng 2 **bắt buộc sai** | `tuning.luat.doLechDienGiaiMoiTheHe`        | `tuning.test.ts`          |
| 10.3 Ví dụ chuẩn "Máu không rửa được"             | `test/fixtures/world.ts`                    | `contracts.test.ts`       |
| 11.1 `SoulSchema`, cảm xúc phải có `doiTuongId`   | `core/schema/aspect/soul.ts`                | `contracts.test.ts`       |
| 11.2 Quan hệ bốn trục, hai bản ghi riêng          | `RelationStateSchema`                       | `contracts.test.ts`       |
| 12.1 `domain` / `venerable` / `divisible`         | `core/schema/aspect/divine.ts`              | `contracts.test.ts`       |
| 12.2 Dị Hóa                                       | `tuning.than.nguongDiHoa`, `tocDoDiHoa`     | `tuning.test.ts`          |
| 12.5 `AdversarialSchema`                          | `core/schema/aspect/living.ts`              | `contracts.test.ts`       |
| 13.1 `WorldMetricsSchema`                         | `core/schema/entity.ts`                     | `registry.test.ts`        |
| 13.4 `doSongDong` chỉ hiện cuối kỷ nguyên         | `R.metric.do_song_dong.chiHienCuoiKyNguyen` | `registry.test.ts`        |

## Khối E — Ba tầng chơi

| Đặc tả                                                     | Module                                   | Test                         |
| ---------------------------------------------------------- | ---------------------------------------- | ---------------------------- |
| 18.1 `WorldView`                                           | `core/contracts/view.ts`                 | `contracts.test.ts` (kiểu)   |
| 18.2 `lawful.vanBan` — phàm nhân **không bao giờ**         | `ProjectedLaw.vanBan: string \| null`    | `rerank.test.ts` (chunk cấm) |
| 18.2 `soul.banTinh` thần — phàm nhân **không bao giờ**     | `VenerableSchema.banTinhTinDoTin`        | `rerank.test.ts`             |
| 18.3 Test rò rỉ: hỏi luật ở tầng phàm phải trả lời **sai** | fixture `dienGiai` hai vùng lệch 34 / 61 | `rerank.test.ts`             |
| 19.4 `AvatarSchema`                                        | `core/schema/aspect/divine.ts`           | `contracts.test.ts`          |
| 21.3 `PlayerStateSchema`; chuyển tầng không tạo save mới   | `core/contracts/core.ts`                 | `contracts.test.ts`          |

## Khối F — Mô phỏng

| Đặc tả                            | Module                                           | Test                           |
| --------------------------------- | ------------------------------------------------ | ------------------------------ |
| 24.1 Mười bốn bước tick           | `AspectDef.buocTick`, `WorldProcessDef.buocTick` | `registry.test.ts`             |
| 24.1 [BB] deterministic theo seed | `core/engine/rng.ts`, `core/engine/replay.ts`    | `engine.test.ts` — 10.000 bước |
| 24.2 Bốn nhịp thời gian           | `NHIP_THOI_GIAN` trong `view.ts`                 | `contracts.test.ts`            |

## Lõi deterministic — Phase 1

| Yêu cầu                                               | Module                     | Test                                                 |
| ----------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| RNG seeded, không `Math.random`                       | `core/engine/rng.ts`       | `engine.test.ts` (12 test) + `source-guards.test.ts` |
| RNG tách kênh theo tick — thứ tự chạy không ảnh hưởng | `rngCuaTick()`             | `engine.test.ts`                                     |
| Canonical state hash                                  | `core/engine/hash.ts`      | `engine.test.ts` (11 test)                           |
| Trường dẫn xuất không vào hash (ADR-0013)             | `hashState()`              | `engine.test.ts`                                     |
| Event bus append-only                                 | `taoEventLog()`            | `engine.test.ts`                                     |
| Event hash chống sửa log                              | `hashEvent()`              | `engine.test.ts`                                     |
| Nhân quả: không cycle, không từ tương lai             | `kiemNhanQua()`            | `engine.test.ts` (3 test)                            |
| Patch hai pha, tất-cả-hoặc-không                      | `apPatch()`                | `engine.test.ts` (18 test)                           |
| Optimistic concurrency                                | `PatchOp.expectedVersion`  | `engine.test.ts`                                     |
| Rollback chính xác (ADR-0011)                         | `hoanTacPatch()`           | `engine.test.ts`                                     |
| ExprNode thay `eval` (ADR-0003)                       | `core/engine/expr.ts`      | `engine.test.ts` (13 test)                           |
| Invariant theo phạm vi (ADR-0012)                     | `core/engine/invariant.ts` | `engine.test.ts` (7 test)                            |
| Replay + `kiemDeterminism`                            | `core/engine/replay.ts`    | `engine.test.ts` (9 test)                            |
| Repository in-memory                                  | `taoKhoBoNho()`            | `engine.test.ts` (3 test)                            |

## Persistence, migration và nhánh — Phase 2

| Yêu cầu                                                  | Module                                   | Test                   |
| -------------------------------------------------------- | ---------------------------------------- | ---------------------- |
| 26.1 `BranchSchema`, copy-on-write                       | `core/contracts/branch.ts`, `db/repo.ts` | `db.test.ts` (10 test) |
| 26.1 Đọc lần lên `gocId`, ghi vào nhánh hiện tại         | `KhoNhanh.doc` / `.ghi`                  | `db.test.ts`           |
| Bia mộ: xóa ở nhánh con không hồi sinh từ cha (ADR-0014) | `KhoNhanh.xoa`, bảng `tombstones`        | `db.test.ts`           |
| 38 Dexie v1 giữ nguyên để đọc save cũ                    | `db/schema.ts` `version(1)`              | `db.test.ts`           |
| 61.5 Compound key `[branchId+id]`                        | `db/schema.ts` `version(2)`              | `db.test.ts`           |
| 79.1 Bảng Khối U                                         | `db/schema.ts` `version(3)`              | `db.test.ts`           |
| 61.5 Migration trong transaction, có checkpoint          | `db/migration.ts`                        | `db.test.ts` (7 test)  |
| 61.5 Kiểm hash và đếm record trước khi hoàn tất          | `chayMigrationV1V2`                      | `db.test.ts`           |
| 61.5 Save export ghi `schemaVersion`                     | `SaveExportSchema`                       | `db.test.ts`           |
| 61.5 Save mới hơn app bị từ chối tử tế                   | `kiemPhienBanSave`                       | `db.test.ts`           |
| 78.10 Save cũ có `setupCompleted = true`                 | `chayMigrationV2V3`                      | `db.test.ts`           |
| 38 `proxyPassword` không bao giờ vào file xuất           | `stripSecret`, `KHOA_SECRET`             | `db.test.ts` (3 test)  |
| 78.2 Hồ sơ riêng tư chỉ xuất khi opt-in                  | `xuatSave` `kemHoSoRiengTu`              | `db.test.ts` (2 test)  |
| 38 Autosave giữ 5 bản gần nhất mỗi nhánh                 | `luuSnapshot`, `SO_AUTOSAVE_GIU`         | `db.test.ts` (2 test)  |
| Snapshot phát hiện hư hỏng bằng hash                     | `phucHoiTuSnapshot`                      | `db.test.ts`           |
| 77.8 Cache khóa bảy phần                                 | `db/rerankCache.ts`                      | `db.test.ts` (10 test) |
| 77.8 Cache không đọc chéo nhánh hoặc chủ thể             | `KhoRerankCache.doc`                     | `db.test.ts`           |
| 77.8 Hạn cache theo tick, không theo giờ máy             | `expiresAtTick`                          | `db.test.ts`           |
| 77.8 Không cache password hay request body               | `hashConfig` loại secret                 | `db.test.ts`           |
| 79.1 Xóa cache rerank không ảnh hưởng save/replay        | `KhoRerankCache.xoaHet`                  | `db.test.ts`           |

## Lát dọc offline và ý định tự do — Phase 3, 4

| Yêu cầu                                                            | Module                             | Test                              |
| ------------------------------------------------------------------ | ---------------------------------- | --------------------------------- |
| 17.4 Ba cửa vào `hu_vo` / `mot_cau` / `day_du`                     | `core/world/khoiTao.ts`            | `chieu.test.ts`                   |
| 18 `chieu()` — một engine, ba hàm chiếu                            | `core/project/chieu.ts`            | `chieu.test.ts` (16 test)         |
| 18.2 quy tắc 1 — `lawful.vanBan` phàm nhân không bao giờ           | `chieuLaw()`                       | `chieu.test.ts`                   |
| 18.2 quy tắc 2 — `soul.banTinh` của thần                           | `locAspect()`                      | `chieu.test.ts`                   |
| 18.2 quy tắc 3 — `conceptual.trongSo`                              | `chieuConcept()`                   | `chieu.test.ts`                   |
| 18.3 Test rò rỉ: trả lời bằng truyền thuyết, sai đúng chỗ `doLech` | `dienGiaiCuaVung()`                | `chieu.test.ts` + smoke DOM       |
| 19.1 `bopMeo()` sai có cấu trúc                                    | `core/project/distort.ts`          | `chieu.test.ts` (6 test)          |
| 21.3 Chuyển tầng không tạo save mới                                | `eventChuyenTang()`                | `chieu.test.ts`                   |
| 24.1 Mười bốn bước tick, chỉ 8/12/13 cần LLM                       | `core/engine/tick.ts`              | `chieu.test.ts` (8 test)          |
| 10.1 Tầng 2 bắt buộc sai — `doLech` tăng theo thế hệ               | `tick.ts` bước 10                  | `chieu.test.ts`                   |
| 8.3 Phản nghĩa tự sinh ở `hu_danh`                                 | `khoiTao.ts`                       | `chieu.test.ts`                   |
| 77.8 `visibilityHash` đổi khi tầm nhìn đổi                         | `chieu()`                          | `chieu.test.ts`                   |
| 78.4 Draft không phải Entity; commit qua Event                     | `core/world/hienDien.ts`           | `chieu.test.ts` (10 test)         |
| 78.7 `suc` do engine quyết, không do người chơi khai               | `eventHienDien()`                  | `chieu.test.ts`                   |
| 78.7 `primordial` bị từ chối nếu world đã có lịch sử               | `kiemNhapHienDien()`               | `chieu.test.ts`                   |
| 78.8 Ngân sách kỹ năng; vật chưa tồn tại thành mục tiêu            | `eventHienDien()`                  | `chieu.test.ts`                   |
| 78.4 Canon diff hiện trước khi commit                              | `CanonDiff`                        | `chieu.test.ts`                   |
| 67.1 Sáu động từ chỉ ở tầng Sáng Thế                               | `dongTuKhaDung()`                  | `chieu.test.ts`, `intent.test.ts` |
| 67.2 `Intent`, `rawText` bất biến                                  | `core/intent/schema.ts`            | `intent.test.ts`                  |
| 67.2 Rule parser tiếng Việt khớp theo từ                           | `core/intent/parser.ts`            | `intent.test.ts` (7 test)         |
| 67.3 `KnowledgeRecord`; không dùng tri thức mù                     | `core/intent/resolve.ts`           | `intent.test.ts` (3 test)         |
| 67.4 Vòng xử lý ý định                                             | `giaiQuyet()`                      | `intent.test.ts`                  |
| 67.5 `failure` nêu nguyên nhân trong thế giới                      | `giaiQuyet()`                      | `intent.test.ts` — 150 input      |
| 67.6 Việc đời thường không tự thành luật                           | `nenThanhProject()` + cấp kết tinh | `intent.test.ts` — 200 lần lặp    |
| 67.7 Gợi ý 3–5, đa dạng nguồn, không lộ target mù                  | `core/intent/affordance.ts`        | `intent.test.ts` (4 test)         |
| 68.2 `Project` + milestone + requirement                           | `taoProject()`                     | `intent.test.ts` (6 test)         |
| 68.3 LLM không tự đặt `progress = 1`                               | schema `milestones[].progress`     | `intent.test.ts`                  |
| 17.2 Không bao giờ "không hiểu"                                    | `parseIntent` + `giaiQuyet`        | `intent.test.ts` — 150 input      |
| 5.3 Luật cấm trả về ID LUẬT cụ thể                                 | `lapKeHoach()`                     | `intent.test.ts`                  |
| Hành động không hoàn tác phải xác nhận                             | `requiresConfirmation`             | `intent.test.ts` + UI             |
| 3.1 UI không ghi World trực tiếp                                   | `store/game.ts`                    | `source-guards.test.ts`           |

## Khối H — AI

| Đặc tả                                            | Module                     | Test               |
| ------------------------------------------------- | -------------------------- | ------------------ |
| 31.2 `ModelProfileSchema`                         | `core/schema/ai.ts`        | `registry.test.ts` |
| 31.2 Cảnh báo `outputMax !== outputMacDinhCuaApi` | `R.profile.gemini-3.1-pro` | `registry.test.ts` |
| 31.3 `GenParamsSchema`                            | `core/schema/ai.ts`        | `registry.test.ts` |

## Khối R — Cổng nền và preset

| Đặc tả                                                                   | Module                                                                    | Test                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| 61.1 #1 Zod 4 vì `.prefault()`                                           | `package.json` zod 4.4.3                                                  | `contracts.test.ts` (prefault ≠ default)    |
| 61.1 #2 Khai đủ 12 registry                                              | `core/registry/index.ts`                                                  | `registry.test.ts`                          |
| 61.1 #3 Tách manifest khỏi handler                                       | `manifest.ts` / `catalog.ts`                                              | `registry.test.ts`                          |
| 61.1 #4 Bổ sung tuning thiếu                                             | `core/tuning/schema.ts`                                                   | `tuning.test.ts`                            |
| 61.1 #5 Bốn hợp đồng lõi                                                 | `core/contracts/core.ts`                                                  | `contracts.test.ts`                         |
| 61.1 #6 Compound key theo nhánh                                          | `docs/SCHEMA_DB_MATRIX.md`                                                | Phase 2                                     |
| 61.1 #7 Chỉ cấm meta-currency của **người chơi**                         | `MortalSchema` có `soHuu`/`kyNang`; `CreatorIdentity` **không** có chỉ số | `privacy.test.ts`                           |
| 61.2 Manifest thuần dữ liệu, JSON round-trip                             | `roundTripManifest`                                                       | `registry.test.ts`                          |
| 61.2 `handlerId` lạ → `can_adapter`                                      | `coHandler()`                                                             | `registry.test.ts`                          |
| 61.2 Không `eval` / `new Function` / dynamic import                      | `quetDauVetCode` + eslint                                                 | `registry.test.ts`, `source-guards.test.ts` |
| 61.3 `PatchOp` / `Event` / `Scene` / `World`                             | `core/contracts/core.ts`                                                  | `contracts.test.ts`                         |
| 61.4 `TuningV3ExtensionSchema`                                           | `core/tuning/schema.ts`                                                   | `tuning.test.ts`                            |
| 61.5 Dexie v2, `scopeKey` không chứa `null`                              | `scopeKeyOf()`                                                            | `contracts.test.ts`                         |
| 61.6 Ma trận schema ↔ DB                                                 | `docs/SCHEMA_DB_MATRIX.md`                                                | rà soát tay                                 |
| 63 Pipeline nhập 12 bước                                                 | — (Phase 9)                                                               | —                                           |
| 64 `prompt_order` là nguồn thứ tự, `order[].enabled` là nguồn trạng thái | `docs/PRESET_COMPAT.md`                                                   | `preset-fixture.test.ts`                    |
| 66 Hai fixture thật                                                      | `src/test/fixtures/preset/`                                               | `preset-fixture.test.ts`                    |

## Khối U — Rerank và khởi tạo người chơi

| Đặc tả                                                               | Module                                                  | Test                |
| -------------------------------------------------------------------- | ------------------------------------------------------- | ------------------- |
| 77.1 Visibility filter trước mọi bước chấm điểm                      | `RerankCandidate.projectedText` + `visibilityHash`      | `rerank.test.ts`    |
| 77.2 `RerankConfigSchema`, năm mode                                  | `core/schema/rerank.ts`                                 | `rerank.test.ts`    |
| 77.2 `auto` không tự dùng Narrator làm reranker                      | `doCauHinhRerank`                                       | `rerank.test.ts`    |
| 77.3 `RerankQuery` / `RerankCandidate` / `RerankResult`              | `core/schema/rerank.ts`                                 | `rerank.test.ts`    |
| 77.4 Heuristic luôn tồn tại, trọng số theo task từ tuning            | `tuning.rerank.hoSoTask`                                | `tuning.test.ts`    |
| 77.5 Ba adapter semantic                                             | `ai/rerankClient.ts`, `retrieval/mockAdapter.ts`        | `retrieval.test.ts` |
| 77.6 Fusion theo **thứ hạng**, không cộng thẳng thang điểm           | `retrieval/rerank.ts` `fusion()` + `mmr()`              | `retrieval.test.ts` |
| 77.7 Token-aware packing, trần tỷ lệ một nguồn                       | `tuning.rerank.tranTyLeMotNguon`                        | `tuning.test.ts`    |
| 77.8 Cache key bảy phần, không chứa secret                           | `RerankCacheEntrySchema`                                | `rerank.test.ts`    |
| 77.8 Hạn cache theo **tick**, không theo thời gian máy               | `cacheTtlTicks`, `expiresAtTick`                        | `rerank.test.ts`    |
| 77.9 Circuit breaker, suy giảm êm                                    | `degradeToHeuristic`, `CAU_HINH_HEURISTIC`              | `rerank.test.ts`    |
| 77.10 Bộ đánh giá, `forbidden recall = 0`                            | `RetrievalEvalCaseSchema`, `RetrievalEvalMetricsSchema` | `rerank.test.ts`    |
| 78.1 Ba lớp dữ liệu không được trộn                                  | `core/privacy/matrix.ts`                                | `privacy.test.ts`   |
| 78.2 `PlayerProfileSchema`; không thu giới tính/tuổi/email/ngày sinh | `core/schema/player.ts`                                 | `privacy.test.ts`   |
| 78.3 `CreatorIdentitySchema`, `worldDisclosure`                      | `core/schema/player.ts`                                 | `privacy.test.ts`   |
| 78.3 `CreatorIdentity` không có mana/cấp/HP                          | `core/schema/player.ts`                                 | `privacy.test.ts`   |
| 78.4 `StartingPresenceDraftSchema` — draft không phải Entity         | `core/schema/player.ts`                                 | `privacy.test.ts`   |
| 78.5 Bốn chế độ; `Bỏ qua` vẫn vào game                               | `CHE_DO_HO_SO`, `hoSoToiThieu()`                        | `privacy.test.ts`   |
| 78.6 "Để thế giới gọi tên ta"                                        | `danhTinhTrong()`                                       | `privacy.test.ts`   |
| 78.7 Không tự khai `domainStrength`                                  | schema `deity` không có trường đó                       | `privacy.test.ts`   |
| 78.8 Không tự cấp tài sản/kỹ năng vô hạn                             | `mortal` chỉ nhận id tham chiếu                         | `privacy.test.ts`   |
| 78.10 Migration save cũ `setupCompleted = true`                      | `PlayerStateSchema`                                     | Phase 2             |
| 78.11 `ProjectedPlayerPersonaSchema` là cửa duy nhất                 | `core/privacy/project.ts`                               | `privacy.test.ts`   |
| 79.1 Persistence v3                                                  | `docs/SCHEMA_DB_MATRIX.md`                              | Phase 2             |

## Khối S — World Process (Phần 71–72)

| Đặc tả                                                                              | Module                                                   | Test                                       |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| 71.1 `WorldProcessDef`: scope, cadence, reads/writes, invariants, resolution        | `core/registry/types.ts`, `misc.ts`                      | `world.test.ts`                            |
| 71.1 Handler nhận state + RNG seeded, trả Event + Patch candidate, **không** ghi DB | `core/world/process/types.ts`                            | `world.test.ts` — "scheduler KHÔNG commit" |
| 71.2 `environment_cycle` — mùa, thời tiết, thiên tai                                | `process/moiTruong.ts` `chayMoiTruong`                   | `world.test.ts`                            |
| 71.2 `ecology` — quần thể, thức ăn, suy thoái/phục hồi                              | `process/moiTruong.ts` `chaySinhThai`                    | `world.test.ts`                            |
| 71.2 `population_household` — sinh, chết, hộ, thế hệ                                | `process/danSo.ts` `chayDanSo`                           | `world.test.ts`                            |
| 71.2 `health_disease` — bệnh, lây, miễn dịch                                        | `process/danSo.ts` `chaySucKhoe`                         | `world.test.ts`                            |
| 71.2 `production_consumption` — lương thực, vật liệu, thiếu/thừa                    | `process/kinhTe.ts` `chaySanXuat`                        | `world.test.ts`                            |
| 71.2 `exchange_debt` — trao đổi, giá, nợ                                            | `process/kinhTe.ts` `chayTraoDoi`                        | `world.test.ts`                            |
| 71.2 `settlement_infrastructure` — nhà, đường, hư hỏng                              | `process/kinhTe.ts` `chayDinhCu`                         | `world.test.ts`                            |
| 71.2 `travel_communication` — di chuyển, tin, độ trễ                                | `process/triThuc.ts` `chayLienLac`                       | `world.test.ts`                            |
| 71.2 `institution_governance` — thuế, chức vụ, kế vị                                | `process/xaHoi.ts` `chayThietChe`                        | `world.test.ts`                            |
| 71.2 `knowledge_technology` — học, phát kiến, mất tri thức                          | `process/triThuc.ts` `chayKyThuat`                       | `world.test.ts`                            |
| 71.2 `culture_language_religion` — tập tục, ngôn ngữ, giáo lý                       | `process/xaHoi.ts` `chayVanHoa`                          | `world.test.ts`                            |
| 71.2 `conflict_security` — bạo lực, hòa ước, thương vong                            | `process/xaHoi.ts` `chayXungDot`                         | `world.test.ts`                            |
| 71.3 Ba độ phân giải micro/meso/macro                                               | `process/phanGiai.ts` `phanGiaiTheoOngKinh`              | `world.test.ts`                            |
| 71.3 Macro→micro bảo toàn dân số, vật chất, sở hữu, lịch sử                         | `process/phanGiai.ts` `vatChatHoa`                       | `world.test.ts`                            |
| 71.3 "Không materialize gia đình giàu trong vùng đói"                               | `vatChatHoa` — tài sản rút từ vùng                       | `world.test.ts`                            |
| 71.4 quy tắc 1 — gộp `add` giao hoán                                                | `process/scheduler.ts` `honNhatXungDot`                  | `world.test.ts`                            |
| 71.4 quy tắc 2 — `set`×`set` theo `uuTien` + chẩn đoán                              | `honNhatXungDot`                                         | `world.test.ts`                            |
| 71.4 quy tắc 3 — chu trình chia stage theo SCC                                      | `chiaGiaiDoan`, `timSCC` (ADR-0023)                      | `world.test.ts`                            |
| 71.4 quy tắc 4 — invariant sau mỗi stage                                            | `apDungStage`                                            | `world.test.ts`                            |
| 71.4 quy tắc 5 — rollback stage + chẩn đoán chỉ tên process/patch                   | `chayTienTrinhNen`                                       | `world.test.ts`                            |
| 71.4 dân số / vật chất / item không âm                                              | `dan_so_khong_am`, `kho_khong_am`, `tai_nguyen_khong_am` | `world.test.ts`                            |
| 71.4 entity chết không tự hành động                                                 | `nguoi_chet_khong_giu_chuc`                              | `core/world/batBien.ts`                    |
| 71.4 vị trí có tuyến đường hợp lệ                                                   | `tuyen_duong_hop_le`                                     | `core/world/batBien.ts`                    |
| 71.4 không hai chủ cùng một vật độc quyền                                           | `khong_hai_chu_cung_mot_vat`                             | `core/world/batBien.ts`                    |
| 71.4 event cause không từ tương lai                                                 | `kiemNhanQua()` (Phase 1)                                | `engine.test.ts`                           |
| 71.4 tri thức cần đường truyền                                                      | `khong_tri_thuc_teleport`                                | `world.test.ts` — 3 test                   |
| 71.4 tổng thay đổi có giải thích                                                    | `KhaiBaoBaoToan`, `dan_so_khop_cohort`, `di_cu_bao_toan` | `world.test.ts`                            |
| 71.5 LLM không giữ sổ — số đến từ WorldProcess                                      | `core/world/banTin.ts` (chỉ chuyển tiếp)                 | `world.test.ts`                            |
| 71.6 Chạy theo cadence thời gian truyện                                             | `denNhip()`                                              | `world.test.ts`                            |
| 71.6 Gộp bước bằng công thức macro                                                  | `gopTyLe()`, `soBuocGop`                                 | `world.test.ts`                            |
| 71.6 Không chạy triệu vòng micro khi tua kỷ nguyên                                  | `tuaThoiGian`, `TICK_MOI_BUOC`                           | `world.test.ts` — 400 tick → 10 bước       |
| 71.6 Smart Stop dừng ở mốc đáng xem                                                 | `chonMocDung`, `DIEU_KIEN_DUNG` (47.3)                   | `world.test.ts`                            |
| 71.6 Cùng seed + log → cùng hash                                                    | `kiemDeterminism`                                        | `world.test.ts`                            |
| 72.2 Event xa chỉ chen vào scene nếu có đường tới                                   | `banTinCho`, `soChangToi`                                | `world.test.ts`                            |
| 72.4 Mỗi hệ nền có đủ State + Process + quan sát                                    | `schema/aspect/substrate.ts` + 12 handler + `chieu()`    | `world.test.ts`                            |
| 56.2 Sổ Tay không lộ số — chiếu định tính cho phàm nhân                             | `chieu.ts` `dinhTinhHoa`                                 | `world.test.ts`                            |
| 24.2 Tick cơ sở là một mùa (ADR-0019)                                               | `TICK_MOI_NAM`, `muaCuaTick`                             | `world.test.ts`                            |

## Khối S — Tầng Thần (Phần 12, 19, 22, 69)

| Đặc tả                                                        | Module                                                           | Test                |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------- |
| 69.1 `DivineIdentity` bốn lớp                                 | `schema/aspect/thanVi.ts`                                        | `than.test.ts`      |
| 69.1 [BB] tick KHÔNG sửa `coreSelf`                           | `process/than.ts` `chayDiHoa` (không khai `coreSelf` ở `writes`) | `than.test.ts`      |
| 69.1 Lõi chỉ đổi qua Event, có `eventId`                      | `than/diHoa.ts` `dapDiHoa` + `coreself_co_giai_thich`            | `than.test.ts`      |
| 69.1 Bốn cách đáp: chấp nhận / chống lại / mặc cả / phân thân | `dapDiHoa`                                                       | `than.test.ts`      |
| 12.2 Dị Hóa có nguồn thật (đời sống tín đồ)                   | `chayDiHoa` — khổ đẩy hình ảnh (ADR-0026)                        | `than.test.ts`      |
| 69.2 Mười kênh can thiệp, mỗi kênh một giá tự nhiên           | `than/kenh.ts`                                                   | `than.test.ts`      |
| 69.2 Giao ước ràng buộc **cả thần**                           | `schema/than.ts` `giaoUocCanBang`                                | `than.test.ts`      |
| 69.4 Vòng đời domain tám trạng thái                           | `thanVi.ts` `trangThaiSuyRa`                                     | `than.test.ts`      |
| 69.4 Mất vĩnh viễn chỉ khi hết mọi neo                        | `domain_mat_phai_het_neo`                                        | `than.test.ts`      |
| 19.2 Quy kết bốn hệ số từ `tuning.than`, không HP             | `than/quyKet.ts` `giaiQuyKet`                                    | `than.test.ts`      |
| 19.2 [BB] danh tiếng quyết định thắng được cái gì             | `doKhopTinhCach` dùng `banTinhTinDoTin`                          | `than.test.ts`      |
| 22.1 `PrayerSchema`                                           | `schema/than.ts`                                                 | `than.test.ts`      |
| 22.2 [BB] lời cầu sinh từ bế tắc thật, không bịa              | `than/cauNguyen.ts` `quetBeTac` + `loi_cau_co_goc_that`          | `than.test.ts`      |
| 22.3 Bốn cách trả lời đều có hậu quả                          | `HAU_QUA_TRA_LOI`, `traLoiCau`                                   | `than.test.ts`      |
| 22.3 [BB] `lam_ngo` là lựa chọn hạng nhất                     | `ui/panels/TheCauNguyen.tsx` — bốn nút cùng kích thước           | rà soát UI          |
| 22.4 Thẻ lời cầu, thanh cường độ mảnh, sắp theo cường độ      | `TheCauNguyen`, `loiCauCho`                                      | `than.test.ts`      |
| 23.2 quy tắc 2 — softmax, không lấy max                       | `chonCachDap`, `giaiQuyKet`, `chayThanNpc`                       | `than.test.ts`      |
| 1.3 [BB] không tài nguyên meta                                | `khong_tai_nguyen_meta`                                          | `than.test.ts`      |
| 56.4 Bảng bên phải tầng Thần — nay là Bảng Thần Điện          | `ui/panels/BangThanDien.tsx`, `core/than/thanDien.ts` (ADR-0062) | `thanDien.test.ts`  |
| 36.1 Cấm emoji, mọi icon là SVG vẽ tay                        | `ui/design/Icon.tsx` — 20 ký hiệu                                | rà soát mã nguồn    |
| 36.2 `tokens.css` là nguồn chân lý về màu                     | `ui/design/tokens.css` (ADR-0027)                                | rà soát mã nguồn    |
| 37.3 Sảnh ba cột                                              | `ui/screens/KhungSanh.tsx`                                       | rà soát trình duyệt |
| 19.4 Hóa thân làm `chieu()` tụt mức phàm nhân                 | `core/than/hoaThan.ts` + `chieu()` `mucChieu` (ADR-0030)         | `than6.test.ts`     |
| 12.3 Phân thân tách thành bản thể riêng                       | `core/than/phanThan.ts`                                          | `than6.test.ts`     |
| 69.3 Hội đồng thần, phiếu, kế vị                              | `schema/aspect/hoiDong.ts`, `core/than/hoiDong.ts`               | `than6.test.ts`     |
| 69.3 Utility AI của thần dùng Intent/Project                  | `core/than/duAn.ts` → `world/process/than.ts`                    | `than6.test.ts`     |
| 21.3 Chuyển tầng chọn đúng chủ thể                            | `core/than/chuThe.ts` (ADR-0029)                                 | `than6.test.ts`     |

## Khối S — Tầng Phàm Nhân (Phase 7)

| Đặc tả                                                   | Module                                           | Test           |
| -------------------------------------------------------- | ------------------------------------------------ | -------------- |
| 70.5 Sức khỏe không phải thanh máu                       | `core/pham/thanThe.ts` (ADR-0032)                | `pham.test.ts` |
| 70.5 Chết tới từ CHUỖI nguyên nhân                       | `mortal.nguyenNhanChet`, `daChet()`              | `pham.test.ts` |
| 70.2 Học, dạy, làm nghề, đổi nghề                        | `core/pham/sinhKe.ts` (ADR-0035)                 | `pham.test.ts` |
| 70.2 Lập hộ, tách hộ, chăm người già                     | `core/pham/ho.ts`                                | `pham.test.ts` |
| 70.4 Đối thoại cũng là hành động                         | `core/pham/doiThoai.ts`                          | `pham.test.ts` |
| 11.2 Quan hệ bất đối xứng, hai record riêng              | `soul.quanHe` + `core/pham/quanHe.ts` (ADR-0033) | `pham.test.ts` |
| 70.3 NPC ngoài sân khấu đã sống từ trước                 | `core/pham/phanGiaiNguoi.ts`                     | `pham.test.ts` |
| 50.4 / 70.3 NPC ngoài cảnh giữ lịch và vị trí            | `core/pham/lich.ts` (ADR-0031)                   | `pham.test.ts` |
| 20.3 Ba đường sau khi chết                               | `core/pham/caiChet.ts`                           | `pham.test.ts` |
| 20.3 Anh Linh Hóa Thần **thêm** aspect, không tạo entity | `anhLinhHoaThan()`                               | `pham.test.ts` |
| 68.3 Project của người, tiến độ đo từ thế giới           | `core/pham/duAnNguoi.ts`                         | `pham.test.ts` |
| 56.1 Sổ Tay thay hẳn Bảng ở tầng phàm nhân               | `core/pham/soTay.ts`, `ui/panels/SoTay.tsx`      | `pham.test.ts` |
| 56.2 Bốn quy tắc Sổ Tay; không số engine                 | `quetSoRo()`, `KHOA_ENGINE_CAM`                  | `pham.test.ts` |
| 71.2 Hai tiến trình mới tầng phàm nhân                   | `core/world/process/pham.ts`                     | `pham.test.ts` |
| 71.4 Tin không teleport — cùng chỗ thì không cần đường   | `khong_tri_thuc_teleport` (ADR-0034)             | `pham.test.ts` |

## Khối H — AI (cổng bắt buộc, ADR-0028)

| Đặc tả                                              | Module                                         | Test                |
| --------------------------------------------------- | ---------------------------------------------- | ------------------- |
| 31.1 / 46.1 Ba điểm cuối độc lập                    | `core/ai/cauHinh.ts`                           | `ai.test.ts`        |
| 31.5 Thử đường phải chứng minh model NGHE LỆNH      | `ai/client.ts` `thuDuong`                      | `ai.test.ts`        |
| 62.4 Chỉ gửi tham số model hỗ trợ                   | `ai/phuongNgu.ts` `THAM_SO_HO_TRO`             | `ai.test.ts`        |
| 29.2 Bảy quy tắc Narrator ở tầng lõi bất biến       | `core/ai/bienSoan.ts` `BAY_QUY_TAC_NARRATOR`   | `ai.test.ts`        |
| 33.1 Sáu tầng context, ổn định lên đầu              | `core/ai/bienSoan.ts`                          | `ai.test.ts`        |
| 33.3 Assembler nhận `WorldView`, không nhận `World` | `core/ai/bienSoan.ts` (chữ ký hàm)             | `ai.test.ts`        |
| 71.5 [BB] LLM không giữ sổ — patch sai bị từ chối   | `core/ai/bocTach.ts`                           | `ai.test.ts`        |
| 46.2 Tỉ lệ patch trượt vào bảng Tự Chẩn Đoán        | `core/ai/bocTach.ts` `tyLeTruot`               | `ai.test.ts`        |
| **ADR-0028** Không có AI thì không chơi             | `core/ai/cong.ts`, `store/game.ts` `doiCong()` | `ai.test.ts`        |
| ADR-0028 Cổng AI đứng trước Khởi Nguyên             | `App.tsx`, `ui/screens/CongAi.tsx`             | rà soát trình duyệt |
| 46.3 UI cài đặt ba cột, tắt được cột 2 và 3         | `ui/screens/CongAi.tsx`                        | rà soát trình duyệt |

## Khối T — Thi công

| Đặc tả                       | Module                          | Test        |
| ---------------------------- | ------------------------------- | ----------- |
| 74.2 Bốn trạng thái phase    | `docs/IMPLEMENTATION_STATUS.md` | rà soát tay |
| 74.3 Bộ gate chung chín bước | `npm run gate`                  | CI cục bộ   |
| 74.4 Sáu tài liệu sống       | `docs/`                         | rà soát tay |
| 76.3 Ghi ADR khi mâu thuẫn   | `docs/DECISIONS.md` — 42 ADR    | rà soát tay |

## Khối G — Tự sự (Phase 8)

Ánh xạ id loại mạch giữa bảng 28.3 và registry (ADR-0037): `phuc_thu` là
`bao_thu`, `cuu_the` là `troi_day`. Tám id còn lại giữ nguyên chữ của 28.3;
`di_cu`, `phat_kien`, `tranh_domain`, `doi_thuong` là bốn loại thêm của Phase 0.

| Đặc tả                                                   | Module                                        | Test             |
| -------------------------------------------------------- | --------------------------------------------- | ---------------- |
| 28.2 `StorylineSchema`                                   | `core/schema/truyen.ts`                       | `truyen.test.ts` |
| 28.2 [BB] `nguoiChoiBiet = false` phải là ĐA SỐ          | `batBienTruyen.ts` `mach_truyen_khong_lay…`   | `truyen.test.ts` |
| 28.3 Mười loại mạch, tiền đề dò từ world state           | `core/truyen/loaiMach.ts`                     | `truyen.test.ts` |
| 28.3 `phan_boi` khai thác khe hở `tinNgo` ↔ `yeuGhet`    | `HANDLER_LOAI_MACH.phan_boi`                  | `truyen.test.ts` |
| 28.4 Máy sinh: dò, lọc trùng, trần, hạn ngạch vắng       | `quetMachTruyen()`                            | `truyen.test.ts` |
| 28.5 [BB] Nhịp truyện chạy bằng ENGINE, không LLM        | `nhipMachTruyen()`, `world/process/truyen.ts` | `truyen.test.ts` |
| 28.5 `chet_yeu` là kết cục hợp lệ, có ghi biên niên      | `nhipMachTruyen()` ghi `ketCuc` + `tickKet`   | `truyen.test.ts` |
| 28.6 [BB] Hạn ngạch vắng mặt đo theo SỐ CẢNH             | `hanNgachVangMat()`, `TI_LE_VANG_MAT`         | `truyen.test.ts` |
| 29.1 `LensSchema`, năm loại mục tiêu                     | `core/schema/truyen.ts`                       | `truyen.test.ts` |
| 29.1 [BB] Chuyển ống kính không tốn lượt/thời gian       | `datOngKinh()`, `store/game.ts` `chiaOngKinh` | `truyen.test.ts` |
| 29.1 `tu_dong` chọn theo căng thẳng, trộn seeded         | `chonMucTieu()`                               | `truyen.test.ts` |
| 29.2 Bảy quy tắc Narrator                                | `core/ai/bienSoan.ts`                         | `ai.test.ts`     |
| 29.2 quy tắc 5 — ống kính ở xa thì không nhắc người chơi | `tang4()` + `ongKinhOChoNguoiChoi()`          | `ai8.test.ts`    |
| 29.2 quy tắc 7 — Sáng Thế không có mặt trong cảnh        | `ongKinhOChoNguoiChoi()` kiểm `chuTheId`      | `truyen.test.ts` |
| 29.3 Người chơi không có trường ưu ái trong `Storyline`  | `NhanVatMachSchema` (ba trường)               | `truyen.test.ts` |
| 30.1 Tầng nhớ thứ tư — ký ức mạch                        | `Storyline.kyUcMach`, `view.machTruyen`       | `ai8.test.ts`    |
| 30.2 `ForeshadowSchema`, Sổ Phục Bút                     | `core/schema/truyen.ts`                       | `truyen.test.ts` |
| 30.2 Quá hạn thành `gap` loại `nhan_qua`, KHÔNG biến mất | `raSoatPhucBut()`, `phuc_but_khong_bien_mat`  | `truyen.test.ts` |
| 30.2 Updater trả khối `<Foreshadow>`                     | `bocTach()`, `bienSoanPromptCapNhat()`        | `ai8.test.ts`    |
| 30.3 [BB] Nén mất VĂN, không mất nhân quả tự sự          | `nenKyUcMach()`, `kiemNenKhongMat()`          | `truyen.test.ts` |

## Khối O — RAG (Phase 8)

| Đặc tả                                                        | Module                                 | Test                |
| ------------------------------------------------------------- | -------------------------------------- | ------------------- |
| 54.1 Ba kênh, hợp nhất bằng RRF (k = 60)                      | `core/retrieval/kenh.ts`               | `retrieval.test.ts` |
| 54.1 Trọng số từ vựng 1.0 · ngữ nghĩa 1.0 · đồ thị 1.2        | `TRONG_SO_KENH`                        | `retrieval.test.ts` |
| 54.2 Chunk theo đơn vị tự nhiên; cảnh đã kể dùng cửa sổ trượt | `chunk.ts` `cuaSoTruot()`, `chiMuc.ts` | `retrieval.test.ts` |
| 54.2 [BB] Mỗi diễn giải luật là MỘT chunk riêng, gắn `vungId` | `dungChiMuc()`                         | `retrieval.test.ts` |
| 54.3 [BB] Nhãn tầm nhìn gán LÚC INDEX                         | `ChunkSchema.tamNhin`, `dungChiMuc()`  | `retrieval.test.ts` |
| 54.3 [BB] Lọc tầm nhìn chạy TRƯỚC khi xếp hạng                | `locTamNhin()` là câu lệnh đầu tiên    | `retrieval.test.ts` |
| 54.3 Chunk `laTinDon` phải qua `bopMeo()`                     | `locTamNhin()`                         | `retrieval.test.ts` |
| 54.4 int8, suy giảm êm khi thiếu embedding                    | `luongTuHoa()`, `kenhNguNghia()`       | `retrieval.test.ts` |
| 54.5 Tiền lọc metadata rồi vét cạn cosine                     | `locTamNhin()` → `kenhNguNghia()`      | `retrieval.test.ts` |
| 54.6 Ba truy vấn Q1/Q2/Q3; Q3 hỏi tiền lệ                     | `dungBaTruyVan()`                      | `retrieval.test.ts` |
| 54.7 Công thức xếp hạng lại (baseline heuristic)              | `diemHeuristic()`                      | `retrieval.test.ts` |
| 54.8 `vector = null` là trạng thái hợp lệ ở mọi nơi           | `ChunkSchema`, `kenhNguNghia()`        | `retrieval.test.ts` |
| 54.9 Thứ tự tám bước nối vào Assembler                        | `truyHoi()`, `bienSoanPromptKe()`      | `retrieval.test.ts` |
| 54.10 `<Unverified>` thành ứng viên gap `nhan_qua`            | `bocTach()`, `store/game.ts`           | `ai8.test.ts`       |
| 54.11 mục 40 Đa dạng truy hồi                                 | `mmr()` + `tranTyLeMotNguon`           | `retrieval.test.ts` |
| 6.4 `moRong()` bắt buộc nhận `view`                           | `core/project/moRong.ts`               | `retrieval.test.ts` |

## Khối H — Ngân sách và Updater (Phase 8)

| Đặc tả                                                | Module                              | Test          |
| ----------------------------------------------------- | ----------------------------------- | ------------- |
| 33.1 Tầng 4 mang `kyUcMach`, nút thắt, vai trò        | `bienSoan.ts` `tang4()`             | `ai8.test.ts` |
| 33.1 Sổ Phục Bút nằm CUỐI prompt                      | `bienSoan.ts` `tang6()`             | `ai8.test.ts` |
| 33.2 Chọn nội dung tầng 4–6 từ tiêu điểm              | `truyHoi()` + `tang5()`             | `ai8.test.ts` |
| 34.1 Bảng ngân sách theo loại call                    | `core/ai/nganSach.ts`               | `ai8.test.ts` |
| 34.2 [BB] KHÔNG dùng `length / 4` của tiếng Anh       | `uocLuong()`                        | `ai8.test.ts` |
| 34.3 Tự hiệu chỉnh, cắt cụt giảm 15% và KHÔNG im lặng | `tuHieuChinh()`                     | `ai8.test.ts` |
| Cổng Phase 8 — token budget có trace block bị cắt     | `catTheoTran()`, `PromptGoi.vetCat` | `ai8.test.ts` |
| 46.1 Cập Nhật Biến có điểm cuối riêng                 | `core/ai/capNhat.ts`, `store/ai.ts` | `ai8.test.ts` |
| 46.2 Updater tắt được; Narrator thì không             | `updaterChayRieng()`                | `ai8.test.ts` |

## Khối G/H/O — vòng siết Phase 8

| Đặc tả                                                      | Module                                                 | Test                |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------------------- |
| 28.5 Nhịp áp `bienDoiTrangThai` vào world                   | `machTruyen.ts` `apBienDoiTuSu()`                      | `truyen.test.ts`    |
| 28.5 Nhịp chỉ chạm `soul.kyUc` / `soul.tamTrang` (ADR-0040) | `registry/misc.ts` khai `ghi`                          | `truyen.test.ts`    |
| 11.1 Cảm xúc phải có đối tượng và nguyên nhân               | `apBienDoiTuSu()` ghi `nguonGocKyUcId`                 | `truyen.test.ts`    |
| 30.3 Nén chạy ở mốc kỷ nguyên (ADR-0041)                    | `kyUc.ts` `laMocKyNguyen()`, `world/process/truyen.ts` | `truyen.test.ts`    |
| 30.3 Bộ đệm nhịp có trần, nén xong thì dọn                  | `Storyline.nhipGanDay`, `nenCuoiKyNguyen()`            | `truyen.test.ts`    |
| 34.3 Tự hiệu chỉnh nhận `usage` THẬT                        | `ai/phuongNgu.ts` `rutSoDung()`, `store/ai.ts`         | `ai8.test.ts`       |
| 77.8 Cache rerank nối vào đường chơi                        | `store/game.ts` `docCacheRerank()`                     | `retrieval.test.ts` |
| 77.10 Bộ đề tự nhãn từ 18.2 (ADR-0042)                      | `retrieval/boDanhGia.ts`                               | `retrieval.test.ts` |
| 77.11 Nút "Chạy bộ đánh giá"                                | `ui/panels/OngKinh.tsx`                                | rà soát trình duyệt |
| 29.1 Ống kính chĩa được vào nhân vật và vùng                | `ui/screens/SanhThienDien.tsx`                         | rà soát trình duyệt |
| 54.11 mục 40 Đa dạng đo theo CHỖ trong top-10               | `danhGia.ts` `tyLeTrungNguon()`                        | `retrieval.test.ts` |

## Khối R — Preset Bridge (Phase 9)

| Đặc tả                                                        | Module                                           | Test             |
| ------------------------------------------------------------- | ------------------------------------------------ | ---------------- |
| 62.1 [BB] Năm loại preset không được trộn                     | `preset/doDinhDang.ts`, `registry/packDsl.ts`    | `preset.test.ts` |
| 62.2 Vỏ nhập bất biến, raw source giữ theo hash               | `preset/schema.ts`, `nhap.ts` bước 6             | `preset.test.ts` |
| 62.3 Mười hai lane + sáu trạng thái kích hoạt                 | `preset/schema.ts` `MODULE_LANES`                | `preset.test.ts` |
| 62.3 [BB] Prompt ngoài mặc định CHỈ nhắm `narrator`           | `bienDich.ts` `locModuleChoPipeline()`           | `preset.test.ts` |
| 62.4 Tham số giữ raw, clamp theo profile, có bảng diff        | `chuanHoa.ts` `chuanHoaThamSo()`                 | `preset.test.ts` |
| 63.1 [BB] Pipeline mười hai bước                              | `preset/nhap.ts`                                 | `preset.test.ts` |
| 63.1 Không bước nào gọi model / chạy script / tải URL         | không import `src/ai/`, `src/db/`                | `preset.test.ts` |
| 63.2 Dò format bằng HÌNH DẠNG, không bằng tên file            | `doDinhDang.ts`                                  | `preset.test.ts` |
| 63.3 quy tắc 1–2 `prompt_order` là nguồn thứ tự và trạng thái | `chuanHoa.ts` `chuanHoaSillyTavern()`            | `preset.test.ts` |
| 63.3 quy tắc 3 fallback khi toàn file không có `prompt_order` | `chuanHoa.ts` `coOrder`                          | `preset.test.ts` |
| 63.3 quy tắc 4 `ORDER_DANGLING`, KHÔNG tạo prompt rỗng        | `chuanHoa.ts`                                    | `preset.test.ts` |
| 63.3 quy tắc 5 prompt ngoài order giữ lại, mặc định TẮT       | `chuanHoa.ts` `UNORDERED_PROMPT`                 | `preset.test.ts` |
| 63.3 quy tắc 6 identifier trùng KHÔNG tự gộp                  | `chuanHoa.ts` namespace `packId/src#n`           | `preset.test.ts` |
| 63.4 Marker → lane; marker rỗng là SLOT                       | `chuanHoa.ts` `MARKER_SANG_LANE`                 | `preset.test.ts` |
| 63.5 Macro parse thành AST, không replace chuỗi               | `preset/macro.ts` `docMacro()`                   | `preset.test.ts` |
| 63.5 `{{random}}` seeded theo scene + module + turn           | `macro.ts` dùng `taoRng()`                       | `preset.test.ts` |
| 63.5 Biến trong namespace `preset.<packId>`, cycle có đường   | `khoaBienPack()`, `MACRO_CYCLE`                  | `preset.test.ts` |
| 63.6 [BB] Thứ tự bất biến 0–6; pack ngoài không lên tầng < 4  | `bienDich.ts` `bienDichPromptPreset()`           | `preset.test.ts` |
| 63.7 Dry run không làm bẩn save — WorldView giả               | `preset/giaLap.ts`                               | `preset.test.ts` |
| 63.8 Thẻ legacy thành ứng viên; suy luận bị BỎ                | `preset/theLegacy.ts`                            | `preset.test.ts` |
| 63.8 Thẻ native `td:*` không bị parser legacy ăn              | `theLegacy.ts` `THE_NATIVE`                      | `preset.test.ts` |
| 64.1 Sáu trạng thái tương thích                               | `schema.ts` `ACTIVATION_STATES`                  | `preset.test.ts` |
| 64.2 [BB] Script Tavern Helper LUÔN `quarantined`             | `chuanHoa.ts`, `QuarantinedScriptSchema`         | `preset.test.ts` |
| 64.2 `ExtensionAdapterManifest` bốn capability                | `preset/schema.ts`                               | `preset.test.ts` |
| 64.3 Regex chỉ chạy trên bản sao output, ba lớp (ADR-0045)    | `preset/sandbox.ts` `apTransform()`              | `preset.test.ts` |
| 64.3 Sanitizer xóa script/iframe/form/handler/URL cấm         | `sandbox.ts` `lamSachHtml()`                     | `preset.test.ts` |
| 64.4 Secret bị che; URL chỉ LIỆT KÊ, không tải                | `preset/anToan.ts` `cheSecret()`, `quetAnToan()` | `preset.test.ts` |
| 64.4 `__proto__` → từ chối node đó                            | `anToan.ts` `KHOA_CAM`, `locKhoaNguyHiem()`      | `preset.test.ts` |
| 64.5 Classifier chỉ gắn nhãn, không tự xóa                    | `anToan.ts` `phanLoaiNoiDung()`                  | `preset.test.ts` |
| 64.5 Ba nhãn vượt quyền → cách ly; reasoning → tắt            | `anToan.ts` `XU_LY_THEO_NHAN`                    | `preset.test.ts` |
| 65.1 Mười lăm conflict key + sáu chiến lược                   | `preset/xungDot.ts`                              | `preset.test.ts` |
| 65.2 [BB] Cycle KHÔNG tự bẻ bằng id                           | `xungDot.ts` `dungDoThi()`, `timCycle()`         | `preset.test.ts` |
| 65.3 Tám bậc quyền; role `system` không phải quyền sửa engine | `kichHoat.ts` `BAC_QUYEN`                        | `preset.test.ts` |
| 65.4 Kích hoạt là transaction; hoàn tác đổi con trỏ           | `kichHoat.ts` `kichHoat()`, `hoanTac()`          | `preset.test.ts` |
| 65.5 Cùng hash không nhân đôi; khác hash → version mới        | `nhap.ts` bước 3, `versionKeTiep()`              | `preset.test.ts` |
| 65.5 Diff sáu chiều theo module id                            | `kichHoat.ts` `diffPack()`                       | `preset.test.ts` |
| 66.1 Wizard bảy màn, quay lại không parse lại                 | `preset/wizard.ts`                               | `preset.test.ts` |
| 66.2 Báo cáo sáu dòng số, không một dấu check                 | `wizard.ts` `baoCaoNhap()`                       | `preset.test.ts` |
| 66.3, 66.4 Hai fixture đúng count và mismatch                 | `nhap.ts` `ThongKeChuanHoa`                      | `preset.test.ts` |
| 66.5 Mười hai mục cổng                                        | toàn bộ `core/preset/`                           | `preset.test.ts` |
| 78.11 `{{user}}` chỉ nhận `ProjectedPlayerPersona`            | `macro.ts` `NguCanhMacro.user`                   | `preset.test.ts` |

## Khối L — Tiếp Địa, Luật Nền, Cơ Chế Phái Sinh (Phase 10)

| Đặc tả                                                      | Module                                             | Test              |
| ----------------------------------------------------------- | -------------------------------------------------- | ----------------- |
| 42.2 `lawful.tiepDia`, `hieuLuc`, `cheDoTiepDia`            | `schema/aspect/lawful.ts`                          | `phase10.test.ts` |
| 42.4 [BB] `tinhHieuLuc()` dùng MIN, không dùng trung bình   | `vatly/tiepDia.ts`                                 | `phase10.test.ts` |
| 42.3 Ba chế độ; hai chế độ mềm KHÔNG BAO GIỜ trượt          | `tiepDia.ts` `kiemTiepDia()`                       | `phase10.test.ts` |
| 42.3 `tu_tiep_dia` tạo khái niệm hư danh trọng số 0         | `tiepDia.ts` `khaiNiemHuDanh()`                    | `phase10.test.ts` |
| 42.3 `tu_suy` tìm khái niệm sẵn có trước                    | `tiepDia.ts` `suyKhaiNiemSanCo()`                  | `phase10.test.ts` |
| 42.5 Đánh vào khái niệm làm luật tụt hiệu lực               | `tiepDia.ts` `anhHuongKhiKhaiNiemYeuDi()`          | `phase10.test.ts` |
| 42.5 [BB] Hồi sinh luật đã chết + mạch `phuc_hung`          | `coTheHoiSinh()`, `truyen/loaiMach.ts`             | `phase10.test.ts` |
| 42.7 Panel hiện Hiệu Lực và dòng dạy cơ chế                 | `tiepDia.ts` `bangTiepDia()`                       | `phase10.test.ts` |
| 43.3 `SubstrateLaw` bảy trục, vô danh / có tên              | `vatly/schema.ts`, `luatNen.ts`                    | `phase10.test.ts` |
| 43.2 [BB] Đặt tên sinh sự kiện lớn + mạch `dat_ten`         | `luatNen.ts` `datTenTruc()`, `loaiMach.ts`         | `phase10.test.ts` |
| 43.3 [BB] `khaiNiemNenId` bắt buộc để chuyển `co_ten`       | `datTenTruc()`, bất biến `ke_ho_chi_co_khi_co_ten` | `phase10.test.ts` |
| 43.4 `khoangCach = 'y_nghia'` đổi lân cận của `moRong()`    | `luatNen.ts` `canhLienKeYNghia()`                  | `phase10.test.ts` |
| 43.5 [BB] Thứ tự phụ thuộc; đặt sai thì validator bắt       | `PHU_THUOC_TRUC`, bất biến `luat_nen_dung_thu_tu`  | `phase10.test.ts` |
| 43.6 [BB] Sửa luật nền LUÔN phân nhánh                      | `luatNen.ts` `suaLuatNen()`                        | `phase10.test.ts` |
| 43.7 Luật nền tự kết tinh từ khái niệm                      | `luatNen.ts` `quetTuKetTinh()`                     | `phase10.test.ts` |
| 44.2 [BB] `moTaKhiKhong` là trường bắt buộc                 | `vatly/coChe.ts` `CO_CHE`                          | `phase10.test.ts` |
| 44.3 Thần Bí: càng cổ càng mạnh, càng bị hiểu càng yếu      | `coChe.ts` `thanBi()`                              | `phase10.test.ts` |
| 44.3 Nguyên Điểm kéo bản tính, sụp hết thì đề xuất đổi kind | `coChe.ts` `keoBanTinh()`                          | `phase10.test.ts` |
| 44.3 Vũ Khí Khái Niệm: chỉ TÍNH hậu quả, không áp           | `coChe.ts` `hauQuaVuKhiKhaiNiem()`                 | `phase10.test.ts` |
| 44.4 Phát hiện và công bố giọng biên niên                   | `coChe.ts` `quetCoChe()`                           | `phase10.test.ts` |
| 44.4 [BB] Tắt cơ chế thì xử lý tử tế, không xóa cứng        | `coChe.ts` `hauQuaKhiTat()`                        | `phase10.test.ts` |
| 44.5 Panel Vật Lý Thế Giới ba tầng                          | `bangLuatNen()`, `bangCoChe()`                     | `phase10.test.ts` |

## Khối I + O — Lorebook (Phase 10)

| Đặc tả                                                   | Module                             | Test              |
| -------------------------------------------------------- | ---------------------------------- | ----------------- |
| 35.2 `Lorebook` + `LorebookEntry`                        | `lore/schema.ts`                   | `phase10.test.ts` |
| 35.3 Ba định dạng tự dò                                  | `lore/nhap.ts` `doDinhDangLore()`  | `phase10.test.ts` |
| 35.3 [BB] `<user>` là LỖI, kèm đề xuất sửa hàng loạt     | `nhap.ts` `CU_PHAP_USER_SAI`       | `phase10.test.ts` |
| 35.3 EJS hỏng chỉ rõ entry và DÒNG                       | `nhap.ts` `kiemEjs()`              | `phase10.test.ts` |
| 35.3 Đếm token thật bằng `tyLeToken` đã hiệu chỉnh       | `nhap.ts` dùng `uocLuong()`        | `phase10.test.ts` |
| 35.4 Kỳ vọng là ĐIỂM HÚT, không phải kịch bản            | `lore/kyVong.ts` `trichKyVong()`   | `phase10.test.ts` |
| 35.4 `lucHapDan` nhân vào `uuTien` của gap               | `kyVong.ts` `capNhatKyVong()`      | `phase10.test.ts` |
| 35.5 [BB] Dị Bản đủ bốn thứ bắt buộc + sinh gap          | `kyVong.ts`, `DiBanSchema`         | `phase10.test.ts` |
| 35.6 Bản Đồ Dị Biệt — hồ sơ, không phải bảng lỗi         | `kyVong.ts` `banDoDiBiet()`        | `phase10.test.ts` |
| 51.1 kiểu F — kỳ vọng chết thì entry gốc bị che cùng lúc | `kyVong.ts` `entryCanChe()`        | `phase10.test.ts` |
| 51.2 [BB] Sử thắng Nguồn                                 | `lore/doiSoat.ts` `UU_TIEN_NGUON`  | `phase10.test.ts` |
| 51.3 Bốn quan hệ đối soát và cách xử lý                  | `doiSoat.ts` `doiSoatEntry()`      | `phase10.test.ts` |
| 51.3 [BB] Che KHÔNG phải xóa; có lý do; bỏ che được      | `doiSoat.ts` `che()`, `boChe()`    | `phase10.test.ts` |
| 51.4 [BB] Khóa canon không bao giờ bị che                | bất biến `khoa_canon_khong_bi_che` | `phase10.test.ts` |
| 51.5 [BB] Dải `order` năm khoảng                         | `lore/schema.ts` `DAI_ORDER`       | `phase10.test.ts` |
| 51.6 [BB] Chống ô nhiễm: sử N không sinh từ sử N−1       | `doiSoat.ts` `kiemNguonSinhSu()`   | `phase10.test.ts` |
| 51.6 [BB] `doTinCay` chỉ tăng do sự kiện engine          | `lore/tinCay.ts` `tinhDoTinCay()`  | `phase10.test.ts` |
| 51.7 Bảng Đối Soát                                       | `doiSoat.ts` `bangDoiSoat()`       | `phase10.test.ts` |
| 52.1 Bảy op cấp AI                                       | `lore/ops.ts` `LorebookOp`         | `phase10.test.ts` |
| 52.2 [BB] Bảng quyền — AI không sửa entry người dùng     | `ops.ts` `QUYEN_OP` + bất biến     | `phase10.test.ts` |
| 52.3 [BB] Xóa mềm, thùng rác ba kỷ nguyên                | `ops.ts` `conTrongThungRac()`      | `phase10.test.ts` |
| 52.4 Xác thực từng op; op trượt thì bỏ op đó             | `ops.ts` `apMotOp()`, `apLoOp()`   | `phase10.test.ts` |
| 52.5 Lịch sử phiên bản tối đa 20 mục                     | `LorebookEntrySchema.lichSu`       | `phase10.test.ts` |
| 53.2 [BB] Keyword rút từ thu hoạch danh từ               | `tinCay.ts` `thuHoachDanhTu()`     | `phase10.test.ts` |
| 53.3 [BB] Vượt trần thì TÁCH, không cắt cụt              | `tinCay.ts` `kiemEntry()`          | `phase10.test.ts` |
| 53.4 `doTinCay < 20` thì lưu nhưng KHÔNG nạp             | `tinCay.ts` `duocNap()`            | `phase10.test.ts` |
| 53.5 Brief sinh entry không có câu hỏi mở nào            | `tinCay.ts` `briefSinhEntry()`     | `phase10.test.ts` |

## Khối N — Workflow theo tác vụ (Phase 10)

| Đặc tả                                                      | Module                                     | Test              |
| ----------------------------------------------------------- | ------------------------------------------ | ----------------- |
| 50.2 [BB] `nhomPrompt` là mảng có tên và vai trò            | `workflow/schema.ts`, `dungSan.ts`         | `phase10.test.ts` |
| 50.2 [KN] Nhóm assistant cuối làm mồi định dạng             | `dungSan.ts` `moiDinhDang()`               | `phase10.test.ts` |
| 50.3 Giai đoạn: cùng stage song song, stage sau chờ         | `workflow/chay.ts` `chayDuongOng()`        | `phase10.test.ts` |
| 50.3 [BB] Họ bản sao — 30 mục thành 30 call, lô 5           | `chay.ts` `chayMotTacVu()`                 | `phase10.test.ts` |
| 50.3 Một call hỏng không kéo sập 29 cái kia                 | `chay.ts` `thatBai[]`                      | `phase10.test.ts` |
| 50.3 Chuỗi dự phòng chạy khi preset chính lỗi               | `chay.ts` `goiCoThuLai()`                  | `phase10.test.ts` |
| 50.4 [BB] Bốn chế độ lịch, có thời gian truyện              | `workflow/lich.ts` `quyetDinhChay()`       | `phase10.test.ts` |
| 50.4 [BB] `khiParseLoi = 'bo_qua'` là mặc định an toàn      | `lich.ts`                                  | `phase10.test.ts` |
| 50.5 Ngữ cảnh riêng: `tangAssembler`, `quyTacTrich`         | `workflow/schema.ts` `TaskContext`         | `phase10.test.ts` |
| 50.6 [BB] op `delta` ánh xạ sang `add` và cộng dồn          | `dichGhi.ts` `opEngineCua()`, `gopDelta()` | `phase10.test.ts` |
| 50.7 Ba đích ghi; `ghi_lorebook` là đích đáng giá nhất      | `workflow/dichGhi.ts`                      | `phase10.test.ts` |
| 50.7 [BB] `chongDeQuy` bắt buộc cho entry workflow ghi      | `dichGhi.ts` `ghiLorebook()`               | `phase10.test.ts` |
| 50.8 Preset workflow + xuất/nhập một file JSON              | `dungSan.ts` `xuatPreset()`                | `phase10.test.ts` |
| 50.9 Bảy tác vụ dựng sẵn, đủ bảy giai đoạn                  | `dungSan.ts` `TAC_VU_DUNG_SAN`             | `phase10.test.ts` |
| 50.9 [BB] Stage 2 bắt buộc bật họ bản sao                   | `dungSan.ts` `kiemLanRanh()`               | `phase10.test.ts` |
| 50.9 [BB] Stage 4 dùng lịch thời gian truyện                | `dungSan.ts` `kiemLanRanh()`               | `phase10.test.ts` |
| 50.10 [BB] Không tác vụ nào ghi lorebook người dùng         | `ghiLorebook()` + bất biến                 | `phase10.test.ts` |
| 50.11 "Chạy thử tác vụ này" không áp patch, không gọi model | `chay.ts` `chayThu`                        | `phase10.test.ts` |
| 50.12 Sáu chẩn đoán 31–36; mục 36 là hỏng nặng              | `dungSan.ts` `chanDoanWorkflow()`          | `phase10.test.ts` |

## Khối M + F + O — Diễn Hóa, hợp nhánh, pack, benchmark (Phase 10)

| Đặc tả                                                     | Module                                       | Test              |
| ---------------------------------------------------------- | -------------------------------------------- | ----------------- |
| 26.2 Diff hai nhánh ba cột                                 | `branch/gopNhanh.ts` `soSanhNhanh()`         | `phase10.test.ts` |
| 26.3 Hợp nhánh có giá −35 và sinh vùng Nghịch Lý           | `gopNhanh()`                                 | `phase10.test.ts` |
| 26.3 NPC nhớ HAI phiên bản quá khứ                         | `gopNhanh()` `kyUcHaiBan`                    | `phase10.test.ts` |
| 47.1 Cấu hình Diễn Hóa                                     | `world/dienHoa.ts` `CauHinhDienHoaSchema`    | `phase10.test.ts` |
| 47.3 [BB] Dừng khi có chuyện đáng xem, không khi hết lượt  | `dienHoa.ts` `kiemDieuKienDung()`            | `phase10.test.ts` |
| 47.4 [BB] Lằn ranh cứng lọc TỪNG patch                     | `dienHoa.ts` `locPatchTheoLanRanh()`         | `phase10.test.ts` |
| 47.4 [BB] Giết nhân vật người chơi là công tắc riêng, tắt  | `duocGietNhanVatNguoiChoi`                   | `phase10.test.ts` |
| 47.5 Nhật ký + ảnh chụp trước khi chạy                     | `dienHoa.ts` `EvolutionLogSchema`            | `phase10.test.ts` |
| 47.6 Báo cáo giọng biên niên, có nút xem từng khoảnh khắc  | `dienHoa.ts` `baoCaoDienHoa()`               | `phase10.test.ts` |
| 62.1 loại 5 World pack: engine sau validate, không có code | `registry/packDsl.ts` `nhapWorldPack()`      | `phase10.test.ts` |
| 5.2 tầng 2 `handlerId` lạ vào `can_adapter` (ADR-0006)     | `packDsl.ts`                                 | `phase10.test.ts` |
| 61.4 Tuning kèm pack gộp CÓ SCHEMA                         | `packDsl.ts` dùng `TuningSchema`             | `phase10.test.ts` |
| 77.10 Benchmark sau baseline heuristic                     | `retrieval/benchmark.ts` `chayBenchmark()`   | `phase10.test.ts` |
| 77.10 [BB] Rò chunk cấm là `khong_dung_duoc`, dù nDCG cao  | `benchmark.ts` `ketLuan()`                   | `phase10.test.ts` |
| 77.10 Lịch sử chỉ số so được giữa hai phiên                | `benchmark.ts` `soSanhPhien()`               | `phase10.test.ts` |
| 7.1 [BB] Ba nhóm tuning mới không hardcode trong engine    | `tuning/schema.ts` `vatLy`/`lore`/`workflow` | `tuning.test.ts`  |

---

## Phase 11 — UI hoàn chỉnh, hai bảng và một đường prompt

| Yêu cầu đặc tả                                                 | Nơi cài                                         | Test              |
| -------------------------------------------------------------- | ----------------------------------------------- | ----------------- |
| 55.2 Thanh Thiên Tượng, một dòng, luôn hiện                    | `bang/thienDien.ts` `thanhThienTuong()`         | `bang.test.ts`    |
| 55.3 [BB] Tám vùng, thứ tự CỐ ĐỊNH                             | `bang/thienDien.ts` `VUNG_BANG`                 | `bang.test.ts`    |
| 55.4 [BB] "Từ lần trước" so từ lần MỞ BẢNG, không từ kỷ nguyên | `thienDien.ts` `tuLanTruoc()`/`danhDauDaXem()`  | `bang.test.ts`    |
| 55.4 [BB] Mỗi mục "Cần chú ý" mở thẳng tới chỗ xử lý           | `thienDien.ts` `MucCanChuY.dich`                | `bang.test.ts`    |
| 55.5 [BB] Bảng chỉ nhận `WorldView`                            | `tinhBangThienDien(view, anh)`                  | `bang.test.ts`    |
| 55.5 Phàm nhân không có ba vùng số                             | `thienDien.ts` trả `null`, không trả `[]`       | `bang.test.ts`    |
| 55.6 quy tắc 4 Sparkline một nét, bảy điểm                     | `ui/screens/BangThienDien.tsx` `Sparkline`      | —                 |
| 55.6 quy tắc 5 Delta theo hướng tốt/xấu, có dấu và số          | `BangThienDien.tsx` `Delta`                     | `bang.test.ts`    |
| 55.6 quy tắc 6 Không thanh tô đầy — khối `█▁`                  | `BangThienDien.tsx` `Khoi`                      | —                 |
| 55.8 [BB] Snapshot vật chất hoá ở ranh giới tick               | `thienDien.ts` `chupBang()`, `store/ui.ts`      | `bang.test.ts`    |
| 55.8 [BB] Ảnh của tầng khác KHÔNG tái dùng                     | `chupBang()` vứt ảnh khác `mode`                | `bang.test.ts`    |
| 58.1 [BB] Không bao giờ hai lớp phủ chồng nhau                 | `store/ui.ts` `lopPhu` là MỘT giá trị           | —                 |
| 58.3 [BB] Màn mặc định hiện TÊN THẬT                           | `bang/thongTin.ts` `tinhBangThongTin()`         | `bang.test.ts`    |
| 58.4 Dải định vị năm trường, dính khi cuộn                     | `ui/screens/BangThongTin.tsx`                   | —                 |
| 58.6 Tab Quy luật, thứ tự năm bậc                              | `thongTin.ts` `dungQuyLuat()`                   | `bang.test.ts`    |
| 58.7 [BB] Chip lọc dựng từ `R.kind`, không hardcode            | `thongTin.ts` `chipLoai`                        | `bang.test.ts`    |
| 58.9 Ghim mạch là thao tác UI thuần, không đổi spotlight       | `store/ui.ts` `ghimMach()`                      | —                 |
| 58.10 [BB] Chuỗi hệ quả từ link THẬT, không bịa mắt xích       | `thongTin.ts` `dungTa()`                        | `bang.test.ts`    |
| 58.11 Trần 12 mục ghim, vượt thì YÊU CẦU bỏ bớt                | `store/ui.ts` `TRAN_GHIM`                       | —                 |
| 58.12 [BB] Tìm kiếm chạy SAU chiếu                             | `thongTin.ts` `timTrongBang(bang, q)`           | `bang.test.ts`    |
| 58.13 [BB] Không hiện raw id, key schema hay tên enum          | `NHAN_PHAM_VI`, `NHAN_GIAI_DOAN`, `tenKind()`   | `bang.test.ts`    |
| 58.13 Câu rỗng riêng từng tab                                  | `thongTin.ts` `CAU_RONG`                        | `bang.test.ts`    |
| 59.1 [BB] `provenance` là aspect, không suy từ `tickSinh`      | `schema/aspect/provenance.ts`                   | `bang.test.ts`    |
| 59.1 Save cũ thiếu aspect → `nhap_du_lieu`, không bịa actor    | `docNguonGoc()`                                 | `bang.test.ts`    |
| 59.2 Trạng thái UI lưu theo save và nhánh                      | `db/schema.ts` `uiState`, `store/ui.ts`         | `db.test.ts`      |
| 63.4 Marker lắp bằng nội dung native ĐÃ CHIẾU                  | `preset/slotNative.ts` `dungLoiNative()`        | `hopNhat.test.ts` |
| 63.6 [BB] Pack ngoài không lên trên tầng 0–3                   | `preset/bienDich.ts` thứ tự `them()`            | `hopNhat.test.ts` |
| 63.6 tầng 6 Assistant prefill nếu model hỗ trợ                 | `ai/phuongNgu.ts` `moiTraLoi`                   | `hopNhat.test.ts` |
| 64.1 `adapted` là trạng thái HOẠT ĐỘNG (ADR-0052)              | `store/preset.ts` `bat()`                       | —                 |
| 64.2 [BB] Script cách ly hiện ra, KHÔNG có nút bật             | `ui/screens/XuongPreset.tsx`                    | —                 |
| 64.3 Transform chạy trên BẢN SAO hiển thị                      | `store/preset.ts` `hienThi()`                   | `preset.test.ts`  |
| 65.2 [BB] Chưa giải xung đột thì không kích hoạt               | `XuongPreset.tsx` khối "Xung đột cần chọn"      | —                 |
| 65.3 [BB] Tám bậc quyền giữ nguyên sau hợp nhất                | `preset/hopNhat.ts` `bienSoanLuot()`            | `hopNhat.test.ts` |
| 65.4 [BB] Tắt pack trả prompt native                           | `hopNhat.ts` — không gọi compiler               | `hopNhat.test.ts` |
| 66.2 Báo cáo sáu dòng, không một dấu check xanh                | `XuongPreset.tsx` `baoCao.dong`                 | `preset.test.ts`  |
| 66.6 Bảng đường port là DỮ LIỆU, in ra được                    | `hopNhat.ts` `DUONG_PORT_TINH_NANG`             | `hopNhat.test.ts` |
| 66.6 Macro biến trong namespace pack, không xuyên save         | `db/schema.ts` `presetVars` `[packId+branchId]` | `hopNhat.test.ts` |
| 66.6 COT cleaner — bỏ reasoning tag ở parser                   | `ai/bocTach.ts` `catKhoi()`                     | `hopNhat.test.ts` |
| 31.7 Thẻ `<UpdateVariable>` và bản đồ đường dẫn                | `ai/mvu.ts` `docKhoiCapNhat()`                  | `hopNhat.test.ts` |
| 31.7 [BB] Field bắt đầu bằng `_` bị từ chối                    | `mvu.ts` `tuJson()`                             | `hopNhat.test.ts` |
| 50.6 Op `delta` ánh xạ sang `{_op:'add'}`                      | `mvu.ts` `docGiaTri()`                          | `hopNhat.test.ts` |
| 39 Mỗi mục chẩn đoán kèm câu hành động cụ thể                  | `ui/screens/ChanDoan.tsx`                       | —                 |
| 46.2 mục 27 Tỉ lệ patch trượt                                  | `ChanDoan.tsx` khối "Đường AI"                  | —                 |
| 77.11 Tab Truy hồi — kênh, thứ hạng, fallback, cache           | `ui/panels/OngKinh.tsx`, `ChanDoan.tsx`         | —                 |
| Cổng P11 Bảng mở < 16 ms với 50.000 entity                     | `thienDien.ts` `duyetMotLuot()` một lượt duyệt  | `bang.test.ts`    |
| Cổng P11 Mobile dùng được                                      | `design/tokens.css` `@media (max-width: 900px)` | —                 |
