/**
 * 50 input tự do mỗi tầng — cổng Phase 4.
 *
 * "50 input fixture mỗi tầng, gồm câu mơ hồ và mục tiêu dài hạn."
 *
 * [BB] Cổng: KHÔNG input nào trả "không hiểu" chung chung. Mỗi câu phải cho ra
 * hoặc một hành động (kèm hệ quả), hoặc một lý do cụ thể trong thế giới, hoặc một Project.
 */
export type CaTest = {
    cau: string;
    /** Kỳ vọng tối thiểu — dùng để test, không phải để giới hạn engine. */
    mong?: 'project' | 'chan_co_ly_do' | 'hanh_dong';
};
/** Tầng Sáng Thế — phép toán bản thể, và những câu mơ hồ. */
export declare const INPUT_SANG_THE: readonly CaTest[];
/** Tầng Thần — can thiệp trong domain, và những câu ngoài tầm với. */
export declare const INPUT_THAN: readonly CaTest[];
/** Tầng Phàm Nhân — đời thường, và những câu vượt tầm một con người. */
export declare const INPUT_PHAM_NHAN: readonly CaTest[];
export declare const TAT_CA_INPUT: {
    readonly sang_the: readonly CaTest[];
    readonly than: readonly CaTest[];
    readonly pham_nhan: readonly CaTest[];
};
