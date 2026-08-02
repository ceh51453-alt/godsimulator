import type { BangThienDien as DuLieuBang, MucCanChuY } from '../../core/bang/thienDien.js';
export declare function BangThienDien({ bang, onDong, onXuLy, }: {
    bang: DuLieuBang;
    onDong: () => void;
    /** [BB] 55.4 — mỗi mục mở THẲNG tới chỗ xử lý; không mục nào chỉ để đọc. */
    onXuLy: (muc: MucCanChuY) => void;
}): JSX.Element;
