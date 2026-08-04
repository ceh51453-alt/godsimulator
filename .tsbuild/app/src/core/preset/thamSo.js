import { NormalizedGenParamsSchema } from '../schema/ai.js';
import { chuanHoaThamSo } from './chuanHoa.js';
export const KHOA_GHI_DE_THAM_SO = 'generationOverrides';
/** Các trường UI được phép ghi đè sau khi preset đã áp giá trị nguồn. */
const TRUONG_GHI_DE = [
    'temperature',
    'topP',
    'topK',
    'topA',
    'minP',
    'repetitionPenalty',
    'presencePenalty',
    'frequencyPenalty',
    'maxOutputTokens',
    'stopSequences',
    'seed',
    'continuePrefill',
    'reasoningEffort',
    'verbosity',
    'contextLimit',
];
function docGhiDe(pack) {
    const raw = pack.activation?.conflictResolutions[KHOA_GHI_DE_THAM_SO];
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
        return {};
    const ra = {};
    for (const key of TRUONG_GHI_DE) {
        const value = raw[key];
        if (value !== undefined)
            ra[key] = value;
    }
    return ra;
}
/**
 * Thứ tự quyền: cấu hình tay -> preset cũ -> preset mới -> chỉnh tay của preset.
 * Chỉ giá trị đã được profile xác nhận mới đi vào kết quả gửi model.
 */
export function gopThamSoSinhPreset(nen, packs, profile) {
    let ra = NormalizedGenParamsSchema.parse(nen);
    for (const pack of packs) {
        if (!pack.activation?.targets.includes('narrator'))
            continue;
        const daChuan = chuanHoaThamSo(pack.row.pack.generation, profile);
        const lopPreset = {};
        for (const muc of daChuan.bang) {
            if (muc.trangThai !== 'khong_ho_tro')
                lopPreset[muc.truong] = muc.dung;
        }
        const ungVien = { ...ra, ...lopPreset, ...docGhiDe(pack) };
        const hopLe = NormalizedGenParamsSchema.safeParse(ungVien);
        // Activation cũ/hỏng không được làm mất lượt chơi; bỏ riêng lớp ghi đè hỏng.
        ra = hopLe.success ? hopLe.data : NormalizedGenParamsSchema.parse({ ...ra, ...lopPreset });
    }
    return ra;
}
