/**
 * Thao tác entry cấp AI — Phần 52 [BB].
 *
 * ── Lằn ranh không được vượt ──
 *
 * [BB] 52.2: AI **không bao giờ** được sửa hay xóa entry người dùng nhập. Nó chỉ
 * được **che** — và mọi lần che đều hiện lên bảng đối soát để người chơi bỏ che.
 *
 * "Người chơi soạn lorebook của mình và phải chắc chắn rằng chữ họ viết không bao
 * giờ bị máy sửa sau lưng." Bảng `QUYEN_OP` dưới đây là chỗ duy nhất trong repo
 * quyết định điều đó, và nó là dữ liệu chứ không phải một chuỗi `if` rải rác.
 *
 * ── Op trượt thì bỏ op đó ──
 *
 * [BB] 52.4 — cùng chính sách với patch ở 31.7: một op sai không làm hỏng cả lô.
 */
import type { StructuredError } from '../contracts/errors.js';
import type { LorebookEntry, NguonLorebook } from './schema.js';
export declare const LOAI_OP: readonly ["them", "sua", "gop", "tach", "che", "doi_key", "xoa"];
export type LoaiOp = (typeof LOAI_OP)[number];
/** Bảng quyền 52.2 [BB]. `true` = được phép. */
export declare const QUYEN_OP: Readonly<Record<LoaiOp, Readonly<Record<NguonLorebook, boolean>>>>;
export type LorebookOp = {
    readonly op: 'them';
    readonly ten: string;
    readonly keys: readonly string[];
    readonly noiDung: string;
    readonly lop: 'loi' | 'sau';
    readonly chuDe: readonly string[];
    readonly suKienChongLung: readonly string[];
    readonly order?: number;
} | {
    readonly op: 'sua';
    readonly id: string;
    readonly truong: string;
    readonly noiDungMoi: string;
    readonly lyDo: string;
} | {
    readonly op: 'gop';
    readonly ids: readonly string[];
    readonly giuId: string;
} | {
    readonly op: 'tach';
    readonly id: string;
    readonly thanh: readonly {
        readonly ten: string;
        readonly keys: readonly string[];
        readonly noiDung: string;
    }[];
} | {
    readonly op: 'che';
    readonly id: string;
    readonly boiId: string;
    readonly lyDo: string;
} | {
    readonly op: 'doi_key';
    readonly id: string;
    readonly keys: readonly string[];
} | {
    readonly op: 'xoa';
    readonly id: string;
    readonly lyDo: string;
};
export type NguCanhOp = {
    readonly entries: ReadonlyMap<string, LorebookEntry>;
    /** Nguồn của lorebook chứa từng entry. */
    readonly nguonCua: ReadonlyMap<string, NguonLorebook>;
    /** Lorebook đích của op `them` — [BB] luôn phải là `tu_sinh` (50.10). */
    readonly nguonDich: NguonLorebook;
    readonly entityTonTai: ReadonlySet<string>;
    readonly eventTonTai: ReadonlySet<string>;
    readonly tick: number;
    readonly boiAi: LorebookEntry['lichSu'][number]['boiAi'];
    readonly tyLeToken?: number;
    readonly tranToken?: number;
    /** id entry đang `bo_sung_cho` một entry khác — chặn op `xoa` (52.4). */
    readonly duocTroToi?: ReadonlySet<string>;
};
export type KetQuaOp = {
    readonly ok: boolean;
    readonly loi: readonly StructuredError[];
    /** Entry sau khi áp; rỗng khi op bị bỏ. */
    readonly them: readonly LorebookEntry[];
    readonly sua: readonly LorebookEntry[];
    readonly xoaId: readonly string[];
};
/** Kiểm quyền theo bảng 52.2. */
export declare function duocPhep(op: LoaiOp, nguon: NguonLorebook): boolean;
/**
 * Xác thực và áp MỘT op — 52.4.
 *
 * Trả về `KetQuaOp` cho mọi đường đi. Không throw, không sửa `entries` tại chỗ.
 */
export declare function apMotOp(op: LorebookOp, ctx: NguCanhOp): KetQuaOp;
export type KetQuaLoOp = {
    readonly them: readonly LorebookEntry[];
    readonly sua: readonly LorebookEntry[];
    readonly xoaMemId: readonly string[];
    readonly boQua: readonly {
        readonly viTri: number;
        readonly op: LoaiOp;
        readonly loi: readonly StructuredError[];
    }[];
};
/**
 * Áp một lô op. [BB] 52.4 — op trượt thì **bỏ op đó**, giữ các op còn lại.
 *
 * Đây là cùng chính sách với patch ở 31.7, và vì cùng lý do: một model sai một
 * mục trong ba mươi mục là chuyện thường; hủy cả ba mươi là phản ứng thái quá.
 */
export declare function apLoOp(ops: readonly LorebookOp[], ctx: NguCanhOp): KetQuaLoOp;
/** Thùng rác giữ ba kỷ nguyên — 52.3. Chỉ người chơi mới xóa cứng được. */
export declare function conTrongThungRac(entry: LorebookEntry, tickHienTai: number, tickMoiKyNguyen: number): boolean;
