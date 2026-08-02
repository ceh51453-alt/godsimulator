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

export type TenIcon =
  | 'gui'
  | 'ban_do'
  | 'coi'
  | 'den'
  | 'giao_uoc'
  | 'than_khi'
  | 'quy_ket'
  | 'vuong_mien'
  | 'mat_na'
  | 'nguoi'
  | 'so_sach'
  | 'thu_tich'
  | 'khai_niem'
  | 'dinh_luat'
  | 'than'
  | 'cau_nguyen'
  | 'di_hoa'
  | 'tinh_do'
  | 'canh_bao'
  | 'nhip';

type Props = SVGProps<SVGSVGElement> & { ten: TenIcon; co?: number };

/** Đường nét của từng ký hiệu. Một `path`/`circle` mảnh, không tô. */
const NET: Readonly<Record<TenIcon, JSX.Element>> = {
  // Mũi tên gấp — gửi đi.
  gui: <path d="M3.5 12 20 4l-4 16-4.2-6.2L3.5 12Zm8.3 1.8L20 4" />,
  // Ba đường ngang gấp khúc — địa hình.
  ban_do: <path d="M3 7.5 9 5l6 2.5L21 5v11.5L15 19l-6-2.5L3 19V7.5ZM9 5v11.5M15 7.5V19" />,
  // Vòng tròn trong khung vuông xoay — một cõi có ranh giới riêng.
  coi: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Z" />
    </>
  ),
  // Mái đền trên ba cột.
  den: <path d="M3.5 9 12 4l8.5 5M5 9v10M12 9v10M19 9v10M3 19h18" />,
  // Hai cung tay bắt vào nhau — lời thề hai chiều.
  giao_uoc: <path d="M4 12a4 4 0 0 1 8 0 4 4 0 0 0 8 0M4 12a4 4 0 0 0 8 0 4 4 0 0 1 8 0" />,
  // Lưỡi kiếm mảnh có chuôi — vật mang quyền năng.
  than_khi: <path d="M12 2.5v13M9 15.5h6M12 15.5V21M9.5 18.5h5" />,
  // Tia hội tụ về một điểm — sự kiện được quy về một vị thần.
  quy_ket: <path d="M12 12 4 5M12 12l8-7M12 12l-6 8M12 12l6 8M12 12h9" />,
  // Ba chóp trên vành.
  vuong_mien: <path d="M4 17h16M4 17 5.5 8l4 4L12 6l2.5 6 4-4L20 17" />,
  // Hai cung mắt — hai khuôn mặt của một vị thần.
  mat_na: <path d="M4 8c0 6 3.5 10 8 10s8-4 8-10c0 0-3.5-2-8-2S4 8 4 8Zm4 4h1.5m5 0H16" />,
  // Ba vòng người.
  nguoi: (
    <>
      <circle cx="9" cy="8.5" r="2.8" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6.5a2.8 2.8 0 0 1 0 5.6M17 14.2c2 .7 3.5 2.4 3.5 4.8" />
    </>
  ),
  // Trang giấy gấp góc, ba dòng.
  so_sach: <path d="M6 3h8l4 4v14H6V3Zm8 0v4h4M9 12h6M9 16h6" />,
  // Sách mở.
  thu_tich: (
    <path d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2Zm0 0v15" />
  ),
  // Vòng tròn có ba vệ tinh — khái niệm và sắc thái của nó.
  khai_niem: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v5.5M4.2 16.5l4.8-2.8M19.8 16.5 15 13.7" />
    </>
  ),
  // Cân — luật.
  dinh_luat: (
    <path d="M12 4v16M5 20h14M12 7 5 10m7-3 7 3M2.5 10.5 5 10l2.5.5a2.5 2.5 0 0 1-5 0Zm14 0L19 10l2.5.5a2.5 2.5 0 0 1-5 0Z" />
  ),
  // Sao tám cánh — thần.
  than: <path d="M12 2.5v19M2.5 12h19M5.2 5.2l13.6 13.6M18.8 5.2 5.2 18.8" />,
  // Hai bàn tay chụm hướng lên.
  cau_nguyen: (
    <path d="M9 21c-1-3-2.5-5-2.5-8.5C6.5 9 8 6.5 10 3c1 3.5 1 6 1 9m4 9c1-3 2.5-5 2.5-8.5C17.5 9 16 6.5 14 3c-1 3.5-1 6-1 9" />
  ),
  // Hai vòng lệch tâm — lõi và hình ảnh không còn trùng nhau.
  di_hoa: (
    <>
      <circle cx="9.5" cy="12" r="6" />
      <circle cx="14.5" cy="12" r="6" />
    </>
  ),
  // Chòm sao — yếu tố chữ ký của 36.6.
  tinh_do: (
    <>
      <path d="M5 17.5 9.5 8l5 5.5L19 5.5" />
      <circle cx="5" cy="17.5" r="1.1" />
      <circle cx="9.5" cy="8" r="1.1" />
      <circle cx="14.5" cy="13.5" r="1.1" />
      <circle cx="19" cy="5.5" r="1.1" />
    </>
  ),
  // Tam giác có gạch — [BB] 36.7: lỗi nói rõ chuyện gì, không xin lỗi.
  canh_bao: <path d="M12 4 2.5 20h19L12 4Zm0 6v5m0 2.5v.5" />,
  // Đồng hồ mặt trời — nhịp thời gian.
  nhip: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5V12l3.5 2.5" />
    </>
  ),
};

export function Icon({ ten, co = 18, ...rest }: Props): JSX.Element {
  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {NET[ten]}
    </svg>
  );
}

/** Danh sách để test khẳng định mọi ký hiệu đều vẽ được. */
export const TEN_ICON = Object.keys(NET) as TenIcon[];
