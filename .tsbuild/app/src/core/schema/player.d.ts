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
export declare const PronounSetSchema: z.ZodPrefault<z.ZodObject<{
    self: z.ZodPrefault<z.ZodString>;
    subject: z.ZodPrefault<z.ZodString>;
    object: z.ZodPrefault<z.ZodString>;
    possessive: z.ZodPrefault<z.ZodString>;
    honorific: z.ZodPrefault<z.ZodString>;
}, z.core.$strip>>;
export declare const PlayerProfileSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodPrefault<z.ZodString>;
    pronouns: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
        self: z.ZodPrefault<z.ZodString>;
        subject: z.ZodPrefault<z.ZodString>;
        object: z.ZodPrefault<z.ZodString>;
        possessive: z.ZodPrefault<z.ZodString>;
        honorific: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>>;
    language: z.ZodPrefault<z.ZodString>;
    addressPreference: z.ZodPrefault<z.ZodString>;
    accessibility: z.ZodPrefault<z.ZodObject<{
        reducedMotion: z.ZodPrefault<z.ZodBoolean>;
        highContrast: z.ZodPrefault<z.ZodBoolean>;
        textScale: z.ZodPrefault<z.ZodNumber>;
        screenReaderHints: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    narrativePreferences: z.ZodPrefault<z.ZodObject<{
        pov: z.ZodPrefault<z.ZodEnum<{
            tu_dong: "tu_dong";
            thu_nhat: "thu_nhat";
            thu_ba: "thu_ba";
            toan_canh: "toan_canh";
        }>>;
        proseDensity: z.ZodPrefault<z.ZodEnum<{
            gon: "gon";
            vua: "vua";
            day: "day";
        }>>;
        dialogueAmount: z.ZodPrefault<z.ZodEnum<{
            vua: "vua";
            it: "it";
            nhieu: "nhieu";
        }>>;
        showSuggestions: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    contentPreferences: z.ZodPrefault<z.ZodObject<{
        sensitiveTopicsHidden: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        fadeToBlackTopics: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        adultContentOptIn: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    privateNotes: z.ZodPrefault<z.ZodString>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    version: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export declare const CreatorIdentitySchema: z.ZodObject<{
    id: z.ZodString;
    saveId: z.ZodString;
    title: z.ZodPrefault<z.ZodString>;
    aliases: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    pronouns: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
        self: z.ZodPrefault<z.ZodString>;
        subject: z.ZodPrefault<z.ZodString>;
        object: z.ZodPrefault<z.ZodString>;
        possessive: z.ZodPrefault<z.ZodString>;
        honorific: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>>;
    selfDescription: z.ZodPrefault<z.ZodString>;
    manifestationDescription: z.ZodPrefault<z.ZodString>;
    sigilDescription: z.ZodPrefault<z.ZodString>;
    voiceDescription: z.ZodPrefault<z.ZodString>;
    values: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    vows: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    taboos: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    relationToWorld: z.ZodPrefault<z.ZodEnum<{
        unknown: "unknown";
        creator: "creator";
        witness: "witness";
        gardener: "gardener";
        judge: "judge";
        wanderer: "wanderer";
    }>>;
    worldDisclosure: z.ZodPrefault<z.ZodObject<{
        revealTitle: z.ZodPrefault<z.ZodBoolean>;
        revealForm: z.ZodPrefault<z.ZodBoolean>;
        revealValues: z.ZodPrefault<z.ZodBoolean>;
        knownRegionIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    source: z.ZodPrefault<z.ZodEnum<{
        user: "user";
        seeded_suggestion: "seeded_suggestion";
        ai_suggestion: "ai_suggestion";
    }>>;
    version: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
/**
 * Bản nháp hiện thân đầu tiên — Phần 78.4.
 * [BB] Draft KHÔNG phải Entity. Chỉ khi bấm "Bắt đầu" nó mới đi qua
 * Intent → validator → Event/Patch → transaction.
 */
export declare const StartingPresenceDraftSchema: z.ZodObject<{
    mode: z.ZodPrefault<z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>>;
    useExistingEntityId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    name: z.ZodPrefault<z.ZodString>;
    pronouns: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
        self: z.ZodPrefault<z.ZodString>;
        subject: z.ZodPrefault<z.ZodString>;
        object: z.ZodPrefault<z.ZodString>;
        possessive: z.ZodPrefault<z.ZodString>;
        honorific: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>>;
    appearance: z.ZodPrefault<z.ZodString>;
    origin: z.ZodPrefault<z.ZodString>;
    traits: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    goals: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    fears: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    deity: z.ZodPrefault<z.ZodObject<{
        domainConceptIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        pantheonId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        primordial: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    mortal: z.ZodPrefault<z.ZodObject<{
        ageBand: z.ZodPrefault<z.ZodEnum<{
            child: "child";
            youth: "youth";
            adult: "adult";
            elder: "elder";
            world_defined: "world_defined";
        }>>;
        regionId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        cultureId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        householdId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        occupationId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        skillIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        itemIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strict>;
/**
 * [BB] Phần 78.11 — DUY NHẤT thứ Assembler được expose ra prompt/preset.
 * `personaDescription` và `{{user}}` dùng đúng kiểu này.
 */
export declare const ProjectedPlayerPersonaSchema: z.ZodObject<{
    displayName: z.ZodString;
    pronouns: z.ZodPrefault<z.ZodObject<{
        self: z.ZodPrefault<z.ZodString>;
        subject: z.ZodPrefault<z.ZodString>;
        object: z.ZodPrefault<z.ZodString>;
        possessive: z.ZodPrefault<z.ZodString>;
        honorific: z.ZodPrefault<z.ZodString>;
    }, z.core.$strip>>;
    currentMode: z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>;
    currentEntityId: z.ZodNullable<z.ZodString>;
    publicDescription: z.ZodString;
}, z.core.$strict>;
export type PronounSet = z.infer<typeof PronounSetSchema>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
export type CreatorIdentity = z.infer<typeof CreatorIdentitySchema>;
export type StartingPresenceDraft = z.infer<typeof StartingPresenceDraftSchema>;
export type ProjectedPlayerPersona = z.infer<typeof ProjectedPlayerPersonaSchema>;
/** Chế độ wizard — Phần 78.5. `Bỏ qua` phải tạo hồ sơ tối thiểu HỢP LỆ và không chặn chơi. */
export declare const CHE_DO_HO_SO: readonly ["nhanh", "goi_y", "day_du", "bo_qua"];
export type CheDoHoSo = (typeof CHE_DO_HO_SO)[number];
/** Hồ sơ tối thiểu hợp lệ cho nhánh `Bỏ qua`. `now` là tham số để giữ deterministic. */
export declare function hoSoToiThieu(id: string, now: number): PlayerProfile;
/** Danh tính Sáng Thế trống có chủ ý — nút "Để thế giới gọi tên ta" (78.6). */
export declare function danhTinhTrong(id: string, saveId: string): CreatorIdentity;
