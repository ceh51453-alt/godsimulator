import type { DomainState } from '../../core/schema/aspect/thanVi.js';
export type TinDonNgoai = {
    readonly noiDung: string;
    readonly soNguon: number;
    readonly daXacNhan: boolean;
};
export type DuLieuLanhDia = {
    readonly tenThan: string;
    readonly domains: readonly DomainState[];
    readonly soTinDo: number;
    readonly soDen: number;
    readonly hienThanh: number;
    readonly doLech: number;
    readonly coreSelf: Readonly<Record<string, number>>;
    readonly followerImage: Readonly<Record<string, number>>;
    readonly ngoaiLanhDia: readonly TinDonNgoai[];
};
export declare function BangLanhDia({ du }: {
    du: DuLieuLanhDia;
}): JSX.Element;
