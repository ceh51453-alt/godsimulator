/**
 * Khung cho màn toàn trang ngoài Sảnh.
 *
 * Một thanh duy nhất, và nó tồn tại vì một luật rất đơn giản: **không màn nào
 * được là ngõ cụt.** Thế giới vẫn đang chạy sau lưng người chơi, nên đường quay
 * lại phải luôn nhìn thấy được và luôn bấm được bằng phím.
 */
import type { ReactNode } from 'react';
export declare function ManPhu({ children }: {
    children: ReactNode;
}): JSX.Element;
