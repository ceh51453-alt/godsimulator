import type { GenParams } from '../../core/schema/ai.js';
export declare function ThongSoSinh({ params, tat, onThayDoi, }: {
    params: GenParams;
    tat: boolean;
    onThayDoi: (thayDoi: Partial<GenParams>) => void;
}): JSX.Element;
