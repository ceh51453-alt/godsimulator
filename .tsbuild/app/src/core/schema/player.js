/**
 * Hồ sơ và hiện diện ban đầu của người chơi — Phần 78 [BB].
 *
 * [BB] 78.1 — BA LỚP DỮ LIỆU, KHÔNG ĐƯỢC TRỘN:
 *
 *   PlayerProfile        (riêng tư, ngoài canon, local-only)
 *     → phép chiếu do người chơi duyệt
 *   CreatorIdentity      (danh tính Sáng Thế; thế giới chỉ thấy phần được CÔNG BỐ)
 *     → Entity được điều khiển (Thần hoặc Phàm nếu chọn)
 *
 * Tên tài khoản KHÔNG tự trở thành tên Thần Sáng Thế.
 * `{{user}}` trong preset chỉ nhận `ProjectedPlayerPersona`.
 *
 * [BB] Không bắt nhập giới tính, tuổi thật, email hay ngày sinh. Schema này
 * cố tình KHÔNG có những trường đó — không thể lỡ tay thu thập.
 */
import { z } from 'zod';
import { ViewModeSchema } from '../contracts/primitives.js';
export const PronounSetSchema = z
    .object({
    self: z.string().prefault('ta'),
    subject: z.string().prefault('bạn'),
    object: z.string().prefault('bạn'),
    possessive: z.string().prefault('của bạn'),
    honorific: z.string().prefault(''),
})
    .prefault({});
export const PlayerProfileSchema = z
    .object({
    id: z.string(),
    displayName: z.string().max(80).prefault('Người Chơi'),
    pronouns: PronounSetSchema.prefault({}),
    language: z.string().prefault('vi'),
    addressPreference: z.string().max(120).prefault(''),
    accessibility: z
        .object({
        reducedMotion: z.boolean().prefault(false),
        highContrast: z.boolean().prefault(false),
        textScale: z.number().min(0.8).max(2).prefault(1),
        screenReaderHints: z.boolean().prefault(true),
    })
        .prefault({}),
    narrativePreferences: z
        .object({
        pov: z.enum(['tu_dong', 'thu_nhat', 'thu_ba', 'toan_canh']).prefault('tu_dong'),
        proseDensity: z.enum(['gon', 'vua', 'day']).prefault('vua'),
        dialogueAmount: z.enum(['it', 'vua', 'nhieu']).prefault('vua'),
        showSuggestions: z.boolean().prefault(true),
    })
        .prefault({}),
    contentPreferences: z
        .object({
        sensitiveTopicsHidden: z.array(z.string()).prefault([]),
        fadeToBlackTopics: z.array(z.string()).prefault([]),
        adultContentOptIn: z.boolean().prefault(false),
    })
        .prefault({}),
    privateNotes: z.string().max(4_000).prefault(''),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
    version: z.number().int().min(1).prefault(1),
})
    .strict();
export const CreatorIdentitySchema = z
    .object({
    id: z.string(),
    saveId: z.string(),
    title: z.string().max(120).prefault('Kẻ Không Tên'),
    aliases: z.array(z.string().max(120)).max(20).prefault([]),
    pronouns: PronounSetSchema.prefault({}),
    selfDescription: z.string().max(2_000).prefault(''),
    manifestationDescription: z.string().max(2_000).prefault(''),
    sigilDescription: z.string().max(1_000).prefault(''),
    voiceDescription: z.string().max(1_000).prefault(''),
    /** Lời tự nhận. Chỉ lời thề đã được ban thành Event/Law mới ràng buộc engine. */
    values: z.array(z.string().max(160)).max(12).prefault([]),
    vows: z.array(z.string().max(300)).max(12).prefault([]),
    taboos: z.array(z.string().max(300)).max(12).prefault([]),
    relationToWorld: z
        .enum(['creator', 'witness', 'gardener', 'judge', 'wanderer', 'unknown'])
        .prefault('creator'),
    /** [BB] Chỉ phần được công bố mới trở thành sự thật của thế giới. */
    worldDisclosure: z
        .object({
        revealTitle: z.boolean().prefault(false),
        revealForm: z.boolean().prefault(false),
        revealValues: z.boolean().prefault(false),
        knownRegionIds: z.array(z.string()).prefault([]),
    })
        .prefault({}),
    source: z.enum(['user', 'seeded_suggestion', 'ai_suggestion']).prefault('user'),
    version: z.number().int().min(1).prefault(1),
})
    .strict();
/**
 * Bản nháp hiện thân đầu tiên — Phần 78.4.
 * [BB] Draft KHÔNG phải Entity. Chỉ khi bấm "Bắt đầu" nó mới đi qua
 * Intent → validator → Event/Patch → transaction.
 */
export const StartingPresenceDraftSchema = z
    .object({
    mode: ViewModeSchema.prefault('sang_the'),
    useExistingEntityId: z.string().nullable().prefault(null),
    name: z.string().max(120).prefault(''),
    pronouns: PronounSetSchema.prefault({}),
    appearance: z.string().max(2_000).prefault(''),
    origin: z.string().max(2_000).prefault(''),
    traits: z.array(z.string().max(160)).max(12).prefault([]),
    goals: z.array(z.string().max(300)).max(8).prefault([]),
    fears: z.array(z.string().max(300)).max(8).prefault([]),
    deity: z
        .object({
        domainConceptIds: z.array(z.string()).max(3).prefault([]),
        pantheonId: z.string().nullable().prefault(null),
        primordial: z.boolean().prefault(false),
        // [BB] 78.7 — KHÔNG có trường domainStrength/suc. Người chơi không tự khai được.
    })
        .prefault({}),
    mortal: z
        .object({
        ageBand: z.enum(['child', 'youth', 'adult', 'elder', 'world_defined']).prefault('world_defined'),
        regionId: z.string().nullable().prefault(null),
        cultureId: z.string().nullable().prefault(null),
        householdId: z.string().nullable().prefault(null),
        occupationId: z.string().nullable().prefault(null),
        skillIds: z.array(z.string()).prefault([]),
        itemIds: z.array(z.string()).prefault([]),
    })
        .prefault({}),
})
    .strict();
/**
 * [BB] Phần 78.11 — DUY NHẤT thứ Assembler được expose ra prompt/preset.
 * `personaDescription` và `{{user}}` dùng đúng kiểu này.
 */
export const ProjectedPlayerPersonaSchema = z
    .object({
    displayName: z.string(),
    pronouns: PronounSetSchema,
    currentMode: ViewModeSchema,
    currentEntityId: z.string().nullable(),
    publicDescription: z.string(),
})
    .strict();
/** Chế độ wizard — Phần 78.5. `Bỏ qua` phải tạo hồ sơ tối thiểu HỢP LỆ và không chặn chơi. */
export const CHE_DO_HO_SO = ['nhanh', 'goi_y', 'day_du', 'bo_qua'];
/** Hồ sơ tối thiểu hợp lệ cho nhánh `Bỏ qua`. `now` là tham số để giữ deterministic. */
export function hoSoToiThieu(id, now) {
    return PlayerProfileSchema.parse({
        id,
        createdAt: now,
        updatedAt: now,
    });
}
/** Danh tính Sáng Thế trống có chủ ý — nút "Để thế giới gọi tên ta" (78.6). */
export function danhTinhTrong(id, saveId) {
    return CreatorIdentitySchema.parse({ id, saveId });
}
