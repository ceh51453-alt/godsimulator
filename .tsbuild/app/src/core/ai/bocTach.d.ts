import type { PatchOp } from '../contracts/core.js';
import type { BienPackDoi } from './mvu.js';
export type PatchBiTuChoi = {
    readonly ma: 'JSON_HONG' | 'KHONG_PHAI_MANG' | 'SAI_SCHEMA' | 'BANG_CAM' | 'DUONG_DAN_CAM' | 'ENTITY_LA' | 'QUA_NHIEU';
    readonly thongDiep: string;
    /** Nguyên văn thứ bị từ chối — vào bảng Tự Chẩn Đoán, không vào world. */
    readonly nguyenVan: string;
};
/** Một phục bút model khai đã gieo — [BB] 30.2, engine mới là nơi giữ sổ. */
export type PhucButKhai = {
    readonly noiDung: string;
    readonly loai: string;
};
export type KetQuaBocTach = {
    /** Văn xuôi đã cắt hết khối dữ liệu — thứ duy nhất hiện lên khung kể. */
    readonly loiKe: string;
    /** Patch đã qua cả ba lớp. Người gọi vẫn phải đưa chúng qua `apDungEvent`. */
    readonly patches: readonly PatchOp[];
    readonly biTuChoi: readonly PatchBiTuChoi[];
    /** Model có gửi khối `<CapNhat>` không — phân biệt "không đổi gì" với "xuất hỏng". */
    readonly coKhoiCapNhat: boolean;
    /**
     * [BB] 30.2 — thứ Narrator vừa gieo. Engine ghi vào Sổ Phục Bút và tự đặt hạn;
     * model KHÔNG được tự khai hạn, vì hạn là thứ quyết định khi nào ống kính bị
     * kéo về đây, tức là một quyết định gameplay.
     */
    readonly phucBut: readonly PhucButKhai[];
    /**
     * [BB] 54.10 — khẳng định về quá khứ không đối chiếu được.
     *
     * Chúng KHÔNG bị xóa. Chúng thành ứng viên Term (Phần 14) và ứng viên gap
     * `nhan_qua`. "Thế giới không phạt AI vì bịa. Nó biến chỗ bịa thành một câu
     * hỏi chưa có lời đáp" — đúng nguyên tắc 4.
     */
    readonly chuaChungThuc: readonly string[];
    /**
     * Thay đổi thuộc namespace `preset.<packId>` — 66.6, tương thích thẻ bài MVU.
     *
     * [BB] Chúng KHÔNG phải patch. Người gọi ghi chúng vào kho biến của pack, và
     * không có đường nào từ danh sách này tới `WorldState`. Đó là điều làm một thẻ
     * bài MVU chạy được ở đây mà vẫn không tự viết lại thế giới.
     */
    readonly bienPack: readonly BienPackDoi[];
};
export type NgocCanhBocTach = {
    readonly eventId: string;
    /** Id entity đang tồn tại — patch trỏ ra ngoài tập này bị từ chối. */
    readonly idHopLe: ReadonlySet<string>;
    /**
     * Nhánh đang chơi. Bản ghi mới bị ÉP về nhánh này.
     *
     * Model không được chọn nhánh — cùng lẽ với `sourceEventId`: để nó tự khai là
     * mở cửa cho nó ghi sang một dòng thời gian khác. Bỏ trống thì bản ghi nhận
     * `branchId` rỗng và bất biến `entity_dung_nhanh` bắt được ngay.
     */
    readonly branchId?: string;
};
/**
 * Bóc một phản hồi thô thành lời kể + patch đã được duyệt.
 *
 * Hàm này KHÔNG throw. Model hỏng là chuyện thường ngày, không phải sự cố lập
 * trình; mọi thứ hỏng đi vào `biTuChoi` để bảng Tự Chẩn Đoán đếm được.
 */
export declare function bocTach(raw: string, nc: NgocCanhBocTach): KetQuaBocTach;
/** Tỉ lệ patch trượt — mục 27 bảng Tự Chẩn Đoán (46.2), hỏng khi > 15%. */
export declare function tyLeTruot(kq: KetQuaBocTach): number;
