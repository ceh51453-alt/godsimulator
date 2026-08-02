/**
 * Tiện ích dùng chung cho mười hai handler nền.
 *
 * Ba việc lặp đi lặp lại ở mọi tiến trình, gom lại đây để mười hai file kia chỉ
 * còn phần *quy luật của thế giới*, không lẫn phần lắp ráp patch:
 *
 *   1. đọc aspect có kiểu và có mặc định — thiếu aspect thì bỏ qua vùng, không crash;
 *   2. dựng `PatchOp` đúng `sourceEventId`;
 *   3. làm tròn — số dấu phẩy động chạy 400 tick sẽ đẻ ra đuôi thập phân vô tận,
 *      và state hash thì băm nguyên văn.
 */
import type { PatchOp } from '../../contracts/core.js';
import type { WorldState } from '../../engine/state.js';
import type { Entity } from '../../schema/entity.js';
import type { NgocCanhTienTrinh } from './types.js';
import type { Duong } from '../../schema/aspect/substrate.js';
/**
 * Phần kho mà mỗi tiến trình được rút trong MỘT lần chạy.
 *
 * Vì sao phải khai chung một chỗ: `production_consumption`, `exchange_debt` và
 * `institution_governance` nằm cùng một cụm phụ thuộc vòng (xem `chiaGiaiDoan`),
 * nên cả ba tính phần mình từ **cùng một ảnh chụp**. Mỗi bên tưởng kho còn đầy.
 * Nếu tổng ba phần vượt 1 thì kho âm — và bất biến sẽ bắt, nhưng bắt xong thì
 * một tiến trình bị bỏ và thế giới mất một mùa vô cớ.
 *
 * Trần này cũng đúng về mặt thế giới: phần kho không ai được đụng tới chính là
 * **thóc giống**. Xã hội nông nghiệp nào cũng có nó, và ăn vào nó là dấu hiệu
 * của nạn đói thật sự chứ không phải của một mùa kém.
 *
 * `phanKhoHopLe()` canh bất biến này; có test riêng.
 */
export declare const PHAN_KHO: Readonly<{
    /** Ăn: phần lớn nhất, nhưng không tới thóc giống. */
    an: 0.75;
    /** Thương đoàn chở đi. */
    traoDoi: 0.1;
    /** Thuế. */
    thue: 0.1;
}>;
/** Tổng ba phần phải nhỏ hơn 1, nếu không kho có thể âm ngay cả khi không ai sai. */
export declare function phanKhoHopLe(): boolean;
/** Bốn chữ số sau dấu phẩy là đủ cho mọi đại lượng của thế giới này. */
export declare const SO_LE = 4;
export declare function lam(x: number, le?: number): number;
/** Kẹp vào khoảng. Dùng ở mọi chỗ ghi một trường có `min`/`max` trong schema. */
export declare function kep(x: number, lo: number, hi: number): number;
/** Id entity theo thứ tự codepoint — [BB] luật bất biến #7, không dùng locale sort. */
export declare function idSapXep(state: WorldState): string[];
export declare function docAspect<T>(e: Entity | undefined, ten: string): T | undefined;
/** Mọi nơi chốn còn sống, kèm bộ aspect nền. Vùng thiếu `dan_cu` bị bỏ qua. */
export type NoiChon = {
    id: string;
    e: Entity;
};
export declare function moiNoiChon(state: WorldState): NoiChon[];
/** Mọi tuyến đường thông suốt, đã sắp xếp. */
export declare function moiTuyenDuong(state: WorldState): {
    id: string;
    d: Duong;
}[];
/** Các vùng nối trực tiếp với `noiId`, kèm tuyến và độ trễ thật. */
export type LangGieng = {
    noiId: string;
    duongId: string;
    doTre: number;
};
export declare function langGieng(state: WorldState, noiId: string): LangGieng[];
export declare function dat(nc: NgocCanhTienTrinh, id: string, path: string, value: unknown): PatchOp;
export declare function cong(nc: NgocCanhTienTrinh, id: string, path: string, value: number): PatchOp;
export declare function datBang(nc: NgocCanhTienTrinh, table: string, id: string, path: string, value: unknown): PatchOp;
export declare function taoBanGhi(nc: NgocCanhTienTrinh, table: string, id: string, banGhi: unknown): PatchOp;
export type Cohort = {
    child: number;
    youth: number;
    adult: number;
    elder: number;
};
export declare function tongCohort(c: Cohort | undefined): number;
/** Lao động thật: người lớn tính đủ, thanh niên nửa, trẻ và già không tính. */
export declare function laoDong(c: Cohort | undefined): number;
/**
 * Rút `n` đơn vị khỏi một chuỗi bể, theo thứ tự cho trước.
 * Trả về lượng rút được thật — KHÔNG BAO GIỜ rút quá số đang có.
 * Đây là chỗ ngăn "vật chất từ trên trời rơi xuống" ngay tại nguồn.
 */
export declare function rutDan(be: number[], n: number): {
    lay: number[];
    tong: number;
};
