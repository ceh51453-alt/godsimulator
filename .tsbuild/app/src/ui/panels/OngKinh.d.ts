import type { DoVangMat } from '../../core/truyen/machTruyen.js';
import type { KetQuaTruyHoi } from '../../core/retrieval/truyHoi.js';
import type { ProjectedStoryline } from '../../core/contracts/view.js';
import type { KetQuaBoDanhGia } from '../../core/retrieval/boDanhGia.js';
export type DuLieuOngKinh = {
    readonly viChieu: string;
    readonly machDangChieu: ProjectedStoryline | null;
    readonly vangMat: DoVangMat;
    readonly truyHoi: KetQuaTruyHoi | null;
    readonly vetCatToken: readonly {
        tang: number;
        ten: string;
        vi: string;
    }[];
    readonly machKhac: readonly ProjectedStoryline[];
    readonly onChia: (machId: string) => void;
    readonly onTuDong: () => void;
    /** Nhân vật và nơi chốn chĩa được — hai loại mục tiêu còn lại của 29.1. */
    readonly nhanVatGan: readonly {
        id: string;
        ten: string;
    }[];
    readonly vungGan: readonly {
        id: string;
        ten: string;
    }[];
    readonly onChiaNhanVat: (entityId: string) => void;
    readonly onChiaVung: (vungId: string) => void;
    /** Bộ đánh giá truy hồi — 77.10, nút của 77.11. */
    readonly danhGia: KetQuaBoDanhGia | null;
    readonly dangDanhGia: boolean;
    readonly onDanhGia: () => void;
};
export declare function PanelOngKinh(du: DuLieuOngKinh): JSX.Element;
