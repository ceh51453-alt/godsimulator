/**
 * Regex display sandbox và sanitizer — Phần 64.3, 64.4.
 *
 * ── Điều phải nói thẳng về "timeout" ──
 *
 * JavaScript **không** ngắt được một `RegExp.exec` đang chạy. Không có API nào
 * làm việc đó trong luồng chính, và một Worker cũng chỉ giúp nếu ta chấp nhận
 * bất đồng bộ ở giữa đường render. Nên `maxRegexMs` ở đây được cài bằng ba lớp,
 * và tài liệu này ghi rõ từng lớp để không ai tưởng mình có thứ mình không có:
 *
 * 1. **Chặn trước** — pattern có dạng lồng lượng từ (`(a+)+`, `(a*)*`, `(a|a)+`)
 *    bị từ chối thẳng ở `needs_adapter`. Đây là hình dạng gây quay lui theo hàm mũ.
 * 2. **Giới hạn đầu vào** — transform chỉ chạy trên chuỗi dưới `MAX_KY_TU`.
 * 3. **Đo sau** — chạy xong mà quá `maxRegexMs` thì transform bị **đánh dấu chậm**,
 *    kết quả bị BỎ, văn bản gốc được giữ, và lần sau nó không chạy nữa.
 *
 * Lớp 3 không cứu được lượt đầu tiên. Nó cứu mọi lượt sau, và [BB] 64.3 nói đúng
 * điều cần: "timeout → bỏ transform, giữ text gốc, ghi chẩn đoán; không làm mất lượt".
 *
 * ── Lằn ranh ──
 *
 * [BB] Transform chỉ chạm **bản sao output hiển thị**. Không có tham số nào trong
 * file này nhận system prompt, user input, patch hay event — nên "không được sửa"
 * ở đây là chuyện kiểu dữ liệu, không phải chuyện kỷ luật.
 */
import type { ImportIssue } from '../contracts/primitives.js';
import type { TransformDef } from './schema.js';
export declare const MAX_KY_TU = 200000;
export type RegexDaBien = {
    readonly re: RegExp;
    readonly toanBo: boolean;
};
/**
 * Biên một pattern nguồn thành `RegExp`.
 *
 * Trả `null` khi không dùng được — người gọi chuyển transform sang `needs_adapter`.
 * Không throw: dữ liệu preset là dữ liệu không tin cậy, và một throw ở đây sẽ nổ
 * giữa đường render.
 */
export declare function bienRegex(pattern: string): RegexDaBien | null;
export type KetQuaLamSach = {
    readonly html: string;
    readonly daBo: readonly string[];
};
/**
 * Làm sạch HTML thay thế trước khi render — 64.3.
 *
 * Danh sách xóa lấy thẳng từ đặc tả: `<script>`, event handler, iframe, form,
 * remote stylesheet, URL không cho phép. Không dùng `innerHTML` ở đâu trong repo
 * này; chuỗi trả về vẫn phải đi qua renderer cô lập của Phase 11.
 */
export declare function lamSachHtml(html: string): KetQuaLamSach;
/**
 * Dựng tài liệu HTML cho iframe không có quyền script/same-origin.
 *
 * Khác `lamSachHtml`, hàm này giữ CSS nội tuyến và thẻ `<style>` vì các preset
 * Tawa/Ako dùng chúng để dựng bảng, nhưng loại mọi URL mạng, import và handler.
 */
export declare function taiLieuHtmlCachLy(html: string): KetQuaLamSach;
export type KetQuaTransform = {
    /** Văn bản sau khi áp. Bằng đầu vào khi transform bị bỏ. */
    readonly text: string;
    readonly daApDung: readonly string[];
    readonly daBoQua: readonly {
        readonly id: string;
        readonly lyDo: string;
    }[];
    readonly issues: readonly ImportIssue[];
    /** Id transform vượt `maxRegexMs` — người gọi nên tắt chúng cho lượt sau. */
    readonly quaCham: readonly string[];
};
/**
 * Áp một chuỗi transform lên **bản sao output hiển thị**.
 *
 * `dongHo` được tiêm vào thay vì gọi `performance.now()` trực tiếp: `core/` không
 * được đọc đồng hồ máy (luật bất biến #7), và test cần đo được đường "quá chậm"
 * mà không phải chờ thật.
 */
export declare function apTransform(input: {
    readonly text: string;
    readonly transforms: readonly TransformDef[];
    readonly maxRegexMs: number;
    readonly daTat?: ReadonlySet<string>;
    readonly dongHo?: () => number;
    /** 1 = user input, 2 = AI output. */
    readonly placement?: 1 | 2;
    readonly destination?: 'display' | 'prompt';
    /** 0 là tin mới nhất; số lớn hơn là tin cũ hơn trong lịch sử. */
    readonly depth?: number;
    /** Macro SillyTavern trong replacement, do tầng store cấp ngữ cảnh an toàn. */
    readonly thayMacro?: (text: string, transform: TransformDef) => string;
}): KetQuaTransform;
/**
 * Áp regex `promptOnly` lên **chuỗi prompt** trước khi gửi AI.
 *
 * Cùng bộ bảo vệ sandbox (timeout, chặn pattern, max ký tự) nhưng target là
 * prompt thay vì output hiển thị. Chỉ chạy transform có `promptOnlyNguon: true`.
 *
 * [BB] Ranh giới vẫn giữ: transform chỉ chạy trên chuỗi văn bản đã phẳng hóa,
 * KHÔNG chạy trên WorldView, PatchOp hay cấu trúc dữ liệu engine.
 */
export declare function apPromptTransform(input: {
    readonly text: string;
    readonly transforms: readonly TransformDef[];
    readonly maxRegexMs: number;
    readonly daTat?: ReadonlySet<string>;
    readonly dongHo?: () => number;
    readonly placement?: 1 | 2;
    readonly depth?: number;
}): KetQuaTransform;
