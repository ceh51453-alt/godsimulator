import { bam, chuanHoa } from '../engine/hash.js';
export const BEN = ['a', 'b', 'ca_hai'];
function duongDanKhac(a, b, tien = '') {
    if (chuanHoa(a) === chuanHoa(b))
        return [];
    const laObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
    if (!laObj(a) || !laObj(b))
        return [tien === '' ? '.' : tien];
    const khoa = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    const ra = [];
    for (const k of khoa) {
        if (k.startsWith('_'))
            continue; // trường cache, không phải sự thật
        ra.push(...duongDanKhac(a[k], b[k], tien === '' ? k : `${tien}.${k}`));
    }
    return ra;
}
/**
 * So hai nhánh và dựng báo cáo tranh chấp — 26.2 "diff ba cột".
 *
 * Không sửa gì. Hàm thuần trên hai `WorldState` đã nạp.
 */
export function soSanhNhanh(a, b, tuning) {
    const idA = new Set(a.entities.keys());
    const idB = new Set(b.entities.keys());
    const chung = [...idA].filter((id) => idB.has(id)).sort();
    const chiCoA = [...idA].filter((id) => !idB.has(id)).sort();
    const chiCoB = [...idB].filter((id) => !idA.has(id)).sort();
    const tranhChap = [];
    const vungNghichLy = new Set();
    for (const id of chung) {
        const ea = a.entities.get(id);
        const eb = b.entities.get(id);
        const khac = duongDanKhac(ea, eb);
        if (khac.length === 0)
            continue;
        /**
         * Đề xuất mặc định: bên nào có `tickDiet` thì bên ấy KHÔNG được đề xuất.
         *
         * Một thực thể chết ở nhánh này và sống ở nhánh kia là tranh chấp nặng nhất —
         * gộp bừa sẽ hồi sinh hoặc giết một nhân vật mà không có một dòng văn nào
         * giải thích. Đề xuất giữ bản còn sống, và bắt buộc người chơi xác nhận.
         */
        const songA = ea.tickDiet === null;
        const songB = eb.tickDiet === null;
        const deXuat = songA && !songB ? 'a' : songB && !songA ? 'b' : 'ca_hai';
        const lyDo = songA !== songB
            ? 'Một nhánh giữ thực thể này còn sống, nhánh kia đã chôn nó. Chọn một; không có bản trung dung.'
            : `Khác ${khac.length} trường: ${khac.slice(0, 5).join(', ')}.`;
        tranhChap.push({ bang: 'entities', id, ten: ea.ten, truongKhac: khac, chiCoO: null, deXuat, lyDo });
        // Thực thể có mặt ở cả hai với trạng thái khác nhau → vùng Nghịch Lý.
        for (const l of a.links.values()) {
            if (l.tuId === id && l.quanHe === 'o_tai')
                vungNghichLy.add(l.denId);
        }
    }
    for (const id of chiCoA) {
        tranhChap.push({
            bang: 'entities',
            id,
            ten: a.entities.get(id)?.ten ?? id,
            truongKhac: [],
            chiCoO: 'a',
            deXuat: 'a',
            lyDo: 'Chỉ tồn tại ở nhánh A.',
        });
    }
    for (const id of chiCoB) {
        tranhChap.push({
            bang: 'entities',
            id,
            ten: b.entities.get(id)?.ten ?? id,
            truongKhac: [],
            chiCoO: 'b',
            deXuat: 'b',
            lyDo: 'Chỉ tồn tại ở nhánh B.',
        });
    }
    const giaThucTai = tuning.thucTai.hopNhanh;
    return {
        nhanhA: a.world.branchId,
        nhanhB: b.world.branchId,
        chungId: chung,
        tranhChap,
        chiCoA,
        chiCoB,
        vungNghichLy: [...vungNghichLy].sort(),
        giaThucTai,
        tomTat: `Hợp ${a.world.branchId} với ${b.world.branchId}: ` +
            `${chung.length} thực thể có ở cả hai · ${chiCoA.length} chỉ ở A · ${chiCoB.length} chỉ ở B · ` +
            `${tranhChap.filter((t) => t.chiCoO === null).length} tranh chấp thật · ` +
            `realityIntegrity ${giaThucTai} · ${vungNghichLy.size} vùng thành Nghịch Lý`,
    };
}
/**
 * Sinh patch hợp nhánh sau khi người chơi đã quyết định từng tranh chấp.
 *
 * [BB] Mọi tranh chấp THẬT phải có quyết định. Thiếu một cái là dừng — trả về
 * danh sách còn thiếu chứ không dùng `deXuat` thay người chơi.
 */
export function gopNhanh(input) {
    const thatSu = input.baoCao.tranhChap.filter((t) => t.chiCoO === null);
    const thieu = thatSu.filter((t) => input.quyetDinh[t.id] === undefined).map((t) => t.id);
    if (thieu.length > 0)
        return { ok: false, chuaQuyetDinh: thieu };
    const patches = [];
    const kyUc = [];
    const them = (op, table, id, value, path = '') => {
        patches.push({ op, target: { table, id, path }, value, sourceEventId: input.eventId });
    };
    for (const t of input.baoCao.tranhChap) {
        const chon = t.chiCoO ?? input.quyetDinh[t.id];
        const ea = input.a.entities.get(t.id);
        const eb = input.b.entities.get(t.id);
        /**
         * Mọi bản ghi vào nhánh đích bằng `link`, không bằng `set`.
         *
         * Hợp nhánh tạo ra một nhánh MỚI: ở đó chưa có bản ghi nào để mà sửa. Dùng
         * `set` sẽ trả `BAN_GHI_THIEU` cho từng thực thể, và lỗi ấy chỉ lộ ra khi
         * người chơi thật sự bấm hợp — tức là ở đúng chỗ tệ nhất.
         */
        if (chon === 'a' && ea !== undefined) {
            them('link', 'entities', t.id, { ...ea, branchId: input.nhanhDich });
            continue;
        }
        if (chon === 'b' && eb !== undefined) {
            them('link', 'entities', t.id, { ...eb, branchId: input.nhanhDich });
            continue;
        }
        if (chon === 'ca_hai' && ea !== undefined && eb !== undefined) {
            /**
             * Giữ bản A làm bản chính và **ghi nhớ bản B** thay vì trộn trường.
             *
             * Trộn hai bản khác nhau ở tám trường cho ra một thực thể chưa từng tồn tại
             * ở nhánh nào — thứ mà thanh tra mạch lạc sẽ không truy được về đâu cả.
             */
            them('link', 'entities', t.id, { ...ea, branchId: input.nhanhDich });
            kyUc.push({
                entityId: t.id,
                banA: bam(chuanHoa(ea)),
                banB: bam(chuanHoa(eb)),
            });
        }
    }
    // Link: giữ mọi cạnh của cả hai bên; cạnh trùng id thì giữ bản của A.
    const daCo = new Set();
    for (const l of [...input.a.links.values()].sort((x, y) => (x.id < y.id ? -1 : 1))) {
        daCo.add(l.id);
        them('link', 'links', l.id, { ...l, branchId: input.nhanhDich });
    }
    for (const l of [...input.b.links.values()].sort((x, y) => (x.id < y.id ? -1 : 1))) {
        if (daCo.has(l.id))
            continue;
        them('link', 'links', l.id, { ...l, branchId: input.nhanhDich });
    }
    // Cái giá: realityIntegrity tụt, và nó tụt NGAY, không tụt dần.
    them('add', 'metrics', 'metrics', input.tuning.thucTai.hopNhanh, 'realityIntegrity');
    return { ok: true, patches, kyUcHaiBan: kyUc };
}
