export type ThamSoMeo = {
    /** Số chặng đã truyền. 0 = chứng kiến trực tiếp. */
    chang: number;
    /** Tri thức của người kể, 0–100. Cao thì méo ít. */
    triThuc: number;
    /** Phe kể có lợi khi phóng đại theo hướng nào. */
    thienVi: 'phong_dai' | 'giam_nhe' | 'trung_lap';
    seed: string;
};
/** Mức méo 0–1. Tăng theo chặng, giảm theo tri thức. */
export declare function mucMeo(chang: number, triThuc: number): number;
/** Biến thể tên: rút gọn, đổi âm, hoặc thay bằng danh hiệu. */
export declare function meoTen(ten: string, ts: ThamSoMeo): string;
/** Số bị phóng đại hoặc giảm nhẹ theo hướng có lợi cho phe kể. */
export declare function meoSo(so: number, ts: ThamSoMeo): number;
/** Thời gian bị dồn lại: "ba đời trước" thành "thuở xưa". */
export declare function meoThoiGian(tickCu: number, tickHienTai: number, ts: ThamSoMeo): string;
/** Động cơ bị gán nhầm — nguồn kịch tính chính của tầng Thần. */
export declare function meoDongCo(dongCoThat: string, ts: ThamSoMeo): string;
/**
 * Méo một đoạn văn bản mô tả.
 * [BB] Không cắt chữ thành dấu chấm lửng — đó là làm mơ hồ. Phải THAY bằng
 * một khẳng định khác, sai một cách có thể kiểm chứng được.
 */
export declare function meoMoTa(moTa: string, ts: ThamSoMeo): string;
/** Bản mô tả đã méo kèm ghi chú cho UI biết đây là tin đồn. */
export type BanMeo = {
    ten: string;
    moTa: string;
    mucMeo: number;
};
export declare function bopMeo(ten: string, moTa: string, ts: ThamSoMeo): BanMeo;
