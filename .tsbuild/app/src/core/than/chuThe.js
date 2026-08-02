function docAspect(e, ten) {
    const a = e.aspects[ten];
    return a === undefined || a === null ? undefined : a;
}
/** Kind hợp lệ cho từng tầng — 21.3. */
const KIND_CUA_TANG = Object.freeze({
    than: 'deity',
    pham_nhan: 'mortal',
});
/** Những chủ thể người chơi đã từng nhập, theo lịch sử chuyển tầng. */
function daTungNhapVao(state) {
    const ra = new Set();
    const ct = state.world.playerState.chuTheId;
    if (ct !== null)
        ra.add(ct);
    return ra;
}
/**
 * Ứng viên chủ thể cho một tầng, đã xếp hạng.
 *
 * Thứ tự: chủ thể đang nhập trước nhất (quay lại đúng chỗ mình vừa rời), rồi tới
 * nhân vật do người chơi tạo, rồi tới người có chỗ đứng trong thế giới, rồi tới
 * phần còn lại theo id để kết quả ổn định giữa hai lần chạy.
 */
export function chonChuThe(state, mode) {
    if (mode === 'sang_the')
        return [];
    const kind = KIND_CUA_TANG[mode];
    const daNhap = daTungNhapVao(state);
    const ra = [];
    for (const id of [...state.entities.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
        const e = state.entities.get(id);
        if (!e || e.kind !== kind || e.tickDiet !== null)
            continue;
        let diem = 0;
        const vi = [];
        if (daNhap.has(id)) {
            diem += 1000;
            vi.push('bạn đang là người này');
        }
        // Nhân vật do người chơi dựng ở màn Khởi Nguyên mang tiền tố `_pc_`.
        if (id.includes('_pc_')) {
            diem += 500;
            vi.push('do bạn tạo');
        }
        if (mode === 'than') {
            const ven = docAspect(e, 'venerable');
            const tinDo = ven?.soTinDoUocLuong ?? 0;
            const den = Object.values(ven?.matDoDen ?? {}).filter((m) => m > 0).length;
            diem += Math.min(200, tinDo) + den * 25;
            if (den > 0)
                vi.push(`có đền ở ${den} vùng`);
            if (tinDo > 0)
                vi.push(`khoảng ${tinDo} người thờ`);
            if (den === 0 && tinDo === 0)
                vi.push('chưa ai thờ');
            // [BB] 19.4 — thần đang hóa thân KHÔNG nhập thẳng vào được ở tầng Thần:
            // phần thần của họ đang ngủ trong một thân xác phàm.
            const ht = docAspect(e, 'avatar');
            if (ht && !ht.daThucTinh) {
                diem -= 800;
                vi.push('đang hóa thân, phần thần đang ngủ');
            }
        }
        else {
            const m = docAspect(e, 'mortal');
            const kn = Object.values(m?.kyNang ?? {});
            diem += kn.length * 10;
            if (m?.ngheId)
                vi.push(`làm nghề ${m.ngheId}`);
            if (kn.length > 0)
                vi.push(`${kn.length} kỹ năng`);
        }
        ra.push({
            id,
            ten: e.ten,
            moTa: e.moTa,
            vi: vi.length > 0 ? vi.join(' · ') : 'chưa có gì nổi bật',
            daTungNhap: daNhap.has(id),
            diem,
        });
    }
    ra.sort((a, b) => (b.diem !== a.diem ? b.diem - a.diem : a.id < b.id ? -1 : 1));
    return Object.freeze(ra);
}
/**
 * Chủ thể mặc định khi người chơi không chọn.
 *
 * Trả `null` là một câu trả lời hợp lệ và quan trọng: nó có nghĩa "tầng này chưa
 * có ai để nhập". Gọi hàm này rồi bỏ qua `null` chính là cách lỗi cũ xảy ra.
 */
export function chuTheMacDinhCho(state, mode) {
    if (mode === 'sang_the')
        return null;
    return chonChuThe(state, mode)[0]?.id ?? null;
}
/** Tầng nào đang có người để nhập — UI dùng để làm mờ nút thay vì báo lỗi sau khi bấm. */
export function tangKhaDung(state) {
    return Object.freeze({
        sang_the: true,
        than: chonChuThe(state, 'than').length > 0,
        pham_nhan: chonChuThe(state, 'pham_nhan').length > 0,
    });
}
