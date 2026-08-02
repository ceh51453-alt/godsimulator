/**
 * HandlerCatalog + SchemaCatalog — Phần 61.2 [BB].
 *
 * "Hai catalog sau CHỈ nằm trong code."
 *
 * Pack JSON chỉ được tham chiếu `handlerId` và `schemaRef` đã đăng ký ở đây.
 * Id lạ → mục được nhập ở trạng thái `can_adapter`, KHÔNG kích hoạt.
 * Đây là ranh giới duy nhất giữa dữ liệu không tin cậy và code chạy được.
 */
import { z } from 'zod';
import { EntitySchema, LinkSchema, WorldMetricsSchema, GapSchema } from '../schema/entity.js';
import { SoulSchema, RelationStateSchema, QuanHeMotChieuSchema } from '../schema/aspect/soul.js';
import { ConceptualSchema } from '../schema/aspect/conceptual.js';
import { LawfulSchema } from '../schema/aspect/lawful.js';
import { DomainSchema, VenerableSchema, DivisibleSchema, AvatarSchema } from '../schema/aspect/divine.js';
import { MortalSchema, GenealogicalSchema, SpatialSchema, CarrierSchema, AdversarialSchema, InstitutionalSchema, } from '../schema/aspect/living.js';
import { DanCuSchema, YTeSchema, SinhThaiSchema, KinhTeSchema, VanHoaSchema, AnNinhSchema, DuongSchema, } from '../schema/aspect/substrate.js';
import { KnowledgeRowSchema, DebtRowSchema } from '../schema/soSach.js';
import { DivineIdentitySchema, DomainStateSchema } from '../schema/aspect/thanVi.js';
import { PrayerSchema, GiaoUocSchema, DieuKhoanSchema } from '../schema/than.js';
import { KnowledgeRecordSchema } from '../intent/schema.js';
import { ModelProfileSchema, GenParamsSchema } from '../schema/ai.js';
import { AiConfigSchema, AiEndpointSchema, ProbeResultSchema } from '../ai/cauHinh.js';
import { HoiDongSchema, GheSchema, NghiQuyetSchema } from '../schema/aspect/hoiDong.js';
import { DuAnSchema } from '../schema/aspect/duAn.js';
import { SinhKeSchema, HoSchema, CanCuocSchema, ThuongTichSchema } from '../schema/aspect/pham.js';
import { ProvenanceSchema } from '../schema/aspect/provenance.js';
import { PatchOpSchema, EventSchema, SceneSchema, WorldSchema, PlayerStateSchema, } from '../contracts/core.js';
import { EntityRefSchema, ClaimSchema, DebtSchema, ObligationSchema, ScheduleBlockSchema, FlowRefSchema, ConditionRecordSchema, BlockReasonSchema, } from '../contracts/primitives.js';
/**
 * Mọi schema mà một manifest được phép trỏ tới bằng `schemaRef`.
 * [BB] Phần 61.6 — không schema nào được dùng trong spec mà thiếu type, nơi lưu và test parse.
 */
const schemaEntries = [
    ['entity', EntitySchema],
    ['link', LinkSchema],
    ['gap', GapSchema],
    ['worldMetrics', WorldMetricsSchema],
    ['world', WorldSchema],
    ['playerState', PlayerStateSchema],
    ['event', EventSchema],
    ['scene', SceneSchema],
    ['patchOp', PatchOpSchema],
    ['entityRef', EntityRefSchema],
    ['blockReason', BlockReasonSchema],
    ['claim', ClaimSchema],
    ['debt', DebtSchema],
    ['obligation', ObligationSchema],
    ['scheduleBlock', ScheduleBlockSchema],
    ['flowRef', FlowRefSchema],
    ['conditionRecord', ConditionRecordSchema],
    // aspects
    ['aspect.soul', SoulSchema],
    ['aspect.conceptual', ConceptualSchema],
    ['aspect.lawful', LawfulSchema],
    ['aspect.domain', DomainSchema],
    ['aspect.venerable', VenerableSchema],
    ['aspect.divisible', DivisibleSchema],
    ['aspect.genealogical', GenealogicalSchema],
    ['aspect.carrier', CarrierSchema],
    ['aspect.spatial', SpatialSchema],
    ['aspect.mortal', MortalSchema],
    ['aspect.adversarial', AdversarialSchema],
    ['aspect.institutional', InstitutionalSchema],
    // aspect nền — Phase 5
    ['aspect.dan_cu', DanCuSchema],
    ['aspect.y_te', YTeSchema],
    ['aspect.sinh_thai', SinhThaiSchema],
    ['aspect.kinh_te', KinhTeSchema],
    ['aspect.van_hoa', VanHoaSchema],
    ['aspect.an_ninh', AnNinhSchema],
    ['aspect.duong', DuongSchema],
    // bảng Phase 5
    ['knowledgeRecord', KnowledgeRecordSchema],
    ['knowledgeRow', KnowledgeRowSchema],
    ['debtRow', DebtRowSchema],
    // tầng Thần — Phase 6
    ['aspect.ban_nga', DivineIdentitySchema],
    ['aspect.giao_uoc', GiaoUocSchema],
    ['domainState', DomainStateSchema],
    ['prayer', PrayerSchema],
    ['dieuKhoan', DieuKhoanSchema],
    ['avatar', AvatarSchema],
    ['aspect.avatar', AvatarSchema],
    ['relationState', RelationStateSchema],
    // hội đồng thần — 69.3
    ['aspect.hoi_dong', HoiDongSchema],
    ['aspect.du_an', DuAnSchema],
    ['ghe', GheSchema],
    ['nghiQuyet', NghiQuyetSchema],
    // tầng Phàm Nhân — Phase 7
    ['aspect.sinh_ke', SinhKeSchema],
    ['aspect.ho', HoSchema],
    ['aspect.can_cuoc', CanCuocSchema],
    ['thuongTich', ThuongTichSchema],
    ['quanHeMotChieu', QuanHeMotChieuSchema],
    // hai bảng — Phase 11, Phần 59.1
    ['aspect.provenance', ProvenanceSchema],
    // ai
    ['modelProfile', ModelProfileSchema],
    ['genParams', GenParamsSchema],
    ['aiEndpoint', AiEndpointSchema],
    ['aiConfig', AiConfigSchema],
    ['probeResult', ProbeResultSchema],
    // tham số động từ / hành động
    ['params.empty', z.object({}).strict()],
    ['params.targets', z.object({ mucTieuIds: z.array(z.string()).min(1) }).strict()],
    ['params.name', z.object({ ten: z.string().min(1), moTa: z.string().prefault('') }).strict()],
];
export const SchemaCatalog = new Map(schemaEntries);
/**
 * Handler runtime dựng sẵn.
 * Phase 0 khai hợp đồng và catalog rỗng có kiểu; handler thật được nạp ở Phase 1+
 * qua `dangKyHandler`. Manifest trỏ tới handlerId chưa có → trạng thái `can_adapter`.
 */
const handlers = new Map();
export function dangKyHandler(id, fn) {
    handlers.set(id, fn);
}
export const HandlerCatalog = handlers;
export function coHandler(id) {
    return id === '' || handlers.has(id);
}
export function coSchemaRef(ref) {
    return ref === '' || SchemaCatalog.has(ref);
}
export function danhSachSchemaRef() {
    return [...SchemaCatalog.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
