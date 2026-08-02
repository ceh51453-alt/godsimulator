import { ForeshadowSchema, quaHan } from '../schema/truyen.js';
import { LOAI_PHUC_BUT } from '../schema/truyen.js';
import { hashCua } from '../engine/hash.js';
function chuanLoai(x) {
    return LOAI_PHUC_BUT.includes(x) ? x : 'dieu_bao';
}
/**
 * Id phục bút: hàm thuần của (mạch, nội dung).
 *
 * Gieo hai lần cùng một điều trong cùng một mạch là MỘT phục bút, không phải
 * hai. Nếu không, Narrator nhắc lại một lời tiên tri ở lượt sau sẽ nhân đôi sổ
 * và ngân sách tầng 6 bị chính cái sổ ấy ăn hết.
 */
export function idPhucBut(branchId, machId, noiDung) {
    return `pb_${branchId}_${hashCua([machId, noiDung.trim().toLowerCase()]).slice(0, 12)}`;
}
/** Gieo một phục bút. Trùng nội dung trong cùng mạch thì KHÔNG gieo lại. */
export function gieoPhucBut(s, g, nc) {
    const id = idPhucBut(s.world.branchId, g.machId, g.noiDung);
    if (s.foreshadows.has(id))
        return { patches: [], id, daCo: true };
    const f = ForeshadowSchema.parse({
        id,
        branchId: s.world.branchId,
        machId: g.machId,
        noiDung: g.noiDung.slice(0, 500),
        loai: chuanLoai(g.loai),
        tickGieo: nc.tick,
        hanTraToiDa: g.hanTraToiDa,
        doNang: Math.max(0, Math.min(100, g.doNang)),
    });
    const patches = [
        { op: 'link', target: { table: 'foreshadows', id, path: '' }, value: f, sourceEventId: nc.eventId },
    ];
    // Mạch giữ danh sách id để nén theo hình dạng truyện (30.3) tra được nhanh.
    if (g.machId !== null && s.storylines.has(g.machId)) {
        patches.push({
            op: 'push',
            target: { table: 'storylines', id: g.machId, path: 'phucBut' },
            value: id,
            sourceEventId: nc.eventId,
        });
    }
    return { patches, id, daCo: false };
}
/** Trả một phục bút. Không xóa dòng — trả là một sự kiện, không phải phép xóa. */
export function traPhucBut(s, id, cachTra, nc) {
    const f = s.foreshadows.get(id);
    if (!f || f.daTra)
        return [];
    return [
        {
            op: 'set',
            target: { table: 'foreshadows', id, path: 'daTra' },
            value: true,
            sourceEventId: nc.eventId,
        },
        {
            op: 'set',
            target: { table: 'foreshadows', id, path: 'cachTra' },
            value: cachTra.slice(0, 300),
            sourceEventId: nc.eventId,
        },
    ];
}
/**
 * Engine kiểm mỗi tick.
 *
 * [BB] 30.2 — quá hạn chưa trả thì: (a) đẩy lên đầu context kèm ghi chú "chưa
 * trả", (b) cộng ưu tiên cho ống kính chĩa vào mạch đó, (c) nếu đã quá hạn gấp
 * đôi thì nó thôi là một lời hứa và trở thành một `gap` loại `nhan_qua`.
 */
export function raSoatPhucBut(s, nc) {
    const patches = [];
    const quaHanDs = [];
    const machUuTien = new Set();
    let soThanhBiAn = 0;
    const ids = [...s.foreshadows.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const id of ids) {
        const f = s.foreshadows.get(id);
        if (!f || f.daTra)
            continue;
        if (!quaHan(f, nc.tick))
            continue;
        quaHanDs.push(f);
        if (f.machId !== null)
            machUuTien.add(f.machId);
        // Quá hạn GẤP ĐÔI: thôi chờ, biến nó thành bí ẩn của thế giới.
        const han = f.hanTraToiDa ?? 0;
        if (f.daThanhBiAn || nc.tick <= f.tickGieo + han * 2)
            continue;
        const gapId = `gap_nhan_qua_${id}`;
        if (!s.gaps.has(gapId)) {
            patches.push({
                op: 'link',
                target: { table: 'gaps', id: gapId, path: '' },
                value: {
                    id: gapId,
                    branchId: s.world.branchId,
                    loai: 'nhan_qua',
                    chuTheId: f.machId,
                    moTa: `Đã gieo mà chưa trả: ${f.noiDung}`,
                    uuTien: Math.round(f.doNang),
                    lanThu: 0,
                    // [BB] Nguyên tắc 4 — chỗ chưa trả KHÔNG bị xóa, nó thành câu hỏi.
                    trangThai: 'thanh_bi_an',
                    tickPhatHien: nc.tick,
                },
                sourceEventId: nc.eventId,
            });
            soThanhBiAn++;
        }
        patches.push({
            op: 'set',
            target: { table: 'foreshadows', id, path: 'daThanhBiAn' },
            value: true,
            sourceEventId: nc.eventId,
        });
    }
    quaHanDs.sort((a, b) => b.doNang - a.doNang || (a.id < b.id ? -1 : 1));
    return {
        patches,
        chuaTraQuaHan: quaHanDs,
        machUuTien: [...machUuTien].sort((a, b) => (a < b ? -1 : 1)),
        soThanhBiAn,
    };
}
/** Phục bút đang treo của một mạch — nuôi tầng 6 của prompt (33.1). */
export function phucButDangTreo(s, machId) {
    return [...s.foreshadows.values()]
        .filter((f) => !f.daTra && (machId === null || f.machId === machId))
        .sort((a, b) => b.doNang - a.doNang || (a.id < b.id ? -1 : 1));
}
