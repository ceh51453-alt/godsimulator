/**
 * Bộ ký hiệu — Phần 36.5 [BB].
 *
 * > "Mọi hình ảnh, icon, chi tiết đồ họa là SVG. Không PNG, không icon font,
 * >  không thư viện icon. Vẽ tay, inline, `currentColor`."
 *
 * Quy ước cứng: `stroke="currentColor"`, `fill="none"`, `stroke-width="1.25"`,
 * `stroke-linecap="round"`, `viewBox="0 0 24 24"`.
 *
 * Cảm hứng: **tinh đồ cổ, khắc đá, ký hiệu giả kim** — hình học, một nét mảnh,
 * không tô đặc, không hai màu. Cố ý KHÔNG giống icon UI hiện đại: một cái bánh
 * răng hay một cái chuông sẽ kéo cả màn hình về phía phần mềm văn phòng.
 */
import type { SVGProps } from 'react';
export type TenIcon = 'gui' | 'ban_do' | 'coi' | 'den' | 'giao_uoc' | 'than_khi' | 'quy_ket' | 'vuong_mien' | 'mat_na' | 'nguoi' | 'so_sach' | 'thu_tich' | 'khai_niem' | 'dinh_luat' | 'than' | 'cau_nguyen' | 'di_hoa' | 'tinh_do' | 'canh_bao' | 'nhip';
type Props = SVGProps<SVGSVGElement> & {
    ten: TenIcon;
    co?: number;
};
export declare function Icon({ ten, co, ...rest }: Props): JSX.Element;
/** Danh sách để test khẳng định mọi ký hiệu đều vẽ được. */
export declare const TEN_ICON: TenIcon[];
export {};
