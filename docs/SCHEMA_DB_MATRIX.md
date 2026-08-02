# SCHEMA ↔ DB MATRIX

Ma trận bắt buộc trước code gameplay — Phần 61.6 [BB].

> "Không schema nào được dùng trong spec mà thiếu cả type, nơi lưu và test parse."

Cột **Migration** ghi phiên bản Dexie mà bảng xuất hiện. `—` nghĩa là schema sống trong bộ
nhớ hoặc nhúng bên trong một bản ghi khác, không có bảng riêng.

---

## Hợp đồng lõi (Phần 61.3)

| Schema              | Registry | Bảng DB                          | Migration | Projected type             | Unit test           | Fixture          |
| ------------------- | -------- | -------------------------------- | --------- | -------------------------- | ------------------- | ---------------- |
| `WorldSchema`       | —        | `worlds`                         | v1        | `WorldView`                | `contracts.test.ts` | `WORLD_FIXTURE`  |
| `EventSchema`       | `R.*`    | `events`                         | v2        | `ProjectedEvent` (Phase 8) | `contracts.test.ts` | replay (Phase 1) |
| `SceneSchema`       | —        | `scenes`                         | v2        | —                          | `contracts.test.ts` | Phase 3          |
| `PatchOpSchema`     | —        | nhúng trong `events.patches`     | v2        | không chiếu                | `contracts.test.ts` | Phase 1          |
| `PlayerStateSchema` | —        | nhúng trong `worlds.playerState` | v1        | `ProjectedPlayerPersona`   | `contracts.test.ts` | `WORLD_FIXTURE`  |

## Thực thể và đồ thị (Phần 4, 6)

| Schema               | Registry              | Bảng DB                    | Migration    | Projected type                | Unit test           | Fixture            |
| -------------------- | --------------------- | -------------------------- | ------------ | ----------------------------- | ------------------- | ------------------ |
| `EntitySchema`       | `R.kind` / `R.aspect` | `entities` `[branchId+id]` | v2           | `ProjectedEntity`             | `contracts.test.ts` | `ENTITIES_FIXTURE` |
| `LinkSchema`         | `R.relation`          | `links` `[branchId+id]`    | v2           | lọc qua `moRong(view)`        | `contracts.test.ts` | `LINKS_FIXTURE`    |
| `GapSchema`          | `R.gap`               | `gaps` `[branchId+id]`     | v2 (Phase 2) | không chiếu ra ngoài Sáng Thế | `contracts.test.ts` | Phase 4            |
| `WorldMetricsSchema` | `R.metric`            | nhúng trong `worlds`       | v1           | chỉ hiện cuối kỷ nguyên       | `registry.test.ts`  | Phase 5            |

## Aspect (Phần 4.2)

Tất cả nhúng trong `entities.aspects[<id>]`, không có bảng riêng.
Cột **Chiếu** ghi ràng buộc rò rỉ [BB] của Phần 18.2.

| Schema                | Aspect id       | schemaRef                           | Chiếu                                                                 | Unit test           |
| --------------------- | --------------- | ----------------------------------- | --------------------------------------------------------------------- | ------------------- |
| `SoulSchema`          | `soul`          | `aspect.soul`                       | `banTinh` của thần: **phàm nhân không bao giờ thấy**                  | `contracts.test.ts` |
| `ConceptualSchema`    | `conceptual`    | `aspect.conceptual`                 | `trongSo`: phàm nhân **không** thấy                                   | `contracts.test.ts` |
| `LawfulSchema`        | `lawful`        | `aspect.lawful`                     | `vanBan`: phàm nhân **không bao giờ**; chỉ `dienGiai` vùng mình       | `contracts.test.ts` |
| `DomainSchema`        | `domain`        | `aspect.domain`                     | `suc` chỉ trong domain                                                | `contracts.test.ts` |
| `VenerableSchema`     | `venerable`     | `aspect.venerable`                  | `banTinhTinDoTin` là thứ **duy nhất** phàm nhân thấy về bản tính thần | `contracts.test.ts` |
| `DivisibleSchema`     | `divisible`     | `aspect.divisible`                  | `doPhanKy` chỉ Sáng Thế                                               | `contracts.test.ts` |
| `GenealogicalSchema`  | `genealogical`  | `aspect.genealogical`               | qua văn hóa                                                           | `contracts.test.ts` |
| `CarrierSchema`       | `carrier`       | `aspect.carrier`                    | tin đồn ở tầng phàm                                                   | `contracts.test.ts` |
| `SpatialSchema`       | `spatial`       | `aspect.spatial`                    | đầy đủ ở vùng mình                                                    | `contracts.test.ts` |
| `MortalSchema`        | `mortal`        | `aspect.mortal`                     | đầy đủ với chính mình                                                 | `contracts.test.ts` |
| `AdversarialSchema`   | `adversarial`   | `aspect.adversarial`                | tin đồn ở cả hai tầng dưới                                            | `contracts.test.ts` |
| `InstitutionalSchema` | `institutional` | `aspect.institutional`              | đầy đủ trong vùng                                                     | `contracts.test.ts` |
| `AvatarSchema`        | — (nhúng)       | `avatar`                            | khi hóa thân, `chieu()` tụt xuống mức phàm nhân                       | `contracts.test.ts` |
| `RelationStateSchema` | —               | `relations` `[branchId+tuId+denId]` | bất đối xứng, hai bản ghi riêng (v2)                                  | `contracts.test.ts` |

## Aspect nền — Thế Giới Sống (Phần 71.2, 72.4)

Cũng nhúng trong `entities.aspects[<id>]`. Thêm ở Phase 5 theo ADR-0021.

**Chiếu [BB]:** đây là **số của engine**. Phần 56.2 cấm đưa chúng ra tầng phàm nhân;
`chieu()` thay bằng mô tả định tính (`doiSong: 'thieu_an'`, không phải `thieuHut: 0.42`).
Thần thấy thêm quy mô trong lãnh địa mình. Sáng Thế thấy đủ.

| Schema           | Aspect id   | schemaRef          | Tiến trình giữ nó                                                      | Chiếu                         | Unit test       |
| ---------------- | ----------- | ------------------ | ---------------------------------------------------------------------- | ----------------------------- | --------------- |
| `DanCuSchema`    | `dan_cu`    | `aspect.dan_cu`    | `population_household`                                                 | phàm nhân chỉ thấy `soHo`     | `world.test.ts` |
| `YTeSchema`      | `y_te`      | `aspect.y_te`      | `health_disease`                                                       | `benhTat` định tính           | `world.test.ts` |
| `SinhThaiSchema` | `sinh_thai` | `aspect.sinh_thai` | `ecology`, `production_consumption`                                    | `dat` định tính               | `world.test.ts` |
| `KinhTeSchema`   | `kinh_te`   | `aspect.kinh_te`   | `production_consumption`, `exchange_debt`, `settlement_infrastructure` | `doiSong` / `nghe` định tính  | `world.test.ts` |
| `VanHoaSchema`   | `van_hoa`   | `aspect.van_hoa`   | `culture_language_religion`                                            | chỉ tên tập tục               | `world.test.ts` |
| `AnNinhSchema`   | `an_ninh`   | `aspect.an_ninh`   | `conflict_security`                                                    | `anToan` định tính            | `world.test.ts` |
| `DuongSchema`    | `duong`     | `aspect.duong`     | `travel_communication`, `settlement_infrastructure`                    | `thongSuot` + `loi` định tính | `world.test.ts` |

`DuongSchema` **không** có `.prefault({})` — `tuId`/`denId` là bắt buộc (ADR-0002).

## Bảng Thế Giới Sống (Phần 71.4, ADR-0020)

| Schema               | Bảng DB                     | Migration | Index                                                        | Vì sao là bảng                                                                      | Unit test       |
| -------------------- | --------------------------- | --------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------- |
| `KnowledgeRowSchema` | `knowledge` `[branchId+id]` | **v4**    | `knowerId`, `factId`, `[branchId+knowerId]`, `learnedAtTick` | bất biến "không tri thức teleport" phải **truy ngược** ai biết trước, qua tuyến nào | `world.test.ts` |
| `DebtRowSchema`      | `debts` `[branchId+id]`     | **v4**    | `creditorId`, `debtorId`, `status`, `dueTick`                | nợ có hai đầu, thường ở hai vùng; hai bản sao là hai con số lệch nhau               | `world.test.ts` |

## Tầng Thần (Phần 69, 22 — Phase 6)

| Schema                 | Aspect / Bảng                      | Migration | Chiếu                                                                               | Unit test      |
| ---------------------- | ---------------------------------- | --------- | ----------------------------------------------------------------------------------- | -------------- |
| `DivineIdentitySchema` | aspect `ban_nga`                   | —         | `coreSelf` chỉ Sáng Thế và chính vị thần; phàm nhân chỉ thấy `currentManifestation` | `than.test.ts` |
| `DomainStateSchema`    | nhúng trong `domain.domains`       | —         | `suc` chỉ trong domain (56.4)                                                       | `than.test.ts` |
| `GiaoUocSchema`        | aspect `giao_uoc`, kind `covenant` | —         | hai bên thấy đủ; người ngoài nghe kể                                                | `than.test.ts` |
| `PrayerSchema`         | bảng `prayers` `[branchId+id]`     | **v5**    | thần được gọi tên thấy đủ                                                           | `than.test.ts` |

### Phase 6b — phần còn nợ của tầng Thần

| Schema            | Aspect / Bảng                        | Migration | Chiếu                                                                     | Unit test       |
| ----------------- | ------------------------------------ | --------- | ------------------------------------------------------------------------- | --------------- |
| `AvatarSchema`    | aspect `avatar`                      | —         | chỉ Sáng Thế và chính vị thần; **hạ `mucChieu` xuống `pham_nhan`** (19.4) | `than6.test.ts` |
| `HoiDongSchema`   | aspect `hoi_dong` trên `pantheon`    | —         | ghế và nghị quyết công khai; uy tín chỉ thành viên                        | `than6.test.ts` |
| `GheSchema`       | nhúng trong `hoi_dong.ghe`           | —         | như trên                                                                  | `than6.test.ts` |
| `NghiQuyetSchema` | nhúng trong `hoi_dong.nghiQuyet`     | —         | như trên                                                                  | `than6.test.ts` |
| `DuAnSchema`      | aspect `du_an` (bọc `ProjectSchema`) | —         | mục tiêu công khai; tiến độ chỉ chủ thể                                   | `than6.test.ts` |

Cả hai áp copy-on-write giống `entities` (`BANG_COW`), nên fork nhánh vẫn O(1).
Migration v3→v4 không di chuyển dữ liệu nhưng **có** gieo aspect nền cho `place` của save cũ.

## Registry (Phần 5, 61.2)

| Schema                   | Nơi lưu                                                | Migration | Unit test           |
| ------------------------ | ------------------------------------------------------ | --------- | ------------------- |
| `RegistryManifestSchema` | `registryPacks` (Phase 10) + JSON pack                 | v2        | `registry.test.ts`  |
| `RegistryPackSchema`     | `registryPacks`                                        | v2        | `registry.test.ts`  |
| `ExprNodeSchema`         | nhúng trong manifest `conditions` và `lawful.kichHoat` | v2        | `contracts.test.ts` |
| `PatchTemplateSchema`    | nhúng trong manifest `effects`                         | v2        | `contracts.test.ts` |

**Bất biến [BB]:** `HandlerCatalog` và `SchemaCatalog` **chỉ nằm trong code**, không có bảng
DB, không đến từ JSON. Pack chỉ tham chiếu `handlerId` / `schemaRef`.

## Kiểu nền (Phần 61.2)

| Schema                  | Nơi lưu                                                             | Unit test                            |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| `EntityRefSchema`       | nhúng khắp nơi                                                      | `contracts.test.ts`                  |
| `StatePathSchema`       | nhúng trong `PatchTemplate`                                         | `contracts.test.ts`                  |
| `ImportIssueSchema`     | `presetPacks.issues` (Phase 9)                                      | `contracts.test.ts`                  |
| `BlockReasonSchema`     | nhúng trong `Outcome` (Phase 4)                                     | `contracts.test.ts`                  |
| `ConditionRecordSchema` | nhúng trong `mortal.thanThe.conditions`                             | `contracts.test.ts`                  |
| `ClaimSchema`           | nhúng trong `mortal.soHuu`                                          | `contracts.test.ts`                  |
| `DebtSchema`            | `debts` `[branchId+id]` — **v4** (ADR-0020)                         | `contracts.test.ts`, `world.test.ts` |
| `ObligationSchema`      | nhúng trong `mortal.boiVu`                                          | `contracts.test.ts`                  |
| `ScheduleBlockSchema`   | nhúng trong `mortal.lich`                                           | `contracts.test.ts`                  |
| `FlowRefSchema`         | nhúng trong `kinh_te.soCai` và `livelihood.incomeSources` (Phase 7) | `contracts.test.ts`                  |
| `StructuredErrorSchema` | không lưu; chỉ runtime + bảng chẩn đoán                             | `contracts.test.ts`                  |

## Khối U — hồ sơ người chơi (Phần 78, 79.1)

| Schema                         | Bảng DB                            | Migration | Riêng tư                                        | Unit test         |
| ------------------------------ | ---------------------------------- | --------- | ----------------------------------------------- | ----------------- |
| `PlayerProfileSchema`          | `playerProfiles` `id, updatedAt`   | **v3**    | **local-only, không copy theo branch**          | `privacy.test.ts` |
| `CreatorIdentitySchema`        | `playerIdentities` `[saveId+id]`   | **v3**    | copy theo save; lịch sử công bố nằm trong Event | `privacy.test.ts` |
| `StartingPresenceDraftSchema`  | không lưu — draft trong bộ nhớ     | —         | commit atomic cùng transaction tạo save         | `privacy.test.ts` |
| `ProjectedPlayerPersonaSchema` | không lưu — dựng lại mỗi lần chiếu | —         | **cửa duy nhất ra prompt/preset**               | `privacy.test.ts` |
| `PronounSetSchema`             | nhúng trong cả ba schema trên      | v3        | chiếu được                                      | `privacy.test.ts` |

**Ma trận riêng tư đầy đủ:** `src/core/privacy/matrix.ts` — 12 trường `PlayerProfile` +
16 trường `CreatorIdentity`, mỗi trường khai phân loại và danh sách 7 biên được phép.
Trường chưa khai = **cấm mặc định** (ADR-0008).

## Khối U — rerank và retrieval (Phần 77, 79.1)

| Schema                       | Bảng DB                                                | Migration | Unit test        |
| ---------------------------- | ------------------------------------------------------ | --------- | ---------------- |
| `RerankEndpointSchema`       | secure settings — `proxyPassword` **không** vào export | v3        | `rerank.test.ts` |
| `RerankConfigSchema`         | `settings`                                             | v3        | `rerank.test.ts` |
| `RerankQuerySchema`          | không lưu — runtime                                    | —         | `rerank.test.ts` |
| `RerankCandidateSchema`      | không lưu — runtime                                    | —         | `rerank.test.ts` |
| `RerankResultSchema`         | nhúng trong `rerankCache.result`                       | v3        | `rerank.test.ts` |
| `RerankCacheEntrySchema`     | `rerankCache` khóa 7 phần                              | **v3**    | `rerank.test.ts` |
| `RetrievalRunSchema`         | `retrievalRuns` `++seq`                                | **v3**    | `rerank.test.ts` |
| `RetrievalEvalCaseSchema`    | `retrievalEval` `id, mode, task`                       | **v3**    | `rerank.test.ts` |
| `RetrievalEvalMetricsSchema` | `retrievalEval` (kết quả chạy)                         | v3        | `rerank.test.ts` |

**Khóa cache [BB] (Phần 77.8):**

```text
branchId + scopeKey + queryHash + candidateSetHash
        + visibilityHash + modelKey + configHash
```

Đổi mode, đổi chủ thể hoặc đổi tầm nhìn → **không** tái dùng. Hạn tính theo **tick**, không
theo thời gian máy.

## AI (Phần 31)

| Schema                      | Registry    | Nơi lưu                              | Unit test          |
| --------------------------- | ----------- | ------------------------------------ | ------------------ |
| `ModelProfileSchema`        | `R.profile` | `settings.profiles`                  | `registry.test.ts` |
| `GenParamsSchema`           | —           | `settings.genParams`                 | `registry.test.ts` |
| `NormalizedGenParamsSchema` | —           | bí danh của `GenParamsSchema` (61.2) | `registry.test.ts` |

### Tầng Phàm Nhân (Phần 70 — Phase 7)

Tất cả nhúng trong `entities.aspects[<id>]`; không bảng mới, không migration mới.

| Schema                 | Aspect / Nơi lưu                     | Chiếu                                                            | Unit test      |
| ---------------------- | ------------------------------------ | ---------------------------------------------------------------- | -------------- |
| `SinhKeSchema`         | aspect `sinh_ke`                     | Sổ Tay kể bằng chữ (`thợ bạn nghề đan lưới`), không bằng số      | `pham.test.ts` |
| `HoSchema`             | aspect `ho` trên kind `household`    | thành viên công khai; kho chung chỉ người trong nhà              | `pham.test.ts` |
| `CanCuocSchema`        | aspect `can_cuoc`                    | `tiengTam` công khai; `duocNhoBoi` là số engine, KHÔNG ra Sổ Tay | `pham.test.ts` |
| `ThuongTichSchema`     | nhúng `mortal.thanThe.thuongTich`    | `keVeThuongTich()` — "chân trái đau khi trở trời", không có số   | `pham.test.ts` |
| `QuanHeMotChieuSchema` | nhúng `soul.quanHe[<id>]` (ADR-0033) | [BB] 56.2 quy tắc 4 — chỉ `anTuong` ra ngoài, bốn trục thì không | `pham.test.ts` |

`MortalSchema.thanThe` được **nới rộng tại chỗ** thay vì dựng aspect song song
(ADR-0032); mọi trường mới có `prefault` nên save Phase 5–6 parse nguyên vẹn.

### Cổng AI (Phần 31.1, 46.1 — ADR-0028)

| Schema                   | Nơi lưu                                  | Migration | Ghi chú                                                         |
| ------------------------ | ---------------------------------------- | --------- | --------------------------------------------------------------- |
| `AiConfigSchema`         | bảng `aiConfigs`, khóa `'may_nay'`       | **v6**    | thuộc về MÁY, không thuộc nhánh; không đi vào bản xuất save     |
| `AiEndpointSchema`       | nhúng trong `aiConfigs.cauHinh.narrator` | **v6**    | `proxyPassword` nằm trong `KHOA_SECRET` nên `stripSecret()` cắt |
| `UpdaterEndpointSchema`  | nhúng, `.updater`                        | **v6**    | tắt được (`batRieng`)                                           |
| `WorkflowEndpointSchema` | nhúng, `.workflow`                       | **v6**    | tắt được                                                        |
| `ProbeResultSchema`      | nhúng trong từng endpoint                | **v6**    | `tickDo` là **nhịp thế giới**, không phải đồng hồ máy           |
| `ModelInfoSchema`        | nhúng, `.availableModels`                | **v6**    | kết quả lần quét gần nhất                                       |

Trạng thái ngắt mạch (`TrangThaiMach`) **không** được lưu và **không** nằm trong
`WorldState`: sự cố mạng không phải sự kiện của thế giới, và nhét nó vào state sẽ làm
state hash đổi theo chất lượng wifi — vỡ cổng Phase 1.

---

## Kế hoạch Dexie

**Phase 2 đã cài xong** ba phiên bản theo Phần 61.5 và 79.1 (`src/db/schema.ts`), cùng migration có checkpoint (`src/db/migration.ts`) và repository copy-on-write (`src/db/repo.ts`). `db.version(1)` **giữ nguyên** để đọc
save cũ; migration là **tăng dần**, không sửa v1.

```text
v1  worlds, entities(id), links(id), settings            ← chỉ để đọc save cũ
v2  compound key theo nhánh: [branchId+id]                ← Phần 61.5
    + branches, relations, storylines, events, scenes,
      workflows, workflowRuns, presetPacks, presetVersions,
      presetUiState, snapshots, ragChunks, ragVectors,
      worldProcesses, projects, knowledge, uiState, gaps, debts
v3  + playerProfiles, playerIdentities,                   ← Phần 79.1
      rerankCache, retrievalEval, retrievalRuns
v4  + knowledge, debts                                    ← Phase 5, ADR-0020
v5  + prayers                                             ← Phase 6
v6  + aiConfigs                                           ← Phase 6b, ADR-0028
v7  + storylines, foreshadows, chunks                     ← Phase 8, ADR-0036
v8  + substrateLaws, coChe, lorebooks,                    ← Phase 10, ADR-0046
      loreExpectations, diBan                               (theo NHÁNH)
    + presetPacks, presetRaw, presetActivations           ← Phase 9, ADR-0046
    + benchmarkRuns                                         (theo MÁY)
```

`scopeKey = mode + ':' + (chuTheId ?? 'root')` — **không** dùng `null` bên trong compound
primary key.

**Migration v3 phải:** thêm bảng mới mà vẫn mở được save cũ; đặt
`setupCompleted = true`, `setupVersion = 0`, `playerProfileId = null`,
`creatorIdentityId = null` cho save v3.0 trở xuống (Phần 78.10) — **không ép chạy lại
onboarding**.

---

## Bảng của Phase 8 (Dexie v7 · `PHIEN_BAN_SCHEMA = 6`)

| Bảng          | Schema                    | Khóa            | Migration                          | Projected type          | Test                                  |
| ------------- | ------------------------- | --------------- | ---------------------------------- | ----------------------- | ------------------------------------- |
| `storylines`  | `StorylineSchema` (28.2)  | `[branchId+id]` | sinh RỖNG, không di chuyển dữ liệu | `ProjectedStoryline`    | `truyen.test.ts`, `db.test.ts`        |
| `foreshadows` | `ForeshadowSchema` (30.2) | `[branchId+id]` | sinh RỖNG                          | vào `nutThatChuaGo` etc | `truyen.test.ts`, `db.test.ts`        |
| `chunks`      | `ChunkSchema` (54.3)      | `[branchId+id]` | sinh RỖNG; **chưa được ghi**       | `ChunkDaChieu`          | `retrieval.test.ts` (bộ nhớ, chưa DB) |

Ba bảng đều **copy-on-write theo nhánh**, cùng khuôn với `entities` (ADR-0014) và
với `knowledge`/`debts` (ADR-0020). `storylines` và `foreshadows` nằm trong
`hashState()`, nên determinism vẫn kiểm được; `chunks` **không** nằm trong hash vì
nó là chỉ mục dẫn xuất, tính lại được từ state (cùng lẽ với `_hash`/`_degree`).

**Vì sao không có migration dữ liệu.** Ba bảng sinh ra rỗng và tiền đề mạch
truyện được **dò từ world state** chứ không được lưu (ADR-0037), nên save cũ mở ra
với ba Map rỗng rồi `quetMachTruyen()` dựng lại toàn bộ mạch của nó ở nhịp kế
tiếp. Đây là cùng cam kết mà v4 (`knowledge`/`debts`) và v5 (`prayers`) đã giữ.

**Ranh giới riêng tư không đổi.** `RerankConfig` vào `AiConfigSchema` — tức bảng
`aiConfigs`, khóa theo MÁY, **không** theo nhánh và **không** nằm trong đường xuất
save. `proxyPassword` của endpoint rerank nằm trong `KHOA_SECRET` nên `stripSecret()`
và `hashConfig()` đều cắt nó.

---

## Bảng của Phase 9 và 10 (Dexie v8)

### Theo NHÁNH — copy-on-write, nằm trong `hashState()`

| Bảng               | Schema                         | Khóa            | Chiếu                                     | Test              |
| ------------------ | ------------------------------ | --------------- | ----------------------------------------- | ----------------- |
| `substrateLaws`    | `SubstrateLawSchema` (43.3)    | `[branchId+id]` | trục `vo_danh` hiện tham số trong ngoặc   | `phase10.test.ts` |
| `coChe`            | `CoCheRowSchema` (44.4)        | `[branchId+id]` | "chưa có" phải nói rõ còn thiếu gì (44.5) | `phase10.test.ts` |
| `lorebooks`        | `LorebookSchema` (35.2)        | `[branchId+id]` | entry `bi_che` KHÔNG vào ngữ cảnh (51.3)  | `phase10.test.ts` |
| `loreExpectations` | `LoreExpectationSchema` (35.4) | `[branchId+id]` | vào Bản Đồ Dị Biệt, không vào prompt      | `phase10.test.ts` |
| `diBan`            | `DiBanSchema` (35.5)           | `[branchId+id]` | `dongBienNien` vào biên niên sử           | `phase10.test.ts` |

Năm bảng này nằm trong `BANG` của `state.ts`, trong `hashState()` và trong bộ
dispatch của `apPatch` — nên chúng đi qua **đúng một đường ghi** như mọi bảng
khác, và một workflow không có cửa hậu nào để chạm chúng.

**Vì sao theo nhánh.** [BB] 43.6 bắt sửa Luật Nền phải phân nhánh, và 26.2 hứa
"so hai vũ trụ với hai bộ vật lý khác nhau". Điều đó chỉ đúng nếu luật nền là dữ
liệu theo nhánh. Lorebook cũng vậy: 35.5 gọi Dị Bản là hồ sơ về việc **thế giới
này** đã trở thành cái gì.

### Theo MÁY — không theo nhánh, không nằm trong đường xuất save

| Bảng                | Schema                      | Khóa               | Ghi chú                                         |
| ------------------- | --------------------------- | ------------------ | ----------------------------------------------- |
| `presetPacks`       | `PresetPackRowSchema`       | `[packId+version]` | version mới KHÔNG ghi đè version cũ (65.5)      |
| `presetRaw`         | `RawSourceRow`              | `ref`              | `ref = sha256:<HEX>` — nhập lại ghi đè chính nó |
| `presetActivations` | `PresetActivationSchema`    | `id`               | hoàn tác chỉ đổi con trỏ `previousActivationId` |
| `benchmarkRuns`     | `DongLichSuBenchmarkSchema` | `id`               | so hai phiên chỉ hợp lệ khi `configHash` trùng  |

**Vì sao theo máy.** Cùng lẽ với `aiConfigs` (ADR-0028): một pack đã nhập trên máy
này không tự có mặt trên máy khác, và đổi nhánh không được làm mất thư viện.

### Không có migration dữ liệu

Chín bảng sinh ra rỗng. Save v7 mở ở v8 thấy năm Map rỗng, và đó là trạng thái
**hợp lệ**: `tinhHieuLuc()` trả 0 cho luật chưa khai tiếp địa, `quetCoChe()` báo
"chưa quét", và `banDoDiBiet()` trả bảng rỗng. Cùng cam kết mà v4, v5 và v7 đã giữ.

### Schema mới nhúng trong bảng cũ

| Schema                      | Nhúng ở                       | Migration                                   |
| --------------------------- | ----------------------------- | ------------------------------------------- |
| `lawful.tiepDia` (42.2)     | `entities.aspects.lawful`     | `.prefault([])` — luật cũ vào với mảng rỗng |
| `lawful.hieuLuc` (42.2)     | `entities.aspects.lawful`     | `.prefault(0)` — engine tính, không ai khai |
| `lawful.cheDoTiepDia`       | `entities.aspects.lawful`     | `.prefault('tu_tiep_dia')`                  |
| `tuning.vatLy` (42.4, 44.3) | `settings` / `HO_SO_CAN_BANG` | `.prefault({})`                             |
| `tuning.lore` (53.3)        | `settings`                    | `.prefault({})`                             |
| `tuning.workflow` (50.12)   | `settings`                    | `.prefault({})`                             |

### Schema Phase 9/10 sống trong bộ nhớ, không có bảng riêng

| Schema                           | Vì sao không cần bảng                                           |
| -------------------------------- | --------------------------------------------------------------- |
| `WorkflowTaskSchema` (50.2)      | nằm trong `WorkflowPreset`, xuất/nhập bằng một file JSON (50.8) |
| `WorkflowPresetSchema` (50.8)    | preset dựng sẵn là hằng số; preset người dùng đi qua `settings` |
| `CompiledPromptSchema` (62.3)    | kết quả biên dịch một lượt, tính lại được từ pack + view        |
| `TransformDefSchema` (64.3)      | nhúng trong `presetPacks.transformDefs`                         |
| `QuarantinedScriptSchema` (64.2) | nhúng trong `presetPacks.quarantined`                           |
| `RealityMarbleSchema` (44.3)     | nhúng trong `entities.aspects.reality_marble` khi cơ chế bật    |
| `CauHinhDienHoaSchema` (47.1)    | cấu hình theo máy, cùng chỗ với ba điểm cuối AI                 |
| `EvolutionLogSchema` (47.5)      | Phase 11 — nhật ký cần UI mới có nghĩa                          |

---

## Phase 11 — v9

| Schema / bảng            | Nơi khai                      | Nơi lưu                               | Migration                     | Projected type                     | Test              |
| ------------------------ | ----------------------------- | ------------------------------------- | ----------------------------- | ---------------------------------- | ----------------- |
| `ProvenanceSchema`       | `schema/aspect/provenance.ts` | trong `entities.aspects.provenance`   | thiếu → `nhap_du_lieu` (59.1) | bị XÓA ngoài tầng Sáng Thế Thần    | `bang.test.ts`    |
| `BangSnapshotSchema`     | `core/bang/schema.ts`         | `uiState.anhBang`                     | v9, bảng mới                  | — (ngoài `WorldState`, ngoài hash) | `bang.test.ts`    |
| `HangBienPack`           | `db/schema.ts`                | `presetVars` `[packId+branchId]`      | v9, bảng mới                  | — (namespace pack, 66.6)           | `db.test.ts`      |
| `HangUiState`            | `db/schema.ts`                | `uiState` `[saveId+branchId]`         | v9, bảng mới                  | — (59.2)                           | `db.test.ts`      |
| `ProjectedThoiCuoc`      | `contracts/view.ts`           | — (dựng trong `chieu()`)              | —                             | tick/year = `null` ở phàm nhân     | `bang.test.ts`    |
| `ProjectedChiSo`         | `contracts/view.ts`           | nguồn: `state.metrics`                | —                             | `null` ngoài Sáng Thế Thần         | `bang.test.ts`    |
| `ProjectedTrucNen`       | `contracts/view.ts`           | nguồn: `state.substrateLaws`          | —                             | rỗng ở phàm nhân                   | `bang.test.ts`    |
| `ProjectedCoChe`         | `contracts/view.ts`           | nguồn: `state.coChe`                  | —                             | rỗng ngoài Sáng Thế Thần           | `bang.test.ts`    |
| `ProjectedDiBiet`        | `contracts/view.ts`           | nguồn: `loreExpectations`+`lorebooks` | —                             | rỗng ngoài Sáng Thế Thần           | `bang.test.ts`    |
| `ProjectedPhucBut`       | `contracts/view.ts`           | nguồn: `state.foreshadows`            | —                             | lọc theo mạch chủ thể biết         | `bang.test.ts`    |
| `ProjectedLoiCau`        | `contracts/view.ts`           | nguồn: `state.prayers`                | —                             | rỗng ở phàm nhân                   | `bang.test.ts`    |
| `ProjectedLoHong`        | `contracts/view.ts`           | nguồn: `state.gaps`                   | —                             | rỗng ngoài Sáng Thế Thần           | `bang.test.ts`    |
| `PromptGoi.moiTraLoi`    | `core/ai/bienSoan.ts`         | — (chỉ trong một lượt gọi)            | trường tùy chọn               | —                                  | `hopNhat.test.ts` |
| `KetQuaBocTach.bienPack` | `core/ai/bocTach.ts`          | → `presetVars`                        | —                             | KHÔNG vào `WorldState`             | `hopNhat.test.ts` |

**Hai bảng v9 đều KHÔNG vào `stateHash`.** Ảnh chụp Bảng và biến pack không phải
sự thật của thế giới; nhét chúng vào state sẽ làm hash đổi theo việc người chơi
thu gọn một vùng hay bật một pack — đúng thứ cổng determinism của Phase 1 cấm.

**Save v8 mở ở v9 thấy hai bảng rỗng**, và đó là trạng thái hợp lệ: chưa pack nào
có biến, chưa ai mở Bảng lần nào.
