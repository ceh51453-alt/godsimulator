/**
 * Cơ Chế Phái Sinh — Phần 44 [BB].
 *
 * ── Nguyên tắc ──
 *
 * > **Không cơ chế nào được cài cứng vào engine. Mọi cơ chế chỉ tồn tại nếu thế
 * > giới có đủ điều kiện cho nó tồn tại.**
 *
 * Bốn cơ chế dưới đây **không phải tính năng của app**. Chúng là **hệ quả** của
 * những luật mà người chơi có thể viết hoặc không. "Nếu người chơi không bao giờ
 * đặt tên trục Nhận Thức, thì trong thế giới đó hiểu biết không làm suy yếu bất
 * cứ thứ gì — và Thần Bí đơn giản là **không có mặt trong vũ trụ này**."
 *
 * ── `moTaKhiKhong` là trường bắt buộc ──
 *
 * [BB] 44.2: "Nó ép người thiết kế cơ chế phải trả lời: *thế giới không có thứ này
 * thì khác gì?* Nếu không trả lời được thì cơ chế đó không đáng tồn tại." Nên nó
 * là trường bắt buộc trong `DinhNghiaCoChe`, và test cổng kiểm nó khác rỗng.
 */
import type { WorldState } from '../engine/state.js';
import type { Conceptual } from '../schema/aspect/conceptual.js';
import type { Tuning } from '../tuning/schema.js';
import type { CoCheId, CoCheRow, SubstrateLaw } from './schema.js';
export type DieuKienTonTai = {
    readonly lucNen?: readonly {
        readonly truc: SubstrateLaw['truc'];
        readonly thamSo: Readonly<Record<string, unknown>>;
    }[];
    readonly khaiNiem?: readonly {
        readonly tag: string;
        readonly giaiDoanToiThieu: Conceptual['giaiDoan'];
    }[];
    readonly luatNoiTai?: readonly {
        readonly theTag: readonly string[];
    }[];
};
export type DinhNghiaCoChe = {
    readonly id: CoCheId;
    readonly ten: string;
    readonly dieuKienTonTai: DieuKienTonTai;
    /** [BB] BẮT BUỘC, không được rỗng. */
    readonly moTaKhiKhong: string;
    readonly moTaKhiCo: string;
};
/** Bốn cơ chế dựng sẵn — 44.3. Người dùng thêm được qua `R.mechanism` [MR]. */
export declare const CO_CHE: Readonly<Record<CoCheId, DinhNghiaCoChe>>;
export type KetQuaQuetCoChe = {
    readonly id: CoCheId;
    readonly duDieuKien: boolean;
    readonly conThieu: readonly string[];
};
/** Điều kiện tồn tại của một cơ chế có thỏa không, và còn thiếu gì. */
export declare function quetMotCoChe(dn: DinhNghiaCoChe, s: WorldState, luatNen: readonly SubstrateLaw[]): KetQuaQuetCoChe;
export type ChuyenTrangThaiCoChe = {
    readonly row: CoCheRow;
    readonly vuaBat: boolean;
    readonly vuaTat: boolean;
    /** Câu công bố — 44.4 [BB] giọng biên niên sử, không giọng log. */
    readonly congBo: string;
    /** Mạch truyện loại `dat_ten` sinh ra khi cơ chế vừa bật. */
    readonly sinhMachDatTen: boolean;
};
/**
 * Quét toàn bộ `R.mechanism` cuối mỗi kỷ nguyên — 44.4 [BB].
 *
 * Điều kiện vỡ thì `khiTat()` chạy và **mọi thứ đang phụ thuộc cơ chế đó phải
 * được xử lý tử tế**, không xóa cứng: Cố Hữu Kết Giới đang mở thì sập; entity có
 * Nguyên Điểm thì giữ link nhưng mất hệ số. Hàm này trả về *quyết định*; việc dọn
 * dẹp nằm ở `hauQuaKhiTat()`.
 */
export declare function quetCoChe(input: {
    readonly state: WorldState;
    readonly luatNen: readonly SubstrateLaw[];
    readonly hienTai: readonly CoCheRow[];
    readonly branchId: string;
    readonly tick: number;
}): ChuyenTrangThaiCoChe[];
export type HauQuaTat = {
    readonly ketGioiPhaiSap: readonly string[];
    readonly matHeSoNguyenDiem: readonly string[];
    readonly ghiChu: string;
};
/**
 * Dọn dẹp khi một cơ chế tắt — 44.4 [BB] "xử lý tử tế, không xóa cứng".
 *
 * Trả về *danh sách* thứ bị ảnh hưởng chứ không tự xóa: link Nguyên Điểm được
 * GIỮ, chỉ hệ số biến mất. Một cơ chế tắt rồi bật lại sau ba kỷ nguyên phải tìm
 * lại được đúng những sợi dây cũ.
 */
export declare function hauQuaKhiTat(id: CoCheId, s: WorldState): HauQuaTat;
/**
 * Thần Bí — 44.3.
 *
 * ```text
 * thanBi_goc  = f(tuổi entity)
 * thanBi_hien = thanBi_goc × (1 − triThucTrungBinhVung/100) × (0.97 ^ soLanBiNghienCuu)
 * ```
 *
 * [BB] Hai móc nối: Thần Khởi Nguyên già nhất nên `thanBi_goc` cao nhất; và nối
 * vào Dị Hóa — **thần bị hiểu sai thì đổi tính; thần bị hiểu đúng thì tan biến**.
 * Cung thứ hai bi thảm hơn: vị thần không bị lãng quên, mà bị *giải thích*.
 */
export declare function thanBi(input: {
    readonly tuoi: number;
    readonly triThucTrungBinhVung: number;
    readonly soLanBiNghienCuu: number;
    readonly tuning: Tuning;
}): {
    readonly goc: number;
    readonly hien: number;
};
/** Nhân điểm utility khi hành động thuận Nguyên Điểm — 44.3. */
export declare function nhanNguyenDiem(thuanTheo: boolean, tuning: Tuning): number;
/**
 * Bản tính bị Nguyên Điểm kéo về một trục mỗi kỷ nguyên — 44.3.
 *
 * "Đây đúng là công thức Dị Hóa, ngược chiều. Dị Hóa kéo từ ngoài vào — tín đồ
 * tin gì. Nguyên Điểm kéo từ trong ra. Kết quả giống nhau: **bạn ngừng là một
 * người và trở thành một lực.**"
 */
export declare function keoBanTinh(banTinh: Readonly<Record<string, number>>, trucNguyenDiem: string, tuning: Tuning): {
    readonly banTinh: Record<string, number>;
    readonly nenDoiKind: boolean;
};
export type HauQuaVuKhiKhaiNiem = {
    readonly vatMangIds: readonly string[];
    readonly luatMatHieuLucIds: readonly string[];
    readonly phanNghiaId: string | null;
    readonly phatThucTai: number;
    readonly moTaSeo: string;
};
/**
 * Vũ Khí Khái Niệm — 44.3 [BB], cơ chế nguy hiểm nhất trong toàn game.
 *
 * ```text
 * THU(CONCEPT: "Rồng") → mọi con rồng ngừng tồn tại đồng thời
 *                      → mọi luật tiếp địa vào "Rồng" tụt hieuLuc về 0
 *                      → để lại một VẾT SẸO cỡ khái niệm
 * ```
 *
 * Hàm này CHỈ TÍNH hậu quả. Nó không áp gì cả — vì hậu quả phải hiện ra trước
 * mặt người chơi trước khi họ bấm, và "diệt khái niệm Cái Chết nghe như một hành
 * động từ bi; hậu quả thì không".
 */
export declare function hauQuaVuKhiKhaiNiem(khaiNiemId: string, s: WorldState, tuning: Tuning): HauQuaVuKhiKhaiNiem;
/** Bảng "CƠ CHẾ ĐANG HOẠT ĐỘNG" cho Panel Vật Lý Thế Giới — 44.5. */
export declare function bangCoChe(rows: readonly CoCheRow[]): string;
