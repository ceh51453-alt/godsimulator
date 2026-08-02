import type { BangThongTin as DuLieu, TabThongTin } from '../../core/bang/thongTin.js';
export declare function BangThongTin({ du, tab, tim, theoDoiMachIds, onDoiTab, onTim, onGhimMach, onDong, }: {
    du: DuLieu;
    tab: TabThongTin;
    tim: string;
    theoDoiMachIds: readonly string[];
    onDoiTab: (t: TabThongTin) => void;
    onTim: (q: string) => void;
    onGhimMach: (machId: string) => void;
    onDong: () => void;
}): JSX.Element;
