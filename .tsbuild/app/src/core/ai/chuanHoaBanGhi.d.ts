export type KetQuaChuanHoa = {
    readonly ok: true;
    readonly value: unknown;
    readonly canhBao: readonly string[];
} | {
    readonly ok: false;
    readonly vi: string;
};
/**
 * Chuẩn hóa một bản ghi mới trước khi nó thành `PatchOp`.
 *
 * `branchId` do người gọi ép — model không được chọn nhánh, cùng lẽ với
 * `sourceEventId` (để model tự khai là mở cửa cho nó ghi sang dòng thời gian
 * khác).
 */
export declare function chuanHoaBanGhiMoi(bang: string, tho: unknown, branchId: string, targetId?: string): KetQuaChuanHoa;
