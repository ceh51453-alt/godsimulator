import { loi } from '../contracts/errors.js';
import { uocLuong } from '../ai/nganSach.js';
import { LorebookEntrySchema, TRAN_TOKEN_ENTRY } from './schema.js';
export const LOAI_OP = ['them', 'sua', 'gop', 'tach', 'che', 'doi_key', 'xoa'];
/** Bảng quyền 52.2 [BB]. `true` = được phép. */
export const QUYEN_OP = Object.freeze({
    them: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
    sua: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
    gop: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
    tach: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
    // Che là op DUY NHẤT chạm được tới cả ba nguồn.
    che: Object.freeze({ tu_sinh: true, nguoi_dung: true, di_san: true }),
    doi_key: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
    xoa: Object.freeze({ tu_sinh: true, nguoi_dung: false, di_san: false }),
});
const RONG = { ok: false, loi: [], them: [], sua: [], xoaId: [] };
/** Kiểm quyền theo bảng 52.2. */
export function duocPhep(op, nguon) {
    return QUYEN_OP[op][nguon];
}
/**
 * Xác thực và áp MỘT op — 52.4.
 *
 * Trả về `KetQuaOp` cho mọi đường đi. Không throw, không sửa `entries` tại chỗ.
 */
export function apMotOp(op, ctx) {
    const l = [];
    const tyLeToken = ctx.tyLeToken ?? 3.2;
    const tran = ctx.tranToken ?? TRAN_TOKEN_ENTRY;
    const timEntry = (id) => ctx.entries.get(id);
    const nguonCua = (id) => ctx.nguonCua.get(id);
    const chanQuyen = (id) => {
        const n = nguonCua(id);
        if (n === undefined) {
            l.push(loi('schema', 'ENTRY_KHONG_TON_TAI', `Không có entry "${id}".`, { path: id }));
            return false;
        }
        if (!duocPhep(op.op, n)) {
            l.push(loi('schema', 'KHONG_DU_QUYEN', `Op "${op.op}" không được phép trên entry nguồn "${n}" (bảng quyền 52.2). ` +
                (n === 'nguoi_dung' ? 'Entry người dùng chỉ có thể bị CHE, không bao giờ bị sửa hay xóa.' : ''), { path: id, details: { op: op.op, nguon: n } }));
            return false;
        }
        return true;
    };
    switch (op.op) {
        case 'them': {
            if (ctx.nguonDich !== 'tu_sinh') {
                // [BB] 50.10 — chỉ được ghi vào lorebook `nguon = 'tu_sinh'`.
                l.push(loi('schema', 'GHI_VAO_LOREBOOK_NGUOI_DUNG', 'Chỉ được thêm entry vào lorebook tự sinh.', {
                    details: { nguonDich: ctx.nguonDich },
                    severity: 'fatal',
                }));
                return { ...RONG, loi: l };
            }
            if (op.keys.length === 0)
                l.push(loi('schema', 'KEYS_RONG', 'Entry mới phải có ít nhất một keyword.'));
            for (const c of op.chuDe) {
                if (!ctx.entityTonTai.has(c)) {
                    l.push(loi('schema', 'CHU_DE_KHONG_CO_THAT', `chuDe "${c}" không trỏ tới entity nào có thật.`));
                }
            }
            if (op.suKienChongLung.length === 0) {
                // [BB] 51.6 — khẳng định không có gì chống lưng thì không được nạp.
                l.push(loi('schema', 'THIEU_SU_KIEN_CHONG_LUNG', 'Entry mới phải trích dẫn ít nhất một sự kiện engine.'));
            }
            for (const e of op.suKienChongLung) {
                if (!ctx.eventTonTai.has(e)) {
                    l.push(loi('schema', 'SU_KIEN_KHONG_CO_THAT', `Sự kiện "${e}" không có trong log.`));
                }
            }
            const token = uocLuong(op.noiDung, tyLeToken);
            if (token > tran) {
                l.push(loi('schema', 'VUOT_TRAN_TOKEN', `Entry dài ${token} token, vượt trần ${tran}. Phải tách.`));
            }
            if (l.length > 0)
                return { ...RONG, loi: l };
            const e = LorebookEntrySchema.parse({
                id: `lb.${ctx.tick}.${op.ten
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .slice(0, 24)}`,
                ten: op.ten,
                keys: [...op.keys],
                noiDung: op.noiDung,
                lop: op.lop,
                order: op.order ?? 10_000,
                chuDe: [...op.chuDe],
                suKienChongLung: [...op.suKienChongLung],
                uocLuongToken: token,
                lichSu: [{ tick: ctx.tick, boiAi: ctx.boiAi, op: 'them', truoc: '', sau: op.ten, lyDo: '' }],
            });
            return { ok: true, loi: [], them: [e], sua: [], xoaId: [] };
        }
        case 'sua': {
            if (!chanQuyen(op.id))
                return { ...RONG, loi: l };
            const e = timEntry(op.id);
            const choPhep = new Set(['noiDung', 'ten', 'lop', 'order', 'doSau', 'xacSuat']);
            if (!choPhep.has(op.truong)) {
                l.push(loi('schema', 'TRUONG_KHONG_SUA_DUOC', `Không được sửa trường "${op.truong}" bằng op AI.`));
                return { ...RONG, loi: l };
            }
            const sau = {
                ...e,
                [op.truong]: op.truong === 'order' ? Number(op.noiDungMoi) : op.noiDungMoi,
            };
            return {
                ok: true,
                loi: [],
                them: [],
                sua: [
                    {
                        ...sau,
                        uocLuongToken: uocLuong(sau.noiDung, tyLeToken),
                        lichSu: [
                            ...e.lichSu.slice(-19),
                            {
                                tick: ctx.tick,
                                boiAi: ctx.boiAi,
                                op: 'sua',
                                truoc: String(e[op.truong] ?? ''),
                                sau: op.noiDungMoi,
                                lyDo: op.lyDo,
                            },
                        ],
                    },
                ],
                xoaId: [],
            };
        }
        case 'gop': {
            if (!op.ids.includes(op.giuId)) {
                l.push(loi('schema', 'GIU_ID_NGOAI_TAP', '`giuId` phải nằm trong `ids`.'));
                return { ...RONG, loi: l };
            }
            const nguon = new Set(op.ids.map((id) => nguonCua(id)));
            if (nguon.size !== 1) {
                l.push(loi('schema', 'GOP_KHAC_NGUON', 'Chỉ gộp được các entry cùng nguồn.'));
                return { ...RONG, loi: l };
            }
            for (const id of op.ids)
                if (!chanQuyen(id))
                    return { ...RONG, loi: l };
            const giu = timEntry(op.giuId);
            const khac = op.ids.filter((id) => id !== op.giuId).map((id) => timEntry(id));
            const keys = [...new Set([...giu.keys, ...khac.flatMap((k) => k.keys)])];
            return {
                ok: true,
                loi: [],
                them: [],
                sua: [
                    {
                        ...giu,
                        keys,
                        secondaryKeys: [...new Set([...giu.secondaryKeys, ...khac.flatMap((k) => k.secondaryKeys)])],
                        suKienChongLung: [
                            ...new Set([...giu.suKienChongLung, ...khac.flatMap((k) => k.suKienChongLung)]),
                        ],
                        lichSu: [
                            ...giu.lichSu.slice(-19),
                            {
                                tick: ctx.tick,
                                boiAi: ctx.boiAi,
                                op: 'gop',
                                truoc: op.ids.join('+'),
                                sau: op.giuId,
                                lyDo: '',
                            },
                        ],
                    },
                ],
                // Xóa MỀM các bản bị gộp — 52.3.
                xoaId: op.ids.filter((id) => id !== op.giuId),
            };
        }
        case 'tach': {
            if (!chanQuyen(op.id))
                return { ...RONG, loi: l };
            const e = timEntry(op.id);
            const tokenGoc = uocLuong(e.noiDung, tyLeToken);
            const tokenMoi = op.thanh.reduce((t, p) => t + uocLuong(p.noiDung, tyLeToken), 0);
            // [BB] 52.4 — "tổng token các phần ≈ token gốc (không được bịa thêm khi tách)".
            if (tokenMoi > tokenGoc * 1.2) {
                l.push(loi('schema', 'TACH_BIA_THEM', `Tổng token sau khi tách (${tokenMoi}) lớn hơn 120% bản gốc (${tokenGoc}). Tách không được bịa thêm.`));
                return { ...RONG, loi: l };
            }
            const phan = op.thanh.map((p, i) => LorebookEntrySchema.parse({
                id: `${e.id}.t${i}`,
                ten: p.ten,
                keys: [...p.keys],
                noiDung: p.noiDung,
                lop: e.lop,
                order: e.order + i,
                chuDe: [...e.chuDe],
                suKienChongLung: [...e.suKienChongLung],
                doTinCay: e.doTinCay,
                uocLuongToken: uocLuong(p.noiDung, tyLeToken),
                lichSu: [{ tick: ctx.tick, boiAi: ctx.boiAi, op: 'tach', truoc: e.id, sau: p.ten, lyDo: '' }],
            }));
            return { ok: true, loi: [], them: phan, sua: [], xoaId: [e.id] };
        }
        case 'che': {
            if (!chanQuyen(op.id))
                return { ...RONG, loi: l };
            const e = timEntry(op.id);
            const boi = timEntry(op.boiId);
            if (boi === undefined) {
                l.push(loi('schema', 'BOI_ID_KHONG_TON_TAI', `Entry che "${op.boiId}" không tồn tại.`));
                return { ...RONG, loi: l };
            }
            if (op.lyDo.trim() === '') {
                l.push(loi('schema', 'THIEU_LY_DO_CHE', 'Che phải có lý do; một entry biến mất không lời giải thích là bug.'));
                return { ...RONG, loi: l };
            }
            if (e.khoaCanon) {
                l.push(loi('schema', 'KHOA_CANON', `Entry "${e.ten}" đã khóa canon (51.4) và không bao giờ bị che.`, {
                    severity: 'warning',
                }));
                return { ...RONG, loi: l };
            }
            return {
                ok: true,
                loi: [],
                them: [],
                sua: [
                    {
                        ...e,
                        trangThai: 'bi_che',
                        biCheBoiId: op.boiId,
                        lyDoChe: op.lyDo,
                        tickChe: ctx.tick,
                        lichSu: [
                            ...e.lichSu.slice(-19),
                            {
                                tick: ctx.tick,
                                boiAi: ctx.boiAi,
                                op: 'che',
                                truoc: 'hoat_dong',
                                sau: 'bi_che',
                                lyDo: op.lyDo,
                            },
                        ],
                    },
                ],
                xoaId: [],
            };
        }
        case 'doi_key': {
            if (!chanQuyen(op.id))
                return { ...RONG, loi: l };
            const e = timEntry(op.id);
            if (op.keys.length === 0) {
                l.push(loi('schema', 'KEYS_RONG', 'Đổi key thành rỗng nghĩa là entry không bao giờ bắn nữa.'));
                return { ...RONG, loi: l };
            }
            return {
                ok: true,
                loi: [],
                them: [],
                sua: [
                    {
                        ...e,
                        keys: [...op.keys],
                        lichSu: [
                            ...e.lichSu.slice(-19),
                            {
                                tick: ctx.tick,
                                boiAi: ctx.boiAi,
                                op: 'doi_key',
                                truoc: e.keys.join(','),
                                sau: op.keys.join(','),
                                lyDo: '',
                            },
                        ],
                    },
                ],
                xoaId: [],
            };
        }
        case 'xoa': {
            if (!chanQuyen(op.id))
                return { ...RONG, loi: l };
            const e = timEntry(op.id);
            if (ctx.duocTroToi?.has(op.id) === true) {
                l.push(loi('schema', 'CON_ENTRY_TRO_TOI', `Còn entry khác đang bổ sung cho "${op.id}"; xóa sẽ làm đứt đồ thị.`));
                return { ...RONG, loi: l };
            }
            // [BB] 52.3 — xóa KHÔNG BAO GIỜ là xóa cứng.
            return {
                ok: true,
                loi: [],
                them: [],
                sua: [
                    {
                        ...e,
                        trangThai: 'da_xoa',
                        tickXoa: ctx.tick,
                        lyDoXoa: op.lyDo,
                        lichSu: [
                            ...e.lichSu.slice(-19),
                            {
                                tick: ctx.tick,
                                boiAi: ctx.boiAi,
                                op: 'xoa',
                                truoc: e.trangThai,
                                sau: 'da_xoa',
                                lyDo: op.lyDo,
                            },
                        ],
                    },
                ],
                xoaId: [],
            };
        }
    }
}
/**
 * Áp một lô op. [BB] 52.4 — op trượt thì **bỏ op đó**, giữ các op còn lại.
 *
 * Đây là cùng chính sách với patch ở 31.7, và vì cùng lý do: một model sai một
 * mục trong ba mươi mục là chuyện thường; hủy cả ba mươi là phản ứng thái quá.
 */
export function apLoOp(ops, ctx) {
    const them = [];
    const sua = [];
    const xoaMemId = [];
    const boQua = [];
    // Bản làm việc để op sau nhìn thấy kết quả op trước.
    const banLamViec = new Map(ctx.entries);
    const nguon = new Map(ctx.nguonCua);
    ops.forEach((op, i) => {
        const kq = apMotOp(op, { ...ctx, entries: banLamViec, nguonCua: nguon });
        if (!kq.ok) {
            boQua.push({ viTri: i, op: op.op, loi: kq.loi });
            return;
        }
        for (const e of kq.them) {
            banLamViec.set(e.id, e);
            nguon.set(e.id, ctx.nguonDich);
            them.push(e);
        }
        for (const e of kq.sua) {
            banLamViec.set(e.id, e);
            sua.push(e);
        }
        for (const id of kq.xoaId) {
            const e = banLamViec.get(id);
            if (e === undefined)
                continue;
            const daXoa = { ...e, trangThai: 'da_xoa', tickXoa: ctx.tick, lyDoXoa: 'gộp/tách' };
            banLamViec.set(id, daXoa);
            sua.push(daXoa);
            xoaMemId.push(id);
        }
    });
    return { them, sua, xoaMemId, boQua };
}
/** Thùng rác giữ ba kỷ nguyên — 52.3. Chỉ người chơi mới xóa cứng được. */
export function conTrongThungRac(entry, tickHienTai, tickMoiKyNguyen) {
    if (entry.trangThai !== 'da_xoa' || entry.tickXoa === null)
        return false;
    return tickHienTai - entry.tickXoa < tickMoiKyNguyen * 3;
}
