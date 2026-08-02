/**
 * Bất biến tầng tự sự — cổng Phase 8.
 *
 * Hai dòng của cổng, và chỗ cưỡng chế:
 *
 * | Cổng | Ở đây |
 * |---|---|
 * | Không rò ba tầng, không lấy người chơi làm tâm | `mach_truyen_khong_lay_nguoi_choi_lam_tam` |
 * | Thứ đã gieo không biến mất | `phuc_but_khong_bien_mat` |
 *
 * Vì sao hai điều này là BẤT BIẾN chứ không phải test:
 *
 * Một test chạy một lần trên một thế giới dựng sẵn. Bất biến chạy sau MỌI
 * transaction, trên thế giới thật, kể cả thế giới do một trăm nhịp mô phỏng và
 * một model bên ngoài cùng nhau tạo ra. Bệnh lấy người chơi làm tâm không xuất
 * hiện trong thế giới hạt giống; nó bò vào sau vài chục nhịp, đúng lúc không ai
 * nhìn — nên chỗ bắt nó phải là chỗ chạy mọi lúc.
 */
import { dangKyInvariant, dangKyBoNapInvariant } from '../engine/invariant.js';
import { TI_LE_VANG_MAT, machDaDong } from '../schema/truyen.js';
let daNap = false;
export function napBatBienTangTruyen() {
    if (daNap)
        return;
    daNap = true;
    dangKyBoNapInvariant(dangKyTatCa);
}
function dangKyTatCa() {
    /**
     * [BB] 28.2 — `nguoiChoiBiet = false` phải là ĐA SỐ.
     *
     * Mức `warning`, không `fatal`, và đó là quyết định có cân nhắc: một thế giới
     * mới mở có ba mạch, cả ba đều quanh người chơi, và điều đó KHÔNG sai — nó chỉ
     * chưa đủ rộng. Rollback transaction vì lý do ấy sẽ chặn cả việc mở thế giới.
     * Cảnh báo đi vào bảng Tự Chẩn Đoán và ống kính tự sửa ở kỷ nguyên sau (28.6).
     */
    dangKyInvariant({
        id: 'mach_truyen_khong_lay_nguoi_choi_lam_tam',
        ten: 'Đa số mạch truyện phải là chuyện người chơi chưa từng nghe',
        mucDo: 'warning',
        canToanCuc: true,
        kiem: (s) => {
            const dang = [...s.storylines.values()].filter((m) => !machDaDong(m.giaiDoan));
            // Dưới bốn mạch thì tỉ lệ chưa nói lên điều gì.
            if (dang.length < 4)
                return [];
            const vang = dang.filter((m) => !m.nguoiChoiBiet).length;
            const tyLe = vang / dang.length;
            if (tyLe >= TI_LE_VANG_MAT.mucTieu)
                return [];
            return [
                `Chỉ ${vang}/${dang.length} mạch truyện nằm ngoài tầm biết của người chơi ` +
                    `(${Math.round(tyLe * 100)}% < ${Math.round(TI_LE_VANG_MAT.mucTieu * 100)}%). ` +
                    'Thế giới đang co lại quanh một người.',
            ];
        },
    });
    /**
     * [BB] 30.2 — phục bút không bao giờ tự biến mất.
     *
     * Ở đây "biến mất" có hai nghĩa và cả hai đều bị bắt:
     *   - dòng bị xóa khỏi sổ trong khi mạch vẫn trỏ tới nó;
     *   - dòng được đánh `daTra` mà không ghi `cachTra` — trả mà không nói trả thế
     *     nào thì đúng là làm nó biến mất, chỉ lịch sự hơn.
     */
    dangKyInvariant({
        id: 'phuc_but_khong_bien_mat',
        ten: 'Thứ đã gieo hoặc được trả, hoặc thành bí ẩn — không có đường thứ ba',
        mucDo: 'fatal',
        canToanCuc: true,
        kiem: (s) => {
            const xau = [];
            for (const m of [...s.storylines.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
                for (const pid of m.phucBut) {
                    if (!s.foreshadows.has(pid)) {
                        xau.push(`Mạch "${m.ten}" trỏ tới phục bút "${pid}" đã không còn trong sổ.`);
                    }
                }
            }
            for (const f of [...s.foreshadows.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
                if (f.daTra && f.cachTra.trim() === '') {
                    xau.push(`Phục bút "${f.id}" được đánh dấu đã trả mà không ghi trả thế nào.`);
                }
            }
            return xau;
        },
    });
}
