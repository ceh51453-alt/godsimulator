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
const laObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/**
 * Chuẩn hóa `aspects` của một entity.
 *
 * Mỗi aspect được parse bằng chính schema đã đăng ký trong `SchemaCatalog`, nên
 * mọi trường thiếu nhận giá trị `.prefault()` — cùng giá trị mà engine dùng cho
 * thực thể do chính nó sinh ra. Aspect không có schema thì bị bỏ: giữ lại một
 * mảnh dữ liệu không ai đọc được chỉ để nó nằm đấy làm hỏng hash.
 */
function chuanHoaAspects(tho) {
    const canhBao = [];
    if (!laObj(tho))
        return { aspects: {}, canhBao };
    const ra = {};
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
 * Chuẩn hóa một bản ghi mới trước khi nó thành `PatchOp`.
 *
 * `branchId` do người gọi ép — model không được chọn nhánh, cùng lẽ với
 * `sourceEventId` (để model tự khai là mở cửa cho nó ghi sang dòng thời gian
 * khác).
 */
export function chuanHoaBanGhiMoi(bang, tho, branchId) {
    if (!laObj(tho))
        return { ok: false, vi: 'Bản ghi mới phải là một đối tượng.' };
    if (bang === 'entities') {
        const { aspects, canhBao } = chuanHoaAspects(tho['aspects']);
        const r = EntitySchema.safeParse({ ...tho, branchId, aspects });
        if (!r.success) {
            return { ok: false, vi: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') };
        }
        return { ok: true, value: r.data, canhBao };
    }
    const schema = bang === 'links' ? LinkSchema : bang === 'gaps' ? GapSchema : bang === 'prayers' ? PrayerSchema : null;
    if (schema === null)
        return { ok: false, vi: `Không có schema cho bảng "${bang}".` };
    const r = schema.safeParse({ ...tho, branchId });
    if (!r.success) {
        return { ok: false, vi: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') };
    }
    return { ok: true, value: r.data, canhBao: [] };
}
