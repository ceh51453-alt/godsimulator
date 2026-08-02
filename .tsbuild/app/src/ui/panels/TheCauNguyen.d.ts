import type { Prayer, CachTraLoi } from '../../core/schema/than.js';
export type CachDuoc = Exclude<CachTraLoi, 'chua'>;
export declare function TheCauNguyen({ cau, tenNguoiCau, tick, onTraLoi, }: {
    cau: Prayer;
    tenNguoiCau: string;
    tick: number;
    onTraLoi: (cach: CachDuoc) => void;
}): JSX.Element;
export declare function KhungCauNguyen({ ds, tenCua, tick, onTraLoi, }: {
    ds: readonly Prayer[];
    tenCua: (id: string) => string;
    tick: number;
    onTraLoi: (cau: Prayer, cach: CachDuoc) => void;
}): JSX.Element;
