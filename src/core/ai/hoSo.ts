/**
 * Chọn `ModelProfile` cho một model id — Phần 31.2.
 *
 * ── Vì sao việc này đáng có một file riêng ──
 *
 * `chuanHoaThamSo()` dùng hồ sơ để **kẹp và loại** tham số của preset: mỗi cờ
 * `hoTro` bằng `false` nghĩa là trường ấy không được gửi lên endpoint, và mỗi
 * trần trong `gioiHan` là một con số mà preset không vượt qua được. Nên chọn sai
 * hồ sơ không phải là chuyện hiển thị — nó là chuyện preset của người dùng có
 * được áp dụng hay không.
 *
 * Bản trước chọn hồ sơ bằng vòng lặp "khớp mảnh đầu tiên tìm thấy" ngay trong
 * store, và nó có ba lỗ:
 *
 * 1. Thứ tự đăng ký quyết định người thắng. `gemini-3.1-pro` và một hồ sơ
 *    `gemini-pro` chung chung sẽ tranh nhau tùy ai đăng ký trước.
 * 2. `endpoint.profileId` có trong schema nhưng không ai đọc — người dùng chọn
 *    tay một hồ sơ thì lựa chọn ấy rơi vào hư không.
 * 3. Model không khớp mảnh nào rơi thẳng về `khong_ro`, kể cả khi lần quét
 *    endpoint vừa khai đúng `contextMax` của nó.
 *
 * Ba hàm dưới đây đóng cả ba lỗ, và chúng thuần nên test được không cần store.
 */
import type { ModelProfile } from '../schema/ai.js';

/** Một hồ sơ trong registry, rút gọn về đúng phần hàm này cần. */
export type MucHoSo = Readonly<{ id: string; profile: ModelProfile }>;

export type NguCanhChonHoSo = Readonly<{
  /** `endpoint.modelId` — chuỗi người dùng đang thật sự gửi lên. */
  modelId: string;
  /** `endpoint.profileId`. Khác rỗng nghĩa là người dùng đã chọn tay. */
  profileId?: string;
  /**
   * `contextMax` mà lần quét endpoint khai cho chính model này.
   *
   * Chỉ dùng khi không hồ sơ nào khớp tên: một con số proxy vừa trả về đáng tin
   * hơn hằng số dự phòng, và nó là thứ duy nhất ta biết về model lạ.
   */
  contextMaxDaQuet?: number | null;
}>;

/**
 * Hồ sơ khớp tên model, hoặc `null`.
 *
 * Khớp theo mảnh dài nhất, không theo thứ tự đăng ký: `gemini-3.1-pro` (mảnh 15
 * ký tự) thắng một hồ sơ khai `gemini` (6 ký tự) dù ai đăng ký trước. Hòa thì
 * so `id` để hai lần chạy cho cùng kết quả.
 */
export function khopHoSoTheoTen(modelId: string, ds: readonly MucHoSo[]): MucHoSo | null {
  const ten = modelId.trim().toLowerCase();
  if (ten === '') return null;

  let tot: { muc: MucHoSo; dai: number } | null = null;
  for (const d of ds) {
    for (const mieng of d.profile.khop.chua) {
      const m = mieng.trim().toLowerCase();
      if (m === '' || !ten.includes(m)) continue;
      if (tot === null || m.length > tot.dai || (m.length === tot.dai && d.id < tot.muc.id)) {
        tot = { muc: d, dai: m.length };
      }
    }
  }
  return tot?.muc ?? null;
}

/**
 * Trần context suy từ lần quét endpoint.
 *
 * Kẹp vào `[8192, 4_000_000]`: proxy khai 0, khai `null` hoặc khai một con số vô
 * lý là chuyện thường, và một trần 0 sẽ cắt sạch prompt trước khi ai kịp nhận ra.
 */
export function tranContextDaQuet(gioiThieu: number | null | undefined): number | null {
  if (typeof gioiThieu !== 'number' || !Number.isFinite(gioiThieu)) return null;
  const n = Math.trunc(gioiThieu);
  if (n < 8_192) return null;
  return Math.min(n, 4_000_000);
}

/**
 * Hồ sơ dùng cho một endpoint. Thứ tự quyền:
 *
 * ```text
 * 1. profileId người dùng chọn tay
 * 2. hồ sơ khớp tên model (mảnh dài nhất thắng)
 * 3. hồ sơ dự phòng, lấy trần context theo con số proxy vừa quét được
 * ```
 *
 * Bước 3 đi CẢ HAI CHIỀU. Con số của lần quét là dữ liệu thật về đúng model
 * đang chọn, còn trần trong hồ sơ dự phòng chỉ là mẫu số chung — nên khi proxy
 * khai 32K thì hạ xuống 32K, và khai 1M thì nâng lên 1M. Chỉ nâng mà không hạ
 * là giữ lại đúng cái rủi ro mà con số thật vừa loại bỏ.
 *
 * Bước 3 KHÔNG bật thêm cờ `hoTro` nào: biết model dài bao nhiêu không có nghĩa
 * là biết nó nhận `min_p`, và đoán sai ở đó làm hỏng lời gọi chứ không chỉ mất
 * vài token.
 */
export function hoSoChoModel(
  ng: NguCanhChonHoSo,
  ds: readonly MucHoSo[],
  duPhong: ModelProfile,
): ModelProfile {
  const chonTay = (ng.profileId ?? '').trim();
  if (chonTay !== '') {
    const muc = ds.find((d) => d.id === chonTay);
    if (muc !== undefined) return muc.profile;
  }

  const khop = khopHoSoTheoTen(ng.modelId, ds);
  if (khop !== null) return khop.profile;

  const tran = tranContextDaQuet(ng.contextMaxDaQuet);
  if (tran === null || tran === duPhong.gioiHan.contextMax) return duPhong;
  return { ...duPhong, gioiHan: { ...duPhong.gioiHan, contextMax: tran } };
}
