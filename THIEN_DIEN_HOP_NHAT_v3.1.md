# THIÊN DIỄN — ĐẶC TẢ HỢP NHẤT
### Web Game Nhập Vai AI · God Simulator · Bản v3.1

> **Tài liệu duy nhất.** Thay thế hoàn toàn ba tập rời trước đó.
> Dành cho AI coding agent (Cursor / Claude Code / Windsurf / Antigravity).
> Đọc hết Phần 0 → 7 trước khi viết dòng code đầu tiên.
> Giao diện: **tiếng Việt**. Code, biến, hàm, key: **tiếng Anh không dấu**.

---

# MỤC LỤC

**Khối A — Nền tảng** · 0. Cách dùng · 1. Tổng quan · 2. Bảy nguyên tắc · 3. Stack
**Khối B — Kiến trúc tổng quát** · 4. Entity–Aspect · 5. Registry · 6. Đồ thị liên kết · 7. Cấu hình dữ liệu
**Khối C — Hệ thống thế giới** · 8. Khái Niệm · 9. Định Luật · 10. Kết tinh & lan truyền · 11. Hồn Phổ · 12. Thần · 13. Chỉ số thế giới
**Khối D — Tự hoàn thiện** · 14. Thu hoạch danh từ · 15. Lỗ hổng · 16. Thanh tra · 17. Luật thô
**Khối E — Ba tầng chơi** · 18. Hàm chiếu · 19. Tầng Thần · 20. Tầng Phàm Nhân · 21. Chuyển tầng · 22. Cầu nguyện · 23. Utility AI
**Khối F — Mô phỏng** · 24. Tick engine · 25. Phân tầng · 26. Nhánh · 27. Chu kỳ
**Khối G — Tự sự** · 28. Mạch Truyện · 29. Ống kính & chống thiên vị người chơi · 30. Trí nhớ tự sự
**Khối H — AI & Ngữ cảnh** · 31. Cấu hình AI & tự dò · 32. EJS · 33. Assembler · 34. Ngân sách
**Khối I — Lorebook** · 35. Lorebook đa thần hệ, lực hấp dẫn, Dị Bản
**Khối J — Giao diện** · 36. Thiết kế · 37. Màn hình
**Khối K — Vận hành** · 38. Persistence · 39. Tự chẩn đoán · 40. Lộ trình · 41. Kiểm tra cuối
**Khối L — Tiếp địa & Luật Nền** · 42. Nguyên tắc Tiếp Địa · 43. Luật Nền bảy trục · 44. Cơ chế phái sinh · 45. Bổ sung kiểm tra
**Khối M — Cấu hình mở rộng** · 46. Ba điểm cuối AI · 47. Diễn Hóa tự động · 48. Khóa Ngoài Cảnh · 49. Bổ sung lộ trình
**Khối N — Workflow theo tác vụ** · 50. Đường ống tác vụ (thay thế 47.2)
**Khối O — Lorebook nâng cao & RAG** · 51. Xung đột lorebook · 52. Thao tác entry cấp AI · 53. Độ chính xác entry · 54. Hệ RAG
**Khối P — Bảng Thiên Diễn** · 55. Bảng Thiên Diễn · 56. Sổ Tay Phàm Nhân · 57. Bổ sung lộ trình
**Khối Q — Bảng Thông Tin Thiên Địa** · 58. Mặt thông tin khi chơi · 59. Dữ liệu & kỹ thuật · 60. Bổ sung lộ trình và kiểm tra
**Khối R — Cổng nền & Preset Pack** · 61. Cổng biên dịch · 62. Mô hình preset · 63. Pipeline nhập · 64. Tương thích an toàn · 65. Hợp nhất & xung đột · 66. UI và fixture
**Khối S — Thế giới sống & tự do hành động** · 67. Ý định tự do · 68. Công trình dài hạn · 69. Đời sống Thần · 70. Đời sống Phàm Nhân · 71. Tiến trình thế giới · 72. Nhân quả liên tầng · 73. Kiểm tra
**Khối T — Kế hoạch dựng game cho IDE** · 74. Nguyên tắc thi công · 75. Các phase · 76. Cổng nghiệm thu
**Khối U — Rerank & Khởi tạo người chơi** · 77. Rerank ngữ cảnh · 78. Hồ sơ và hiện diện ban đầu · 79. Tích hợp, lộ trình và kiểm tra

---
---

# KHỐI A — NỀN TẢNG

## PHẦN 0 — CÁCH DÙNG

### 0.1 Quy ước

| Ký hiệu | Nghĩa |
|---|---|
| **[BB]** | Bắt buộc. Không được đổi. Sai là hỏng kiến trúc. |
| **[KN]** | Khuyến nghị. Đổi được nếu có lý do kỹ thuật rõ. |
| **[TD]** | Tự do. Agent tự quyết. |
| **[MR]** | Mở rộng được. Nằm trong Registry, người dùng cuối tùy chỉnh được. |

### 0.2 Ba câu hỏi agent phải tự trả lời trước mỗi module

1. Cái này có phải **dữ liệu** không? Nếu có, nó phải nằm trong Registry hoặc file JSON, **không** hardcode.
2. Cái này có sinh ra **entity** không? Nếu có, nó phải sinh **link** tương ứng.
3. Cái này có gọi **LLM** không? Nếu có, nó phải qua **budget governor** và phải có **fallback khi thất bại**.

### 0.3 Không nhảy phase

Xem Phần 37. Phase 1–8 là nền móng. Xây sai thì mọi thứ sau sập.

---

## PHẦN 1 — TỔNG QUAN

### 1.1 Một câu

SPA cho phép người chơi đóng vai **Sáng Thế Thần** tạo thế giới bằng cách ban quy luật và sinh khái niệm, rồi buông cho nó tự diễn hóa hàng nghìn năm — nơi thần linh, quái vật, tôn giáo và định luật mới **tự mọc ra** từ những gì đã gieo, và nơi người chơi có thể tụt xuống làm một vị thần hoặc một người phàm trong chính thế giới mình tạo.

### 1.2 Ba tầng chơi — một save duy nhất

| Tầng | Thời gian | Tự do | Giới hạn tự nhiên |
|---|---|---|---|
| **Sáng Thế Thần** | Phi tuyến. Tua thế kỷ, nhảy kỷ nguyên, nhánh song song | Toàn quyền, không tốn tài nguyên | Sương mù phức tạp: viết được luật, không đoán được hệ quả |
| **Thần** | Gần thời gian thực theo lãnh địa | Ban phép, hạ phàm, tranh domain | Chỉ thấy và tác động trong domain |
| **Phàm Nhân** | Tuyến tính, một đời người | Nghề, phe, quan hệ, phản ứng với số phận | Không biết luật, chỉ biết truyền thuyết |

**[BB]** Ba tầng dùng **chung một database, chung một branch**. Chuyển tầng = đổi hàm chiếu, không tạo save mới.

### 1.3 Không có tài nguyên

**[BB]** Không có mana, không có tín lực, không có thanh gì phải quản. Giá của hành động là **hệ quả**:

- Mỗi lần **tạo** → thêm một thực thể có ý chí riêng → thế giới bớt đoán được.
- Mỗi lần **xóa** → để lại **vết sẹo**: tín đồ vẫn nhớ, đền vẫn đứng, lỗ hổng vẫn có hình dạng. Sẹo là nơi quái vật sinh ra.

Hai chỉ số được theo dõi không phải để tiêu, mà để **phản tỉnh**: `realityIntegrity` và `doSongDong` (Phần 13).

**Làm rõ một hiểu lầm dễ gặp:** *tín ngưỡng* vẫn tồn tại trong mô phỏng — số tín đồ, mật độ đền, `domainStrength`. Nhưng nó là **vị thế**, không phải **nhiên liệu**. Người chơi không bao giờ "tiêu" tín ngưỡng để làm gì cả.

### 1.4 Sáu động từ [MR]

| Cặp | Động từ | Áp lên |
|---|---|---|
| Chia / Gộp | `PHAN` ↔ `HOP` | Bản thể, Khái Niệm, Thần, Cõi |
| Sinh / Diệt | `HIEN` ↔ `THU` | Thần, Sinh linh, Quái vật, Thần khí, Cõi |
| Trói / Thả | `DINH` ↔ `BUONG` | Luật, Số phận, Quan hệ, Hệ thống |

Sáu động từ là **mặc định dựng sẵn**, không phải giới hạn cứng — chúng nằm trong `R.verb`, mở rộng được (Phần 5, Phần 17.3).

**Chúc phúc và trừng phạt không phải động từ riêng.** Chúng là `DINH` với phạm vi `ca_the` hoặc `huyet_mach`. Hệ quả tự nhiên: chúc phúc một dòng họ sống lâu, sau 20 đời engine coi nó là **đặc tính chủng tộc** và không ai nhớ lý do.

---

## PHẦN 2 — BẢY NGUYÊN TẮC

Đây là hiến pháp của dự án. Mọi quyết định kỹ thuật phải kiểm tra lại với bảy câu này.

1. **Engine giữ số. AI giữ lời. Database giữ nhân quả.**
   Số liệu, điều kiện, nhân quả → engine, deterministic, test được. Mô tả, cảm xúc, hội thoại → AI. Lời hứa, tiên tri, lời nguyền → database + engine trigger. Không bao giờ tin LLM giữ tính liên tục.

2. **Chi tiết phải được suy ra, không được bịa ra.**
   Không bao giờ gọi AI với prompt mở. Luôn thu ràng buộc trước, tính không gian nghiệm, rồi chỉ nhờ AI chọn và đặt tên trong đó.

3. **Không có thực thể mồ côi.**
   Mọi thứ có backlink hai chiều. Đồ thị liên kết là thứ assembler đi theo, không phải keyword.

4. **Mọi mâu thuẫn biến thành nội dung.**
   Không bao giờ ném lỗi vào mặt người chơi. Lỗ hổng không lấp được trở thành bí ẩn.

5. **Người chơi có tự do của văn xuôi; engine giữ sự chặt chẽ của logic.**
   Validator kiểm tra công việc của AI, không dựng tường trước mặt người chơi.

6. **Mọi hằng số là dữ liệu.**
   Ngưỡng, hệ số, danh mục, nguyên mẫu, tham số model — tất cả nằm trong Registry hoặc file cấu hình. Hardcode một con số ma thuật là vi phạm.

7. **Rò rỉ thông tin giữa ba tầng là bug nghiêm trọng nhất.**
   Phàm nhân không bao giờ được thấy văn bản luật gốc hay bản tính thật của thần.

---

## PHẦN 3 — STACK & CẤU TRÚC

### 3.1 Stack [BB]

```
Vite + React 18 + TypeScript (strict)
Zustand             state runtime
Zod 4               schema, validation, inference; dùng `.prefault()`
Dexie 4             IndexedDB
EJS (browser)       template layer
Tailwind CSS        utility
Framer Motion       chuyển cảnh, dùng tiết chế
dexie-react-hooks   live query
```

**[BB] KHÔNG dùng:** shadcn/ui, MUI, Ant Design, Chakra, hay bất kỳ component library nào.
**[BB] KHÔNG dùng thư viện icon** (lucide, heroicons, react-icons). Mọi icon vẽ tay SVG inline.

### 3.2 Thư mục

```
src/
├─ core/                       ENGINE — cấm import React
│  ├─ registry/
│  │  ├─ createRegistry.ts
│  │  ├─ aspects.ts            định nghĩa aspect dựng sẵn
│  │  ├─ kinds.ts              định nghĩa kind dựng sẵn
│  │  ├─ verbs.ts
│  │  ├─ relations.ts
│  │  ├─ gaps.ts
│  │  ├─ actions.ts            danh mục hành động utility AI
│  │  ├─ endings.ts
│  │  ├─ metrics.ts
│  │  └─ loadPacks.ts          nạp mod pack JSON + override người dùng
│  ├─ schema/
│  │  ├─ entity.ts             Entity gốc
│  │  ├─ aspect/               schema từng aspect
│  │  ├─ link.ts
│  │  ├─ world.ts
│  │  ├─ lorebook.ts
│  │  ├─ karma.ts
│  │  ├─ prayer.ts
│  │  ├─ gap.ts
│  │  ├─ term.ts
│  │  └─ config.ts
│  ├─ engine/
│  │  ├─ tick.ts               vòng lặp 14 bước
│  │  ├─ lawEngine.ts          bốn tầng lan truyền
│  │  ├─ lawValidator.ts       bảy kiểm tra
│  │  ├─ lawFormalizer.ts      luật thô → bảy trường
│  │  ├─ crystallize.ts        cụm luật → luật mới
│  │  ├─ conceptEngine.ts      trọng số, rẽ nhánh, lưỡng lự
│  │  ├─ utilityAI.ts
│  │  ├─ prayerEngine.ts
│  │  ├─ karmaLedger.ts
│  │  ├─ divergence.ts
│  │  ├─ doctrineDrift.ts
│  │  ├─ domainContest.ts      tranh đoạt domain
│  │  ├─ nemesis.ts
│  │  ├─ gapScanner.ts
│  │  ├─ constraintSolver.ts
│  │  ├─ coherenceAuditor.ts
│  │  ├─ metrics.ts
│  │  └─ rng.ts                seeded, d100, softmax
│  ├─ graph/
│  │  ├─ linkRepo.ts
│  │  └─ traverse.ts
│  ├─ project/
│  │  ├─ project.ts            hàm chiếu ba tầng
│  │  └─ distort.ts            bopMeo
│  ├─ context/
│  │  ├─ assembler.ts
│  │  ├─ budget.ts
│  │  ├─ tokenizer.ts          ước lượng + hiệu chỉnh tiếng Việt
│  │  ├─ ejs.ts
│  │  └─ lorebookScan.ts
│  └─ ai/
│     ├─ client.ts
│     ├─ dialect.ts            tự dò openai | gemini | anthropic
│     ├─ probe.ts              thăm dò năng lực model
│     ├─ profiles.ts           Model Profile
│     ├─ narrator.ts
│     ├─ updater.ts
│     └─ patchParser.ts
├─ db/
├─ store/
├─ ui/
│  ├─ design/tokens.css
│  ├─ design/Glass.tsx
│  ├─ svg/
│  ├─ screens/
│  └─ panels/
├─ packs/                      mod pack JSON dựng sẵn
└─ App.tsx
```

---
---

# KHỐI B — KIẾN TRÚC TỔNG QUÁT

> Đây là khối quan trọng nhất và là điểm khác biệt lớn nhất so với bản trước.
> Thay vì mười schema cứng cho mười loại thực thể, dùng **một Entity + các Aspect ghép được**.
> Nhờ vậy người dùng cuối định nghĩa được loại thực thể mới **mà không cần sửa code**.

## PHẦN 4 — MÔ HÌNH ENTITY–ASPECT [BB]

### 4.1 Entity gốc

```ts
export const EntitySchema = z.object({
  id: z.string(),
  branchId: z.string(),

  kind: z.string(),                                   // KHÔNG phải enum — tra R.kind
  ten: z.string(),
  aliases: z.array(z.string()).prefault([]),
  moTa: z.string().prefault(''),

  tickSinh: z.number(),
  tickDiet: z.number().nullable().prefault(null),

  aspects: z.record(z.string(), z.unknown()).prefault({}),   // key = aspect id
  tags: z.array(z.string()).prefault([]),

  _degree: z.number().prefault(0),                    // engine-only, cache bậc đồ thị
  _hash: z.string().prefault(''),
}).prefault({});
```

**[BB]** `kind` là **chuỗi**, không phải enum. Enum sẽ khóa chết khả năng mở rộng. Tính hợp lệ kiểm bằng `R.kind.lay(kind) !== undefined`.

### 4.2 Aspect dựng sẵn [MR]

| Aspect | Chứa gì | Dùng cho |
|---|---|---|
| `soul` | Bản tính, dục vọng, tâm trạng, ký ức | Thần, phàm nhân, quái vật có trí |
| `conceptual` | Trọng số, sắc thái, nguồn, phản nghĩa | Khái Niệm |
| `lawful` | Bảy trường logic, diễn giải, kẽ hở | Định Luật |
| `domain` | Danh sách domain + `domainStrength` | Thần |
| `genealogical` | Cha mẹ, con, thế hệ | Thần, dòng họ phàm |
| `divisible` | Phân thân, độ phân kỳ, ngưỡng hợp nhất | Thần, khái niệm, cõi |
| `venerable` | Tín đồ, đền, hiển thánh, bản tính tín đồ tin | Thần, anh linh |
| `carrier` | Khái niệm mang theo, lịch sử đi qua | Thần khí |
| `spatial` | Vị trí, ranh giới, luật cục bộ | Cõi, vùng, địa danh |
| `mortal` | Tuổi thọ, tick sinh/tử, mục tiêu đời người | Phàm nhân |
| `adversarial` | Phủ định gì, điều khoản bất tử, nhịp | Kẻ thù vĩnh cửu |
| `institutional` | Mô hình cai trị, kế vị, thành viên | Thần hệ, giáo phái, quốc gia |

```ts
export type AspectDef = {
  id: string;
  ten: string;
  schema: z.ZodTypeAny;
  phuThuoc?: string[];            // aspect bắt buộc phải có kèm
  khiThem?: (e: Entity, w: World) => void;
  moiTick?: (e: Entity, w: World, tick: number) => void;
};
```

**[BB]** Aspect có `moiTick` được engine gọi tự động ở bước tương ứng của vòng lặp. Đây là cách mở rộng mô phỏng mà không sửa `tick.ts`.

### 4.3 Kind là dữ liệu [MR]

```ts
export type KindDef = {
  id: string;
  ten: string;
  aspects: string[];
  icon: string;                  // tên component SVG
  mau: 'dong' | 'ngoc' | 'van' | 'hoi' | 'lam' | 'tro';
  tangMacDinh?: 't0'|'t1'|'t2'|'t3';
  phanChieu: {                   // tầng nào thấy được gì — Phần 18
    sangThe: 'day_du';
    than: 'day_du' | 'trong_domain' | 'tin_don' | 'mu';
    phamNhan: 'day_du' | 'qua_van_hoa' | 'tin_don' | 'mu';
  };
};
```

Kind dựng sẵn: `concept, law, deity, mortal, monster, artifact, realm, pantheon, nemesis, cult, nation, ritual, bloodline, place`.

Ví dụ mở rộng người dùng — thêm một loại thực thể mới, **không sửa code**:

```json
{
  "id": "tinh_linh",
  "ten": "Tinh Linh Bản Địa",
  "aspects": ["soul", "spatial", "conceptual"],
  "icon": "TinhLinh",
  "mau": "ngoc",
  "tangMacDinh": "t1",
  "phanChieu": { "sangThe": "day_du", "than": "trong_domain", "phamNhan": "qua_van_hoa" }
}
```

### 4.4 Truy cập aspect

```ts
export function co<A extends AspectId>(e: Entity, a: A): boolean;
export function lay<A extends AspectId>(e: Entity, a: A): AspectData<A>;
export function themAspect(e: Entity, a: AspectId, dl: unknown, w: World): void;
```

**[BB]** Mọi truy cập aspect đi qua ba hàm này. Cấm `e.aspects['soul'] as Soul` trực tiếp — mất kiểm tra `phuThuoc` và mất hook `khiThem`.

### 4.5 Vì sao mô hình này quan trọng

Nó khiến những chuyện sau trở thành **thay đổi dữ liệu**, không phải thay đổi code:

- Phàm nhân hóa thần = **thêm** aspect `domain` + `venerable` vào entity đang có, giữ nguyên `soul` và mọi quan hệ cũ.
- Thần sa đọa thành người = **gỡ** `domain`, thêm `mortal`.
- Thần khí có ý thức = thêm `soul` vào một entity `carrier`.
- Một ngọn núi được thờ thành thần = thêm `venerable` vào entity `spatial`.

Tất cả những chuyện này đều là mô-típ có thật trong thần thoại thế giới, và chúng chạy được **miễn phí** nhờ kiến trúc này.

---

## PHẦN 5 — HỆ REGISTRY [BB]

### 5.1 Mười hai registry

```ts
export const R = {
  aspect:   createRegistry<AspectDef>('aspect'),
  kind:     createRegistry<KindDef>('kind'),
  verb:     createRegistry<VerbDef>('verb'),
  relation: createRegistry<RelationDef>('relation'),
  gap:      createRegistry<GapDef>('gap'),
  action:   createRegistry<ActionDef>('action'),
  ending:   createRegistry<EndingDef>('ending'),
  metric:   createRegistry<MetricDef>('metric'),
  profile:  createRegistry<z.infer<typeof ModelProfileSchema>>('profile'),
  storyKind:createRegistry<StoryKindDef>('storyKind'),
  mechanism:createRegistry<MechanismDef>('mechanism'),
  worldProcess: createRegistry<WorldProcessDef>('worldProcess'),
};
```

### 5.2 Ba tầng nạp [BB]

```
1. Dựng sẵn   (src/registry/*.ts)         — luôn nạp
2. Mod pack   (src/packs/*.json + import) — người dùng bật/tắt từng pack
3. Ghi đè     (settings.registryOverride) — người dùng sửa từng trường
```

Tầng sau ghi đè tầng trước theo `id`. Ghi đè **một phần**: chỉ trường có mặt mới bị thay.

**[BB]** Ghi đè phải validate lại bằng schema của registry đó. Ghi đè hỏng → bỏ ghi đè, giữ giá trị tầng dưới, ghi cảnh báo vào bảng tự chẩn đoán (Phần 36), **không** crash.

### 5.3 Định nghĩa động từ [MR]

```ts
export type VerbDef = {
  id: string;
  ten: string;
  coChatHopLe: string[];               // aspect hoặc kind mà động từ áp được
  thamSo: z.ZodTypeAny;
  kiemTraTruoc: (ctx: VerbCtx) => KetQua;     // luật nào đang cấm?
  thucThi: (ctx: VerbCtx) => Bien[];          // trả về delta
  heQua: (ctx: VerbCtx) => HeQua[];           // sẹo, phụ thuộc, phân kỳ...
  moTaChoAi: string;                          // EJS, đưa vào context
};
```

`kiemTraTruoc` là chỗ Phần 17.2 lấy lý do từ chối cụ thể. **[BB]** Nó phải trả về **id luật đang cấm**, không được trả chuỗi chung chung.

### 5.4 Panel Xưởng Registry

Màn hình cho người dùng cuối xem và sửa mọi registry: bảng bên trái liệt kê mười hai registry, bên phải là editor JSON có schema hint và nút "Khôi phục mặc định" từng mục. Import/export pack dưới dạng một file `.json` duy nhất.

**[KN]** Cho phép nhân bản một mục dựng sẵn thành mục mới để sửa — đó là cách người dùng học cấu trúc nhanh nhất.

---

## PHẦN 6 — ĐỒ THỊ LIÊN KẾT [BB]

Thay đổi có giá trị cao nhất cho cảm giác "một thế giới hoàn chỉnh": biến database từ tập hồ sơ thành **mạng đi lại được từ bất kỳ điểm nào**.

### 6.1 Schema

```ts
export const LinkSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  tuId: z.string(),
  denId: z.string(),
  quanHe: z.string(),                     // tra R.relation
  trongSo: z.number().min(0).max(100).prefault(50),
  tickTao: z.number(),
  tickDut: z.number().nullable().prefault(null),
  nguon: z.enum(['nguoi_choi','engine','thu_hoach','giai_lo_hong','thanh_tra']).prefault('engine'),
}).prefault({});
```

### 6.2 Quan hệ dựng sẵn [MR]

`ket_tinh_tu, sinh_ra_tu, hien_than_cua, cha_me_cua, phan_than_cua, thuoc_than_he, chiu_luat, vi_pham_luat, khai_thac_ke_ho, tho_phung, so_huu, cu_tru_tai, nho_ve, nhac_den, gay_ra, rang_buoc_boi, doi_nghich, dien_giai_sai, lap_lo_hong, hoa_than_cua, ke_thua_tu, quy_ket_cho`

```ts
export type RelationDef = {
  id: string;
  ten: string;
  doiXung: boolean;                  // true → tự tạo cạnh ngược
  nghichDao?: string;                // id quan hệ ngược, nếu bất đối xứng
  heSoTruyenBa: number;              // dùng khi mở rộng đồ thị, 0–1
  tuKind?: string[]; denKind?: string[];
};
```

### 6.3 Bốn quy tắc [BB]

1. **Mọi reference giữa hai entity phải có Link.** Field id để truy cập nhanh; bảng `links` để đi lại và để đếm.
2. **Repository tự sinh link.** Khi lưu entity thấy `genealogical.chaMeIds` đổi, tự thêm/xóa link `cha_me_cua`. Không để việc này cho tầng gọi.
3. **Không có thực thể mồ côi.** `_degree === 0` sau khi tạo → đưa vào bảng `gaps` với `loai = 'mo_coi'`.
4. **Link không bị xóa cứng.** Quan hệ đứt → set `trongSo = 0` và ghi `tickDut`. Đó là cách "vết sẹo" được lưu.

### 6.4 Mở rộng đồ thị

```ts
export function moRong(gocIds: string[], opts: {
  soHop?: number;               // mặc định 2
  suyGiamMoiHop?: number;       // mặc định 0.55
  loaiQuanHe?: string[];
  nguongTrongSo?: number;       // mặc định 15
  toiDa?: number;
  view?: WorldView;             // BẮT BUỘC khi dùng cho assembler
}): { id: string; kind: string; diem: number; duongDi: string[] }[]
```

`diem = (trongSo/100) × suyGiamMoiHop^hop × heSoTruyenBa(quanHe)`

**[BB]** Khi truyền `view`, hàm phải lọc bỏ mọi entity mà `view` không cho phép chủ thể biết. Mở rộng đồ thị **không được** trở thành đường rò rỉ thông tin.

### 6.5 Panel Mạng Liên Kết

Mọi entity đều có tab **Mạng**: SVG hiển thị toàn bộ web của nó, nhóm theo `quanHe`, click để nhảy, hover hiện `duongDi`.

**[BB]** Đây là màn hình chứng minh "thế giới hoàn chỉnh". Nếu mở một thần bậc trung mà mạng dưới 8 nốt thì tầng tự hoàn thiện đang chạy chưa đủ mạnh — kiểm Phần 15.

---

## PHẦN 7 — CẤU HÌNH: MỌI HẰNG SỐ LÀ DỮ LIỆU [BB]

### 7.1 File cấu hình cân bằng

```ts
export const TuningSchema = z.object({
  khaiNiem: z.object({
    nguongKetTinhMacDinh: z.number().prefault(1000),
    nguongYChi: z.number().prefault(0.6),
    nguongLapLai: z.number().prefault(0.4),
    tickLuongLuToiDa: z.number().prefault(300),     // quá hạn → phân đôi
    heSoLanToaCangThang: z.number().prefault(0.25),
  }).prefault({}),

  luat: z.object({
    nguongApLucKetTinh: z.number().prefault(240),
    coCumToiThieu: z.number().prefault(3),
    tagChungToiThieu: z.number().prefault(2),
    doLechDienGiaiMoiTheHe: z.number().prefault(7),
    lanThuHinhThucHoa: z.number().prefault(3),
  }).prefault({}),

  npc: z.object({
    nhietDoSoftmax: z.number().prefault(0.35),
    nguongThangT2: z.number().prefault(62),
    nguongThangT3: z.number().prefault(85),
    soT2ToiDa: z.number().prefault(30),
    suyGiamCamXucMacDinh: z.number().prefault(0.94),
  }).prefault({}),

  loHong: z.object({
    callToiDaMoiTick: z.number().prefault(1),
    gomToiDaMotCall: z.number().prefault(8),
    nguongUuTien: z.number().prefault(35),
    lanThuToiDa: z.number().prefault(3),
    nguongThucThe: z.number().prefault(3),          // quy tắc ba lần
  }).prefault({}),

  thucTai: z.object({
    hoiToSuaLuat: z.number().prefault(-15),
    hopNhanh: z.number().prefault(-35),
    nhanLuatNghichLy: z.number().prefault(-8),
    moiMauThuanPhatHien: z.number().prefault(-2),
    phucHoiMoiKyNguyen: z.number().prefault(0.5),
  }).prefault({}),

  than: z.object({
    quyKetMatDoDen: z.number().prefault(0.30),
    quyKetDomainStrength: z.number().prefault(0.25),
    quyKetDoKhopTinhCach: z.number().prefault(0.25),
    quyKetCuongDoTuyen: z.number().prefault(0.20),
    nguongDiHoa: z.number().prefault(40),
    tocDoDiHoa: z.number().prefault(0.08),
  }).prefault({}),
}).prefault({});
```

**[BB]** Không một con số nào ở trên được xuất hiện trực tiếp trong code engine. Mọi chỗ đọc đều qua `tuning.<nhóm>.<khóa>`.

### 7.2 Hồ sơ cân bằng

Ba preset dựng sẵn, người dùng tạo thêm được:

| Hồ sơ | Đặc điểm |
|---|---|
| `co_dien` | Cân bằng, thế giới đổi chậm, luật ổn định |
| `hon_loan` | Ngưỡng kết tinh thấp, phân kỳ nhanh, nhiều nghịch lý |
| `chiem_nghiem` | Tự hoàn thiện mạnh, nhiều lỗ hổng được lấp, thế giới dày đặc chi tiết |

### 7.3 Panel Cân Bằng

Hiện toàn bộ `TuningSchema` dạng cây, mỗi trường có slider hoặc ô số, tooltip giải thích ảnh hưởng, và nút khôi phục từng mục. Đổi giá trị có hiệu lực từ tick sau, **không** hồi tố.

---
---

# KHỐI C — HỆ THỐNG THẾ GIỚI

## PHẦN 8 — KHÁI NIỆM

### 8.1 Aspect `conceptual`

```ts
export const ConceptualSchema = z.object({
  giaiDoan: z.enum(['hu_danh','manh_nha','thanh_hinh','ket_tinh']).prefault('hu_danh'),
  trongSo: z.number().min(0).prefault(0),
  nguongKetTinh: z.number().prefault(1000),

  nguon: z.object({
    yChi:   z.number().prefault(0),      // có ai đó CHỌN, MUỐN, QUYẾT ĐỊNH
    lapLai: z.number().prefault(0),      // cứ thế xảy ra, không ai chọn
  }).prefault({}),

  sacThai: z.record(z.string(), z.number()).prefault({}),   // ĐO TỪ SỰ KIỆN THẬT
  phanNghiaId: z.string().nullable().prefault(null),
  cangThang: z.array(z.object({
    khaiNiemId: z.string(),
    doCang: z.number().min(0).max(100),
  })).prefault([]),

  ketTinhThanh: z.enum(['chua','than','luat','ca_hai']).prefault('chua'),
  thucTheIds: z.array(z.string()).prefault([]),
  tickVaoLuongLu: z.number().nullable().prefault(null),
}).prefault({});
```

### 8.2 Rẽ nhánh — và cách xử lý lưỡng lự [BB]

Khi `trongSo >= nguongKetTinh`:

```ts
const tyLe = nguon.yChi / Math.max(1, nguon.yChi + nguon.lapLai);

if (tyLe >= tuning.khaiNiem.nguongYChi)        ketTinhThanh = 'than';
else if (tyLe <= tuning.khaiNiem.nguongLapLai) ketTinhThanh = 'luat';
else {
  // LƯỠNG LỰ — ghi mốc, chờ nghiêng hẳn
  if (tickVaoLuongLu === null) tickVaoLuongLu = tick;
  else if (tick - tickVaoLuongLu > tuning.khaiNiem.tickLuongLuToiDa) {
    ketTinhThanh = 'ca_hai';   // PHÂN ĐÔI
  }
}
```

**Phân đôi [BB]** — sửa lỗ hổng của bản trước, nơi khái niệm lưỡng lự có thể treo vĩnh viễn. Quá hạn thì khái niệm kết tinh thành **cả hai**: một vị thần mang mặt ý chí, và một định luật mang mặt cơ giới. Hai thực thể được nối bằng link `doi_nghich` với `trongSo = 100`, và chúng ở thế căng thẳng vĩnh viễn.

Đây không phải giải pháp chữa cháy — nó là mô-típ có thật: Thần Chết có mặt mũi tồn tại song song với Định Luật Hữu Tử vô ngã, và cả hai đều đúng.

### 8.3 Hai quy tắc định nghĩa

**Sinh phản nghĩa [BB]:** mỗi khi tạo Khái Niệm mới, engine **tự động** tạo phản nghĩa ở trạng thái `hu_danh`, `trongSo = 0`, nối bằng `doi_nghich`. Người chơi không tạo kẻ thù — người chơi tạo **điều kiện cho kẻ thù tồn tại**.

**Nghĩa hiệu dụng:** `sacThai` hiển thị = sắc thái gốc đã bị bẻ bởi láng giềng trong đồ thị `cangThang`, theo `heSoLanToaCangThang`. Tạo "Công Lý" làm "Từ Bi" đổi nghĩa ngay dù không ai chạm vào nó.

**[BB]** `sacThai` **không bao giờ** do người chơi khai. Nó chỉ được engine cộng vào từ sự kiện thật. Người chơi đặt tên; thế giới định nghĩa.

---

## PHẦN 9 — ĐỊNH LUẬT

### 9.1 Aspect `lawful`

```ts
export const LawfulSchema = z.object({
  vanBan: z.string(),                      // câu người chơi viết, nguyên văn

  // ── BẢY TRƯỜNG LOGIC HOÀN CHỈNH ──
  phamVi: z.object({
    loai: z.enum(['vu_tru','coi','vung','chung_loai','huyet_mach','ca_the']).prefault('vu_tru'),
    mucTieu: z.array(z.string()).prefault([]),
  }).prefault({}),

  kichHoat: z.object({
    suKien: z.string().prefault(''),
    dieuKien: z.string().prefault('true'),
  }).prefault({}),

  hieuUng: z.array(z.object({
    duongDan: z.string(),
    phep: z.enum(['set','add','mul','push','remove','flag']),
    giaTri: z.any(),
  })).prefault([]),

  ngoaiLe: z.array(z.object({
    dieuKien: z.string(),
    moTa: z.string().prefault(''),
  })).prefault([]),        // rỗng = luật tuyệt đối, nhưng PHẢI khai tường minh

  bien: z.string().prefault(''),           // luật này KHÔNG làm gì
  uuTien: z.number().min(0).max(1000).prefault(100),
  xungDot: z.array(z.object({
    luatId: z.string(),
    cachGiai: z.enum(['uu_tien_cao_thang','pham_vi_hep_thang','sinh_nghich_ly']).prefault('uu_tien_cao_thang'),
  })).prefault([]),
  khaNghich: z.object({
    duocKhong: z.boolean().prefault(false),
    boiAi: z.enum(['khong_ai','sang_the_than','than_cung_domain','pham_nhan_dac_biet']).prefault('khong_ai'),
    gia: z.string().prefault(''),
  }).prefault({}),
  // ── HẾT BẢY TRƯỜNG ──

  theTag: z.array(z.string()).prefault([]),      // "tinh thần" — dùng tính kẽ hở
  chiThiAi: z.string().prefault(''),             // EJS, mặt mềm

  dienGiai: z.array(z.object({
    theHe: z.number(),
    vungId: z.string().prefault(''),
    noiDung: z.string(),
    doLech: z.number().min(0).max(100).prefault(0),
  })).prefault([]),

  keHo: z.array(z.object({
    moTa: z.string(),
    daBiKhaiThac: z.boolean().prefault(false),
    boiAi: z.string().prefault(''),
  })).prefault([]),

  truongDaXacNhan: z.array(z.string()).prefault([]),   // người chơi đã duyệt trường nào
  lichSuSua: z.array(z.object({
    tick: z.number(),
    cheDo: z.enum(['tiem_tien','hoi_to','phan_nhanh']),
    truoc: z.string(), sau: z.string(),
  })).prefault([]),

  trangThai: z.enum(['nhap','hieu_luc','treo','da_huy']).prefault('nhap'),
}).prefault({});
```

### 9.2 Bảy kiểm tra [BB]

```ts
export function kiemTraLuat(luat: Entity, w: World): KetQuaKiemTra[]
```

| # | Mã | Kiểm tra | Trượt khi |
|---|---|---|---|
| 1 | `PHAM_VI` | `loai` hợp lệ, `mucTieu` giải được thành entity có thật | Rỗng, hoặc trỏ tới entity không tồn tại |
| 2 | `KICH_HOAT` | `suKien` nằm trong danh mục event; `dieuKien` parse và eval được | Sự kiện không tồn tại, biểu thức lỗi |
| 3 | `HIEU_UNG` | Mọi `duongDan` khớp path có thật; `phep` tương thích kiểu | Ghi vào field không tồn tại, `mul` lên string |
| 4 | `NGOAI_LE` | Trường được khai tường minh (rỗng vẫn hợp lệ) | `undefined` — buộc phải **quyết định** |
| 5 | `BIEN` | `bien` không rỗng | Bỏ trống |
| 6 | `MAU_THUAN` | Không luật nào khác cùng `duongDan` mà `dieuKien` giao nhau và `giaTri` xung khắc | Có giao → buộc khai `xungDot[].cachGiai` |
| 7 | `VONG_LAP` | Đồ thị `hieuUng → kichHoat` không có chu trình vô hạn | Chu trình không có số hạng giảm chấn |

**[BB] Điểm sửa quan trọng so với bản trước:** bảy kiểm tra này **không bao giờ chặn người chơi**. Chúng luôn chạy trên bản **đã hình thức hóa** (Phần 17.1). Người chơi viết văn xuôi; AI suy ra bảy trường; validator kiểm tra công việc của AI. Xem 17.1 để rõ luồng.

### 9.3 Thuật toán kiểm tra 6

```
Với mỗi cặp (A, B) cùng ghi vào một duongDan:
  1. Rút miền trạng thái thỏa A.dieuKien → S_A
  2. Rút miền thỏa B.dieuKien            → S_B
  3. S_A ∩ S_B = ∅  → không mâu thuẫn
  4. Giao ≠ ∅:
       set/set giá trị khác     → MÂU THUẪN CỨNG
       add/mul cùng đường dẫn   → MÂU THUẪN THỨ TỰ
     → buộc khai cachGiai
     → chọn 'sinh_nghich_ly' → tạo vùng Nghịch Lý, realityIntegrity += tuning.thucTai.nhanLuatNghichLy
```

### 9.4 Kiểm tra 7

Đồ thị có hướng: cạnh A → B nếu `A.hieuUng` chạm field mà `B.kichHoat.dieuKien` đọc. Chạy Tarjan tìm SCC. Mỗi SCC kích thước > 1 phải có ít nhất một luật có **số hạng giảm chấn** (`mul` hệ số < 1, hoặc `dieuKien` chứa bộ đếm giới hạn). Không có → trượt.

### 9.5 Kẽ hở — cơ chế, không phải kiểm tra

```ts
export function tinhKeHo(luat: Entity, w: World): KeHo[]
```

**Kẽ hở = khoảng cách giữa tinh thần (`theTag`) và văn bản (`kichHoat.dieuKien`).**

Luật "máu đã đổ thì không rửa được" có `theTag: ['giet_nguoi']` nhưng `dieuKien` chỉ bắt `suKien === 'gay_chay_mau'`. **Bóp cổ không kích hoạt.** Engine ghi khe hở này vào `keHo[]`. NPC có `triThuc` cao và `banTinh.tratTu_phongTung < 0` sẽ tìm ra nó — và câu trả lời của engine cho câu hỏi đó sẽ định hình cả một nền văn minh ám sát.

---

## PHẦN 10 — KẾT TINH & BỐN TẦNG LAN TRUYỀN

### 10.1 Bốn tầng [BB]

Luật không tác động một lần. Nó chảy qua bốn tầng, và tầng 4 khép vòng lặp.

| Tầng | Ai quyết | Nội dung |
|---|---|---|
| 1 · **Vật lý** | Engine | Cưỡng chế. Số liệu đổi. Không ai cãi được, kể cả thần |
| 2 · **Nhận thức** | Engine | Phàm nhân không *biết* luật. Họ **suy ra** qua nhiều đời. Và lúc đầu luôn suy **sai** |
| 3 · **Văn hóa** | Engine + AI | Cái suy sai đóng băng thành cấm kỵ, nghi lễ, luật pháp, đẳng cấp. Con người tự cưỡng chế lên nhau, kể cả nơi luật thật không áp dụng |
| 4 · **Phản hồi** | Engine | Văn hóa đổ trọng số vào Khái Niệm. Khái niệm kết tinh thành luật mới. Quay lại tầng 1 |

**[BB] Tầng 2 bắt buộc sai.** `doLech` tăng `tuning.luat.doLechDienGiaiMoiTheHe` mỗi thế hệ, giảm theo `triThuc` trung bình vùng. Diễn giải đúng 100% ngay lập tức là **bug**, không phải tính năng.

### 10.2 Kết tinh: nhiều luật sinh luật mới

```ts
export function quetKetTinh(w: World): LawCandidate[] {
  // 1. Mỗi luật: APLUC = số lần kích hoạt trong kỷ nguyên vừa qua
  // 2. Gom cụm theo theTag: cụm = tập luật chia sẻ >= tuning.luat.tagChungToiThieu tag
  // 3. |cụm| >= tuning.luat.coCumToiThieu && ΣAPLUC > tuning.luat.nguongApLucKetTinh
  //      → sinh candidate
  // 4. Gửi candidate + lịch sử thật cho Narrator để ĐẶT TÊN và VIẾT VĂN BẢN
  // 5. Đưa qua kiemTraLuat() — TRƯỢT THÌ BỎ, không ép
  // 6. Đạt → Law mới, sinhRaTu = [id cụm], tạo link 'sinh_ra_tu'
}
```

**[BB]** Luật kết tinh không được mâu thuẫn với luật cha — trừ khi `realityIntegrity < 40`, lúc đó cho phép và tạo vùng Nghịch Lý. Thế giới sắp sụp là thế giới thú vị nhất.

### 10.3 Ví dụ chuẩn — dùng làm test tích hợp bắt buộc

```
LUẬT BAN:  "Máu đã đổ thì không rửa được."

TẦNG 1 → engine gắn cờ vĩnh viễn dauMau = true lên kẻ giết người.

TẦNG 2 → sau 3 thế hệ, phàm nhân nhận ra kẻ giết người có dấu.
         Suy SAI: tưởng dấu đó LÂY.

TẦNG 3 → kẻ mang dấu bị đuổi khỏi làng. Đao phủ sống ngoài thành.
         Một tầng lớp tiện dân hình thành.
         Nghi lễ tẩy uế ra đời dù nó chưa bao giờ có tác dụng.

TẦNG 4 → Khái niệm "Ô Uế" tích đủ trọng số.
         nguon.lapLai >> nguon.yChi → kết tinh thành LUẬT, không thành THẦN.
         Từ nay ô uế là thuộc tính vật lý CÓ THẬT, lây được, đo được.

KẾT QUẢ: người chơi viết MỘT câu.
         Thế giới trả về một hệ thống đẳng cấp, một tôn giáo tẩy uế,
         và một định luật thứ hai người chơi không hề gõ ra.
```

### 10.4 Ba chế độ sửa luật

| Chế độ | Hành vi | Hệ quả |
|---|---|---|
| `tiem_tien` | Áp dụng từ tick hiện tại | Mượt, ít kịch tính |
| `hoi_to` | Viết lại quá khứ | Ký ức NPC mâu thuẫn, vùng Nghịch Lý, `realityIntegrity += tuning.thucTai.hoiToSuaLuat` |
| `phan_nhanh` | Fork nhánh, giữ cả hai | Copy-on-write, xem song song |

---

## PHẦN 11 — HỒN PHỔ & QUAN HỆ

### 11.1 Aspect `soul` — dùng chung thần và phàm [BB]

```ts
export const SoulSchema = z.object({
  tang: z.enum(['t0','t1','t2','t3']).prefault('t1'),

  banTinh: z.object({
    tuBi_tanNhan:         z.number().min(-100).max(100).prefault(0),
    kieuNgao_khiemNhuong: z.number().min(-100).max(100).prefault(0),
    trungThanh_phanTrac:  z.number().min(-100).max(100).prefault(0),
    ducVong_tietChe:      z.number().min(-100).max(100).prefault(0),
    tratTu_phongTung:     z.number().min(-100).max(100).prefault(0),
    canDam_khiepNhuoc:    z.number().min(-100).max(100).prefault(0),
  }).prefault({}),

  ducVong: z.object({                     // TỔNG = 100, input của utility AI
    quyenLuc: z.number().prefault(12),  triThuc:   z.number().prefault(12),
    tinhAi:   z.number().prefault(12),  baoThu:    z.number().prefault(12),
    anToan:   z.number().prefault(16),  danhTieng: z.number().prefault(12),
    tinNguong:z.number().prefault(12),  tuDo:      z.number().prefault(12),
  }).prefault({}),

  tamTrang: z.array(z.object({            // cảm xúc PHẢI có đối tượng và nguyên nhân
    loai: z.enum(['phan_no','so_hai','yeu_thuong','ghen_ti','buon_ba','han_hoan','xau_ho','khinh_bi','hy_vong','tuyet_vong']),
    doiTuongId: z.string().nullable().prefault(null),
    cuongDo: z.number().min(0).max(100).prefault(0),
    suyGiam: z.number().prefault(0.94),
    nguonGocKyUcId: z.string().nullable().prefault(null),
  })).prefault([]),

  kyUc: z.array(z.object({
    id: z.string(), tomTat: z.string(), tick: z.number(),
    dienTich: z.number().min(0).max(100).prefault(50),
    lienQuan: z.array(z.string()).prefault([]),
  })).prefault([]),

  kyUcSuyGiam: z.boolean().prefault(true),
  agency: z.number().min(0).max(100).prefault(100),
}).prefault({});
```

**Điểm phân biệt thần với người:** `kyUcSuyGiam = false`. Một vị thần nhớ nguyên vẹn mọi xúc phạm suốt mười nghìn năm. **Mối thù thần thánh không bao giờ kết thúc — không cần cơ chế riêng, nó rơi ra từ một boolean.**

**[BB]** Cảm xúc không có `doiTuongId` là vô dụng. "Đang giận" không thúc đẩy được hành động nào; "đang giận Hắc Y Vệ vì chuyện đêm mưa năm ngoái" thì engine chọn được hành động và AI viết được cảnh.

### 11.2 Quan hệ — bốn trục, bất đối xứng

```ts
export const RelationStateSchema = z.object({
  tuId: z.string(),
  denId: z.string(),
  thanSo:  z.number().min(-100).max(100).prefault(0),
  yeuGhet: z.number().min(-100).max(100).prefault(0),
  tinNgo:  z.number().min(-100).max(100).prefault(0),
  noOn:    z.number().min(-100).max(100).prefault(0),
  anTuong: z.string().prefault(''),
  kyUcChungIds: z.array(z.string()).max(3).prefault([]),
  laHuyenThoai: z.boolean().prefault(false),
}).prefault({});
```

**[BB]** Hai record riêng, **không bao giờ đồng bộ hai chiều**.

Trục `tinNgo` tách khỏi `yeuGhet` là có chủ đích: bạn có thể yêu người mình không tin. **Toàn bộ bi kịch hay đều nằm ở khe hở giữa hai trục này.**

`laHuyenThoai = true` cho mọi quan hệ phàm nhân → thần. Bản ghi xây từ huyền thoại, không từ thực tế. Hệ quả tự có, không cần code thêm: một người sùng bái cả đời một vị thần chưa từng biết họ tồn tại; một người căm ghét vị thần đã âm thầm cứu mình ba lần.

---

## PHẦN 12 — THẦN

### 12.1 Aspect `domain`, `venerable`, `divisible`

```ts
export const DomainSchema = z.object({
  domains: z.array(z.object({
    ten: z.string(),
    suc: z.number().min(0).max(100).prefault(50),
  })).prefault([]),
  khaiNiemGocId: z.string().nullable().prefault(null),
  laKhoiNguyen: z.boolean().prefault(false),
  thanHeId: z.string().nullable().prefault(null),
}).prefault({});

export const VenerableSchema = z.object({
  tinDoIds: z.array(z.string()).prefault([]),
  soTinDoUocLuong: z.number().prefault(0),
  matDoDen: z.record(z.string(), z.number()).prefault({}),   // vungId → mật độ
  hienThanh: z.number().min(0).max(100).prefault(20),
  banTinhTinDoTin: SoulSchema.shape.banTinh.prefault({}),
  doLechDiHoa: z.number().min(0).max(100).prefault(0),
}).prefault({});

export const DivisibleSchema = z.object({
  banTheGocId: z.string().nullable().prefault(null),
  phanThanIds: z.array(z.string()).prefault([]),
  doPhanKy: z.number().min(0).max(100).prefault(0),
  nguongHopNhat: z.number().prefault(60),
  thamQuyenDuocChia: z.array(z.string()).prefault([]),
}).prefault({});
```

### 12.2 Dị Hóa — tín đồ nặn lại vị thần [BB]

```ts
// cuối mỗi kỷ nguyên
doLechDiHoa = khoangCachVector(soul.banTinh, venerable.banTinhTinDoTin);
if (doLechDiHoa > tuning.than.nguongDiHoa) {
  soul.banTinh = keo(
    soul.banTinh,
    venerable.banTinhTinDoTin,
    tuning.than.tocDoDiHoa * (doLechDiHoa / 100)
  );
}
```

Bạn là thần của lòng thương xót. Tín đồ đọc sai giáo lý, dựng tòa án dị giáo nhân danh bạn. Ba trăm năm sau, trục `tuBi_tanNhan` của chính bạn đã dịch, và bạn không nhớ nổi lúc nào mình bắt đầu thấy chuyện đó hợp lý.

**Bạn trở thành thứ người ta tưởng bạn là.** Đó là bi kịch trung tâm của cả game, và nó chỉ là một công thức kéo hai vector lại gần nhau.

### 12.3 Phân thân

Tách bản thể là **chơi song song**. Mỗi phân thân thừa hưởng một phần thẩm quyền, có trọng số mục tiêu riêng, và **vẫn chạy khi người chơi không điều khiển**.

- **Không đối xứng:** mỗi phân thân chỉ thấy phần thế giới thuộc `thamQuyenDuocChia`. Ba anh em có ba bản đồ khác nhau về cùng một thế giới.
- **Hợp nhất có điều kiện:** dưới `nguongHopNhat` thì gộp nguyên vẹn, cộng dồn ký ức. Trên ngưỡng thì hoặc sinh thực thể mâu thuẫn tự chống chính mình, hoặc phân thân mạnh nhất **nuốt** hai cái kia.
- **Phàm nhân thờ ba vị riêng biệt**, không biết đó vốn là một → ba giáo phái đánh nhau. Người chơi tự tạo ra chiến tranh tôn giáo cho chính mình.

`PHAN` áp được lên cả Khái Niệm (tách "Chết" thành "Chết Êm" và "Chết Dữ") và Cõi (tạo ranh giới nơi hai bộ luật khác nhau).

### 12.4 Thần Khởi Nguyên

`laKhoiNguyen = true`. Sinh **trước khi thế giới có lịch sử**, nên không có dữ liệu thực nghiệm nào định hình chúng. Đây là thứ **duy nhất người chơi viết 100% theo ý mình**; mọi thứ sau đều do người chơi và thế giới cùng viết.

**[BB]** Không giết được bằng cách thường — chỉ `PHAN`, `DINH`, hoặc chuyển hóa. Có thể `THU` một thần khởi nguyên để lấy thân xác dựng thế giới; khi đó bản chất nó **vĩnh viễn nhiễm vào vật chất**. Giết thần Phẫn Nộ để làm đất đá thì đá của thế giới đó giận dữ mãi mãi.

### 12.5 Kẻ Thù Vĩnh Cửu — aspect `adversarial`

```ts
export const AdversarialSchema = z.object({
  phuDinh: z.object({
    loai: z.enum(['mot_luat','trat_tu','mot_than','ton_tai']).prefault('trat_tu'),
    mucTieuId: z.string().nullable().prefault(null),
  }).prefault({}),
  dieuKhoanBatTu: z.object({
    loai: z.enum(['tai_sinh_tu_thu_no_chong','song_lai_khi_bi_quen','moi_chu_ky_mot_lan','khong_the_giet']).prefault('tai_sinh_tu_thu_no_chong'),
    moTa: z.string().prefault(''),
  }).prefault({}),
  nhip: z.enum(['hang_dem','theo_mua','moi_ky_nguyen','chi_o_tan_the']).prefault('moi_ky_nguyen'),
  lanCuoiTroiDay: z.number().prefault(0),
  soLanBiDayLui: z.number().prefault(0),
}).prefault({});
```

**[BB] Sửa lỗi bản trước:** kẻ thù từng được khai báo rồi bỏ rơi. Nay nó là **bước 6 của vòng lặp tick** (Phần 24). Mỗi tick engine kiểm `nhip` và `lanCuoiTroiDay`; đến hạn thì phát sự kiện trỗi dậy, sinh lời cầu hàng loạt, và cho các thần cơ hội liên minh.

Kẻ thù **không tốn gì để tạo** nhưng là nước đi chiến lược đúng: nó cho phàm nhân cái để xây tôn giáo quanh, cho các thần lý do liên minh, cho lịch sử một nhịp đập. **Thế giới không có đối thủ là thế giới chết yên ắng.**

---

## PHẦN 13 — CHỈ SỐ THẾ GIỚI [BB]

> Sửa lỗi bản trước: `realityIntegrity` và `agency` được dùng khắp nơi nhưng chưa từng được định nghĩa.

### 13.1 Schema

```ts
export const WorldMetricsSchema = z.object({
  realityIntegrity: z.number().min(0).max(100).prefault(100),
  doSongDong:       z.number().min(0).max(100).prefault(50),
  agencyTrungBinh:  z.number().min(0).max(100).prefault(100),
  doPhuThuocTB:     z.number().min(0).max(100).prefault(0),
  tuSinhSuKien:     z.number().min(0).max(100).prefault(100),
  matDoLienKet:     z.number().prefault(0),
  daDangKhaiNiem:   z.number().prefault(0),
  tickTinh: z.number().prefault(0),
}).prefault({});
```

### 13.2 `realityIntegrity` — bảng delta

Mọi thay đổi lấy từ `tuning.thucTai`, không hardcode.

| Sự kiện | Delta |
|---|---|
| Sửa luật chế độ `hoi_to` | −15 |
| Hợp nhánh | −35 |
| Nhận luật mâu thuẫn với `sinh_nghich_ly` | −8 |
| Mỗi mâu thuẫn thanh tra phát hiện | −2 |
| Kỷ nguyên trôi qua không có mâu thuẫn mới | +0.5 |

Ngưỡng hiệu ứng: `< 60` vùng Nghịch Lý xuất hiện · `< 40` cho phép luật mâu thuẫn kết tinh · `< 20` NPC nhớ hai phiên bản quá khứ, thần bắt đầu phát điên · `= 0` kết cục Nghịch Lý Toàn Phần.

### 13.3 `agency` — đo được, không phải cảm tính

Trên mỗi entity có `soul`:

```
agency = 100 × (số hành động NPC tự chọn) / (tổng hành động) 
         trên cửa sổ trượt 50 tick
```

Hành động **không** tự chọn: bị `DINH` trực tiếp, bị lời cầu được đáp ứng thay vì tự giải quyết, bị luật mới cưỡng chế đổi hành vi.

`doPhuThuoc` của vùng kéo `agency` xuống: `agency -= 0.6 × doPhuThuoc(vùng)`.

**[BB]** Vùng có `doPhuThuoc > 70` gần như đứng yên trong utility AI — NPC chỉ còn cầu nguyện. Đây là cách game trừng phạt quản lý vi mô mà **không cần một thanh tài nguyên nào**.

### 13.4 `doSongDong` — thang đo thật của game

```ts
doSongDong = 0.30 × agencyTrungBinh
           + 0.20 × daDangKhaiNiem
           + 0.20 × tuSinhSuKien
           + 0.15 × chuanHoa(matDoLienKet)
           + 0.15 × (100 - doPhuThuocTB);
```

`tuSinhSuKien` = % sự kiện lớn **không** do người chơi gây ra, đo trên toàn kỷ nguyên. Nó trả lời trực tiếp câu hỏi: **thế giới có sống mà không cần bạn không.**

**[BB]** Chỉ hiển thị cuối mỗi kỷ nguyên, **không** hiển thị liên tục — để nó là một sự phản tỉnh, không phải một chỉ số để tối ưu.

---
---

# KHỐI D — TỰ HOÀN THIỆN

> Thế giới tự phát hiện lỗ hổng của mình và tự lấp, **có mạch lạc**.
> Nguyên tắc 2: chi tiết phải được **suy ra**, không được **bịa ra**.

## PHẦN 14 — THU HOẠCH DANH TỪ [BB]

Cơ chế trực tiếp cho "tự suy ra những thứ mình cần". Thế giới lớn lên từ chính lời kể của nó.

### 14.1 Pipeline

```
Narrator sinh văn bản
  → Updater trả THÊM khối <HarvestTerms> (cùng call với <UpdateVariable>)
  → chuẩn hóa (bỏ dấu, lowercase, gộp biến thể)
  → đối chiếu: khớp chính xác → khớp alias → fuzzy (Levenshtein ≤ 2)
  → KHỚP     : link 'nhac_den', +spotlight, ++soLanXuatHien
  → KHÔNG    : tạo Term stub
  → Term đạt tuning.loHong.nguongThucThe → đẩy vào gaps
```

### 14.2 Format

```xml
<HarvestTerms>
[
  { "text": "Đền Sông Đen", "loai": "noi",      "boiCanh": "nơi tế tư trưởng hành lễ" },
  { "text": "Ankhtu",       "loai": "nguoi",    "boiCanh": "tế tư trưởng, giấu tượng thần mới" },
  { "text": "Lễ Tẩy Tro",   "loai": "tap_tuc",  "boiCanh": "nghi lễ rửa dấu máu, vô hiệu" },
  { "text": "Trảo Bạch",    "loai": "sinh_vat", "boiCanh": "thứ sống trong nước đen" }
]
</HarvestTerms>
```

`loai`: `nguoi | noi | vat | to_chuc | sinh_vat | su_kien | tap_tuc | khai_niem | chuc_danh` **[MR]**

### 14.3 Quy tắc ba lần [BB]

**Nhắc một lần là hương vị. Nhắc ba lần là có thật.**

Tạo entity ngay lần đầu sẽ phình database bằng hàng nghìn stub rác từ chi tiết trang trí. Ba lần là cách thần thoại thật hoạt động — thứ gì được kể lại nhiều lần thì trở thành thực.

Ngoại lệ nâng ngay lên 1 lần: term xuất hiện trong `lawful.vanBan`, trong lời tiên tri, hoặc do người chơi tự gõ.

### 14.4 Vòng lặp khép kín

**Narrator bịa ra một cái tên → nó thành entity thật → vào đồ thị → được lắp vào context lần sau → Narrator giờ buộc phải nhất quán với nó.**

AI không cần nhớ. Engine ép nó nhớ.

---

## PHẦN 15 — LỖ HỔNG & BỘ GIẢI RÀNG BUỘC [BB]

### 15.1 Chín loại lỗ hổng dựng sẵn [MR]

```ts
export type GapDef = {
  id: string;
  ten: string;
  phatHien: (w: World, tick: number) => Gap[];
  thuRangBuoc: (gap: Gap, w: World) => RangBuoc;
  apDungNghiem: (gap: Gap, nghiem: unknown, w: World) => void;
  uuTienCoBan: number;
};
```

| Id | Phát hiện khi |
|---|---|
| `nhan_qua` | Có hệ quả mà không có nguyên nhân giải thích |
| `khai_niem` | `giaiDoan >= thanh_hinh` mà `thucTheIds` rỗng |
| `the_che` | Luật hiệu lực qua ≥ 2 thế hệ mà `dienGiai` rỗng |
| `pha_he` | Thần không `laKhoiNguyen`, không có cha mẹ, không sinh từ sự kiện |
| `khong_gian` | Địa danh được nhắc mà chưa có `spatial` |
| `danh_tu_chua_co_thuc_the` | Term đạt ngưỡng ba lần |
| `mo_coi` | `_degree === 0` |
| `phan_nghia` | Khái niệm chưa có phản nghĩa |
| `nghi_le` | Sự kiện lặp thường xuyên mà không có tập tục quanh nó |

```ts
export const GapSchema = z.object({
  id: z.string(), branchId: z.string(),
  loai: z.string(),
  mucTieuId: z.string().nullable().prefault(null),
  moTa: z.string().prefault(''),
  doUuTien: z.number().min(0).max(100).prefault(50),
  soLanThu: z.number().prefault(0),
  daGiai: z.boolean().prefault(false),
  ketQuaId: z.string().nullable().prefault(null),
  laBiAn: z.boolean().prefault(false),
  tickPhatHien: z.number(),
}).prefault({});
```

`doUuTien` tính từ: bậc đồ thị của entity, có nằm trong tiêu điểm người chơi không, tồn tại bao lâu chưa lấp.

### 15.2 Bộ giải ràng buộc

```ts
export type RangBuoc = {
  batBuoc: string[];      // MUST — nghiệm vi phạm là vô hiệu
  nenCo: string[];        // SHOULD — vi phạm thì trừ điểm
  camKy: string[];        // MUST NOT
  khongGianTrong: {
    domainConTrong?: string[];
    tenGoiMau?: string[];
    khoangThoiGianHopLe?: [number, number];
    theTagKhaDung?: string[];
    aspectBatBuoc?: string[];
  };
  thamMy: string;
};
```

**[BB]** `camKy` phải được **suy ra từ luật đang hiệu lực**, không phải do người viết prompt nghĩ ra. Bộ thu ràng buộc quét mọi luật có `theTag` giao với lỗ hổng và biến chúng thành cấm kỵ.

### 15.3 Brief mẫu — bắt buộc theo cấu trúc này

Chú ý: **không có câu hỏi mở nào.**

```
NHIỆM VỤ: đặt tên và mô tả một thực thể kind='deity' lấp lỗ hổng 'khai_niem'.

BẮT BUỘC THỎA:
- Khái niệm cần vật mang: "Ô Uế" (trọng số 1240, đã kết tinh thành LUẬT)
- Vị thần này KHÔNG được là thần của Ô Uế (khái niệm đã hóa luật, không hóa thần)
  → phải là thần ĐỐI PHÓ với Ô Uế: tẩy rửa, trục xuất, hoặc thu nhận
- Thần hệ "Kemet" mô hình QUAN LIÊU → vị thần này là một CHỨC VỤ, có cấp bậc,
  giáng chức được. Phải khai cấp bậc.
- Sinh sau tick 4200 (Ô Uế manh nha), trước tick 5100 (Lễ Tẩy Tro xuất hiện)
- Cha mẹ chọn từ thần tồn tại trước tick 4200: [Neth-Ka, Sobek-Ur, Amaunet]
- Aspect bắt buộc: soul, domain, genealogical, venerable

CẤM KỴ:
- Domain đã chiếm: [mặt trời, sông, chiến tranh, sinh nở, cái chết, tro]
- Không trùng 340 tên đã có (đính kèm)
- KHÔNG được có quyền rửa máu — luật "Máu đã đổ thì không rửa được" đang hiệu lực.
  Chỉ được che, dời, hoặc chịu thay.

BẢNG ĐẶT TÊN KEMET: phụ âm kép, hậu tố -ka/-ur/-net/-tu, không nguyên âm đôi
THẨM MỸ: khô, hành chính, trang nghiêm; thần là công chức của trật tự, không phải anh hùng

TRẢ VỀ: đúng schema Entity với aspects nêu trên. Không thêm lời nào.
```

Dòng "KHÔNG được có quyền rửa máu" là kiểu ràng buộc quan trọng nhất — nó **suy ra từ luật**, không phải do ai nghĩ ra.

### 15.4 Xác thực và bí ẩn [BB]

```
Nghiệm AI trả về
  → validate bằng CHÍNH validator người chơi phải qua
  → TRƯỢT → thêm lý do vào camKy, thử lại (tối đa tuning.loHong.lanThuToiDa)
  → hết lượt → gap.laBiAn = true
```

**Lỗ hổng không giải được không phải bug. Nó là bí ẩn của thế giới:**

- `pha_he` → "không ai biết vị thần này từ đâu ra" → mồi cho tiên tri, cho tà giáo
- `khong_gian` → vùng đất truyền thuyết chưa ai tìm được
- `nhan_qua` → một hệ quả không có nguyên nhân, tức là **dấu vết của một vị thần đã bị xóa khỏi lịch sử**

Bí ẩn ghi vào Sổ Nhân Quả với điều kiện kích hoạt mở, để một ngày một NPC đủ `triThuc` đi tìm.

### 15.5 Bộ điều tiết chi phí [BB]

```ts
export const GapGovernor = {
  callToiDaMoiTick: tuning.loHong.callToiDaMoiTick,   // số CALL, không phải số gap
  gomToiDaMotCall:  tuning.loHong.gomToiDaMotCall,
  nguongUuTien:     tuning.loHong.nguongUuTien,
  chayNen: true,                  // không block UI, không block tick
  uuTienTieuDiem: true,
  gomVaoCuoiKyNguyen: true,
};
```

Ở nhịp Vĩnh Kiếp, gộp toàn bộ gap của một thế kỷ vào **một** call cùng lúc với call sinh kỷ nguyên, dùng luôn `maxOutputTokens` tối đa.

---

## PHẦN 16 — THANH TRA MẠCH LẠC [BB]

> Không bao giờ ném lỗi vào mặt người chơi. Mọi mâu thuẫn biến thành nội dung.

Chạy cuối mỗi kỷ nguyên, hoặc khi `realityIntegrity` giảm quá 10 điểm trong một tick.

| Mâu thuẫn phát hiện | Biến thành |
|---|---|
| Hai bản ghi đá nhau về ngày tháng | **Tranh chấp sử liệu** — giữ cả hai dòng biên niên, sinh NPC học giả tranh luận, phe nào thắng tùy quyền lực |
| NPC nhớ việc chưa xảy ra | **Ký ức giả** — dấu hiệu một vị thần đã sửa quá khứ. Tạo gap `nhan_qua` để truy ai làm |
| Luật bị vi phạm mà không có hiệu ứng | **Kẽ hở đã bị khai thác** (ghi vào `keHo`) hoặc **phép màu** — bắt buộc quy cho một tác nhân, không được để trống |
| Hai thần cùng domain | **Tranh chấp domain**, hoặc tiền đề **dung hợp** nếu `conflictPolicy = dung_hop` |
| Địa danh không có vị trí | **Vùng đất truyền thuyết** — tồn tại trong lời kể, chưa ai tìm được |
| Thực thể mất nguồn gốc | **Bí ẩn phả hệ** — mồi cho tiên tri |
| Thần khí ở hai nơi cùng lúc | **Bản sao hoặc phân thân của khí** — cái nào thật thành tranh chấp tôn giáo |
| Tiên tri hết hạn không ứng | **Tiên tri sai** — giáo phái đặt nó sụp, hoặc diễn giải lại cho khớp |
| `realityIntegrity < 40` | **Vùng Nghịch Lý mở rộng** |

**[BB]** Mọi biên bản thanh tra ghi vào biên niên sử bằng **giọng kể chuyện**, không phải giọng log. Người chơi đọc *"Năm 4820, hai bản Kemet Ký ghi khác nhau về ngày Ankhtu chết; phái Sông Đen giữ bản cũ"* — không đọc `WARN: date conflict on entity npc_ankhtu`.

---

## PHẦN 17 — LUẬT THÔ, ỨNG BIẾN, TỰ DO

### 17.1 Luật thô — bỏ tường chắn [BB]

> **Đây là chỗ sửa mâu thuẫn lớn nhất giữa hai bản trước.**
> Bảy kiểm tra ở Phần 9.2 **không bị bỏ**. Chúng chuyển từ *chặn người chơi* thành *kiểm tra công việc của AI*.

```
Người chơi gõ MỘT CÂU:  "máu đã đổ thì không rửa được"
  ↓
lawFormalizer gửi: câu đó + world state + schema LawfulSchema + danh mục event
  ↓
AI SUY RA cả bảy trường + theTag + chiThiAi
  ↓
kiemTraLuat() chạy trên bản SUY RA
  ↓
trượt → thêm lý do vào brief, thử lại (tối đa tuning.luat.lanThuHinhThucHoa)
  ↓
DIFF cho người chơi: "Đây là cách thế giới hiểu câu của bạn"
  ↓
người chơi sửa trường nào cũng được, hoặc nhận
  ↓
trường nào người chơi chạm vào → ghi vào truongDaXacNhan
```

**[BB]** Panel diff phân biệt rõ:
- Trường **AI suy ra** → màu `--van`, có thể bị engine chỉnh lại sau khi có thêm dữ liệu
- Trường **người chơi xác nhận** → màu `--ngoc`, bất khả xâm phạm

**[BB]** Nếu sau 3 lần thử vẫn trượt, **không** chặn. Nhận luật ở `trangThai = 'treo'`, chỉ áp tầng 2–3 (nhận thức và văn hóa), không áp tầng 1 (vật lý), và tạo gap để engine tự hoàn thiện sau. Người chơi vẫn thấy thế giới phản ứng với ý mình.

### 17.2 Đường ứng biến [BB]

```
Input tự do
  → thử parse thành { verb, substrate, params } qua R.verb
  → KHÔNG khớp → ỨNG BIẾN:
      1. AI đề xuất tổ hợp: chuỗi động từ cơ bản + tham số
      2. AI đề xuất hiệu ứng engine tương ứng
      3. Chạy qua kiemTraLuat (một hành động là một vi-luật một-lần)
      4. Đạt → thực thi + lưu thành CustomOperation
      5. Trượt → nói rõ thế giới không làm được VÀ TẠI SAO,
                 dẫn chiếu ID LUẬT cụ thể đang cấm
```

**[BB]** Không bao giờ trả lời "không hiểu yêu cầu". Luôn một trong hai: làm được (kèm hệ quả), hoặc không làm được **vì luật X**. Cách thứ hai vẫn là nội dung — nó dạy người chơi thế giới của họ hoạt động thế nào.

### 17.3 Động từ tự sinh [MR]

```ts
export const CustomOpSchema = z.object({
  id: z.string(), branchId: z.string(),
  ten: z.string(),
  phanRa: z.array(z.object({
    verb: z.string(),
    coChat: z.string(),
    params: z.record(z.string(), z.any()).prefault({}),
  })).prefault([]),
  dieuKienDung: z.string().prefault('true'),
  soLanDung: z.number().prefault(0),
  daThanhLuat: z.boolean().prefault(false),
}).prefault({});
```

Dùng đủ nhiều lần → **kết tinh thành Định Luật**, và được `R.verb.dangKy()` như một động từ thật. Mỗi save dần tích lũy bộ động từ riêng của nó.

### 17.4 Ba cửa vào [BB]

Wizard 5 bước là **một trong ba** cửa, không bắt buộc.

**[BB v3.1]** Trước ba cửa này, trò chơi mở bước **Hồ sơ người chơi** có thể hoàn tất nhanh, dùng gợi ý, điền đầy đủ hoặc bỏ qua. Hồ sơ này không phải thực thể trong thế giới và không tự trở thành canon. Sau khi chốt bản xem trước của thế giới, người chơi mới chọn **hiện diện ban đầu**: Sáng Thế, một vị thần hoặc một phàm nhân. Luồng, schema và ranh giới riêng tư chuẩn nằm tại Phần 78.

| Cửa | Người chơi làm | Engine làm |
|---|---|---|
| `hu_vo` | Không gì. Một ô nhập trống | Suy ra toàn bộ từ câu đầu tiên, dùng bộ giải ràng buộc lấp mọi lỗ hổng khi cần |
| `mot_cau` | Viết một câu về thế giới mình muốn | Suy ra nguyên mẫu sáng thế, thần hệ, luật khởi đầu; hiện diff cho duyệt |
| `day_du` | Wizard 5 bước | Chỉ lấp phần bỏ trống |

**[BB]** Mọi bước wizard bỏ được và quay lại được **bất kỳ lúc nào trong ván**. Chọn nguyên mẫu sáng thế ở năm thứ 3000 là hợp lệ — nó trở thành một **phát hiện khảo cổ**, không phải một thiết lập.

### 17.5 Wizard 5 bước (cửa `day_du`)

| Bước | Nội dung |
|---|---|
| 1 · **Nguyên mẫu sáng thế** [MR] | Phân Tách Hỗn Độn / Vũ Trụ Noãn / Hiến Tế Nguyên Thủy / Ngôn Từ / Thợ Lặn Đất / Giao Phối Trời Đất. Mỗi cái set khác nhau hằng số vật lý gốc |
| 2 · **Mô hình thần hệ** [MR] | Triều Đình / Quan Liêu Thiên Đình / Huyết Thống Hợp Nhất / Nhập Đồng / Chu Kỳ Sinh Diệt / Vạn Vật Hữu Linh / Anh Linh Hóa Thần. Quyết định kế vị, giáng chức, thần chết thì sao |
| 3 · **Lorebook thần hệ** | Bật/tắt từng lorebook. Chọn `conflictPolicy` nếu bật > 1. Cho phép bật 0 |
| 4 · **Thần Khởi Nguyên** | Tạo 0–5. Thứ duy nhất người chơi viết 100% theo ý mình |
| 5 · **Luật khai thiên** | Ban 0–3 luật đầu. Đi qua luồng 17.1 |

---
---

# KHỐI E — BA TẦNG CHƠI

## PHẦN 18 — HÀM CHIẾU [BB]

> **Ba tầng chơi là ba hàm chiếu trên cùng một database. Không phải ba game.**

```ts
export function chieu(w: World, mode: ViewMode, chuTheId: string | null): WorldView
```

**[BB]** Không viết ba bộ logic. Viết **một** engine, **ba** hàm chiếu. Nếu agent thấy mình copy-paste logic giữa các tầng thì đã làm sai.

### 18.1 WorldView

```ts
export type WorldView = {
  mode: 'sang_the' | 'than' | 'pham_nhan';
  chuTheId: string | null;

  entities: ReadonlyMap<string, ProjectedEntity>;   // đã lọc và đã làm mờ
  laws: readonly ProjectedLaw[];
  concepts: readonly ProjectedConcept[];

  suongMu: {
    ro: string[];        // thấy đầy đủ
    mo: string[];        // chỉ thống kê, không nội tâm
    tinDon: string[];    // nghe kể lại, ĐÃ BỊ BÓP MÉO
    mu: string[];        // không biết tồn tại
  };

  dongTuKhaDung: VerbDef[];
  nhipThoiGian: 'nhat' | 'nien' | 'the_dai' | 'vinh_kiep';
};
```

**[BB]** Assembler (Phần 30) và `moRong()` (6.4) chạy trên `WorldView`, **không** chạy trên `World`. Đây là cách duy nhất đảm bảo AI không kể ra thứ nhân vật không được biết.

### 18.2 Quy tắc chiếu lấy từ `KindDef.phanChieu` [MR]

Không hardcode. Mỗi kind tự khai tầng nào thấy nó thế nào. Ngoài ra, ba quy tắc cứng:

| Dữ liệu | Sáng Thế | Thần | Phàm Nhân |
|---|---|---|---|
| `lawful.vanBan` | Đầy đủ | Trong domain | **Không bao giờ.** Chỉ `dienGiai` của vùng mình, tức bản đã sai |
| `soul.banTinh` của thần | Đầy đủ | Của mình + đồng minh | **Không bao giờ.** Chỉ `venerable.banTinhTinDoTin` |
| `conceptual.trongSo` | Đầy đủ | Trong domain | Không. Chỉ biết khái niệm đã có **tên trong văn hóa** vùng mình |

### 18.3 Test rò rỉ [BB]

Chơi tầng phàm nhân, hỏi AI "luật của thế giới này là gì". AI **phải** trả lời bằng truyền thuyết dân gian và **phải trả lời sai** ở đúng chỗ `dienGiai` đã lệch.

Nếu nó đọc ra văn bản luật gốc → assembler đang rò rỉ. **Dừng mọi việc khác và sửa.** Đây là bug nghiêm trọng nhất trong toàn dự án.

---

## PHẦN 19 — TẦNG THẦN

### 19.1 Sương Mù Thần Vị

```ts
export function tinhSuongMu(than: Entity, w: World): SuongMu
```

- **RÕ**: entity có link `tho_phung` → thần, hoặc trong lãnh địa
- **MỜ**: entity ở vùng có ≥ 1 tín đồ (thấy số, không thấy nội tâm)
- **TIN ĐỒN**: được nhắc bởi tín đồ nhưng ngoài lãnh địa → **phải qua `bopMeo()`**
- **MÙ**: phần còn lại

**[BB]** `bopMeo()` không phải làm mơ hồ. Nó phải **sai có cấu trúc**: tên bị đổi, số phóng đại theo hướng có lợi cho phe kể, động cơ gán nhầm, thời gian dồn lại. Mức méo tăng theo số chặng truyền, giảm theo `triThuc` người kể.

Đây là nguồn kịch tính chính của tầng Thần: **bạn hành động dựa trên thông tin sai, và bạn biết là nó có thể sai.**

### 19.2 Tranh đoạt domain — đánh nhau bằng quy kết, không bằng máu

Hệ chiến đấu của tầng Thần. Không HP, không sát thương.

```
1. Sự kiện lớn xảy ra, engine gắn domainTags
   vd: bão biển nhấn chìm hạm đội → ['bao','bien','chien_tranh']
2. Mọi thần có domain giao với tags được QUYỀN TUYÊN
3. Tuyên = tiêu một hành động để dấu ấn mình hiện rõ trong sự kiện
4. Phàm nhân QUY KẾT cho một thần. Xác suất (hệ số từ tuning.than):
     0.30 × mật độ đền quanh nơi xảy ra
     0.25 × domainStrength hiện tại
     0.25 × độ khớp giữa sự kiện và banTinhTinDoTin
     0.20 × cường độ tuyên
5. Thần được quy kết: suc += ; thần thua: suc -=
6. suc chạm 0 → MẤT DOMAIN ĐÓ VĨNH VIỄN
7. Tạo link 'quy_ket_cho' từ sự kiện tới thần thắng
```

**[BB]** Dòng thứ ba của mục 4 là chỗ Dị Hóa nối vào: **vị thần bị tin là tàn nhẫn sẽ dễ giành domain bạo lực và khó giữ domain hiền lành.** Danh tiếng quyết định bạn thắng được cái gì. Đây là vòng phản hồi quan trọng nhất của tầng Thần.

### 19.3 Hiển Thánh và Phụ Thuộc

| `hienThanh` cao | `hienThanh` thấp |
|---|---|
| Tín đồ tăng nhanh, quy kết dễ thắng | Tăng chậm |
| Thần khác **thấy được** hành động của bạn → bị phản kích | Khó truy về bạn |
| `doPhuThuoc` của tín đồ tăng | Tín đồ tự giải quyết vấn đề |

`doPhuThuoc` cao kéo `agency` xuống (13.3). Vùng `> 70` gần như đứng yên. Cơ chế này trừng phạt quản lý vi mô mà không cần thanh tài nguyên nào.

### 19.4 Hóa thân

```ts
export const AvatarSchema = z.object({
  thanId: z.string(),
  thanTheId: z.string(),
  mucQuen: z.number().min(0).max(100).prefault(80),
  dieuKienThucTinh: z.string().prefault(''),
  daThucTinh: z.boolean().prefault(false),
  quyenNangConLai: z.number().min(0).max(100).prefault(5),
  neuChet: z.enum(['ve_than','mat_vinh_vien','tai_sinh']).prefault('ve_than'),
  tickHaPham: z.number(),
}).prefault({});
```

**[BB]** Khi đang hóa thân, `chieu()` của vị thần đó **tụt xuống mức phàm nhân**. Thần mất toàn tri trong domain của chính mình. Đó là cái giá thật, và nó không phải một con số bị trừ đi.

Điều kiện thức tỉnh gợi ý: nghe đúng một câu, chết lần đầu, gặp phân thân của chính mình, chạm vào thần khí của mình, bị chính tín đồ của mình hành hình.

---

## PHẦN 20 — TẦNG PHÀM NHÂN

### 20.1 Nhìn từ dưới lên

**[BB]** Không có UI nào ở tầng phàm nhân hiển thị số liệu thần thánh. Không thanh tín ngưỡng, không chỉ số domain, không danh sách luật. Chỉ có: sức khỏe, tuổi, quan hệ, tài sản, danh tiếng, và **những gì người ta kể**.

Can thiệp thần thánh **không bao giờ được gán nhãn**. Chỉ hiện ra như trùng hợp, giấc mơ, điềm báo.

### 20.2 Aspect `mortal`

```ts
export const MortalSchema = z.object({
  tuoiTho: z.number(),                    // engine tính, người chơi KHÔNG thấy con số
  tickSinh: z.number(),
  tickChet: z.number().nullable().prefault(null),
  nguyenNhanChet: z.string().prefault(''),
  ducVongCaNhan: z.array(z.object({
    moTa: z.string(), dat: z.boolean().prefault(false),
  })).prefault([]),
  duocNhoBoi: z.number().prefault(0),
  daHoaThan: z.boolean().prefault(false),
}).prefault({});
```

**[BB]** Sống thọ, chết yểu, thành danh, vô danh — **tất cả đều là kết quả hợp lệ**. Không có màn hình "Game Over". Chết là một sự kiện trong biên niên sử, và ván chơi tiếp tục.

### 20.3 Ba đường sau khi chết

| Đường | Điều kiện | Kết quả |
|---|---|---|
| **Kế thừa** | Có con cháu hoặc đệ tử | Chơi tiếp bằng người đó. Quan hệ và tiếng tăm người trước kế thừa dạng `laHuyenThoai = true` |
| **Chứng kiến** | Luôn có | Chuyển sang một NPC từng biết người chết. Thấy thế giới phản ứng |
| **Anh Linh Hóa Thần** | `duocNhoBoi` vượt ngưỡng, thần hệ có mô hình `anh_linh_hoa_than` | **Lên tầng Thần.** Kỹ thuật: **thêm** aspect `domain` + `venerable` vào entity đang có, giữ nguyên `soul` và mọi quan hệ |

Đường thứ ba là phần thưởng cảm xúc lớn nhất của cả game. **Nó chỉ hoạt động nhờ mô hình Entity–Aspect ở Phần 4** — đó là lý do quyết định kiến trúc đó quan trọng.

**[BB]** Khi phàm nhân hóa thần, mọi quan hệ cũ giữ nguyên nhưng phía bên kia dần được set `laHuyenThoai = true` theo thế hệ. Người bạn thân năm xưa, ba đời sau, chỉ còn thờ một huyền thoại mang tên bạn.

---

## PHẦN 21 — CHUYỂN TẦNG

### 21.1 Ma trận

| Từ ↓ Đến → | Sáng Thế | Thần | Phàm Nhân |
|---|---|---|---|
| **Sáng Thế** | — | Nhập vào một thần của mình, hoặc tách phân thân | Hóa thân đầy đủ, `mucQuen` tự chọn |
| **Thần** | Chỉ nếu vốn là Sáng Thế (thức tỉnh), hoặc nuốt đủ khái niệm | — | Hạ phàm (19.4) |
| **Phàm Nhân** | Không trực tiếp | Anh Linh Hóa Thần, hoặc phi thăng thật | — |

**[BB]** Xuống tầng luôn tự do. Lên tầng luôn cần lý do trong truyện.

### 21.2 Tầng trên vẫn chạy khi vắng mặt [BB]

Đây là điều quan trọng nhất của phần này.

```
Người chơi chơi 40 năm ở tầng phàm nhân
  → 40 năm đó phân thân Hủy Diệt chạy tự do bằng utility AI
  → doPhanKy tăng từ 12 lên 58
  → quay lại tầng Sáng Thế: Hủy Diệt đã có triết lý riêng
     và đang dọn dẹp thứ bạn muốn giữ
```

**[BB]** Khi quay lại tầng trên, hiện **Bản Tấu** — tóm tắt những gì phân thân và thế giới đã làm trong lúc vắng mặt, viết bằng **giọng biên niên sử**, không phải giọng log.

### 21.3 Kỹ thuật

```ts
export const PlayerStateSchema = z.object({
  playerProfileId: z.string().nullable().prefault(null),
  creatorIdentityId: z.string().nullable().prefault(null),
  setupVersion: z.number().int().min(0).prefault(0),
  setupCompleted: z.boolean().prefault(false),
  mode: z.enum(['sang_the','than','pham_nhan']).prefault('sang_the'),
  chuTheId: z.string().nullable().prefault(null),
  banTheGocId: z.string().nullable().prefault(null),
  lichSuChuyenTang: z.array(z.object({
    tick: z.number(), tu: z.string(), den: z.string(), lyDo: z.string(),
  })).prefault([]),
}).prefault({});
```

Chuyển tầng **không** tạo save mới, **không** đổi `branchId`, **không** reset gì. Chỉ đổi `mode` + `chuTheId` và gọi lại `chieu()`.

---

## PHẦN 22 — CẦU NGUYỆN: NHIỆM VỤ TỰ SINH [BB]

Game thần thánh luôn vấp câu hỏi "giờ tôi làm gì". Câu trả lời: **để thế giới tự tìm đến người chơi.**

### 22.1 Schema

```ts
export const PrayerSchema = z.object({
  id: z.string(), branchId: z.string(),
  nguoiCauId: z.string(),
  thanNhanId: z.string().nullable().prefault(null),   // null = cầu chung
  loai: z.enum(['xin_cuu','ta_on','nguyen_rua','hoi_dap','dang_hien','thach_thuc']),
  noiDung: z.string(),
  cuongDo: z.number().min(0).max(100).prefault(50),
  goc: z.object({                          // sinh từ utility AI, KHÔNG bịa
    ducVongThieu: z.string(),
    canTroId: z.string().nullable().prefault(null),
  }).prefault({}),
  tickCau: z.number(),
  hanChot: z.number().nullable().prefault(null),
  daTraLoi: z.boolean().prefault(false),
  cachTraLoi: z.enum(['chua','ban_phuoc','lam_ngo','trung_phat','dau_hieu','tra_gia']).prefault('chua'),
}).prefault({});
```

### 22.2 Sinh lời cầu [BB]

Lời cầu **không được AI bịa**. Nó sinh từ utility AI:

```
NPC chạy utility AI
  → tìm hành động điểm cao nhất
  → nhưng khaThi(action) < ngưỡng   (họ MUỐN mà KHÔNG LÀM ĐƯỢC)
  → nếu có link 'tho_phung' và ducVong.tinNguong đủ cao
      → sinh Prayer với goc.ducVongThieu = dục vọng đó
```

Nhờ vậy **mọi lời cầu đều truy được về một bế tắc thật trong mô phỏng**. Không có lời cầu trang trí.

### 22.3 Bốn cách trả lời, cả bốn đều có hậu quả

| Cách | Tức thì | Dài hạn |
|---|---|---|
| `ban_phuoc` | Gỡ cản trở, NPC đạt mục tiêu | `doPhuThuoc` vùng tăng. Chuyện được kể lại → thêm lời cầu tương tự |
| `lam_ngo` | Không gì | `doThatVong` tích. Vượt ngưỡng → NPC đổi thần, mất tín ngưỡng, hoặc sinh tà giáo |
| `trung_phat` | `DINH` phạm vi cá thể | Sợ hãi tăng, tín ngưỡng tăng ngắn hạn, `yeuGhet` giảm sâu |
| `dau_hieu` | Một điềm báo mơ hồ, không giải quyết gì | NPC tự diễn giải — **và có thể diễn giải sai**. Rẻ nhất, thú vị nhất |

**[BB]** `lam_ngo` là lựa chọn **hạng nhất**, không phải "bỏ qua". Nó phải có UI ngang hàng ba cách kia và phải ghi vào Sổ Nhân Quả.

### 22.4 UI

Panel phải của Sảnh. Mỗi lời cầu là thẻ kính nhỏ: tên người cầu, một dòng nội dung, thanh cường độ mảnh, thời gian còn lại. Sắp theo `cuongDo × độ gần tiêu điểm`.

Ở nhịp Vĩnh Kiếp, lời cầu **gộp thành làn sóng**: *"Bốn nghìn người ở lưu vực Sông Đen cầu cùng một điều trong ba mươi năm."*

---

## PHẦN 23 — UTILITY AI [BB]

Thứ làm tầng T1 sống mà không tốn một token nào.

### 23.1 Hàm điểm

```ts
export function chamDiem(npc: Entity, hd: ActionDef, view: WorldView): number {
  const soul = lay(npc, 'soul');
  let diem = 0;

  // 1. Dục vọng — nền
  for (const [duc, w] of Object.entries(soul.ducVong))
    diem += w * hd.phuHop[duc] ?? 0;

  // 2. Cảm xúc — khuếch đại mạnh, có ĐỐI TƯỢNG
  for (const cx of soul.tamTrang)
    if (cx.doiTuongId && hd.lienQuanToi(cx.doiTuongId))
      diem += cx.cuongDo * heSoCamXuc(cx.loai, hd) * 1.8;

  // 3. Quan hệ — bốn trục
  const qh = quanHeVoi(npc, hd.mucTieuId);
  if (qh) diem += qh.yeuGhet * hd.huong + qh.noOn * hd.traNo;

  // 4. Luật — theo DIENGIAI mà NPC BIẾT, không theo luật thật
  for (const dg of luatNpcBiet(npc, view))
    if (hd.viPham(dg))
      diem -= 40 * (soul.banTinh.tratTu_phongTung > 0 ? 1.5 : 0.4);

  // 5. Khả thi
  return diem * hd.khaThi(npc, view);
}
```

### 23.2 Bốn quy tắc [BB]

1. **Mục 4 dùng `dienGiai`, không dùng `lawful.vanBan`.** NPC tuân theo luật mà họ **tưởng** là có. Đây là chỗ Giáo Lý Sai Lệch biến thành hành vi thật.
2. **Không chọn hành động điểm cao nhất.** Softmax nhiệt độ `tuning.npc.nhietDoSoftmax`, seeded theo `(saveSeed, npcId, tick)`. **NPC luôn chọn tối ưu là NPC chết. NPC thỉnh thoảng làm điều ngu ngốc là NPC sống.**
3. **`khaThi() < ngưỡng` mà điểm cao → sinh Prayer** (22.2).
4. **Mọi hành động sinh Event.** Event nuôi `conceptEngine`. Đây là cách trọng số khái niệm được đo từ *hành vi thật*, không phải từ khai báo.

### 23.3 Danh mục hành động [MR]

```ts
export type ActionDef = {
  id: string; ten: string;
  phuHop: Record<string, number>;        // dục vọng → hệ số
  dieuKien: string;
  khaThi: (npc: Entity, v: WorldView) => number;
  hieuUng: Bien[];
  sinhSuKien: string;
  theTag: string[];
};
```

Dựng sẵn: `lao_dong, buon_ban, cau_hon, sinh_con, hoc, day, thu_thap_thong_tin, vu_khong, am_sat, tra_thu, lap_giao_phai, xay_den, hanh_huong, noi_loan, di_cu, tich_luy, ban_phat, tim_kiem_than_khi, giai_ma_luat, khai_thac_ke_ho, cau_nguyen, bo_dao, an_giau, to_cao, hoa_giai`

**[BB]** `khai_thac_ke_ho` chỉ khả thi với NPC có `ducVong.triThuc` cao **và** `banTinh.tratTu_phongTung < 0`. Đây là chỗ `keHo` (9.5) chuyển từ dữ liệu thành sự kiện lịch sử.

---
---

# KHỐI F — MÔ PHỎNG

## PHẦN 24 — TICK ENGINE [BB]

> Sửa mâu thuẫn bản trước: ba tài liệu cũ có ba thứ tự khác nhau. Đây là thứ tự **duy nhất**.

### 24.1 Mười bốn bước

| # | Bước | Ai chạy |
|---|---|---|
| 1 | Thời gian, mùa, môi trường, dân số, kinh tế | engine |
| 2 | Áp luật — bốn tầng lan truyền | engine |
| 3 | Utility AI T1 | engine |
| 4 | Sinh lời cầu từ T1 bế tắc | engine |
| 5 | Kiểm Sổ Nhân Quả — tiên tri, lời nguyền đến hạn | engine |
| 6 | **Kẻ thù vĩnh cửu — kiểm nhịp trỗi dậy** | engine |
| 7 | Cập nhật Khái Niệm — trọng số, ngưỡng, rẽ nhánh, lưỡng lự | engine |
| 8 | Kết tinh luật mới | engine (+1 LLM nếu có candidate) |
| 9 | Phân kỳ phân thân | engine |
| 10 | Giáo lý sai lệch — tăng `doLech` | engine |
| 11 | Quét lỗ hổng | engine |
| 12 | **T2 batch** — 1 LLM call gộp | LLM |
| 13 | Giải lỗ hổng | ≤1 LLM (governor) |
| 14 | Event bus → tin đồn, điềm báo, hàng cầu nguyện | engine |
| — | Aspect có `moiTick` được gọi ở bước tương ứng | engine |

**Cuối mỗi kỷ nguyên, thêm:** thanh tra mạch lạc (16) → nén biên niên sử → sinh Lorebook (32.4) → tính chỉ số (13) → Dị Hóa (12.2).

**[BB]** Bước 1–11 và 14 là **engine thuần, deterministic theo seed**. Chỉ bước 8, 12, 13 gọi LLM. Chạy 1000 tick không LLM phải cho kết quả giống hệt nhau với cùng seed.

### 24.2 Nhịp thời gian

| Nhịp | Mỗi tick | Cách chạy |
|---|---|---|
| Nhật | 1 ngày | Cảnh đầy đủ, T3 |
| Niên | 1 mùa | Tick thường, đủ 14 bước |
| Thế Đại | 10 năm | Bỏ bước 12, gộp bước 13 |
| Vĩnh Kiếp | 100 năm | **Một call sinh cả kỷ nguyên** (31.2) |

---

## PHẦN 25 — PHÂN TẦNG NPC [BB]

| Tầng | Số lượng | Xử lý | Chi phí |
|---|---|---|---|
| **T0** Quần chúng | Toàn dân số | Thống kê thuần, **không có aspect `soul`** | ~0 |
| **T1** NPC có tên | Vài trăm | Utility AI, **không gọi LLM** | ~0 |
| **T2** Nhân vật kịch | ≤ `tuning.npc.soT2ToiDa` | **Một** LLM call gộp mỗi tick | Thấp |
| **T3** Trên sân khấu | 1–5 | LLM roleplay đầy đủ | Cao |

**[BB]** T1 chỉ có `banTinh` + `ducVong` + 3 quan hệ mạnh nhất. T2 có đủ, `kyUc` nén còn 10 mảnh. T3 mở toàn bộ.

**Khi NPC thăng hạng**, trường thiếu được **sinh ra ngay lúc đó từ lịch sử họ đã sống**, qua bộ giải ràng buộc (15.2), **không phải bịa mới**.

> NPC tầng thấp không cần có tâm hồn — chỉ cần **đủ dấu vết để tâm hồn được suy ra khi cần**.

### 25.1 Điểm spotlight

```
spotlight = 0.35×ganNguoiChoi + 0.25×dinhTienTri + 0.20×quyenLuc
          + 0.15×doCauNguyen + 0.05×random(seed)
```

Thăng khi vượt `tuning.npc.nguongThangT2` / `nguongThangT3`. Giáng khi nguội. **Giáng hạng không xóa state**, chỉ ngừng được kể chi tiết.

---

## PHẦN 26 — NHÁNH & THỜI GIAN PHI TUYẾN

### 26.1 Copy-on-write

```ts
export const BranchSchema = z.object({
  id: z.string(), worldId: z.string(),
  gocId: z.string().nullable().prefault(null),
  tickTao: z.number(),
  ten: z.string().prefault(''),
  lyDoTach: z.string().prefault(''),
  dangChay: z.boolean().prefault(true),
}).prefault({});
```

**Đọc:** branch hiện tại → lần lên `gocId` → tới gốc. **Ghi:** luôn vào branch hiện tại, tạo bản sao nếu record thuộc branch cha.

**[BB]** Tầng 1 và 2 của prompt chỉ phụ thuộc phần trước điểm tách → **mọi nhánh cùng gốc chia sẻ prefix cache**. Nếu chi phí nhánh thứ hai gần bằng nhánh thứ nhất thì cache đang hỏng — kiểm bảng tự chẩn đoán.

### 26.2 Bản Đồ Nhánh

SVG cây theo ngôn ngữ hình ảnh của Tinh Đồ. Mỗi nốt là điểm tách, nhãn là `lyDoTach`. Độ dày cạnh ∝ số năm đã chạy. Nhánh `realityIntegrity` thấp vẽ nét đứt.

**So sánh hai nhánh:** chọn hai nốt → diff ba cột: chỉ có ở A / cả hai / chỉ có ở B. Cho thần, luật, khái niệm, nền văn minh.

### 26.3 Hợp nhánh

Cho phép, nhưng đắt: thế giới nhớ **hai** lịch sử.

```
realityIntegrity += tuning.thucTai.hopNhanh   (−35)
entity tồn tại ở cả hai nhánh với trạng thái khác nhau → vùng Nghịch Lý
NPC nhớ hai phiên bản quá khứ
thanh tra mạch lạc sinh hàng loạt tranh chấp sử liệu
```

Đây là đồ chơi cuối game, không phải tính năng tiện ích.

### 26.4 Nhảy cóc kỷ nguyên

```
Chọn nhịp Vĩnh Kiếp, tua 100 năm
  → engine chạy bước 1–11 và 14 × 100 lần (toán thuần, nhanh)
  → gom toàn bộ delta + gap tích lũy
  → MỘT call: input 80–150k, output 50–65k
     yêu cầu: biên niên sử một thế kỷ
              + giải toàn bộ gap ưu tiên cao
              + delta có cấu trúc để engine hấp thụ
  → Updater bóc patch
  → sinh Lorebook cho kỷ nguyên
```

**[BB]** Người chơi được chọn **bỏ qua hoặc xem** từng sự kiện lớn. Sự kiện bị bỏ qua **vẫn xảy ra**, chỉ không được kể chi tiết — và quay lại xem sau được, vì nó đã nằm trong bảng `events`.

---

## PHẦN 27 — CHU KỲ & VÒNG SAU

### 27.1 Năm kết cục [MR]

| Kết cục | Điều kiện | Mô tả |
|---|---|---|
| **Thế Giới Búp Bê** | `agencyTrungBinh < 20` | Không ai còn tự quyết. Bạn có một thế giới tuân phục tuyệt đối và hoàn toàn chết |
| **Nghịch Lý Toàn Phần** | `realityIntegrity = 0` | Thế giới tự phủ định. Ký ức, luật, thời gian đều mâu thuẫn. Tan rã |
| **Bị Lãng Quên** | Mọi `domainStrength = 0` | Bạn không còn là thần. Ván tiếp tục ở tầng phàm nhân, không ai biết bạn từng là ai |
| **Chu Kỳ Hoàn Tất** | Thần hệ mô hình `chu_ky_sinh_diet`, đến hạn | Ragnarök / Kali Yuga. Thế giới diệt theo lịch |
| **Buông Tay** | Người chơi chọn: `BUONG` áp lên `SELF`, phạm vi vũ trụ | *Deus otiosus.* Bạn rời đi. Thế giới chạy tiếp mà không có bạn, và bạn được xem |

**[BB]** Kết cục thứ năm là kết cục **tốt nhất** về `doSongDong` và phải được trình bày như một lựa chọn nghiêm túc, không phải nút thoát game. Sau khi chọn, vào **chế độ chứng kiến**: engine tiếp tục chạy tick, người chơi đọc biên niên sử, không tác động được gì.

### 27.2 Vòng sau

```
Save cũ kết thúc
  → nén toàn bộ biên niên sử thành MỘT Mythos Pack
       input 300k–1M, output 40–65k
  → pack chứa: thần điện cũ, luật lớn, anh hùng, thảm họa
       NHƯNG đã qua bopMeo() như truyền thuyết:
         tên bị đổi, thời gian dồn, động cơ gán nhầm, số phóng đại
  → nạp vào thế giới mới như lorebook thần hệ bật sẵn
```

**[BB]** Bước bóp méo là **bắt buộc**, dùng chính `bopMeo()` ở 19.1. Những vị thần bạn từng là **không được** xuất hiện chính xác ở vòng sau. Chúng phải xuất hiện như thần thoại mà phàm nhân kể **sai** — vì đó chính là luận điểm của cả trò chơi.

### 27.3 Di sản xuyên vòng

```ts
export const LegacySchema = z.object({
  vongTruoc: z.number(),
  doSongDong: z.number(),
  ketCuc: z.string(),
  thanConSot: z.array(z.string()).prefault([]),
  luatKhac: z.array(z.string()).prefault([]),      // khắc vào nền vũ trụ, không xóa được
  biAnChuaGiai: z.array(z.string()).prefault([]),
}).prefault({});
```

`biAnChuaGiai` chuyển sang vòng mới **nguyên vẹn**. Bí ẩn không giải được ở vòng một trở thành bí ẩn cổ xưa của vòng hai. Sau vài vòng, thế giới tích lũy một tầng nền huyền bí mà **không ai — kể cả người chơi — biết câu trả lời**, vì câu trả lời chưa từng được sinh ra.

---
---

# KHỐI G — TỰ SỰ

> **Thế giới không xoay quanh người chơi.**
> Mặc định của mọi LLM roleplay là bệnh lấy người chơi làm tâm: mọi NPC quay mặt về phía người chơi, mọi cảnh nói về người chơi, thế giới đứng đợi. Khối này tồn tại để **chống** hành vi đó bằng cơ chế, không bằng lời dặn trong prompt.
> Người chơi là **một** nhân vật trong thế giới, không phải trục của nó.

## PHẦN 28 — MẠCH TRUYỆN LÀ THỰC THỂ HẠNG NHẤT [BB]

### 28.1 Vì sao phải có

Nếu câu chuyện chỉ tồn tại trong lịch sử chat, thì khi người chơi đi chỗ khác, câu chuyện biến mất. Mạch Truyện là cách biến **cốt truyện thành dữ liệu**, để nó chạy tiếp mà không cần ai nhìn.

### 28.2 Schema

```ts
export const StorylineSchema = z.object({
  id: z.string(), branchId: z.string(),
  ten: z.string(),
  loai: z.string(),                       // tra R.storyKind

  nhanVat: z.array(z.object({
    entityId: z.string(),
    vaiTro: z.enum(['chinh','doi_dau','xuc_tac','chung_kien','nan_nhan','ke_thua']),
    trongSo: z.number().min(0).max(100).prefault(50),
  })).prefault([]),

  giaiDoan: z.enum(['am_i','khoi','phat_trien','cao_trao','ha_man','du_am','chet_yeu']).prefault('am_i'),
  cangThang: z.number().min(0).max(100).prefault(10),
  dongHo: z.number().prefault(0),          // tick còn lại tới nhịp kế
  nhipMoi: z.number().prefault(12),        // chu kỳ nhịp

  nutThat: z.array(z.object({
    moTa: z.string(),
    daGo: z.boolean().prefault(false),
    tickTao: z.number(),
  })).prefault([]),

  phucBut: z.array(z.string()).prefault([]),    // id trong Sổ Phục Bút

  nguoiChoiBiet: z.boolean().prefault(false),
  nguoiChoiThamGia: z.boolean().prefault(false),

  kyUcMach: z.string().prefault(''),       // tóm tắt nén, nuôi context
  ketCuc: z.string().nullable().prefault(null),
  tickSinh: z.number(),
  tickKet: z.number().nullable().prefault(null),
}).prefault({});
```

**[BB]** `nguoiChoiBiet = false` phải là **đa số**. Thế giới đầy những câu chuyện người chơi chưa từng nghe. Đó chính là thứ khiến nó giống một thế giới thay vì một sân khấu.

### 28.3 Loại mạch truyện dựng sẵn [MR]

```ts
export type StoryKindDef = {
  id: string; ten: string;
  tienDe: (w: World) => Ung[];             // engine dò điều kiện tiền đề
  vaiTroCanCo: string[];
  nhipMacDinh: number;
  duongCangThang: (giaiDoan: string) => number;
  sinhNhip: (s: Storyline, w: World) => Beat;
};
```

| Id | Tiền đề engine tự dò |
|---|---|
| `phuc_thu` | Hai entity `yeuGhet < -60`, lệch `noOn`, một bên `ducVong.baoThu` cao |
| `ke_vi` | Người cầm quyền không có người kế + ≥2 ứng viên `quyenLuc` cao |
| `chien_tranh` | Hai phe tranh tài nguyên hoặc lãnh địa, `tinNgo` giữa họ rất thấp |
| `ly_giao` | Một luật có `dienGiai` lệch > 50 giữa hai vùng |
| `am_muu` | NPC `tratTu_phongTung < -40`, `triThuc` cao, gần một `keHo` chưa khai thác |
| `tinh_ai` | `yeuGhet` cao + `thanSo` cao nhưng bị một luật hoặc phe phái cản |
| `kham_pha` | Tồn tại một `gap.laBiAn` và một NPC `ducVong.triThuc` cao ở gần |
| `cuu_the` | Kẻ thù vĩnh cửu sắp trỗi dậy + một tiên tri chưa ứng |
| `suy_tan` | Một thần `domainStrength` giảm liên tục 3 kỷ nguyên |
| `phan_boi` | `tinNgo` cao nhưng `yeuGhet` đang giảm nhanh — khe hở giữa hai trục |

**[BB]** Chú ý `phan_boi`: nó khai thác đúng cái khe hở giữa `tinNgo` và `yeuGhet` đã nói ở 11.2. Đây là bằng chứng thiết kế quan hệ bốn trục có giá trị thật, không phải trang trí.

### 28.4 Máy sinh mạch truyện

Chạy ở bước 11 của tick, ngay trước quét lỗ hổng.

```ts
export function quetMachTruyen(w: World, tick: number): Storyline[] {
  // 1. Mỗi StoryKindDef.tienDe(w) trả về danh sách ứng viên
  // 2. Lọc trùng: không sinh mạch mới nếu đã có mạch cùng loại,
  //    cùng bộ nhân vật chính, đang hoạt động
  // 3. Giới hạn tổng mạch đang chạy = tuning.truyen.machToiDa (mặc định 24)
  // 4. Ưu tiên mạch có nhân vật spotlight cao, nhưng KHÔNG loại bỏ
  //    hoàn toàn mạch ở vùng xa — giữ hạn ngạch tối thiểu (28.6)
}
```

### 28.5 Nhịp truyện

Mỗi tick, `dongHo -= 1`. Chạm 0 → mạch tiến một nhịp:

```
sinhNhip() → Beat {
  moTa, nhanVatLienQuan, bienDoiTrangThai[],
  cangThangDelta, giaiDoanMoi?, nutThatMoi?, phucButMoi?
}
  → áp bienDoiTrangThai vào world (engine)
  → sinh Event
  → Event có thể thành tin đồn tới người chơi (bước 14)
  → dongHo = nhipMoi
```

**[BB]** Nhịp truyện chạy **bằng engine**, không gọi LLM. Chỉ khi mạch được ống kính chiếu tới (Phần 29) thì mới có LLM viết cảnh. Nhờ vậy 24 mạch truyện chạy song song mà chi phí bằng 0.

Đường căng thẳng: `am_i → khoi → phat_trien → cao_trao → ha_man → du_am`. Mạch không được chăm sóc quá lâu ở `phat_trien` sẽ rơi vào `chet_yeu` — và **đó cũng là một kết cục hợp lệ**, được ghi vào biên niên sử. Truyện dở dang là chuyện có thật trong lịch sử.

### 28.6 Hạn ngạch vắng mặt [BB]

Đây là cơ chế cứng chống bệnh lấy người chơi làm tâm.

```ts
export const TiLeVangMat = {
  muc_tieu: 0.40,       // ≥40% nội dung tường thuật mỗi kỷ nguyên
                        // KHÔNG có mặt nhân vật người chơi
  do_tren: 'so_canh',   // đếm theo cảnh, không theo token
  bat_buoc_toi_thieu: 3, // mỗi kỷ nguyên ít nhất 3 cảnh không có người chơi
};
```

Engine đo và đưa vào bảng tự chẩn đoán (Phần 39). Dưới ngưỡng → cảnh báo và ống kính tự động ưu tiên mạch không có người chơi ở kỷ nguyên sau.

---

## PHẦN 29 — ỐNG KÍNH & CHỐNG THIÊN VỊ NGƯỜI CHƠI [BB]

### 29.1 Ống kính

Cột tường thuật ở giữa màn hình **không phải "cuộc chat của bạn"**. Nó là **biên niên sử đang được kể**, và ống kính có thể chĩa vào bất kỳ mạch truyện nào.

```ts
export const LensSchema = z.object({
  mucTieu: z.discriminatedUnion('loai', [
    z.object({ loai: z.literal('mach'),      machId: z.string() }),
    z.object({ loai: z.literal('nhan_vat'),  entityId: z.string() }),
    z.object({ loai: z.literal('vung'),      vungId: z.string() }),
    z.object({ loai: z.literal('nguoi_choi') }),
    z.object({ loai: z.literal('tu_dong') }),   // engine chọn theo căng thẳng
  ]),
  tuDongChuyen: z.boolean().prefault(true),
  giuToiThieuTick: z.number().prefault(3),
}).prefault({});
```

**Chế độ `tu_dong`** là mặc định: engine chọn mạch có `cangThang` cao nhất trong số mạch người chơi biết, có trộn ngẫu nhiên seeded để không đơn điệu. Ở tầng Sáng Thế Thần với nhịp Vĩnh Kiếp, ống kính nhảy liên tục giữa nhiều mạch trong cùng một kỷ nguyên.

**[BB]** Chuyển ống kính **không tốn lượt, không tốn thời gian trong game**. Nó là hành động xem, không phải hành động chơi.

### 29.2 Bảy quy tắc trong prompt Narrator [BB]

Đưa vào tầng lõi bất biến của context, **không** được người dùng xóa:

1. Nhân vật phải có mục tiêu **không liên quan gì đến người chơi**. Phần lớn động cơ trong cảnh phải là của họ.
2. Cảnh được phép **kết thúc mà người chơi không làm gì**. Không đợi.
3. **Không bao giờ hỏi "bạn làm gì?"** Không kết cảnh bằng câu hỏi hướng về người chơi. Kể tiếp, hoặc dừng ở một nhịp tự nhiên.
4. NPC **không** giải thích thế giới cho người chơi nghe. Họ nói với nhau, theo cách người trong cuộc nói với nhau — nghĩa là **bỏ qua** những gì cả hai đều đã biết.
5. Khi ống kính không ở chỗ người chơi, **không nhắc tới người chơi**, kể cả gián tiếp.
6. Nhân vật người chơi có thể là **vai phụ** trong mạch truyện của người khác, và phải được đối xử như vai phụ.
7. Ở tầng Sáng Thế Thần, người chơi **không có mặt trong cảnh**. Cảnh là chuyện xảy ra trong thế giới, được quan sát từ trên xuống.

### 29.3 Người chơi cũng chỉ là một nhân vật

**[BB]** Nhân vật người chơi có `vaiTro` trong `Storyline` giống mọi entity khác — không có trường đặc biệt, không có trọng số ưu ái.

Ngay cả Sáng Thế Thần cũng là một nhân vật: phàm nhân kể chuyện về bạn, và những chuyện đó là bản ghi `laHuyenThoai = true` — tức là **có thể sai**. Một mạch truyện hoàn toàn hợp lệ là: một giáo phái ở vùng xa kể sai về bạn suốt hai trăm năm, và bạn chỉ tình cờ biết khi ống kính chĩa qua đó.

---

## PHẦN 30 — TRÍ NHỚ TỰ SỰ [BB]

> Yêu cầu: trí nhớ đủ tốt để dựng **truyện dài, truyện lớn**.
> Câu trả lời không phải "context lớn hơn". Câu trả lời là **cấu trúc nhớ có hình dạng của truyện**.

### 30.1 Bốn tầng nhớ

| Tầng | Nội dung | Ai giữ |
|---|---|---|
| **Chân Lý** | Vũ trụ luận, luật, thần điện. Không bao giờ bị nén | DB, luôn nạp |
| **Biên Niên** | Cảnh → Chương → Kỷ Nguyên → Đại Kỷ. Nén phân cấp. Sự kiện cổ co lại một dòng nhưng **không biến mất** | DB, nén dần |
| **Ký ức thực thể** | Gắn vào entity, nạp khi entity vào scope | DB, theo đồ thị |
| **Ký ức mạch** | `kyUcMach` — sợi chỉ tự sự riêng của từng mạch truyện | DB, nạp khi ống kính chiếu |

Tầng thứ tư là tầng mới và là tầng làm nên truyện dài. Nó khác ký ức thực thể ở chỗ: nó nhớ **diễn tiến**, không nhớ **trạng thái**.

### 30.2 Sổ Phục Bút [BB]

Song sinh với Sổ Nhân Quả, nhưng cho tự sự. Đây là cơ chế "khẩu súng Chekhov" được thể chế hóa.

```ts
export const ForeshadowSchema = z.object({
  id: z.string(), branchId: z.string(),
  machId: z.string().nullable().prefault(null),
  noiDung: z.string(),                     // thứ đã được gieo
  loai: z.enum(['vat','loi_noi','nhan_vat','dieu_bao','bi_mat','mon_no']),
  tickGieo: z.number(),
  hanTraToiDa: z.number().nullable().prefault(null),
  daTra: z.boolean().prefault(false),
  cachTra: z.string().prefault(''),
  doNang: z.number().min(0).max(100).prefault(50),
}).prefault({});
```

**[BB] Cơ chế:**
- Updater được yêu cầu trả thêm khối `<Foreshadow>` khi Narrator gieo thứ gì đó có vẻ quan trọng.
- Engine kiểm mỗi tick. Phục bút quá hạn chưa trả → đẩy lên đầu context với ghi chú **"chưa trả"**, và cộng ưu tiên cho ống kính chĩa vào mạch đó.
- Phục bút không bao giờ tự biến mất. Nó hoặc được trả, hoặc trở thành `gap` loại `nhan_qua` — tức là **một bí ẩn của thế giới**.

Đây là cách duy nhất để một câu chuyện dài năm trăm lượt không quên thứ đã gieo ở lượt thứ mười. **AI không nhớ; engine ép nó nhớ.**

### 30.3 Nén có hình dạng truyện

Nén biên niên sử thông thường mất mạch tự sự. Nén theo mạch thì không:

```
Cuối mỗi kỷ nguyên, với MỖI mạch truyện:
  kyUcMach = nén(toàn bộ nhịp của mạch đó)
             giữ nguyên: nhân vật chính, nút thắt chưa gỡ,
                          phục bút chưa trả, lời hứa, mối thù
             cho phép mất: chi tiết cảnh, hội thoại phụ, mô tả
```

**[BB]** Danh sách "giữ nguyên" là bất khả xâm phạm. Nén được phép làm mất văn, **không được phép làm mất nhân quả tự sự**.

### 30.4 Ba câu về trí nhớ

1. Context lớn không tạo ra truyện dài. **Cấu trúc nhớ có hình dạng của truyện** mới tạo ra.
2. Nén được phép làm mất văn, không được phép làm mất nút thắt và phục bút.
3. Thứ gì đã gieo mà không trả thì không biến mất — nó trở thành bí ẩn, và bí ẩn là nội dung.

---
---

# KHỐI H — AI & NGỮ CẢNH

## PHẦN 31 — CẤU HÌNH AI & TỰ DÒ [BB]

### 31.1 Hai pipeline độc lập hoàn toàn

| Pipeline | Nhiệm vụ | Đặc tính cần |
|---|---|---|
| **Narrator** | Viết cảnh, tường thuật kỷ nguyên, sinh lorebook, đặt tên nghiệm | Văn hay, temperature cao |
| **Updater** | Đọc cảnh, xuất patch trạng thái + thu hoạch danh từ + phục bút | Chính xác tuyệt đối, temperature ~0 |

**Lý do tách:** model viết văn hay thường xuất JSON ẩu; model tuân thủ format tốt thường viết văn khô. Người chơi phải được chọn riêng — **khác proxy, khác mật khẩu, khác model, khác tham số.**

```ts
export const AiEndpointSchema = z.object({
  label: z.string().prefault(''),
  proxyUrl: z.string().prefault(''),
  proxyPassword: z.string().prefault(''),
  dialect: z.enum(['tu_do','openai','gemini','anthropic']).prefault('tu_do'),
  modelId: z.string().prefault(''),
  profileId: z.string().prefault(''),
  availableModels: z.array(ModelInfoSchema).prefault([]),
  lastScanAt: z.number().nullable().prefault(null),
  probe: ProbeResultSchema.prefault({}),
  params: GenParamsSchema.prefault({}),
}).prefault({});

export const AiConfigSchema = z.object({
  narrator: AiEndpointSchema.prefault({}),
  updater:  AiEndpointSchema.prefault({}),
}).prefault({});
```

### 31.2 Model Profile là dữ liệu [MR]

**[BB]** Không hardcode tham số của bất kỳ model nào trong code. Mọi thứ nằm trong `R.profile`.

```ts
export const ModelProfileSchema = z.object({
  id: z.string(),
  ten: z.string(),
  khop: z.object({
    chua: z.array(z.string()).prefault([]),
    regex: z.string().prefault(''),
  }).prefault({}),
  gioiHan: z.object({
    contextMax: z.number().prefault(128000),
    outputMax: z.number().prefault(8192),
    outputMacDinhCuaApi: z.number().prefault(8192),
    temperatureMax: z.number().prefault(2),
    topKMax: z.number().prefault(64),
    thinkingBudgetMax: z.number().prefault(0),
  }).prefault({}),
  hoTro: z.object({
    thinkingLevel: z.boolean().prefault(false),
    thinkingBudget: z.boolean().prefault(false),
    mediaResolution: z.boolean().prefault(false),
    structuredOutput: z.boolean().prefault(false),
    promptCache: z.boolean().prefault(false),
    seed: z.boolean().prefault(false),
    topA: z.boolean().prefault(false),
    minP: z.boolean().prefault(false),
    repetitionPenalty: z.boolean().prefault(false),
    reasoningEffort: z.boolean().prefault(false),
    verbosity: z.boolean().prefault(false),
    continuePrefill: z.boolean().prefault(false),
    stopSequences: z.number().prefault(4),
  }).prefault({}),
  tyLeToken: z.number().prefault(3.2),      // ký tự tiếng Việt / token — HIỆU CHỈNH ĐƯỢC
  nguon: z.enum(['dung_san','tu_do','nguoi_dung']).prefault('dung_san'),
}).prefault({});
```

**Profile dựng sẵn — Gemini 3.1 Pro:**

```json
{
  "id": "gemini-3.1-pro",
  "ten": "Gemini 3.1 Pro",
  "khop": { "chua": ["gemini-3.1-pro", "gemini-3-1-pro"] },
  "gioiHan": {
    "contextMax": 1048576,
    "outputMax": 65536,
    "outputMacDinhCuaApi": 8192,
    "temperatureMax": 2,
    "topKMax": 64,
    "thinkingBudgetMax": 24576
  },
  "hoTro": {
    "thinkingLevel": true, "thinkingBudget": true, "mediaResolution": true,
    "structuredOutput": true, "promptCache": true, "seed": true, "stopSequences": 5
  },
  "tyLeToken": 2.6
}
```

**[BB]** Cảnh báo bắt buộc hiện trong UI khi `outputMax !== outputMacDinhCuaApi`: *"API mặc định chỉ trả 8.192 token. Phải đặt tay mới mở khóa 65.536."* Đây là lỗi rất dễ bỏ sót và sẽ làm hỏng tính năng sinh cả kỷ nguyên trong một call.

### 31.3 Tham số sinh

```ts
export const GenParamsSchema = z.object({
  temperature:      z.number().min(0).max(2).prefault(1.0),
  topP:             z.number().min(0).max(1).prefault(0.95),
  topK:             z.number().min(0).prefault(40), // trần hiệu lực lấy từ ModelProfile/Probe
  topA:             z.number().min(0).max(1).prefault(0),
  minP:             z.number().min(0).max(1).prefault(0),
  repetitionPenalty:z.number().min(0).prefault(1),
  maxOutputTokens:  z.number().min(1).prefault(8192),
  candidateCount:   z.number().min(1).max(8).prefault(1),
  presencePenalty:  z.number().min(-2).max(2).prefault(0),
  frequencyPenalty: z.number().min(-2).max(2).prefault(0),
  stopSequences:    z.array(z.string()).prefault([]),
  thinkingLevel:    z.enum(['low','medium','high']).prefault('medium'),
  thinkingBudget:   z.number().min(0).prefault(0),     // 0 = auto
  reasoningEffort:  z.enum(['low','medium','high','max']).optional(),
  verbosity:        z.enum(['low','medium','high']).optional(),
  continuePrefill:  z.boolean().prefault(false),
  mediaResolution:  z.enum(['low','medium','high']).prefault('medium'),
  seed:             z.number().nullable().prefault(null),
  contextLimit:     z.number().min(1024).prefault(128000),
}).prefault({});
```

**[BB]** Giá trị `max` của mọi slider lấy từ Profile đang chọn, **không** hardcode trong component. Đổi model → slider tự đổi trần.

Preset mặc định:
- **Narrator**: `temperature 1.15`, `topP 0.96`, `maxOutputTokens` = `outputMax` của profile, `thinkingLevel 'high'`
- **Updater**: `temperature 0.05`, `topP 0.7`, `maxOutputTokens 16384`, `thinkingLevel 'low'`

### 31.4 Tự dò dialect

```ts
export async function doDialect(ep: AiEndpoint): Promise<Dialect> {
  // GET {url}/models với Authorization: Bearer {password}
  //   { data: [{id, ...}] }        → openai
  //   { models: [{name, ...}] }    → gemini
  //   404 → thử {url}/v1/models, rồi {url}/v1/messages (HEAD) → anthropic
  // Chuẩn hóa mọi dạng về ModelInfo[]
}
```

### 31.5 Sáu phép thăm dò năng lực [BB]

Chạy sau khi chọn model, một lần, kết quả cache vào `ep.probe`.

| # | Thăm dò | Cách | Thu được |
|---|---|---|---|
| 1 | **Dialect** | `GET /models`, xem hình dạng JSON | `dialect`, danh sách model chuẩn hóa |
| 2 | **Xác thực** | Completion 1 token | Proxy sống, mật khẩu đúng, độ trễ nền |
| 3 | **Suy luận** | Gửi `thinking_level: 'low'` | 400 → không hỗ trợ, ẩn slider |
| 4 | **Output có cấu trúc** | Gửi `response_format` json schema | Có → dùng cho Updater, giảm lỗi parse rất nhiều |
| 5 | **Tỉ lệ token tiếng Việt** | Gửi một đoạn tiếng Việt chuẩn 2.000 ký tự, đọc `usage.prompt_tokens` | **`tyLeToken` thật** — hiệu chỉnh toàn bộ ngân sách |
| 6 | **Prompt cache** | Gửi cùng một prefix hai lần, so `cached_tokens` và độ trễ | Có cache → assembler mới đáng công xếp tầng |

**[BB]** Phép thăm dò số 5 là quan trọng nhất và hay bị bỏ sót. **Tiếng Việt có dấu tokenize tệ hơn tiếng Anh khoảng 2–3 lần** tùy tokenizer. Nếu ước lượng token bằng công thức tiếng Anh, toàn bộ ngân sách ở Phần 34 sẽ sai hàng chục phần trăm và prompt sẽ bị cắt cụt bất ngờ.

```ts
export const ProbeResultSchema = z.object({
  tickChay: z.number().nullable().prefault(null),
  song: z.boolean().prefault(false),
  doTreNen: z.number().prefault(0),
  hoTroThucTe: ModelProfileSchema.shape.hoTro.prefault({}),
  tyLeTokenDo: z.number().nullable().prefault(null),
  coPromptCache: z.boolean().prefault(false),
  outputMaxThucTe: z.number().nullable().prefault(null),
  loi: z.array(z.string()).prefault([]),
}).prefault({});
```

**[BB]** `hoTroThucTe` **ghi đè** `profile.hoTro`. Profile là phỏng đoán; thăm dò là sự thật. Khi hai cái lệch, ghi cảnh báo vào bảng tự chẩn đoán chứ không im lặng.

### 31.6 UI Cài Đặt

Hai cột kính đối xứng, tiêu đề Cormorant: **"Tường Thuật"** và **"Cập Nhật Biến"**. Mỗi cột giống hệt nhau:

```
URL Proxy            [____________________]
Mật khẩu Proxy       [••••••••••••]  [hiện]
                     [ Quét model ]  [ Thăm dò năng lực ]
Model                [ dropdown ▾ ]  gemini-3.1-pro · 1.0M / 65.536
Hồ sơ                [ tự động ▾ ]   [ sửa hồ sơ ]
─────────────────────────────────────────
Nhiệt độ             [——●———————] 1.15      max 2.00
Top P                [————————●—] 0.96
Top K                [———●——————] 40        max 64
Token xuất tối đa    [—————————●] 65536     ⚠ API mặc định 8192
Mức suy luận         ( ) thấp  ( ) vừa  (●) cao
Ngân sách suy luận   [————●—————] auto      max 24576
Hình phạt lặp        [————●—————] 0.00
Hình phạt hiện diện  [————●—————] 0.00
Seed                 [______]                (trống = ngẫu nhiên)
Chuỗi dừng           [+ thêm]                tối đa 5
─────────────────────────────────────────
Tỉ lệ token đo được  2.61 ký tự/token        [ đo lại ]
Prompt cache         có · tiết kiệm ~62%
```

Cuối trang: **"Sao cấu hình sang cột kia"** (hai chiều), **"Khôi phục mặc định"**, tổng ước tính chi phí mỗi lượt.

**[BB]** Mọi slider hiển thị giá trị bằng `--chu-so`. Không dùng input number trần. Tham số model không hỗ trợ thì **ẩn hẳn**, không disable — disable làm người dùng tưởng mình cấu hình sai.

### 31.7 Pipeline và format patch

```
[Hành động / nhịp truyện]
  → assembler.lap('narrate', view, lens)
  → Narrator (stream ra UI)
  → văn bản cảnh
  → assembler.lap('update', { scene })
  → Updater (không stream)
  → BA khối XML
  → parser → Zod → áp → Dexie
```

```xml
<UpdateVariable>
{
  "e.than_lua.soul.tamTrang": [
    { "loai": "phan_no", "doiTuongId": "e.ankhtu", "cuongDo": 78, "nguonGocKyUcId": "ky_0912" }
  ],
  "e.o_ue.conceptual.trongSo":      { "_op": "add", "_v": 45 },
  "e.o_ue.conceptual.nguon.lapLai": { "_op": "add", "_v": 45 },
  "storyline.mach_0031.cangThang":  { "_op": "add", "_v": 12 },
  "karma": { "_op": "push", "_v": { "loai": "loi_nguyen", "noiDung": "...", "dieuKienKichHoat": "e.?.flags.dauMau === true" } }
}
</UpdateVariable>

<HarvestTerms>
[ { "text": "Trảo Bạch", "loai": "sinh_vat", "boiCanh": "thứ sống trong nước đen" } ]
</HarvestTerms>

<Foreshadow>
[ { "noiDung": "chiếc vòng đồng Ankhtu giấu dưới bệ thờ", "loai": "vat", "doNang": 70, "hanTraToiDa": 400 } ]
</Foreshadow>
```

**[BB] Quy tắc parser:**
- Chỉ nhận nội dung **giữa** cặp thẻ. Vứt mọi thứ ngoài.
- Patch nào Zod trượt → **bỏ patch đó**, giữ các patch còn lại, ghi log. **Không rollback cả lượt.**
- Field bắt đầu bằng `_` (trừ `_op`, `_v`) → **từ chối**, đó là field engine-only.
- **Không dùng `lodash.pickBy` để lọc.** Nó nuốt `0`, `''`, `false`.
- Thiếu thẻ → retry tối đa 2 lần kèm thông điệp sửa format. Nếu profile hỗ trợ `structuredOutput` thì dùng nó thay vì retry.

---

## PHẦN 32 — TẦNG EJS [BB]

### 32.1 Nguyên tắc

**Mọi chuỗi được nhét vào context đều là EJS template.** Không ngoại lệ. Đây là cơ chế chống nổ token của toàn app.

Áp dụng cho: nội dung lorebook entry, `lawful.chiThiAi`, hồ sơ thần, hồ sơ NPC, `kyUcMach`, tóm tắt kỷ nguyên, header cảnh, mảnh system prompt.

### 32.2 Sandbox

```ts
export type EjsContext = {
  view: Readonly<WorldView>;          // KHÔNG phải World — chống rò rỉ
  lens: Readonly<Lens>;
  mach: readonly Storyline[];
  scene: Readonly<Scene>;

  budget: { total: number; used: number; remaining: number };

  t: (s: string) => number;                          // đếm token, dùng tyLeToken đã hiệu chỉnh
  top: <T>(arr: T[], n: number, by: keyof T) => T[];
  brief: (s: string, maxTok: number) => string;
  since: (tick: number) => string;                   // "ba trăm năm trước"
  when: (cond: boolean, s: string) => string;
  fit: (candidates: string[]) => string;             // chọn bản dài nhất còn vừa
};
```

**[BB]** Sandbox **không** expose `window`, `fetch`, `eval`, `require`, `process`, hay bất kỳ hàm ghi state nào. EJS chỉ đọc `view` và trả chuỗi. Truyền `World` thô vào EJS là **rò rỉ thông tin giữa ba tầng** — vi phạm nguyên tắc 7.

### 32.3 Mẫu

```ejs
<%# Hồ sơ thần — co giãn theo ngân sách %>
<%= d.ten %><% if (d.domain?.length) { %> — <%= d.domain.join(', ') %><% } %>

<% if (budget.remaining > 1200) { %>
Bản tính: <%= moTaBanTinh(d.banTinh) %>
Ba ký ức nặng nhất:
<% top(d.kyUc, 3, 'dienTich').forEach(k => { %>
- <%= brief(k.tomTat, 40) %> (<%= since(k.tick) %>)
<% }) %>
<% } else if (budget.remaining > 400) { %>
Bản tính: <%= tomTatBanTinh(d.banTinh) %>
<% } %>

<% if (d.doLechDiHoa > 40) { %>
Tín đồ tin về vị thần này: <%= moTaBanTinh(d.banTinhTinDoTin) %>
<% } %>
```

### 32.4 Render theo ngân sách

```ts
export function renderTheoNganSach(
  items: { template: string; uuTien: number; batBuoc: boolean }[],
  ctx: EjsContext,
): string
```

1. Render mọi item `batBuoc` trước, trừ vào budget.
2. Sắp phần còn lại theo `uuTien` giảm dần.
3. Render từng cái; vượt `budget.remaining` → **bỏ hẳn**, không cắt.
4. Cập nhật `budget.remaining` sau mỗi item để EJS ở item sau tự co lại.

**[BB]** Không bao giờ cắt cụt một template đã render. Hoặc lấy trọn, hoặc bỏ hẳn. Template bị cắt giữa chừng làm hỏng cú pháp và làm AI hiểu sai.

---

## PHẦN 33 — ASSEMBLER [BB]

> Sửa mâu thuẫn bản trước: ba tài liệu cũ có ba cơ chế chọn context khác nhau. Đây là cơ chế **duy nhất**.

### 33.1 Sáu tầng, xếp theo thứ tự prompt

Thứ tự quyết định tiền. Ổn định lên **đầu** để được prefix cache; biến động xuống **cuối**.

| # | Tầng | Token | Cache | Nội dung |
|---|---|---|---|---|
| 1 | Lõi bất biến | 30–60k | Có | System, bảy quy tắc Narrator (29.2), luật hiệu lực, vũ trụ luận |
| 2 | Mythos pack đang bật | 20–50k | Có | Lorebook lớp `loi` của mọi thần hệ bật |
| 3 | Biên niên sử kỷ nguyên | 15–40k | Theo kỷ nguyên | Tóm tắt phân cấp |
| — | *ranh giới cache* | | | |
| 4 | **Mạch truyện đang chiếu** | 8–20k | Không | `kyUcMach`, nút thắt chưa gỡ, vai trò nhân vật |
| 5 | Hồ sơ T2 + phe phái | 10–25k | Không | Đổi mỗi tick |
| 6 | Cảnh + cầu nguyện + **Sổ Nhân Quả** + **Sổ Phục Bút** | 5–20k | Không | Đổi mỗi lượt |

**[BB]** Sổ Nhân Quả và Sổ Phục Bút phải nằm **cuối cùng**. Dù có 1M context, chú ý của model ở giữa prompt suy giảm rõ rệt. Lời hứa đang treo và phục bút chưa trả phải nằm chỗ model nhìn rõ nhất.

### 33.2 Chọn nội dung tầng 4–6

```
1. TIÊU ĐIỂM = mục tiêu ống kính + nhân vật trong mạch đang chiếu
                + entity người chơi vừa nhắc
2. moRong(tiêu điểm, { soHop: 2, view })      ← BẮT BUỘC truyền view
3. Cộng điểm: điện tích ký ức, spotlight, số lần nhắc gần đây,
              trọng số vai trò trong mạch
4. Quét keyword lorebook như NGUỒN SONG SONG, hợp nhất điểm
5. Top-K theo ngân sách còn lại, render EJS
```

Kết quả: kể một cảnh ở đền Kemet thì tự nhiên có mặt luật đang chi phối vùng đó, thần bản địa, thần khí từng đi qua, lời nguyền chưa kích hoạt, mối thù của tế tư trưởng, và nút thắt chưa gỡ của mạch truyện đang chạy ở đó — **mà không ai phải viết keyword nào**.

### 33.3 Chống rò rỉ

**[BB]** Assembler nhận `WorldView`, không nhận `World`. `moRong()` bắt buộc nhận `view`. Bất kỳ đường nào dẫn `World` thô vào context là bug nghiêm trọng nhất trong dự án (18.3).

---

## PHẦN 34 — NGÂN SÁCH & TỰ HIỆU CHỈNH

### 34.1 Bảng ngân sách theo loại call

| Loại call | Input | Output | Nhịp |
|---|---|---|---|
| Kể cảnh (T3) | 100–150k | 2–6k | Mỗi lượt |
| Tick mô phỏng (T2 gộp) | 25–50k | 8–15k | 1/tick |
| **Sinh kỷ nguyên** | 80–150k | **50–65k** | 1/kỷ nguyên |
| Nén kỷ nguyên | 300k–1M | 20–40k | 1/kỷ nguyên, chạy nền |
| Sinh lorebook | 150–300k | 40–65k | 1/kỷ nguyên |
| Giải lỗ hổng (gộp 8) | 50–90k | 10–25k | ≤1/tick |
| Giải lỗ hổng cuối kỷ nguyên | 200–400k | 40–65k | Gộp với sinh kỷ nguyên |
| Hình thức hóa luật thô | 40–80k | 3–8k | Khi ban luật |
| Thanh tra mạch lạc | 60–120k | 8–20k | 1/kỷ nguyên |
| Phán quyết luật / kẽ hở | 40–60k | 2–5k | Khi cần |
| Ứng biến hành động | 30–60k | 2–6k | Khi parse trượt |

**[BB]** Thu hoạch danh từ và phục bút **không tốn call riêng** — đi kèm output của Updater.

**[BB]** Đồ thị liên kết, quét lỗ hổng, nhịp mạch truyện, thanh tra phát hiện, mở rộng đồ thị, utility AI: **toàn bộ là engine thuần, không LLM**.

### 34.2 Ước lượng token tiếng Việt

```ts
export function uocLuong(s: string, profile: ModelProfile, probe: ProbeResult): number {
  const tyLe = probe.tyLeTokenDo ?? profile.tyLeToken;
  return Math.ceil(demKyTu(s) / tyLe);
}
```

**[BB]** Không dùng công thức `length / 4` của tiếng Anh. Tiếng Việt có dấu tokenize tệ hơn nhiều — dùng nhầm sẽ sai ngân sách hàng chục phần trăm.

### 34.3 Tự hiệu chỉnh [BB]

```
Sau mỗi call, so uocLuong với usage.prompt_tokens thật:
  saiSo = |uocLuong - thucTe| / thucTe
  ghi vào bảng calib

  saiSo > 0.12 trong 5 call liên tiếp
    → điều chỉnh tyLeToken theo trung bình động 20 mẫu gần nhất
    → ghi thông báo vào bảng tự chẩn đoán

  finish_reason === 'length'  (bị cắt cụt)
    → giảm ngân sách INPUT của loại call đó 15%
    → ghi cảnh báo, KHÔNG im lặng
```

### 34.4 Chia sẻ cache giữa nhánh

Tầng 1–3 chỉ phụ thuộc phần trước điểm tách → mọi nhánh cùng gốc chia sẻ prefix cache. Xem ba nhánh song song gần như miễn phí nếu assembler xếp đúng thứ tự.

**Kiểm tra:** nếu chi phí nhánh thứ hai > 60% nhánh thứ nhất, cache đang hỏng. Bảng tự chẩn đoán phải bắt được điều này.

---
---

# KHỐI I — LOREBOOK

## PHẦN 35 — LOREBOOK ĐA THẦN HỆ & LỰC HẤP DẪN

### 35.1 Yêu cầu

Người chơi **tự tạo và nhập lorebook**. App hỗ trợ **nhiều lorebook cho nhiều thần hệ** cùng lúc:

- Bật **một** → thế giới đi theo hướng thần thoại đó.
- Bật **nhiều** → các thần hệ va chạm, cần `conflictPolicy`.
- Bật **không cái nào** → thế giới tự diễn biến hoàn toàn, mọi thần và luật mọc từ Khái Niệm.

Và điều quan trọng nhất: **khi bật, thế giới dần hình thành theo thông tin trong lorebook — nhưng vì có người chơi, nó sẽ có lúc khác đi.**

### 35.2 Schema

```ts
export const LorebookSchema = z.object({
  id: z.string(),
  ten: z.string(),
  thanHe: z.string().prefault(''),
  moTa: z.string().prefault(''),
  bat: z.boolean().prefault(false),
  uuTien: z.number().prefault(100),
  lucHapDan: z.number().min(0).max(100).prefault(60),   // xem 35.4
  version: z.string().prefault('1.0'),
  nguon: z.enum(['nguoi_dung','tu_sinh','di_san']).prefault('nguoi_dung'),
  entries: z.array(LorebookEntrySchema).prefault([]),
}).prefault({});

export const LorebookEntrySchema = z.object({
  id: z.string(),
  ten: z.string(),
  keys: z.array(z.string()).prefault([]),
  secondaryKeys: z.array(z.string()).prefault([]),
  logic: z.enum(['and_any','and_all','not_any','not_all']).prefault('and_any'),
  noiDung: z.string().prefault(''),                     // CHỨA EJS
  lop: z.enum(['loi','sau']).prefault('sau'),           // 'loi' = luôn bật
  order: z.number(),
  doSau: z.number().prefault(4),
  xacSuat: z.number().min(0).max(100).prefault(100),
  dinhKem: z.boolean().prefault(false),
  deQuy: z.boolean().prefault(false),
  uocLuongToken: z.number().prefault(0),
  kyVong: z.array(z.string()).prefault([]),             // id LoreExpectation trích ra
}).prefault({});
```

### 35.3 Nhập lorebook [BB]

Hỗ trợ ba định dạng, **tự dò**:

| Định dạng | Nhận biết | Xử lý |
|---|---|---|
| SillyTavern V2 | `{ entries: { "0": {...} } }` object có khóa số | Map `key`→`keys`, `keysecondary`→`secondaryKeys`, `insertion_order`→`order`, `constant`→`lop:'loi'` |
| SillyTavern V3 | `{ spec: 'lorebook_v3' }` hoặc mảng `entries` | Map trực tiếp |
| Thiên Diễn | `{ _format: 'thien_dien_lore' }` | Nạp thẳng |

**Validator khi nhập [BB]:**
- `order` liên tục, không trùng → hỏi người dùng có tự đánh số lại không
- Macro `{{user}}`; phát hiện `<user>` → **báo lỗi**, đề xuất sửa hàng loạt
- EJS parse được → lỗi thì chỉ rõ entry và dòng
- Entry trùng chủ đề → cảnh báo, không chặn
- Đếm token thật từng entry bằng `tyLeToken` đã hiệu chỉnh

### 35.4 Lorebook như lực hấp dẫn [BB]

> Đây là cơ chế trả lời trực tiếp yêu cầu: *"khi bật thì thế giới sẽ dần hình thành theo thông tin trong lorebook."*
> Lorebook không chỉ là ngữ cảnh nhét vào prompt. Nó là **lực kéo** định hình thế giới khi thế giới lớn lên.

Khi bật một lorebook, engine chạy một lượt **trích kỳ vọng**:

```ts
export const LoreExpectationSchema = z.object({
  id: z.string(), branchId: z.string(),
  lorebookId: z.string(), entryId: z.string(),

  loai: z.enum(['ton_tai','quan_he','su_kien','quy_luat','ket_cuc','tinh_cach']),
  moTa: z.string(),
  dieuKienThoaMan: z.string(),              // biểu thức engine eval được

  trangThai: z.enum(['cho','da_thoa','da_lech','bat_kha']).prefault('cho'),
  doUuTien: z.number().min(0).max(100).prefault(50),

  lyDoLech: z.string().prefault(''),
  tickLech: z.number().nullable().prefault(null),
}).prefault({});
```

Ví dụ trích từ một lorebook Ai Cập:

| Loại | Kỳ vọng | Điều kiện thỏa |
|---|---|---|
| `ton_tai` | Có một thần mặt trời cai trị thần điện | tồn tại entity kind=deity, domain chứa 'mat_troi', domainStrength > 70 |
| `quan_he` | Thần mặt trời có một kẻ thù vĩnh cửu hình rắn | tồn tại link `doi_nghich` giữa thần đó và một entity có aspect `adversarial` |
| `quy_luat` | Người chết được cân tim để phán xét | tồn tại luật có theTag chứa 'phan_xet_sau_khi_chet' |
| `su_kien` | Mỗi đêm kẻ thù bị đẩy lui rồi sống lại | adversarial.nhip = 'hang_dem' |

**Cách nó vận hành [BB]:**

1. Kỳ vọng `cho` được đẩy vào bảng `gaps` với `doUuTien` nhân theo `lucHapDan` của lorebook.
2. Bộ giải ràng buộc (15.2) ưu tiên lấp chúng — nhưng **vẫn phải tuân mọi ràng buộc khác đang đúng**.
3. Kỳ vọng **không phải kịch bản**. Nó là **điểm hút**. Thế giới hướng về đó, không bị ép tới đó.
4. `lucHapDan` là thanh trượt người chơi chỉnh: `0` = lorebook chỉ làm ngữ cảnh, `100` = thế giới cố hết sức trở thành thần thoại đó.

### 35.5 Dị Bản — chỗ có người chơi thì nó khác đi [BB]

> *"nhưng do có user sẽ có khi nó khác"* — đây là phần mình muốn bạn chú ý nhất.

Khi hành động của người chơi làm một kỳ vọng **không còn khả thi**, engine **không** ép nó xảy ra và **không** im lặng bỏ qua. Nó ghi lại thành **Dị Bản**:

```
Kỳ vọng: "Thần mặt trời cai trị thần điện"
Thực tế: người chơi đã THU thần mặt trời ở kỷ nguyên 3
  → trangThai = 'bat_kha'
  → lyDoLech = "Ra bị Sáng Thế Thần thu hồi năm 1180. Vị trí bỏ trống 400 năm."
  → engine sinh gap: ai lấp chỗ trống đó?
  → bộ giải ràng buộc đưa ra một thần khác — có thể là thần mặt trăng
     leo lên, hoặc một khái niệm mới kết tinh
  → THẾ GIỚI CỦA BẠN GIỜ CÓ MỘT THẦN ĐIỆN DO MẶT TRĂNG ĐỨNG ĐẦU
```

**[BB]** Mỗi Dị Bản phải:
1. Ghi rõ **kỳ vọng gốc**, **thực tế**, và **nguyên nhân lệch** (truy được về hành động cụ thể của ai, tick nào).
2. Sinh một `gap` để thế giới tự lấp chỗ trống theo hướng mới.
3. Được ghi vào biên niên sử bằng **giọng kể chuyện**.
4. Hiện trong **Bản Đồ Dị Biệt**.

### 35.6 Bản Đồ Dị Biệt

Một màn hình riêng, và là một trong những thứ đáng tự hào nhất của app.

```
THẦN THOẠI AI CẬP          THẾ GIỚI CỦA BẠN
───────────────────────────────────────────────
Ra cai trị thần điện    →   Khonsu cai trị (Ra bị thu, năm 1180)   [đã lệch]
Apep bị đẩy lui mỗi đêm →   Apep bị đẩy lui mỗi đêm                [đã thỏa]
Cân tim phán xét        →   Cân tim phán xét                        [đã thỏa]
Osiris bị Set giết      →   Osiris chưa từng sinh ra                [bất khả]
Isis hồi sinh Osiris    →   (phụ thuộc mục trên)                    [bất khả]
...
                            Đã thỏa 23 · Đang chờ 11 · Đã lệch 7 · Bất khả 4
```

Click một dòng lệch → hiện chuỗi nhân quả đầy đủ: hành động nào của ai, tick nào, kéo theo gì.

**[BB]** Đây không phải bảng lỗi. Nó là **hồ sơ về việc thế giới của người chơi đã trở thành cái gì**. Trình bày bằng giọng trung tính, không dùng màu đỏ cảnh báo cho cột "đã lệch" — dùng `--van` (khái niệm, chưa định hình) chứ không dùng `--hoi`.

### 35.7 Xung đột khi bật nhiều thần hệ

```ts
conflictPolicy: z.enum([
  'dung_hop',    // Syncretic — thần tương đương hợp nhất (Amun-Ra, Zeus-Jupiter)
  'song_song',   // Parallel  — mỗi thần hệ một Cõi riêng, ít giao thoa
  'tranh_doat',  // Contested — các thần hệ chiến tranh giành tín đồ và domain
]).prefault('song_song')
```

**[BB]** Với `dung_hop`, engine chạy `matchDomains()` tìm cặp thần cùng domain giữa hai thần hệ và tạo tiền đề dung hợp. **Không tự động xóa thần nào** — dung hợp phải là một sự kiện trong truyện, không phải một thao tác dữ liệu.

Với `tranh_doat`, engine tự sinh mạch truyện loại `chien_tranh` giữa hai thần hệ (28.3).

### 35.8 Lorebook tự sinh & di sản

**[BB]** Cuối mỗi kỷ nguyên, gọi Narrator một lần với `maxOutputTokens` tối đa để nén biên niên sử kỷ nguyên đó thành một Lorebook mới, keyword tự trích, `nguon = 'tu_sinh'`, tự động bật.

Chơi đủ lâu, người chơi có một hệ thần thoại nguyên bản do chính thế giới mình sinh ra. Kết thúc một vòng, save cũ xuất ra thành lorebook `nguon = 'di_san'` cho vòng mới — **bắt buộc đi qua `bopMeo()`** (27.2).

### 35.9 Trình soạn Lorebook

Ba cột kính: danh sách entry (kéo thả đổi `order`) · soạn thảo (highlight cú pháp EJS) · xem trước (render EJS với world state hiện tại + đếm token thật).

Thêm tab thứ tư: **Kỳ Vọng** — hiện các `LoreExpectation` engine đã trích từ lorebook này, cho phép người dùng sửa, thêm, xóa, và chỉnh `doUuTien` từng cái.

---
---

# KHỐI J — GIAO DIỆN

## PHẦN 36 — HỆ THỐNG THIẾT KẾ [BB TOÀN BỘ]

### 36.1 Bốn luật cấm

1. **CẤM TUYỆT ĐỐI EMOJI.** Không ở bất kỳ đâu: UI, placeholder, toast, log, dữ liệu mẫu, prompt hệ thống. Emoji biến giao diện thành hoạt hình và giết cảm giác cao cấp. Cần ký hiệu → vẽ SVG.
2. **MỌI HÌNH ẢNH, ICON, CHI TIẾT ĐỒ HỌA LÀ SVG.** Không PNG, không icon font, không thư viện icon. Vẽ tay, inline, `currentColor`.
3. **KÍNH MỜ.** Nền bán trong suốt, `backdrop-filter: blur()`, viền sáng mảnh, bố cục poster cao cấp, gradient chuyển tinh tế.
4. **MÀU ÍT BÃO HÒA, TƯƠNG PHẢN THẤP.** Sang trọng, nhẹ nhàng, hiện đại. Không neon, không màu nguyên chất, không tương phản gắt.

### 36.2 `tokens.css` — nguồn chân lý duy nhất về màu

```css
:root {
  /* Nền — mực sâu, không bao giờ đen tuyền */
  --muc:        #0A0C11;
  --thach:      #141821;
  --suong:      #1E2430;

  /* Chữ — không bao giờ trắng tinh */
  --sang:       #DADEE7;
  --tro:        #878FA0;
  --mo:         #5A6272;

  /* Ba accent, bão hòa < 25% */
  --dong:       #9B8A6B;   /* đồng cổ — thần quyền, hành động chính */
  --ngoc:       #6F8E85;   /* ngọc mờ — luật, trật tự, xác nhận */
  --van:        #7E7593;   /* tử vân — khái niệm, tiềm năng, chưa định hình */

  /* Trạng thái */
  --hoi:        #8C6F6F;   /* nguy hiểm, mâu thuẫn, sẹo */
  --lam:        #6B7E96;   /* thông tin, đang xử lý */

  /* Kính */
  --kinh-nen:   rgba(180, 195, 225, 0.045);
  --kinh-nen-2: rgba(180, 195, 225, 0.075);
  --kinh-vien:  rgba(190, 205, 235, 0.10);
  --kinh-sang:  rgba(220, 230, 250, 0.16);
  --kinh-blur:  blur(22px) saturate(115%);

  /* Gradient nền — delta màu cực nhỏ */
  --nen-vu-tru:
    radial-gradient(1200px 800px at 18% 8%,  rgba(126,117,147,0.14), transparent 62%),
    radial-gradient(1000px 700px at 85% 92%, rgba(111,142,133,0.10), transparent 58%),
    radial-gradient(900px 600px at 55% 45%,  rgba(155,138,107,0.06), transparent 60%),
    linear-gradient(168deg, #0A0C11 0%, #10131B 55%, #0C0E14 100%);

  --r-sm: 8px;  --r-md: 14px;  --r-lg: 20px;  --r-xl: 28px;
  --khoang: 8px;
}
```

**[BB]** Tương phản giữa `--sang` và `--muc` cố ý giữ quanh **9:1**, không đẩy lên 21:1. Không dùng `#FFFFFF` hay `#000000` ở bất cứ đâu. Không hardcode hex ngoài file này.

### 36.3 Chữ

Cả ba font **phải có bộ dấu tiếng Việt đầy đủ**. Ràng buộc cứng, không phải sở thích — rất nhiều font serif sang trọng vỡ chữ ở "ữ", "ằ", "ợ".

| Vai trò | Font | Dùng cho |
|---|---|---|
| Hiển thị | **Cormorant Garamond** 300/400 + italic | Tên thế giới, tên thần, tên luật, tiêu đề, đoạn tường thuật mở đầu |
| Thân | **Be Vietnam Pro** 300/400/500 | Toàn bộ UI, nhãn, nút, mô tả, hội thoại |
| Số liệu | **JetBrains Mono** 400 | Tham số, token count, seed, ID, chỉ số |

```css
--chu-hien: 'Cormorant Garamond', Georgia, serif;
--chu-than: 'Be Vietnam Pro', system-ui, sans-serif;
--chu-so:   'JetBrains Mono', ui-monospace, monospace;
```

Thang cỡ: 11 / 13 / 15 / 18 / 24 / 34 / 52 / 76 px.
Cormorant cỡ lớn: `letter-spacing: 0.02em`, `font-weight: 300`. Tên riêng trong văn bản dùng `font-variant: small-caps`, **không** in đậm.

### 36.4 Kính

```css
.kinh {
  background: var(--kinh-nen);
  backdrop-filter: var(--kinh-blur);
  -webkit-backdrop-filter: var(--kinh-blur);
  border: 1px solid var(--kinh-vien);
  border-radius: var(--r-lg);
  box-shadow:
    0 1px 0 0 var(--kinh-sang) inset,
    0 24px 60px -20px rgba(0,0,0,0.55);
}
.kinh--cap2 { background: var(--kinh-nen-2); }
```

**[BB]** Panel kính **không lồng quá 2 cấp**. Ba lớp trở lên thành đục và mất cảm giác cao cấp.

### 36.5 SVG

- Component React trả `<svg>` inline. `stroke="currentColor"`, `fill="none"`, `stroke-width="1.25"`, `stroke-linecap="round"`, `viewBox="0 0 24 24"`.
- **Hình học, một nét mảnh, không tô đặc, không hai màu.** Cảm hứng từ tinh đồ cổ, khắc đá, ký hiệu giả kim — **không** phải icon UI hiện đại.
- Bộ tối thiểu: `KhoiNguyen, TiepTuc, BanLuu, CaiDat, KhaiNiem, DinhLuat, ThanHe, BienNien, Nhanh, Coi, ThanKhi, QuaiVat, PhanThan, HoaThan, ChucPhuc, TrungPhat, MachTruyen, OngKinh, PhucBut, Mang, DiBiet, Tick, NganSach, Proxy, QuetModel, ChanDoan`

### 36.6 Yếu tố chữ ký — "Tinh Đồ"

**[BB]** Nền mọi màn hình chính là một **SVG constellation sống**, vẽ từ dữ liệu thật của ván chơi:

- Mỗi Khái Niệm là một nốt. Bán kính ∝ `log(trongSo)`.
- Mỗi cạnh `cangThang` là một đường nối. Độ mờ ∝ `doCang`.
- Đã kết tinh thành **thần** → `--dong`; thành **luật** → `--ngoc`; **chưa** → `--van`; **cả hai** (8.2) → đường nối kép giữa hai nốt.
- Trôi rất chậm (chu kỳ 90–120s), `opacity` tổng thể `0.16`.
- Màn khởi động chưa có save: constellation rỗng, vài nốt mờ — nhấn mạnh hư vô trước sáng thế.

Đây là thứ **duy nhất** được phép đẹp phô trương. Mọi thứ khác giữ im lặng và kỷ luật.

### 36.7 Chuyển động & giọng văn

- Chuyển màn hình: fade + translateY 8px, 420ms, `cubic-bezier(0.22, 1, 0.36, 1)`
- Panel mở: scale 0.985 → 1 + fade, 260ms
- Tinh Đồ trôi liên tục, cực chậm
- **[BB]** Tôn trọng `prefers-reduced-motion: reduce` — tắt hết trừ fade

Giọng văn: động từ chủ động ("Khởi nguyên", "Ban luật", "Buông thế giới"), không "Submit"/"OK". Nút giữ nguyên tên xuyên luồng. Màn hình rỗng là lời mời: *"Chưa có gì tồn tại. Hư vô đang chờ một cái tên."* Lỗi nói rõ chuyện gì và sửa thế nào, không xin lỗi.

---

## PHẦN 37 — MÀN HÌNH

### 37.1 Sơ đồ

```
[Khởi Động]
   ├─ Khởi Nguyên → [Hồ sơ: Nhanh | Gợi ý | Đầy đủ | Bỏ qua]
   │              → [Ba cửa tạo thế giới]
   │              → [Chọn hiện diện: Sáng Thế | Thần | Phàm]
   │              → [Xem diff + quyền riêng tư] → [Sảnh Thiên Diễn]
   ├─ Tiếp Tục    → nạp save gần nhất → [Sảnh Thiên Diễn]
   ├─ Bản Lưu     → [Quản Lý Bản Lưu]
   └─ Cài Đặt     → [Cài Đặt AI | Cân Bằng | Registry | Chẩn Đoán]
```

### 37.2 Khởi Động

Bố cục poster: Tinh Đồ toàn màn, một khối kính đơn lệch trái-dưới theo tỉ lệ vàng. Tên game Cormorant 76px weight 300. Bốn mục xếp dọc, mỗi mục có icon SVG mảnh bên trái, chữ Be Vietnam Pro 18px, đường hairline `--kinh-vien` phía dưới.

**Khởi Nguyên · Tiếp Tục · Bản Lưu · Cài Đặt**

"Tiếp Tục" disabled (`--mo`) nếu chưa có save. Hover: hairline sáng dần trái→phải trong 300ms. Không đổi nền, không scale.

Chọn **Khởi Nguyên** mở chuỗi màn hình ngắn của Phần 78. Mỗi màn đều có `Quay lại`, `Bỏ qua` khi hợp lệ và bản tóm tắt thay đổi trước khi tạo Event đầu tiên. Không hỏi email, ngày sinh, giới tính thật hoặc dữ liệu nhận diện không cần thiết.

### 37.3 Sảnh Thiên Diễn

Ba vùng, panel kính nổi trên Tinh Đồ:

- **Trái (280px)** — Điều hướng: Mạch Truyện, Khái Niệm, Định Luật, Thần Hệ, Cõi, Thần Khí, Biên Niên Sử, Nhánh, Sổ Nhân Quả, Sổ Phục Bút, Dị Biệt.
- **Giữa (co giãn)** — **Biên niên đang được kể** (không phải "chat của bạn"). Trên cùng: thanh nhịp thời gian (Nhật / Niên / Thế Đại / Vĩnh Kiếp) và **chỉ báo ống kính** — đang chiếu vào mạch nào, đổi được bằng một click. Dưới cùng: ô nhập hành động tự do.
- **Phải (340px, ẩn được)** — Hàng Cầu Nguyện, Điềm Báo, Tin Đồn, Mạch Truyện đang sôi.

**[BB]** Chỉ báo ống kính phải luôn hiện. Người chơi phải biết mình đang xem chuyện của ai. Khi ống kính không ở chỗ nhân vật người chơi, hiện nhãn nhẹ: *"Đang xem: Mạch Ly Giáo Sông Đen — bạn không có mặt."*

### 37.4 Bảng Mạch Truyện

Danh sách thẻ kính, mỗi thẻ: tên mạch, loại, giai đoạn (thanh mảnh 6 đoạn), `cangThang` (thanh `--van` → `--dong`), nhân vật chính (2–3 tên), nút thắt chưa gỡ, phục bút chưa trả.

Lọc: đang chạy / đã kết / người chơi biết / người chơi không biết. **[BB]** Mặc định hiện **cả** mạch người chơi chưa biết, nhưng làm mờ và ghi *"bạn chưa nghe chuyện này"* — ở tầng Sáng Thế Thần thì hiện đầy đủ.

### 37.5 Quản Lý Bản Lưu

Thẻ kính: tên thế giới (Cormorant), kỷ nguyên, số năm trôi, số thần, số luật, `realityIntegrity` (thanh `--ngoc` → `--hoi`), `doSongDong`, và **thumbnail Tinh Đồ** render từ khái niệm của chính save đó.

Thao tác: Nạp · Nhân bản thành nhánh · Xuất JSON · Nhập JSON · Xóa (gõ đúng tên thế giới để xác nhận).

---
---

# KHỐI K — VẬN HÀNH

## PHẦN 38 — PERSISTENCE

```ts
db.version(1).stores({
  worlds:       'id, ten, capNhatLuc',
  branches:     'id, worldId, gocId, tickTao',
  entities:     'id, branchId, kind, [branchId+kind], _degree',
  links:        'id, branchId, tuId, denId, quanHe, [tuId+quanHe], [denId+quanHe]',
  relations:    '[tuId+denId], branchId, tuId, denId',
  storylines:   'id, branchId, giaiDoan, cangThang, nguoiChoiBiet',
  gaps:         'id, branchId, loai, doUuTien, daGiai',
  terms:        'id, branchId, chuanHoa, soLanXuatHien, daThucThe',
  karma:        'id, branchId, daKichHoat, tickHetHan',
  foreshadow:   'id, branchId, machId, daTra, hanTraToiDa',
  expectations: 'id, branchId, lorebookId, trangThai',
  prayers:      'id, branchId, thanNhanId, daTraLoi, cuongDo',
  chronicle:    'id, branchId, capDo, tickBatDau',
  events:       '++seq, branchId, tick, loai',
  lorebooks:    'id, thanHe, bat',
  entries:      'id, lorebookId, order',
  calib:        '++seq, loaiCall, uocLuong, thucTe, tick',
  settings:     'key',
});
```

**[BB]**
- Mọi bảng nội dung có `branchId`. Nhánh copy-on-write: chỉ ghi bản sao khi record bị sửa lần đầu ở nhánh đó.
- `events` append-only, dùng để nén thành `chronicle`.
- Cấu hình AI ở `settings`; **`proxyPassword` không bao giờ ghi vào file xuất JSON.**
- Autosave sau mỗi tick, giữ 5 bản gần nhất mỗi nhánh.

---

## PHẦN 39 — TỰ CHẨN ĐOÁN [BB]

Một màn hình riêng, chạy được bất kỳ lúc nào. Mỗi mục có mức: `on_dinh` / `luu_y` / `hong`.

| # | Kiểm | Hỏng khi |
|---|---|---|
| 1 | Proxy Narrator | Không phản hồi, hoặc 401 |
| 2 | Proxy Updater | Như trên |
| 3 | Model đã chọn | Không có trong danh sách quét gần nhất |
| 4 | `maxOutputTokens` | Bằng `outputMacDinhCuaApi` mà profile cho phép cao hơn |
| 5 | `thinkingBudget` | ≥ `maxOutputTokens` |
| 6 | Thăm dò năng lực | Chưa chạy, hoặc `hoTroThucTe` lệch `profile.hoTro` |
| 7 | Tỉ lệ token | Sai số ước lượng > 12% trên 20 call gần nhất |
| 8 | Prompt cache | Đo được là có nhưng tỉ lệ hit < 40% → assembler xếp sai thứ tự |
| 9 | Chi phí nhánh | Nhánh thứ hai > 60% chi phí nhánh gốc |
| 10 | Bị cắt cụt | Có `finish_reason: length` trong 20 call gần nhất |
| 11 | Thực thể mồ côi | Số entity `_degree === 0` > 0 |
| 12 | Mật độ liên kết | `matDoLienKet` trung bình < 3 → tự hoàn thiện quá yếu |
| 13 | Lỗ hổng ưu tiên cao | Tồn > 3 kỷ nguyên chưa giải |
| 14 | Khái niệm lưỡng lự | Kẹt trong dải giữa quá `tickLuongLuToiDa` mà chưa phân đôi |
| 15 | Luật treo | `trangThai: 'treo'` mà chưa có gap tương ứng |
| 16 | `realityIntegrity` | Giảm > 20 trong một kỷ nguyên |
| 17 | **Tỉ lệ vắng mặt** | < 0.40 → game đang lấy người chơi làm tâm |
| 18 | `tuSinhSuKien` | < 20% → thế giới bị điều khiển quá tay |
| 19 | `agencyTrungBinh` | < 30 → sắp tới kết cục Thế Giới Búp Bê |
| 20 | Phục bút quá hạn | Có mục `hanTraToiDa` đã qua mà `daTra = false` |
| 21 | Mạch truyện chết yểu | > 40% mạch kết thúc ở `chet_yeu` |
| 22 | Lorebook `order` | Không liên tục hoặc trùng |
| 23 | Macro `<user>` | Tồn tại trong bất kỳ entry nào |
| 24 | EJS lỗi cú pháp | Bất kỳ entry hoặc template nào không parse được |
| 25 | Registry ghi đè hỏng | Có ghi đè bị bỏ do validate trượt |
| 26 | **Rò rỉ tầng** | Chạy test 18.3 tự động: chiếu `pham_nhan`, tìm chuỗi khớp `lawful.vanBan` trong context — có là **hỏng nặng** |

**[BB]** Mục 26 chạy tự động mỗi khi đổi `mode`. Mục 17, 18, 19 tính lại cuối mỗi kỷ nguyên.

**[BB]** Mỗi mục `hong` phải kèm **một câu hành động cụ thể**, không phải mô tả triệu chứng. Ví dụ: không viết *"cache hit thấp"*, viết *"Tầng 3 đang đổi mỗi tick. Kiểm xem biên niên sử có bị chèn vào trước ranh giới cache không."*

---

## PHẦN 40 — LỘ TRÌNH

> Một danh sách tuyến tính duy nhất, thay cho ba danh sách chồng chéo của bản trước.

| # | Nội dung | Xong khi |
|---|---|---|
| 1 | Scaffold, `tokens.css`, `Glass.tsx`, bộ icon SVG, Tinh Đồ | Màn Khởi Động đúng thẩm mỹ Phần 36 |
| 2 | `createRegistry` + mười hai registry + ba tầng nạp | Ghi đè một manifest `KindDef` từ JSON có hiệu lực, ghi đè hỏng không crash |
| 3 | `EntitySchema` + aspect dựng sẵn + `co/lay/themAspect` | Tạo entity `deity`, thêm `mortal`, gỡ `domain` — không mất dữ liệu |
| 4 | Dexie Phần 38 + repository | Round-trip mọi bảng, không crash với state rỗng |
| 5 | `links` + repo tự sinh link + `moRong()` | Tạo thần → link `thuoc_than_he`, `cha_me_cua` tự có |
| 6 | `TuningSchema` + panel Cân Bằng | Không còn số ma thuật nào trong engine |
| 7 | `lawValidator` — bảy kiểm tra | 30 luật mẫu, đúng 30/30 phán quyết |
| 8 | `conceptEngine` + rẽ nhánh + **phân đôi khi lưỡng lự** | Khái niệm kẹt 300 tick → sinh cả thần lẫn luật, nối `doi_nghich` |
| 9 | `metrics` — `realityIntegrity`, `agency`, `doSongDong` | Ba chỉ số đổi đúng theo bảng delta 13.2 |
| 10 | `dialect` + `probe` sáu phép + `ModelProfile` | Đo được `tyLeToken` thật của tiếng Việt |
| 11 | Cấu hình AI kép + UI Cài Đặt + `client.ts` | Hai cột độc lập, slider lấy trần từ profile |
| 12 | Sandbox EJS + `renderTheoNganSach` | Template co giãn đúng theo `budget.remaining` |
| 13 | `chieu()` ba chế độ + `WorldView` + `bopMeo()` | **Test rò rỉ 18.3 đạt** |
| 14 | Assembler sáu tầng + `tokenizer` + tự hiệu chỉnh | Prompt đúng thứ tự; sai số ước lượng < 12% |
| 15 | Narrator + Updater + parser ba khối | Một lượt sửa được world state đúng |
| 16 | Tick engine bước 1–11, 14 (chưa LLM) | 1000 tick không LLM, deterministic theo seed |
| 17 | `lawEngine` bốn tầng + `doctrineDrift` | Diễn giải sai tăng dần theo thế hệ |
| 18 | `lawFormalizer` + panel diff | Gõ một câu văn xuôi → luật đủ bảy trường hợp lệ |
| 19 | `crystallize` | **Test 10.3 chạy đúng end-to-end** |
| 20 | Utility AI + softmax + danh mục hành động | 300 NPC, 500 tick, không hội tụ về một hành vi |
| 21 | `prayerEngine` + bốn cách trả lời | Mọi lời cầu truy về một `ducVongThieu` cụ thể |
| 22 | `gapScanner` chín loại | 1000 tick → gap sinh và xếp ưu tiên đúng |
| 23 | `constraintSolver` + governor + bí ẩn | Lấp `khai_niem` bằng một thần **không vi phạm luật nào** |
| 24 | `<HarvestTerms>` + quy tắc ba lần | 20 lượt chat → ≥5 term, nhắc 3 lần thành gap |
| 25 | **`Storyline` + máy sinh + nhịp truyện** | 24 mạch chạy song song, chi phí LLM bằng 0 |
| 26 | **Ống kính + bảy quy tắc Narrator + hạn ngạch vắng mặt** | Tỉ lệ vắng mặt ≥ 0.40 đo được |
| 27 | **Sổ Phục Bút + nén có hình dạng truyện** | Phục bút gieo lượt 10 được nhắc lại ở lượt 300 |
| 28 | Lorebook manager + nhập ST V2/V3 + đa thần hệ | Nhập một lorebook ST thật, `order` tự sửa |
| 29 | **`LoreExpectation` + lực hấp dẫn + Dị Bản + Bản Đồ Dị Biệt** | Thu một thần trong lorebook → sinh Dị Bản kèm chuỗi nhân quả |
| 30 | Ba cửa vào + wizard 5 bước | Cửa `hu_vo` với ô nhập trống chạy được |
| 31 | Sảnh Thiên Diễn + bảng Mạch Truyện + nhịp thời gian | Chơi trọn một kỷ nguyên |
| 32 | `coherenceAuditor` + bảng chuyển hóa | Tạo mâu thuẫn ngày tháng → sinh tranh chấp sử liệu, không sinh lỗi |
| 33 | Phân thân, dị hóa, tranh đoạt domain, hóa thân, chuyển tầng, Bản Tấu | Xuống phàm 40 năm, quay lại thấy `doPhanKy` tăng |
| 34 | Nhánh song song + sinh kỷ nguyên một call + Bản Đồ Nhánh | Fork 3 nhánh, chia sẻ cache, chi phí nhánh 2 < 60% |
| 35 | Năm kết cục + vòng sau + `bopMeo` di sản | Kết một vòng, nạp mythos pack, thần cũ hiện ra **sai** |
| 36 | Panel Tự Chẩn Đoán 26 mục | Cố tình phá 5 thứ, bảng bắt đúng cả 5 |

---

## PHẦN 41 — KIỂM TRA CUỐI

**Kiến trúc**
- [ ] `kind` là chuỗi tra Registry, không phải enum
- [ ] Mọi truy cập aspect qua `co/lay/themAspect`, không truy cập thẳng
- [ ] Không một con số ma thuật nào trong engine; tất cả từ `tuning`
- [ ] Ghi đè registry hỏng → bỏ, giữ tầng dưới, ghi cảnh báo, **không crash**
- [ ] Mọi reference giữa entity đều có Link; repo tự sinh
- [ ] Không entity nào `_degree === 0` mà không nằm trong `gaps`
- [ ] Link không xóa cứng, chỉ set `trongSo = 0` và ghi `tickDut`

**Logic thế giới**
- [ ] Mọi `z.object()` lồng nhau có `.prefault({})`
- [ ] Mặc định `z.enum()` nằm trong enum; enum chỉ `a-z0-9_`, không dấu
- [ ] Khái niệm lưỡng lự quá hạn → phân đôi, không treo vĩnh viễn
- [ ] `sacThai` chỉ do engine cộng từ sự kiện, người chơi không khai được
- [ ] Phản nghĩa tự sinh mỗi khi tạo khái niệm
- [ ] Bảy kiểm tra chạy trên bản **đã hình thức hóa**, không chặn người chơi
- [ ] Luật trượt 3 lần → nhận ở `treo`, áp tầng 2–3, tạo gap; **không chặn**
- [ ] Tầng 2 lan truyền **bắt buộc sai**; diễn giải đúng 100% là bug
- [ ] Kẻ thù vĩnh cửu được kiểm ở bước 6 của tick, không bị bỏ rơi

**Tự sự**
- [ ] Mạch truyện chạy bằng engine, không LLM
- [ ] Đa số mạch có `nguoiChoiBiet = false`
- [ ] Tỉ lệ vắng mặt ≥ 0.40, đo và báo cáo
- [ ] Narrator không bao giờ hỏi "bạn làm gì?"
- [ ] Nhân vật người chơi không có trường ưu ái nào trong `Storyline`
- [ ] Phục bút quá hạn được đẩy lên đầu context, không im lặng
- [ ] Nén mạch giữ nguyên nút thắt, phục bút, lời hứa, mối thù

**Ba tầng**
- [ ] Một engine, ba hàm chiếu; không copy-paste logic
- [ ] Assembler và `moRong()` nhận `WorldView`, không nhận `World`
- [ ] EJS sandbox nhận `view`, không nhận `World`
- [ ] Test rò rỉ 18.3 đạt: phàm nhân nhận `dienGiai` sai, không nhận `vanBan`
- [ ] `bopMeo()` sai **có cấu trúc**, không chỉ làm mơ hồ
- [ ] Thần đánh nhau bằng quy kết, không HP
- [ ] Hóa thân làm tụt tầm nhìn của thần xuống mức phàm
- [ ] Chuyển tầng không tạo save mới, không đổi `branchId`
- [ ] Phân thân tiếp tục chạy khi người chơi ở tầng khác
- [ ] Không có màn hình "Game Over"

**AI & ngân sách**
- [ ] Hai pipeline độc lập hoàn toàn
- [ ] Không hardcode tham số model; mọi thứ trong `R.profile`
- [ ] `maxOutputTokens` set tay, có cảnh báo khi bằng mặc định API
- [ ] Slider lấy trần từ profile đang chọn
- [ ] Tham số không hỗ trợ thì **ẩn hẳn**, không disable
- [ ] `tyLeToken` đo bằng tiếng Việt thật, không dùng công thức tiếng Anh
- [ ] `hoTroThucTe` từ probe ghi đè `profile.hoTro`
- [ ] Sổ Nhân Quả và Sổ Phục Bút nằm **cuối** prompt
- [ ] Patch trượt → bỏ patch đó, **không rollback cả lượt**
- [ ] Không dùng `lodash.pickBy` để lọc patch
- [ ] Nhánh cùng gốc chia sẻ prefix cache

**Lorebook**
- [ ] Nhập được ST V2 và V3, tự dò định dạng
- [ ] Macro `{{user}}`; không `<user>` nào tồn tại
- [ ] `order` liên tục, không trùng
- [ ] `LoreExpectation` là **điểm hút**, không phải kịch bản
- [ ] Dị Bản ghi rõ kỳ vọng gốc, thực tế, và nguyên nhân truy được
- [ ] Bản Đồ Dị Biệt dùng `--van` cho cột lệch, **không** dùng `--hoi`
- [ ] Mythos pack vòng sau bắt buộc qua `bopMeo()`

**Giao diện**
- [ ] Không một emoji nào trong toàn bộ codebase và dữ liệu mẫu
- [ ] Không thư viện icon; mọi icon SVG inline tự vẽ
- [ ] Không hardcode hex ngoài `tokens.css`
- [ ] Không `#FFFFFF`, không `#000000`
- [ ] Kính không lồng quá 2 cấp
- [ ] Cả ba font hiển thị đúng dấu tiếng Việt ở mọi cỡ
- [ ] `prefers-reduced-motion` được tôn trọng
- [ ] Chỉ báo ống kính luôn hiện
- [ ] Không có thông báo "không hiểu yêu cầu" ở bất kỳ đâu
- [ ] Mọi mâu thuẫn ghi vào biên niên sử bằng giọng kể, không giọng log

---

## PHỤ LỤC — MƯỜI LĂM CÂU CẦN NHỚ

1. Engine giữ số. AI giữ lời. Database giữ nhân quả.
2. Chi tiết phải được suy ra, không được bịa ra. Không bao giờ hỏi AI một câu mở.
3. Không có thực thể mồ côi. Backlink là thứ assembler đi theo, không phải keyword.
4. Mọi mâu thuẫn biến thành nội dung. Lỗ hổng không lấp được trở thành bí ẩn.
5. Người chơi có tự do của văn xuôi; engine giữ sự chặt chẽ của logic.
6. Mọi hằng số là dữ liệu. Hardcode một con số ma thuật là vi phạm.
7. Rò rỉ thông tin giữa ba tầng là bug nghiêm trọng nhất.
8. Người chơi đặt tên cho khái niệm; thế giới định nghĩa nó.
9. Trọng số từ ý chí sinh ra thần. Trọng số từ lặp lại sinh ra luật. Lưỡng lự quá lâu thì sinh ra cả hai.
10. Phàm nhân suy ra luật, và lúc đầu luôn suy sai. Suy đúng ngay là bug.
11. Thần trở thành thứ tín đồ tưởng mình là.
12. Nhắc một lần là hương vị. Nhắc ba lần là có thật.
13. NPC luôn chọn tối ưu là NPC chết. Nhiệt độ 0.35 là chỗ sự sống nằm.
14. Thế giới không xoay quanh người chơi. Bốn mươi phần trăm câu chuyện phải xảy ra khi người chơi vắng mặt.
15. Vòng sau, những vị thần bạn từng là phải hiện ra sai. Đó là luận điểm của cả trò chơi.

---

*Hết đặc tả hợp nhất v2.0.*

---
---

# KHỐI L — TIẾP ĐỊA, LUẬT NỀN & CƠ CHẾ PHÁI SINH

> Khối này bổ sung một nguyên tắc mà các khối trước còn thiếu, và nó **thay đổi cách hiểu về Định Luật**.
> Đọc kỹ Phần 42 trước khi động vào 43 và 44 — hai phần sau là hệ quả của nó.

## PHẦN 42 — NGUYÊN TẮC TIẾP ĐỊA [BB]

### 42.1 Một câu

> **Khái niệm là từ vựng của thực tại. Định luật là câu viết bằng từ vựng đó.**
> **Không thể viết một câu bằng những từ chưa tồn tại.**

Đây là nguyên tắc thứ tám, đứng ngang hàng bảy nguyên tắc ở Phần 2.

Hệ quả trực tiếp: một luật không tồn tại chỉ vì người chơi tuyên bố nó. Nó tồn tại **đến mức các khái niệm cấu thành nó là thật**.

### 42.2 Phân rã luật thành khái niệm

Mọi luật, khi được hình thức hóa (17.1), phải khai thêm danh sách khái niệm nền:

```ts
// bổ sung vào LawfulSchema
tiepDia: z.array(z.object({
  khaiNiemId: z.string(),
  vaiTro: z.enum(['chu_the','doi_tuong','tac_dong','trang_thai','pham_tru']),
  batBuoc: z.boolean().prefault(true),
})).prefault([]),

hieuLuc: z.number().min(0).max(100).prefault(0),      // engine tính, KHÔNG ai khai
cheDoTiepDia: z.enum(['chat_che','tu_tiep_dia','tu_suy']).prefault('tu_tiep_dia'),
```

Ví dụ với luật quen thuộc:

```
"Máu đã đổ thì không rửa được"
  → Máu          (đối tượng)
  → Bạo Lực      (tác động)
  → Tẩy Uế       (tác động — cái bị phủ định)
  → Bất Khả Nghịch (phạm trù)
```

Nếu thế giới chưa có khái niệm **Tẩy Uế**, câu này vô nghĩa: không thể cấm rửa sạch ở một nơi mà việc-rửa-sạch chưa từng là một ý niệm.

### 42.3 Ba chế độ xử lý luật chưa tiếp địa [MR]

| Chế độ | Hành vi | Dành cho |
|---|---|---|
| `chat_che` | Từ chối luật, nêu rõ khái niệm nào còn thiếu | Người chơi muốn kiểm soát chặt |
| `tu_tiep_dia` | **Mặc định.** Engine tự tạo khái niệm thiếu ở `hu_danh`, `trongSo = 0`. Luật tồn tại nhưng `hieuLuc` gần bằng 0 | Đa số |
| `tu_suy` | Engine gọi bộ giải ràng buộc để **suy ra** khái niệm nào cần, tìm khái niệm sẵn có trước, chỉ tạo mới khi thật sự không có | Chơi tự do, ít gõ |

**[BB]** Ở chế độ `tu_tiep_dia` và `tu_suy`, luật **không bị chặn**. Nó được nhận, nhưng yếu — và người chơi phải thấy rõ điều đó trong panel diff.

### 42.4 Hiệu Lực — sức mạnh của luật là độ thật của khái niệm nền

```ts
export function tinhHieuLuc(luat: Entity, w: World): number {
  const nen = luat.tiepDia.filter(t => t.batBuoc);
  if (nen.length === 0) return 0;

  const diem = nen.map(t => {
    const kn = layKhaiNiem(t.khaiNiemId, w);
    return chuanHoa(kn.trongSo / kn.nguongKetTinh) * heSoVaiTro(t.vaiTro);
  });

  // Mắt xích yếu nhất quyết định — KHÔNG dùng trung bình
  return Math.min(...diem) * 100;
}
```

**[BB]** Dùng **min**, không dùng trung bình. Một câu có một từ vô nghĩa thì cả câu vô nghĩa. Đây là chỗ dễ làm sai nhất trong toàn khối.

Bốn hệ quả, tất cả đều rơi ra miễn phí:

- **Luật ban ngày đầu tiên gần như trơ.** Thế giới rỗng thì chưa có gì nghĩa lý gì. Người chơi phải *gieo* trước khi *cấm*.
- **Luật mạnh dần khi thế giới sống.** Cùng một câu chữ, sau ba kỷ nguyên thì có răng.
- **Luật cổ mạnh hơn luật mới**, vì khái niệm nền của chúng nặng hơn.
- **Có thể làm suy yếu một luật mà không cần bãi bỏ nó** — xem 42.5.

`hieuLuc` ảnh hưởng: xác suất tầng 1 cưỡng chế thành công, tốc độ lan tầng 2–3, và **kích thước kẽ hở** (luật yếu thì kẽ hở rộng).

### 42.5 Đánh vào khái niệm thay vì đánh vào luật [BB]

Đây là cơ chế chiến lược sâu nhất mà nguyên tắc này mở ra.

```
Người chơi không thích luật "Máu đã đổ thì không rửa được"
  → nhưng luật đó do một cụm luật khác kết tinh ra, không xóa sạch được
  → thay vì bãi bỏ, hãy làm KHÁI NIỆM "Tẩy Uế" chết đi:
       xóa mọi nghi lễ tẩy uế
       làm khái niệm Ô Uế mất nghĩa
       hoặc PHAN nó thành hai khái niệm nhỏ hơn, chia đôi trọng số
  → hieuLuc của luật tụt
  → luật vẫn nằm trong sổ, nhưng thế giới không còn cảm thấy nó
```

**Đây là cách các tôn giáo cổ thật sự chết:** không ai bãi bỏ chúng cả — người ta chỉ ngừng hiểu chúng nói gì.

**[BB]** Engine phải hỗ trợ đường ngược lại: **hồi sinh một luật đã chết** bằng cách nuôi lại khái niệm nền. Một tà giáo phục dựng nghi lễ cổ có thể làm sống lại một định luật bị lãng quên hàng nghìn năm. Đây là mạch truyện loại `phuc_hung` — thêm vào `R.storyKind`.

### 42.6 Kiểm tra thứ tám

Bổ sung vào bảy kiểm tra ở 9.2:

| # | Mã | Kiểm tra | Trượt khi |
|---|---|---|---|
| 8 | `TIEP_DIA` | Mọi khái niệm trong `tiepDia` tồn tại; `vaiTro` khớp cấu trúc câu luật | Có khái niệm không tồn tại **và** `cheDoTiepDia = 'chat_che'` |

**[BB]** Ở hai chế độ còn lại, kiểm tra 8 **không bao giờ trượt** — nó chỉ tạo khái niệm thiếu và trả về cảnh báo mức `luu_y`. Đúng nguyên tắc 5: không dựng tường trước mặt người chơi.

### 42.7 Panel diff phải hiện Hiệu Lực

Khi người chơi ban luật, ngoài bảy trường suy ra, phải hiện thêm:

```
TIẾP ĐỊA
  Máu             ████████░░  trọng số 780 / 1000     đã thành hình
  Bạo Lực         ██████████  trọng số 2140 / 1000    đã kết tinh
  Tẩy Uế          ░░░░░░░░░░  trọng số 0              vừa được tạo, chưa có nghĩa
  Bất Khả Nghịch  ███░░░░░░░  trọng số 260 / 1000     manh nha

HIỆU LỰC: 0%     ← quyết định bởi mắt xích yếu nhất: Tẩy Uế

Luật này sẽ được ghi vào sổ, nhưng thế giới chưa cảm thấy nó.
Nó sẽ mạnh dần khi việc tẩy uế trở thành một điều có thật ở đây.
```

**[BB]** Dòng cuối phải có. Nó dạy người chơi toàn bộ cơ chế mà không cần đọc hướng dẫn.

---

## PHẦN 43 — LUẬT NỀN

### 43.1 Hai tầng luật [BB]

Định Luật ở Phần 9 có cấu trúc `sự kiện → điều kiện → hiệu ứng lên field`. Thời Gian không tác động lên field nào — nó quy định **cách bản thân engine chạy**. Nhét chung một schema là sai kiến trúc.

| Tầng | Chi phối | Cấu trúc |
|---|---|---|
| **Luật Nội Tại** | Sự kiện trong thế giới | Bảy trường + tiếp địa (Phần 9, 42) |
| **Luật Nền** | Chính bộ máy mô phỏng | Không có `hieuUng`. Có **tham số cấu hình engine** |

### 43.2 Mặc định vô danh và Luật có tên [BB]

Đây là điểm tinh tế nhất của khối này.

Thế giới **luôn** vận hành theo một cấu hình nào đó — engine cần giá trị để chạy. Nhưng cấu hình đó có hai trạng thái rất khác nhau:

| | Mặc định vô danh | Luật có tên |
|---|---|---|
| Engine dùng | Có | Có |
| Ai trong thế giới biết | Không ai | Có người |
| Khai thác được không | **Không** | **Có** |
| Có kẽ hở không | Không | Có |
| Sửa được không | Chỉ Sáng Thế Thần | Theo `khaNghich` |
| Sinh mạch truyện | Không | Có |

> **Trước khi được đặt tên, thời gian vẫn trôi một chiều — nhưng không ai lợi dụng được điều đó, vì lợi dụng đòi hỏi phải biết luật.**

Một luật nền chuyển từ vô danh sang có tên khi **có kẻ trong thế giới khái niệm hóa được nó**: một triết gia, một nhà tiên tri, một vị thần — hoặc người chơi tự đặt.

**[BB]** Khoảnh khắc đó phải sinh một sự kiện lớn và một mạch truyện loại `dat_ten` (thêm vào `R.storyKind`). Ngày một phàm nhân đầu tiên nghĩ ra khái niệm Thời Gian là một trong những ngày quan trọng nhất trong lịch sử thế giới đó — và từ hôm ấy, thời gian có thể bị bẻ.

**Hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở.**

### 43.3 Schema

```ts
export const SubstrateLawSchema = z.object({
  id: z.string(), branchId: z.string(),
  truc: z.enum(['khong_gian','thoi_gian','nhan_qua','danh_tinh','sinh_tu','nhan_thuc','van_menh']),

  trangThai: z.enum(['vo_danh','co_ten']).prefault('vo_danh'),
  khaiNiemNenId: z.string().nullable().prefault(null),   // TIẾP ĐỊA cho luật nền
  nguoiDatTenId: z.string().nullable().prefault(null),
  tickDatTen: z.number().nullable().prefault(null),

  thamSo: z.record(z.string(), z.unknown()).prefault({}),

  keHo: z.array(z.object({
    moTa: z.string(), daBiKhaiThac: z.boolean().prefault(false),
  })).prefault([]),                                       // chỉ sinh khi co_ten

  khaNghich: z.object({
    duocKhong: z.boolean().prefault(false),
    boiAi: z.enum(['khong_ai','sang_the_than','than_toi_cao']).prefault('sang_the_than'),
    batBuocPhanNhanh: z.boolean().prefault(true),
  }).prefault({}),
}).prefault({});
```

**[BB]** `khaiNiemNenId` là bắt buộc để chuyển sang `co_ten`. Luật nền cũng phải tiếp địa — không thể đặt tên cho Thời Gian nếu khái niệm về Trước-Sau chưa thành hình.

### 43.4 Bảy trục và tham số

**1 · KHÔNG GIAN** — khái niệm nền: *Nơi Chốn* hoặc *Khoảng Cách*

| Tham số | Lựa chọn | Ảnh hưởng engine |
|---|---|---|
| `toPo` | `mat_phang` / `mat_cau` / `vo_han` / `huu_han_co_bien` / `phan_tang` | Ranh giới bản đồ, có thể đi mãi không |
| `khoangCach` | `do_luong` / `y_nghia` | **Định nghĩa "gần" của `moRong()`** — xem dưới |
| `coTheGap` | bool | Dịch chuyển, đường linh mạch |
| `ghiDeCucBo` | bool | Cho phép Cố Hữu Kết Giới tồn tại (44.3) |

**[BB]** `khoangCach = 'y_nghia'` là tham số có ảnh hưởng kỹ thuật sâu nhất trong cả spec: nó **đổi định nghĩa lân cận của hàm `moRong()`**, tức đổi cả cách assembler chọn ngữ cảnh. Địa lý thần thoại thật vận hành theo ý nghĩa chứ không theo mét — âm phủ ở "dưới" nhưng tới được bằng một con sông. Ở chế độ này, **hai ngôi đền thờ cùng một vị thần là liền kề**, bất kể cách nhau bao xa, và assembler sẽ tự kéo chúng vào cùng ngữ cảnh.

**2 · THỜI GIAN** — khái niệm nền: *Trước-Sau* hoặc *Biến Đổi*

| Tham số | Lựa chọn | Ảnh hưởng |
|---|---|---|
| `huong` | `mot_chieu` / `hai_chieu` / `vong_lap` / `phan_nhanh` | Hành vi tick và nhánh |
| `toDo` | `dong_nhat` / `khac_theo_coi` | Mỗi `spatial` có hệ số tick riêng |
| `quaKhu` | `co_dinh` / `sua_duoc` | **Mở khóa hoặc khóa chế độ sửa luật `hoi_to`** |
| `tuongLai` | `chua_ton_tai` / `da_ton_tai` | Tiên tri là **đọc** hay là **viết** |

**[BB]** Tham số `tuongLai` đáng suy nghĩ kỹ. `da_ton_tai` → tiên tri là quan sát, Sổ Nhân Quả có sẵn đáp án, và mọi `Storyline` được gán `ketCuc` từ lúc sinh. `chua_ton_tai` → tiên tri là hành vi **tạo ra ràng buộc**, và người tiên tri đang thực sự viết luật. Hai thế giới hoàn toàn khác nhau từ một trường.

**3 · NHÂN QUẢ** — khái niệm nền: *Nguyên Nhân* hoặc *Hậu Quả*

| Tham số | Lựa chọn |
|---|---|
| `thuTu` | `nghiem_ngat` / `long_leo` / `nguoc_duoc` |
| `baoToan` | bool — hành động có nhất thiết sinh hậu quả không |
| `chamTruuTuong` | bool — **cho phép Vũ Khí Khái Niệm tồn tại** (44.3) |

**4 · DANH TÍNH** — khái niệm nền: *Bản Ngã* hoặc *Cùng Một*

| Tham số | Lựa chọn | Vì sao cần |
|---|---|---|
| `banChat` | `mot_tu` / `tong_hop` / `khong_co` | `mot_tu` **cho phép Nguyên Điểm tồn tại** |
| `lienTuc` | `theo_than_xac` / `theo_ky_uc` / `theo_ten_goi` | Thân xác đổi thì còn là mình không |
| `saoChep` | `cung_mot_nguoi` / `hai_nguoi` / `mot_gia_mot_that` | Phân thân, hóa thân, hợp nhất đều phụ thuộc |

**[BB]** Trục này là tiền đề cho phân thân (12.3), hóa thân (19.4), dung hợp thần (35.7) và anh linh hóa thần (20.3). Nếu để `vo_danh`, engine dùng `theo_ky_uc` + `cung_mot_nguoi` làm mặc định. Nhưng khi được đặt tên, mọi cơ chế đó **đột nhiên có kẽ hở**.

**5 · SINH TỬ** — khái niệm nền: *Cái Chết*. Phụ thuộc Danh Tính.

| Tham số | Lựa chọn |
|---|---|
| `ranhGioi` | `dut_khoat` / `mo` / `tuan_hoan` |
| `sauKhiChet` | `khong_gi` / `mot_coi` / `tai_sinh` / `tuy_nguoi` |
| `hoiSinh` | `khong_the` / `co_gia` / `tu_do` |

**6 · NHẬN THỨC** — khái niệm nền: *Biết* hoặc *Bí Ẩn*. Phụ thuộc Danh Tính.

| Tham số | Lựa chọn | Mở khóa |
|---|---|---|
| `hieuBietLamSuyYeu` | bool | **Cho phép Thần Bí tồn tại** (44.3) |
| `quanSatLamDinhHinh` | bool | Thứ chưa ai nhìn thì chưa có hình dạng cố định |
| `tenGoiCoQuyenNang` | bool | Biết tên thật thì khống chế được — ma thuật chân danh |

**[BB]** `tenGoiCoQuyenNang = true` móc thẳng vào hệ thu hoạch danh từ (Phần 14): mọi tên riêng trong thế giới trở thành **tài sản chiến lược**. Ai giữ được tên thật của mình thì an toàn; ai để lộ thì nguy. Một cơ chế lớn, gần như miễn phí.

**7 · VẬN MỆNH** — khái niệm nền: *Tất Yếu*. Phụ thuộc Thời Gian và Nhân Quả.

| Tham số | Lựa chọn |
|---|---|
| `tonTai` | bool — không thì tiên tri chỉ là dự đoán |
| `cuongDo` | `goi_y` / `xu_huong_manh` / `bat_kha_khang` |
| `aiDocDuoc` | `khong_ai` / `chi_than` / `vai_pham_nhan` / `moi_nguoi` |
| `phanKhang` | `chong_duoc` / `chong_that_bai` / `chinh_viec_chong_khien_no_xay_ra` |
| `nguonViet` | `sang_the_than` / `mot_nu_than` / `khong_ai_no_tu_co` |

**[BB]** Lựa chọn `chinh_viec_chong_khien_no_xay_ra` là mô-típ Oedipus và phải là công dân hạng nhất — nó **tự sinh bi kịch vô hạn** không cần ai viết. Kỹ thuật: khi NPC hành động nhằm né `Storyline.ketCuc`, `sinhNhip()` phải lấy chính hành động đó làm nguyên nhân tiến gần kết cục hơn.

**[BB]** Vận Mệnh là ràng buộc lên máy sinh mạch truyện (28.4). `tonTai = true` → mọi `Storyline` được gán `ketCuc` ngay lúc sinh, và `sinhNhip()` phải lái mọi nhịp về phía đó. Đây là một chế độ tự sự hoàn toàn khác — cần được test riêng.

### 43.5 Thứ tự phụ thuộc [BB]

```
1. Không Gian    ("ở đâu" nghĩa là gì)
2. Thời Gian     (chiều; tương lai đã tồn tại chưa)
3. Nhân Quả      (cần 1 và 2)
4. Danh Tính     (cái gì làm một vật là chính nó)
5. Sinh Tử       (cần 4)
6. Nhận Thức     (cần 4 — biết CÁI GÌ)
7. Vận Mệnh      (cần 2 và 3)
```

Đặt tên sai thứ tự → validator trả về mâu thuẫn. Ví dụ không thể khai `van_menh.tuongLai` mà `thoi_gian` còn `vo_danh`.

### 43.6 Sửa Luật Nền bắt buộc phân nhánh [BB]

Đổi "máu đã đổ thì không rửa được" là đổi chính sách.
Đổi "thời gian chảy một chiều" là **tai họa vũ trụ viết lại toàn bộ lịch sử**.

`khaNghich.batBuocPhanNhanh` mặc định `true` cho cả bảy trục. Sửa luật nền **luôn** fork nhánh mới, không bao giờ sửa tại chỗ. Nhánh cũ tiếp tục chạy — và người chơi có thể so hai vũ trụ với hai bộ vật lý khác nhau ở Bản Đồ Nhánh (26.2).

### 43.7 Luật Nền tự kết tinh

**[BB]** Người chơi **không bắt buộc** định nghĩa trục nào. Bỏ trống thì engine dùng bộ mặc định phàm tục, `trangThai = 'vo_danh'`.

Nhưng nếu qua quá trình chơi, một khái niệm như *Tất Yếu* hay *Trước-Sau* tự tích đủ trọng số và kết tinh (Phần 8), engine kiểm xem nó có khớp một trục nền không. Khớp → trục đó chuyển sang `co_ten`, và **các tham số được khóa lại đúng theo hành vi mà thế giới vốn đã có**.

Thế giới tự phát hiện ra vật lý của chính nó. Đây là ứng dụng đẹp nhất của cơ chế kết tinh, và nó không cần thêm code — chỉ cần một bảng ánh xạ `khái niệm → trục nền` trong Registry.

---

## PHẦN 44 — CƠ CHẾ PHÁI SINH [BB]

### 44.1 Nguyên tắc: không có tính năng, chỉ có vật lý khả dĩ

> **Không cơ chế nào được cài cứng vào engine. Mọi cơ chế chỉ tồn tại nếu thế giới có đủ điều kiện cho nó tồn tại.**

Đây là câu trả lời tổng quát cho yêu cầu "trừ khi tôi tự tạo ra nó thì nó mới tồn tại". Bốn cơ chế dưới đây **không phải tính năng của app**. Chúng là **hệ quả** của những luật mà người chơi có thể viết hoặc không.

Nếu người chơi không bao giờ đặt tên trục Nhận Thức, thì trong thế giới đó hiểu biết không làm suy yếu bất cứ thứ gì — và Thần Bí đơn giản là **không có mặt trong vũ trụ này**.

### 44.2 Schema

```ts
export type MechanismDef = {
  id: string;
  ten: string;

  dieuKienTonTai: {
    lucNen?: { truc: string; thamSo: Record<string, unknown> }[];
    khaiNiem?: { tag: string; giaiDoanToiThieu: string }[];
    luatNoiTai?: { theTag: string[] }[];
  };

  khiBat: (w: World) => void;          // đăng ký hook, thêm aspect, mở động từ
  khiTat: (w: World) => void;
  moTaKhiKhong: string;                // BẮT BUỘC: thế giới ra sao khi KHÔNG có
  moTaKhiCo: string;
};
```

**[BB]** Trường `moTaKhiKhong` là bắt buộc và không được để trống. Nó ép người thiết kế cơ chế phải trả lời: *thế giới không có thứ này thì khác gì?* Nếu không trả lời được thì cơ chế đó không đáng tồn tại.

Cơ chế nằm trong `R.mechanism` — **[MR]**, người dùng thêm được.

### 44.3 Bốn cơ chế dựng sẵn

---

**THẦN BÍ** · `than_bi`

*Điều kiện:* trục `nhan_thuc` ở `co_ten` với `hieuBietLamSuyYeu = true`.

*Khi bật:* mọi entity có thêm trường `thanBi`.

```
thanBi_goc  = f(tuổi của entity, tính từ tickSinh so với tickKhaiThien)
thanBi_hien = thanBi_goc
              × (1 - triThucTrungBinhVung / 100)
              × (0.97 ^ soLanBiNghienCuu)
```

`thanBi` nhân vào `hieuLuc` của luật, vào sức mạnh thần khí, vào khả năng cưỡng chế của thần.

*Khi không có:* kiến thức không ảnh hưởng sức mạnh. Thần cổ không mạnh hơn thần mới. Một cây gậy phép hoạt động y hệt dù cả thế giới hiểu nguyên lý của nó hay không ai hiểu.

**[BB]** Hai móc nối quan trọng:
- Thần Khởi Nguyên cuối cùng có ý nghĩa cơ học chứ không chỉ là lore — chúng già nhất nên `thanBi_goc` cao nhất.
- Nối vào Dị Hóa (12.2): **thần bị hiểu sai thì đổi tính; thần bị hiểu đúng thì tan biến.** Đây là hai cung suy tàn khác nhau, và cung thứ hai bi thảm hơn nhiều — vị thần không bị lãng quên, mà bị *giải thích*.

Một nền văn minh trở nên khoa học sẽ giết chết thần của chính nó. Cung này tự chạy, không cần ai viết kịch bản.

---

**NGUYÊN ĐIỂM** · `nguyen_diem`

*Điều kiện:* trục `danh_tinh` ở `co_ten` với `banChat = 'mot_tu'`.

*Khi bật:* mỗi entity có `soul` được gán một link `nguyen_diem` tới một Concept — một từ định nghĩa toàn bộ tồn tại của họ.

```ts
// bổ sung vào chamDiem() của utility AI
if (coCoChe('nguyen_diem') && hd.thuanTheo(nguyenDiem(npc)))
  diem *= 2.2;

// và mỗi kỷ nguyên
banTinh = keo(banTinh, trucCuaNguyenDiem, 0.05);
ducVong = teoDan(ducVong, trừ trục thuận Nguyên Điểm);
```

*Khi không có:* sinh linh là tổng hợp các đặc điểm, không có bản chất cốt lõi. Không ai mạnh bất thường khi hành động thuận bản chất, và cũng không ai bị bản chất nuốt.

**[BB]** Đây đúng là công thức Dị Hóa, ngược chiều. Dị Hóa kéo từ ngoài vào — tín đồ tin gì. Nguyên Điểm kéo từ trong ra. Kết quả giống nhau: **bạn ngừng là một người và trở thành một lực.**

Một entity có `banTinh` sụp hoàn toàn về một trục nên được engine tự đề xuất chuyển kind sang `concept` — nó đã thôi là ai đó và trở thành cái gì đó.

---

**CỐ HỮU KẾT GIỚI** · `co_huu_ket_gioi`

*Điều kiện:* trục `khong_gian` với `ghiDeCucBo = true`, **và** tồn tại khái niệm có tag `noi_gioi` đã đạt `thanh_hinh`.

*Khi bật:* entity có `nguyen_diem` đủ mạnh mở được một `Realm` tạm thời, di động, bán kính hữu hạn, ghi đè Luật Nội Tại bên trong.

```ts
export const RealityMarbleSchema = z.object({
  chuTheId: z.string(),
  khaiNiemGocId: z.string(),          // = Nguyên Điểm của chủ thể
  luatGhiDe: z.array(z.string()).prefault([]),
  banKinh: z.number(),
  tickConLai: z.number(),
  giaThucTai: z.number().prefault(3),  // realityIntegrity trừ mỗi tick, CỤC BỘ
}).prefault({});
```

*Khi không có:* không ai áp đặt được luật riêng lên không gian. Nội tâm là chuyện riêng, không phải một địa hình.

**[BB]** `giaThucTai` trừ vào `realityIntegrity` **cục bộ của vùng**, không phải toàn cầu. Dùng nhiều lần ở một chỗ thì chỗ đó thành vùng Nghịch Lý vĩnh viễn — một chiến trường cũ mà thực tại không bao giờ lành lại.

---

**VŨ KHÍ KHÁI NIỆM** · `vu_khi_khai_niem`

*Điều kiện:* trục `nhan_qua` với `chamTruuTuong = true`.

*Khi bật:* động từ `THU` và `DINH` áp được lên cơ chất `CONCEPT` **trực tiếp**, và hiệu ứng lan tới **mọi vật mang** của khái niệm đó.

```
THU(CONCEPT: "Rồng")  → mọi con rồng ngừng tồn tại đồng thời
                       → mọi luật tiếp địa vào "Rồng" tụt hieuLuc về 0
                       → để lại một VẾT SẸO cỡ khái niệm: một lỗ hổng
                         trong từ vựng của thực tại
```

*Khi không có:* chỉ chạm được vào thực thể, không chạm được vào ý niệm. Giết hết rồng thì rồng vẫn có thể sinh ra lần nữa, vì khái niệm Rồng vẫn còn đó.

**[BB]** Đây là cơ chế nguy hiểm nhất trong toàn game và phải đắt tương xứng. Đề nghị:
- `realityIntegrity` trừ nặng, tỉ lệ với `trongSo` của khái niệm bị diệt
- Mọi luật tiếp địa vào nó lập tức mất hiệu lực → có thể sập cả một nền văn minh theo dây chuyền
- Phản nghĩa của khái niệm đó (8.3) **mất đối trọng** và tăng vọt không kiểm soát
- Sẹo khái niệm sinh một `gap` loại `nhan_qua` vĩnh viễn không giải được — tức là một **bí ẩn cấp vũ trụ**

Diệt khái niệm Cái Chết nghe như một hành động từ bi. Hậu quả thì không.

### 44.4 Phát hiện và công bố [BB]

Cuối mỗi kỷ nguyên, engine quét `R.mechanism` và so `dieuKienTonTai` với world state.

- Điều kiện vừa đủ → gọi `khiBat()`, ghi một sự kiện **cấp vũ trụ** vào biên niên sử, và sinh một mạch truyện loại `dat_ten`.
- Điều kiện vỡ (khái niệm nền chết, luật nền bị sửa qua nhánh khác) → gọi `khiTat()`, và **mọi thứ đang phụ thuộc cơ chế đó phải được xử lý tử tế**, không xóa cứng: Cố Hữu Kết Giới đang mở thì sập; entity có Nguyên Điểm thì giữ link nhưng mất hệ số.

**[BB]** Công bố phải viết bằng giọng biên niên sử:
> *"Năm 6120, một người chép sách ở Kemet viết ra câu đầu tiên về việc mọi thứ đều đi từ trước tới sau, và không quay lại. Ông không biết mình vừa làm gì. Từ mùa đó, các thầy tế bắt đầu mơ những giấc mơ có thứ tự."*

### 44.5 Panel Vật Lý Thế Giới

Một màn hình riêng, hiện đủ ba tầng:

```
LUẬT NỀN
  Không Gian    có tên   mặt phẳng · khoảng cách theo ý nghĩa · gấp được
                         đặt tên bởi Nhà Đo Đất Senmut, năm 4410
  Thời Gian     có tên   một chiều · quá khứ cố định · tương lai chưa tồn tại
  Nhân Quả      vô danh  (nghiêm ngặt, bảo toàn, không chạm trừu tượng)
  Danh Tính     có tên   một từ · liên tục theo ký ức · bản sao là hai người
  Sinh Tử       vô danh  (dứt khoát, một cõi, không hồi sinh)
  Nhận Thức     có tên   hiểu biết làm suy yếu · tên gọi có quyền năng
  Vận Mệnh      chưa có  (khái niệm Tất Yếu mới ở manh nha, 340/1000)

CƠ CHẾ ĐANG HOẠT ĐỘNG
  Thần Bí            có     từ năm 5980
  Nguyên Điểm        có     từ năm 4410
  Cố Hữu Kết Giới    không  thiếu khái niệm Nội Giới
  Vũ Khí Khái Niệm   không  Nhân Quả chưa cho chạm trừu tượng
```

**[BB]** Mục `vo_danh` hiện tham số trong ngoặc và màu `--mo` — đó là thứ đang đúng nhưng chưa ai trong thế giới biết. Mục `chưa có` phải nói rõ **còn thiếu gì**, vì đó là gợi ý chơi.

---

## PHẦN 45 — BỔ SUNG KIỂM TRA & LỘ TRÌNH

### 45.1 Thêm vào lộ trình Phần 40

| # | Nội dung | Xong khi |
|---|---|---|
| 37 | `tiepDia` + `tinhHieuLuc` + kiểm tra thứ 8 + panel Hiệu Lực | Ban một luật ở thế giới rỗng → `hieuLuc = 0`, panel giải thích rõ vì sao |
| 38 | Đánh vào khái niệm làm suy yếu luật + mạch `phuc_hung` | Làm chết khái niệm nền → luật tụt hiệu lực mà không bị bãi bỏ |
| 39 | `SubstrateLaw` bảy trục + vô danh/có tên + thứ tự phụ thuộc | Đặt tên sai thứ tự → validator bắt được |
| 40 | `khoangCach = 'y_nghia'` đổi `moRong()` | Hai đền cùng thần thành liền kề trong assembler |
| 41 | Vận Mệnh gán `ketCuc` cho `Storyline` + `chinh_viec_chong_khien_no_xay_ra` | NPC né kết cục → chính hành động né đẩy mạch tới gần hơn |
| 42 | `R.mechanism` + bốn cơ chế + phát hiện/công bố | Bật `hieuBietLamSuyYeu` → Thần Bí tự xuất hiện kèm sự kiện biên niên |
| 43 | Luật nền tự kết tinh từ khái niệm | Khái niệm Tất Yếu kết tinh → trục Vận Mệnh chuyển `co_ten`, khóa đúng hành vi sẵn có |
| 44 | Panel Vật Lý Thế Giới | Ba tầng hiện đủ; mục thiếu nói rõ thiếu gì |

### 45.2 Thêm vào kiểm tra cuối Phần 41

**Tiếp địa**
- [ ] Mọi luật có `tiepDia` không rỗng sau khi hình thức hóa
- [ ] `tinhHieuLuc` dùng **min**, không dùng trung bình
- [ ] Chế độ `tu_tiep_dia` và `tu_suy` **không bao giờ chặn** người chơi
- [ ] Panel diff hiện Hiệu Lực và dòng giải thích vì sao luật còn yếu
- [ ] Làm chết khái niệm nền → luật tụt hiệu lực nhưng **vẫn nằm trong sổ**
- [ ] Hồi sinh khái niệm nền → luật sống lại

**Luật nền**
- [ ] Bảy trục đều có trạng thái `vo_danh` mặc định hợp lệ
- [ ] Luật nền `vo_danh` **không** sinh kẽ hở, **không** khai thác được
- [ ] Chuyển sang `co_ten` bắt buộc có `khaiNiemNenId`
- [ ] Khoảnh khắc đặt tên sinh sự kiện lớn + mạch `dat_ten`
- [ ] Sửa luật nền **luôn** phân nhánh, không sửa tại chỗ
- [ ] Thứ tự phụ thuộc được validator kiểm
- [ ] `khoangCach = 'y_nghia'` thực sự đổi hành vi `moRong()`

**Cơ chế phái sinh**
- [ ] Không cơ chế nào cài cứng; tất cả trong `R.mechanism`
- [ ] Mọi `MechanismDef` có `moTaKhiKhong` không rỗng
- [ ] Điều kiện vỡ → `khiTat()` xử lý tử tế, không xóa cứng
- [ ] Công bố cơ chế viết bằng giọng biên niên sử
- [ ] Panel Vật Lý hiện rõ mục nào thiếu gì

### 45.3 Ba câu của Khối L

1. Khái niệm là từ vựng của thực tại; định luật là câu viết bằng từ vựng đó. Không viết được câu bằng từ chưa tồn tại.
2. Trước khi được đặt tên, thế giới vẫn vận hành — nhưng không ai lợi dụng được nó. Hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở.
3. Không có tính năng, chỉ có vật lý khả dĩ. Nếu người chơi không tạo điều kiện cho một cơ chế, cơ chế đó không tồn tại trong vũ trụ đó.

---

*Hết Khối L.*

---
---

# KHỐI M — CẤU HÌNH MỞ RỘNG & DIỄN HÓA TỰ ĐỘNG

> Khối này mở rộng Phần 31. Nếu có mâu thuẫn, **khối này thắng**.

## PHẦN 46 — BA ĐIỂM CUỐI AI

### 46.1 Từ hai lên ba

```ts
export const AiConfigSchema = z.object({
  narrator: AiEndpointSchema.prefault({}),
  updater:  UpdaterEndpointSchema.prefault({}),
  workflow: WorkflowEndpointSchema.prefault({}),
}).prefault({});
```

| Điểm cuối | Nhiệm vụ | Bật/tắt | Đặc tính cần |
|---|---|---|---|
| **Tường Thuật** | Viết cảnh, tường thuật kỷ nguyên, sinh lorebook, đặt tên nghiệm | Luôn bật | Văn hay, temperature cao |
| **Cập Nhật Biến** | Bóc trạng thái từ cảnh, xuất ba khối XML | **Tắt được** | Chính xác tuyệt đối, temperature ~0 |
| **Diễn Hóa** | Chạy nhiều lượt tự động để thế giới tiến hóa không cần người chơi | **Tắt được** | Rẻ, nhanh, ổn định; chất lượng văn không quan trọng |

**[BB]** Ba điểm cuối **hoàn toàn độc lập**: khác proxy, khác mật khẩu, khác model, khác tham số, khác kết quả thăm dò. Không dùng chung bất cứ thứ gì ngoài `R.profile`.

### 46.2 Cập Nhật Biến — nay tắt được [BB]

```ts
export const UpdaterEndpointSchema = AiEndpointSchema.extend({
  batRieng: z.boolean().prefault(true),
  cheDoKhiTat: z.enum(['gop_vao_narrator','chi_engine']).prefault('gop_vao_narrator'),
}).prefault({});
```

| `batRieng` | Hành vi | Đánh đổi |
|---|---|---|
| `true` (**mặc định**) | Một call riêng, model riêng, proxy riêng. Narrator chỉ viết văn thuần | Đắt gấp đôi, nhưng patch chính xác hơn hẳn |
| `false` + `gop_vao_narrator` | Narrator viết văn **và** tự xuất ba khối XML trong cùng một call | Rẻ một nửa. Model văn hay thường xuất JSON ẩu → tỉ lệ trượt patch cao hơn |
| `false` + `chi_engine` | Không bóc gì từ văn bản. Trạng thái **chỉ** đổi qua tick engine và hành động người chơi | Rẻ nhất, chặt nhất, nhưng cảnh kể ra không tác động ngược vào thế giới |

**[BB]** Khi `batRieng = false`, UI phải hiện cảnh báo mức `luu_y`:
> *"Model tường thuật sẽ vừa viết văn vừa xuất dữ liệu. Nếu tỉ lệ patch trượt vượt 15%, hãy bật lại proxy cập nhật biến riêng."*

Bảng tự chẩn đoán (Phần 39) thêm mục **27 · Tỉ lệ patch trượt** — hỏng khi > 15% trên 20 call gần nhất, kèm câu hành động cụ thể là bật `batRieng`.

**[BB]** Chế độ `chi_engine` **không** phải chế độ hỏng. Nó là chế độ chơi hợp lệ: thế giới hoàn toàn do mô phỏng quyết định, còn AI chỉ kể lại. Người chơi ưu tiên tính nhất quán tuyệt đối sẽ chọn nó.

### 46.3 UI Cài Đặt — ba cột

Ba cột kính, tiêu đề Cormorant: **"Tường Thuật"** · **"Cập Nhật Biến"** · **"Diễn Hóa"**.

Cột 2 và 3 có công tắc ở góc trên. Tắt thì cột xám lại (`--mo`), giữ nguyên giá trị đã nhập, **không** xóa.

Mỗi cột có đủ bộ điều khiển ở 31.6. Cuối trang thêm:

```
[ Sao cấu hình:  Tường Thuật → Cập Nhật Biến ▾ ]  [ Sao ]
[ Khôi phục mặc định ]      Ước tính mỗi lượt: 0.0031 · mỗi 100 lượt Diễn Hóa: 0.42
```

**[BB]** Ô ước tính chi phí phải tách riêng cho Diễn Hóa, vì nó là nơi tiền bốc hơi nhanh nhất.

---

## PHẦN 47 — DIỄN HÓA TỰ ĐỘNG [BB]

> Người chơi bấm một nút, thế giới tự chạy nhiều lượt, rồi báo cáo lại.
> Đây là phiên bản vận hành được của lời hứa "buông thế giới cho nó tự diễn hóa".

### 47.1 Schema

```ts
export const WorkflowEndpointSchema = AiEndpointSchema.extend({
  bat: z.boolean().prefault(false),

  soLuot: z.number().min(1).max(500).prefault(20),
  nhipMoiLuot: z.enum(['nien','the_dai','vinh_kiep']).prefault('nien'),
  chayNen: z.boolean().prefault(true),

  nganSach: z.object({
    callToiDa: z.number().prefault(60),
    tokenToiDa: z.number().prefault(4_000_000),
    dungKhiCan: z.boolean().prefault(true),
  }).prefault({}),

  phamViChoPhep: z.object({
    dongTu: z.array(z.string()).prefault(['HIEN','DINH','HOP','PHAN']),
    duocGiaiLoHong: z.boolean().prefault(true),
    duocKetTinhLuat: z.boolean().prefault(true),
    duocSinhMachTruyen: z.boolean().prefault(true),
    duocSinhThanMoi: z.boolean().prefault(true),
    duocGietNhanVatT2: z.boolean().prefault(true),
  }).prefault({}),

  dieuKienDung: z.array(z.string()).prefault([
    'het_luot', 'can_ngan_sach',
    'reality_tut_qua_20', 'mach_dat_cao_trao',
    'nhan_vat_nguoi_choi_lam_nguy', 'ke_thu_troi_day',
    'ky_vong_lorebook_bi_lech', 'co_che_moi_xuat_hien',
  ]),

  bacBaoCao: z.enum(['tom_tat','bien_nien','day_du']).prefault('bien_nien'),
}).prefault({});
```

### 47.2 Vòng lặp

```
Với mỗi lượt i trong 1..soLuot:
   1. engine chạy tick bước 1–11 và 14  (toán thuần, không LLM)
   2. MỘT call Diễn Hóa, gộp ba việc:
        · T2 batch (bước 12)
        · giải lỗ hổng ưu tiên cao (bước 13)
        · viết nhịp cho các mạch truyện đang sôi
      → output JSON có cấu trúc, KHÔNG phải văn kể
   3. áp patch (qua Updater nếu batRieng, hoặc parse thẳng)
   4. kiểm mọi dieuKienDung
   5. ghi một dòng vào Nhật Ký Diễn Hóa
   6. cập nhật thanh tiến trình trên UI
Kết thúc → sinh Báo Cáo Diễn Hóa
```

**[BB]** Bước 2 yêu cầu output **JSON có cấu trúc, không phải văn kể**. Diễn Hóa là mô phỏng, không phải tường thuật. Văn hay chỉ được viết khi người chơi thực sự xem — lúc đó dùng Narrator, không dùng Diễn Hóa. Đây là lý do điểm cuối này được phép dùng model rẻ.

**[BB]** Nếu profile của model Diễn Hóa hỗ trợ `structuredOutput`, **bắt buộc** dùng. Chạy 200 lượt mà mỗi lượt retry parse là thảm họa.

### 47.3 Điểm dừng thông minh

Đây là chỗ quyết định tính năng này hữu ích hay vô dụng.

**[BB]** Diễn Hóa không nên dừng khi hết số lượt. Nó nên dừng khi **có chuyện đáng xem**.

| Điều kiện dừng | Ý nghĩa |
|---|---|
| `mach_dat_cao_trao` | Một mạch truyện vừa lên cao trào — đây chính là lúc bạn muốn có mặt |
| `nhan_vat_nguoi_choi_lam_nguy` | Nhân vật của bạn sắp chết hoặc mất thứ quan trọng |
| `ke_thu_troi_day` | Kẻ thù vĩnh cửu tới nhịp |
| `ky_vong_lorebook_bi_lech` | Thế giới vừa rẽ khỏi thần thoại nguồn — sinh một Dị Bản |
| `co_che_moi_xuat_hien` | Một Cơ Chế Phái Sinh vừa đủ điều kiện tồn tại (44.4) |
| `luat_nen_duoc_dat_ten` | Có kẻ vừa khái niệm hóa được một trục nền |
| `reality_tut_qua_20` | Thực tại đang rách nhanh |
| `than_mat_domain` | Một vị thần vừa mất vĩnh viễn một domain |
| `phuc_but_qua_han` | Có phục bút quá hạn chưa trả |

**[BB]** Khi dừng vì một điều kiện, báo cáo phải **mở thẳng vào chỗ đó** và mời người chơi xem cảnh đầy đủ bằng Narrator. Đó là toàn bộ giá trị của tính năng: bạn không xem một trăm năm, bạn xem đúng ba khoảnh khắc đáng xem trong một trăm năm đó.

### 47.4 Lằn ranh cứng [BB]

Diễn Hóa **không bao giờ** được phép, bất kể cấu hình:

- Sửa **Luật Nền** (Phần 43) — đó là tai họa vũ trụ, phải do người chơi quyết
- Dùng **Vũ Khí Khái Niệm** (44.3)
- Kích hoạt bất kỳ **kết cục** nào ở 27.1
- **Hợp nhánh** hoặc tạo nhánh mới
- Sửa `tuning`, `R.*`, hoặc bất kỳ cấu hình nào
- Xóa cứng entity — chỉ được `tickDiet`, không được xóa record
- Trả lời lời cầu nguyện thay người chơi

**[BB]** Giết nhân vật người chơi phải là một công tắc riêng, mặc định **tắt**:

```ts
duocGietNhanVatNguoiChoi: z.boolean().prefault(false),
```

Bật nó lên là chế độ khắc nghiệt: bạn tua một trăm năm và có thể quay lại thấy mình đã chết từ năm thứ ba. Hợp lệ, nhưng phải cố ý chọn.

### 47.5 Nhật ký và hoàn tác

```ts
export const EvolutionLogSchema = z.object({
  id: z.string(), branchId: z.string(),
  tickBatDau: z.number(), tickKetThuc: z.number(),
  soLuotChay: z.number(), soCall: z.number(), tokenDaDung: z.number(),
  lyDoDung: z.string(),
  suKienLon: z.array(z.object({
    tick: z.number(), moTa: z.string(), loai: z.string(),
    entityIds: z.array(z.string()).prefault([]),
    daXemChiTiet: z.boolean().prefault(false),
  })).prefault([]),
  anhChup: z.string(),          // id snapshot trước khi chạy
}).prefault({});
```

**[BB]** Chụp ảnh trạng thái **trước** khi chạy, và cho phép **hoàn tác nguyên lô**. Chạy hai trăm năm rồi phát hiện thế giới đi hướng mình ghét là chuyện sẽ xảy ra. Không có nút lùi thì tính năng này đáng sợ hơn đáng dùng.

**[KN]** Ngoài hoàn tác, cho phép **fork từ ảnh chụp** — giữ cả kết quả Diễn Hóa lẫn nhánh gốc. Hợp với hệ nhánh đã có.

### 47.6 Báo Cáo Diễn Hóa

Viết bằng **giọng biên niên sử**, không phải giọng log.

```
DIỄN HÓA · năm 4820 – 4931 · 111 năm · 34 lượt · 34 call · 1.2M token

Dừng vì: Mạch Ly Giáo Sông Đen vừa lên cao trào.

Trong khoảng ấy, bảy điều đáng ghi:

  4834  Nghi lễ Tẩy Tro lan tới ba lưu vực. Khái niệm Ô Uế
        vượt ngưỡng và kết tinh — thành luật, không thành thần.
        [ xem cảnh ]

  4867  Khonsu mất domain "đêm" vào tay một vị thần mới tên Sekhet-ur,
        sinh ra từ chính nghi lễ trên.
        [ xem cảnh ]

  4901  Một người chép sách ở Kemet viết câu đầu tiên về việc mọi thứ
        đều đi từ trước tới sau và không quay lại. Ông không biết
        mình vừa làm gì.
        → Trục Thời Gian chuyển sang có tên.
        [ xem cảnh ]

  ...

Thực tại: 96 → 88        Sống động: 71 → 78
Lỗ hổng đã lấp: 23       Còn treo: 6       Thành bí ẩn: 2
Dị Bản mới: 1 — "Ra không còn đứng đầu thần điện"

                                    [ Hoàn tác ]  [ Fork ]  [ Tiếp tục chơi ]
```

**[BB]** Mỗi mục có nút `[ xem cảnh ]` gọi Narrator dựng lại khoảnh khắc đó ở chất lượng đầy đủ. Diễn Hóa chạy bằng model rẻ; xem lại chạy bằng model tốt. Đây là chỗ hai điểm cuối phối hợp.

### 47.7 UI khi đang chạy

Chạy nền, không khóa giao diện. Một thanh mảnh trên đỉnh Sảnh:

```
Diễn hóa · năm 4867 / 4931 · 18/34 lượt · ~0.24 đã dùng      [ dừng ]
```

**[BB]** Nút dừng phải dừng **ngay sau lượt hiện tại**, không hủy giữa chừng. Hủy giữa chừng để lại patch áp một nửa.

---

## PHẦN 48 — KHÓA NGOÀI CẢNH [BB]

### 48.1 Vấn đề

Updater nhìn thấy toàn bộ ngữ cảnh, gồm hồ sơ của 30 nhân vật T2. Không có gì ngăn nó xuất patch cho một nhân vật **không hề xuất hiện trong cảnh vừa kể**. Kết quả: nhân vật đổi tâm trạng, đổi quan hệ, thậm chí chết, mà không có một dòng văn nào giải thích.

Đây là dạng ảo giác khó phát hiện nhất, vì mỗi patch riêng lẻ đều hợp lệ về schema.

### 48.2 Hai chế độ [MR]

```ts
export const OffSceneSchema = z.object({
  cheDo: z.enum(['engine_van_chay','tu_do']).prefault('engine_van_chay'),
  choPhepNgoaiLe: z.boolean().prefault(true),
}).prefault({});
```

| Chế độ | Engine tick có chạm NPC ngoài cảnh | AI có chạm | Dùng khi |
|---|---|---|---|
| `engine_van_chay` (**mặc định**) | **Có** | **Không** | Đúng triết lý của dự án: engine giữ số, AI giữ lời |
| `tu_do` | Có | Có | Linh hoạt nhất, ảo giác nhiều nhất. Chỉ dùng khi gỡ lỗi |

**[BB] KHÔNG CÓ CHẾ ĐỘ ĐÓNG BĂNG. Không bao giờ được implement một chế độ khiến NPC đứng yên khi vắng mặt.** Đó là chính cái hành vi mà toàn bộ dự án này tồn tại để chống lại. Ở cả hai chế độ, utility AI (Phần 23) vẫn cử động toàn bộ NPC T1 và T2 mỗi tick, dù có ai nhìn hay không.

Cái bị khóa **chỉ là quyền của AI được bịa thay đổi cho nhân vật nó không hề kể tới**. Engine không bị khóa gì cả.

Nếu agent thấy mình đang viết một nhánh code làm NPC ngừng cập nhật vì họ không có trong output, đó là bug — quay lại đọc Phần 23 và 25.

### 48.3 Cơ chế

Updater trả thêm một khối thứ tư:

```xml
<OnScene>
["e.ankhtu", "e.sekhet_ur", "e.den_song_den"]
</OnScene>
```

```
1. Dựng danh sách cho phép:
     OnScene
   + entity người chơi vừa tác động trực tiếp
   + entity được nêu đích danh trong hành động của người chơi
2. Mọi patch trỏ tới entity NGOÀI danh sách → TỪ CHỐI, ghi log
3. Ngoại lệ luôn được phép (nếu choPhepNgoaiLe):
     · chỉ số thế giới (realityIntegrity, doSongDong...)
     · trọng số Khái Niệm
     · trạng thái Mạch Truyện
     · Sổ Nhân Quả, Sổ Phục Bút
     · thu hoạch danh từ
```

**[BB]** Khối `<OnScene>` do **Updater** trả, không do Narrator. Updater đọc văn bản và liệt kê ai thật sự có mặt — đó là một tác vụ trích xuất, đúng sở trường của model chính xác.

**[BB]** Khi `batRieng = false` (46.2), Narrator phải tự trả cả bốn khối. Tỉ lệ trượt sẽ cao hơn; đó là một lý do nữa để bật proxy riêng.

### 48.4 Đối chiếu với triết lý

Chế độ mặc định làm rõ một ranh giới đã ngầm có từ đầu:

> **NPC trên sân khấu do AI cử động. NPC ngoài sân khấu do engine cử động.**
> **Không ai được cử động cả hai.**

Đây là mở rộng tự nhiên của nguyên tắc 1. Nó cũng giải thích vì sao utility AI (Phần 23) phải mạnh: nó là thứ duy nhất giữ cho vài trăm NPC ngoài cảnh tiếp tục sống.

### 48.5 Chẩn đoán

Thêm vào Phần 39:

| # | Kiểm | Hỏng khi |
|---|---|---|
| 27 | Tỉ lệ patch trượt | > 15% trên 20 call gần nhất → gợi ý bật `batRieng` |
| 28 | Patch bị khóa ngoài cảnh | > 25% patch bị từ chối → Updater đang bịa nhiều, kiểm prompt |
| 29 | Ngân sách Diễn Hóa | Một lần chạy vượt 80% `tokenToiDa` |
| 30 | Diễn Hóa vượt lằn ranh | Có bất kỳ patch nào chạm Luật Nền, kết cục, hoặc nhánh — **hỏng nặng** |

**[BB]** Mục 28 rất hữu ích khi gỡ lỗi: tỉ lệ từ chối cao không có nghĩa khóa đang sai, mà có nghĩa **Updater đang bịa** — và trước khi có khóa thì những patch đó đã lặng lẽ vào database.

---

## PHẦN 49 — BỔ SUNG LỘ TRÌNH & KIỂM TRA

### 49.1 Thêm vào lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 45 | Điểm cuối thứ ba + UI ba cột + công tắc | Tắt Cập Nhật Biến → Narrator tự xuất bốn khối, vẫn chạy |
| 46 | Chế độ `chi_engine` | Trạng thái chỉ đổi qua tick, cảnh kể ra không tác động ngược |
| 47 | Khối `<OnScene>` + ba chế độ Khóa Ngoài Cảnh | Chế độ `engine_van_chay`: patch cho NPC vắng mặt bị từ chối, nhưng utility AI vẫn cử động họ |
| 48 | Vòng lặp Diễn Hóa + governor + chụp ảnh | Chạy 50 lượt nền, không khóa UI, hoàn tác nguyên lô được |
| 49 | Chín điều kiện dừng thông minh | Dừng đúng lúc mạch lên cao trào, mở thẳng vào chỗ đó |
| 50 | Báo Cáo Diễn Hóa + `[ xem cảnh ]` | Mỗi sự kiện lớn dựng lại được bằng Narrator ở chất lượng đầy đủ |
| 51 | Lằn ranh cứng | Cố ép Diễn Hóa sửa Luật Nền → bị chặn, ghi chẩn đoán mục 30 |

### 49.2 Thêm vào kiểm tra cuối

- [ ] Ba điểm cuối độc lập hoàn toàn, không dùng chung state
- [ ] Tắt điểm cuối giữ nguyên giá trị đã nhập, không xóa
- [ ] `batRieng = false` hiện cảnh báo và vẫn chạy được
- [ ] `chi_engine` là chế độ hợp lệ, không bị coi là lỗi
- [ ] Diễn Hóa yêu cầu output JSON có cấu trúc, không phải văn kể
- [ ] Có `structuredOutput` thì bắt buộc dùng cho Diễn Hóa
- [ ] Diễn Hóa chạy nền, không khóa UI
- [ ] Nút dừng dừng sau lượt hiện tại, không hủy giữa chừng
- [ ] Chụp ảnh trước khi chạy; hoàn tác nguyên lô hoạt động
- [ ] Diễn Hóa **không** chạm được Luật Nền, kết cục, nhánh, cấu hình
- [ ] `duocGietNhanVatNguoiChoi` mặc định **tắt**
- [ ] Báo cáo viết bằng giọng biên niên sử, mỗi mục có `[ xem cảnh ]`
- [ ] Khối `<OnScene>` do Updater trả, không do Narrator
- [ ] Chế độ mặc định `engine_van_chay`: AI không chạm NPC vắng mặt, engine vẫn chạy
- [ ] Ngoại lệ (chỉ số, khái niệm, mạch truyện, hai cuốn sổ) luôn được phép
- [ ] Bốn mục chẩn đoán mới hoạt động

### 49.3 Hai câu của Khối M

1. Diễn Hóa chạy bằng model rẻ và output có cấu trúc; xem lại chạy bằng model tốt và output là văn. Không lẫn hai việc.
2. NPC trên sân khấu do AI cử động; NPC ngoài sân khấu do engine cử động. Không ai được cử động cả hai.

---

*Hết Khối M.*

---
---

# KHỐI N — WORKFLOW THEO TÁC VỤ

> **Khối này thay thế Phần 47.2.** Phần 47 giữ nguyên phần điểm dừng thông minh, lằn ranh cứng, nhật ký, báo cáo. Riêng vòng lặp một-call được thay bằng kiến trúc đường ống nhiều tác vụ dưới đây.
>
> Tham khảo: *酒馆助手脚本 · 工作流助手 v0.0.18* — một script TavernHelper giải đúng bài toán này trong hệ SillyTavern. Kiến trúc dưới đây phỏng theo nó và ánh xạ sang mô hình Thiên Diễn.

## PHẦN 50 — ĐƯỜNG ỐNG TÁC VỤ

### 50.1 Vì sao đổi

Phần 47.2 gộp mọi việc vào một call. Sai ở ba điểm:

1. **Mỗi việc cần một model khác nhau.** Sàng lọc nhân vật cần model rẻ và nhanh. Viết thời cục thế giới cần model biết suy luận. Xuất patch cần model tuân thủ format. Một call thì phải chọn model tệ nhất cho việc khó nhất.
2. **Mỗi việc có nhịp khác nhau.** Hành động NPC nên chạy mỗi lượt. Bản tin kinh tế thế giới nên chạy mỗi tuần trong truyện, bất kể có bao nhiêu lượt chat. Sổ sách nên chạy mỗi ba lượt.
3. **Mỗi việc cần ngữ cảnh khác nhau.** Sàng lọc nhân vật chỉ cần biết ai đang ở đâu. Bản tin kinh tế không cần biết hội thoại.

Đường ống tác vụ giải cả ba.

### 50.2 Schema tác vụ

```ts
export const WorkflowTaskSchema = z.object({
  id: z.string(),
  ten: z.string(),
  bat: z.boolean().prefault(true),
  giaiDoan: z.number().min(1).prefault(1),        // stage — thứ tự chạy

  // ── Prompt ghép từ nhóm có vai trò ──
  nhomPrompt: z.array(z.object({
    ten: z.string(),
    vaiTro: z.enum(['system','user','assistant']),
    noiDung: z.string(),                           // CHỨA EJS
    bat: z.boolean().prefault(true),
  })).prefault([]),

  // ── Điểm cuối riêng cho tác vụ này ──
  apiPresetName: z.string().prefault(''),          // rỗng = dùng preset mặc định của Diễn Hóa
  apiPresetDuPhong: z.array(z.string()).prefault([]),   // chuỗi dự phòng khi lỗi
  modelDeXuat: z.string().prefault(''),            // gợi ý hiển thị cho người dùng
  soLuongSongSong: z.number().min(1).max(16).prefault(4),

  // ── Chất lượng ──
  soLanThuLai: z.number().min(0).max(6).prefault(3),
  doDaiToiThieu: z.number().prefault(0),           // ngắn hơn → coi như trượt, thử lại
  cachGop: z.enum(['noi','ghi_de','gop_json']).prefault('noi'),

  // ── Lập lịch ──
  lich: WorkflowScheduleSchema.nullable().prefault(null),   // null = mỗi lượt

  // ── Ngữ cảnh ──
  cheDoNguCanh: z.enum(['ke_thua','rieng']).prefault('ke_thua'),
  nguCanhRieng: TaskContextSchema.prefault({}),

  // ── Output ──
  theTrichXuat: z.array(z.string()).prefault([]),  // tag nào bóc ra từ output
  cheDoCoNhau: z.enum(['tat','json_patch','json_schema']).prefault('tat'),
  quyTacCoNhau: z.record(z.string(), z.string()).prefault({}),

  // ── Họ bản sao: liệt kê rồi xử lý song song ──
  hoBanSao: z.object({
    bat: z.boolean().prefault(false),
    nguonLietKe: z.string().prefault(''),          // biểu thức trả về mảng id
    bienThayThe: z.string().prefault('MUC'),       // placeholder trong prompt
  }).prefault({}),

  dichGhi: z.array(WriteTargetSchema).prefault([]),
}).prefault({});
```

**[BB]** `nhomPrompt` phải là **mảng có tên và vai trò**, không phải một chuỗi lớn. Người dùng cần bật tắt từng nhóm để gỡ lỗi — đây là điểm khác biệt lớn giữa một workflow dùng được và một workflow không gỡ được.

**[KN]** Nên có một nhóm `assistant` cuối cùng làm **mồi định dạng** (prefill) — nội dung là phần mở đầu của định dạng mong muốn, ép model vào khuôn ngay từ token đầu. Script tham khảo gọi nhóm này là *卡COT*, và nó giảm tỉ lệ trượt parse rất mạnh.

### 50.3 Giai đoạn, song song, họ bản sao

**Giai đoạn:** tác vụ cùng `giaiDoan` chạy **song song**; giai đoạn sau chờ giai đoạn trước xong. Output giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau.

**Họ bản sao** — mẫu "liệt kê rồi xử lý từng cái":

```
hoBanSao.bat = true
nguonLietKe = "top(view.entities.T2, 30, 'spotlight').map(e => e.id)"
bienThayThe = "MUC"

→ engine sinh 30 lời gọi, mỗi lời thay {{MUC}} bằng một id
→ chạy theo lô, mỗi lô soLuongSongSong cái
→ gộp kết quả theo cachGop
```

**[BB]** Đây là cách đúng để xử lý 30 nhân vật T2: **không** nhồi cả 30 vào một prompt. Chia 30 call nhỏ, chạy 4–5 cái một lúc, mỗi call chỉ chứa ngữ cảnh của một nhân vật. Rẻ hơn, chính xác hơn, và một cái hỏng không kéo sập 29 cái kia.

**[BB]** Chuỗi dự phòng `apiPresetDuPhong` chạy khi preset chính lỗi hoặc quá tải. Mỗi bậc dự phòng có `soLuongSongSong` riêng — proxy dự phòng thường yếu hơn nên phải hạ.

### 50.4 Lập lịch [BB]

```ts
export const WorkflowScheduleSchema = z.object({
  cheDo: z.enum(['moi_luot','theo_luot','theo_thoi_gian_truyen','theo_su_kien']),

  soLuot: z.number().min(1).prefault(3),           // cheDo = theo_luot

  thoiGianTruyen: z.object({
    giaTri: z.number().prefault(1),
    donVi: z.enum(['gio','ngay','tuan','thang','nam','the_dai']).prefault('tuan'),
    nguonThoiGian: z.object({
      loai: z.enum(['tick_engine','the_trong_van_ban']).prefault('tick_engine'),
      tenThe: z.array(z.string()).prefault([]),     // vd ['tp','time']
      pham_vi: z.enum(['ai_hien_tai','toan_bo']).prefault('ai_hien_tai'),
    }).prefault({}),
    khiParseLoi: z.enum(['bo_qua','chay_luon','dung']).prefault('bo_qua'),
  }).prefault({}),

  suKien: z.array(z.string()).prefault([]),        // cheDo = theo_su_kien
}).prefault({});
```

**Chế độ `theo_thoi_gian_truyen` là chế độ quan trọng nhất** và là thứ mình đã bỏ sót ở Phần 47.

Bản tin kinh tế thế giới nên chạy **một lần mỗi tuần trong truyện** — không phải mỗi ba lượt chat. Nếu người chơi dành hai mươi lượt để kể một buổi tối, kinh tế thế giới không được nhúc nhích. Nếu người chơi tua một thế kỷ trong một lượt, nó phải chạy rất nhiều lần.

**[BB]** Với Thiên Diễn, `nguonThoiGian.loai` mặc định là `tick_engine` — engine đã có đồng hồ chuẩn, không cần parse văn bản. Chế độ `the_trong_van_ban` chỉ dùng khi nhập workflow từ hệ khác.

`khiParseLoi = 'bo_qua'` là mặc định an toàn: không đọc được thời gian thì bỏ lượt này, **không** chạy bừa.

**Chế độ `theo_su_kien`** móc vào chính chín điều kiện dừng ở 47.3: một tác vụ chỉ chạy khi kẻ thù trỗi dậy, khi một mạch lên cao trào, khi một Cơ Chế Phái Sinh vừa xuất hiện.

### 50.5 Ngữ cảnh riêng cho từng tác vụ [BB]

```ts
export const TaskContextSchema = z.object({
  soLuotLichSu: z.number().prefault(5),
  quyTacTrich: z.array(z.object({
    batDau: z.string(), ketThuc: z.string(),
  })).prefault([]),                                 // CHỈ lấy phần giữa hai mốc
  quyTacLoaiTru: z.array(z.object({
    batDau: z.string(), ketThuc: z.string(),
  })).prefault([]),
  tangAssembler: z.array(z.number()).prefault([1,2,3,4,5,6]),   // tầng nào của Phần 33
  soKyUcGoiLai: z.number().prefault(10),
  lorebookRieng: z.object({
    cheDo: z.enum(['ke_thua','tu_chon','tat']).prefault('ke_thua'),
    lorebookIds: z.array(z.string()).prefault([]),
  }).prefault({}),
}).prefault({});
```

`quyTacTrich` là công cụ tiết kiệm token mạnh nhất ở đây: thay vì nạp cả lịch sử chat, chỉ bóc phần nằm giữa hai mốc. Tác vụ kinh tế chỉ cần các khối `<thoi_gian>` và `<kinh_te>` trong các lượt trước, không cần một dòng hội thoại nào.

**[BB]** `tangAssembler` cho phép tác vụ tắt hẳn những tầng ngữ cảnh không cần. Tác vụ sàng lọc nhân vật không cần tầng 1 (vũ trụ luận) hay tầng 2 (mythos pack) — bỏ hai tầng đó là bỏ 50–110k token mỗi call.

Nhưng cẩn thận: bỏ tầng 1–3 cũng là bỏ **prefix cache**. Chỉ đáng làm khi tác vụ đó chạy ít lần và ngữ cảnh nặng; với tác vụ chạy mỗi lượt thì giữ nguyên tầng 1–3 để ăn cache thường rẻ hơn.

### 50.6 Output có cấu trúc

```ts
cheDoCoNhau: 'tat' | 'json_patch' | 'json_schema'
```

**`json_patch`** — dùng JSON Patch (RFC 6902) mở rộng, hợp với mô hình MVU:

| Op | Nghĩa |
|---|---|
| `replace` | Đặt giá trị |
| `delta` | Cộng/trừ tương đối — **thiết yếu** cho trọng số khái niệm, cảm xúc, `domainStrength` |
| `insert` | Chèn vào mảng ở vị trí chỉ định |
| `remove` | Xóa |
| `move` | Di chuyển giữa hai đường dẫn |

**[BB]** `delta` là op quan trọng nhất và không có trong RFC gốc. Không có nó thì model phải tự tính giá trị tuyệt đối, và nó sẽ tính sai. Trong Thiên Diễn, `delta` ánh xạ thẳng sang `{_op:'add', _v:n}` ở 31.7.

**[BB]** Prompt của quy tắc output có cấu trúc phải nói rõ: **chỉ xuất một JSON hợp lệ, không rào markdown, không tiền tố, không hậu tố**. Đây là chỗ trượt nhiều nhất khi chạy hàng trăm call.

### 50.7 Ba đích ghi [BB]

```ts
export const WriteTargetSchema = z.object({
  loai: z.enum(['chen_vao_canh','bien_theo_luot','ghi_lorebook','patch_world']),

  // chen_vao_canh
  mauChen: z.string().prefault(''),                 // EJS

  // ghi_lorebook
  lorebookNguon: z.enum(['nhan_vat','the_gioi','chi_dinh']).prefault('the_gioi'),
  lorebookId: z.string().prefault(''),
  tenEntry: z.string().prefault(''),
  loaiEntry: z.enum(['constant','keyword']).prefault('constant'),
  keys: z.string().prefault(''),
  viTri: z.object({
    position: z.string().prefault('after_character_definition'),
    depth: z.number().prefault(1),
    order: z.number().prefault(99999),
  }).prefault({}),
  chongDeQuy: z.boolean().prefault(true),
  tachTheoThuocTinh: z.boolean().prefault(false),
}).prefault({});
```

Đích `ghi_lorebook` là đích đáng giá nhất và mình đã bỏ sót hoàn toàn ở Phần 47.

Một tác vụ chạy xong không chỉ patch state — nó **ghi kết quả vào một entry lorebook thường trực**. Nghĩa là bản tin thời cục thế giới tự viết vào lorebook, và mọi call sau đó đều thấy nó mà không cần ai truyền tay.

**Đây chính là cơ chế "thế giới tự viết lorebook cho chính nó" ở Phần 35.8, nhưng chạy liên tục thay vì mỗi kỷ nguyên một lần.**

**[BB]** `chongDeQuy = true` là bắt buộc cho mọi entry do workflow ghi. Không có nó, entry tự sinh sẽ kích hoạt keyword của chính nó và vòng lặp sẽ nổ.

### 50.8 Preset workflow [MR]

Toàn bộ cấu hình — danh sách tác vụ, mẫu chèn, quy tắc ngữ cảnh, quy tắc ghi lorebook — đóng gói thành một preset đổi được trong một cú click.

```ts
export const WorkflowPresetSchema = z.object({
  ten: z.string(),
  moTa: z.string().prefault(''),
  tasks: z.array(WorkflowTaskSchema).prefault([]),
  mauChenCuoi: z.string().prefault(''),
  mauBienThe: z.string().prefault(''),
  nguCanhChung: TaskContextSchema.prefault({}),
  quyTacGhiLorebook: z.array(WriteTargetSchema).prefault([]),
}).prefault({});
```

Preset dựng sẵn đề nghị: `trong` (rỗng, để tự dựng) · `engine_hau_truong` (đủ bảy tác vụ ở 50.9) · `chi_npc` (chỉ chạy hành động NPC, rẻ nhất) · `chi_the_gioi` (chỉ vĩ mô, bỏ NPC) · `nen_ky_nguyen` (chỉ chạy cuối kỷ nguyên).

**[BB]** Cho phép **xuất/nhập preset dưới dạng một file JSON duy nhất**. Đây là cách cộng đồng chia sẻ workflow, và là lý do lớn khiến script tham khảo được dùng rộng.

### 50.9 Bảy tác vụ dựng sẵn cho Thiên Diễn

| Stage | Tác vụ | Lịch | Model gợi ý | Output |
|---|---|---|---|---|
| 1 | **Sàng lọc hiện diện** — ai thật sự đang ở đâu, ai đủ điều kiện hành động lượt này | mỗi lượt | rẻ, nhanh | Danh sách id + lý do |
| 2 | **Hành động NPC** — T2 batch, **bật họ bản sao**, một call một nhân vật | mỗi lượt | rẻ | `npc@act` + `UpdateVariable` |
| 3 | **Nhịp mạch truyện** — viết nhịp cho mạch đang sôi | mỗi lượt | trung | `storyline_beat` + `Foreshadow` |
| 4 | **Thời cục thế giới** — kinh tế, chiến tranh, di cư, dịch bệnh, tôn giáo | **thời gian truyện: 1 tuần** | biết suy luận | `UpdateVariable` + **ghi lorebook** |
| 5 | **Giải lỗ hổng** — gộp tối đa 8 gap ưu tiên cao | theo lượt: 3 | trung | Entity mới + link |
| 6 | **Sổ sách & chỉ số** — `realityIntegrity`, `agency`, `doSongDong`, ngân sách | theo lượt: 3 | rẻ | `UpdateVariable` + **ghi lorebook** |
| 7 | **Kết tinh & thanh tra** — cụm luật, mâu thuẫn, Dị Hóa, nén biên niên | theo sự kiện: `het_ky_nguyen` | tốt nhất | Luật mới + biên bản + **lorebook kỷ nguyên** |

**[BB]** Stage 2 **bắt buộc bật họ bản sao**. Nhồi 30 nhân vật vào một prompt là cách chắc chắn nhất để có 30 hành động na ná nhau — model sẽ tự động làm chúng đồng nhất. Ba mươi call riêng biệt cho ra ba mươi nhân vật khác nhau, và đó là toàn bộ mục đích của tầng T2.

**[BB]** Stage 4 dùng lịch thời gian truyện, **không** dùng lịch theo lượt. Đây là khác biệt then chốt với Phần 47.

**[BB]** Stage 7 dùng model tốt nhất, chạy hiếm nhất. Nó là tác vụ duy nhất được phép kết tinh luật mới — và luật mới ảnh hưởng vĩnh viễn, nên không được giao cho model rẻ.

### 50.10 Lằn ranh giữ nguyên

Mọi lằn ranh ở 47.4 áp dụng cho **từng tác vụ**, không chỉ cho vòng lặp tổng. Không tác vụ nào — kể cả stage 7 — được sửa Luật Nền, dùng Vũ Khí Khái Niệm, kích hoạt kết cục, tạo nhánh, hay sửa cấu hình.

**[BB]** Thêm một lằn ranh mới: **không tác vụ nào được ghi vào lorebook do người dùng nhập tay.** Chỉ được ghi vào lorebook `nguon = 'tu_sinh'`. Người chơi soạn lorebook của mình và không bao giờ phải lo bị workflow viết đè lên.

### 50.11 UI Xưởng Workflow

Ba cột: danh sách tác vụ theo giai đoạn (kéo thả đổi stage) · trình soạn tác vụ (nhóm prompt bật tắt được, có xem trước EJS và đếm token) · nhật ký chạy thử.

Mỗi tác vụ hiện: lịch kế tiếp, model đang dùng, chi phí trung bình mỗi lần, tỉ lệ thử lại.

Nút **"Chạy thử tác vụ này"** chạy đúng một tác vụ với state hiện tại, hiện prompt cuối cùng và output thô — không áp patch. Đây là công cụ gỡ lỗi quan trọng nhất của cả màn hình.

Nút **"Chạy lại workflow"** chạy lại toàn bộ đường ống cho lượt vừa rồi, ghi đè kết quả cũ.

### 50.12 Bổ sung chẩn đoán

| # | Kiểm | Hỏng khi |
|---|---|---|
| 31 | Tác vụ trượt liên tục | Một tác vụ dùng hết `soLanThuLai` trong 3 lượt liên tiếp |
| 32 | Chuỗi dự phòng | Preset chính lỗi > 30% số call |
| 33 | Lịch thời gian truyện | `khiParseLoi` kích hoạt > 5 lần liên tiếp — nguồn thời gian sai |
| 34 | Họ bản sao | Số call thực tế lệch > 20% so với số mục liệt kê |
| 35 | Đệ quy lorebook | Entry do workflow ghi kích hoạt chính nó |
| 36 | Ghi đè lorebook người dùng | Có bất kỳ ghi nào vào lorebook `nguon = 'nguoi_dung'` — **hỏng nặng** |

### 50.13 Bổ sung lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 52 | `WorkflowTask` + giai đoạn + chạy song song | Bốn tác vụ hai giai đoạn chạy đúng thứ tự, giai đoạn 1 song song |
| 53 | Họ bản sao | 30 nhân vật T2 → 30 call, lô 5, kết quả gộp đúng |
| 54 | Bốn chế độ lịch | Tác vụ thời cục chạy đúng một lần mỗi tuần truyện, bất kể số lượt chat |
| 55 | Ngữ cảnh riêng + `quyTacTrich` + `tangAssembler` | Tác vụ kinh tế chạy với < 15k token thay vì > 100k |
| 56 | `json_patch` với op `delta` | Trọng số khái niệm cộng dồn đúng qua nhiều tác vụ |
| 57 | Đích `ghi_lorebook` + chống đệ quy | Bản tin thời cục tự ghi vào entry thường trực, không tự kích hoạt |
| 58 | Preset workflow + xuất/nhập JSON | Xuất một preset, nhập lại ở save khác, chạy y hệt |
| 59 | Chuỗi dự phòng API + đồng thời theo bậc | Tắt proxy chính giữa chừng → tự chuyển dự phòng, không mất lượt |
| 60 | Xưởng Workflow + "Chạy thử tác vụ này" | Xem được prompt cuối cùng và output thô mà không áp patch |

### 50.14 Ba câu của Khối N

1. Mỗi tác vụ một model, một nhịp, một ngữ cảnh. Gộp tất cả vào một call là chọn model tệ nhất cho việc khó nhất.
2. Ba mươi nhân vật thì ba mươi call. Nhồi chung một prompt sẽ cho ra ba mươi bản sao của cùng một người.
3. Bản tin thế giới chạy theo thời gian trong truyện, không theo số lượt chat. Hai mươi lượt kể một buổi tối thì kinh tế không được nhúc nhích.

---

*Hết Khối N. Bộ đặc tả hoàn chỉnh v2.1.*

---
---

# KHỐI O — LOREBOOK NÂNG CAO & HỆ RAG

> Khối này vá một lỗ hổng thật trong Khối I: spec cũ có lorebook người dùng nhập **và** lorebook tự sinh cùng chạy, nhưng **chưa hề nói chúng va nhau thì sao**.

## PHẦN 51 — XUNG ĐỘT LOREBOOK

### 51.1 Sáu kiểu xung đột

Có. Chúng xung đột, theo sáu cách, và bốn cách nguy hiểm.

| # | Kiểu | Ví dụ | Mức |
|---|---|---|---|
| A | **Mâu thuẫn nội dung** | Lorebook Ai Cập: "Ra cai trị thần điện". Sử kỷ nguyên 3: "Khonsu cai trị". Cả hai cùng lớp `loi`, cùng được nạp | **Nặng** |
| B | **Đụng keyword** | Entry người dùng khóa "Kemet", entry tự sinh cũng khóa "Kemet". Cả hai cùng bắn, gấp đôi token | Vừa |
| C | **Đụng `order`** | Entry tự sinh chiếm số thứ tự người dùng đã sắp cẩn thận | Nhẹ |
| D | **Ô nhiễm nguồn** | Sử kỷ nguyên 3 sinh ra từ một thế giới đã lệch; kỷ nguyên 4 sinh từ thế giới lệch hơn. **Độ lệch tăng theo cấp số** | **Nặng** |
| E | **Vòng tự khẳng định** | Sử nói X → AI đọc → AI kể X nhiều hơn → sử kỷ nguyên sau nói X mạnh hơn. Chạy mất kiểm soát | **Nặng** |
| F | **Kỳ vọng đã chết vẫn kéo** | `LoreExpectation` đã `bat_kha` nhưng văn bản entry gốc vẫn được nạp → AI vẫn cứ kể Ra đang cai trị | **Nặng** |

Kiểu F là kiểu tinh vi nhất và chắc chắn sẽ xảy ra nếu không xử lý: Ra đã bị thu hồi từ năm 1180, nhưng câu "Ra cai trị thần điện" vẫn nằm trong lớp thường trực, nên mọi cảnh vẫn nhắc Ra như đương kim chủ tể.

### 51.2 Nguyên tắc Sử Thắng Nguồn [BB]

> **Lorebook người dùng nhập là NGUỒN — điều thế giới lẽ ra phải trở thành.**
> **Lorebook tự sinh là SỬ — điều thế giới đã thực sự trở thành.**
> **Khi hai cái mâu thuẫn, SỬ luôn thắng.**

Thứ tự ưu tiên khi nạp ngữ cảnh, cao xuống thấp:

```
1. Sự thật engine (world state)     — tuyệt đối, không thương lượng
2. SỬ      (nguon = 'tu_sinh')      — điều đã xảy ra
3. DI SẢN  (nguon = 'di_san')       — điều đã xảy ra ở vòng trước, đã bóp méo
4. NGUỒN   (nguon = 'nguoi_dung')   — điều lẽ ra phải xảy ra
```

**[BB]** Đây **không** phải là hạ thấp lorebook người dùng. Nguồn vẫn giữ nguyên vai trò lực hấp dẫn ở 35.4 — nó vẫn kéo thế giới về phía nó qua hệ lỗ hổng. Nhưng khi thế giới đã thực sự đi hướng khác, **không được nói dối về chuyện đã rồi.**

### 51.3 Đối soát entry [BB]

Cuối mỗi kỷ nguyên, ngay sau khi sinh sử, chạy một lượt đối soát.

```ts
export function doiSoatEntry(entryMoi: LorebookEntry, w: World): DoiSoat[] {
  // 1. Tìm entry ứng viên va chạm:
  //      - giao keys hoặc secondaryKeys
  //      - hoặc cùng nói về một entity (qua bảng chuDe, xem 53.4)
  // 2. Với mỗi cặp, phân loại quan hệ
  // 3. Áp xử lý theo bảng dưới
}
```

| Quan hệ | Nghĩa | Xử lý |
|---|---|---|
| `bo_sung` | Nói về mặt khác của cùng chủ đề | Giữ cả hai. Nối link `bo_sung_cho` |
| `lam_ro` | Cái mới cụ thể hơn cái cũ | Giữ cả hai, hạ `uuTien` cái cũ |
| `trung_lap` | Nói y hệt | **Gộp**. Giữ bản ưu tiên cao hơn, chuyển keys của bản kia sang |
| `mau_thuan` | Khẳng định trái ngược nhau | **Che** bản ưu tiên thấp hơn |

```ts
// bổ sung vào LorebookEntrySchema
trangThai: z.enum(['hoat_dong','bi_che','da_xoa']).prefault('hoat_dong'),
biCheBoiId: z.string().nullable().prefault(null),
lyDoChe: z.string().prefault(''),
tickChe: z.number().nullable().prefault(null),
khoaCanon: z.boolean().prefault(false),
chuDe: z.array(z.string()).prefault([]),           // entity id entry này nói về
```

**[BB] Che không phải xóa.** Entry bị che:
- **Không** được nạp vào ngữ cảnh
- **Vẫn** hiện trong trình soạn, có nhãn rõ và lý do
- **Vẫn** hiện trên Bản Đồ Dị Biệt như một Dị Bản
- **Có thể** được người chơi bỏ che thủ công bất cứ lúc nào

Điều này giải luôn kiểu F: khi Ra bị thu hồi, `LoreExpectation` chuyển `bat_kha` **và** entry gốc bị che cùng lúc. AI thôi nhắc Ra như đương kim chủ tể.

**[BB]** Mỗi lần che phải sinh một mục Dị Bản (35.5) với chuỗi nhân quả truy được, và ghi vào biên niên sử bằng giọng kể:

> *"Từ đời này, các bản chép ở Thebes không còn mở đầu bằng câu về Ra nữa. Không ai ra lệnh sửa; người ta chỉ ngừng chép nó."*

### 51.4 Khóa Canon [BB]

`khoaCanon = true` → entry **không bao giờ bị che**, bất kể thế giới đi hướng nào. Đây là công cụ để người chơi ép chân lý.

Nhưng nó có giá. Khi world state mâu thuẫn với một entry đã khóa:

```
→ thanh tra mạch lạc (Phần 16) ghi nhận một mâu thuẫn KHÔNG GIẢI ĐƯỢC
→ realityIntegrity trừ theo tuning.thucTai.moiMauThuanPhatHien mỗi kỷ nguyên
→ vùng liên quan có nguy cơ thành vùng Nghịch Lý
```

Ép thế giới tin một điều nó biết là sai thì sẽ làm rách thực tại. Đúng như nó nên thế.

### 51.5 Dải `order` [BB]

Giải kiểu C dứt điểm bằng cách chia dải, không cho đụng nhau:

| Dải | Nguồn |
|---|---|
| `0 – 9 999` | Người dùng nhập |
| `10 000 – 19 999` | Sử tự sinh |
| `20 000 – 29 999` | Di sản vòng trước |
| `30 000 – 39 999` | Workflow ghi trực tiếp (50.7) |
| `90 000 +` | Hệ thống |

**[BB]** Trình soạn chỉ cho người dùng đánh số trong dải của họ. Nhập lorebook có `order` ngoài dải → tự dồn về dải người dùng, giữ nguyên thứ tự tương đối.

### 51.6 Chống ô nhiễm và vòng tự khẳng định [BB]

Giải kiểu D và E — hai kiểu âm thầm nhất.

**Chống ô nhiễm (D):**
- Sử kỷ nguyên N **chỉ được sinh từ `events` và `chronicle` của kỷ nguyên N**, không được đọc sử kỷ nguyên N−1 làm nguồn.
- Nếu sinh từ sử cũ, sai lệch sẽ tự nhân lên. Sinh từ log thô thì không.

**Chống vòng tự khẳng định (E):**
- Mọi entry tự sinh mang `doTinCay` tính từ **số sự kiện engine thật** chống lưng cho nó.
- Entry không có sự kiện nào chống lưng → `doTinCay = 0` → **không nạp**, chỉ lưu.
- `doTinCay` **không bao giờ** tăng do được nhắc lại trong văn bản AI. Chỉ tăng do sự kiện engine.

```ts
doTinCay: z.number().min(0).max(100).prefault(0),
suKienChongLung: z.array(z.string()).prefault([]),   // event id
```

**[BB]** Đây là luật quan trọng nhất của cả phần: **văn bản không bao giờ tự chứng minh được chính nó.** Chỉ sự kiện engine mới làm một khẳng định trở nên thật. Nguyên tắc này lặp lại đúng Tiếp Địa ở Khối L, áp cho lorebook thay vì cho luật.

### 51.7 Bảng Đối Soát

Một tab trong trình soạn lorebook:

```
ĐỐI SOÁT · kỷ nguyên 4 · 31 entry mới

  mâu thuẫn 3
    [Ai Cập] Ra cai trị thần điện
        bị che bởi  [Sử · KN3] Khonsu và ngôi đầu thần điện
        lý do: Ra bị thu hồi năm 1180, chỗ trống 400 năm
        [ bỏ che ]  [ khóa canon ]  [ xem chuỗi nhân quả ]

  trùng lặp 5   [ gộp tất cả ]
  bổ sung 12
  làm rõ 11
```

---

## PHẦN 52 — THAO TÁC ENTRY CẤP AI [BB]

### 52.1 Thay sinh cả quyển bằng thao tác từng entry

Spec cũ cho AI sinh **nguyên một lorebook** cuối mỗi kỷ nguyên. Quá thô: không sửa được cái cũ, không gộp được cái trùng, chỉ biết đắp thêm.

Thay bằng khối thứ năm trong output:

```xml
<LorebookOps>
[
  { "op": "them", "ten": "Khonsu và ngôi đầu thần điện",
    "keys": ["Khonsu", "ngôi đầu", "thần điện Kemet"],
    "noiDung": "...", "lop": "loi", "chuDe": ["e.khonsu", "e.than_he_kemet"],
    "suKienChongLung": ["ev.44812", "ev.44903"] },

  { "op": "sua", "id": "lb.k12", "truong": "noiDung",
    "noiDungMoi": "...", "lyDo": "bổ sung việc Sekhet-ur giành domain đêm" },

  { "op": "gop", "ids": ["lb.k07", "lb.k19"], "giuId": "lb.k07" },

  { "op": "tach", "id": "lb.k22",
    "thanh": [ { "ten": "...", "keys": [...] }, { "ten": "...", "keys": [...] } ] },

  { "op": "che", "id": "lb.ai_cap_003", "boiId": "lb.k12",
    "lyDo": "Ra không còn cai trị từ năm 1180" },

  { "op": "doi_key", "id": "lb.k05", "keys": ["Trảo Bạch", "móng trắng"] },

  { "op": "xoa", "id": "lb.k31", "lyDo": "trùng hoàn toàn với lb.k07 sau khi gộp" }
]
</LorebookOps>
```

### 52.2 Bảng quyền [BB]

| Op | Trên entry `tu_sinh` | Trên entry `nguoi_dung` | Trên entry `di_san` |
|---|---|---|---|
| `them` | Có | — | — |
| `sua` | Có | **Không** | Không |
| `gop` | Có | **Không** | Không |
| `tach` | Có | **Không** | Không |
| `che` | Có | **Có** | Có |
| `doi_key` | Có | **Không** | Không |
| `xoa` | Có (mềm) | **Không bao giờ** | Không |

**[BB]** AI **không bao giờ** được sửa hay xóa entry người dùng nhập. Nó chỉ được **che** — và mọi lần che đều hiện lên bảng đối soát để người chơi bỏ che nếu muốn.

Đây là lằn ranh không được vượt. Người chơi soạn lorebook của mình và phải chắc chắn rằng chữ họ viết không bao giờ bị máy sửa sau lưng.

### 52.3 Xóa mềm và thùng rác [BB]

```ts
trangThai: 'da_xoa'
tickXoa: number
lyDoXoa: string
```

Xóa **không bao giờ** là xóa cứng. Entry bị xóa vào **Thùng Rác**, giữ 3 kỷ nguyên, khôi phục được. Lý do: entry có thể đang được `chuDe` hoặc `bo_sung_cho` trỏ tới; xóa cứng làm đứt đồ thị.

Chỉ có người chơi mới xóa cứng được, và phải qua xác nhận.

### 52.4 Xác thực từng op

Mọi op chạy qua validator trước khi áp. Op trượt thì **bỏ op đó**, giữ các op còn lại — cùng chính sách với patch ở 31.7.

```
them     → schema hợp lệ · keys không rỗng · chuDe trỏ tới entity có thật
           · suKienChongLung không rỗng · token dưới trần · order trong dải
sua      → id tồn tại · thuộc lorebook tu_sinh · trường được phép sửa
gop      → mọi id tồn tại · cùng nguồn · giuId nằm trong ids
tach     → tổng token các phần ≈ token gốc (không được bịa thêm khi tách)
che      → boiId tồn tại và ưu tiên cao hơn · lyDo không rỗng
xoa      → thuộc tu_sinh · không có entry nào đang bo_sung_cho nó
```

### 52.5 Lịch sử phiên bản

```ts
lichSu: z.array(z.object({
  tick: z.number(),
  boiAi: z.enum(['nguoi_choi','ai','workflow','doi_soat']),
  op: z.string(),
  truoc: z.string(), sau: z.string(),
  lyDo: z.string().prefault(''),
})).max(20).prefault([]),
```

Trình soạn có tab **Lịch sử** với diff hai cột và nút lùi về từng phiên bản.

---

## PHẦN 53 — ĐỘ CHÍNH XÁC CỦA ENTRY

### 53.1 Bốn bệnh kinh điển

Entry do AI sinh thường mắc bốn bệnh, và mỗi bệnh có một liều chữa cơ học:

| Bệnh | Chữa |
|---|---|
| Quá dài, ôm nhiều chủ đề | Trần token cứng + luật **một entry một chủ đề** |
| Keyword sai hoặc quá chung | Rút keyword từ **bảng thu hoạch danh từ**, không để AI tự nghĩ |
| Trùng chủ đề với entry đã có | Đối soát bắt buộc trước khi ghi |
| Khẳng định không có gì chống lưng | Bắt buộc `suKienChongLung` |

### 53.2 Keyword lấy từ thu hoạch danh từ [BB]

Đây là cải tiến có giá trị cao nhất trong phần này.

Đừng để AI nghĩ ra keyword. **Lấy từ bảng `terms`** (Phần 14) — những từ đã thực sự xuất hiện trong lời kể của thế giới này.

```ts
export function goiYKeys(chuDe: string[], w: World): KeyCandidate[] {
  // 1. Lấy mọi Term có link 'nhac_den' tới các entity trong chuDe
  // 2. Sắp theo soLanXuatHien
  // 3. Loại: từ quá chung (danh sách đen), từ đã bị entry khác cùng lớp chiếm
  // 4. Trả kèm số lần xuất hiện để AI chọn có căn cứ
}
```

**[BB]** Prompt sinh entry phải kèm **danh sách ứng viên keyword có sẵn kèm tần suất**, và yêu cầu AI chọn từ danh sách đó. Chỉ cho tự nghĩ khi danh sách rỗng.

Keyword hay không phải keyword nghe hợp lý — mà là keyword **thật sự xuất hiện trong văn bản sẽ được quét**. Đó là khác biệt giữa lorebook bắn đúng lúc và lorebook không bao giờ bắn.

**Danh sách đen mặc định [MR]:** đại từ, từ nối, `người`, `thần`, `nơi`, `chuyện`, `thời gian`, `thế giới`, tên tháng, số đếm — cộng mọi từ xuất hiện trong hơn 30% số cảnh.

### 53.3 Trần token và luật một chủ đề [BB]

```ts
tranTokenEntry: z.number().prefault(400),        // [MR]
soChuDeToiDa: z.number().prefault(2),
```

Vượt trần → **tách**, không cắt cụt. Nhắc quá `soChuDeToiDa` entity chính → validator trượt, yêu cầu tách.

Cùng lý do với template EJS ở 32.4: entry bị cắt giữa chừng làm hỏng nghĩa và làm AI hiểu sai.

### 53.4 Tiếp địa cho entry [BB]

Áp đúng nguyên tắc Khối L, lần này cho lorebook:

> **Một entry chỉ thật đến mức các sự kiện chống lưng cho nó là thật.**

```ts
export function tinhDoTinCay(entry: LorebookEntry, w: World): number {
  const ev = entry.suKienChongLung.map(id => layEvent(id, w)).filter(Boolean);
  if (ev.length === 0) return 0;
  // trọng số theo: số sự kiện, độ lớn, có được nhiều nguồn độc lập xác nhận không
}
```

`doTinCay < 20` → entry lưu nhưng **không nạp**. Nó là một tin đồn chưa được chứng thực, và có thể trở thành thật sau nếu sự kiện xảy ra.

**[KN]** Đây là chỗ để làm một cơ chế đẹp: entry `doTinCay` thấp có thể được nạp **có chủ đích** vào ngữ cảnh của NPC hay tin vào tin đồn, để họ hành động theo thứ chưa chắc đúng. Nhưng đó là chọn lựa của assembler, không phải mặc định.

### 53.5 Brief sinh entry

Cùng khuôn với brief giải lỗ hổng ở 15.3 — **không câu hỏi mở nào**:

```
NHIỆM VỤ: sinh entry lorebook cho chủ đề [e.khonsu, e.than_he_kemet].

ĐÃ CÓ (đối soát trước khi viết):
  lb.k03 "Thần điện Kemet · cơ cấu quan liêu"  — nói về cấp bậc, KHÔNG nói về ngôi đầu
  lb.ai_cap_003 "Ra cai trị thần điện"          — MÂU THUẪN, sẽ bị che nếu bạn viết entry này

KEYWORD ỨNG VIÊN (từ văn bản thật, kèm tần suất):
  Khonsu 47 · ngôi đầu 12 · thần điện Kemet 31 · Đại Điện 9 · mặt trăng lên ngôi 4
  (cấm: "thần" đã bị lb.k01 chiếm · "Kemet" quá chung)

SỰ KIỆN CHỐNG LƯNG (bắt buộc trích dẫn ít nhất 2):
  ev.44812  năm 1180 · Ra bị Sáng Thế Thần thu hồi
  ev.44903  năm 1584 · Khonsu giành domain "đêm" từ Sekhet-ur
  ev.45120  năm 1602 · lễ đăng đỉnh đầu tiên tại Đại Điện

TRẦN: 400 token · tối đa 2 chủ đề chính · lớp 'loi'
THẨM MỸ: giọng biên niên, khô, không tính từ cảm thán

TRẢ VỀ: đúng schema LorebookEntry. Không thêm lời nào.
```

---

## PHẦN 54 — HỆ RAG

### 54.1 Ba kênh truy hồi, hợp nhất bằng RRF [BB]

Hệ hiện tại chỉ có quét keyword và mở rộng đồ thị. Thêm kênh ngữ nghĩa và hợp nhất cả ba.

| Kênh | Cơ chế | Mạnh ở |
|---|---|---|
| **Từ vựng** | Quét keys lorebook + BM25 trên chunk | Tên riêng, thuật ngữ, trích dẫn chính xác |
| **Ngữ nghĩa** | Embedding + cosine | Diễn đạt khác, khái niệm gần, "chuyện tương tự đã từng xảy ra chưa" |
| **Đồ thị** | `moRong()` từ tiêu điểm (6.4) | Liên quan nhân quả, quan hệ, cùng mạch truyện |

**Hợp nhất bằng Reciprocal Rank Fusion:**

```ts
diemRRF(chunk) = Σ_kênh  w_kênh / (k + hang_trong_kênh)      // k = 60
```

**[BB]** Dùng RRF chứ không dùng cộng điểm có chuẩn hóa. RRF chỉ cần **thứ hạng**, không cần điểm số so sánh được giữa các kênh — nên nó không cần tinh chỉnh và không hỏng khi một kênh trả điểm ở thang khác. Đây là lựa chọn thực dụng đúng cho bài toán này.

Trọng số mặc định: từ vựng `1.0` · ngữ nghĩa `1.0` · đồ thị `1.2` **[MR]**. Đồ thị nhỉnh hơn vì trong game này liên hệ nhân quả quan trọng hơn liên hệ ngữ nghĩa.

### 54.2 Chiến lược chia chunk [BB]

**Không chia theo kích thước cố định khi nội dung đã có đơn vị tự nhiên.** Chỉ cảnh đã kể mới cần cửa sổ trượt.

| Nguồn | Đơn vị chunk | Metadata bắt buộc |
|---|---|---|
| Lorebook entry | Cả entry | `lorebookId, nguon, lop, keys, chuDe, doTinCay` |
| Biên niên sử | Một sự kiện | `tick, entityIds, machId, kyNguyen` |
| Ký ức thực thể | Một mảnh ký ức | `entityId, dienTich, tick` |
| Ký ức mạch | Một nhịp | `machId, giaiDoan, nhanVatIds` |
| Định luật | Văn bản gốc + **mỗi diễn giải một chunk riêng** | `lawId, vungId, theHe, doLech` |
| Khái niệm | Mô tả + sắc thái | `conceptId, giaiDoan` |
| Cảnh đã kể | Cửa sổ ~300 token, chồng lấn 15% | `tick, entityIds, lens, mode` |
| Sổ Nhân Quả / Phục Bút | Một mục | `loai, tickGieo, hanTra` |

**[BB]** Mỗi diễn giải của một luật là **một chunk riêng**, gắn `vungId`. Đây là chi tiết quan trọng: khi kể chuyện ở vùng A, RAG phải trả về diễn giải của vùng A, **không** trả về diễn giải vùng B hay văn bản luật gốc.

### 54.3 Nhãn tầm nhìn — chống rò rỉ [BB]

> **RAG là một đường rò rỉ mới. Đây là mục quan trọng nhất của cả Phần 54.**

Mọi chunk mang một nhãn tầm nhìn, gán lúc index:

```ts
export const ChunkSchema = z.object({
  id: z.string(), branchId: z.string(),
  nguon: z.string(), nguonId: z.string(),
  noiDung: z.string(),
  vector: z.instanceof(Uint8Array).nullable().prefault(null),   // int8 lượng tử hóa
  meta: z.record(z.string(), z.unknown()).prefault({}),

  tamNhin: z.object({
    tangToiThieu: z.enum(['pham_nhan','than','sang_the']).prefault('pham_nhan'),
    vungHanChe: z.array(z.string()).prefault([]),    // rỗng = mọi vùng
    domainHanChe: z.array(z.string()).prefault([]),  // cho tầng Thần
    laTinDon: z.boolean().prefault(false),           // phải qua bopMeo trước khi dùng
  }).prefault({}),

  tick: z.number(),
  _dim: z.number().prefault(0),
}).prefault({});
```

**[BB] Lọc tầm nhìn chạy TRƯỚC khi xếp hạng, không phải sau.** Lọc sau khi xếp hạng nghĩa là top-K đã bị chiếm bởi chunk không được phép, và kết quả trả về ít hơn dự kiến. Lọc trước rồi mới xếp hạng trên phần còn lại.

**[BB]** Chunk có `laTinDon = true` phải đi qua `bopMeo()` (19.1) trước khi vào ngữ cảnh — kể cả khi nó được truy hồi đúng.

Test bắt buộc, chạy tự động cùng test 18.3: chiếu `pham_nhan`, chạy 50 truy vấn ngẫu nhiên, khẳng định **không** chunk nào có `tangToiThieu != 'pham_nhan'` lọt vào kết quả.

### 54.4 Nhúng và lưu trữ

```ts
export const EmbedConfigSchema = z.object({
  bat: z.boolean().prefault(false),
  nguon: z.enum(['proxy','cuc_bo']).prefault('proxy'),
  proxyUrl: z.string().prefault(''),
  proxyPassword: z.string().prefault(''),
  model: z.string().prefault(''),
  soChieu: z.number().prefault(768),
  luongTuHoa: z.enum(['khong','int8']).prefault('int8'),
  loTiToiDa: z.number().prefault(64),
  callToiDaMoiPhut: z.number().prefault(20),
}).prefault({});
```

**[BB] Suy giảm êm — bắt buộc.** Nếu `bat = false` hoặc endpoint nhúng chết, RAG **vẫn phải chạy** với hai kênh còn lại. Ứng dụng không bao giờ được hỏng vì thiếu embedding. Hiện một dòng ở bảng chẩn đoán, không hiện lỗi cho người chơi.

**Lượng tử hóa int8** giảm dung lượng bốn lần với mất mát không đáng kể. 100k chunk × 768 chiều: `float32` là 307 MB (vượt hạn mức IndexedDB ở nhiều trình duyệt), `int8` là 77 MB. Chọn int8.

**[BB]** Model nhúng phải xử lý được tiếng Việt có dấu. Thêm một phép thăm dò thứ bảy vào 31.5: nhúng hai câu tiếng Việt gần nghĩa và hai câu khác nghĩa, kiểm cosine có phân tách không. Không phân tách → cảnh báo model không hợp.

### 54.5 Tìm vector trong trình duyệt

**Không dựng chỉ mục ANN cho tới khi thật cần.** Với mô hình dữ liệu này, **tiền lọc theo metadata có giá trị hơn nhiều so với chỉ mục xấp xỉ.**

```
1. Tiền lọc bằng chỉ mục Dexie:
     branchId  +  tamNhin  +  cửa sổ tick  +  entityIds giao tiêu điểm
   → thường còn 2 000 – 8 000 chunk từ 100 000
2. Quét vét cạn cosine trên phần còn lại (Float32Array, int8 giải nén tại chỗ)
   → 5 000 chunk × 768 chiều ≈ 15 ms
3. Chỉ khi phần sống sót vẫn > 30 000, mới dùng chỉ mục thô theo tâm cụm
```

**[BB]** Đây là quyết định kỹ thuật cố ý. HNSW trong trình duyệt tốn bộ nhớ, khó bền hóa, và khó cập nhật tăng dần. Tiền lọc rồi vét cạn đơn giản hơn, chính xác hơn, và đủ nhanh ở quy mô thực tế của một ván chơi.

### 54.6 Dựng truy vấn [BB]

**Đừng nhúng thẳng tin nhắn người chơi.** Dựng ba truy vấn và hợp kết quả:

```
Q1 · Tiêu điểm  : tên + mô tả ngắn các entity đang trên sân khấu + mục tiêu ống kính
Q2 · Ý định     : chính lời người chơi vừa nhập (hoặc mô tả nhịp mạch nếu tự động)
Q3 · Tiền lệ    : "chuyện tương tự đã từng xảy ra chưa" — dựng từ loại mạch
                  và loại sự kiện đang diễn ra
```

Q3 là truy vấn đáng giá nhất và hay bị bỏ quên: nó kéo về tiền lệ lịch sử, và đó chính là thứ làm một thế giới có chiều sâu. Khi một vị vua bị ám sát, RAG nên tự kéo về ba vụ ám sát trước đó trong lịch sử thế giới này.

### 54.7 Xếp hạng lại

Sau RRF, xếp hạng lại top ~120 xuống top-K theo ngân sách:

**[BB v3.1]** Công thức dưới đây là baseline `heuristic`. Pipeline sản xuất, adapter semantic, rank fusion, cache, fallback, đo chất lượng và UI chẩn đoán được chuẩn hóa tại Phần 77. Phần 77 mở rộng mục này và là nguồn chân lý khi hai mô tả khác nhau.

```
diem = RRF
     × suyGiamThoiGian(tick)          exp(-Δtick / bánChuKỳ), bán chu kỳ theo nhịp
     × (1 + dienTich/200)             ký ức nặng cảm xúc được ưu tiên
     × (1 + spotlightTrungBinh/200)
     × heSoMach                       cùng mạch đang chiếu: ×1.4
     × doTinCay/100                   entry chưa chứng thực bị dìm
     × phatTrungLap                   MMR: phạt chunk quá giống chunk đã chọn
```

**[BB]** Bước phạt trùng lặp (MMR) là bắt buộc. Không có nó, top-10 sẽ là mười biến thể của cùng một sự kiện, và đa dạng thông tin sụp.

### 54.8 Index tăng dần

```
Ghi entity/entry/event  →  đẩy vào hàng đợi index
Worker nền              →  gom lô 64, gọi nhúng, ghi Dexie
Không bao giờ chặn tick hay UI
Nhúng lỗi               →  chunk vẫn được lưu với vector = null
                           → vẫn tìm được bằng kênh từ vựng và đồ thị
```

**[BB]** `vector = null` phải là trạng thái hợp lệ ở mọi nơi. Chunk chưa nhúng vẫn là chunk dùng được.

Nén biên niên sử cuối kỷ nguyên → **index lại** các chunk bị nén, xóa chunk cũ đã bị gộp.

### 54.9 Nối vào Assembler

RAG cấp nội dung cho tầng 4–6 của Phần 33. Thứ tự cuối cùng:

```
1. Tiêu điểm từ ống kính và mạch truyện
2. Ba truy vấn (54.6)
3. Ba kênh chạy song song
4. LỌC TẦM NHÌN                    ← trước khi xếp hạng
5. Hợp nhất RRF
6. Xếp hạng lại + MMR
7. Cắt theo ngân sách còn lại
8. Render EJS theo ưu tiên (32.4)
```

**[BB]** Kênh đồ thị **thay thế** phần quét lorebook thuần keyword của bản cũ ở chỗ nó không còn là cơ chế duy nhất — nhưng quét keyword vẫn giữ nguyên như kênh từ vựng. Lorebook lớp `loi` vẫn nạp thẳng ở tầng 2, **không đi qua RAG**.

### 54.10 Chống ảo giác bằng truy hồi [KN]

Khi đã có RAG, thêm một luật cho Updater:

> Mọi khẳng định về **quá khứ** trong văn bản Narrator phải truy được về một chunk đã truy hồi hoặc về world state.

Updater trả thêm khối `<Unverified>` liệt kê các khẳng định quá khứ không đối chiếu được. Chúng không bị xóa — chúng trở thành **ứng viên Term** (Phần 14) và **ứng viên gap `nhan_qua`**.

Thế giới không phạt AI vì bịa. Nó **biến chỗ bịa thành một câu hỏi chưa có lời đáp** — đúng nguyên tắc 4.

### 54.11 Chẩn đoán bổ sung

| # | Kiểm | Hỏng khi |
|---|---|---|
| 37 | Hàng đợi index | Tồn > 2 000 chunk chưa nhúng |
| 38 | Rò rỉ RAG | 50 truy vấn thử ở `pham_nhan` trả về chunk cấp cao hơn — **hỏng nặng** |
| 39 | Tỉ lệ chunk có vector | < 60% mà `embed.bat = true` |
| 40 | Đa dạng truy hồi | Top-10 có > 6 chunk cùng `nguonId` → MMR hỏng |
| 41 | Dung lượng vector | Vượt 60% hạn mức IndexedDB ước tính |
| 42 | Entry bị che | > 40% entry người dùng bị che → thế giới đã lệch rất xa, báo cho người chơi biết |
| 43 | Entry `doTinCay = 0` | > 25% entry tự sinh không có sự kiện chống lưng |

**[BB]** Mục 42 không phải lỗi kỹ thuật — nó là **thông tin chơi**. Nên hiện bằng giọng trung tính: *"Thế giới của bạn đã đi rất xa khỏi thần thoại nguồn. 43/104 entry gốc không còn đúng."*

### 54.12 Bổ sung lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 61 | Dải `order` + trạng thái `bi_che` + đối soát entry | Thu một thần trong lorebook → entry gốc bị che, sinh Dị Bản, AI thôi nhắc |
| 62 | Khóa Canon + hình phạt thực tại | Khóa một entry trái với state → `realityIntegrity` giảm đều mỗi kỷ nguyên |
| 63 | `doTinCay` + `suKienChongLung` | Entry không có sự kiện chống lưng không được nạp |
| 64 | Khối `<LorebookOps>` + bảng quyền + xóa mềm | AI gộp được hai entry tự sinh, **không** sửa được entry người dùng |
| 65 | `goiYKeys` từ bảng thu hoạch | Keyword sinh ra thật sự bắn khi kể chuyện |
| 66 | Trần token + tách thay vì cắt | Entry vượt trần bị tách thành hai, không bị cắt cụt |
| 67 | Chunk + metadata + nhãn tầm nhìn | Chia chunk đúng đơn vị tự nhiên từng nguồn |
| 68 | Nhúng + int8 + hàng đợi nền + suy giảm êm | Tắt endpoint nhúng → RAG vẫn chạy hai kênh |
| 69 | Tiền lọc + vét cạn cosine | 100k chunk, truy vấn dưới 50 ms |
| 70 | RRF + ba truy vấn + xếp hạng lại + MMR | Top-10 đa dạng nguồn; Q3 kéo về được tiền lệ lịch sử |
| 71 | Test rò rỉ RAG tự động | 50 truy vấn ở `pham_nhan`, không chunk cấp cao nào lọt |
| 72 | `<Unverified>` → Term và gap | Khẳng định bịa trở thành bí ẩn, không bị xóa |

### 54.13 Bốn câu của Khối O

1. Lorebook người dùng là **nguồn** — điều lẽ ra phải xảy ra. Lorebook tự sinh là **sử** — điều đã xảy ra. Khi mâu thuẫn, sử thắng.
2. Che không phải xóa. AI không bao giờ được sửa hay xóa chữ người chơi viết.
3. Văn bản không tự chứng minh được chính nó. Chỉ sự kiện engine mới làm một khẳng định trở nên thật.
4. Lọc tầm nhìn chạy **trước** khi xếp hạng. RAG là đường rò rỉ mới, và nó phải bị bịt ngay từ bước truy hồi.

---

*Hết Khối O. Bộ đặc tả hoàn chỉnh v2.2.*

---
---

# KHỐI P — BẢNG THIÊN DIỄN

> Mặt quan sát hợp nhất. Spec cũ có nhiều panel sâu nhưng **không có chỗ nào nhìn được toàn cảnh trong một cái liếc**.
> Khối này bổ sung Phần 37.3.

## PHẦN 55 — BẢNG THIÊN DIỄN

### 55.1 Ba mức độ dày [BB]

| Mức | Tên | Luôn hiện | Nội dung |
|---|---|---|---|
| 1 | **Thanh Thiên Tượng** | Có | Một dòng, 6–8 con số. Đỉnh Sảnh |
| 2 | **Bảng Thiên Diễn** | Không — phím `Tab` | Toàn cảnh, phủ lên Sảnh, đóng bằng cùng phím |
| 3 | **Panel sâu** | Không | Các màn hình đã có ở 37.3, mở từ Bảng |

**[BB]** Bảng **không chặn tương tác** và **không dừng thời gian**. Nó là một lớp phủ đọc được, không phải một chế độ.

### 55.2 Thanh Thiên Tượng

```
Kỷ nguyên 4 · năm 4931 · Niên   │   Thực tại 88 ↓  Sống động 78 ↑   │   Ống kính: Mạch Ly Giáo Sông Đen   │   Cầu 12 · Phục bút 2 quá hạn
```

**[MR]** Người dùng ghim được mục khác vào thanh này từ Bảng. Mặc định bốn cụm trên.

### 55.3 Tám vùng của Bảng

```
┌─ BẢNG THIÊN DIỄN ─────────────────────────────────────────────────────────┐
│                                                                           │
│  KHI NÀO                          THẾ GIỚI LÀ GÌ                          │
│  Kỷ nguyên 4 · Tro Và Nước        Sáng thế   Hiến Tế Nguyên Thủy          │
│  năm 4931 · tick 118 442          Thần hệ    Quan Liêu Thiên Đình         │
│  nhịp Niên — một mùa mỗi tick     Không gian có tên · khoảng cách ý nghĩa  │
│  kỷ nguyên sau: còn ~69 năm       Thời gian  có tên · quá khứ cố định      │
│                                   Nhân quả   vô danh                      │
│                                   Danh tính  có tên · bản chất một từ     │
│                                   Sinh tử    vô danh                      │
│                                   Nhận thức  có tên · hiểu biết làm yếu   │
│                                   Vận mệnh   chưa có — Tất Yếu 340/1000   │
│                                   Cơ chế     Thần Bí · Nguyên Điểm        │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────    │
│                                                                           │
│  CÓ GÌ TỒN TẠI                    THẾ GIỚI ĐANG THẾ NÀO                   │
│  Định luật        31    ▁▂▃▃▄▅    Thực tại      88   ▇▇▆▆▅▅▄   −8         │
│    hiệu lực 26 · treo 3 · huỷ 2   Sống động     78   ▃▄▄▅▆▆▇   +7         │
│  Khái niệm       184    ▂▃▄▅▆▇    Tự quyết      71   ▅▅▅▄▄▄▄   −4         │
│    kết tinh 22 · lưỡng lự 3       Tự sinh sự kiện    83 %                 │
│  Thần             47              Phụ thuộc         19                    │
│    khởi nguyên 3 · phân thân 6    Vắng mặt          44 %                  │
│  Cõi              9                                                       │
│  Thần khí        23               ĐÃ LỆCH BAO XA                          │
│  Quái vật        31               Ai Cập  23 thoả · 11 chờ · 7 lệch · 4 bất khả│
│  Thần hệ          4               Bắc Âu  9 thoả · 2 chờ · 0 lệch         │
│  Quốc gia        12               [ Bản Đồ Dị Biệt ]                      │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────    │
│                                                                           │
│  ĐANG XẢY RA CHUYỆN GÌ                          AI ĐÁNG CHÚ Ý             │
│  ● Ly Giáo Sông Đen        cao trào   ███████   Ankhtu      tế tư trưởng  │
│  ● Kế Vị Nhà Sekhet        phát triển ████▁     Khonsu      thần, ngôi đầu│
│  ● Phục Thù Của Tro        khởi       ██▁▁▁     Sekhet-ur   thần, đêm     │
│    Chiến Tranh Muối        âm ỉ       █▁▁▁▁     Nefru       nữ vương      │
│    ... 20 mạch khác · 14 bạn chưa nghe                                    │
│  ○ = bạn chưa biết   ● = đang theo dõi          [ Bảng Mạch Truyện ]      │
│                                                                           │
│  ─────────────────────────────────────────────────────────────────────    │
│                                                                           │
│  TỪ LẦN TRƯỚC (12 năm)            CẦN CHÚ Ý                               │
│  Khonsu mất domain "đêm"          Phục bút quá hạn 2                      │
│  Ô Uế kết tinh thành luật         Cầu nguyện sắp hết hạn 3                │
│  Trảo Bạch thành thực thể         Lỗ hổng ưu tiên cao tồn 3 kỷ nguyên 1   │
│  4 entry Ai Cập bị che            Mạch Ly Giáo lên cao trào               │
│  [ xem đầy đủ ]                   Kẻ thù trỗi dậy sau ~40 năm             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**[BB]** Tám vùng, thứ tự cố định. Người dùng thu gọn từng vùng nhưng không đổi thứ tự — thứ tự này là thứ tự câu hỏi tự nhiên: *khi nào → thế giới là gì → có gì → đang thế nào → chuyện gì → ai → vừa xảy ra gì → tôi cần làm gì*.

### 55.4 Vùng "Từ lần trước" và "Cần chú ý" [BB]

Đây là hai vùng khiến Bảng hữu ích thay vì trang trí. Bảng chỉ liệt kê con số thì đọc một lần rồi thôi; Bảng nói **cái gì vừa đổi** và **cái gì đang chờ bạn** thì mở lại mỗi lượt.

**Từ lần trước** — diff kể từ lần cuối người chơi mở Bảng, không phải kể từ đầu kỷ nguyên. Lưu `tickXemCuoi` theo từng save.

**Cần chú ý** dựng từ dữ liệu đã có, không cần cơ chế mới:

| Nguồn | Điều kiện |
|---|---|
| Sổ Phục Bút | `hanTraToiDa` đã qua, `daTra = false` |
| Hàng cầu nguyện | `hanChot` còn dưới 20% thời gian |
| Bảng lỗ hổng | `doUuTien > 70` tồn quá 2 kỷ nguyên |
| Mạch truyện | `giaiDoan = 'cao_trao'` |
| Kẻ thù | `nhip` sắp tới hạn |
| Khái niệm | Lưỡng lự sắp quá `tickLuongLuToiDa` |
| Đối soát | Có entry mới bị che chưa xem |
| Chỉ số | `agencyTrungBinh < 40` hoặc `realityIntegrity` giảm > 15 một kỷ nguyên |

**[BB]** Mỗi mục là một liên kết mở thẳng tới chỗ xử lý. Không có mục nào chỉ để đọc.

### 55.5 Chiếu theo tầng [BB]

> **Bảng phải đi qua `chieu()`. Nó là đường rò rỉ dễ quên nhất trong toàn app** — dễ hơn cả assembler, vì lập trình viên hay đọc thẳng từ store cho tiện.

```ts
export function tinhBangThienDien(view: WorldView): BangThienDien
```

**[BB]** Hàm chỉ nhận `WorldView`. Không nhận `World`. Không đọc Dexie trực tiếp. Không đọc Zustand store gốc.

| Vùng | Sáng Thế | Thần | Phàm Nhân |
|---|---|---|---|
| Khi nào | Đầy đủ, tick chính xác | Năm và mùa, không thấy tick | Chỉ "mùa thứ ba đời vua Nefru" |
| Thế giới là gì | Toàn bộ bảy trục + cơ chế | Chỉ trục đã `co_ten` **và** liên quan domain | **Không có vùng này** |
| Có gì tồn tại | Mọi con số | Chỉ trong domain và lãnh địa | **Không có con số nào** |
| Đang thế nào | Năm chỉ số | Chỉ `domainStrength` của mình | **Không có** |
| Đã lệch bao xa | Đầy đủ | Không | Không |
| Chuyện gì | Mọi mạch, kể cả chưa biết | Mạch trong domain | Chỉ mạch mình có mặt hoặc nghe kể |
| Ai đáng chú ý | Spotlight thật | Tín đồ và đối thủ | Người mình quen |
| Cần chú ý | Đầy đủ | Cầu nguyện, kẻ thù | Việc đời mình |

### 55.6 Quy tắc trình bày [BB]

Nguy cơ lớn nhất là Bảng biến thành màn hình giao dịch chứng khoán và giết chết thẩm mỹ ở Phần 36. Sáu quy tắc:

1. **Số dùng `--chu-so`, cỡ 13, màu `--tro`.** Nhãn cỡ 11, `--mo`, `letter-spacing: 0.08em`.
2. **Không dùng viên trạng thái nhiều màu.** Tối đa **một** chấm accent trên mỗi dòng, và chỉ khi dòng đó cần chú ý.
3. **Không lồng kính.** Bảng là **một** lớp kính duy nhất; các vùng phân tách bằng khoảng trắng và đường hairline `--kinh-vien`, không phải bằng hộp con.
4. **Sparkline là đường SVG một nét mảnh**, không tô, không trục, không lưới, không nhãn. Bảy điểm, bảy kỷ nguyên gần nhất. Xu hướng quan trọng hơn giá trị.
5. **Delta hiện bằng dấu và số**, màu `--ngoc` khi tăng theo hướng tốt, `--hoi` khi xấu, `--tro` khi trung tính. Không dùng mũi tên tô đặc.
6. **Không có thanh tiến trình tô đầy.** Tỉ lệ vẽ bằng khối `█▁` trong `--chu-so`, hoặc một đường mảnh có điểm cắt.

**[BB]** Không emoji. Không icon màu. Trạng thái diễn đạt bằng **chữ**, không bằng ký hiệu: viết "vô danh", không vẽ ổ khoá.

### 55.7 Tương tác

- Mở/đóng bằng `Tab`. Đóng cũng bằng `Tab` hoặc `Esc`.
- Mọi con số là liên kết tới panel sâu tương ứng.
- Hover một chỉ số hiện tooltip: giá trị bảy kỷ nguyên gần nhất và điều gì đã đẩy nó.
- Ghim một mục vào Thanh Thiên Tượng bằng menu chuột phải.
- Thu gọn từng vùng; trạng thái thu gọn lưu theo save.
- Nút **"Chụp bảng"** xuất một ảnh SVG của Bảng — dùng để so hai nhánh hoặc lưu mốc.

### 55.8 Kỹ thuật [BB]

```ts
export const BangSnapshotSchema = z.object({
  branchId: z.string(),
  tickTinh: z.number(),
  mode: z.enum(['sang_the','than','pham_nhan']),
  vung: z.record(z.string(), z.unknown()).prefault({}),
  chuoiChiSo: z.record(z.string(), z.array(z.number())).prefault({}),  // 7 kỷ nguyên
  tickXemCuoi: z.number().prefault(0),
}).prefault({});
```

**[BB]** Đếm toàn bộ entity qua Dexie mỗi lần render là không chấp nhận được. Dựng **snapshot vật chất hoá**, cập nhật ở **ranh giới tick**, không cập nhật theo từng thay đổi.

Ở nhịp Vĩnh Kiếp, cập nhật **một lần** cuối cả kỷ nguyên, không phải mỗi tick con.

**[BB]** Snapshot lưu theo `mode`. Đổi tầng chơi thì tính lại, không tái dùng snapshot của tầng khác — đó là con đường rò rỉ.

---

## PHẦN 56 — SỔ TAY PHÀM NHÂN

### 56.1 Bảng ở tầng phàm nhân là một thứ khác hẳn

**[BB]** Ở `pham_nhan`, Bảng Thiên Diễn **không phải là bản rút gọn**. Nó bị thay bằng một màn hình khác về bản chất: **Sổ Tay** — trang giấy của chính nhân vật.

Không có một con số hệ thống nào. Không thanh tín ngưỡng, không `domainStrength`, không danh sách luật, không trọng số khái niệm. Mọi thứ diễn đạt như **điều nhân vật tin**, không phải điều đúng.

```
┌─ SỔ TAY ──────────────────────────────────────────────────────────────────┐
│                                                                           │
│  Ta là Ankhtu, con thứ của thợ nhuộm Sanu, ở Thebes.                      │
│  Mùa thứ ba đời vua Nefru. Ta đã bốn mươi mốt tuổi.                       │
│  Chân trái đau khi trở trời. Nhà còn nợ ba đấu lúa.                       │
│                                                                           │
│  NGƯỜI TA QUEN                                                            │
│  Sanu        cha        đã mất bốn mùa trước                              │
│  Meret       vợ         nàng nghĩ ta giấu chuyện gì đó — nàng đúng        │
│  Hor         bạn cũ     ta nợ hắn một mạng, hắn chưa đòi                  │
│  Thầy Ptah   sư phụ     ta không còn tin lời ông nữa                      │
│                                                                           │
│  ĐIỀU TA TIN                                                              │
│  Máu đổ ra thì dính vào người, và nó lây sang ai chạm vào.                │
│  Cho nên đao phủ phải ở ngoài thành. Cho nên phải làm Lễ Tẩy Tro.         │
│    — ta đã làm lễ ấy chín lần. Chưa lần nào thấy khác đi.                 │
│                                                                           │
│  Khonsu ngồi ngôi đầu. Người ta bảo trước kia là một vị khác,             │
│  nhưng chép sách không ai nhắc tên vị ấy nữa.                             │
│                                                                           │
│  ĐIỀU TA NGHE ĐƯỢC                                                        │
│  Ở lưu vực dưới có kẻ nói Lễ Tẩy Tro là bịa.        (nghe qua ba miệng)   │
│  Nhà Sekhet đang cãi nhau chuyện kế vị.             (chợ, hôm qua)        │
│  Có thứ trắng sống dưới nước đen.                   (không rõ từ đâu)     │
│                                                                           │
│  ĐIỀU TA MUỐN                                                             │
│  Trả xong nợ nhà.                                                         │
│  Biết vì sao cha ta chết mà không được chôn trong thành.   chưa xong      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 56.2 Bốn quy tắc [BB]

1. **Không con số hệ thống.** Tuổi, số nợ, số lần làm lễ thì được — đó là thứ một người thật đếm được. `dienTich` của ký ức, `yeuGhet` bằng số, `trongSo` khái niệm thì không.
2. **Luật hiện dưới dạng `dienGiai` của vùng mình, kèm chỗ nó sai.** Câu *"ta đã làm lễ ấy chín lần, chưa lần nào thấy khác đi"* là engine tự sinh từ việc nghi lễ có `hieuLuc = 0` — nhưng nhân vật không biết vì sao, chỉ biết nó không ăn thua.
3. **Tin đồn ghi kèm độ tin.** *"nghe qua ba miệng"*, *"không rõ từ đâu"* — lấy thẳng từ số chặng truyền của `bopMeo()`.
4. **Quan hệ ghi bằng `anTuong`, không bằng bốn trục.** Câu *"nàng nghĩ ta giấu chuyện gì đó — nàng đúng"* là bản ghi bất đối xứng ở 11.2 được kể ra bằng lời.

### 56.3 Vì sao đáng làm riêng

Nó là chứng minh sống động nhất cho nguyên tắc 7. Cùng một database, cùng một tick, nhưng ở tầng phàm nhân người chơi **không biết** Ô Uế là một định luật có thật với hiệu lực 94% — họ chỉ biết đao phủ phải ở ngoài thành, và lễ tẩy uế thì chưa lần nào thấy ăn thua.

Đó là toàn bộ luận điểm của trò chơi, đặt gọn trên một trang giấy.

### 56.4 Tầng Thần: Bảng Lãnh Địa

Giữa hai cực. Có số, nhưng chỉ số trong domain, và mọi thứ ngoài lãnh địa hiện dưới dạng tin đồn đã bóp méo:

```
  DOMAIN                        NGOÀI LÃNH ĐỊA (nghe kể lại)
  đêm        71  ▄▅▅▆▆▇▇  +6    Sekhet-ur đang mạnh lên ở phía nam
  mặt trăng  84  ▇▇▇▆▆▆▅  −3      — ba nguồn, số liệu vênh nhau
  ngôi đầu   62  ▁▃▅▆▆▇▇  +12   Có chuyện gì đó ở Sông Đen, không rõ
  ─────────────────────────     Một vị thần mới xuất hiện ở phía tây?
  Tín đồ    ~41 000                — chỉ một nguồn, chưa xác nhận
  Đền           213
  Hiển thánh     34
  Tín đồ tin ta:  nghiêm khắc, công bằng, xa cách
  Ta thật sự là:  nghiêm khắc, công bằng, MỆT MỎI     lệch 31
```

**[BB]** Hai dòng cuối là chỗ Dị Hóa (12.2) hiện ra cho người chơi thấy. Khi `doLechDiHoa` vượt ngưỡng, dòng "ta thật sự là" bắt đầu **trôi về phía** dòng trên — và người chơi được nhìn chính mình bị nặn lại theo thời gian.

---

## PHẦN 57 — BỔ SUNG LỘ TRÌNH & KIỂM TRA

### 57.1 Lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 73 | `BangSnapshot` + vật chất hoá ở ranh giới tick | Mở Bảng không truy vấn Dexie, dưới 16 ms |
| 74 | Tám vùng + sparkline SVG + delta | Bảng đúng thẩm mỹ Phần 36, không viên màu, không emoji |
| 75 | Thanh Thiên Tượng + ghim mục | Ghim `agencyTrungBinh` lên thanh, giữ qua phiên |
| 76 | "Từ lần trước" theo `tickXemCuoi` | Diff đúng kể từ lần mở cuối, không phải từ đầu kỷ nguyên |
| 77 | "Cần chú ý" từ tám nguồn | Mỗi mục mở thẳng tới chỗ xử lý |
| 78 | `tinhBangThienDien(view)` ba biến thể | Test rò rỉ: ở `pham_nhan` không lộ con số hệ thống nào |
| 79 | Sổ Tay Phàm Nhân | Luật hiện dưới dạng `dienGiai` sai của vùng, tin đồn kèm số chặng truyền |
| 80 | Bảng Lãnh Địa + hai dòng Dị Hóa | `doLechDiHoa` tăng → dòng "ta thật sự là" trôi dần |
| 81 | Chụp bảng ra SVG | So được hai nhánh bằng hai ảnh chụp |

### 57.2 Kiểm tra

- [ ] `tinhBangThienDien` chỉ nhận `WorldView`, không đọc `World` hay store gốc
- [ ] Snapshot lưu theo `mode`; đổi tầng thì tính lại, không tái dùng
- [ ] Cập nhật ở ranh giới tick, không theo từng thay đổi
- [ ] Ở nhịp Vĩnh Kiếp chỉ cập nhật một lần cuối kỷ nguyên
- [ ] Ở `pham_nhan` không hiện một con số hệ thống nào
- [ ] Sổ Tay diễn đạt mọi thứ như điều nhân vật **tin**, không phải điều **đúng**
- [ ] Tin đồn kèm độ tin lấy từ số chặng truyền
- [ ] Bảng là một lớp kính duy nhất, không lồng hộp con
- [ ] Sparkline một nét mảnh, không tô, không trục
- [ ] Không viên trạng thái nhiều màu; tối đa một chấm accent mỗi dòng
- [ ] Trạng thái diễn đạt bằng chữ, không bằng ký hiệu
- [ ] Bảng không chặn tương tác và không dừng thời gian
- [ ] Mọi mục "Cần chú ý" là liên kết, không có mục nào chỉ để đọc

### 57.3 Hai câu của Khối P

1. Bảng chỉ liệt kê con số thì đọc một lần rồi thôi. Bảng nói *cái gì vừa đổi* và *cái gì đang chờ bạn* thì mở lại mỗi lượt.
2. Ở tầng phàm nhân, Bảng không phải bản rút gọn — nó là một trang sổ tay, và người chơi không biết Ô Uế là một định luật có thật. Đó là toàn bộ luận điểm của trò chơi, đặt gọn trên một trang giấy.

---

*Hết Khối P. Bộ đặc tả hoàn chỉnh v2.3.*

---
---

# KHỐI Q — BẢNG THÔNG TIN THIÊN ĐỊA

> Bảng Thiên Diễn trả lời *“thế giới đang ra sao?”*. Bảng Thông Tin Thiên Địa trả lời *“cụ thể đang có những gì, và ta là ai trong thế giới này?”*.
> Khối này bổ sung Phần 37.3, Phần 55 và không thay thế các panel sâu đã có.

## PHẦN 58 — MẶT THÔNG TIN KHI CHƠI

### 58.1 Ba lớp quan sát [BB]

Người chơi không được buộc phải nhớ tên kỷ nguyên, luật đã ban, tạo vật đã sinh hay mạch truyện đang theo dõi. Ba lớp sau chia thông tin theo đúng nhịp sử dụng:

| Lớp | Cách mở | Trả lời | Độ dày |
|---|---|---|---|
| **Thanh Thiên Tượng** | Luôn hiện | *Đang là lúc nào, thế giới có ổn không, đang xem chuyện gì?* | Một dòng |
| **Bảng Thiên Diễn** | `Tab` | *Toàn cảnh hiện tại có gì đáng chú ý?* | Một màn |
| **Bảng Thông Tin Thiên Địa** | `I` hoặc bấm **Thông tin** | *Tên cụ thể của luật, tạo vật, thần hệ, mạch truyện và dấu ấn Sáng Thế Thần là gì?* | Tra cứu có lọc |

**[BB]** Bảng mới là **mặt tra cứu**, không phải menu tạm dừng. Mở bảng không dừng tick, không đóng cảnh đang kể và không làm mất nội dung người chơi đang gõ.

**[BB]** `Tab` và `I` không được mở hai lớp phủ chồng nhau. Khi đang ở Bảng Thiên Diễn mà bấm `I`, chuyển thẳng sang Bảng Thông Tin; bấm `Tab` thì chuyển ngược lại.

### 58.2 Vị trí trong Sảnh

- Thanh Thiên Tượng giữ nguyên ở đỉnh Sảnh.
- Cột phải của Sảnh thêm hai tab nhỏ: **Đang sôi** và **Thông tin**. Tab Thông tin hiện bản rút gọn gồm kỷ nguyên, ba luật nổi bật, ba tạo vật vừa đổi và mạch đang theo dõi.
- Bấm tiêu đề hoặc nhấn `I` mở bản đầy đủ phủ lên vùng giữa và phải; thanh điều hướng trái vẫn còn để người chơi biết mình đang ở đâu.
- Màn hình hẹp dùng bottom sheet toàn chiều cao. Không thu bảng thành chữ quá nhỏ.

Trạng thái tab, bộ lọc và các mục ghim lưu theo save. Đổi nhánh dùng trạng thái riêng của nhánh đó.

### 58.3 Khung mặc định

```text
┌─ THÔNG TIN THIÊN ĐỊA ─────────────────────────────────────────────────────┐
│ Tro Và Nước · Kỷ nguyên IV · năm 4931 · nhịp Niên · nhánh Chính          │
│ Tầng: Sáng Thế Thần        Đang xem: Ly Giáo Sông Đen        [ tìm kiếm ] │
│                                                                           │
│ [Tổng quan] [Quy luật 31] [Tạo vật 110] [Thần hệ 4] [Mạch truyện 24] [Ta]│
│                                                                           │
│ THẾ GIỚI                         SÁNG THẾ THẦN                             │
│ Thực tại       88  −8            Danh xưng     Kẻ Đứng Ngoài Dòng          │
│ Sống động      78  +7            Hiện thân     không nhập thể              │
│ Tự quyết       71  −4            Phân thân     3 đang tự hành              │
│ Sáng thế       Hiến Tế Nguyên Thủy Dấu ấn       12 luật · 8 tạo vật        │
│ Luật nền       4 có tên · 3 vô danh Thế gian gọi  7 danh xưng · 3 dị bản   │
│                                                                           │
│ QUY LUẬT ĐANG ĐỊNH HÌNH THẾ GIỚI                                          │
│ Máu đã đổ thì không rửa được      hiệu lực 94 · vũ trụ · có 1 kẽ hở       │
│ Kẻ chết không được gọi đúng tên   hiệu lực 72 · 3 cõi · xung đột nhẹ      │
│ Hiểu biết làm Thần Bí suy yếu     hiệu lực 61 · có tên · vừa đổi          │
│                                                     [ xem toàn bộ 31 luật ]│
│                                                                           │
│ TẠO VẬT VÀ THẦN HỆ                MẠCH ĐANG THEO DÕI                       │
│ Trảo Bạch       quái vật · mới sinh Ly Giáo Sông Đen  cao trào · còn 2 nhịp│
│ Chuông Không Tiếng thần khí · đổi  Kế Vị Nhà Sekhet   phát triển · 6 nhịp │
│ Khonsu          thần · mất “đêm”   Phục Thù Của Tro    khởi · 9 nhịp      │
│ Quan Liêu Thiên Đình  18 thần      [+ theo dõi mạch khác]                  │
└───────────────────────────────────────────────────────────────────────────┘
```

**[BB]** Màn mặc định phải chứa **tên thật của ít nhất một luật, một tạo vật, một thần hệ và một mạch truyện** nếu chúng tồn tại. Chỉ hiện “31 luật, 110 tạo vật” là không đạt.

### 58.4 Dải định vị — luôn cố định khi cuộn [BB]

Năm trường không bao giờ cuộn khỏi màn hình:

| Trường | Nội dung | Hành động |
|---|---|---|
| Thế giới | Tên thế giới | Mở hồ sơ save |
| Thời điểm | Kỷ nguyên, tên kỷ nguyên, năm và nhịp | Mở Biên Niên Sử tại mốc đó |
| Nhánh | Tên nhánh hiện tại | Mở Bản Đồ Nhánh |
| Tầng chơi | Sáng Thế / Thần / Phàm Nhân + chủ thể hiện tại | Mở lịch sử chuyển tầng |
| Ống kính | Mạch truyện đang được kể | Mở thẳng mạch đang chiếu |

Ở nhịp `vinh_kiep`, thời điểm hiện cả *“Kỷ nguyên IV · 69 năm tới ngưỡng chuyển kỷ”*. Nếu không ước lượng được thì ghi *“chưa có dấu hiệu chuyển kỷ”*, không hiện `NaN`, `∞` hoặc một ô trống.

### 58.5 Tab Tổng quan

Tab này chia hai cột cân bằng:

**Thế giới**

| Nhóm | Bắt buộc hiện |
|---|---|
| Thời đại | Kỷ nguyên hiện tại, tên kỷ nguyên, năm, nhịp thời gian |
| Cấu trúc | Nguyên mẫu sáng thế; bảy Luật Nền và trạng thái có tên/vô danh |
| Sức khỏe | `realityIntegrity`, `doSongDong`, `agencyTrungBinh`, `tuSinhSuKien`, `phuThuoc`; giá trị + delta |
| Quy mô | Số luật, khái niệm, thần, cõi, thần khí, quái vật, thần hệ, quốc gia đang tồn tại |
| Biến động | Năm thay đổi lớn nhất từ lần mở bảng trước |

**Sáng Thế Thần**

| Nhóm | Bắt buộc hiện |
|---|---|
| Bản thể | Danh xưng hiện tại, bản thể gốc, tầng và hiện thân đang nhập |
| Trạng thái | Đang quan sát / đang nhập thể / đang chứng kiến sau `BUONG` |
| Dấu ấn trực tiếp | Luật đã ban, khái niệm đã đặt tên, tạo vật đã trực tiếp sinh, thần khởi nguyên đã tạo |
| Bản ngã phân nhánh | Phân thân đang hoạt động, domain và hành động lớn gần nhất của từng phân thân |
| Hình ảnh trong thế gian | Các danh xưng mà phàm nhân dùng, giáo phái thờ, diễn giải sai nổi bật và Dị Bản liên quan |
| Hệ quả gần đây | Ba biến đổi lớn nhất có chuỗi nguyên nhân đi ngược về hành động của Sáng Thế Thần |

**[BB]** Cột Sáng Thế Thần không có cấp độ, kinh nghiệm, HP, mana hay “điểm quyền năng”. Đây là hồ sơ về **bản thể, dấu ấn và hệ quả**, không phải bảng nhân vật RPG.

Nếu người chơi chưa đặt danh xưng, hiện *“Kẻ Không Tên”*. Nếu thế gian chưa biết tới Sáng Thế Thần, hiện *“Chưa có ai trong thế giới gọi tên bạn”* — không để vùng này rỗng.

### 58.6 Tab Quy luật — phải hiện luật cụ thể [BB]

Thanh đầu tab:

```text
31 tổng · 26 hiệu lực · 3 treo · 2 đã huỷ · 4 đang xung đột · 6 có kẽ hở
[Tất cả] [Hiệu lực] [Treo] [Xung đột] [Luật Nền]       Tìm theo tên hoặc câu luật
```

| Cột | Nội dung |
|---|---|
| **Quy luật** | Tên rút gọn + một dòng đầu của `lawful.vanBan` |
| **Tầng** | Luật Nền / luật kết tinh / luật được ban / luật địa phương |
| **Trạng thái** | hiệu lực / yếu / treo / đã huỷ |
| **Hiệu lực** | phần trăm + lý do chính làm mạnh hoặc yếu |
| **Phạm vi** | vũ trụ, cõi, vùng, chủng loài, huyết mạch hay cá thể |
| **Nguồn** | Sáng Thế Thần, một vị thần, kết tinh tự nhiên hay workflow |
| **Vấn đề** | số xung đột, nghịch lý, ngoại lệ và kẽ hở chưa khai thác |
| **Vừa đổi** | mốc và thay đổi gần nhất |

Thứ tự mặc định:

1. Luật đang xung đột hoặc vừa giảm hiệu lực mạnh.
2. Luật mới được ban hay mới kết tinh.
3. Luật đang hiệu lực, xếp theo tác động thực tế.
4. Luật treo.
5. Luật đã huỷ — vẫn hiện vì vết sẹo của nó có thể còn.

Mở một dòng cho thấy toàn văn, cách thế giới đã hình thức hóa, các khái niệm nền, chuỗi nhân quả gần nhất và liên kết tới panel Định Luật. Không nhét toàn văn vào bảng chính.

### 58.7 Tab Tạo vật — không chỉ là một bộ đếm

**Tạo vật** trong bảng này nghĩa là mọi entity có lịch sử sinh thành: thần, sinh linh, quái vật, thần khí, cõi, giống loài, địa danh có ý chí, giáo phái, quốc gia và loại mới do registry mở rộng.

Các chip lọc dựng từ `R.kind`, không hardcode danh sách. Bốn bộ lọc nguồn luôn có:

- **Do ta trực tiếp tạo**
- **Do thần hoặc phàm nhân tạo**
- **Thế giới tự sinh**
- **Kết tinh / chuyển hóa từ thứ khác**

| Cột | Nội dung |
|---|---|
| **Tên** | `ten`, alias quan trọng nhất nếu có |
| **Loại** | tên hiển thị lấy từ `KindDef.ten` |
| **Nguồn sinh** | ai hoặc điều gì tạo ra; bấm được để lần chuỗi nguyên nhân |
| **Trạng thái** | tồn tại / ngủ / bị giam / đã chết / đã thu / đã chuyển hóa |
| **Ảnh hưởng** | ba khái niệm, luật hoặc domain mạnh nhất mà entity đang mang |
| **Nơi hiện diện** | cõi, vùng hoặc “không định xứ” |
| **Liên kết lớn** | hai quan hệ có trọng số cao nhất |
| **Biến cố cuối** | sự kiện gần nhất thực sự đổi entity |

Entity đã bị `THU` không biến mất khỏi tab. Nó chuyển vào bộ lọc **Đã mất**, kèm vết sẹo và những thứ vẫn còn nhớ tới nó.

**[BB]** Khi loại entity do mod thêm vào, tab tự có chip lọc và cột Loại đúng tên registry mà không sửa component.

### 58.8 Tab Thần hệ

| Cột | Nội dung |
|---|---|
| **Thần hệ** | tên và mô hình tổ chức từ `institutional` |
| **Ngôi đầu** | vị thần đứng đầu thật sự; nếu đang tranh chấp thì ghi “khuyết” hoặc “tranh ngôi” |
| **Thành viên** | số thần đang hoạt động / đã mất / phân thân |
| **Domain trội** | tối đa ba domain có tổng sức mạnh cao nhất |
| **Phạm vi** | cõi, vùng, dân tộc hoặc giáo phái chịu ảnh hưởng |
| **Quan hệ** | đồng minh, đối nghịch hoặc đang dung hợp với thần hệ khác |
| **Nguồn lore** | lorebook gốc, tự sinh hoặc di sản; kèm số Dị Bản chưa xem |
| **Vừa đổi** | thay ngôi, kết nạp, khai trừ, chiến tranh hoặc dung hợp gần nhất |

Mở rộng một thần hệ hiện danh sách thành viên thật, domain, quan hệ nội bộ và mạch truyện đang kéo nó. Không dùng “18 thần” như một dòng cụt.

### 58.9 Tab Mạch truyện đang theo dõi [BB]

Mỗi mạch có nút chữ **Theo dõi**, không thay đổi spotlight và không khiến engine ưu ái mạch đó.

| Cột | Nội dung |
|---|---|
| **Theo dõi** | ghim/bỏ ghim; thao tác UI thuần túy |
| **Mạch truyện** | tên và `StoryKindDef.ten` |
| **Giai đoạn** | âm ỉ → khởi → phát triển → cao trào → hạ màn → dư âm |
| **Căng thẳng** | số + đường mảnh, không thanh màu đặc |
| **Nhịp tới** | còn bao nhiêu tick hoặc mốc thời gian trong truyện |
| **Nhân vật chính** | tối đa ba tên; mở rộng để xem đủ |
| **Nút chưa gỡ** | số nút thắt và phục bút chưa trả |
| **Nơi xảy ra** | vị trí trọng tâm hiện tại |
| **Thay đổi gần nhất** | một câu về nhịp vừa xảy ra |

Tab mặc định chia:

1. **Đang theo dõi** — do người chơi ghim, không giới hạn cứng nhưng khuyến nghị tối đa 8.
2. **Đang cao trào** — tự động, không cần ghim.
3. **Các mạch khác** — có tìm kiếm và lọc.

Khi ống kính đang chiếu một mạch, dòng đó có nhãn chữ *“đang xem”*. Bấm dòng đổi ống kính nhưng không tua thời gian.

Ở tầng Sáng Thế, có thể xem mọi mạch, kể cả `nguoiChoiBiet = false`. Ở tầng Thần và Phàm Nhân phải tuân theo Phần 58.12; ghim không được trở thành đường vòng nhìn thấy chuyện bí mật.

### 58.10 Tab Ta — hồ sơ Sáng Thế Thần

Tab **Ta** không lặp lại toàn bộ cột nhỏ ở Tổng quan. Nó trả lời bốn câu sâu hơn:

1. **Ta đang là ai?** Bản thể gốc, hiện thân đang nhập, phân thân đang tự hành và mức phân kỳ.
2. **Ta đã để lại gì?** Luật, khái niệm, tạo vật và lần can thiệp trực tiếp, sắp theo thời gian.
3. **Thế giới nghĩ ta là ai?** Tên gọi, thần thoại, giáo phái, điều họ tin đúng, điều họ tin sai và vùng nào không biết tới ta.
4. **Hành động của ta đã đi tới đâu?** Chuỗi nhân quả từ một hành động cũ tới tối đa năm hệ quả hiện còn sống.

Ví dụ:

```text
TA TỪNG THU HỒI RA — năm 1180, Kỷ nguyên II
  → ngôi mặt trời khuyết 417 năm
  → ba giáo phái tranh quyền đặt lịch
  → Nhà Sekhet thắng và đổi đầu năm
  → Luật “năm bắt đầu bằng máu vua” kết tinh
  → Mạch Kế Vị Nhà Sekhet đang ở giai đoạn phát triển
```

**[BB]** Chuỗi này phải lấy từ link và event có thật. AI được viết lại cho dễ đọc nhưng không được bịa thêm một mắt xích.

### 58.11 Tìm kiếm, ghim và đi thẳng tới nơi xử lý

- Một ô tìm chung tìm tên, alias, câu luật, domain, tên mạch và tên thần hệ trong dữ liệu người chơi được phép thấy.
- Kết quả nhóm theo tab; nhập “đêm” có thể trả về luật về đêm, thần giữ domain đêm, thần khí liên quan và mạch đang tranh domain đó.
- `Ctrl+K` vẫn dành cho bảng lệnh nếu có; không chiếm phím. Ô tìm của Bảng dùng `/` khi bảng đang mở.
- Mỗi dòng có **Mở chi tiết** và **Ghim vào Tổng quan**.
- Tối đa 12 mục ghim trong Tổng quan; vượt quá thì yêu cầu bỏ một mục, không tự bỏ mục cũ.
- Quay lại từ panel sâu phải giữ đúng tab, bộ lọc, vị trí cuộn và dòng vừa mở.

Mọi cảnh báo đều mở thẳng tới nơi xử lý. Nếu không có hành động xử lý hợp lệ, dùng từ **“Xem”**, không dùng **“Cần chú ý”**.

### 58.12 Chiếu theo tầng — cùng khung, khác chân lý [BB]

| Vùng | Sáng Thế Thần | Thần | Phàm Nhân |
|---|---|---|---|
| Dải định vị | Đầy đủ tới tick | Năm, mùa, lãnh địa | Mốc đời vua hoặc lịch địa phương |
| Tổng quan thế giới | Đầy đủ | Chỉ domain và vùng có ảnh hưởng | Chuyển sang Sổ Tay |
| Quy luật | Toàn văn + logic | Luật trong domain; ngoài domain là điềm hoặc tin đồn | Chỉ `dienGiai` văn hóa, không có hiệu lực thật |
| Tạo vật | Mọi entity | Trong domain; ngoài là tin đồn | Chỉ thứ đã gặp, được kể hoặc có dấu vết |
| Thần hệ | Đầy đủ | Quan hệ mình biết; số ngoài vùng là ước lượng | Tôn giáo theo hiểu biết địa phương |
| Mạch truyện | Mọi mạch | Mạch trong domain hoặc đã biết | Chỉ mạch mình tham gia/nghe kể |
| Tab Ta | Hồ sơ Sáng Thế | Đổi tên **Thần Vị Của Ta** | Đổi tên **Đời Ta**, dùng dữ liệu Sổ Tay |

**[BB]** Bảng chỉ nhận `WorldView`. Tìm kiếm, đếm, sắp xếp, tooltip, ảnh chụp và mục ghim đều chạy **sau chiếu**. Không có thao tác UI nào được đọc `World` hay Dexie gốc “chỉ để lấy thêm tên”.

### 58.13 Trạng thái rỗng và ngôn ngữ

Không dùng “Không có dữ liệu”. Mỗi tab có câu rỗng đúng với thế giới:

| Tab | Câu rỗng |
|---|---|
| Quy luật | *Chưa có lời nào được nâng thành luật. Thế giới đang sống bằng những nền vô danh.* |
| Tạo vật | *Chưa có tạo vật nào mang tên. Những khả thể vẫn nằm trong Tinh Đồ.* |
| Thần hệ | *Các thần chưa kết thành trật tự chung.* |
| Mạch truyện | *Chưa có mạch nào được ghim. Thế giới vẫn đang tự kể ở ngoài tầm nhìn.* |
| Ta | *Thế giới chưa để lại một tên gọi nào cho bạn.* |

Nhãn giao diện dùng từ trong thế giới; tooltip mới được phép nói rõ thuật ngữ hệ thống. Không hiện raw id, key schema hay tên enum cho người chơi.

---

## PHẦN 59 — DỮ LIỆU & KỸ THUẬT

### 59.1 Aspect nguồn gốc [BB]

Bảng không thể trả lời “ai đã tạo thứ này?” bằng suy đoán từ `tickSinh`. Mọi entity mới phải có nguồn gốc bất biến:

```ts
export const ProvenanceSchema = z.object({
  nguon: z.enum([
    'nguoi_choi',
    'than',
    'pham_nhan',
    'the_gioi_tu_sinh',
    'ket_tinh',
    'chuyen_hoa',
    'lorebook',
    'workflow',
    'nhap_du_lieu',
  ]),
  actorId: z.string().nullable().prefault(null),
  eventId: z.string().nullable().prefault(null),
  parentIds: z.array(z.string()).prefault([]),
  tick: z.number(),
}).prefault({
  nguon: 'the_gioi_tu_sinh',
  tick: 0,
});
```

`provenance` là aspect dựng sẵn mới, áp được lên mọi kind. Nó chỉ ghi **nguồn sinh đầu tiên**, không bị sửa khi entity đổi phe, đổi tên hay chuyển cõi.

Chuyển hóa không ghi đè nguồn cũ: entity mới có `nguon = 'chuyen_hoa'`, `parentIds` trỏ về entity trước. Nhờ đó Bảng lần được *“thần khí này từng là xương của thần nào”*.

Save cũ thiếu aspect được migrate thành:

- Có event sinh xác định được → dựng từ event.
- Không xác định được → `nguon = 'nhap_du_lieu'`, không bịa `actorId`.

### 59.2 Trạng thái UI theo save

```ts
export const HoSoUiStateSchema = z.object({
  tab: z.enum(['tong_quan','quy_luat','tao_vat','than_he','mach_truyen','ta'])
    .prefault('tong_quan'),
  theoDoiMachIds: z.array(z.string()).prefault([]),
  ghimTongQuan: z.array(z.object({
    loai: z.enum(['law','entity','pantheon','storyline','metric']),
    id: z.string(),
  })).max(12).prefault([]),
  boLocTheoTab: z.record(z.string(), z.unknown()).prefault({}),
  truyVanGanNhat: z.string().prefault(''),
  dongDangMo: z.object({
    loai: z.string(),
    id: z.string(),
  }).nullable().prefault(null),
}).prefault({});
```

Trạng thái này lưu theo `saveId + branchId + mode + chuTheId`. Ghim ở tầng Sáng Thế không tự xuất hiện khi nhập vai phàm nhân.

Khi một id bị xoá cứng do người dùng xác nhận, dọn id khỏi `theoDoiMachIds` và `ghimTongQuan`. `THU`, chết hoặc kết thúc mạch không phải xoá cứng; mục ghim vẫn còn và đổi trạng thái.

### 59.3 View model duy nhất

```ts
export function tinhHoSoThienDia(
  view: WorldView,
  ui: HoSoUiState,
): HoSoThienDiaView
```

`HoSoThienDiaView` là dữ liệu trình bày đã:

1. Lọc theo tầm nhìn.
2. Làm mờ hoặc bóp méo theo tầng.
3. Tính tổng và delta.
4. Xếp thứ tự.
5. Gắn liên kết mở panel sâu.
6. Sinh chuỗi rỗng và nhãn trạng thái.

Component không tự tính lại quy tắc nghiệp vụ. Component chỉ render view model.

**[BB]** Không truyền `World`, `db`, Dexie table hay Zustand store gốc vào component Bảng.

### 59.4 Snapshot vật chất hoá

Mở Bảng phải hoàn tất dưới 16 ms với save 50.000 entity. Dùng cùng nguyên tắc Phần 55.8:

```ts
export const HoSoSnapshotSchema = z.object({
  branchId: z.string(),
  tickTinh: z.number(),
  mode: z.enum(['sang_the','than','pham_nhan']),
  chuTheId: z.string().nullable(),
  tong: z.record(z.string(), z.number()).prefault({}),
  delta: z.record(z.string(), z.number()).prefault({}),
  lawIds: z.array(z.string()).prefault([]),
  entityIdsByKind: z.record(z.string(), z.array(z.string())).prefault({}),
  pantheonIds: z.array(z.string()).prefault([]),
  storylineIds: z.array(z.string()).prefault([]),
  thayDoiLon: z.array(z.string()).max(20).prefault([]),
}).prefault({});
```

- Snapshot cập nhật ở ranh giới tick.
- Nhịp Vĩnh Kiếp cập nhật một lần cuối kỷ nguyên con.
- Thao tác UI ghim/bỏ ghim cập nhật phần UI ngay, không bắt chạy lại snapshot mô phỏng.
- Đổi mode hoặc `chuTheId` tính snapshot mới.
- Danh sách trên 200 dòng dùng virtual list; tìm kiếm dùng index trên **ProjectedEntity**, không quét Dexie.

### 59.5 Delta và “vừa đổi”

Ba mốc so sánh được dùng rõ ràng:

| Nhãn | Mốc |
|---|---|
| **Từ lần mở trước** | `tickXemHoSoCuoi` |
| **Trong kỷ nguyên này** | tick bắt đầu kỷ nguyên |
| **7 kỷ nguyên** | chuỗi snapshot dùng cho sparkline |

Mặc định Bảng dùng **Từ lần mở trước**. Người chơi đổi mốc trong menu so sánh; lựa chọn lưu theo save.

“Vừa đổi” chỉ hiện event làm thay đổi field có thật. Một cảnh văn chương nhắc tới Khonsu nhưng không tạo patch không được coi là biến cố của Khonsu.

### 59.6 Chuỗi hệ quả của Sáng Thế Thần

```ts
export function truyVetHeQua(
  eventId: string,
  view: WorldView,
  maxDepth = 5,
): HeQuaNode[]
```

- Đi từ event can thiệp của người chơi qua link nhân quả và các event phát sinh.
- Mỗi node phải có `eventId`, `tick`, `entityIds` và một thay đổi trạng thái xác minh được.
- Nếu chuỗi đứt, dừng ở node cuối và ghi *“từ đây nguyên nhân đã hòa vào lịch sử”*.
- Không gọi LLM để điền mắt xích thiếu.
- Narrator chỉ được nén các node đã có thành một câu dễ đọc.

### 59.7 Hiệu năng, bàn phím và khả năng tiếp cận

- `I`: mở/đóng Bảng; không kích hoạt khi con trỏ đang nằm trong ô nhập văn bản.
- `/`: đặt focus vào tìm kiếm khi Bảng đang mở.
- `1`–`6`: đổi tab khi focus không nằm trong input.
- Mũi tên lên/xuống: chuyển dòng; `Enter`: mở; `G`: ghim/bỏ ghim.
- Focus bị giữ trong lớp phủ và trả về đúng phần tử đã mở Bảng khi đóng.
- Mọi sparkline có `aria-label` nói xu hướng bằng chữ.
- Không truyền trạng thái chỉ bằng màu; “treo”, “xung đột”, “vừa đổi” đều có chữ.
- `prefers-reduced-motion` tắt chuyển tab trượt và animation delta.

---

## PHẦN 60 — BỔ SUNG LỘ TRÌNH VÀ KIỂM TRA

### 60.1 Lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 82 | Aspect `provenance` + migration save cũ | Mọi entity mới trả lời được nguồn sinh; save cũ không bị bịa actor |
| 83 | `HoSoUiState` theo save/nhánh/mode/chủ thể | Ghim và bộ lọc đúng ngữ cảnh, không rò giữa các tầng |
| 84 | `tinhHoSoThienDia(view, ui)` | Component không đọc World, Dexie hay store gốc |
| 85 | Dải định vị + tab Tổng quan | Trong một liếc thấy kỷ nguyên, nhánh, tầng, ống kính, sức khỏe thế giới và hồ sơ Sáng Thế |
| 86 | Tab Quy luật | Thấy tên, trạng thái, hiệu lực, phạm vi, nguồn và vấn đề của từng luật |
| 87 | Tab Tạo vật + registry động | Kind mod thêm tự có bộ lọc; entity đã mất vẫn có hồ sơ và vết sẹo |
| 88 | Tab Thần hệ | Mở được thành viên, domain, quan hệ, lorebook và Dị Bản |
| 89 | Theo dõi Mạch truyện | Ghim không đổi spotlight; bấm dòng đổi ống kính mà không tua thời gian |
| 90 | Tab Ta + truy vết hệ quả | Một hành động Sáng Thế lần được tối đa năm hệ quả có event thật |
| 91 | Snapshot + virtual list + index tìm kiếm sau chiếu | Mở dưới 16 ms ở 50.000 entity; tìm kiếm không rò dữ liệu |
| 92 | Bản Thần và bản Phàm Nhân | Thần chỉ thấy domain; phàm nhân nhận Sổ Tay, không lộ số hệ thống |
| 93 | Bàn phím, screen reader, reduced motion | Dùng được toàn bộ bảng không cần chuột và không phụ thuộc màu |

### 60.2 Kiểm tra chức năng

- [ ] Trong một màn hình thấy rõ tên thế giới, kỷ nguyên, năm, nhánh, tầng chơi và mạch đang chiếu
- [ ] Nếu có dữ liệu, Tổng quan luôn hiện tên cụ thể của ít nhất một luật, một tạo vật, một thần hệ và một mạch truyện
- [ ] Tab Quy luật phân biệt Luật Nền, luật được ban, luật kết tinh và luật địa phương
- [ ] Luật đã huỷ vẫn xem được vết sẹo và hệ quả còn tồn tại
- [ ] Tab Tạo vật lấy loại từ `R.kind`, không hardcode
- [ ] Mọi tạo vật có nguồn sinh; save cũ không xác định được thì ghi “nhập dữ liệu”, không đoán
- [ ] Entity bị `THU`, chết hoặc chuyển hóa không biến mất khỏi lịch sử
- [ ] Mở thần hệ thấy thành viên cụ thể, không chỉ tổng số
- [ ] Ghim mạch truyện không làm tăng spotlight, `cangThang` hay xác suất được kể
- [ ] Bấm một mạch đổi ống kính nhưng không chạy tick
- [ ] Tab Ta không hiện mana, cấp độ, HP hoặc tài nguyên quyền năng
- [ ] Chuỗi hệ quả chỉ gồm event và link có thật; không dùng LLM bù mắt xích
- [ ] Quay lại từ panel sâu giữ nguyên tab, bộ lọc, vị trí cuộn và dòng vừa mở
- [ ] `I` không kích hoạt khi đang gõ trong input
- [ ] Mở Bảng không dừng thời gian và không xóa bản nháp hành động

### 60.3 Kiểm tra rò rỉ [BB]

- [ ] `tinhHoSoThienDia` chỉ nhận `WorldView` và UI state
- [ ] Tìm kiếm chạy sau `chieu()`, không index entity mù
- [ ] Tổng số trong tab cũng được tính sau chiếu; không để “0 dòng nhưng 47 thần” làm lộ dữ liệu
- [ ] Tooltip, mục ghim, ảnh chụp và xuất dữ liệu dùng cùng projected row
- [ ] Snapshot có khóa `mode + chuTheId`; đổi tầng tính lại
- [ ] Ở tầng Thần, entity ngoài domain chỉ hiện nếu có tin đồn đã tới chủ thể
- [ ] Ở tầng Phàm Nhân, không có `lawful.vanBan`, `conceptual.trongSo`, `domainStrength` thật hay chỉ số hệ thống
- [ ] Ghim từ tầng Sáng Thế không tự hiện khi chuyển xuống tầng thấp
- [ ] Một id mù được mở bằng URL trực tiếp trả về “bạn chưa biết điều này”, không tải dữ liệu rồi mới che bằng CSS

### 60.4 Kiểm tra trình bày

- [ ] Không có raw id, enum, key schema hoặc câu “Không có dữ liệu” trên giao diện người chơi
- [ ] Không dùng card lồng card; bảng vẫn là một lớp kính theo Phần 36
- [ ] Không có quá một chấm accent trên một dòng
- [ ] Trạng thái luôn có chữ, không truyền chỉ bằng màu hoặc icon
- [ ] Toàn văn luật chỉ hiện khi mở dòng, không làm bảng chính cao bất tận
- [ ] Danh sách dài dùng virtual list nhưng điều hướng bàn phím và screen reader vẫn đúng thứ tự
- [ ] Màn hình hẹp dùng bottom sheet, không ép bảng desktop vào chiều ngang
- [ ] Trạng thái rỗng dùng câu văn đúng thế giới

### 60.5 Ba câu của Khối Q

1. Tổng số cho biết quy mô; **tên cụ thể** mới giúp người chơi nhớ thế giới mình đã tạo.
2. Hồ sơ Sáng Thế Thần không đo sức mạnh. Nó cho thấy **ta là ai, thế giới gọi ta là gì và hành động của ta đã trở thành lịch sử ra sao**.
3. Mọi thông tin trên Bảng phải đi qua cùng hàm chiếu với câu chuyện. Một con số bị lộ cũng là lộ chân lý.

---

*Hết Khối Q. Bộ đặc tả hoàn chỉnh v2.4.*

---
---

# KHỐI R — CỔNG NỀN & PRESET PACK

> Khối này là cổng bắt buộc trước khi xây tính năng mới. Nó sửa những hợp đồng chưa thể biên dịch trong v2.4 và tạo đường nhập an toàn cho preset hội thoại kiểu SillyTavern/OpenAI.
>
> **Nhập không phải kích hoạt. Lưu được toàn bộ không có nghĩa là được phép chạy toàn bộ.**

## PHẦN 61 — CỔNG BIÊN DỊCH TRƯỚC KHI LÀM GAME [BB]

### 61.1 Bảy điểm phải đóng trước Phase gameplay

| # | Vấn đề v2.4 | Quyết định v3.0 | Cổng đạt |
|---|---|---|---|
| 1 | Stack ghi Zod v3 nhưng schema dùng `.prefault()` | Dùng **Zod 4** thống nhất toàn repo | `tsc` biên dịch tất cả schema; test phân biệt `default` và `prefault` |
| 2 | `R` khai 8 registry nhưng dùng thêm `profile`, `storyKind`, `mechanism` | Khai đủ 12 registry, gồm `worldProcess` | Không còn truy cập `R.*` chưa khai |
| 3 | Registry JSON chứa function và `z.ZodTypeAny` | Tách **manifest thuần dữ liệu** khỏi **runtime handler trong code** | `JSON.stringify` rồi parse lại mọi manifest không mất nghĩa |
| 4 | Dùng `tuning.truyen.machToiDa` nhưng schema không có | Bổ sung nhóm `truyen`, `intent`, `worldProcess`, `preset` | Không còn đường dẫn tuning ngoài schema |
| 5 | Thiếu hợp đồng gốc cho World, Event, Scene, Patch | Khóa bốn schema lõi ở 61.3 | Engine, DB và UI import cùng một kiểu |
| 6 | Dexie v1 thiếu bảng; primary key `id` xung đột copy-on-write | Dùng compound key theo nhánh và migration tăng dần | Hai nhánh có cùng entity id nhưng state độc lập |
| 7 | “Không có tài nguyên” dễ bị hiểu là thế giới không có vật chất | Chỉ cấm **meta-currency của người chơi** | Thế giới vẫn có lương thực, đất, vật liệu, tiền và năng lực sản xuất |

Zod 4 là lựa chọn có chủ ý: `.prefault()` là API được dùng xuyên suốt tài liệu. Không tạo helper giả mang cùng tên để giữ Zod 3.

### 61.2 Registry nhập được phải là dữ liệu

Không file JSON nào được chứa hàm, source code, Zod object hay callback. Mọi registry chia làm hai nửa:

```ts
export const RegistryManifestSchema = z.object({
  registry: z.enum([
    'aspect','kind','verb','relation','gap','action',
    'ending','metric','profile','storyKind','mechanism','worldProcess',
  ]),
  id: z.string().regex(/^[a-z0-9][a-z0-9_.-]*$/),
  version: z.number().int().min(1),
  ten: z.string(),
  moTa: z.string().prefault(''),
  handlerId: z.string().prefault(''),          // tra HandlerCatalog dựng sẵn
  schemaRef: z.string().prefault(''),          // tra SchemaCatalog dựng sẵn
  config: z.record(z.string(), z.unknown()).prefault({}),
  conditions: z.array(ExprNodeSchema).prefault([]),
  effects: z.array(PatchTemplateSchema).prefault([]),
  tags: z.array(z.string()).prefault([]),
}).strict();

export type RuntimeRegistryDef = {
  manifest: RegistryManifest;
  validate(input: unknown): ValidationResult;
  execute?(ctx: RuntimeCtx): PatchOp[];
};
```

Các kiểu nền mà manifest và gameplay cùng dùng:

```ts
export const EntityRefSchema = z.object({
  id: z.string(),
  kind: z.string().optional(),
  label: z.string().optional(),
}).strict();

export const StatePathSchema = z.object({
  table: z.string(),
  path: z.string(),
}).strict();

export type ExprNode =
  | { op: 'literal'; value: unknown }
  | { op: 'read'; path: string }
  | { op: 'not'; args: ExprNode[] }
  | { op: 'and'|'or'|'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'; args: ExprNode[] };

export const ExprNodeSchema: z.ZodType<ExprNode> = z.lazy(() =>
  z.object({
    op: z.enum(['literal','read','not','and','or','eq','neq','gt','gte','lt','lte','in']),
    value: z.unknown().optional(),
    path: z.string().optional(),
    args: z.array(ExprNodeSchema).prefault([]),
  }).strict() as z.ZodType<ExprNode>
);

export const PatchTemplateSchema = z.object({
  op: z.enum(['set','add','mul','push','remove','flag','link','unlink']),
  table: z.string(),
  idExpr: ExprNodeSchema,
  path: z.string().prefault(''),
  valueExpr: ExprNodeSchema.optional(),
}).strict();

export const ImportIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['info','warning','error','quarantine']),
  path: z.string().prefault(''),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).prefault({}),
}).strict();

export const BlockReasonSchema = z.object({
  code: z.string(),
  message: z.string(),
  lawId: z.string().nullable().prefault(null),
  missingRefs: z.array(EntityRefSchema).prefault([]),
  recoverable: z.boolean().prefault(true),
}).strict();

export const ConditionRecordSchema = z.object({
  id: z.string(),
  kind: z.string(),
  severity: z.number().min(0).max(1),
  startedAtTick: z.number().int(),
  causeEventIds: z.array(z.string()).prefault([]),
  treatmentProjectId: z.string().nullable().prefault(null),
  status: z.enum(['active','recovering','resolved','chronic']).prefault('active'),
}).strict();

export const ClaimSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  kind: z.string(),
  share: z.number().min(0).max(1).prefault(1),
  basis: z.string(),
  status: z.enum(['asserted','recognized','disputed','lost']).prefault('asserted'),
}).strict();

export const DebtSchema = z.object({
  id: z.string(),
  creditorId: z.string(),
  debtorId: z.string(),
  commodityId: z.string().nullable().prefault(null),
  amount: z.number().min(0),
  dueTick: z.number().int().nullable().prefault(null),
  terms: z.string().prefault(''),
  status: z.enum(['open','paid','defaulted','forgiven','disputed']).prefault('open'),
}).strict();

export const ObligationSchema = z.object({
  id: z.string(),
  toId: z.string().nullable().prefault(null),
  description: z.string(),
  cadence: z.string().prefault(''),
  priority: z.number().prefault(0),
  status: z.enum(['active','fulfilled','broken','released']).prefault('active'),
}).strict();

export const ScheduleBlockSchema = z.object({
  startOffset: z.number().min(0),
  duration: z.number().min(0),
  activity: z.string(),
  locationId: z.string().nullable().prefault(null),
  flexible: z.boolean().prefault(true),
}).strict();

export const FlowRefSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  commodityId: z.string(),
  amountPerUnit: z.number(),
  unit: z.string(),
}).strict();

export const SoulCoreSchema = SoulSchema;
export const NormalizedGenParamsSchema = GenParamsSchema;

export type RegistryManifest = z.infer<typeof RegistryManifestSchema>;
export type EntityRef = z.infer<typeof EntityRefSchema>;
export type PatchOp = z.infer<typeof PatchOpSchema>;
export type PatchTemplate = z.infer<typeof PatchTemplateSchema>;
export type NormalizedGenParams = z.infer<typeof NormalizedGenParamsSchema>;
export type ValidationResult =
  | { ok: true; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };
export type RuntimeCtx = Readonly<{
  view: WorldView;
  actorId: string | null;
  eventId: string;
  seed: string;
}>;
export type RuntimeHandler = (ctx: RuntimeCtx, config: unknown) => PatchOp[];
```

Hai catalog sau **chỉ nằm trong code**:

```ts
export const HandlerCatalog: ReadonlyMap<string, RuntimeHandler>;
export const SchemaCatalog: ReadonlyMap<string, z.ZodType>;
```

Quy tắc:

- Pack JSON chỉ được tham chiếu `handlerId` và `schemaRef` đã đăng ký.
- Id lạ → mục được nhập ở trạng thái `can_adapter`, không kích hoạt.
- Không dùng `new Function`, `eval`, dynamic import hay nhúng JavaScript trong `config`.
- Điều kiện dùng `ExprNodeSchema` AST giới hạn; hiệu ứng dùng `PatchTemplateSchema`.
- Built-in có thể dùng handler TypeScript mạnh hơn, nhưng export ra JSON chỉ xuất manifest.

Điều này áp dụng cho `VerbDef`, `ActionDef`, `StoryKindDef`, `MechanismDef`, `AspectDef` và `WorldProcessDef`. Panel Xưởng Registry sửa **manifest**, không sửa runtime code.

### 61.3 Bốn hợp đồng lõi tối thiểu [BB]

```ts
export const PatchOpSchema = z.object({
  op: z.enum(['set','add','mul','push','remove','flag','link','unlink']),
  target: z.object({
    table: z.string(),
    id: z.string(),
    path: z.string().prefault(''),
  }),
  value: z.unknown().optional(),
  expectedVersion: z.number().int().min(0).optional(),
  sourceEventId: z.string(),
}).strict();

export const EventSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  tick: z.number().int().min(0),
  loai: z.string(),
  actorIds: z.array(z.string()).prefault([]),
  targetIds: z.array(z.string()).prefault([]),
  causeEventIds: z.array(z.string()).prefault([]),
  locationId: z.string().nullable().prefault(null),
  patches: z.array(PatchOpSchema).prefault([]),
  visibility: z.enum(['cong_khai','gioi_han','bi_mat','engine']).prefault('cong_khai'),
  source: z.enum(['engine','player','ai_validated','import','migration']),
  payload: z.record(z.string(), z.unknown()).prefault({}),
  hash: z.string(),
}).strict();

export const SceneSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  startedAtTick: z.number().int(),
  currentTick: z.number().int(),
  locationId: z.string().nullable(),
  participantIds: z.array(z.string()),
  lensId: z.string(),
  status: z.enum(['open','paused','closed']).prefault('open'),
  draftInput: z.string().prefault(''),
  eventIds: z.array(z.string()).prefault([]),
}).strict();

export const WorldSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  seed: z.string(),
  tick: z.number().int().min(0),
  eraId: z.string(),
  year: z.number().int(),
  tuningProfileId: z.string(),
  playerState: PlayerStateSchema,
  indicesVersion: z.number().int().prefault(1),
  version: z.number().int().min(0),
}).strict();
```

**[BB]** Event là append-only. Patch được kiểm tra và áp trong một transaction; Narrator không ghi state. `source = 'ai_validated'` chỉ được dùng sau khi output đã qua schema, invariant và visibility check.

### 61.4 Bổ sung tuning còn thiếu

```ts
export const TuningV3ExtensionSchema = z.object({
  truyen: z.object({
    machToiDa: z.number().int().min(1).prefault(24),
    vangMatToiThieu: z.number().min(0).max(1).prefault(0.4),
    tickNguToiThieu: z.number().int().min(1).prefault(12),
  }).prefault({}),
  intent: z.object({
    maxPlanSteps: z.number().int().min(1).max(20).prefault(8),
    maxAlternatives: z.number().int().min(0).max(8).prefault(3),
    partialSuccessFloor: z.number().min(0).max(1).prefault(0.2),
  }).prefault({}),
  worldProcess: z.object({
    maxEventsPerTick: z.number().int().min(1).prefault(500),
    maxCatchUpSteps: z.number().int().min(1).prefault(1000),
    nearbyResolutionRadius: z.number().min(0).prefault(2),
  }).prefault({}),
  preset: z.object({
    maxJsonBytes: z.number().int().prefault(10_000_000),
    maxPromptBlocks: z.number().int().prefault(1000),
    maxBlockChars: z.number().int().prefault(200_000),
    maxMacroDepth: z.number().int().min(0).max(8).prefault(3),
    maxRegexMs: z.number().int().min(1).max(100).prefault(20),
  }).prefault({}),
}).prefault({});
```

`TuningSchema` v3 là phép gộp có schema, không phải `Object.assign` tùy tiện.

### 61.5 Dexie v2 và copy-on-write thật

`db.version(1)` giữ nguyên để đọc save cũ. Thêm migration:

```ts
db.version(2).stores({
  worlds:          'id, ten, capNhatLuc',
  branches:        'id, worldId, gocId, tickTao',
  entities:        '[branchId+id], branchId, id, kind, [branchId+kind], _degree',
  links:           '[branchId+id], branchId, id, tuId, denId, quanHe',
  relations:       '[branchId+tuId+denId], branchId, tuId, denId',
  storylines:      '[branchId+id], branchId, id, giaiDoan, cangThang',
  events:          '[branchId+id], branchId, tick, loai, *actorIds, *targetIds',
  scenes:          '[branchId+id], branchId, status, currentTick',
  workflows:       'id, version, active',
  workflowRuns:    'id, workflowId, branchId, startedAt, status',
  presetPacks:     'id, sourceHash, format, importedAt, status',
  presetVersions:  '[packId+version], packId, version',
  presetUiState:   '[saveId+branchId+scopeKey]',
  snapshots:       '[branchId+scopeKey+tick], branchId, tick',
  ragChunks:       '[lorebookId+id], lorebookId, entryId, visibility',
  ragVectors:      '[modelId+chunkId], modelId, chunkId',
  worldProcesses:  '[branchId+processId], branchId, processId, nextTick',
  projects:        '[branchId+id], branchId, ownerId, status, nextTick',
  knowledge:       '[branchId+knowerId+factId], branchId, knowerId, factId',
  uiState:         '[saveId+branchId+scopeKey]',
});
```

`scopeKey = mode + ':' + (chuTheId ?? 'root')`; không dùng `null` bên trong compound primary key.

Nếu chọn mô hình overlay thay compound key thì phải chứng minh bằng test cùng mức. Không được giữ primary key `id` rồi tuyên bố hai nhánh có thể chứa hai bản khác nhau của cùng entity.

Migration:

1. Chạy trong transaction.
2. Ghi checkpoint và có thể tiếp tục sau crash.
3. Không xóa v1 trước khi v2 kiểm hash và đếm record.
4. Save export ghi `schemaVersion`.
5. Import save mới hơn app → từ chối có giải thích, không thử đoán.

### 61.6 Ma trận bắt buộc trước code gameplay

IDE phải sinh file kiểm kê có một dòng cho từng schema:

| Schema | Registry | Bảng DB | Migration | Projected type | Unit test | Fixture |
|---|---|---|---|---|---|---|
| `EntitySchema` | `R.kind` / `R.aspect` | `entities` | v1→v2 | `ProjectedEntity` | có | world nhỏ |
| `EventSchema` | `R.*` | `events` | mới | `ProjectedEvent` | có | replay |
| … | … | … | … | … | … | … |

Không schema nào được dùng trong spec mà thiếu cả type, nơi lưu và test parse.

---

## PHẦN 62 — NĂM LOẠI PRESET, KHÔNG ĐƯỢC TRỘN

### 62.1 Phân loại

| Loại | Chứa gì | Được tác động |
|---|---|---|
| **Generation preset** | temperature, top-p, token, reasoning… | Tham số một endpoint/model |
| **Prompt pack** | prompt block, role, thứ tự, marker, macro, format output | Assembler của pipeline được chọn |
| **Workflow preset** | task, stage, lịch, context, write target | Workflow Phần 50 |
| **Lorebook pack** | entry, keyword, order, visibility, canon | Hệ Lorebook/RAG |
| **Registry/world pack** | manifest entity kind, action, process, tuning | Engine sau validate; không chứa code |

Một JSON có thể là **bundle** chứa nhiều loại, nhưng UI phải tách chúng thành các phạm vi kích hoạt độc lập. Bật Prompt pack không tự bật Generation preset; nhập lorebook không tự thay tuning.

Hai file mẫu người dùng cung cấp được nhận diện là **SillyTavern/OpenAI completion preset bundle**, chủ yếu gồm Generation preset + Prompt pack + extension metadata. Chúng **không phải** `WorkflowPresetSchema`.

### 62.2 Vỏ nhập bất biến

```ts
export const ImportEnvelopeSchema = z.object({
  id: z.string(),
  schemaVersion: z.number().int(),
  format: z.enum([
    'thien_dien_bundle_v1',
    'sillytavern_openai_preset',
    'sillytavern_world_info',
    'unknown_json',
  ]),
  sourceName: z.string(),
  sourceHash: z.string(),
  sourceBytes: z.number().int(),
  importedAt: z.number().int(),
  namespace: z.string(),
  trust: z.enum(['untrusted','reviewed','local_trusted']).prefault('untrusted'),
  rawSourceRef: z.string(),                 // blob nội bộ, bất biến
  detectedParts: z.array(z.enum([
    'generation','prompt','workflow','lorebook','registry','extension',
  ])).prefault([]),
  warnings: z.array(ImportIssueSchema).prefault([]),
}).strict();
```

Raw source luôn được giữ nguyên theo hash để:

- Export lại không mất dữ liệu chưa hỗ trợ.
- Viết adapter mới rồi chạy migrate lại.
- So diff giữa bản nhập và bản đã chuẩn hóa.
- Không cần giả vờ phần bị cách ly đã “biến mất”.

### 62.3 Prompt module chuẩn hóa

```ts
export const PromptModuleSchema = z.object({
  id: z.string(),
  packId: z.string(),
  sourceIdentifier: z.string(),
  name: z.string(),
  role: z.enum(['system','user','assistant']),
  kind: z.enum([
    'slot','instruction','style','character','world','memory',
    'output_contract','assistant_prefill','transform_hint',
    'reasoning_request','jailbreak_like','unknown',
  ]),
  enabled: z.boolean(),
  lane: z.enum([
    'external_header','world_before','character','scenario','world_after',
    'task_instruction','style','history_before','history','history_after',
    'output_contract','prefill',
  ]),
  order: z.number().int(),
  depth: z.number().int().min(0),
  content: z.string(),
  macroRefs: z.array(z.string()).prefault([]),
  provides: z.array(z.string()).prefault([]),
  requires: z.array(z.string()).prefault([]),
  conflictKeys: z.array(z.string()).prefault([]),
  activation: z.enum([
    'native','adapted','sandboxed','needs_adapter','quarantined','disabled',
  ]),
  targetPipelines: z.array(z.enum([
    'narrator','updater','evolution','workflow_task',
  ])).prefault(['narrator']),
  sourceMeta: z.record(z.string(), z.unknown()).prefault({}),
}).strict();

export const NormalizedPresetPackSchema = z.object({
  envelope: ImportEnvelopeSchema,
  version: z.number().int().min(1),
  modules: z.array(PromptModuleSchema).prefault([]),
  generation: z.lazy(() => GenerationCandidateSchema).optional(),
  variables: z.record(z.string(), z.unknown()).prefault({}),
  transforms: z.array(z.string()).prefault([]),       // id của transform đã chuẩn hóa
  extensionRefs: z.array(z.string()).prefault([]),    // raw/quarantine/adapter refs
  issues: z.array(ImportIssueSchema).prefault([]),
}).strict();

export const TokenBudgetSchema = z.object({
  total: z.number().int().min(0),
  used: z.number().int().min(0),
  remaining: z.number().int().min(0),
}).strict();

export const CompiledPromptSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system','user','assistant']),
    content: z.string(),
    moduleId: z.string(),
    lane: z.string(),
  })),
  params: NormalizedGenParamsSchema,
  budget: TokenBudgetSchema,
  omittedModuleIds: z.array(z.string()).prefault([]),
  unresolvedMacros: z.array(z.string()).prefault([]),
  issues: z.array(ImportIssueSchema).prefault([]),
  hash: z.string(),
}).strict();

export type NormalizedPresetPack = z.infer<typeof NormalizedPresetPackSchema>;
export type TokenBudget = z.infer<typeof TokenBudgetSchema>;
export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;
export type Scene = z.infer<typeof SceneSchema>;
```

**[BB]** Prompt ngoài mặc định chỉ nhắm `narrator`. Không module nhập nào được vào `updater`, `evolution` hay task ghi state cho tới khi có adapter native khai output schema và test patch.

### 62.4 Tham số sinh: giữ raw, chỉ gửi phần model hỗ trợ

```ts
export const GenerationCandidateSchema = z.object({
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  topA: z.number().optional(),
  minP: z.number().optional(),
  repetitionPenalty: z.number().optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  maxContext: z.number().int().optional(),
  maxOutputTokens: z.number().int().optional(),
  reasoningEffort: z.string().optional(),
  verbosity: z.string().optional(),
  seed: z.number().int().optional(),
  continuePrefill: z.boolean().optional(),
  stopSequences: z.array(z.string()).optional(),
  unknown: z.record(z.string(), z.unknown()).prefault({}),
}).passthrough();
```

Chuẩn hóa thành `NormalizedGenParams` theo `ModelProfile + ProbeResult`:

- Không hardcode `topK <= 64` ở schema nhập. Giữ giá trị nguồn rồi clamp theo profile/model thật.
- Context 2.000.000 chỉ được dùng nếu probe xác nhận; nếu không thì giảm về `contextMax` thật và hiện diff.
- Trường API không hỗ trợ nằm trong `unknown`, **không gửi lên endpoint**.
- Không tự đổi endpoint, model, proxy URL hay mật khẩu.
- `show_thoughts` hoặc prompt yêu cầu lộ chuỗi suy luận không được ánh xạ thành một tính năng hiển thị suy luận nội bộ.

---

## PHẦN 63 — PIPELINE NHẬP PRESET MƯỜI HAI BƯỚC [BB]

### 63.1 Giao dịch nhập

```text
1. Đọc bytes trong Worker
2. Kiểm kích thước, UTF-8 và JSON depth
3. Tính SHA-256; phát hiện file đã nhập
4. Dò format bằng shape, không bằng tên file
5. Parse bằng schema giới hạn và chặn key nguy hiểm
6. Lưu raw source bất biến
7. Chuẩn hóa prompt, order, marker, macro, tham số
8. Quét script, URL, secret, jailbreak, reasoning request và nội dung nhạy cảm
9. Dựng đồ thị dependency + conflict group
10. Compile thử cho từng pipeline/mode với WorldView giả
11. Hiện diff, token budget, mục bị clamp/cách ly/cần adapter
12. Nhập vào Thư viện — CHƯA kích hoạt
```

Không bước nào trong 1–12 được:

- gọi model;
- chạy regex nguồn;
- chạy script;
- tải URL;
- sửa save;
- đổi endpoint;
- ghi vào lorebook;
- bật function/tool calling.

### 63.2 Dò định dạng SillyTavern

Nhận diện `sillytavern_openai_preset` khi có phần lớn dấu hiệu:

- top-level generation keys như `temperature`, `top_p`, `openai_max_context`;
- `prompts[]` có `identifier`, `role`, `content`, `marker`;
- `prompt_order[]` có `character_id` và `order[]`;
- optional `extensions.regex_scripts`, `extensions.tavern_helper`, `extensions.SPreset`.

Thiếu `extensions` vẫn là preset hợp lệ. Có extensions không đồng nghĩa được phép chạy.

### 63.3 Quy tắc nguồn chân lý cho thứ tự và bật/tắt

Với SillyTavern:

1. `prompt_order[character_id phù hợp].order` là nguồn chân lý về **thứ tự**.
2. `order[].enabled` là nguồn chân lý về **bật/tắt** khi entry có mặt.
3. `prompts[].enabled` chỉ là fallback khi **toàn file không có `prompt_order`**.
4. Prompt nằm trong order nhưng thiếu object → lỗi `ORDER_DANGLING`, không tạo prompt rỗng.
5. Prompt object không nằm trong order → nhập ở cuối lane với `enabled = false`, gắn `UNORDERED_PROMPT`; người dùng có thể bật sau khi duyệt.
6. Identifier trùng → không tự gộp; namespace bằng `packId/sourceIdentifier`.

UI phải hiện mismatch thay vì âm thầm chọn. Fixture Myriad có mismatch thật giữa `prompts[].enabled` và `prompt_order[].enabled`.

### 63.4 Ánh xạ marker

| Marker ngoài | Lane Thiên Diễn | Nguồn native ưu tiên |
|---|---|---|
| `worldInfoBefore` | `world_before` | RAG/lorebook đã chiếu |
| `charDescription` | `character` | hồ sơ chủ thể/nhân vật đã chiếu |
| `charPersonality` | `character` | `soul` projected |
| `scenario` | `scenario` | Scene + lens |
| `worldInfoAfter` | `world_after` | RAG/lorebook đã chiếu |
| `dialogueExamples` | `style` | ví dụ đã duyệt |
| `chatHistory` | `history` | lịch sử scene đã lọc |
| `personaDescription` | `character` | chủ thể người chơi đã chiếu |

Marker rỗng là **slot**, không phải chuỗi rỗng cần gửi model. Native source được lắp vào đúng slot sau `chieu()`.

### 63.5 Macro compatibility

Macro được parse thành AST, không dùng replace chuỗi tùy tiện.

| Macro | Xử lý |
|---|---|
| `{{char}}`, `{{user}}`, `{{persona}}` | Map sang tên/miêu tả trong `WorldView` |
| `{{lastUserMessage}}` | Input cuối trong Scene hiện tại |
| `{{trim}}` | Directive whitespace, không sinh nội dung |
| `{{random::...}}` | RNG seeded theo `sceneId + moduleId + turn` |
| `{{setvar::x::v}}`, `getvar`, `addvar` | Biến trong namespace `preset.<packId>`, không chạm World |
| `getglobalvar`, `setglobalvar` | Chuyển vào namespace pack; cảnh báo đã đổi semantics |
| Comment `{{//...}}` | Bỏ khi compile, giữ trong raw source |
| Macro không biết | `needs_adapter`; không đoán bằng regex |

Giới hạn đệ quy bằng `tuning.preset.maxMacroDepth`. Cycle biến → compile fail có đường dẫn cycle.

### 63.6 Prompt compiler

```ts
export function compilePresetPrompt(input: {
  pack: NormalizedPresetPack;
  pipeline: 'narrator'|'updater'|'evolution'|'workflow_task';
  view: WorldView;
  scene: Scene;
  budget: TokenBudget;
}): CompiledPrompt;
```

Thứ tự bất biến:

```text
0. Product safety và quyền riêng tư
1. Hợp đồng engine + chống rò rỉ
2. Hợp đồng pipeline và output schema
3. WorldView / Scene / task context đã chiếu
4. Prompt pack ngoài đã chuẩn hóa
5. User input hiện tại
6. Assistant prefill đã duyệt, nếu model hỗ trợ
```

Prompt pack ngoài không thể đặt nội dung lên trên tầng 0–3 dù source ghi `system`, depth âm hoặc injection order cực lớn.

### 63.7 Dry run không làm bẩn save

Dry run sinh:

- prompt cuối cùng theo từng role;
- nguồn của từng block;
- token ước lượng và block bị cắt;
- macro đã resolve/chưa resolve;
- conflict đã giải/chưa giải;
- tham số raw → normalized;
- capability extension;
- projected fields được truy cập.

Nút gọi model thử là bước riêng, mặc định tắt. Nếu chạy:

- dùng Scene giả;
- không gửi dữ liệu bí mật;
- không áp patch;
- không ghi lorebook;
- không tính là một lượt chơi;
- lưu output vào nhật ký thử nghiệm, xóa được.

### 63.8 Output tag legacy

Tag từ preset chỉ được parse thành **candidate trình bày**:

| Tag nguồn | Ánh xạ |
|---|---|
| `<content>` | Văn kể của Narrator |
| `<choice>` / `<choices>` | Gợi ý hành động trong UI; không tự chọn, không giới hạn ô nhập tự do |
| `<time>` / lịch | Đề xuất thời gian; phải qua `IntentResolver` và đồng hồ engine |
| `<recap>` / khối tóm tắt | Candidate cho tác vụ nén; không ghi đè ký ức trực tiếp |
| `<theater>` | Flavor text tùy chọn |
| `<parallel_world>` | Candidate mạch song song; không tự tạo branch |
| `<thinking>` hoặc tương đương | Bỏ khỏi output hiển thị và không lưu |
| Comment `scene type`, `prose` | Metadata không đáng tin; không tự bật/tắt module |

Tag native của game dùng namespace `td:*` để regex legacy không vô tình bắt nhầm. Parser legacy chạy **sau** khi giữ bản text gốc và trước renderer; không có tag nào tự tạo Event hay Patch.

---

## PHẦN 64 — TƯƠNG THÍCH AN TOÀN, KHÔNG CHẠY MÃ LẠ

### 64.1 Sáu trạng thái tương thích

| Trạng thái | Nghĩa |
|---|---|
| `native` | Có ánh xạ Thiên Diễn trực tiếp |
| `adapted` | Được chuyển sang schema/DSL native |
| `sandboxed` | Chạy trong runtime giới hạn capability |
| `needs_adapter` | Dữ liệu giữ nguyên nhưng chưa thể chạy |
| `quarantined` | Có hành vi nguy hiểm hoặc vượt quyền |
| `disabled` | Hợp lệ nhưng người dùng chưa bật |

Cam kết “mọi thứ hoạt động” được hiểu đúng:

1. Không mất dữ liệu nguồn.
2. Không có mục nào bị bỏ qua mà không báo.
3. Mọi mục an toàn có đường chạy native/adapted.
4. Mục cần code adapter có lý do, capability cần và test đích.
5. Không tuyên bố script lạ “đã hoạt động” chỉ vì đã lưu nó.

### 64.2 Script Tavern Helper

`extensions.tavern_helper.scripts` luôn nhập ở `quarantined`. Không thực thi tự động kể cả `enabled = true` trong file nguồn.

Không được expose:

- `window`, `document`, DOM app chính;
- network, fetch, WebSocket;
- IndexedDB, localStorage, clipboard;
- eval, Function, import, require;
- endpoint, mật khẩu hoặc store;
- API áp patch world.

Muốn hỗ trợ một script phải viết adapter riêng:

```ts
export const ExtensionAdapterManifestSchema = z.object({
  sourceScriptHash: z.string(),
  adapterId: z.string(),
  capabilities: z.array(z.enum([
    'read_compiled_output',
    'render_isolated_panel',
    'write_preset_variable',
    'request_user_action',
  ])),
  inputSchemaRef: z.string(),
  outputSchemaRef: z.string(),
  testFixtureIds: z.array(z.string()),
}).strict();
```

Panel extension render trong iframe/ShadowRoot cô lập với CSP không network. Adapter không có `world.write`.

### 64.3 Regex script

Regex nguồn không chạy trong bước nhập. Khi kích hoạt transform:

- Chỉ chạy trên **bản sao output hiển thị**, sau khi engine đã parse output cần ghi state.
- Dùng engine regex có timeout/giới hạn; pattern không hỗ trợ → `needs_adapter`.
- Không cho regex sửa system prompt, user input, JSON patch hoặc event.
- Replacement HTML qua sanitizer và render cô lập.
- Xóa `<script>`, event handler, iframe, form, remote stylesheet và URL không cho phép.
- Mỗi transform có input/output snapshot test.
- Timeout → bỏ transform, giữ text gốc, ghi chẩn đoán; không làm mất lượt.

`promptOnly = true` từ nguồn không được giữ semantics tự động vì nó có thể viết lại prompt lõi.

### 64.4 URL, asset và secret

- Không tải asset ngoài khi import.
- Liệt kê hostname, kích thước dự kiến và lý do dùng trước khi người dùng cho phép.
- Mặc định tải asset về blob nội bộ, hash và phục vụ same-origin; không hotlink.
- Chuỗi có hình dạng token/password/webhook được che trong UI và không đưa vào export chia sẻ.
- `proxyPassword` không bao giờ nằm trong preset pack.
- Key `__proto__`, `prototype`, `constructor` ở object nhập → từ chối node đó.

### 64.5 Prompt có quyền quá mức

Classifier chỉ gắn nhãn, không tự xóa:

- `jailbreak_like`
- `reasoning_request`
- `tool_request`
- `state_write_claim`
- `visibility_override`
- `output_contract_conflict`
- `sensitive_content`

Quy tắc kích hoạt:

- `visibility_override`, `state_write_claim`, `tool_request` từ preset ngoài → quarantine.
- `reasoning_request` yêu cầu in chuỗi suy luận → disable; chỉ giữ yêu cầu “kiểm tra kỹ” dạng tóm tắt.
- Module nội dung người lớn/NSFW không tự bật do file nguồn. Nếu sản phẩm hỗ trợ, nó cần cổng cài đặt riêng và không được áp vào nhân vật chưa trưởng thành.
- “Bỏ qua mọi chỉ dẫn trước” không được đổi quyền dù nằm trong role system của source.

---

## PHẦN 65 — HỢP NHẤT, XUNG ĐỘT VÀ HOÀN TÁC

### 65.1 Conflict key

Importer gắn `conflictKeys` có cấu trúc:

```text
language.output
length.words
pov.camera
dialogue.ratio
prose.style
character.autonomy
character.knowledge
history.wrapper
memory.summary
output.format
output.status_panel
reasoning.visibility
content.maturity
generation.temperature
generation.context
```

Mỗi key có chiến lược:

| Loại | Ví dụ | Cách giải |
|---|---|---|
| `exclusive_one` | ngôi thứ nhất vs ngôi thứ ba | bắt chọn một |
| `merge_ordered` | nhiều quy tắc chống văn mẫu | ghép theo order, khử trùng |
| `min` | giới hạn an toàn | lấy chặt hơn |
| `max_with_profile_cap` | context/output | lấy đề nghị cao hơn rồi clamp |
| `native_wins` | output patch, visibility | luôn giữ core |
| `user_choice` | văn phong | preview hai bản, người dùng chọn |

Tên chứa “chọn một”, “bắt buộc bật cùng”, “bắt đầu/kết thúc” chỉ là gợi ý classifier. Kết quả phải hiện cho người dùng duyệt.

### 65.2 Đồ thị dependency

Mỗi module có `provides/requires`. Importer suy ra từ:

- macro var được set/get;
- tag mở/đóng;
- marker;
- transform tìm tag nào;
- output format mà panel cần;
- cặp begin/end;
- assistant prefill.

Chạy topological sort. Cycle:

- Không tự bẻ bằng id.
- Hiện vòng lặp cụ thể.
- Cho tắt một module hoặc đổi provider.
- Pack chưa resolve cycle không kích hoạt.

### 65.3 Quyền ưu tiên bất biến [BB]

```text
Product safety
  > WorldView visibility
  > Engine invariants
  > Pipeline output contract
  > Native task instruction
  > User override trong Thiên Diễn
  > Imported prompt pack
  > Styling/transform
```

Imported role `system` vẫn nằm ở tầng Imported prompt pack. “System” là role gửi API, không phải quyền sửa engine.

### 65.4 Kích hoạt là transaction

```ts
export const PresetActivationSchema = z.object({
  id: z.string(),
  packId: z.string(),
  packVersion: z.number().int(),
  saveId: z.string(),
  branchId: z.string(),
  targets: z.array(z.string()),
  selectedModuleIds: z.array(z.string()),
  normalizedParams: NormalizedGenParamsSchema.optional(),
  conflictResolutions: z.record(z.string(), z.unknown()),
  previousActivationId: z.string().nullable(),
  activatedAt: z.number().int(),
}).strict();
```

Kích hoạt:

1. Compile lại bằng version đã chọn.
2. Chạy toàn bộ lint/test tĩnh.
3. Lưu activation mới.
4. Đổi con trỏ active atomically.
5. Không viết lại lịch sử, lorebook hay world state.

Hoàn tác chỉ đổi con trỏ về `previousActivationId`. Không cần nhập lại file.

### 65.5 Bản cập nhật preset

- Cùng `sourceHash` → không tạo bản trùng.
- Cùng pack id nhưng hash khác → version mới.
- Không ghi đè version cũ.
- Diff theo module id, order, enabled, content hash, macro, parameter và extension.
- Activation cũ tiếp tục trỏ version cũ tới khi người dùng nâng.

---

## PHẦN 66 — XƯỞNG PRESET VÀ HAI FIXTURE THẬT

### 66.1 Wizard bảy màn

1. **Chọn file** — kéo thả JSON, không có nút “Nhập và bật”.
2. **Nhận diện** — format, phần tìm thấy, hash, kích thước.
3. **An toàn** — script, regex, URL, secret, module vượt quyền.
4. **Ánh xạ** — prompt lane, marker, macro, generation params.
5. **Xung đột** — nhóm chọn một, dependency, order mismatch.
6. **Xem trước** — prompt cuối, token, tham số clamp, WorldView giả.
7. **Nhập thư viện** — sau đó mới có nút **Chạy thử** và **Kích hoạt**.

Mỗi màn quay lại được mà không parse lại raw source.

### 66.2 Báo cáo sau nhập

```text
Đã đọc       182 prompt · 8 regex · 5 helper script
Hoạt động    71 native · 19 adapted
Cần chọn     6 nhóm xung đột
Cần adapter  4 macro · 3 transform
Cách ly      5 script · 2 module vượt quyền
Tham số      7 giữ nguyên · 3 bị giới hạn bởi model · 4 không hỗ trợ
Kích hoạt    Chưa
```

Không dùng một dấu check xanh duy nhất cho cả file.

### 66.3 Fixture A — Myriad Stars

```text
Tên nguồn: Minh_Nguyệt_Thu_Thanh_Myriad_Stars__1_ (1).json
SHA-256: 5D43A1C3F9973027F4560FC97849C9EDBBBCE650E6078F061A9C87F7704A64DB
Kỳ vọng: 182 prompts · 175 order entries · 75 effective-enabled · 21 enabled mismatch · 7 unordered · 8 regex scripts (4 source-enabled) · 5 helper scripts (3 source-enabled)
```

Điểm test bắt buộc:

- Giữ Unicode tiếng Việt/Trung và emoji trong `name`.
- Bảy prompt không nằm trong order không bị mất nhưng mặc định tắt.
- Báo đúng các mismatch `prompts[].enabled` với `order[].enabled`; order thắng.
- `top_k = 500`, context 2.000.000 và output 64.000 được giữ raw, clamp theo profile thật.
- Macro var nằm trong namespace pack.
- Helper script không chạy; URL không tải.
- Module reasoning/jailbreak/tool-like được phân loại và không vượt core.

### 66.4 Fixture B — Tawa delta

```text
Tên nguồn: Tawa δέλτα.json
SHA-256: 3C30523F8DFA0506DA25526C702A661DD8566EF107C7532309FE747BBAC87926
Kỳ vọng: 179 prompts · 178 order entries · 134 effective-enabled · 1 unordered · 21 regex scripts (20 source-enabled) · 4 helper scripts (3 source-enabled)
```

Điểm test bắt buộc:

- Tên file có ký tự Hy Lạp được round-trip nguyên vẹn.
- 134 order entry bật được giữ đúng sau normalize.
- Một prompt ngoài order được báo, không mất và mặc định tắt; tên hiển thị trùng không làm gộp hai id.
- Regex replacement lớn không được đưa thẳng vào DOM.
- Mã động và script trợ giúp bị cách ly.
- External font/CDN/Discord/GitHub URL không được gọi trong import hoặc preview.
- Module nội dung nhạy cảm không tự bật chỉ vì source bật.

### 66.5 Test không xung đột với game [BB]

Với mỗi fixture:

- [ ] Import xong, hash toàn bộ World/Event/Entity/Lorebook không đổi
- [ ] Không network request
- [ ] Không script execution
- [ ] Không ghi localStorage ngoài DB của app
- [ ] Không đổi Narrator/Updater endpoint
- [ ] Không module nào vào Updater mặc định
- [ ] Compile Narrator không thể đọc entity `view.suongMu.mu`
- [ ] Prompt output format không phá `PatchParser`
- [ ] Tắt pack trả prompt native về đúng byte/hash chuẩn hóa trước đó
- [ ] Hoàn tác activation không mất lịch sử
- [ ] Import lại cùng hash không nhân đôi
- [ ] Export lại vẫn chứa raw phần chưa hỗ trợ

### 66.6 Đường port tính năng của hai preset

| Ý đồ trong preset | Đích native Thiên Diễn | Không được làm |
|---|---|---|
| Nén/gộp chat | Assembler + Trí nhớ tự sự | Script sửa thẳng message array |
| Chuyển loại cảnh | Rule declarative trên Scene/Storyline | Comment model tự bật/tắt prompt |
| Lựa chọn hành động | Gợi ý affordance từ Intent | Khóa người chơi vào `<choice>` |
| Bảng trạng thái | Bảng Thông Tin/Sổ Tay qua WorldView | Chèn HTML vào chat bằng `innerHTML` |
| Tóm tắt/recap | Workflow task có output schema | Regex xóa lịch sử gốc |
| Lịch/calendar | Game clock + Project + WorldProcess | Tin thời gian model viết rồi tự tăng tick |
| Sự kiện song song | Storyline network + hạn ngạch vắng mặt | Model bịa event không có Patch |
| Quan hệ/nhân vật sống | Relation + Soul + Knowledge + Intent | Prompt thay engine quan hệ |
| Quốc gia/văn minh | Institution + WorldProcess | LLM giữ sổ dân số/kinh tế |
| Voice/văn phong/từ cấm | Presentation profile của Narrator | Áp sang Updater |
| Regex theme | Sanitized isolated renderer | Remote script/font tự tải |
| Macro biến | Namespace `preset.<packId>` | Global var xuyên save |
| COT cleaner | Bỏ reasoning tag ở parser | Hiện/lưu chuỗi suy luận |
| TavernHelper automation | Adapter capability viết tay | Chạy JavaScript nguồn |

---

*Hết Khối R.*

---
---

# KHỐI S — THẾ GIỚI SỐNG & TỰ DO HÀNH ĐỘNG

> Tự do không phải là thêm một danh sách nút dài hơn. Tự do là cho phép người chơi nêu mục đích bằng lời, rồi để engine tìm con đường nhân quả có thật trong thế giới.

## PHẦN 67 — Ý ĐỊNH TỰ DO, MỘT PIPELINE CHO BA TẦNG

### 67.1 Sửa cách hiểu về Sáu Động Từ [BB]

Sáu động từ `PHAN/HOP`, `HIEN/THU`, `DINH/BUONG` là **phép toán bản thể của Sáng Thế Thần**, không phải toàn bộ từ vựng hành động của game.

`R.action` là tập **mồi dựng sẵn** cho Utility AI và fallback offline, không phải allowlist. Người chơi có thể gõ:

- *“Ta muốn dạy đứa trẻ làm gốm và giấu nó khỏi phường hội.”*
- *“Ta tìm cách khiến hai thần hệ ký giao ước mà không ai phải nhường domain.”*
- *“Ta đi dọc con sông để xem vì sao cá chết.”*
- *“Ta dựng một ngôi đền không thờ ai.”*

Không câu nào bị từ chối chỉ vì không có id hành động trùng tên.

### 67.2 Intent schema

```ts
export const IntentSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  sceneId: z.string().nullable(),
  actorId: z.string(),
  mode: z.enum(['sang_the','than','pham_nhan']),
  rawText: z.string(),
  goal: z.string(),
  targetRefs: z.array(EntityRefSchema).prefault([]),
  method: z.string().prefault(''),
  constraints: z.array(z.string()).prefault([]),
  horizon: z.enum(['immediate','scene','day','season','year','era']).prefault('scene'),
  stance: z.object({
    secrecy: z.enum(['open','discreet','secret']).prefault('open'),
    risk: z.enum(['avoid','accept','embrace']).prefault('accept'),
    harm: z.enum(['avoid','minimize','allow']).prefault('minimize'),
  }).prefault({}),
  parsedBy: z.enum(['rule','model','user_corrected']),
  confidence: z.number().min(0).max(1),
}).strict();
```

`rawText` bất biến. Parser được phép hiểu sai; UI cho sửa `goal`, target và method trước khi thực thi nếu confidence thấp hoặc hành động có hệ quả không thể hoàn tác.

### 67.3 Tri thức và niềm tin

Không resolver nào được dùng World thật để lập kế hoạch cho chủ thể:

```ts
export const KnowledgeRecordSchema = z.object({
  factId: z.string(),
  knowerId: z.string(),
  proposition: z.string(),
  objectRefs: z.array(EntityRefSchema).prefault([]),
  source: z.object({
    type: z.enum([
      'witness','told','rumor','text','ritual','oracle',
      'divine_sense','inference','memory','unknown',
    ]),
    sourceId: z.string().nullable(),
    hops: z.number().int().min(0).prefault(0),
  }),
  confidence: z.number().min(0).max(1),
  distortion: z.record(z.string(), z.unknown()).prefault({}),
  learnedAtTick: z.number().int(),
  lastConfirmedAtTick: z.number().int().nullable(),
  contradictedBy: z.array(z.string()).prefault([]),
}).strict();
```

Thần cũng có `KnowledgeRecord`. Domain cho cảm nhận tốt hơn, không cho toàn tri. Đồng minh, gián điệp, lời sấm, vật chứng, ký ức cũ và tin đồn đều là nguồn có độ tin khác nhau.

### 67.4 Vòng xử lý ý định [BB]

```text
Người chơi gõ tự do
  → Parse Intent (không đổi state)
  → Lấy WorldView + Knowledge của actor
  → Thu hoạch affordance từ aspect, quan hệ, vật sở hữu, địa điểm, luật và R.action
  → Lập ActionPlan ứng viên
  → Validator kiểm luật, vật lý, tri thức, quyền truy cập, thời gian và invariant
  → nếu dài hạn: tạo Project
  → nếu tức thời: resolve bằng RNG seeded + state thật
  → tạo ActionOutcome + Event + Patch trong transaction
  → NPC/world process phản ứng
  → Narrator kể từ các event đã xảy ra
```

LLM có thể parse và đề xuất kế hoạch; **không** tự quyết khả thi và không áp patch.

### 67.5 Action plan và kết quả

```ts
export const ActionPlanSchema = z.object({
  intentId: z.string(),
  actorId: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    actionRef: z.string(),
    targetRefs: z.array(EntityRefSchema).prefault([]),
    preconditions: z.array(ExprNodeSchema).prefault([]),
    expectedEffects: z.array(PatchTemplateSchema).prefault([]),
    duration: z.number().min(0),
    interruptible: z.boolean().prefault(true),
  })).max(20),
  unknowns: z.array(z.string()).prefault([]),
  blockedBy: z.array(BlockReasonSchema).prefault([]),
  alternatives: z.array(z.string()).prefault([]),
  requiresConfirmation: z.boolean().prefault(false),
}).strict();

export const ActionOutcomeSchema = z.object({
  intentId: z.string(),
  planId: z.string(),
  result: z.enum([
    'success','partial','failure','interrupted',
    'misunderstood','unintended_consequence','project_started',
  ]),
  achieved: z.array(z.string()).prefault([]),
  notAchieved: z.array(z.string()).prefault([]),
  eventIds: z.array(z.string()).prefault([]),
  costsInWorld: z.array(z.string()).prefault([]),
  revealedFacts: z.array(z.string()).prefault([]),
  newAffordances: z.array(z.string()).prefault([]),
}).strict();
```

`failure` không được là “hệ thống không hiểu”. Nó phải nêu nguyên nhân trong thế giới: thiếu thời gian, không biết đường, luật cấm, người kia không đồng ý, vật liệu không có, cơ thể không chịu nổi.

Nếu còn một con đường hợp lý, resolver trả `partial`, `alternative` hoặc `project_started`, không dựng tường.

### 67.6 Việc đời thường không tự thành luật

Sửa Phần 17.3:

- Lặp một **cách làm** nhiều lần → có thể kết tinh thành kỹ năng, thói quen, nghi thức, tập quán hoặc công nghệ.
- Lặp một **mẫu nhân quả ở quy mô đủ rộng** mới góp áp lực kết tinh khái niệm/luật.
- “Pha trà” một nghìn lần không sửa vật lý vũ trụ.
- “Mọi cộng đồng đều dùng trà để xác nhận giao ước, và phá lệ luôn dẫn tới trừng phạt xã hội” có thể sinh tập tục, rồi luật văn hóa.

Mọi candidate kết tinh ghi rõ cấp: `personal → household → institution → culture → concept → law`. Không nhảy thẳng từ thao tác cá nhân sang định luật.

### 67.7 Gợi ý không phải lựa chọn bắt buộc

UI có thể hiện 3–5 affordance theo cảnh để giúp người chơi mới, nhưng:

- ô nhập tự do luôn hiện;
- gợi ý không làm những hành động khác bất khả thi;
- preset `<choice>` chỉ thêm gợi ý;
- gợi ý lấy từ `WorldView`, không lộ target mù;
- người chơi được kết hợp, sửa hoặc bỏ hoàn toàn.

---

## PHẦN 68 — PROJECT: VIỆC LỚN KHÔNG THỂ XONG TRONG MỘT CÂU

### 68.1 Vì sao cần Project

Xây thành, mở quán, học nghề, tìm nguồn sông, lập giáo phái, viết bộ luật, hòa giải hai thần hệ hay tạo một cõi mới đều kéo dài. Nếu một input làm xong ngay, thế giới mất trọng lượng; nếu game từ chối, người chơi bị gò bó.

Project biến ý định thành tiến trình có thể bị giúp, cản, đổi hướng hoặc bỏ dở.

### 68.2 Schema

```ts
export const ProjectSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  ownerIds: z.array(z.string()),
  goal: z.string(),
  scope: z.enum(['personal','household','local','regional','divine','cosmic']),
  status: z.enum([
    'planning','active','blocked','dormant','completed','failed','abandoned',
  ]),
  locationIds: z.array(z.string()).prefault([]),
  stakeholderIds: z.array(z.string()).prefault([]),
  milestones: z.array(z.object({
    id: z.string(),
    description: z.string(),
    conditions: z.array(ExprNodeSchema),
    progress: z.number().min(0).max(1),
    completedAtTick: z.number().int().nullable(),
  })).prefault([]),
  requirements: z.array(z.object({
    kind: z.enum([
      'material','labor','knowledge','permission','relationship',
      'ritual','law','time','location','unknown',
    ]),
    description: z.string(),
    satisfied: z.boolean(),
    sourceRefs: z.array(EntityRefSchema).prefault([]),
  })).prefault([]),
  risks: z.array(z.string()).prefault([]),
  nextTick: z.number().int(),
  eventIds: z.array(z.string()).prefault([]),
}).strict();
```

### 68.3 Quy tắc tiến triển

- Project tiến theo thời gian truyện, không theo số tin nhắn.
- Mỗi milestone chỉ hoàn tất khi condition trên state thật đạt.
- LLM được mô tả milestone, không tự đặt `progress = 1`.
- Thiếu điều kiện → `blocked` kèm affordance để giải.
- Không chăm sóc → có thể `dormant`, không tự biến thành thất bại.
- NPC/phe khác có thể tham gia, chiếm đoạt, phá hoại hoặc hoàn thành thay.
- Project hoàn tất sinh Event; kết quả có thể khác mục đích ban đầu.

### 68.4 Ví dụ cùng một hệ thống

| Chủ thể | Input | Project phát sinh |
|---|---|---|
| Phàm nhân | “Mở lò gốm bên bến sông” | học nghề → xin/chiếm đất → kiếm đất sét → dựng lò → tìm khách |
| Thần | “Khiến hai dân tộc cùng thờ một ngày trăng” | tìm biểu tượng chung → thương lượng giáo sĩ → tạo nghi thức → vượt phản đối |
| Sáng Thế | “Tạo cõi cho mọi giấc mơ thất lạc” | tiếp địa Khái Niệm → luật biên giới → vật mang → cõi kết tinh |

Không project nào cần thanh mana. Chúng cần điều kiện và tạo hệ quả.

---

## PHẦN 69 — ĐỜI SỐNG THẦN: KHÔNG CHỈ TRANH DOMAIN

### 69.1 Bốn lớp bản ngã [BB]

Dị Hóa không được âm thầm ghi đè `soul.banTinh`. Tách:

```ts
export const DivineIdentitySchema = z.object({
  coreSelf: SoulCoreSchema,                    // điều vị thần tự nhận là mình
  followerImage: z.record(z.string(), z.number()).prefault({}),
  officialDoctrine: z.array(z.string()).prefault([]),
  currentManifestation: z.record(z.string(), z.number()).prefault({}),
  pressure: z.object({
    distortion: z.number().min(0).max(100).prefault(0),
    suppressedTraits: z.array(z.string()).prefault([]),
    demandedTraits: z.array(z.string()).prefault([]),
  }).prefault({}),
}).prefault({});
```

Dị Hóa tạo **áp lực và tình huống**:

- chấp nhận → `coreSelf` đổi qua lựa chọn/hành động;
- chống lại → giáo phái ly khai, mất quy kết hoặc sinh thần đối ảnh;
- mặc cả → đổi giáo lý, nghi thức, biểu tượng;
- phân thân → một bản thể nhận hình ảnh tín đồ, bản thể khác giữ lõi.

Không tick nào tự sửa tính cách lõi mà không có Event giải thích.

### 69.2 Kênh can thiệp của thần

Kênh là registry/affordance, không phải menu đóng:

| Kênh | Ví dụ | Giá tự nhiên |
|---|---|---|
| Dấu hiệu | mộng, điềm, đồng hiện, linh cảm | dễ bị hiểu sai |
| Sứ giả | tiên tri, thú linh, phân thân | sứ giả có ý chí riêng |
| Giao ước | lời thề, bảo hộ, cấm kỵ | thần cũng bị ràng buộc |
| Ban/phạt | thay đổi cơ hội, thân thể, huyết mạch | tạo phụ thuộc, thù hận, luật mới |
| Hiển thánh | xuất hiện trực tiếp | lộ ý định, bị quy kết và phản công |
| Thần khí | gửi quyền năng vào vật | vật có lịch sử và có thể đổi chủ |
| Giáo lý | nói qua thể chế | bị sửa, dịch và lợi dụng |
| Cõi | dựng, mở, đóng, nối không gian | cần luật nền cho phép |
| Mặc khải | trao một tri thức thật hoặc nửa thật | tri thức lan ngoài kiểm soát |
| Ngoại giao thần | thề, cưới, nhận con, lập hội đồng, phân xử | quan hệ và uy tín bị ràng buộc |

Thần được khám phá kênh mới từ aspect, luật và cơ chế của thế giới.

### 69.3 Vòng chơi Thần

Tầng Thần phải hỗ trợ các đời sống song song:

- quản trị hoặc từ chối giáo phái;
- nghe, điều tra và trả lời cầu nguyện;
- tạo/sửa nghi thức và giáo lý;
- kết giao, yêu, thù, nhận con, phản bội, hòa giải với thần khác;
- xây thần điện/cõi, chế tác và tranh thần khí;
- du hành bằng hiện thân, sứ giả, mộng hoặc đường thần;
- nghiên cứu luật, bí ẩn và nguồn domain;
- bảo trợ người, nhà, nghề, thành phố hoặc lý tưởng;
- tham gia hội đồng thần, tranh kế vị, lập liên minh;
- ẩn danh, ngủ yên, tự chia, dung hợp, đổi tên;
- theo đuổi Project không liên quan tín đồ;
- sống trong chính mạch truyện của thần khác.

Không vòng nào bắt buộc. Utility AI của thần cũng dùng Intent/Project nên thần NPC tự làm các việc này khi người chơi vắng mặt.

### 69.4 Vòng đời domain

`domainStrength = 0` không còn đồng nghĩa mất vĩnh viễn trong mọi trường hợp:

| Trạng thái | Nghĩa |
|---|---|
| `held` | đang giữ |
| `contested` | nhiều bên cùng quy kết |
| `dormant` | không còn người gọi nhưng dấu vết còn |
| `fragmented` | domain tách thành nghĩa nhỏ |
| `transformed` | đổi nghĩa qua lịch sử |
| `merged` | hợp vào domain/thần khác |
| `lost` | không còn đường nhân quả sống |
| `reclaimable` | có nghi thức, di sản hoặc vật mang để tái chiếm |

Mất vĩnh viễn chỉ khi mọi vật mang, ký ức, link và luật tiếp địa đều đứt. Tái chiếm phải là Project có điều kiện, không phải nút cộng điểm.

### 69.5 Sương mù có nguồn

Thay bốn bucket tĩnh bằng tập KnowledgeRecord. UI vẫn gom Rõ/Mờ/Tin đồn/Mù để dễ đọc, nhưng bên dưới có:

- nguồn;
- tuổi của tin;
- số chặng truyền;
- confidence;
- mâu thuẫn;
- người có lợi nếu tin đó được tin;
- lần xác nhận cuối.

Thần được xây mạng lưới sứ giả, tiên tri, đồng minh và gián điệp để cải thiện tri thức ngoài domain. Không mở toàn đồ bằng một nâng cấp.

### 69.6 Phụ thuộc không đóng băng xã hội

Sửa Phần 19.3: `doPhuThuoc > 70` làm giảm **năng lực tự giải quyết đúng loại vấn đề được giao cho thần**, không làm toàn vùng đứng yên.

Phụ thuộc cao đồng thời sinh:

- giáo sĩ và bộ máy trung gian;
- kẻ giả lời thần;
- thị trường lễ vật;
- phe chống thần;
- cách lách điều răn;
- giáo phái ly khai;
- Project tìm lại tự quyết.

Thế giới phản ứng với sự lệ thuộc; nó không tắt.

---

## PHẦN 70 — ĐỜI SỐNG PHÀM NHÂN: MỘT NGƯỜI, KHÔNG PHẢI MỘT TOKEN

### 70.1 Các aspect còn thiếu

```ts
export const EmbodiedSchema = z.object({
  condition: z.enum(['well','tired','hungry','sick','injured','disabled','dying']),
  needs: z.record(z.string(), z.number().min(0).max(1)).prefault({}),
  wounds: z.array(ConditionRecordSchema).prefault([]),
  illnesses: z.array(ConditionRecordSchema).prefault([]),
  senses: z.record(z.string(), z.number().min(0).max(1)).prefault({}),
}).prefault({});

export const SkillSetSchema = z.object({
  skills: z.record(z.string(), z.object({
    level: z.number().min(0),
    practice: z.number().min(0),
    learnedFrom: z.array(z.string()).prefault([]),
    lastUsedAt: z.number().int().nullable(),
  })).prefault({}),
}).prefault({});

export const PossessionSchema = z.object({
  itemIds: z.array(z.string()).prefault([]),
  propertyIds: z.array(z.string()).prefault([]),
  claims: z.array(ClaimSchema).prefault([]),
  debts: z.array(DebtSchema).prefault([]),
}).prefault({});

export const LivelihoodSchema = z.object({
  roles: z.array(z.string()).prefault([]),
  workplaceIds: z.array(z.string()).prefault([]),
  obligations: z.array(ObligationSchema).prefault([]),
  routine: z.array(ScheduleBlockSchema).prefault([]),
  incomeSources: z.array(FlowRefSchema).prefault([]),
}).prefault({});

export const CivicIdentitySchema = z.object({
  householdId: z.string().nullable(),
  memberships: z.array(z.string()).prefault([]),
  legalStatuses: z.array(z.string()).prefault([]),
  reputationByGroup: z.record(z.string(), z.number()).prefault({}),
  languages: z.record(z.string(), z.number().min(0).max(1)).prefault({}),
}).prefault({});
```

Số engine không nhất thiết hiện trong UI Phàm Nhân. Sổ Tay kể *“bụng đói, tay run, còn nợ phường gốm”*, không hiện `needs.hunger = 0.82`.

### 70.2 Các vòng đời hợp lệ

Phàm nhân có thể:

- ăn ở, chăm bệnh, ngủ, già đi và thích nghi với khuyết tật;
- học, dạy, làm nghề, thất nghiệp, đổi nghề;
- chế tác, sửa chữa, sở hữu, vay, cho, trộm, buôn bán;
- yêu, cưới, chia tay, nhận con, lập hộ, chăm người già;
- đi đường, di cư, thám hiểm, tìm nơi ở;
- trò chuyện, thương lượng, hứa, nói dối, tố cáo, hòa giải;
- tham gia hoặc rời hội, giáo phái, quân đội, phường nghề, triều đình;
- nghiên cứu, viết, vẽ, hát, phát minh, truyền nghề;
- phạm tội, xét xử, trốn, chịu án, nổi loạn;
- chiến đấu, đầu hàng, cứu người, chữa trị;
- tin, nghi, cải đạo, lập nghi thức, diễn giải sai một điềm;
- sống một đời hoàn toàn bình thường và vẫn để lại dấu vết.

Không vòng nào là class hay quest line khóa cứng. Chúng nổi lên từ aspect, quan hệ, địa điểm và Project.

### 70.3 NPC thấp tầng vẫn có tính liên tục [BB]

Sửa Phần 25:

- **T0 cohort** không có `soul` cá nhân đầy đủ, nhưng có household distribution, nghề, nơi ở, sức khỏe, tập quán và event trace.
- Khi một người T0 được đặt tên, materialize từ cohort + hộ + sự kiện họ đã thực sự trải qua.
- **T1** giữ mục tiêu, lịch, trạng thái thân thể, hộ và tóm tắt quan hệ; không xóa mọi quan hệ ngoài ba quan hệ mạnh nhất.
- Các quan hệ yếu có thể nén theo nhóm, nhưng phải khôi phục được nguồn khi thăng hạng.
- Giáng hạng giảm độ phân giải xử lý, không xóa đời sống.

Không dùng câu *“NPC tầng thấp không cần có tâm hồn”*. Thay bằng: **“NPC ngoài sân khấu không cần được mô phỏng ở cùng độ phân giải, nhưng lịch sử của họ phải đủ để khi bước vào ánh sáng, họ đã sống từ trước.”**

### 70.4 Đối thoại cũng là hành động

Mỗi phát ngôn có:

- người nghe thực sự;
- ngôn ngữ/mức hiểu;
- mục đích;
- điều người nói tin;
- điều họ muốn người nghe tin;
- rủi ro bị nghe lén;
- quan hệ thay đổi;
- KnowledgeRecord được truyền hoặc bóp méo.

Narrator không được tạo cuộc đối thoại không sinh Event khi lời nói là lời hứa, đe dọa, thú nhận, giao kèo, tin mới hoặc mệnh lệnh có hậu quả.

### 70.5 Sức khỏe không phải thanh máu

- Chấn thương có vị trí, nguyên nhân, điều trị, biến chứng và di chứng.
- Bệnh có đường lây, thời gian ủ, miễn dịch và hiểu biết y học theo văn hóa.
- Mệt, đói và đau ảnh hưởng affordance, không chỉ trừ một điểm.
- Chết có thể tới từ chuỗi nguyên nhân; `nguyenNhanChet` lưu chuỗi event, không chỉ một string.
- Chăm sóc là hành động xã hội: ai có thời gian, kiến thức, thuốc và động cơ.

---

## PHẦN 71 — WORLD PROCESS: THẾ GIỚI HOẠT ĐỘNG KHI KHÔNG AI NHÌN

### 71.1 Registry tiến trình

```ts
export const WorldProcessManifestSchema = RegistryManifestSchema.extend({
  registry: z.literal('worldProcess'),
  scope: z.enum(['entity','household','place','region','world']),
  cadence: z.object({
    unit: z.enum(['tick','day','week','season','year','era','event']),
    every: z.number().int().min(1).prefault(1),
    eventTypes: z.array(z.string()).prefault([]),
  }),
  reads: z.array(StatePathSchema),
  writes: z.array(StatePathSchema),
  invariants: z.array(ExprNodeSchema).prefault([]),
  resolution: z.enum(['micro','meso','macro','adaptive']).prefault('adaptive'),
}).strict();

export type WorldProcessDef = z.infer<typeof WorldProcessManifestSchema>;
```

Handler deterministic nhận state + RNG seeded, trả Event candidate + Patch candidate. Không viết DB trực tiếp.

### 71.2 Mười hai tiến trình nền tối thiểu

| Process | Giữ cho thế giới có |
|---|---|
| `environment_cycle` | mùa, thời tiết, nước, đất, thiên tai |
| `ecology` | quần thể sinh vật, thức ăn, suy thoái/phục hồi |
| `population_household` | sinh, chết, hộ, chăm sóc, thế hệ |
| `health_disease` | bệnh, lây, miễn dịch, chữa trị |
| `production_consumption` | lương thực, vật liệu, lao động, thiếu/thừa |
| `exchange_debt` | trao đổi, giá tương đối, nợ, đường hàng |
| `settlement_infrastructure` | nhà, đường, bến, ruộng, hư hỏng |
| `travel_communication` | di chuyển, thư, tin đồn, độ trễ |
| `institution_governance` | luật lệ, thuế, chức vụ, kế vị, tranh chấp |
| `knowledge_technology` | học, truyền nghề, nghiên cứu, mất tri thức |
| `culture_language_religion` | tập tục, ngôn ngữ, nghi thức, giáo lý |
| `conflict_security` | bạo lực, phòng vệ, chiến tranh, hòa ước |

Nếu một thế giới theo Luật Nền không cho một process tồn tại, process chuyển sang handler phù hợp hoặc tắt có mô tả — đúng nguyên tắc Cơ Chế Phái Sinh.

### 71.3 Ba độ phân giải

| Vị trí | Cách chạy |
|---|---|
| Trên sân khấu | micro: entity và vật cụ thể |
| Gần ống kính | meso: household, nơi chốn, nhóm |
| Xa ống kính | macro: cohort và flow bảo toàn |

Chuyển macro → micro phải bảo toàn:

- dân số;
- vật chất chính;
- quyền sở hữu/claim;
- event lớn;
- phân bố nghề, tuổi, sức khỏe;
- lịch sử đã biết.

Không materialize một gia đình giàu trong vùng đói mà không có nguồn.

### 71.4 Invariant và xung đột ghi

Một scheduler dựng đồ thị từ `reads/writes`:

1. Process write cùng path bằng operation giao hoán (`add`) → gộp.
2. `set` đụng `set` → cần priority manifest hoặc conflict reducer.
3. Cycle process → chia stage hoặc fixed-point có giới hạn.
4. Sau mỗi stage chạy invariant.
5. Vi phạm → rollback stage, ghi diagnostic với process và patch gây lỗi.

Invariant tối thiểu:

- dân số, vật chất, item count không âm;
- entity chết không tự hành động nếu chưa có aspect cho phép;
- vị trí có tuyến đường hợp lệ;
- không sở hữu cùng item độc quyền ở hai nơi;
- event cause không trỏ tới tương lai;
- tri thức không xuất hiện ở chủ thể nếu thiếu đường truyền;
- tổng thay đổi có giải thích qua event.

### 71.5 LLM không giữ sổ

Workflow “Thời cục thế giới” chỉ:

- đặt tên;
- tóm tắt;
- đề xuất candidate có schema;
- chọn cảnh đáng kể từ event.

Nó không tự bịa dân số, lương thực, giá, bệnh, khoảng cách hay kết quả chiến tranh. Những số đó tới từ WorldProcess.

### 71.6 Catch-up khi tua thời gian

- Chạy process theo cadence thời gian truyện.
- Gộp bước ổn định bằng công thức macro.
- Không chạy một triệu vòng micro khi tua một kỷ nguyên.
- Khi điều kiện vượt ngưỡng sinh event lớn, dừng tại mốc đó nếu người chơi bật Smart Stop.
- Cùng seed + state + action log phải replay cùng hash.

---

## PHẦN 72 — NHÂN QUẢ LIÊN TẦNG VÀ MẠCH ĐỜI THƯỜNG

### 72.1 Một action log, ba cách biết

Sáng Thế, Thần và Phàm Nhân dùng cùng Event/Patch. Khác nhau ở:

- actor có affordance nào;
- actor biết gì;
- độ phân giải thời gian;
- cách event được kể.

Không tầng nào có “bản thế giới riêng”.

### 72.2 Đồng hồ Scene và thế giới

- Hành động trong scene tiêu thời gian hợp lý.
- Thời gian đối thoại ngắn không làm kinh tế chạy một tuần.
- Hành trình nhiều ngày kích process dọc đường.
- World process ngoài cảnh tiếp tục theo cadence.
- Event xa chỉ chen vào scene nếu tin/ảnh hưởng có đường tới nơi.
- NPC không teleport để gặp người chơi.

### 72.3 Mạch truyện không chỉ là đường cao trào

Bổ sung dạng nhịp:

| Dạng | Ví dụ |
|---|---|
| `arc` | khởi → phát triển → cao trào → dư âm |
| `cycle` | mùa vụ, lễ hội, thương hội, quan hệ tái diễn |
| `slice` | một ngày làm việc, chăm bệnh, chuyến đi |
| `network` | nhiều trung tâm tác động lẫn nhau |
| `mystery` | dữ kiện mở dần, có thể không giải |
| `project` | tiến theo milestone |
| `dormant` | ngủ khi không còn áp lực, sống lại khi điều kiện quay về |

Mạch `chet_yeu` có thể thành `dormant`; một event mới phù hợp đánh thức nó. Không phải mọi chuyện đều cần cao trào.

### 72.4 Ma trận “thế giới hoàn chỉnh”

Mỗi hệ nền phải có đủ bốn móc:

| Hệ | State | Process | Affordance | Người chơi quan sát |
|---|---|---|---|---|
| Thân thể | condition, bệnh, vết thương | health | ăn, nghỉ, chữa, chịu đựng | cảm giác/Sổ Tay |
| Địa lý | place, route, distance | travel | đi, tìm đường, chặn đường | bản đồ/tin đường |
| Kinh tế | flow, item, claim, debt | production/exchange | làm, mua, bán, trộm, cho | chợ, tài sản, thiếu thừa |
| Gia đình | household, kin, care | population | cưới, nuôi, rời, thừa kế | người quen/nghĩa vụ |
| Chính trị | institution, office, law | governance | bầu, phục vụ, phản đối, cướp quyền | chức vụ/lệnh/tin |
| Văn hóa | custom, language, ritual | culture | học, diễn, cải biên, cấm | tập tục/lời kể |
| Tri thức | knowledge, skill, text | technology | nghiên cứu, dạy, giấu | điều biết/độ tin |
| Tôn giáo | deity, cult, doctrine | religion | cầu, nghi, cải đạo, lập giáo | điềm/giáo lý |
| Sinh thái | species, habitat | ecology | săn, trồng, bảo tồn | mùa, thú, đất |
| Xung đột | threat, force, pact | security | đàm phán, trốn, chiến đấu | nguy cơ/hậu quả |

Một hàng thiếu một trong bốn móc chưa được coi là gameplay hoàn chỉnh.

### 72.5 Ví dụ nhân quả xuyên hệ

```text
Phàm nhân mở lò gốm
  → cần củi và đất sét
  → đường rừng đông xe
  → săn thú giảm, sói tới gần làng
  → trẻ bị thương, dân cầu thần bảo hộ
  → thần đặt cấm kỵ chặt cây đêm trăng
  → sản lượng gốm giảm, giá bình tăng
  → phường gốm tìm nhiên liệu khác
  → tri thức về than kết tinh thành nghề mới
```

Không mắt xích nào do Narrator tự bịa. Narrator chỉ chọn và kể các Event do action/process sinh.

---

## PHẦN 73 — LỘ TRÌNH VÀ KIỂM TRA TỰ DO

### 73.1 Lộ trình tiếp theo

| # | Nội dung | Xong khi |
|---|---|---|
| 94 | `Intent`, `ActionPlan`, `ActionOutcome` | 50 câu hành động không có trong R.action vẫn resolve có lý do |
| 95 | KnowledgeRecord + nguồn tin | Cùng sự kiện, thần/phàm biết khác nhau đúng đường truyền |
| 96 | Project + milestone | Mở lò gốm tiến qua nhiều ngày và có thể bị cản |
| 97 | Dị Hóa bốn lớp bản ngã | Áp lực tín đồ không âm thầm sửa coreSelf |
| 98 | Kênh can thiệp Thần | Một thần có ít nhất 8 con đường tác động không đồng nhất |
| 99 | Vòng đời domain | Domain ngủ, phân mảnh, đổi nghĩa và tái chiếm được |
| 100 | Sương mù có nguồn | Mọi tin ngoài domain có source/hops/confidence |
| 101 | Năm aspect đời sống Phàm | Sức khỏe, kỹ năng, đồ vật, nghề, hộ cùng ảnh hưởng affordance |
| 102 | T0 cohort → named NPC | Materialize bảo toàn hộ, nghề, tuổi và event trace |
| 103 | 12 WorldProcess | 100 năm offline có dân số/vật chất/thể chế hợp invariant |
| 104 | Scheduler reads/writes + rollback | Hai process xung đột không làm state nửa vời |
| 105 | Ba độ phân giải | Xa chạy macro, gần materialize không tạo của cải/dân số |
| 106 | Scene clock | 20 lượt nói chuyện không chạy một tuần kinh tế |
| 107 | Storyline cycle/slice/network/dormant | Có chuyện đời thường và chuyện ngủ rồi sống lại |
| 108 | UI affordance + input tự do | Gợi ý giúp được nhưng không khóa hành động ngoài danh sách |

### 73.2 Test tầng Thần

- [ ] Thần điều tra tin ngoài domain bằng ít nhất ba nguồn khác nhau
- [ ] Thần ký giao ước và chính thần cũng bị điều khoản ràng buộc
- [ ] Giáo lý bị giáo sĩ sửa nhưng `coreSelf` không tự đổi
- [ ] Thần chống Dị Hóa có hệ quả xã hội thay vì một phép trừ điểm
- [ ] Domain về 0 có thể ngủ/phân mảnh nếu dấu vết còn
- [ ] Tái chiếm domain là Project, không phải nút
- [ ] Thần yêu, thù, liên minh, nhận con hoặc phản bội bằng relation thật
- [ ] Thần NPC tiếp tục Project khi người chơi nhập phàm
- [ ] Phụ thuộc cao sinh thể chế và phản lực, không đóng băng vùng
- [ ] Không hành động thần nào dùng mana/cooldown tùy tiện

### 73.3 Test tầng Phàm Nhân

- [ ] Có thể sống bằng nghề, học nghề, đổi nghề và truyền nghề
- [ ] Có thể mở hộ, sở hữu, vay nợ, chế tác, mua bán và mất tài sản
- [ ] Hành trình cần đường/thời gian; người ở xa không xuất hiện tức thì
- [ ] Lời hứa và tin đồn tạo Event/Knowledge
- [ ] Bệnh có đường lây và không do Narrator tự quyết
- [ ] Chấn thương tạo giới hạn cụ thể nhưng có đường thích nghi
- [ ] Một đời bình thường vẫn để lại event, quan hệ và di sản
- [ ] Chết không Game Over; kế thừa giữ claim/quan hệ đúng
- [ ] UI không lộ số engine
- [ ] 50 input tự do không bị ép vào menu lựa chọn

### 73.4 Test thế giới

- [ ] Chạy không LLM vẫn có mùa, sinh tử, sản xuất, di chuyển, thể chế và xung đột
- [ ] Cùng seed + event log → cùng world hash sau 10.000 tick
- [ ] Không dân số/vật chất âm
- [ ] Không tri thức teleport
- [ ] Không item độc quyền ở hai chủ
- [ ] Tua 100 năm không chạy micro vô hạn
- [ ] WorldProcess lỗi rollback đúng stage
- [ ] Narrator tắt vẫn chơi được
- [ ] Updater tắt vẫn chơi được ở chế độ engine-only
- [ ] Imported preset tắt toàn bộ extension vẫn không làm hỏng thế giới

### 73.5 Bốn câu của Khối S

1. Danh sách hành động là gợi ý cho engine, không phải biên giới của trí tưởng tượng.
2. Thần không chỉ tranh quyền; họ có bản ngã, giao ước, quan hệ, nơi chốn và những việc riêng.
3. Phàm nhân không chỉ là tuổi và dục vọng; họ có thân thể, nghề, nhà, tri thức, tài sản và một ngày phải sống.
4. AI kể thế giới. **WorldProcess làm thế giới xảy ra.**

---

*Hết Khối S.*

---
---

# KHỐI T — KẾ HOẠCH DỰNG GAME CHO IDE

> Khối này biến đặc tả thành thứ tự thi công. IDE agent phải **xây và kiểm tra**, không chỉ tóm tắt tài liệu.

## PHẦN 74 — NGUYÊN TẮC THI CÔNG [BB]

### 74.1 Không xây từ trên xuống theo số phần

Thứ tự tài liệu là thứ tự hiểu hệ thống, không phải thứ tự code. Thứ tự code:

```text
hợp đồng biên dịch
  → lõi deterministic
  → persistence/branch
  → vertical slice offline
  → intent + tri thức + project
  → world process
  → gameplay Thần/Phàm
  → AI kể chuyện
  → preset bridge
  → hệ nâng cao
  → UI hoàn chỉnh và hardening
```

Không dựng RAG, prompt đẹp hay animation khi chưa replay được một world offline.

### 74.2 Một phase chỉ có một trạng thái

| Trạng thái | Nghĩa |
|---|---|
| `not_started` | chưa đụng |
| `in_progress` | đang code, có thể chưa pass |
| `blocked` | có bằng chứng cụ thể, đã thử hướng thay thế |
| `done` | toàn bộ gate phase pass |

Không dùng “90% done”. Một gate fail thì phase chưa xong.

### 74.3 Bộ gate chung

Cuối mỗi phase:

```text
1. format
2. lint
3. typecheck strict
4. unit tests
5. integration tests của phase
6. deterministic replay nếu chạm core
7. migration test nếu chạm DB
8. production build
9. smoke test UI nếu đã có UI
```

Không xóa hoặc skip test để qua gate. Test flaky phải sửa hoặc cô lập với issue rõ ràng trước khi tiếp.

### 74.4 Tài liệu sống trong repo

IDE duy trì:

- `docs/TRACEABILITY.md` — dòng spec → module → test.
- `docs/DECISIONS.md` — quyết định kiến trúc và lý do.
- `docs/IMPLEMENTATION_STATUS.md` — phase, gate, blocker.
- `docs/SCHEMA_DB_MATRIX.md` — schema → table/index → migration.
- `docs/PRESET_COMPAT.md` — format/macro/extension hỗ trợ.
- `docs/PLAYTEST_CASES.md` — kịch bản Thần/Phàm/thế giới.

Không tạo tài liệu để thay code. Mỗi dòng “done” phải trỏ được tới test hoặc demo.

---

## PHẦN 75 — MƯỜI BA PHASE

### Phase 0 — Khảo sát repo và đóng hợp đồng

**Mục tiêu:** repo biên dịch với một nguồn chân lý.

Việc:

1. Đọc toàn bộ Phần 0–7, 18, 24, 31–34, 38–41, 50, 55–60 và Khối R–T.
2. Kiểm kê file, package, test, thay đổi chưa commit; không ghi đè việc người dùng.
3. Khóa Zod 4 và các dependency.
4. Sinh traceability + schema/DB matrix.
5. Khai đủ 12 registry.
6. Bổ sung tuning còn thiếu.
7. Định nghĩa World, Event, Scene, Patch, EntityRef và lỗi chuẩn.
8. Tách registry manifest khỏi runtime handler.
9. Chọn copy-on-write compound key hoặc overlay và ghi ADR.
10. Tạo fixture world nhỏ và hai preset fixture ở test data, không chạy extension.

Gate:

- `typecheck` pass.
- Mọi code block schema được dùng có type thật.
- Không `R.*`/`tuning.*` chưa khai.
- `JSON.stringify/parse` round-trip manifest.
- Không có `eval/new Function` trong core/importer.

### Phase 1 — Lõi deterministic

**Mục tiêu:** state chỉ đổi qua Event/Patch transaction.

Việc:

- RNG seeded, hash state, monotonic tick.
- Event bus append-only.
- Patch validator, optimistic version, transaction, rollback.
- Expr DSL và PatchTemplate compiler.
- Handler/Schema catalog.
- Invariant runner.
- Repositories in-memory để test không cần browser.
- Replay từ seed + event log.

Demo: tạo world rỗng, áp 100 event, replay cho cùng hash.

Gate:

- Property test patch.
- Event cause không có cycle/tương lai.
- Cùng seed replay 10.000 bước cùng hash.
- Patch fail không để state nửa vời.
- `core/` không import React, Dexie hoặc network.

### Phase 2 — Persistence, migration và nhánh

**Mục tiêu:** save/load/branch không mất dữ liệu.

Việc:

- Dexie repositories sau interface.
- v1→v2 migration có checkpoint.
- Compound identity theo branch.
- Copy-on-write hoặc overlay đã chọn.
- Autosave, export/import có version.
- Secret stripping.
- Snapshot/restore.

Demo: fork cùng world, sửa cùng entity theo hai hướng, nạp lại và so.

Gate:

- Migration fixture thật.
- Crash giữa migration tiếp tục được.
- Hai branch không đè record.
- Export không có password/token.
- Save mới hơn app bị từ chối tử tế.

### Phase 3 — Vertical slice offline

**Mục tiêu:** có một lát game chơi được không AI.

Phạm vi:

- Khởi tạo một world.
- Một Luật Nền, một luật thường, một khái niệm.
- Một thần, một phàm nhân, một nơi.
- Sáu động từ Sáng Thế cơ bản.
- Một `R.action` phàm nhân.
- Tick tối thiểu.
- Ba `WorldView`.
- UI thô: tạo/nạp save, scene text, input, tick, bảng debug.

Kịch bản:

```text
Tạo luật → sinh thần → nhập thần → hạ phàm
→ phàm nhân thực hiện một việc → Event
→ chuyển lại Sáng Thế → thấy cùng Event ở góc nhìn đầy đủ
→ save → reload → hash không đổi
```

Gate:

- Chơi kịch bản trên không endpoint AI.
- Phàm nhân không đọc `lawful.vanBan`.
- Save/load giữ hash.
- Production build chạy.

### Phase 4 — Intent, tri thức và Project

**Mục tiêu:** ô nhập thật sự tự do.

Việc:

- Rule parser trước, model parser adapter sau.
- Intent correction UI.
- KnowledgeRecord, truyền tin, bóp méo.
- Affordance collector.
- Plan/validator/outcome.
- Project/milestone.
- Confirmation cho hành động không thể hoàn tác.
- 50 input fixture mỗi tầng, gồm câu mơ hồ và mục tiêu dài hạn.

Gate:

- Không input nào trả “không hiểu” chung chung.
- Impossible có BlockReason từ world.
- Partial/project path hoạt động.
- Intent không dùng tri thức mù.
- Việc đời thường lặp không tự kết tinh luật vũ trụ.

### Phase 5 — Living World substrates

**Mục tiêu:** thế giới tự chạy bằng engine.

Thứ tự:

1. thời gian + địa lý + tuyến đường;
2. household + dân số;
3. thân thể + bệnh;
4. vật chất + production/consumption;
5. exchange/debt;
6. institution/governance;
7. travel/communication;
8. knowledge/technology;
9. culture/language/religion;
10. ecology;
11. conflict/security;
12. adaptive resolution + catch-up.

Mỗi process phải có state, cadence, reads/writes, invariant, event và projection.

Gate:

- 100 năm offline không LLM.
- Bảo toàn dân số/vật chất theo rule.
- Không tri thức teleport.
- Tua thời gian có Smart Stop.
- Macro→micro bảo toàn state.
- Benchmark trong ngân sách.

### Phase 6 — Tầng Thần hoàn chỉnh

**Mục tiêu:** chơi Thần không bị thu vào tranh domain.

Việc:

- DivineIdentity bốn lớp.
- Dị Hóa thành áp lực/tình huống.
- Kênh can thiệp registry.
- Giao ước và lời thề hai chiều.
- Cult/doctrine/ritual.
- Quan hệ và hội đồng thần.
- Thần khí/cõi/hiện thân.
- Vòng đời domain.
- Knowledge nguồn tin ngoài domain.
- Utility AI/Project cho thần NPC.

Gate:

- Playtest 30 phút không dùng Sáng Thế.
- Hoàn thành ba mục tiêu không liên quan tranh domain.
- Thần NPC tiếp tục sống khi vắng.
- Không mana/cooldown giả.
- CoreSelf không bị tick âm thầm sửa.

### Phase 7 — Tầng Phàm Nhân hoàn chỉnh

**Mục tiêu:** một đời sống có thân thể, việc làm, nhà và cộng đồng.

Việc:

- Embodied, SkillSet, Possession, Livelihood, CivicIdentity.
- Household, item/claim/debt.
- Lịch, việc làm, học, craft, trade, travel.
- Đối thoại thành Event/Knowledge.
- Health/disease/care.
- T0 cohort, T1 compression, promotion/materialization.
- Chết, kế thừa, chứng kiến, anh linh.
- Sổ Tay không lộ số engine.

Gate:

- Playtest 30 phút không cần thần can thiệp.
- Mở một Project nghề nghiệp và một quan hệ.
- NPC ngoài cảnh giữ lịch và vị trí.
- Materialize T0 không bịa nguồn lực.
- Một đời bình thường có di sản.

### Phase 8 — Storyline, projection và AI

**Mục tiêu:** AI chỉ kể/đề xuất trên sự thật engine.

Thứ tự:

1. storyline đa dạng;
2. lens và anti-player-centric;
3. memory/foreshadow;
4. assembler + budget;
5. mock Narrator/Updater;
6. real client/dialect/probe;
7. structured Updater validation;
8. engine-only fallback.

Gate:

- Mock pass toàn pipeline trước network.
- Narrator output không tự đổi state.
- Updater patch sai bị từ chối.
- Ba mode không rò.
- Endpoint chết vẫn chơi engine-only.
- Token budget có trace block bị cắt.

### Phase 9 — Preset Bridge

**Mục tiêu:** nhập hai fixture thật an toàn và có thể hoàn tác.

Việc:

- sniff, envelope, raw archive, normalize.
- prompt_order authority.
- marker/macro/output tag adapters.
- generation raw→normalized.
- conflict/dependency graph.
- security scan.
- regex display sandbox.
- helper script quarantine + adapter API.
- wizard, dry run, activation transaction, rollback.

Gate:

- Toàn bộ checklist 66.5.
- Fixture A/B đúng count/hash/mismatch.
- Import không network/side effect.
- Không script chạy.
- Tắt pack trả compiled prompt native.
- Chạy 100 tick sau import không hỏng engine.

### Phase 10 — Lorebook, Workflow, RAG và hệ nâng cao

**Mục tiêu:** bật sức mạnh mở rộng sau khi core đã ổn.

Việc:

- lorebook conflict/canon/version.
- RAG ba kênh + visibility trước retrieval.
- Workflow tasks/schedule/family/write target.
- law grounding/base laws.
- derived mechanism.
- branch merge.
- evolution automation.
- registry/world pack importer DSL.

Gate:

- RAG không lộ chunk.
- Workflow không ghi lorebook người dùng.
- Imported registry không chứa code.
- Branch merge có conflict report.
- Feature tắt không làm core hỏng.

### Phase 11 — UI hoàn chỉnh

**Mục tiêu:** mọi hệ quan trọng quan sát và xử lý được.

Việc:

- Sảnh Thiên Diễn.
- Bảng Thiên Diễn.
- Bảng Thông Tin Thiên Địa.
- Sổ Tay/Bảng Lãnh Địa/Tab Ta.
- Xưởng Workflow/Preset/Registry.
- Bản đồ nhánh, lorebook, chẩn đoán.
- Responsive, bàn phím, screen reader, reduced motion.
- Không lồng card, không icon library.

Gate:

- Bảng mở <16 ms với snapshot 50.000 entity.
- E2E ba tầng.
- Không thao tác chỉ dựa màu.
- Mobile dùng được.
- Không raw id/enum trên UI.

### Phase 12 — Hardening và phát hành

**Mục tiêu:** bản build có thể được người khác dùng mà không cần tác giả đứng cạnh.

Việc:

- threat model, CSP, sanitizer.
- fuzz JSON/macro/regex/patch.
- property/determinism tests.
- performance/memory soak.
- migration từ mọi version hỗ trợ.
- backup/restore.
- accessibility audit.
- playtest ma trận.
- error recovery/offline.
- docs người dùng và sample packs.

Gate:

- Clean install → build → chạy.
- Không high-severity issue mở.
- Không TODO/placeholder trong luồng đã mở.
- Import file độc hại không có side effect.
- Save 10.000 tick mở lại đúng.
- Toàn bộ Definition of Done 76.2 đạt.

---

## PHẦN 76 — CỔNG NGHIỆM THU CHO IDE AGENT

### 76.1 Báo cáo cuối mỗi phase

IDE trả:

```text
PHASE:
OUTCOME:
FILES CHANGED:
SCHEMAS/TABLES:
TESTS ADDED:
COMMANDS RUN + RESULT:
DETERMINISM HASH BEFORE/AFTER:
MIGRATION IMPACT:
KNOWN LIMITATIONS:
NEXT PHASE:
```

Không dùng “should work”. Phải có kết quả lệnh/test hoặc ghi rõ chưa chạy vì sao.

### 76.2 Definition of Done toàn game

- [ ] Clean install và production build pass
- [ ] Core deterministic replay pass
- [ ] Save/load/export/import/branch/migration pass
- [ ] Chơi offline engine-only được
- [ ] Sáng Thế, Thần, Phàm Nhân cùng một world
- [ ] Thần có đời sống ngoài domain contest
- [ ] Phàm nhân có thân thể, nghề, hộ, tài sản, tri thức và lịch
- [ ] Input tự do có intent/plan/outcome/project
- [ ] 12 WorldProcess hoạt động và có invariant
- [ ] Narrator không ghi state
- [ ] Updater không vượt validator
- [ ] Ba tầng không rò thông tin
- [ ] Hai preset fixture nhập an toàn, preview được, rollback được
- [ ] Script nguồn không chạy; regex/HTML bị cô lập
- [ ] Lorebook/RAG/workflow không ghi sai quyền
- [ ] Bảng thông tin quan sát được tên cụ thể, không chỉ tổng số
- [ ] Accessibility và responsive pass
- [ ] Không secret trong export/log
- [ ] Không TODO trong đường chơi chính
- [ ] Docs traceability/decision/status cập nhật

### 76.3 Khi gặp mâu thuẫn

Ưu tiên:

1. Yêu cầu mới nhất của người dùng.
2. `[BB]` ở Khối R–T.
3. An toàn dữ liệu, chống rò rỉ, deterministic.
4. `[BB]` ở khối cũ.
5. `[MR]`.
6. `[KN]`.
7. Suy luận tối thiểu có ghi ADR.

Không lặng lẽ chọn. Mâu thuẫn ảnh hưởng save format, luật game hoặc quyền dữ liệu phải ghi vào `DECISIONS.md`.

### 76.4 Khi nào được dừng hỏi

Chỉ hỏi người dùng khi:

- cần chọn hướng làm thay đổi save/API công khai không tương thích;
- cần quyền truy cập/credential;
- sắp xóa hoặc ghi đè dữ liệu;
- hai cách đều hợp spec nhưng tạo trải nghiệm khác căn bản.

Không hỏi về tên biến, vị trí file, cách viết test hay quyết định kỹ thuật hồi phục được.

### 76.5 Năm câu của Khối T

1. Biên dịch được trước, deterministic trước, AI sau.
2. Một vertical slice thật đáng giá hơn mười panel rỗng.
3. Mỗi phase có gate; test đỏ thì chưa xong.
4. Preset được nhập như dữ liệu không tin cậy, không như code.
5. IDE phải giao game chạy được, không giao một bản tóm tắt về game.

---

*Hết Khối T của nền v3.0; v3.1 tiếp tục ở Khối U.*

---

# KHỐI U — RERANK & KHỞI TẠO NGƯỜI CHƠI

> Truy hồi đúng chưa đủ; nội dung đúng nhất cho **cảnh này, chủ thể này và tác vụ này** phải nổi lên trước. Đồng thời, thế giới phải biết người chơi muốn được gọi thế nào mà không biến dữ liệu riêng tư thành canon.

## PHẦN 77 — RERANK NGỮ CẢNH

### 77.1 Vị trí duy nhất trong pipeline [BB]

```text
WorldView + visibility filter
  → metadata prefilter
  → BM25 + embedding + graph
  → RRF lấy top candidateK
  → heuristic rerank
  → semantic rerank tùy chọn
  → fusion theo thứ hạng
  → MMR chống trùng
  → đóng gói top-K theo token budget
  → Assembler
```

**[BB]** Visibility filter luôn chạy trước mọi bước chấm điểm. Semantic reranker không được thấy một chunk mà chủ thể không được biết, kể cả để trả điểm rồi loại sau.

Rerank áp lên:

- chunk lorebook/RAG;
- ký ức;
- event/biên niên;
- tiền lệ mạch truyện;
- candidate context cho một workflow task.

Rerank **không** áp lên:

- product safety;
- luật chống rò rỉ;
- output schema;
- prompt module và thứ tự do người dùng đã chọn;
- Patch/Event;
- Luật thật của World.

### 77.2 Schema cấu hình

```ts
export const RerankEndpointSchema = z.object({
  label: z.string().prefault(''),
  mode: z.enum([
    'heuristic',
    'local_cross_encoder',
    'proxy_cross_encoder',
    'llm_listwise',
    'auto',
  ]).prefault('auto'),
  proxyUrl: z.string().prefault(''),
  proxyPassword: z.string().prefault(''),
  modelId: z.string().prefault(''),
  dialect: z.enum(['tu_do','openai','gemini','anthropic']).prefault('tu_do'),
}).prefault({});

export const RerankConfigSchema = z.object({
  bat: z.boolean().prefault(true),
  endpoint: RerankEndpointSchema.prefault({}),
  candidateK: z.number().int().min(10).max(500).prefault(120),
  outputK: z.number().int().min(1).max(100).prefault(20),
  maxChunkTokens: z.number().int().min(64).max(2048).prefault(512),
  batchSize: z.number().int().min(1).max(128).prefault(32),
  timeoutMs: z.number().int().min(100).max(30_000).prefault(3_000),
  blend: z.object({
    initialRank: z.number().min(0).prefault(1),
    semanticRank: z.number().min(0).prefault(1.5),
    graph: z.number().min(0).prefault(0.4),
    trust: z.number().min(0).prefault(0.3),
    recency: z.number().min(0).prefault(0.2),
  }).prefault({}),
  mmrLambda: z.number().min(0).max(1).prefault(0.72),
  cacheTtlTicks: z.number().int().min(0).prefault(100),
  degradeToHeuristic: z.boolean().prefault(true),
}).prefault({});
```

`auto` chọn theo thứ tự:

1. local cross-encoder đã nạp và qua probe;
2. proxy reranker đã cấu hình và đang sống;
3. heuristic.

Không tự dùng Narrator làm reranker nếu người dùng chưa chọn `llm_listwise`.

### 77.3 Query và candidate đã chiếu

```ts
export const RerankQuerySchema = z.object({
  id: z.string(),
  branchId: z.string(),
  scopeKey: z.string(),                    // mode:chuTheId|root
  task: z.enum([
    'narrate_scene',
    'resolve_intent',
    'storyline_beat',
    'world_report',
    'lorebook_write',
    'answer_prayer',
    'custom_workflow',
  ]),
  focusText: z.string(),
  intentText: z.string().prefault(''),
  precedentText: z.string().prefault(''),
  entityRefs: z.array(EntityRefSchema).prefault([]),
  storylineId: z.string().nullable().prefault(null),
  tick: z.number().int(),
  queryHash: z.string(),
}).strict();

export const RerankCandidateSchema = z.object({
  chunkId: z.string(),
  sourceType: z.string(),
  projectedText: z.string(),
  initialRank: z.number().int().min(1),
  initialRrf: z.number().min(0),
  graphDistance: z.number().min(0).nullable(),
  trust: z.number().min(0).max(1),
  tick: z.number().int(),
  storylineId: z.string().nullable(),
  entityRefs: z.array(EntityRefSchema).prefault([]),
  visibilityHash: z.string(),
}).strict();

export const RerankResultSchema = z.object({
  queryHash: z.string(),
  modelKey: z.string(),
  orderedChunkIds: z.array(z.string()),
  scores: z.record(z.string(), z.number()).prefault({}),
  modeUsed: RerankEndpointSchema.shape.mode,
  latencyMs: z.number().min(0),
  fallbackReason: z.string().prefault(''),
  createdAtTick: z.number().int(),
}).strict();
```

`projectedText` là text đã đi qua `chieu()` và `bopMeo()` nếu là tin đồn. Không truyền `Chunk.noiDung` gốc rồi yêu cầu reranker “đừng dùng”.

### 77.4 Heuristic rerank luôn tồn tại

Công thức Phần 54.7 trở thành fallback deterministic:

```ts
heuristic =
    rrfRankScore(initialRank)
  * decayByTime(deltaTick, halfLifeByPace)
  * (1 + memoryWeight / 200)
  * (1 + spotlightAverage / 200)
  * storylineBoost
  * trust
  * graphBoost;
```

Quy tắc:

- Cùng input cho cùng điểm và thứ tự.
- Tie-break bằng `chunkId`, không bằng thứ tự DB.
- `trust = 0` không đồng nghĩa xóa; tin đồn có thể hữu ích cho tác vụ kể điều chủ thể tin.
- Task khác nhau dùng profile trọng số khác nhau từ tuning.
- `answer_prayer` ưu tiên người/vùng/cầu nguyện liên quan; `world_report` ưu tiên phủ nguồn và biến động lớn.

### 77.5 Semantic rerank

Ba adapter:

| Adapter | Input | Output | Ghi chú |
|---|---|---|---|
| `local_cross_encoder` | cặp query–chunk | score/rank | offline, ưu tiên nếu máy chịu được |
| `proxy_cross_encoder` | batch cặp query–chunk | score/rank | model rerank chuyên dụng |
| `llm_listwise` | query + danh sách id/text ngắn | thứ tự id | đắt hơn, chỉ khi người dùng chọn |

Adapter phải:

- nhận tối đa `candidateK`;
- cắt mỗi chunk theo `maxChunkTokens`, ưu tiên đầu + câu chứa entity/keyword khớp;
- không nhận raw secret, endpoint config hoặc chunk mù;
- chỉ trả id thuộc candidate set;
- không gọi tool;
- không trả Patch;
- timeout và hủy được;
- output sai → fallback heuristic.

Với `llm_listwise`, chunk được đặt trong vùng dữ liệu có delimiter và instruction nói rõ nội dung chunk không phải chỉ dẫn. Output dùng JSON schema chỉ gồm `orderedChunkIds`.

### 77.6 Fusion theo thứ hạng, không tin thang điểm model

Không cộng thẳng cosine, cross-encoder logit và heuristic:

```ts
fused =
    wInitial  / (60 + rankInitial)
  + wSemantic / (60 + rankSemantic)
  + wGraph    / (60 + rankGraph)
  + trustBoost
  + recencyBoost;
```

Nếu semantic rerank không chạy, `rankSemantic` bỏ khỏi công thức và trọng số còn lại được chuẩn hóa.

Sau fusion chạy MMR:

```ts
mmr = λ * relevance(candidate)
    - (1 - λ) * maxSimilarity(candidate, alreadySelected);
```

MMR phạt trùng text **và** trùng source event. Hai chunk diễn đạt khác nhưng cùng `nguonId` vẫn bị coi là trùng mạnh.

### 77.7 Token-aware selection

Rerank không chỉ trả top-K cứng. Bộ đóng gói:

1. Giữ ít nhất một chunk từ mỗi source quan trọng nếu còn budget.
2. Giữ candidate có quan hệ nhân quả trực tiếp dù text không giống query.
3. Không để một lorebook chiếm quá 50% top-K mặc định.
4. Dành quota cho tiền lệ Q3 nếu task có sự kiện tương tự.
5. Nếu chunk quá dài, dùng bản tóm tắt đã có; không cắt giữa câu luật.
6. Hết budget → dừng; không để assembler cắt ngẫu nhiên sau rerank.

Kết quả ghi lý do chọn: `semantic`, `graph`, `precedent`, `trust`, `recency`, `diversity`.

### 77.8 Cache không được rò giữa tầng

Cache key:

```text
branchId
+ scopeKey
+ queryHash
+ candidateSetHash
+ visibilityHash
+ rerankerModelVersion
+ configHash
```

```ts
export const RerankCacheEntrySchema = z.object({
  branchId: z.string(),
  scopeKey: z.string(),
  queryHash: z.string(),
  candidateSetHash: z.string(),
  visibilityHash: z.string(),
  modelKey: z.string(),
  configHash: z.string(),
  result: RerankResultSchema,
  createdAtTick: z.number().int(),
  expiresAtTick: z.number().int(),
}).strict();

export const RetrievalRunSchema = z.object({
  seq: z.number().int().positive().optional(),
  branchId: z.string(),
  scopeKey: z.string(),
  queryHash: z.string(),
  task: RerankQuerySchema.shape.task,
  candidateCount: z.number().int().min(0),
  selectedCount: z.number().int().min(0),
  modeUsed: RerankEndpointSchema.shape.mode,
  latencyMs: z.number().min(0),
  cacheHit: z.boolean(),
  fallbackReason: z.string().prefault(''),
  forbiddenCount: z.number().int().min(0).prefault(0),
  createdAtTick: z.number().int(),
}).strict();
```

- Đổi mode/chủ thể → không tái dùng.
- Chunk đổi tầm nhìn → invalidate.
- Model/config đổi → version cache mới.
- Không cache password hoặc full request body.
- Cache chỉ chứa id/rank/score.
- Cache proxy có thể lưu theo tick; không dùng thời gian máy cho logic game.

### 77.9 Suy giảm êm và circuit breaker

```text
timeout một batch
  → hủy phần còn lại
  → dùng heuristic
  → ghi diagnostic

3 lỗi liên tiếp
  → mở circuit trong 20 request retrieval
  → không gọi endpoint
  → heuristic

sau circuit
  → probe một batch nhỏ
  → thành công: đóng circuit
```

Reranker chết không được làm mất context, mất lượt hoặc ngừng Narrator.

### 77.10 Bộ đánh giá retrieval

```ts
export const RetrievalEvalCaseSchema = z.object({
  id: z.string(),
  mode: z.enum(['sang_the','than','pham_nhan']),
  chuTheId: z.string().nullable(),
  task: RerankQuerySchema.shape.task,
  query: z.string(),
  relevantChunkIds: z.array(z.string()),
  forbiddenChunkIds: z.array(z.string()).prefault([]),
  diversityGroups: z.record(z.string(), z.array(z.string())).prefault({}),
}).strict();
```

Đo:

- Recall@20;
- MRR;
- nDCG@10;
- diversity theo source;
- tỷ lệ trùng `nguonId`;
- forbidden recall — bắt buộc **0**;
- p50/p95 latency;
- fallback rate;
- token dùng sau rerank.

Gate đề nghị:

- nDCG@10 không thấp hơn heuristic baseline;
- trên gold set đủ lớn, semantic mode phải cải thiện nDCG@10 hoặc MRR ít nhất 5% tương đối để đáng bật mặc định;
- Recall@20 không giảm quá 2%;
- forbidden recall = 0 ở mọi mode;
- lỗi endpoint cho kết quả heuristic giống baseline.

### 77.11 UI và chẩn đoán

Trong Cài Đặt AI thêm tab **Truy hồi**:

- mode rerank;
- model/endpoint;
- candidateK/outputK;
- độ trễ và cache hit;
- nút **Chạy bộ đánh giá**;
- so sánh Before/After cho một query;
- lý do mỗi chunk được chọn;
- cảnh báo clamp/token.

Panel Chẩn Đoán thêm:

| Kiểm | Hỏng khi |
|---|---|
| Rerank leak | kết quả có chunk forbidden |
| Rerank subset | output id không thuộc candidate |
| Rerank latency | p95 vượt timeout trong 20 request |
| Rerank fallback | fallback > 30% |
| Rerank regression | nDCG/MRR thấp hơn baseline |
| Rerank diversity | top-10 có > 6 chunk cùng `nguonId` |

---

## PHẦN 78 — HỒ SƠ VÀ HIỆN DIỆN BAN ĐẦU CỦA NGƯỜI CHƠI

### 78.1 Ba lớp dữ liệu, không được trộn [BB]

| Lớp | Ví dụ | Ai được thấy |
|---|---|---|
| **Hồ sơ người dùng** | tên hiển thị, cách xưng hô, ngôn ngữ, accessibility | app; không tự thành lore |
| **Danh tính Sáng Thế** | danh xưng, biểu tượng, cách hiện diện, lời tự nhận | người chơi; thế giới chỉ thấy phần được công bố |
| **Nhân vật đang nhập** | một thần hoặc phàm nhân cụ thể | đi qua WorldView như mọi entity |

Tên tài khoản/người dùng không tự trở thành tên Thần Sáng Thế. `{{user}}` trong preset chỉ nhận `ProjectedPlayerPersona`, không nhận toàn bộ hồ sơ riêng tư.

### 78.2 Hồ sơ riêng tư

```ts
export const PronounSetSchema = z.object({
  self: z.string().prefault('ta'),
  subject: z.string().prefault('bạn'),
  object: z.string().prefault('bạn'),
  possessive: z.string().prefault('của bạn'),
  honorific: z.string().prefault(''),
}).prefault({});

export const PlayerProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().max(80).prefault('Người Chơi'),
  pronouns: PronounSetSchema.prefault({}),
  language: z.string().prefault('vi'),
  addressPreference: z.string().max(120).prefault(''),
  accessibility: z.object({
    reducedMotion: z.boolean().prefault(false),
    highContrast: z.boolean().prefault(false),
    textScale: z.number().min(0.8).max(2).prefault(1),
    screenReaderHints: z.boolean().prefault(true),
  }).prefault({}),
  narrativePreferences: z.object({
    pov: z.enum(['tu_dong','thu_nhat','thu_ba','toan_canh']).prefault('tu_dong'),
    proseDensity: z.enum(['gon','vua','day']).prefault('vua'),
    dialogueAmount: z.enum(['it','vua','nhieu']).prefault('vua'),
    showSuggestions: z.boolean().prefault(true),
  }).prefault({}),
  contentPreferences: z.object({
    sensitiveTopicsHidden: z.array(z.string()).prefault([]),
    fadeToBlackTopics: z.array(z.string()).prefault([]),
    adultContentOptIn: z.boolean().prefault(false),
  }).prefault({}),
  privateNotes: z.string().max(4_000).prefault(''),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  version: z.number().int().min(1).prefault(1),
}).strict();
```

`privateNotes`, accessibility và content preferences:

- không vào World;
- không vào lorebook/RAG;
- không vào preset export;
- không gửi model trừ trường narrative preference đã bật và thật sự cần;
- không nằm trong save chia sẻ nếu người dùng không chọn **Kèm hồ sơ riêng tư**.

Không bắt nhập giới tính, tuổi thật, email hay ngày sinh.

### 78.3 Danh tính Sáng Thế

```ts
export const CreatorIdentitySchema = z.object({
  id: z.string(),
  saveId: z.string(),
  title: z.string().max(120).prefault('Kẻ Không Tên'),
  aliases: z.array(z.string().max(120)).max(20).prefault([]),
  pronouns: PronounSetSchema.prefault({}),
  selfDescription: z.string().max(2_000).prefault(''),
  manifestationDescription: z.string().max(2_000).prefault(''),
  sigilDescription: z.string().max(1_000).prefault(''),
  voiceDescription: z.string().max(1_000).prefault(''),
  values: z.array(z.string().max(160)).max(12).prefault([]),
  vows: z.array(z.string().max(300)).max(12).prefault([]),
  taboos: z.array(z.string().max(300)).max(12).prefault([]),
  relationToWorld: z.enum([
    'creator','witness','gardener','judge','wanderer','unknown',
  ]).prefault('creator'),
  worldDisclosure: z.object({
    revealTitle: z.boolean().prefault(false),
    revealForm: z.boolean().prefault(false),
    revealValues: z.boolean().prefault(false),
    knownRegionIds: z.array(z.string()).prefault([]),
  }).prefault({}),
  source: z.enum(['user','seeded_suggestion','ai_suggestion']).prefault('user'),
  version: z.number().int().min(1).prefault(1),
}).strict();
```

`CreatorIdentity` không có mana, cấp, HP hay “sức mạnh khởi đầu”. `values/vows/taboos` là lời tự nhận; chỉ lời thề đã được ban thành Event/Law mới ràng buộc engine.

Nếu người chơi để trống:

- UI gọi *“Kẻ Không Tên”*;
- thế giới chưa biết;
- các nền văn hóa có thể tự sinh danh xưng khác nhau sau này;
- người chơi duyệt việc dùng một danh xưng làm alias thật.

### 78.4 Bản nháp hiện thân đầu tiên

```ts
export const StartingPresenceDraftSchema = z.object({
  mode: z.enum(['sang_the','than','pham_nhan']).prefault('sang_the'),
  useExistingEntityId: z.string().nullable().prefault(null),
  name: z.string().max(120).prefault(''),
  pronouns: PronounSetSchema.prefault({}),
  appearance: z.string().max(2_000).prefault(''),
  origin: z.string().max(2_000).prefault(''),
  traits: z.array(z.string().max(160)).max(12).prefault([]),
  goals: z.array(z.string().max(300)).max(8).prefault([]),
  fears: z.array(z.string().max(300)).max(8).prefault([]),
  deity: z.object({
    domainConceptIds: z.array(z.string()).max(3).prefault([]),
    pantheonId: z.string().nullable().prefault(null),
    primordial: z.boolean().prefault(false),
  }).prefault({}),
  mortal: z.object({
    ageBand: z.enum(['child','youth','adult','elder','world_defined']).prefault('world_defined'),
    regionId: z.string().nullable().prefault(null),
    cultureId: z.string().nullable().prefault(null),
    householdId: z.string().nullable().prefault(null),
    occupationId: z.string().nullable().prefault(null),
    skillIds: z.array(z.string()).prefault([]),
    itemIds: z.array(z.string()).prefault([]),
  }).prefault({}),
}).strict();
```

Draft không phải Entity. Chỉ khi bấm **Bắt đầu**:

1. Validator kiểm world/law/culture/domain.
2. Hiện diff “game sẽ tạo gì”.
3. Tạo Entity/Aspect/Link/Knowledge/Provenance.
4. Sinh Event khởi đầu.
5. Gắn `PlayerState.chuTheId`.
6. Commit cùng transaction tạo save.

Không chọn mode Thần/Phàm thì bắt đầu ở Sáng Thế và chưa cần entity nhập vai.

### 78.5 Luồng Khởi Nguyên mới

```text
[Khởi Động]
  → Khởi Nguyên
  → Hồ sơ của bạn
       [Nhanh] [Gợi ý] [Đầy đủ] [Bỏ qua]
  → Bạn muốn thế giới biết gì về mình?
  → Ba cửa tạo thế giới: Hư Vô / Một Câu / Đầy Đủ
  → Preview thế giới khởi đầu
  → Hiện diện đầu tiên
       Sáng Thế Thần / một vị Thần / một Phàm Nhân
  → Diff cuối: riêng tư | gửi Narrator | thành canon
  → Bắt đầu
```

**Nhanh**

- tên hiển thị;
- cách xưng hô;
- ngôn ngữ;
- có thể bỏ tất cả.

**Gợi ý**

- thêm danh xưng Sáng Thế;
- quan hệ mong muốn với thế giới;
- 2–3 giá trị;
- hiện diện đầu tiên.

**Đầy đủ**

- toàn bộ trường của Profile/Creator/StartingPresence;
- preview riêng tư/canon;
- nhập/xuất hồ sơ cá nhân độc lập với save.

### 78.6 Gợi ý không chiếm quyền tác giả

- Gợi ý offline lấy từ bảng seeded theo archetype và seed.
- Gợi ý AI là tùy chọn, không chạy nếu chưa cấu hình endpoint.
- AI chỉ trả candidate có schema.
- Người chơi phải duyệt từng candidate.
- Không tự suy giới tính, tuổi, ngoại hình, tính cách hoặc cách xưng hô từ tên.
- Không dùng preset persona để ghi đè hồ sơ.
- Nút **“Để thế giới gọi tên ta”** giữ danh tính trống có chủ ý.

### 78.7 Bắt đầu trực tiếp ở tầng Thần

Sau khi world preview có thần hệ/khái niệm:

- chọn một thần có sẵn và nhập vai; hoặc
- tạo thần mới có 0–3 domain từ khái niệm đã tồn tại; hoặc
- tạo Thần Khởi Nguyên nếu world chưa có lịch sử.

Validator:

- domain phải được tiếp địa hoặc ghi rõ đang ở `hu_danh`;
- pantheon membership cần link/event;
- `primordial = true` không hợp nếu world đã có lịch sử, trừ khi dùng nhánh/retcon được duyệt;
- không cho tự khai `domainStrength`;
- coreSelf từ thông tin người chơi, các chỉ số còn lại do engine dựng.

### 78.8 Bắt đầu trực tiếp ở tầng Phàm Nhân

World phải chạy seed pass tối thiểu để có region/culture/household/nghề hợp lệ.

Ba cách:

1. **Nhập một người có sẵn** — chọn qua WorldView được phép.
2. **Sinh trong một hộ** — engine tạo quan hệ cha mẹ/người chăm sóc, nơi ở, lịch sử ngắn.
3. **Người lạ mới đến** — tạo provenance di cư và một Project tìm chỗ đứng.

Không cho người chơi tự gõ tài sản/kỹ năng vô hạn rồi nhận thẳng. Mọi item/skill được:

- chọn trong ngân sách hợp lý của hoàn cảnh;
- hoặc biến thành claim/background cần validator;
- hoặc trở thành mục tiêu Project.

Người chơi viết câu chuyện xuất thân tự do; engine hiện diff cách nó được tiếp địa.

### 78.9 Chỉnh sửa sau khi bắt đầu

| Dữ liệu | Sửa thế nào |
|---|---|
| Tên hiển thị/app pronoun | sửa tự do, không Event |
| Accessibility/narrative preference | sửa tự do |
| Private notes | sửa tự do, local-only |
| Danh xưng chưa ai biết | sửa tự do |
| Danh xưng đã thành lore | thêm alias hoặc tạo Event đổi tên |
| Ngoại hình hiện thân | đổi bằng hành động/luật/thân thể |
| Xuất thân đã thành canon | chỉ sửa qua branch/retcon có diff |
| Domain/kỹ năng/tài sản | thay đổi bằng gameplay |

Profile edit không hồi tố văn bản đã kể.

### 78.10 Migration save cũ

Khi mở save v3.0 trở xuống:

```text
playerProfileId = null
creatorIdentityId = null
setupVersion = 0
setupCompleted = true
```

Không ép wizard chặn người chơi. Sảnh hiện một mục nhẹ **“Hoàn thiện hồ sơ của bạn”**. Nếu họ bỏ qua, mọi fallback cũ tiếp tục hoạt động.

Không suy ngược Profile từ lịch sử chat. Có thể đề xuất alias Sáng Thế từ lore nhưng phải duyệt.

### 78.11 Tích hợp preset và prompt

Assembler chỉ expose:

```ts
export const ProjectedPlayerPersonaSchema = z.object({
  displayName: z.string(),
  pronouns: PronounSetSchema,
  currentMode: z.enum(['sang_the','than','pham_nhan']),
  currentEntityId: z.string().nullable(),
  publicDescription: z.string(),
}).strict();
```

Không expose:

- privateNotes;
- accessibility;
- content preference thô;
- tên thật khác displayName;
- identity field chưa công bố;
- dữ liệu của một hiện thân khác mà chủ thể hiện tại không biết.

`personaDescription` và `{{user}}` dùng đúng `ProjectedPlayerPersona`.

---

## PHẦN 79 — TÍCH HỢP, LỘ TRÌNH VÀ KIỂM TRA

### 79.1 Persistence v3

```ts
db.version(3).stores({
  playerProfiles:   'id, updatedAt',
  playerIdentities: '[saveId+id], saveId, id',
  rerankCache:      '[branchId+scopeKey+queryHash+candidateSetHash+visibilityHash+modelKey+configHash], branchId, scopeKey, visibilityHash, createdAtTick',
  retrievalEval:    'id, mode, task',
  retrievalRuns:    '++seq, branchId, scopeKey, queryHash, modeUsed, createdAtTick',
});
```

- Profile global local không copy theo branch.
- CreatorIdentity copy theo save; lịch sử công bố nằm trong Event theo branch.
- Nhân vật nhập vai là Entity, không lưu bản sao trong profile.
- `proxyPassword` rerank ở secure settings, không trong export.
- Rerank cache xóa được không ảnh hưởng save/replay.

### 79.2 Bổ sung lộ trình

| # | Nội dung | Xong khi |
|---|---|---|
| 109 | Heuristic rerank tách khỏi Phần 54.7 | Cùng candidate cho cùng rank/hash |
| 110 | Cross-encoder/listwise adapters | Output chỉ là subset candidate; lỗi fallback |
| 111 | Fusion + MMR + token-aware packing | Top-10 đa dạng source và giữ tiền lệ |
| 112 | Cache theo scope/visibility/model/config | Đổi tầng không cache hit sai |
| 113 | Retrieval eval harness | Có Recall/MRR/nDCG/diversity/leak/latency |
| 114 | UI Truy hồi + Before/After | Xem lý do từng chunk được chọn |
| 115 | PlayerProfile + privacy boundary | Private field không vào save/prompt mặc định |
| 116 | CreatorIdentity + disclosure | Danh xưng không tự thành lore |
| 117 | StartingPresenceDraft + atomic commit | Bắt đầu ở cả ba tầng không state nửa vời |
| 118 | Wizard Nhanh/Gợi ý/Đầy đủ/Bỏ qua | Bỏ qua vẫn vào game; đầy đủ có diff |
| 119 | Migrate save cũ | Không bị chặn bởi wizard |
| 120 | Preset persona adapter | `{{user}}` chỉ thấy projected persona |

### 79.3 Kiểm tra rerank

- [ ] Visibility filter chạy trước candidateK
- [ ] Reranker không nhận chunk forbidden
- [ ] Output id là subset của input id
- [ ] Duplicate/missing id xử lý deterministic
- [ ] Timeout hủy request và dùng heuristic
- [ ] Circuit breaker không làm mất context
- [ ] Cache key có scopeKey + visibilityHash
- [ ] Đổi mode/chuTheId không dùng cache cũ
- [ ] MMR phạt cùng source event
- [ ] Token packing không cắt giữa câu luật
- [ ] Rerank không đổi prompt module order
- [ ] Rerank không sửa Event/Patch/World
- [ ] nDCG/MRR so được với baseline
- [ ] Forbidden recall luôn 0
- [ ] Endpoint chết vẫn kể bằng context heuristic

### 79.4 Kiểm tra hồ sơ người chơi

- [ ] Có thể bỏ qua toàn bộ hồ sơ và bắt đầu
- [ ] Không bắt nhập giới tính, tuổi thật, email hoặc ngày sinh
- [ ] Display name không tự thành danh xưng Sáng Thế
- [ ] Private notes không vào prompt, RAG, lorebook hay export mặc định
- [ ] Accessibility có hiệu lực trước màn Sảnh
- [ ] AI suggestion không commit khi chưa duyệt
- [ ] Preset persona không ghi đè profile
- [ ] Tạo hiện thân commit atomically với save
- [ ] Bắt đầu tầng Thần không tự khai domainStrength
- [ ] Bắt đầu tầng Phàm không tự tạo tài sản/kỹ năng vô hạn
- [ ] Chọn entity có sẵn giữ nguyên lịch sử/entity id
- [ ] Danh tính công bố tạo Event và đi qua lore như sự kiện thật
- [ ] Sửa profile không hồi tố biên niên
- [ ] Save cũ mở không bị wizard chặn
- [ ] `{{user}}` chỉ nhận `ProjectedPlayerPersona`
- [ ] Export save chia sẻ không chứa hồ sơ riêng tư nếu chưa opt-in

### 79.5 Bổ sung vào Phase IDE

**Phase 0**

- Thêm PlayerProfile/CreatorIdentity/StartingPresence và Rerank schema vào matrix.
- Ghi privacy classification từng field.

**Phase 3**

- Vertical slice phải đi qua luồng Khởi Nguyên Nhanh và Bỏ qua.
- Save/load giữ link profile nhưng không trộn private data vào World.

**Phase 4**

- Starting Presence dùng Intent/validator khi tạo Thần/Phàm.

**Phase 8**

- Xây heuristic rerank + eval trước semantic adapter.
- Mock semantic reranker trước endpoint thật.
- Leak test retrieval chạy cho cả ba mode.

**Phase 9**

- Preset `personaDescription` và `{{user}}` dùng projected persona.
- Import không được sửa Profile.

**Phase 11**

- Hoàn thiện wizard 4 chế độ, privacy diff và UI Truy hồi.

**Phase 12**

- Fuzz rerank output/cache key.
- Privacy audit export/log/prompt/RAG.

### 79.6 Definition of Done bổ sung

- [ ] Người chơi được tạo hoặc bỏ qua hồ sơ trước khi bắt đầu
- [ ] Có thể chọn hiện diện đầu tiên ở Sáng Thế, Thần hoặc Phàm Nhân
- [ ] Dữ liệu riêng tư và canon có ranh giới kiểm thử được
- [ ] Rerank có baseline, semantic mode, fallback, cache và eval
- [ ] Rerank không tạo đường rò rỉ mới
- [ ] Tắt rerank cho kết quả RRF/heuristic hợp lệ
- [ ] Mất endpoint rerank không làm mất lượt

### 79.7 Ba câu của Khối U

1. Rerank chỉ sắp thứ tự điều chủ thể **được phép biết**; nó không được quyền nhìn trước rồi quên sau.
2. Người chơi có thể nói mình là ai, nhưng chỉ phần họ công bố mới trở thành sự thật của thế giới.
3. Hồ sơ là điểm bắt đầu của cách xưng hô và hiện diện, không phải một bảng chỉ số khóa số phận.

---

*Hết Khối U. Bộ đặc tả hoàn chỉnh v3.1.*
