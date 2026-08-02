/**
 * Bất biến tầng Phàm Nhân — cổng Phase 7, mục 73.3.
 *
 * Bốn dòng của cổng, và chỗ cưỡng chế tương ứng:
 *
 * | Cổng Phase 7 | Ở đây |
 * |---|---|
 * | Materialize T0 không bịa nguồn lực | `thua_ke_khong_nhan_doi`, `kho_ho_khong_am` |
 * | Chết không Game Over; kế thừa giữ claim đúng | `thua_ke_khong_nhan_doi` |
 * | NPC ngoài cảnh giữ lịch và vị trí | (đo bằng test — lịch là hàm thuần, không có state để hỏng) |
 * | Một đời bình thường vẫn để lại di sản | (đo bằng test) |
 *
 * Cộng ba bất biến mà 70.2 và 70.5 đòi.
 */
import { dangKyInvariant, dangKyBoNapInvariant } from '../engine/invariant.js';
function doc(e, ten) {
    const a = e?.aspects[ten];
    return a === undefined || a === null || typeof a !== 'object' ? undefined : a;
}
function laToanBo(p) {
    return p === 'tat_ca';
}
function idCanKiem(s, phamVi) {
    const ids = laToanBo(phamVi) ? [...s.entities.keys()] : [...phamVi.entities];
    return ids.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
let daNap = false;
export function napBatBienTangPham() {
    if (daNap)
        return;
    daNap = true;
    dangKyBoNapInvariant(dangKyTatCa);
}
function dangKyTatCa() {
    /**
     * Thân thể phải nói được sự thật về chính nó.
     *
     * Cụ thể: `dau` phải suy được từ những vết còn mở. Một bộ đếm đau trôi tự do
     * là cách êm ái nhất để "sức khỏe không phải thanh máu" quay lại thành thanh máu.
     */
    dangKyInvariant({
        id: 'than_the_hop_le',
        ten: 'Thân thể phải khớp với thương tích đang mang',
        mucDo: 'warning',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const m = doc(s.entities.get(id), 'mortal');
                if (!m)
                    continue;
                const conMo = m.thanThe.thuongTich.filter((t) => t.trangThai !== 'da_lanh');
                const dauNen = Math.min(100, Math.round(conMo.reduce((t, x) => t + x.nang * 45, 0)));
                if (Math.abs(m.thanThe.dau - dauNen) > 12) {
                    xau.push(`'${id}': đau = ${m.thanThe.dau} nhưng thương tích đang mang chỉ giải thích được ${dauNen}`);
                }
                // Vết đã lành mà vẫn còn `nang` là dấu của một đường ghi chạm một nửa.
                for (const t of m.thanThe.thuongTich) {
                    if (t.trangThai === 'da_lanh' && t.nang > 0.05) {
                        xau.push(`'${id}': vết '${t.id}' khai đã lành nhưng còn nặng ${t.nang}`);
                    }
                }
            }
            return xau;
        },
    });
    /**
     * [BB] 20.3 — thừa kế giữ claim ĐÚNG, không nhân đôi.
     *
     * Tổng `share` trên cùng một `targetId` không được vượt 1 quá xa. Chia một cái
     * nhà cho ba người con phải ra ba phần ba, không ra ba cái nhà. Đây là bảo toàn
     * vật chất (71.4) áp vào quyền sở hữu.
     */
    dangKyInvariant({
        id: 'thua_ke_khong_nhan_doi',
        ten: 'Tổng phần sở hữu trên một vật không vượt quá một',
        mucDo: 'fatal',
        canToanCuc: true,
        kiem: (s) => {
            const tong = new Map();
            for (const e of s.entities.values()) {
                if (e.tickDiet !== null)
                    continue;
                const m = doc(e, 'mortal');
                for (const c of m?.soHuu ?? []) {
                    if (c.status === 'lost')
                        continue;
                    tong.set(c.targetId, (tong.get(c.targetId) ?? 0) + c.share);
                }
            }
            const xau = [];
            for (const [target, t] of [...tong.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
                // Ngưỡng 1.001 cho sai số làm tròn khi chia ba.
                if (t > 1.001)
                    xau.push(`'${target}': tổng phần sở hữu = ${Math.round(t * 1000) / 1000}`);
            }
            return xau;
        },
    });
    /** Kho hộ không âm — cùng lẽ với `kho_khong_am` của Phase 5. */
    dangKyInvariant({
        id: 'kho_ho_khong_am',
        ten: 'Kho của hộ không bao giờ âm',
        mucDo: 'fatal',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const h = doc(s.entities.get(id), 'ho');
                if (!h)
                    continue;
                if (h.kho.luongThuc < -0.001)
                    xau.push(`'${id}': lương thực = ${h.kho.luongThuc}`);
                if (h.kho.vatLieu < -0.001)
                    xau.push(`'${id}': vật liệu = ${h.kho.vatLieu}`);
            }
            return xau;
        },
    });
    /**
     * Hộ chỉ gồm người CÓ THẬT và CÒN SỐNG.
     *
     * Một hộ đang khai bốn người mà hai người đã chết là cách kho lương thực bị
     * chia cho người chết — và là cách một cái làng chết đói mà bảng số vẫn xanh.
     */
    dangKyInvariant({
        id: 'ho_co_nguoi_that',
        ten: 'Thành viên hộ phải tồn tại và còn sống',
        mucDo: 'warning',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                const h = doc(e, 'ho');
                if (!h || h.tickTan !== null)
                    continue;
                for (const t of h.thanhVien) {
                    const x = s.entities.get(t.id);
                    if (!x)
                        xau.push(`'${id}': thành viên '${t.id}' không tồn tại`);
                    else if (x.tickDiet !== null)
                        xau.push(`'${id}': thành viên '${t.id}' đã chết mà vẫn trong sổ`);
                }
                if (h.chuHoId !== null && !h.thanhVien.some((t) => t.id === h.chuHoId)) {
                    xau.push(`'${id}': chủ hộ '${h.chuHoId}' không nằm trong danh sách thành viên`);
                }
            }
            return xau;
        },
    });
    /**
     * [BB] 70.3 — giáng hạng giảm độ phân giải, KHÔNG xóa đời sống.
     *
     * Cụ thể: một người ở `t1` vẫn phải giữ ký ức và thương tích. Nếu một ngày ai
     * đó "tối ưu" bằng cách xóa chúng khi giáng hạng, bất biến này đỏ trước khi
     * người chơi phát hiện NPC quen cũ đã quên hết mọi thứ.
     */
    dangKyInvariant({
        id: 'giang_hang_khong_xoa_doi',
        ten: 'Giáng hạng không được xóa ký ức hay thương tích',
        mucDo: 'warning',
        kiem: (s, phamVi) => {
            const xau = [];
            for (const id of idCanKiem(s, phamVi)) {
                const e = s.entities.get(id);
                if (!e || e.kind !== 'mortal' || e.tickDiet !== null)
                    continue;
                const m = doc(e, 'mortal');
                const soul = doc(e, 'soul');
                if (!m || soul?.tang !== 't1')
                    continue;
                // Có di chứng mà không có vết nào là dấu của một lần xóa nhầm.
                const coDiChung = m.thanThe.thuongTich.some((t) => t.trangThai === 'di_chung');
                if (m.thanThe.dau > 20 && !coDiChung && m.thanThe.thuongTich.length === 0) {
                    xau.push(`'${id}': còn đau nhưng thương tích đã biến mất sau khi giáng hạng`);
                }
            }
            return xau;
        },
    });
}
