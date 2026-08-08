/**
 * Hợp nhất thông số sinh của preset với cấu hình Tường Thuật do người dùng đặt.
 *
 * Cấu hình AI là lớp nền thuộc về máy. Preset là lớp phủ theo ván/nhánh, vì vậy
 * không được ghi ngược lớp phủ ấy vào cấu hình máy. Hàm thuần này được gọi ngay
 * trước lúc biên soạn và gửi một lượt kể, nhờ đó đổi nhánh hoặc tắt preset có
 * hiệu lực ngay mà không để lại thông số của ván trước.
 */
import type { ModelProfile, NormalizedGenParams } from '../schema/ai.js';
import { NormalizedGenParamsSchema } from '../schema/ai.js';
import type { PackDangBat } from './hopNhat.js';
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
  'streaming',
  'reasoningEffort',
  'verbosity',
  'contextLimit',
] as const satisfies readonly (keyof NormalizedGenParams)[];

function docGhiDe(pack: PackDangBat): Partial<NormalizedGenParams> {
  const raw = pack.activation?.conflictResolutions[KHOA_GHI_DE_THAM_SO];
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const ra: Partial<NormalizedGenParams> = {};
  for (const key of TRUONG_GHI_DE) {
    const value = (raw as Record<string, unknown>)[key];
    if (value !== undefined) (ra as Record<string, unknown>)[key] = value;
  }
  return ra;
}

/**
 * Thứ tự quyền: cấu hình tay -> preset cũ -> preset mới -> chỉnh tay của preset.
 * Chỉ giá trị đã được profile xác nhận mới đi vào kết quả gửi model.
 */
export function gopThamSoSinhPreset(
  nen: NormalizedGenParams,
  packs: readonly PackDangBat[],
  profile: ModelProfile,
): NormalizedGenParams {
  let ra: NormalizedGenParams = NormalizedGenParamsSchema.parse(nen);

  for (const pack of packs) {
    if (!pack.activation?.targets.includes('narrator')) continue;

    const daChuan = chuanHoaThamSo(pack.row.pack.generation, profile);
    const lopPreset: Record<string, unknown> = {};
    for (const muc of daChuan.bang) {
      if (muc.trangThai !== 'khong_ho_tro') lopPreset[muc.truong] = muc.dung;
    }

    const ungVien = { ...ra, ...lopPreset, ...docGhiDe(pack) };
    const hopLe = NormalizedGenParamsSchema.safeParse(ungVien);
    // Activation cũ/hỏng không được làm mất lượt chơi; bỏ riêng lớp ghi đè hỏng.
    ra = hopLe.success ? hopLe.data : NormalizedGenParamsSchema.parse({ ...ra, ...lopPreset });
  }

  return ra;
}
