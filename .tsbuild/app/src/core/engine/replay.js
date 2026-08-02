import { WorldSchema } from '../contracts/core.js';
import { taoState, taoEventLog, hashState } from './state.js';
import { apDungEvent } from './transaction.js';
import { chayInvariantToanBo } from './invariant.js';
import { loi } from '../contracts/errors.js';
import { dat, hong } from '../contracts/errors.js';
/**
 * Dựng lại state từ world khởi đầu + nhật ký Event.
 *
 * `nghiemNgat = true` (mặc định): một Event hỏng làm replay thất bại. Đây là chế
 * độ dùng cho test và cho kiểm tra toàn vẹn save.
 *
 * `nghiemNgat = false`: bỏ qua Event hỏng và ghi lại — dùng khi phục hồi một save
 * đã hư, nơi mất vài Event vẫn hơn mất cả thế giới.
 */
export function replay(worldBanDau, events, nghiemNgat = true) {
    const w = WorldSchema.safeParse(worldBanDau);
    if (!w.success) {
        return hong([
            loi('persistence', 'WORLD_BAN_DAU_HONG', 'World khởi đầu không hợp lệ.', {
                details: { issues: w.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`) },
                recoverable: false,
            }),
        ]);
    }
    const state = taoState(structuredClone(w.data));
    const log = taoEventLog();
    const canhBao = [];
    let tuChoi = 0;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const r = apDungEvent(state, e, log);
        if (r.ok) {
            canhBao.push(...r.warnings);
            continue;
        }
        if (nghiemNgat) {
            return hong([
                loi('persistence', 'REPLAY_DUT', `Replay dừng ở Event thứ ${i + 1}/${events.length} ('${e.id}').`),
                ...r.errors,
            ], canhBao);
        }
        tuChoi++;
        canhBao.push(loi('persistence', 'REPLAY_BO_QUA_EVENT', `Bỏ qua Event '${e.id}': ${r.errors[0]?.message ?? 'lỗi'}`, {
            severity: 'warning',
        }));
    }
    // Mỗi transaction chỉ kiểm bất biến trên phạm vi đã chạm (vì lý do hiệu năng),
    // nên cuối replay phải quét TOÀN BỘ một lần để bắt vi phạm mức toàn cục.
    const rInv = chayInvariantToanBo(state);
    canhBao.push(...rInv.canhBao);
    if (!rInv.dat && nghiemNgat) {
        return hong([
            loi('invariant', 'REPLAY_VI_PHAM_TOAN_CUC', 'State sau replay vi phạm bất biến toàn cục.'),
            ...rInv.viPhamNang,
        ], canhBao);
    }
    return dat({
        state,
        hashCuoi: hashState(state),
        soEventDaApDung: log.soLuong(),
        soEventBiTuChoi: tuChoi,
        canhBao,
    }, canhBao);
}
/**
 * Kiểm chứng determinism: replay hai lần độc lập, so hash.
 * Trả về hash nếu khớp; lỗi có cấu trúc nếu lệch.
 */
export function kiemDeterminism(worldBanDau, events) {
    const a = replay(worldBanDau, events);
    if (!a.ok)
        return hong(a.errors, a.warnings);
    const b = replay(worldBanDau, events);
    if (!b.ok)
        return hong(b.errors, b.warnings);
    if (a.value.hashCuoi !== b.value.hashCuoi) {
        return hong([
            loi('invariant', 'REPLAY_KHONG_DETERMINISTIC', 'Hai lần replay cùng đầu vào cho hai hash khác nhau.', {
                details: { lan1: a.value.hashCuoi, lan2: b.value.hashCuoi },
                recoverable: false,
            }),
        ]);
    }
    return dat(a.value.hashCuoi);
}
