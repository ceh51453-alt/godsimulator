import { loi } from '../contracts/errors.js';
import { quyetDinhChay, trangThaiLichMoi } from './lich.js';
/**
 * Chạy toàn bộ đường ống: giai đoạn tăng dần, trong mỗi giai đoạn chạy song song.
 *
 * [BB] 50.3 — "Output giai đoạn trước có mặt trong ngữ cảnh của giai đoạn sau."
 * Vì vậy `nguCanhTruoc` được nối dồn và truyền xuống, và một tác vụ giai đoạn 2
 * không bao giờ chạy trước khi giai đoạn 1 xong.
 */
export async function chayDuongOng(nc) {
    const theoGiaiDoan = new Map();
    for (const t of nc.preset.tasks) {
        const ds = theoGiaiDoan.get(t.giaiDoan) ?? [];
        ds.push(t);
        theoGiaiDoan.set(t.giaiDoan, ds);
    }
    const giaiDoanSap = [...theoGiaiDoan.keys()].sort((a, b) => a - b);
    const ra = [];
    let nguCanhTruoc = '';
    for (const gd of giaiDoanSap) {
        const ds = (theoGiaiDoan.get(gd) ?? []).sort((a, b) => (a.id < b.id ? -1 : 1));
        // Song song trong cùng giai đoạn.
        const kq = await Promise.all(ds.map((t) => chayMotTacVu(t, nc, nguCanhTruoc)));
        ra.push({ giaiDoan: gd, ketQua: kq });
        const them = kq
            .filter((k) => k.chay && k.output.trim() !== '')
            .map((k) => `[${k.taskId}]\n${k.output}`)
            .join('\n\n');
        if (them !== '')
            nguCanhTruoc = nguCanhTruoc === '' ? them : `${nguCanhTruoc}\n\n${them}`;
    }
    return ra;
}
/** Chạy một tác vụ, gồm cả họ bản sao và chuỗi dự phòng. */
export async function chayMotTacVu(task, nc, nguCanhTruoc) {
    const tt = nc.trangThaiLich.get(task.id) ?? trangThaiLichMoi();
    const qd = quyetDinhChay(task, tt, nc.lich, nc.tuning.workflow.nguongParseLoiLienTiep);
    if (!qd.chay) {
        return {
            taskId: task.id,
            chay: false,
            lyDoKhongChay: qd.lyDo,
            output: '',
            soCall: 0,
            soThuLai: 0,
            thatBai: [],
            bacDuPhong: 0,
            trangThaiLich: qd.trangThaiSau,
            canhBao: [],
        };
    }
    const canhBao = [];
    const muc = task.hoBanSao.bat
        ? [...nc.lietKe(task.hoBanSao.nguonLietKe, task.hoBanSao.gioiHan)]
        : [null];
    if (task.hoBanSao.bat) {
        const mongDoi = nc.lietKe(task.hoBanSao.nguonLietKe, task.hoBanSao.gioiHan).length;
        // Chẩn đoán 34 — số call thực tế lệch quá ngưỡng so với số mục liệt kê.
        const lech = mongDoi === 0 ? 0 : Math.abs(muc.length - mongDoi) / mongDoi;
        if (lech > nc.tuning.workflow.nguongLechHoBanSao) {
            canhBao.push(loi('ai', 'HO_BAN_SAO_LECH', `Số call (${muc.length}) lệch ${Math.round(lech * 100)}% so với số mục liệt kê (${mongDoi}).`, {
                severity: 'warning',
                path: task.id,
            }));
        }
    }
    const chuoiPreset = [task.apiPresetName, ...task.apiPresetDuPhong];
    const ketQua = [];
    const thatBai = [];
    let soCall = 0;
    let soThuLai = 0;
    let bacDuPhongDaDung = 0;
    // Chạy theo LÔ, mỗi lô `soLuongSongSong` cái.
    for (let i = 0; i < muc.length * qd.soLan; i += task.soLuongSongSong) {
        const lo = [];
        for (let j = i; j < Math.min(i + task.soLuongSongSong, muc.length * qd.soLan); j++) {
            lo.push(muc[j % muc.length] ?? null);
        }
        const kq = await Promise.all(lo.map(async (mucId) => {
            const messages = nc.dungPrompt(task, mucId, nguCanhTruoc);
            if (nc.chayThu === true) {
                // [BB] 50.11 — "Chạy thử tác vụ này" hiện prompt cuối cùng và output thô,
                // KHÔNG áp patch. Nên nó cũng không gọi model.
                return { mucId, text: messages.map((m) => `<${m.role}>\n${m.content}`).join('\n\n'), loi: null };
            }
            return goiCoThuLai(task, nc, messages, mucId, chuoiPreset);
        }));
        for (const k of kq) {
            soCall += k.soCall ?? 1;
            soThuLai += k.soThuLai ?? 0;
            bacDuPhongDaDung = Math.max(bacDuPhongDaDung, k.bac ?? 0);
            if (k.loi !== null && k.loi !== undefined) {
                // Một cái hỏng KHÔNG kéo sập những cái còn lại.
                thatBai.push({ mucId: k.mucId, maLoi: k.loi.maLoi, thongDiep: k.loi.thongDiep });
                continue;
            }
            if (typeof k.text === 'string' && k.text !== '')
                ketQua.push(k.text);
        }
    }
    // Chẩn đoán 32 — preset chính lỗi quá ngưỡng.
    if (soCall > 0 && thatBai.length / soCall > nc.tuning.workflow.nguongLoiPresetChinh) {
        canhBao.push(loi('ai', 'PRESET_CHINH_HONG_NHIEU', `Preset chính lỗi ${thatBai.length}/${soCall} call của tác vụ "${task.ten}".`, {
            severity: 'warning',
            path: task.id,
        }));
    }
    return {
        taskId: task.id,
        chay: true,
        lyDoKhongChay: '',
        output: gop(ketQua, task.cachGop),
        soCall,
        soThuLai,
        thatBai,
        bacDuPhong: bacDuPhongDaDung,
        trangThaiLich: qd.trangThaiSau,
        canhBao,
    };
}
/**
 * Gọi model với thử lại và chuỗi dự phòng — 50.3 [BB].
 *
 * "Chuỗi dự phòng `apiPresetDuPhong` chạy khi preset chính lỗi hoặc quá tải."
 * Output ngắn hơn `doDaiToiThieu` **được coi là trượt** và thử lại — một model
 * trả về hai chữ là một model đã hỏng, dù HTTP nói 200.
 */
async function goiCoThuLai(task, nc, messages, mucId, chuoiPreset) {
    let soCall = 0;
    let soThuLai = 0;
    let loiCuoi = { maLoi: 'KHONG_RO', thongDiep: 'chưa gọi lần nào' };
    for (let bac = 0; bac < chuoiPreset.length; bac++) {
        for (let lan = 0; lan <= task.soLanThuLai; lan++) {
            soCall++;
            if (lan > 0)
                soThuLai++;
            const r = await nc.goi({
                taskId: task.id,
                apiPreset: chuoiPreset[bac] ?? '',
                messages,
                mucId,
                lanThu: lan,
            });
            if (!r.ok) {
                loiCuoi = { maLoi: r.maLoi, thongDiep: r.thongDiep };
                continue;
            }
            if (r.text.length < task.doDaiToiThieu) {
                loiCuoi = {
                    maLoi: 'QUA_NGAN',
                    thongDiep: `Output ${r.text.length} ký tự, dưới doDaiToiThieu = ${task.doDaiToiThieu}.`,
                };
                continue;
            }
            return { mucId, text: r.text, loi: null, soCall, soThuLai, bac };
        }
    }
    return { mucId, loi: loiCuoi, soCall, soThuLai, bac: chuoiPreset.length - 1 };
}
/** Gộp kết quả theo `cachGop` — 50.2. */
export function gop(ds, cach) {
    if (ds.length === 0)
        return '';
    if (cach === 'ghi_de')
        return ds[ds.length - 1];
    if (cach === 'noi')
        return ds.join('\n\n');
    // `gop_json`: gộp nông các object; mảng thì nối.
    const ra = {};
    for (const s of ds) {
        try {
            const o = JSON.parse(s);
            if (o === null || typeof o !== 'object' || Array.isArray(o))
                continue;
            for (const [k, v] of Object.entries(o)) {
                const cu = ra[k];
                ra[k] = Array.isArray(cu) && Array.isArray(v) ? [...cu, ...v] : v;
            }
        }
        catch {
            // Mảnh không phải JSON thì bỏ qua — cùng chính sách với 31.7.
        }
    }
    return JSON.stringify(ra);
}
