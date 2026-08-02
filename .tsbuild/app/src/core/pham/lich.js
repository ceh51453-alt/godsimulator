import { ScheduleBlockSchema } from '../contracts/primitives.js';
import { phamThan, viecKhongLamDuoc } from './thanThe.js';
import { nhanNghe } from '../schema/aspect/pham.js';
function docAspect(e, ten) {
    const a = e?.aspects[ten];
    return a && typeof a === 'object' ? a : undefined;
}
/** Vùng cư trú theo link `cu_tru_tai` còn hiệu lực. */
export function noiOCua(state, id) {
    for (const lk of state.links.values()) {
        if (lk.tickDut !== null || lk.quanHe !== 'cu_tru_tai' || lk.tuId !== id)
            continue;
        return lk.denId;
    }
    return null;
}
/**
 * Lịch một nhịp của một người, suy từ hoàn cảnh.
 *
 * Bốn khối, theo đúng thứ tự một ngày: ngủ, làm, ăn với nhà, và phần còn lại.
 * Người ốm thì khối làm biến thành khối nằm; trẻ con thì thành khối học; người
 * già không có khối làm. Không ai phải viết một cái state machine cho việc này.
 */
export function lichCua(state, nguoiId) {
    const e = state.entities.get(nguoiId);
    const m = phamThan(e);
    if (!e || !m || e.tickDiet !== null)
        return [];
    const sk = docAspect(e, 'sinh_ke');
    const nha = m.hoId ?? null;
    const o = noiOCua(state, nguoiId);
    const cam = new Set(viecKhongLamDuoc(m));
    const kh = (startOffset, duration, activity, locationId, flexible = true) => ScheduleBlockSchema.parse({ startOffset, duration, activity, locationId, flexible });
    const ra = [kh(0, 0.3, 'ngu', nha ?? o, false)];
    const omNang = m.thanThe.thuongTich.some((t) => t.trangThai !== 'da_lanh' && t.nang >= 0.6);
    if (omNang) {
        ra.push(kh(0.3, 0.5, 'nam_benh', nha ?? o, false));
    }
    else if (m.ageBand === 'child') {
        ra.push(kh(0.3, 0.35, cam.has('hoc') ? 'choi' : 'hoc', o));
    }
    else if (m.ageBand === 'elder') {
        ra.push(kh(0.3, 0.3, 'trong_nha', nha ?? o));
    }
    else if (sk?.ngheId && !cam.has('lam_viec_nang')) {
        ra.push(kh(0.3, 0.45, `lam_${sk.ngheId}`, sk.noiLamId ?? o, false));
    }
    else {
        // Thất nghiệp không phải "rảnh": nó là đi tìm việc, và nó có vị trí thật.
        ra.push(kh(0.3, 0.35, 'tim_viec', o));
    }
    if (nha)
        ra.push(kh(0.8, 0.12, 'an_voi_nha', nha, false));
    ra.push(kh(0.92, 0.08, 'quanh_quan', o));
    return Object.freeze(ra);
}
/**
 * Người này đang ở đâu và làm gì vào lúc `phanNhip` của nhịp hiện tại.
 *
 * `phanNhip` là 0…1 trong một nhịp. Mặc định 0.5 — giữa buổi, tức là lúc người
 * ta đang làm việc; đó là câu trả lời đúng cho câu hỏi "giờ này họ ở đâu".
 */
export function dangODau(state, nguoiId, phanNhip = 0.5) {
    const ds = lichCua(state, nguoiId);
    const p = Math.max(0, Math.min(0.999, phanNhip));
    for (const b of ds) {
        if (p >= b.startOffset && p < b.startOffset + b.duration) {
            return { noiId: b.locationId, viec: b.activity };
        }
    }
    const cuoi = ds[ds.length - 1];
    return { noiId: cuoi?.locationId ?? noiOCua(state, nguoiId), viec: cuoi?.activity ?? 'quanh_quan' };
}
/** Nhãn tiếng Việt cho việc trong lịch — [BB] 36.7, UI không hiện chuỗi máy. */
export const NHAN_VIEC = Object.freeze({
    ngu: 'ngủ',
    nam_benh: 'nằm bệnh',
    hoc: 'học',
    choi: 'chơi',
    trong_nha: 'ở trong nhà',
    tim_viec: 'đi tìm việc',
    an_voi_nha: 'ăn với nhà',
    quanh_quan: 'quanh quẩn',
});
export function nhanViec(viec) {
    if (viec.startsWith('lam_nghe_'))
        return `làm nghề ${nhanNghe(viec.slice('lam_'.length))}`;
    return NHAN_VIEC[viec] ?? viec.replace(/_/g, ' ');
}
/**
 * Ai đang có mặt ở một nơi vào lúc này.
 *
 * Đây là hàm mà đối thoại và nghe lỏm cần: "ai đứng đủ gần để nghe" phải suy từ
 * lịch, không phải từ danh sách cư dân. Người đang ngoài ruộng thì không nghe
 * được chuyện nói trong nhà, dù cùng làng.
 */
export function aiDangO(state, noiId, phanNhip = 0.5) {
    const ra = [];
    for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : 1))) {
        const e = state.entities.get(id);
        if (!e || e.kind !== 'mortal' || e.tickDiet !== null)
            continue;
        const o = dangODau(state, id, phanNhip);
        if (o.noiId === noiId)
            ra.push({ id, viec: o.viec });
    }
    return Object.freeze(ra);
}
