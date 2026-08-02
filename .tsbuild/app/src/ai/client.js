import { PROMPT_THU_DUONG, thuDuongDatKhong } from '../core/ai/bienSoan.js';
import { dacTaGoi, dacTaQuetModel, rutDanhSachModel, rutVanBan, rutSoDung } from './phuongNgu.js';
const HAN_CHO_MAC_DINH = 90_000;
function layFetch(t) {
    const f = t.fetchImpl ?? (typeof fetch === 'function' ? fetch : undefined);
    if (!f)
        throw new Error('Môi trường không có fetch.');
    return f;
}
/**
 * Đọc thông điệp lỗi mà proxy trả về.
 *
 * Rất nhiều proxy trả 200 kèm `{"error": ...}`, và rất nhiều proxy trả HTML khi
 * đường dẫn sai. In `[object Object]` cho người chơi ở đây là bỏ rơi họ đúng lúc
 * họ cần biết mình dán sai cái gì.
 */
function docLoi(json, tho) {
    const o = json;
    const e = o?.['error'];
    if (typeof e === 'string')
        return e;
    if (e && typeof e === 'object') {
        const m = e['message'];
        if (typeof m === 'string' && m.trim() !== '')
            return m;
    }
    const m = o?.['message'];
    if (typeof m === 'string' && m.trim() !== '')
        return m;
    const cat = tho.trim().slice(0, 200);
    if (/^\s*</.test(cat))
        return 'Máy chủ trả về HTML thay vì JSON — nhiều khả năng địa chỉ proxy sai.';
    return cat === '' ? 'Máy chủ không nói gì.' : cat;
}
async function goiThoi(ep, heThong, nguoiDung, t, moiTraLoi = '') {
    const dt = dacTaGoi(ep.dialect, ep.proxyUrl, ep.proxyPassword, {
        heThong,
        nguoiDung,
        modelId: ep.modelId,
        params: ep.params,
        moiTraLoi,
    });
    const dieuKhien = new AbortController();
    const hen = setTimeout(() => dieuKhien.abort(), t.hanCho ?? HAN_CHO_MAC_DINH);
    if (t.signal)
        t.signal.addEventListener('abort', () => dieuKhien.abort(), { once: true });
    try {
        const res = await layFetch(t)(dt.url, {
            method: 'POST',
            headers: dt.header,
            body: JSON.stringify(dt.body),
            signal: dieuKhien.signal,
        });
        const tho = await res.text();
        let json = null;
        try {
            json = JSON.parse(tho);
        }
        catch {
            json = null;
        }
        if (!res.ok) {
            return { ok: false, ma: `HTTP_${res.status}`, thongDiep: docLoi(json, tho) };
        }
        const vanBan = rutVanBan(ep.dialect, json);
        if (vanBan.trim() === '') {
            return {
                ok: false,
                ma: 'IM_LANG',
                thongDiep: json === null
                    ? 'Trả lời không phải JSON đọc được.'
                    : `Model trả lời rỗng. ${docLoi(json, tho)}`.trim(),
            };
        }
        const dung = rutSoDung(ep.dialect, json);
        return {
            ok: true,
            vanBan,
            soKyTu: vanBan.length,
            promptTokens: dung.promptTokens,
            finishReason: dung.finishReason,
        };
    }
    catch (e) {
        const err = e;
        if (err?.name === 'AbortError') {
            return { ok: false, ma: 'QUA_HAN', thongDiep: 'Model không trả lời kịp.' };
        }
        return {
            ok: false,
            ma: 'MANG_HONG',
            thongDiep: err?.message ?? 'Không gọi được tới proxy. Kiểm tra địa chỉ và kết nối.',
        };
    }
    finally {
        clearTimeout(hen);
    }
}
/** Gọi Tường Thuật cho một lượt kể. */
export function goiKe(ep, prompt, t = {}) {
    return goiThoi(ep, prompt.heThong, prompt.nguoiDung, t, prompt.moiTraLoi ?? '');
}
/**
 * Gọi Cập Nhật Biến — điểm cuối riêng của 46.1.
 *
 * Nhận hai chuỗi thay vì `PromptGoi` vì Updater không có sáu tầng: nó không kể
 * chuyện, nên nó không có ngân sách tầng để chia (33.1 chỉ nói về prompt kể).
 */
export function goiCapNhat(ep, prompt, t = {}) {
    return goiThoi(ep, prompt.heThong, prompt.nguoiDung, t);
}
/**
 * Gọi một tác vụ Diễn Hóa — 50.2.
 *
 * Khác hai hàm trên ở chỗ nó nhận **một mảng message có vai trò**, không nhận
 * cặp hệ-thống/người-dùng. [BB] 50.2: *"`nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ,
 * không phải một chuỗi lớn — người dùng cần bật tắt từng nhóm để gỡ lỗi."* Gộp
 * chúng lại thành hai chuỗi ở đây sẽ vứt đi đúng thứ làm workflow gỡ được.
 *
 * Bốn phương ngữ hiện chỉ nhận hai vai qua `dacTaGoi`, nên các nhóm cùng vai
 * được nối lại theo đúng thứ tự khai báo — và thứ tự ấy là thứ tự người dùng sắp
 * trong Xưởng Workflow, không phải thứ tự chữ cái.
 */
export function goiTacVuWorkflow(ep, messages, t = {}) {
    const noi = (vai) => messages
        .filter((m) => m.role === vai)
        .map((m) => m.content)
        .filter((c) => c.trim() !== '')
        .join('\n\n');
    const heThong = noi('system');
    // Vai `assistant` là mồi trả lời; phương ngữ nào không nhận prefill thì
    // `dacTaGoi` tự bỏ nó kèm issue — không phải việc của chỗ này.
    return goiThoi(ep, heThong, noi('user'), t, noi('assistant'));
}
/**
 * Thử đường — Phần 31.5.
 *
 * Không chỉ hỏi "có sống không": bắt model trả về đúng một từ. Một endpoint trả
 * 200 kèm trang đăng nhập cũng "sống", và người chơi sẽ tin là đã nối xong cho
 * tới khi vào game và thấy AI kể chuyện đăng nhập.
 */
export async function thuDuong(ep, t = {}) {
    const r = await goiThoi(ep, PROMPT_THU_DUONG.heThong, PROMPT_THU_DUONG.nguoiDung, {
        ...t,
        hanCho: t.hanCho ?? 30_000,
    });
    if (!r.ok) {
        return {
            thong: false,
            maLoi: r.ma,
            thongDiep: r.thongDiep,
            modelDaTraLoi: '',
            soKyTuTraVe: 0,
            xuatCoCauTruc: false,
        };
    }
    const dat = thuDuongDatKhong(r.vanBan);
    return {
        thong: dat,
        maLoi: dat ? '' : 'KHONG_NGHE_LENH',
        thongDiep: dat
            ? ''
            : `Model có trả lời nhưng không làm theo lệnh đơn giản nhất (nó nói: "${r.vanBan.slice(0, 80)}"). ` +
                'Nó vẫn kể chuyện được, nhưng patch trạng thái sẽ hay trượt.',
        modelDaTraLoi: ep.modelId,
        soKyTuTraVe: r.soKyTu,
        xuatCoCauTruc: dat,
    };
}
/** Quét danh sách model mà proxy khai — nút "Quét danh sách" ở màn Cổng AI. */
export async function quetModel(ep, t = {}) {
    const dt = dacTaQuetModel(ep.dialect, ep.proxyUrl, ep.proxyPassword);
    const dieuKhien = new AbortController();
    const hen = setTimeout(() => dieuKhien.abort(), t.hanCho ?? 30_000);
    try {
        const res = await layFetch(t)(dt.url, { method: 'GET', headers: dt.header, signal: dieuKhien.signal });
        const tho = await res.text();
        let json = null;
        try {
            json = JSON.parse(tho);
        }
        catch {
            json = null;
        }
        if (!res.ok)
            return { ok: false, ma: `HTTP_${res.status}`, thongDiep: docLoi(json, tho) };
        const ds = rutDanhSachModel(ep.dialect, json);
        if (ds.length === 0) {
            return {
                ok: false,
                ma: 'DANH_SACH_RONG',
                thongDiep: 'Proxy không khai model nào. Bạn vẫn gõ tay tên model được.',
            };
        }
        return { ok: true, models: ds.map((m) => ({ ...m })) };
    }
    catch (e) {
        const err = e;
        if (err?.name === 'AbortError')
            return { ok: false, ma: 'QUA_HAN', thongDiep: 'Quét quá lâu.' };
        return { ok: false, ma: 'MANG_HONG', thongDiep: err?.message ?? 'Không gọi được tới proxy.' };
    }
    finally {
        clearTimeout(hen);
    }
}
