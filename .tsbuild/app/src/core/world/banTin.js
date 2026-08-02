import { docAspect } from './process/tienIch.js';
/**
 * Khoảng cách theo số chặng đường từ `tuId`, giới hạn `toiDa` chặng.
 * BFS trên đồ thị tuyến đường thông suốt — cùng đồ thị mà tin tức phải đi.
 */
export function soChangToi(state, tuId, toiDa = 4) {
    const ke = new Map();
    for (const e of state.entities.values()) {
        if (e.kind !== 'route' || e.tickDiet !== null)
            continue;
        const d = docAspect(e, 'duong');
        if (!d || !d.thongSuot)
            continue;
        for (const [a, b] of [
            [d.tuId, d.denId],
            [d.denId, d.tuId],
        ]) {
            const ds = ke.get(a) ?? [];
            ds.push(b);
            ke.set(a, ds);
        }
    }
    const xa = new Map([[tuId, 0]]);
    let bien = [tuId];
    for (let b = 1; b <= toiDa && bien.length > 0; b++) {
        const sau = [];
        for (const n of bien) {
            for (const m of (ke.get(n) ?? []).sort((x, y) => (x < y ? -1 : 1))) {
                if (xa.has(m))
                    continue;
                xa.set(m, b);
                sau.push(m);
            }
        }
        bien = sau;
    }
    return xa;
}
/** Vùng mà một chủ thể đang ở, theo link `cu_tru_tai`. */
function vungCua(state, chuTheId) {
    if (chuTheId === null)
        return null;
    for (const lk of [...state.links.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
        if (lk.tickDut !== null)
            continue;
        if (lk.tuId === chuTheId && lk.quanHe === 'cu_tru_tai')
            return lk.denId;
    }
    const e = state.entities.get(chuTheId);
    const sp = docAspect(e, 'spatial');
    return sp?.chaId ?? null;
}
const THU_TU_MUC = { trong_dai: 3, lon: 2, thuong: 1 };
/**
 * Dựng bản tin cho một chủ thể ở một tầng.
 *
 * Sáng Thế thấy tất cả — đó là định nghĩa của tầng ấy. Thần và phàm nhân chỉ
 * thấy thứ có đường tới chỗ mình; thứ ở xa hơn `banKinh` chặng thì **không lọt
 * vào bản tin**, kể cả khi nó vừa xảy ra.
 */
export function banTinCho(state, suKien, mode, chuTheId, tickTu, tickDen, banKinh = 3) {
    const noiToi = vungCua(state, chuTheId) ?? chuTheId;
    const xa = mode === 'sang_the' || noiToi === null ? null : soChangToi(state, noiToi, banKinh);
    const muc = [];
    for (const sk of suKien) {
        let duong = 'chung_kien';
        if (xa !== null) {
            const noi = sk.locationId;
            const chang = noi === null ? 0 : (xa.get(noi) ?? Number.POSITIVE_INFINITY);
            if (chang === Number.POSITIVE_INFINITY)
                duong = 'chua_toi';
            else if (chang > 0)
                duong = 'nghe_ke';
            // Chuyện nhỏ ở làng bên không đi xa được — chỉ chuyện lớn mới thành tin đồn.
            if (duong === 'nghe_ke' && sk.mucDo === 'thuong')
                duong = 'chua_toi';
        }
        if (duong === 'chua_toi')
            continue;
        muc.push({
            loai: sk.loai,
            mucDo: sk.mucDo,
            // Nghe kể thì lời kể phải MANG dấu của việc nghe kể, không nói chắc như thấy.
            // Dùng dấu hai chấm chứ không ghép câu: phần lớn mô tả mở đầu bằng TÊN RIÊNG,
            // và hạ chữ đầu để ghép cho thuận sẽ biến "Trách Trách" thành "trách Trách".
            loiKe: duong === 'nghe_ke' ? `Người ta kể lại: ${sk.moTa}` : sk.moTa,
            locationId: sk.locationId,
            chuTheIds: sk.chuTheIds,
            duong,
        });
    }
    muc.sort((a, b) => THU_TU_MUC[b.mucDo] - THU_TU_MUC[a.mucDo]);
    const trongDai = muc.filter((m) => m.mucDo === 'trong_dai');
    const tomTat = muc.length === 0
        ? ''
        : trongDai.length > 0
            ? trongDai[0].loiKe
            : muc[0].loiKe;
    return { tickTu, tickDen, muc, tomTat };
}
