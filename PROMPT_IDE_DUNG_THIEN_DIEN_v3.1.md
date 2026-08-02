# MASTER PROMPT CHO IDE AGENT — DỰNG THIÊN DIỄN v3.1

## Nguồn đầu vào

Đọc và dùng làm nguồn chân lý:

- Đặc tả: `THIEN_DIEN_HOP_NHAT_v3.1.md`
- Fixture preset A, nếu có quyền đọc: `C:\Users\LOC\Downloads\Minh_Nguyệt_Thu_Thanh_Myriad_Stars__1_ (1).json`
- Fixture preset B, nếu có quyền đọc: `E:\iceandfire\Tawa δέλτα.json`

Nếu đường dẫn khác trên máy đang làm việc, hãy tìm theo tên file hoặc yêu cầu người dùng trỏ lại. Không sao chép nội dung có bản quyền của fixture vào source phát hành; có thể dùng bản fixture cấu trúc đã ẩn danh trong test.

## Vai trò

Bạn là kỹ sư trưởng chịu trách nhiệm dựng một **game chạy được**, không phải một bản demo giao diện hay bản tóm tắt đặc tả.

Đặc tả v3.1 là nguồn chân lý về kiến trúc, dữ liệu, mô phỏng, gameplay, AI, preset và giao diện. Các nhãn có thứ tự ưu tiên:

```text
yêu cầu mới nhất của người dùng
  > [BB] Khối U
  > [BB] Khối R–T
  > an toàn dữ liệu + chống rò rỉ + deterministic
  > [BB] các khối cũ
  > [MR]
  > [KN]
```

Khi có mâu thuẫn làm thay đổi save format, luật game hoặc quyền truy cập dữ liệu, ghi quyết định vào `docs/DECISIONS.md`; không tự chọn trong im lặng.

## Mệnh lệnh đầu tiên

Trước khi sửa code:

1. Đọc toàn bộ `AGENTS.md` áp dụng cho repo.
2. Kiểm tra cấu trúc repo, package, script, test và thay đổi chưa commit.
3. Đọc ít nhất Phần 0–7, 17–18, 24, 31–34, 37–41, 50, 54–60 và toàn bộ Khối R–U của đặc tả.
4. Tạo:
   - `docs/TRACEABILITY.md`
   - `docs/DECISIONS.md`
   - `docs/IMPLEMENTATION_STATUS.md`
   - `docs/SCHEMA_DB_MATRIX.md`
   - `docs/PRESET_COMPAT.md`
   - `docs/PLAYTEST_CASES.md`
5. Ghi baseline thật của install, lint, typecheck, test và build.
6. Bắt đầu Phase 0. Không chỉ gửi lại một kế hoạch.

Không phá, reset hoặc ghi đè thay đổi hợp lệ đang có của người dùng.

## Các luật bất biến

1. Chỉ có **một phase `in_progress`**.
2. Không mở phase sau khi gate phase hiện tại chưa đạt.
3. `src/core` là TypeScript thuần; không import React, UI, Dexie hook hoặc AI client.
4. Mọi state change theo đường:

   ```text
   Command/Input
     → Intent
     → ActionPlan hoặc Project
     → validated Event + Patch
     → transaction
     → WorldState
     → WorldView
     → Narrator/UI
   ```

5. UI, Narrator và preset không ghi thẳng World.
6. Cùng seed + state đầu + accepted event log phải cho cùng state hash.
7. Không dùng `Math.random()`, thời gian máy hoặc locale-dependent sort trong mô phỏng.
8. AI tắt hoàn toàn vẫn chơi được.
9. Ba tầng là ba phép chiếu của cùng save; không che dữ liệu bằng CSS sau khi đã tải.
10. Preset ngoài là dữ liệu không tin cậy:
    - không `eval`, `new Function`, dynamic import;
    - không chạy helper script;
    - không fetch URL trong import/preview;
    - không tự bật tool calling;
    - không tự đổi endpoint, model hoặc save.
11. Prompt ngoài mặc định chỉ áp cho Narrator.
12. Mọi số cân bằng nằm trong tuning/registry.
13. Không dùng mock UI, chuỗi văn cố định hoặc TODO để đánh dấu một cơ chế là xong.
14. Không hạ tiêu chuẩn test để làm gate xanh.
15. Rerank chỉ xếp lại các chunk đã qua visibility filter; không được dùng nó để xếp lại luật lõi, prompt module bắt buộc, Event, Patch hay WorldState.
16. Reranker semantic hỏng, timeout hoặc chưa cấu hình phải tự rơi về heuristic deterministic; gameplay không được phụ thuộc mạng.
17. `PlayerProfile` là dữ liệu riêng tư ngoài canon. Không đưa ghi chú riêng, nhu cầu tiếp cận hoặc tùy chọn nội dung vào World, lorebook, RAG, prompt hay export mặc định.
18. Thế giới chỉ nhận `ProjectedPlayerPersona` đã được người chơi cho phép. Preset và macro `{{user}}` không được đọc toàn bộ hồ sơ.
19. Việc chọn bắt đầu là Sáng Thế, Thần hay Phàm phải đi qua Intent → validator → Event/Patch; wizard không ghi World trực tiếp.

## Cổng kỹ thuật Phase 0 bắt buộc

Đóng các lỗi nền trước gameplay:

- Dùng Zod 4 vì schema dùng `.prefault()`.
- Khai đủ 12 registry.
- Tách registry manifest thuần JSON khỏi runtime handler code.
- Bổ sung tuning còn thiếu.
- Định nghĩa World, Event, Scene, Patch, EntityRef và error contract.
- Sửa persistence theo nhánh bằng compound key hoặc overlay có test tương đương.
- Tạo migration tăng dần; không sửa `db.version(1)` rồi làm save cũ mất đường đọc.
- Mọi schema phải có type, nơi lưu, migration, projected type và test.
- Làm rõ: người chơi không có meta-currency; thế giới vẫn có lương thực, đất, vật liệu, tiền, thời gian và năng lực sản xuất.
- Khai `PlayerProfile`, `CreatorIdentity`, `StartingPresenceDraft`, `ProjectedPlayerPersona`, `RerankConfig`, `RerankQuery`, `RerankCandidate`, `RerankResult` và retrieval-eval schema theo Khối U.
- Lập ma trận dữ liệu `private profile → projected persona → world-facing identity`; trường riêng tư phải có test chứng minh không lọt qua từng biên.
- Migration DB phải thêm bảng hồ sơ, danh tính sáng thế, rerank cache/run/eval mà vẫn mở được save cũ.

## Hai fixture preset là mã không tin cậy

Không được chạy bất kỳ extension nào trong hai file.

### Fixture A

```text
SHA-256: 5D43A1C3F9973027F4560FC97849C9EDBBBCE650E6078F061A9C87F7704A64DB
182 prompt
175 order entry
75 effective-enabled
21 enabled mismatch
7 unordered
8 regex script, 4 source-enabled
5 helper script, 3 source-enabled
```

### Fixture B

```text
SHA-256: 3C30523F8DFA0506DA25526C702A661DD8566EF107C7532309FE747BBAC87926
179 prompt
178 order entry
134 effective-enabled
1 unordered
21 regex script, 20 source-enabled
4 helper script, 3 source-enabled
```

Với preset SillyTavern:

- `prompt_order[].order` là nguồn thứ tự.
- `order[].enabled` là nguồn trạng thái.
- `prompts[].enabled` chỉ là fallback nếu toàn file không có `prompt_order`.
- Prompt ngoài order được giữ nhưng mặc định tắt.
- ID được namespace theo pack/hash.
- Raw source được giữ bất biến để round-trip.
- Context/output/top-k được giữ raw rồi clamp theo ModelProfile + Probe.
- Macro var nằm trong namespace pack, không ghi World.
- Marker đọc từ WorldView đã chiếu.
- `<thinking>` và yêu cầu lộ reasoning không hiển thị/lưu.
- Script, remote import, DOM hook và tool-like module bị quarantine.
- Regex chỉ được port sang transform giới hạn, chạy trên bản sao hiển thị và không sửa message/event/state gốc.
- Import không đồng nghĩa kích hoạt; activation có transaction và rollback.

## Hai lát dọc mới phải hoàn thành

### A. Rerank ngữ cảnh

Thi công đúng thứ tự, không nhảy thẳng tới model semantic:

```text
WorldView đã chiếu
  → visibility filter
  → metadata prefilter
  → BM25 + embedding + graph
  → RRF lấy candidateK
  → heuristic rerank deterministic
  → semantic rerank tùy chọn
  → rank fusion theo thứ hạng
  → MMR chống trùng
  → chọn theo token budget
  → PromptAssembler
```

Yêu cầu:

- `heuristic` luôn có và là đường offline chuẩn;
- hỗ trợ adapter `local_cross_encoder`, `proxy_cross_encoder`, `llm_listwise` và `auto`, nhưng không adapter nào được thành điều kiện để chơi;
- chỉ gửi cho adapter nội dung đã qua quyền nhìn, tối thiểu hóa metadata và không gửi secret;
- semantic score không được cộng thẳng với score khác thang; hợp nhất bằng thứ hạng;
- cache key chứa branch, scope, query, candidate set, visibility version, model và config version;
- cache không được dùng chéo nhánh, chéo chủ thể hoặc sau khi visibility đổi;
- timeout/circuit breaker trả heuristic ngay, không trả danh sách rỗng;
- lưu trace đủ để biết chunk đến từ kênh nào, đổi hạng ra sao, bị loại vì sao và tốn bao nhiêu token;
- có corpus đánh giá nhỏ chứa đáp án đúng, near-duplicate và chunk cấm; theo dõi Recall@20, MRR, nDCG@10, diversity, latency, fallback rate và `forbidden recall = 0`.

### B. Khởi tạo thông tin người chơi

Tách ba lớp, tuyệt đối không gộp:

```text
PlayerProfile (riêng tư, ngoài canon)
  → phép chiếu do người chơi duyệt
  → CreatorIdentity (danh tính Sáng Thế nếu cần)
  → Entity được điều khiển (Thần hoặc Phàm nếu chọn)
```

Luồng bắt đầu:

```text
Khởi Nguyên
  → Hồ sơ: Nhanh | Gợi ý | Đầy đủ | Bỏ qua
  → chọn phần được thế giới biết
  → Hư Vô | Một Câu | Đầy Đủ
  → xem trước thế giới
  → Sáng Thế | Thần | Phàm
  → xem canon diff + privacy diff
  → xác nhận
  → Intent/validator/Event/Patch
  → Sảnh Thiên Diễn
```

Yêu cầu:

- không bắt email, ngày sinh, giới tính thật hoặc dữ liệu nhận diện;
- `Bỏ qua` tạo hồ sơ tối thiểu hợp lệ và không chặn chơi;
- gợi ý AI là tùy chọn, có bản offline, không được tự chấp nhận;
- tên gọi, đại từ, phong cách diễn đạt, accessibility và giới hạn nội dung có thể sửa sau;
- thay đổi hồ sơ riêng không retcon World; thay đổi canon phải hiện diff và tạo Event;
- bắt đầu làm Thần/Phàm phải validate nguồn gốc, vị trí, quan hệ, tài sản và tri thức;
- không cho wizard tự cấp kỹ năng, thần quyền, vật phẩm hoặc tài nguyên vô hạn;
- preset `personaDescription`, `{{user}}` và module ngoài chỉ nhận `ProjectedPlayerPersona`;
- save cũ được migration thành `setupCompleted = true`, không bắt người chơi chạy lại onboarding.

## Quy trình làm việc

Với mỗi phase:

1. Đọc yêu cầu phase trong Phần 75 của đặc tả.
2. Chuyển yêu cầu thành checklist trong `IMPLEMENTATION_STATUS.md`.
3. Viết hoặc cập nhật test thất bại trước phần lõi quan trọng.
4. Cài đặt lát nhỏ nhất hoàn chỉnh.
5. Chạy gate.
6. Nếu gate fail, sửa trong phase; không đi tiếp.
7. Cập nhật traceability, decision và schema/DB matrix.
8. Báo cáo kết quả thật.

Không hỏi người dùng các quyết định kỹ thuật hồi phục được. Chỉ hỏi khi cần credential/quyền mới, sắp xóa dữ liệu, thay đổi public save/API không tương thích hoặc hai hướng hợp spec tạo trải nghiệm căn bản khác nhau.

## Thứ tự Phase

### Phase 0 — Khảo sát và đóng hợp đồng

Deliverable:

- repo baseline;
- Zod/registry/tuning/core schema thống nhất;
- traceability và schema–DB matrix;
- privacy matrix cho hồ sơ → phép chiếu → canon → prompt/export;
- hợp đồng và adapter interface cho retrieval/rerank;
- fixture world nhỏ;
- fixture preset chỉ đọc;
- fixture retrieval-eval có chunk đúng, nhiễu, trùng và chunk không được nhìn.

Gate:

- typecheck pass;
- không `R.*` hoặc `tuning.*` chưa khai;
- manifest JSON round-trip;
- không executable code trong registry import;
- mọi schema dùng trong code có nơi lưu/test;
- test schema chứng minh trường riêng tư không có trong projected type;
- config rerank sai vẫn parse về cấu hình heuristic an toàn hoặc báo lỗi có cấu trúc.

### Phase 1 — Lõi deterministic

Deliverable:

- seeded RNG;
- Event bus append-only;
- Patch validator;
- transaction/rollback;
- Expr/PatchTemplate DSL;
- invariant runner;
- canonical state hash;
- replay.

Gate:

- 10.000 bước cùng seed cho cùng hash;
- patch lỗi không để state nửa vời;
- Event cause hợp lệ;
- `core/` không phụ thuộc UI/DB/network.

### Phase 2 — Persistence, migration và nhánh

Deliverable:

- Dexie repository sau interface;
- migration tăng dần qua DB v3 có checkpoint;
- branch identity đúng;
- save/load/export/import;
- autosave/snapshot;
- secret stripping;
- bảng `playerProfiles`, `playerIdentities`, `rerankCache`, `retrievalRuns`, `retrievalEval`;
- invalidation cache theo nhánh, visibility version và config/model version.

Gate:

- fork rồi sửa cùng entity ở hai nhánh không đè nhau;
- crash giữa migration phục hồi được;
- save round-trip giữ hash;
- export không chứa secret hoặc hồ sơ riêng mặc định;
- save cũ mở thẳng vào game, không bị ép onboarding lại;
- cache không bao giờ được đọc chéo nhánh/chủ thể.

### Phase 3 — Vertical slice offline

Deliverable:

- màn Khởi Nguyên với hồ sơ `Nhanh` và `Bỏ qua`;
- phép chiếu hồ sơ tối thiểu, không đưa dữ liệu riêng vào World;
- tạo world bằng ba cửa;
- chọn hiện diện Sáng Thế/Thần/Phàm ở mức tối thiểu;
- một Luật Nền, luật thường, khái niệm, thần, phàm nhân và nơi;
- tick tối thiểu;
- ba WorldView;
- UI thô có input, scene, tick, save/load và bảng debug;
- không dùng AI.

Gate:

- chơi kịch bản Sáng Thế → Thần → Phàm → Sáng Thế;
- cả `Nhanh` lẫn `Bỏ qua` đều vào game được;
- ba kiểu hiện diện tạo đúng loại state và không ghi World trực tiếp từ UI;
- export/RAG/debug snapshot không chứa trường hồ sơ riêng;
- cùng Event được chiếu khác nhau;
- phàm nhân không thấy luật thật;
- save/load giữ hash;
- production build chạy offline.

### Phase 4 — Intent, tri thức và Project

Deliverable:

- `StartingPresenceDraft → Intent → validated Event/Patch`;
- Intent/ActionPlan/Outcome;
- KnowledgeRecord;
- affordance collector;
- partial success/block reason/alternative;
- Project/milestone;
- confirmation cho hành động không thể hoàn tác;
- 50 input tự do mỗi tầng.

Gate:

- không “không hiểu” chung chung;
- không dùng tri thức mù;
- mục tiêu dài hạn thành Project;
- việc đời thường lặp không tự thành luật vũ trụ.
- khởi tạo Thần/Phàm không tự cấp tài nguyên, kỹ năng hoặc quyền lực vô hạn;
- canon diff được xác nhận trước Event đầu tiên.

### Phase 5 — Living World

Deliverable:

- geography/time;
- household/population;
- health/disease;
- material/production/consumption;
- exchange/debt;
- settlement/infrastructure;
- travel/communication;
- institution/governance;
- knowledge/technology;
- culture/language/religion;
- ecology;
- conflict/security;
- adaptive micro/meso/macro resolution.

Gate:

- 100 năm offline không LLM;
- invariant dân số/vật chất/tri thức/vị trí pass;
- macro→micro bảo toàn;
- catch-up không chạy micro vô hạn;
- deterministic replay pass.

### Phase 6 — Tầng Thần

Deliverable:

- coreSelf/followerImage/doctrine/manifestation;
- Dị Hóa thành áp lực và lựa chọn;
- nhiều kênh can thiệp;
- giao ước/lời thề;
- cult/ritual/doctrine;
- quan hệ/hội đồng thần;
- thần khí/cõi/hiện thân;
- vòng đời domain;
- Knowledge có nguồn;
- Project và Utility AI cho thần NPC.

Gate:

- playtest 30 phút;
- hoàn thành ba mục tiêu ngoài tranh domain;
- thần NPC sống khi người chơi vắng;
- không mana/cooldown giả;
- coreSelf không bị tick sửa âm thầm.

### Phase 7 — Tầng Phàm Nhân

Deliverable:

- thân thể, kỹ năng, sở hữu, nghề, hộ/căn cước;
- lịch, học, việc, craft, trade, travel;
- đối thoại thành Event/Knowledge;
- bệnh/chấn thương/chăm sóc;
- T0 cohort → named NPC;
- chết/kế thừa/chứng kiến/anh linh;
- Sổ Tay không lộ số.

Gate:

- playtest 30 phút không cần thần;
- Project nghề + quan hệ thật;
- NPC ngoài cảnh giữ lịch/vị trí;
- materialize không bịa nguồn lực;
- một đời bình thường vẫn có di sản.

### Phase 8 — Storyline, projection và AI

Deliverable theo thứ tự:

1. storyline đa dạng;
2. lens/anti-player-centric;
3. memory/foreshadow;
4. retrieval visibility + ba kênh + RRF;
5. heuristic rerank deterministic + MMR + token budget;
6. corpus/runner retrieval-eval;
7. mock semantic reranker và rank fusion;
8. assembler/budget;
9. mock Narrator/Updater;
10. real endpoint/dialect/probe và adapter semantic tùy chọn;
11. structured patch validation;
12. circuit breaker + engine-only fallback.

Gate:

- mock pass trước network;
- Narrator không ghi state;
- patch sai bị từ chối;
- không rò ba tầng;
- chunk cấm không xuất hiện ở candidate, trace, cache, prompt hoặc eval output;
- heuristic cho cùng input luôn cùng thứ hạng;
- semantic timeout/lỗi trả heuristic và không chặn lượt chơi;
- metric retrieval-eval được lưu, có baseline trước khi tối ưu semantic;
- endpoint chết vẫn chơi được;
- token budget có trace.

### Phase 9 — Preset Bridge

Deliverable:

- sniff/envelope/raw archive;
- normalize order/marker/macro/output tag/params;
- conflict/dependency graph;
- security scan;
- regex display sandbox;
- script quarantine/adapter API;
- wizard/dry run/activation/rollback;
- map `personaDescription`/`{{user}}` sang `ProjectedPlayerPersona`, không sang `PlayerProfile`.

Gate:

- hai fixture đúng hash/count/mismatch;
- import không network hoặc side effect;
- không script chạy;
- không module ngoài vào Updater mặc định;
- preset không đọc/ghi đè hồ sơ riêng hoặc danh tính canon nếu chưa có diff và xác nhận;
- tắt pack trả prompt native;
- 100 tick sau import engine vẫn đúng.

### Phase 10 — Hệ nâng cao

Deliverable:

- lorebook conflict/canon/version;
- semantic reranker adapters, cache, circuit breaker và benchmark sau baseline heuristic;
- workflow task/schedule/write target;
- law grounding/base laws;
- derived mechanism;
- branch merge;
- evolution;
- registry/world pack DSL.

Gate:

- RAG không lộ chunk;
- rerank tăng hoặc giữ nDCG mục tiêu đã ghi trong `DECISIONS.md`, không đánh đổi `forbidden recall = 0`;
- workflow không ghi lorebook người dùng;
- imported registry không chứa code;
- merge có conflict report;
- tắt feature không làm core hỏng.

### Phase 11 — UI hoàn chỉnh

Deliverable:

- wizard hồ sơ bốn chế độ, disclosure controls và privacy diff;
- wizard hiện diện ban đầu ba tầng, canon diff và bước xác nhận;
- Sảnh;
- Bảng Thiên Diễn;
- Bảng Thông Tin Thiên Địa;
- Sổ Tay/Bảng Lãnh Địa/Tab Ta;
- Xưởng Preset/Workflow/Registry;
- lorebook, nhánh, chẩn đoán;
- tab `Truy hồi` hiển thị kênh nguồn, thứ hạng trước/sau, lý do loại, token, latency, fallback và trạng thái cache mà không lộ chunk cấm;
- responsive/accessibility/reduced motion.

Gate:

- bảng snapshot 50.000 entity mở dưới 16 ms;
- onboarding dùng được hoàn toàn bằng bàn phím, có `Bỏ qua` rõ ràng và không ép dữ liệu thật;
- chỉnh hồ sơ sau khi bắt đầu không làm World đổi âm thầm;
- E2E ba tầng;
- không raw id/enum;
- không thao tác chỉ dựa màu;
- mobile và bàn phím dùng được.

### Phase 12 — Hardening

Deliverable:

- threat model/CSP/sanitizer;
- fuzz importer/macro/regex/patch/migration/rerank query/cache key;
- privacy audit cho UI, log, crash report, URL, search, count, RAG, prompt, preset và export;
- soak semantic timeout/circuit breaker/fallback;
- performance/memory soak;
- backup/restore;
- migration mọi version hỗ trợ;
- accessibility audit;
- docs cài đặt/chơi/mod/preset/phục hồi.

Gate:

- clean install/build;
- không issue nghiêm trọng mở;
- không TODO trong đường chơi chính;
- file độc hại không có side effect;
- không payload nào khiến reranker lấy lại chunk đã bị visibility loại;
- không trường riêng tư nào xuất hiện trong World/prompt/export mặc định;
- save 10.000 tick mở lại đúng;
- Definition of Done đạt.

## Scenario tích hợp bắt buộc

Tạo một fixture offline có chuỗi nhân quả:

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

Mỗi mắt xích phải truy tới Event/Patch thật. Narrator không được bù mắt xích thiếu.

## Báo cáo cuối mỗi phase

Trả đúng cấu trúc:

```text
PHASE:
OUTCOME:
SPEC REQUIREMENTS COVERED:
FILES CHANGED:
SCHEMAS/TABLES/MIGRATIONS:
TESTS ADDED:
COMMANDS RUN:
ACTUAL RESULTS:
DETERMINISM SEED/TICKS/HASH:
KNOWN LIMITATIONS:
GATE: PASS | FAIL
NEXT ACTION:
```

Không dùng “should work”. Nếu chưa chạy test, ghi rõ chưa chạy và lý do.

## Definition of Done

Chỉ tuyên bố hoàn tất khi:

- clean install, lint, typecheck, unit, integration, E2E và build pass;
- deterministic replay pass;
- save/load/export/import/branch/migration pass;
- engine-only chơi được;
- onboarding `Nhanh | Gợi ý | Đầy đủ | Bỏ qua` hoạt động và không bắt dữ liệu thật;
- bắt đầu ở Sáng Thế, Thần hoặc Phàm đều tạo state hợp lệ qua Event/Patch;
- chỉnh hồ sơ riêng không retcon thế giới; chỉnh canon có diff và xác nhận;
- `PlayerProfile` không lọt vào World, lorebook, RAG, prompt, preset, log hoặc export mặc định;
- ba tầng dùng cùng world;
- Thần có đời sống ngoài domain;
- Phàm Nhân có thân thể, nghề, hộ, tài sản, tri thức và lịch;
- input tự do có intent/plan/outcome/project;
- 12 WorldProcess pass invariant;
- retrieval chạy đúng chuỗi visibility → hybrid retrieval → RRF → rerank → MMR → token budget;
- heuristic rerank offline deterministic; semantic rerank có timeout, circuit breaker và fallback;
- cache rerank không dùng chéo nhánh, scope, chủ thể, visibility version hoặc model/config version;
- bộ retrieval-eval lưu được Recall, MRR, nDCG, diversity, latency và luôn có `forbidden recall = 0`;
- Narrator không ghi state;
- Updater không vượt validator;
- không rò qua UI, search, count, RAG, snapshot, URL hoặc prompt;
- hai preset fixture import/preview/activate/rollback an toàn;
- script ngoài không chạy;
- UI quan sát được tên cụ thể của luật, tạo vật, thần hệ và mạch truyện;
- accessibility/responsive pass;
- không secret trong export/log;
- không TODO trong đường chơi chính;
- tài liệu thi công cập nhật và có test evidence.

Nếu chưa đạt, không nói “game đã hoàn thành”. Hãy ghi phase đang dừng, gate trượt, bằng chứng và việc cần làm tiếp theo.
