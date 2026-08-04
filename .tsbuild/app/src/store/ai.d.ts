import type { AiConfig, AiEndpoint, ThieuSot } from '../core/ai/cauHinh.js';
import type { HoSoCong, TrangThaiMach } from '../core/ai/cong.js';
import type { PromptGoi } from '../core/ai/bienSoan.js';
import type { RerankConfig } from '../core/schema/rerank.js';
import type { AdapterSemantic } from '../core/retrieval/rerank.js';
import type { MachRerank } from '../core/retrieval/truyHoi.js';
import type { KetQuaGoi } from '../ai/client.js';
import type { Calib } from '../core/ai/nganSach.js';
/** Ba điểm cuối của 46.1. */
export type TenEndpoint = 'narrator' | 'updater' | 'workflow';
export declare const NHAN_ENDPOINT: Readonly<Record<TenEndpoint, string>>;
export type BanGhiGoi = {
    readonly loai: 'ke' | 'thu' | 'quet';
    readonly ok: boolean;
    readonly ma: string;
    readonly thongDiep: string;
    readonly soKyTuVao: number;
    readonly soKyTuRa: number;
};
export type TrangThaiAi = {
    cfg: AiConfig;
    mach: TrangThaiMach;
    /** Đang chạy một lượt thử đường hoặc quét. */
    dangDo: boolean;
    /** Đang chờ model kể xong — UI khóa ô nhập trong lúc này. */
    dangKe: boolean;
    /** Đã đọc xong cấu hình từ đĩa chưa. Trước lúc đó không được kết luận gì. */
    daNap: boolean;
    nhatKy: readonly BanGhiGoi[];
    /** Kết quả quét/thử gần nhất, để UI báo ngay dưới nút. */
    tinNhan: string;
    /**
     * Bộ hiệu chỉnh token theo loại call — [BB] 34.3.
     *
     * Ở store chứ không ở `WorldState`: tỉ lệ ký tự trên token là tính chất của
     * MODEL, không phải của thế giới. Nhét nó vào state sẽ làm `stateHash` đổi theo
     * việc người chơi dùng model nào — cùng lý do trạng thái ngắt mạch nằm ngoài.
     */
    calib: Record<string, Calib>;
    /** Cảnh báo tự hiệu chỉnh gần nhất — vào bảng Tự Chẩn Đoán, không im lặng. */
    canhBaoNganSach: readonly string[];
    /**
     * Ngắt mạch RIÊNG cho reranker — [BB] 77.9.
     *
     * Tách khỏi `mach` của Narrator có chủ ý: reranker chết KHÔNG được đóng cổng
     * chơi. Gộp hai trạng thái sẽ biến một sự cố xếp hạng thành một lần mất lượt,
     * đúng thứ 77.9 cấm.
     */
    machRerank: MachRerank;
    /** Thống kê tab Truy hồi (77.11) — cộng dồn trong phiên, không vào save. */
    thongKeTruyHoi: {
        soLan: number;
        soFallback: number;
        soCacheHit: number;
        tongLatencyMs: number;
        tongForbidden: number;
    };
    cong(): HoSoCong;
    tyLeHong(): number;
    /** Adapter semantic theo cấu hình hiện tại; `null` nghĩa là dùng heuristic. */
    adapterRerank(): AdapterSemantic | null;
    suaRerank(thayDoi: Partial<RerankConfig>): void;
    datMachRerank(m: MachRerank): void;
    ghiNhanTruyHoi(r: {
        latencyMs: number;
        cacheHit: boolean;
        fallbackReason: string;
        forbiddenCount: number;
    }): void;
    /**
     * Gọi Cập Nhật Biến — 46.1. Trả `null` khi endpoint chưa bật, trừ khi thao
     * tác thủ công cho phép dùng cấu hình Tường Thuật làm đường dự phòng.
     */
    capNhatBien(prompt: {
        heThong: string;
        nguoiDung: string;
    }, dungTuongThuatKhiTat?: boolean): Promise<KetQuaGoi | null>;
    napTuDia(): Promise<void>;
    suaEndpoint(ten: TenEndpoint, thayDoi: Partial<AiEndpoint>): void;
    sao(tu: TenEndpoint, den: TenEndpoint): void;
    datLai(): void;
    quet(ten: TenEndpoint): Promise<void>;
    thu(ten: TenEndpoint): Promise<void>;
    moLaiMach(): void;
    /**
     * Gọi Tường Thuật. Đây là hàm `useGame` dùng; nó tự cập nhật ngắt mạch, nên
     * ba lần hỏng liên tiếp sẽ tự đóng cổng mà không ai phải nhớ gọi thêm gì.
     */
    ke(prompt: PromptGoi, params?: AiEndpoint['params']): Promise<KetQuaGoi>;
};
export declare const useAi: import("zustand").UseBoundStore<import("zustand").StoreApi<TrangThaiAi>>;
/** Đọc cổng ngoài React — `useGame` dùng cái này, không dùng hook. */
export declare function congCuaAi(): HoSoCong;
export type { ThieuSot };
