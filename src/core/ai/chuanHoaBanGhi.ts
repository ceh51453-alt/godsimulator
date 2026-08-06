/**
 * Chuẩn hóa bản ghi do model tạo — lớp 2 của `bocTach()`, làm cho đủ.
 *
 * ── Lỗ hổng mà file này bịt (tìm được ở E2E của Phase 12) ──
 *
 * `bocTach()` có ba lớp: cú pháp, hình dạng, thẩm quyền. Nhưng lớp "hình dạng"
 * chỉ kiểm **PatchOp**, không kiểm **giá trị bên trong nó**. Với `op: 'link'`,
 * giá trị ấy là cả một bản ghi mới, và `PatchOpSchema` khai nó là `unknown`.
 *
 * Hậu quả không phải một patch sai bị từ chối — mà là engine **nổ**:
 *
 * ```text
 * TypeError: Cannot read properties of undefined (reading 'thuongTich')
 *   ở batBienPham.ts, trong lúc chạy invariant
 * ```
 *
 * Model viết `"mortal": {"tuoiTho": 60}` — hợp lý với một người đọc, nhưng
 * `MortalSchema` còn mười trường nữa mà `.prefault()` chỉ điền khi có ai đó
 * *parse*. Không ai parse, nên `m.thanThe` là `undefined`, và bất biến chạm vào
 * nó trước khi kịp trả về một vi phạm có cấu trúc.
 *
 * Nói cách khác: **Narrator làm treo được engine.** Đó là lỗ hổng nghiêm trọng
 * nhất Phase 12 tìm ra, và nó nằm đúng ở chỗ dữ liệu ngoài đi vào trong.
 *
 * ── Cách sửa: điền cho đủ, không đoán ──
 *
 * `.prefault()` của Zod là hợp đồng "giá trị mặc định an toàn của trường này".
 * Chạy schema qua bản ghi model gửi không phải là **bịa thêm dữ liệu**; nó là
 * đọc đúng hợp đồng ấy. Thứ file này KHÔNG làm là đoán nội dung: aspect model
 * khai mà engine không biết tên thì bị **bỏ kèm lý do**, không được giữ lại
 * dưới dạng dữ liệu tự do.
 */
import { EntitySchema, LinkSchema, GapSchema } from '../schema/entity.js';
import { PrayerSchema } from '../schema/than.js';
import { SchemaCatalog } from '../registry/catalog.js';

export type KetQuaChuanHoa =
  | { readonly ok: true; readonly value: unknown; readonly canhBao: readonly string[] }
  | { readonly ok: false; readonly vi: string };

const laObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Chuẩn hóa `aspects` của một entity.
 *
 * Mỗi aspect được parse bằng chính schema đã đăng ký trong `SchemaCatalog`, nên
 * mọi trường thiếu nhận giá trị `.prefault()` — cùng giá trị mà engine dùng cho
 * thực thể do chính nó sinh ra. Aspect không có schema thì bị bỏ: giữ lại một
 * mảnh dữ liệu không ai đọc được chỉ để nó nằm đấy làm hỏng hash.
 */
function chuanHoaAspects(tho: unknown): { aspects: Record<string, unknown>; canhBao: string[] } {
  const canhBao: string[] = [];
  if (!laObj(tho)) return { aspects: {}, canhBao };

  const ra: Record<string, unknown> = {};
  for (const khoa of Object.keys(tho).sort()) {
    const schema = SchemaCatalog.get(`aspect.${khoa}`);
    if (schema === undefined) {
      canhBao.push(`Bỏ aspect "${khoa}": engine không biết mặt này của thực thể.`);
      continue;
    }
    const r = schema.safeParse(tho[khoa]);
    if (!r.success) {
      canhBao.push(`Bỏ aspect "${khoa}": ${r.error.issues[0]?.message ?? 'không hợp lệ'}.`);
      continue;
    }
    ra[khoa] = r.data;
  }
  return { aspects: ra, canhBao };
}

/**
 * Bậc cao nhất một khái niệm được phép SINH RA ở.
 *
 * `bocTach()` cấm sửa `conceptual.giaiDoan`, nhưng op `link` mang cả bản ghi nên
 * nó không đi qua đường dẫn cấm. Không kẹp ở đây thì cửa vừa khóa lại mở toang:
 * model chỉ cần tạo khái niệm mới ở thẳng `ket_tinh`.
 *
 * `thanh_hinh` là trần đúng, không phải một con số tùy tiện — 43.3 đòi khái niệm
 * nền phải ít nhất `thanh_hinh` mới đặt tên được một trục, nên lời kể vẫn khai
 * được "thứ này đã thành hình trong thế giới". Bậc cuối thì phải leo bằng trọng
 * số thật, và trọng số thì `vongKetTinh.ts` cộng.
 */
const BAC_KHAI_SINH_TOI_DA = 'thanh_hinh';
const BAC_DUOC_KHAI_SINH = new Set(['hu_danh', 'manh_nha', 'thanh_hinh']);

/**
 * Kẹp những trường mà engine giữ sổ về giá trị khai sinh.
 *
 * Trả kèm cảnh báo chứ không từ chối cả bản ghi: model khai một khái niệm đã
 * kết tinh thường là nó đang mô tả đúng thứ vừa xảy ra trong văn, chỉ là nó
 * không có thẩm quyền định bậc. Hạ bậc rồi cho vào còn giữ được nội dung; từ
 * chối thì mất luôn cả khái niệm.
 */
function kepTruongEngine(aspects: Record<string, unknown>): string[] {
  const canhBao: string[] = [];

  const c = aspects['conceptual'];
  if (laObj(c)) {
    const bac = c['giaiDoan'];
    if (typeof bac === 'string' && !BAC_DUOC_KHAI_SINH.has(bac)) {
      canhBao.push(
        `Khái niệm mới không sinh ra ở bậc "${bac}". Đã hạ về "${BAC_KHAI_SINH_TOI_DA}"; ` +
          'bậc còn lại do trọng số thật leo.',
      );
      c['giaiDoan'] = BAC_KHAI_SINH_TOI_DA;
    }
    if (typeof c['trongSo'] === 'number' && c['trongSo'] !== 0) {
      canhBao.push('Trọng số khái niệm do engine cộng từ sự kiện thật. Bản ghi mới bắt đầu từ 0.');
      c['trongSo'] = 0;
    }
  }

  const l = aspects['lawful'];
  if (laObj(l) && typeof l['hieuLuc'] === 'number' && l['hieuLuc'] !== 0) {
    canhBao.push('Hiệu lực luật do tiếp địa quyết (42.2). Bản ghi mới bắt đầu từ 0 và engine tính lại.');
    l['hieuLuc'] = 0;
  }

  return canhBao;
}

/**
 * Chuẩn hóa một bản ghi mới trước khi nó thành `PatchOp`.
 *
 * `branchId` do người gọi ép — model không được chọn nhánh, cùng lẽ với
 * `sourceEventId` (để model tự khai là mở cửa cho nó ghi sang dòng thời gian
 * khác).
 */
export function chuanHoaBanGhiMoi(
  bang: string,
  tho: unknown,
  branchId: string,
  targetId?: string,
): KetQuaChuanHoa {
  if (!laObj(tho)) return { ok: false, vi: 'Bản ghi mới phải là một đối tượng.' };

  const canhBaoId =
    targetId !== undefined && typeof tho['id'] === 'string' && tho['id'] !== targetId
      ? [`Đã sửa id trong value từ "${tho['id']}" thành target.id "${targetId}".`]
      : [];
  // target.id là khóa transaction đã qua PatchOpSchema. Ép value.id theo khóa
  // loại bỏ một lỗi LLM rất thường gặp mà nếu để tới invariant sẽ rollback cả lô.
  const coIdDung = targetId === undefined ? tho : { ...tho, id: targetId };

  if (bang === 'entities') {
    const { aspects, canhBao } = chuanHoaAspects(coIdDung['aspects']);
    // Kẹp SAU khi parse: `chuanHoaAspects()` đã điền `.prefault()`, nên tới đây
    // `conceptual`/`lawful` chắc chắn có mặt đủ trường để kẹp mà không phải đoán.
    const canhBaoKep = kepTruongEngine(aspects);
    const r = EntitySchema.safeParse({ ...coIdDung, branchId, aspects });
    if (!r.success) {
      return { ok: false, vi: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') };
    }
    return { ok: true, value: r.data, canhBao: [...canhBaoId, ...canhBao, ...canhBaoKep] };
  }

  const schema =
    bang === 'links' ? LinkSchema : bang === 'gaps' ? GapSchema : bang === 'prayers' ? PrayerSchema : null;

  if (schema === null) return { ok: false, vi: `Không có schema cho bảng "${bang}".` };

  const r = schema.safeParse({ ...coIdDung, branchId });
  if (!r.success) {
    return { ok: false, vi: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') };
  }
  return { ok: true, value: r.data, canhBao: canhBaoId };
}
