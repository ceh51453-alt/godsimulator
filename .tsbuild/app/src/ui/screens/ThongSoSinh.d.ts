import type { GenParams } from '../../core/schema/ai.js';
export declare function ThongSoSinh({ params, tat, onThayDoi, moMacDinh, }: {
    params: GenParams;
    tat: boolean;
    onThayDoi: (thayDoi: Partial<GenParams>) => void;
    /** Màn cấu hình chính có thể mở sẵn; trong cột endpoint vẫn gập để tiết kiệm chỗ. */
    moMacDinh?: boolean;
}): JSX.Element;
