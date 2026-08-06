/**
 * Bảng schema của aspect — một nguồn sự thật duy nhất cho mọi nơi cần kiểm mặt
 * của thực thể.
 *
 * ── Vì sao file này tồn tại ──
 *
 * `EntitySchema` khai `aspects: z.record(z.string(), z.unknown())`. Điều đó đúng
 * với 4.1 ("aspect là tập mở, kind mới thêm mặt mới"), nhưng nó có một hệ quả
 * mà chỉ nhìn thấy khi đi ngược đường dữ liệu: **`EntitySchema.safeParse()`
 * không kiểm một chữ nào bên trong `aspects`**.
 *
 * Nghĩa là hai cửa vào World được canh bằng hai tiêu chuẩn khác nhau:
 *
 * ```text
 * op 'link'  → chuanHoaBanGhiMoi() parse TỪNG aspect       → chặt
 * op 'set'   → apPatch() parse lại EntitySchema             → lọt
 * ```
 *
 * Một patch `set entities.x.aspects.lawful.tiepDia = "abc"` đi qua trọn ba lớp
 * của `bocTach()`, qua `PatchOpSchema`, qua `EntitySchema`, rồi nằm trong
 * `WorldState` — cho tới lúc một hàm nào đó gọi `.map()` lên một chuỗi.
 *
 * Bảng dưới đây là chỗ để cả hai cửa đọc chung một tiêu chuẩn. `registry/catalog.ts`
 * gộp nó vào `SchemaCatalog` với tiền tố `aspect.`; `engine/patch.ts` dùng nó ở
 * pha 2 để bản ghi sau khi vá vẫn phải là một bản ghi có nghĩa.
 *
 * ── Vì sao KHÔNG nằm luôn trong `registry/catalog.ts` ──
 *
 * Vì `engine/` không được kéo cả Registry vào chỉ để hỏi một schema. File này
 * chỉ import các module aspect — toàn lá, không vòng — nên `patch.ts` dùng được
 * mà không mở thêm một cạnh phụ thuộc nào đáng lo.
 */
import type { z } from 'zod';

import { SoulSchema } from './soul.js';
import { ConceptualSchema } from './conceptual.js';
import { LawfulSchema } from './lawful.js';
import { DomainSchema, VenerableSchema, DivisibleSchema, AvatarSchema } from './divine.js';
import {
  MortalSchema,
  GenealogicalSchema,
  SpatialSchema,
  CarrierSchema,
  AdversarialSchema,
  InstitutionalSchema,
} from './living.js';
import {
  DanCuSchema,
  YTeSchema,
  SinhThaiSchema,
  KinhTeSchema,
  VanHoaSchema,
  AnNinhSchema,
  DuongSchema,
} from './substrate.js';
import { DivineIdentitySchema } from './thanVi.js';
import { HoiDongSchema } from './hoiDong.js';
import { DuAnSchema } from './duAn.js';
import { SinhKeSchema, HoSchema, CanCuocSchema } from './pham.js';
import { ProvenanceSchema } from './provenance.js';
import { GiaoUocSchema } from '../than.js';

/**
 * Khóa là tên aspect **trần** (`lawful`), không phải `aspect.lawful`.
 *
 * Người gọi ở `patch.ts` cầm đúng khóa của `entity.aspects`, nên bắt nó tự ghép
 * tiền tố là mời một lỗi chính tả không ai bắt được.
 */
export const SCHEMA_ASPECT: ReadonlyMap<string, z.ZodType> = new Map<string, z.ZodType>([
  ['soul', SoulSchema],
  ['conceptual', ConceptualSchema],
  ['lawful', LawfulSchema],
  ['domain', DomainSchema],
  ['venerable', VenerableSchema],
  ['divisible', DivisibleSchema],
  ['genealogical', GenealogicalSchema],
  ['carrier', CarrierSchema],
  ['spatial', SpatialSchema],
  ['mortal', MortalSchema],
  ['adversarial', AdversarialSchema],
  ['institutional', InstitutionalSchema],
  // aspect nền — Phase 5
  ['dan_cu', DanCuSchema],
  ['y_te', YTeSchema],
  ['sinh_thai', SinhThaiSchema],
  ['kinh_te', KinhTeSchema],
  ['van_hoa', VanHoaSchema],
  ['an_ninh', AnNinhSchema],
  ['duong', DuongSchema],
  // tầng Thần — Phase 6
  ['ban_nga', DivineIdentitySchema],
  ['giao_uoc', GiaoUocSchema],
  ['avatar', AvatarSchema],
  ['hoi_dong', HoiDongSchema],
  ['du_an', DuAnSchema],
  // tầng Phàm Nhân — Phase 7
  ['sinh_ke', SinhKeSchema],
  ['ho', HoSchema],
  ['can_cuoc', CanCuocSchema],
  // hai bảng — Phase 11
  ['provenance', ProvenanceSchema],
]);

/** Dùng lại ở `registry/catalog.ts` để `SchemaCatalog` không phải chép danh sách lần hai. */
export const MUC_SCHEMA_ASPECT: readonly (readonly [string, z.ZodType])[] = [...SCHEMA_ASPECT].map(
  ([ten, schema]) => [`aspect.${ten}`, schema] as const,
);
