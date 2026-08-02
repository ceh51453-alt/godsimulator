/**
 * Khung Sảnh — bố cục ba cột. Phần 37.3.
 *
 * Rail ký hiệu · khung kể · bảng trạng thái. Đây là bố cục mà mọi game nhập vai
 * có bảng bên phải đều hội tụ về, và nó đúng vì ba việc người chơi làm liên tục
 * là **đọc chuyện**, **nhìn mình đang ở đâu**, và **gõ câu tiếp theo**.
 *
 * [BB] 36.1 — không emoji ở bất kỳ đâu, kể cả placeholder. Mọi ký hiệu là SVG
 * vẽ tay trong `design/Icon.tsx`.
 * [BB] 36.4 — kính không lồng quá hai cấp: khung này là cấp 0 (nền), panel là
 * `.kinh` (cấp 1), thẻ bên trong panel là `.kinh--cap2`. Hết.
 */
import type { ReactNode } from 'react';
import type { TenIcon } from '../design/Icon.js';
export type MucRail = {
    readonly id: string;
    readonly icon: TenIcon;
    readonly nhan: string;
    readonly bat?: boolean;
    readonly onChon?: () => void;
};
export declare function KhungSanh({ tieuDe, phuDe, rail, dauTrang, thanhTren, giua, phai, lopPhu, }: {
    tieuDe: string;
    phuDe: string;
    rail: readonly MucRail[];
    dauTrang?: ReactNode;
    /** Thanh Thiên Tượng — 55.2, luôn hiện, ngay dưới tiêu đề. */
    thanhTren?: ReactNode;
    giua: ReactNode;
    phai: ReactNode;
    /**
     * Lớp phủ đọc — [BB] 55.1.
     *
     * Nó phủ lên vùng giữa và phải; rail bên trái vẫn còn (58.2). Vì thế nó nằm
     * TRONG khung chứ không nằm ngoài `<div>` gốc: một lớp phủ toàn màn hình sẽ
     * là một modal, và modal thì dừng trò chơi lại.
     */
    lopPhu?: ReactNode;
}): JSX.Element;
/** Chip hành động gợi ý — [BB] 67.7: gợi ý, KHÔNG phải biên giới. */
export declare function ChipHanhDong({ nhan, icon, onChon, }: {
    nhan: string;
    icon: TenIcon;
    onChon: () => void;
}): JSX.Element;
