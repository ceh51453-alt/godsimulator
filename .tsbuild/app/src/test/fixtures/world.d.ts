import type { Entity, Link } from '../../core/schema/entity.js';
import type { World } from '../../core/contracts/core.js';
export declare const BRANCH_GOC = "br_goc";
export declare const SEED_FIXTURE = "thien-dien-fixture-0001";
/** Luật Nền — thứ phàm nhân KHÔNG BAO GIỜ đọc được nguyên văn. */
export declare const LUAT_MAU: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
/** Khái niệm mọc ra từ cách hai vùng hiểu sai luật. */
export declare const KHAI_NIEM_O_UE: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
/** [BB] Phần 8.3 — mỗi khái niệm mới tự sinh phản nghĩa ở trạng thái hư danh. */
export declare const KHAI_NIEM_THANH_SACH: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
export declare const THUNG_LUNG: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
export declare const BO_SONG: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
/**
 * Thần có bản tính THẬT khác hẳn bản tính TÍN ĐỒ TIN.
 * Đây là dữ liệu để test rò rỉ Phần 18.2: phàm nhân chỉ được thấy `banTinhTinDoTin`.
 */
export declare const THAN_TAY_UE: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
export declare const PHAM_NHAN_LY: {
    id: string;
    branchId: string;
    kind: string;
    ten: string;
    aliases: string[];
    moTa: string;
    tickSinh: number;
    tickDiet: number | null;
    aspects: Record<string, unknown>;
    tags: string[];
    _degree: number;
    _hash: string;
    _version: number;
};
export declare const ENTITIES_FIXTURE: readonly Entity[];
/** [BB] Phần 6.3 quy tắc 3 — không thực thể nào có _degree === 0. */
export declare const LINKS_FIXTURE: readonly Link[];
export declare const WORLD_FIXTURE: World;
