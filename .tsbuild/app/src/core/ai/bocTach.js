/**
 * Bóc tách phản hồi model — Phần 61.3, 71.5 [BB]; cổng Phase 8 "patch sai bị từ chối".
 *
 * ── Ranh giới ──
 *
 * Model được phép viết văn tùy ý. Model KHÔNG được phép đổi thế giới tùy ý.
 * Mọi thứ nó đề nghị đi qua ba lớp trước khi thành `PatchOp`:
 *
 *   1. cú pháp   — khối `<CapNhat>` phải là JSON hợp lệ
 *   2. hình dạng — từng phần tử phải qua `PatchOpSchema`
 *   3. thẩm quyền — bảng và đường dẫn phải nằm trong bảng trắng dưới đây
 *
 * Lớp 3 là lớp quan trọng nhất và là lớp dễ quên nhất. Một patch đúng schema
 * hoàn hảo mà ghi vào `worlds.playerState.mode` sẽ **đá người chơi sang tầng
 * khác giữa câu văn**. Một patch ghi `aspects.ban_nga.coreSelf` sẽ sửa tính cách
 * nhân vật mà không có Event nào giải thích — đúng thứ 69.1 tồn tại để cấm.
 *
 * Vì vậy: mặc định là TỪ CHỐI. Chỉ đường dẫn được kể tên mới lọt.
 */
import { PatchOpSchema } from '../contracts/core.js';
import { EVENT_DUOC_SUA_CORESELF } from '../schema/aspect/thanVi.js';
import { chuanHoaBanGhiMoi } from './chuanHoaBanGhi.js';
import { bieuThucKhoi, bieuThucCatKhoi, docKhoiCapNhat } from './mvu.js';
import { catSuyLuanNoiBo } from './suyLuan.js';
/**
 * Hợp nhất lời khai của Narrator với Updater riêng.
 *
 * Updater thắng khi cả hai chạm đúng một đích, nhưng không được làm biến mất
 * một thực thể Narrator đã tạo chỉ vì nó trả khối rỗng. Đây là hành vi gần với
 * vòng MVU: mỗi nguồn đề nghị delta, engine gom rồi mới transaction.
 */
export function hopNhatCapNhat(goc, updater) {
    if (!updater.coKhoiCapNhat)
        return goc;
    const patches = new Map();
    for (const p of [...goc.patches, ...updater.patches]) {
        patches.set(`${p.target.table}\u0000${p.target.id}\u0000${p.target.path}`, p);
    }
    const phucBut = new Map();
    for (const f of [...goc.phucBut, ...updater.phucBut])
        phucBut.set(`${f.loai}\u0000${f.noiDung}`, f);
    const bienPack = new Map();
    for (const b of [...goc.bienPack, ...updater.bienPack])
        bienPack.set(`${b.phep}\u0000${b.duong}`, b);
    return Object.freeze({
        loiKe: goc.loiKe,
        patches: Object.freeze([...patches.values()]),
        biTuChoi: Object.freeze([...goc.biTuChoi, ...updater.biTuChoi]),
        coKhoiCapNhat: goc.coKhoiCapNhat || updater.coKhoiCapNhat,
        phucBut: Object.freeze([...phucBut.values()]),
        chuaChungThuc: Object.freeze([...new Set([...goc.chuaChungThuc, ...updater.chuaChungThuc])]),
        bienPack: Object.freeze([...bienPack.values()]),
    });
}
/**
 * Bảng trắng: bảng nào model được chạm.
 *
 * `worlds` vắng mặt có chủ ý — tầng chơi, chủ thể và `setupCompleted` là chuyện
 * của người chơi, không của người kể chuyện.
 */
const BANG_CHO_PHEP = new Set(['entities', 'links', 'gaps', 'prayers']);
/**
 * Đường dẫn model KHÔNG được chạm, dù ở bảng cho phép.
 *
 * Khớp theo tiền tố sau khi chuẩn hóa, nên chặn được cả `...coreSelf.tuBi_tanNhan`
 * lẫn `...coreSelf`.
 */
const DUONG_DAN_CAM = Object.freeze([
    {
        mau: 'aspects.ban_nga.coreSelf',
        vi: `Lõi bản ngã chỉ đổi qua Event thuộc ${EVENT_DUOC_SUA_CORESELF.join(', ')} — 69.1.`,
    },
    { mau: 'aspects.ban_nga.lichSuLoi', vi: 'Lịch sử đổi lõi là bằng chứng, không phải chỗ ghi thêm.' },
    { mau: 'aspects.domain.domains', vi: 'Sức domain do quy kết của engine quyết, không do lời kể — 78.7.' },
    { mau: 'goc', vi: 'Gốc bế tắc của lời cầu do utility AI sinh, không được viết lại — 22.2.' },
    { mau: 'version', vi: 'Số phiên bản bản ghi là của transaction.' },
    { mau: 'branchId', vi: 'Nhánh không đổi bằng lời kể.' },
    { mau: 'id', vi: 'Định danh không đổi bằng lời kể.' },
    { mau: 'tickSinh', vi: 'Thời điểm sinh là lịch sử.' },
    { mau: 'aspects.lawful.vanBan', vi: 'Văn bản luật gốc chỉ đổi qua kết tinh luật — 43.1.' },
]);
/** Nhiều hơn ngần này trong một lượt là model đang tự viết lại thế giới. */
const TRAN_PATCH_MOT_LUOT = 12;
const KHOI = bieuThucKhoi();
const KHOI_PHUC_BUT = /<Foreshadow>([\s\S]*?)<\/Foreshadow>/i;
const KHOI_CHUA_CHUNG = /<Unverified>([\s\S]*?)<\/Unverified>/i;
/**
 * Cắt MỌI khối dữ liệu khỏi văn xuôi.
 *
 * Ba khối, và cả ba đều phải cắt cả dạng chưa đóng thẻ: model bị cắt cụt giữa
 * khối sẽ để lại một thẻ mở, và một thẻ mở lọt lên khung kể trông đúng như một
 * lỗi hiển thị — trong khi nó là bằng chứng `finish_reason = 'length'` mà 34.3
 * đang muốn ta nhìn thấy ở chỗ khác.
 */
function catKhoi(raw) {
    return catSuyLuanNoiBo(raw
        .replace(bieuThucCatKhoi(), '')
        .replace(/<Foreshadow>[\s\S]*?<\/Foreshadow>/gi, '')
        .replace(/<Unverified>[\s\S]*?<\/Unverified>/gi, '')
        .replace(/<(?:CapNhat|UpdateVariable|Foreshadow|Unverified)>[\s\S]*$/i, '')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim());
}
function thanKhoi(raw, re) {
    const k = re.exec(raw);
    if (!k || k[1] === undefined)
        return null;
    return k[1]
        .trim()
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/```$/i, '')
        .trim();
}
/** Bóc `<Foreshadow>`. Hỏng cú pháp là chuyện thường — trả rỗng, không throw. */
function bocPhucBut(raw) {
    const than = thanKhoi(raw, KHOI_PHUC_BUT);
    if (than === null)
        return [];
    try {
        const doc = JSON.parse(than);
        if (!Array.isArray(doc.muc))
            return [];
        const ra = [];
        for (const m of doc.muc.slice(0, TRAN_PHUC_BUT_MOT_LUOT)) {
            const o = m;
            if (typeof o.noiDung !== 'string' || o.noiDung.trim() === '')
                continue;
            ra.push({
                noiDung: o.noiDung.trim().slice(0, 300),
                loai: typeof o.loai === 'string' ? o.loai : 'dieu_bao',
            });
        }
        return Object.freeze(ra);
    }
    catch {
        return [];
    }
}
/** Bóc `<Unverified>`. Cùng lẽ: hỏng thì coi như model không khai gì. */
function bocChuaChungThuc(raw) {
    const than = thanKhoi(raw, KHOI_CHUA_CHUNG);
    if (than === null)
        return [];
    try {
        const doc = JSON.parse(than);
        if (!Array.isArray(doc.muc))
            return [];
        return Object.freeze(doc.muc
            .filter((x) => typeof x === 'string' && x.trim() !== '')
            .slice(0, TRAN_PHUC_BUT_MOT_LUOT)
            .map((x) => x.trim().slice(0, 300)));
    }
    catch {
        return [];
    }
}
/** Nhiều hơn ngần này là model đang rải lời hứa thay vì kể chuyện. */
const TRAN_PHUC_BUT_MOT_LUOT = 6;
function duongDanCam(path) {
    const p = path.trim();
    if (p === '')
        return null;
    for (const { mau, vi } of DUONG_DAN_CAM) {
        if (p === mau || p.startsWith(`${mau}.`) || p.endsWith(`.${mau}`))
            return vi;
    }
    return null;
}
/**
 * Bóc một phản hồi thô thành lời kể + patch đã được duyệt.
 *
 * Hàm này KHÔNG throw. Model hỏng là chuyện thường ngày, không phải sự cố lập
 * trình; mọi thứ hỏng đi vào `biTuChoi` để bảng Tự Chẩn Đoán đếm được.
 */
export function bocTach(raw, nc) {
    const loiKe = catKhoi(raw);
    const phucBut = bocPhucBut(raw);
    const chuaChungThuc = bocChuaChungThuc(raw);
    const khop = KHOI.exec(raw);
    if (!khop || khop[1] === undefined) {
        return Object.freeze({
            loiKe,
            patches: Object.freeze([]),
            biTuChoi: Object.freeze([]),
            coKhoiCapNhat: false,
            phucBut,
            chuaChungThuc,
            bienPack: Object.freeze([]),
        });
    }
    const than = khop[1]
        .trim()
        .replace(/^```[a-z]*\n?/i, '')
        .replace(/```$/i, '')
        .trim();
    const biTuChoi = [];
    /*
     * Ba dạng khối, một đường ra — xem `mvu.ts`.
     *
     * `docKhoiCapNhat()` chỉ CHUẨN HÓA cú pháp. Nó không cấp thẩm quyền cho ai:
     * mọi ứng viên nó trả về vẫn phải đi hết ba lớp bên dưới, và thứ không trỏ
     * tới thực thể có thật thì thành biến pack chứ không thành patch.
     */
    const kqDoc = docKhoiCapNhat(than, nc.idHopLe);
    if (kqDoc === null) {
        return Object.freeze({
            loiKe,
            patches: Object.freeze([]),
            biTuChoi: Object.freeze([
                {
                    ma: 'JSON_HONG',
                    thongDiep: 'Khối cập nhật không phải JSON hợp lệ và cũng không có câu lệnh nào đọc được.',
                    nguyenVan: than.slice(0, 400),
                },
            ]),
            coKhoiCapNhat: true,
            phucBut,
            chuaChungThuc,
            bienPack: Object.freeze([]),
        });
    }
    const tho = kqDoc.tho;
    for (const b of kqDoc.boQua) {
        biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: b.vi, nguyenVan: b.nguyenVan });
    }
    const ra = [];
    for (const [i, item] of tho.entries()) {
        const nguyenVan = JSON.stringify(item).slice(0, 300);
        if (ra.length >= TRAN_PATCH_MOT_LUOT) {
            biTuChoi.push({
                ma: 'QUA_NHIEU',
                thongDiep: `Một lượt kể chỉ được đổi tối đa ${TRAN_PATCH_MOT_LUOT} chỗ; phần từ #${i + 1} trở đi bị bỏ.`,
                nguyenVan,
            });
            break;
        }
        // Lớp 2 — hình dạng. `sourceEventId` do ta gán, không nhận từ model:
        // để model tự khai nguồn là mở cửa cho nó gắn thay đổi vào Event của người khác.
        const ung = { ...item, sourceEventId: nc.eventId };
        delete ung.expectedVersion;
        const kq = PatchOpSchema.safeParse(ung);
        if (!kq.success) {
            biTuChoi.push({
                ma: 'SAI_SCHEMA',
                thongDiep: kq.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
                nguyenVan,
            });
            continue;
        }
        const p = kq.data;
        // Lớp 3 — thẩm quyền.
        if (!BANG_CHO_PHEP.has(p.target.table)) {
            biTuChoi.push({
                ma: 'BANG_CAM',
                thongDiep: `Lời kể không được ghi vào bảng "${p.target.table}".`,
                nguyenVan,
            });
            continue;
        }
        const vi = duongDanCam(p.target.path);
        if (vi !== null) {
            biTuChoi.push({ ma: 'DUONG_DAN_CAM', thongDiep: vi, nguyenVan });
            continue;
        }
        // Tạo bản ghi mới thì id chưa tồn tại là đúng; sửa bản ghi thì id phải có thật.
        if (p.op !== 'link' && !nc.idHopLe.has(p.target.id)) {
            biTuChoi.push({
                ma: 'ENTITY_LA',
                thongDiep: `"${p.target.id}" không có trong thế giới người chơi đang thấy.`,
                nguyenVan,
            });
            continue;
        }
        /*
         * Lớp 2b — CHUẨN HÓA bản ghi mới. Xem `chuanHoaBanGhi.ts`.
         *
         * `PatchOpSchema` khai `value` là `unknown`, nên tới đây một bản ghi mới vẫn
         * chưa được ai kiểm. Bỏ bước này thì `"mortal": {"tuoiTho": 60}` — một câu
         * hoàn toàn hợp lý với người đọc — đi thẳng vào `WorldState` với `thanThe`
         * là `undefined`, và bất biến tầng Phàm Nhân nổ `TypeError` ở lượt sau.
         *
         * Model **làm treo được engine** cho tới khi bước này có mặt.
         */
        if (p.op === 'link') {
            const ch = chuanHoaBanGhiMoi(p.target.table, p.value, nc.branchId ?? '', p.target.id);
            if (!ch.ok) {
                biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: ch.vi, nguyenVan });
                continue;
            }
            for (const c of ch.canhBao) {
                biTuChoi.push({ ma: 'SAI_SCHEMA', thongDiep: c, nguyenVan });
            }
            ra.push({ ...p, value: ch.value });
            continue;
        }
        ra.push(p);
    }
    return Object.freeze({
        loiKe,
        patches: Object.freeze(ra),
        biTuChoi: Object.freeze(biTuChoi),
        coKhoiCapNhat: true,
        phucBut,
        chuaChungThuc,
        bienPack: Object.freeze([...kqDoc.bienPack]),
    });
}
/** Tỉ lệ patch trượt — mục 27 bảng Tự Chẩn Đoán (46.2), hỏng khi > 15%. */
export function tyLeTruot(kq) {
    const tong = kq.patches.length + kq.biTuChoi.length;
    return tong === 0 ? 0 : kq.biTuChoi.length / tong;
}
