/**
 * Chunk và nhãn tầm nhìn — Phần 54.2, 54.3 [BB].
 *
 * ── Mục quan trọng nhất của cả Khối O ──
 *
 * 54.3 mở đầu bằng: "RAG là một đường rò rỉ mới. Đây là mục quan trọng nhất của
 * cả Phần 54." Và ngay sau đó:
 *
 *   [BB] Lọc tầm nhìn chạy TRƯỚC khi xếp hạng, không phải sau.
 *
 * Lý do được nói rõ và nó là lý do kỹ thuật, không phải khẩu hiệu: lọc sau khi
 * xếp hạng nghĩa là top-K đã bị chunk cấm chiếm chỗ, nên kết quả trả về ít hơn
 * dự kiến — tức là chunk cấm vẫn gây hại kể cả khi cuối cùng bị vứt đi.
 *
 * 77.1 siết thêm một nấc: "Semantic reranker không được thấy một chunk mà chủ
 * thể không được biết, KỂ CẢ ĐỂ TRẢ ĐIỂM RỒI LOẠI SAU."
 *
 * Vì vậy file này có hai kiểu tách bạch:
 *   `Chunk`          — bản gốc trong chỉ mục, có `noiDung` thật
 *   `ChunkDaChieu`   — bản đã lọc + đã chiếu, KHÔNG còn `noiDung` gốc
 *
 * Mọi thứ sau bước lọc chỉ nhìn thấy kiểu thứ hai. Đó là cách biến một quy tắc
 * quy trình thành một ràng buộc kiểu dữ liệu.
 */
import { z } from 'zod';
import type { ViewMode } from '../contracts/primitives.js';
/** Nguồn chunk — bảng 54.2. Mỗi nguồn có đơn vị chunk tự nhiên riêng. */
export declare const NGUON_CHUNK: readonly ["lorebook", "bien_nien", "ky_uc_thuc_the", "ky_uc_mach", "dinh_luat", "dien_giai_luat", "khai_niem", "canh_da_ke", "so_nhan_qua", "so_phuc_but"];
export type NguonChunk = (typeof NGUON_CHUNK)[number];
export declare const TamNhinSchema: z.ZodObject<{
    tangToiThieu: z.ZodPrefault<z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>>;
    vungHanChe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    domainHanChe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    laTinDon: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export declare const ChunkSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    nguon: z.ZodString;
    nguonId: z.ZodString;
    noiDung: z.ZodString;
    vector: z.ZodPrefault<z.ZodNullable<z.ZodCustom<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>>>;
    meta: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    tamNhin: z.ZodPrefault<z.ZodObject<{
        tangToiThieu: z.ZodPrefault<z.ZodEnum<{
            sang_the: "sang_the";
            than: "than";
            pham_nhan: "pham_nhan";
        }>>;
        vungHanChe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        domainHanChe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        laTinDon: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    entityIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    storylineId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    trust: z.ZodPrefault<z.ZodNumber>;
    tick: z.ZodNumber;
    _dim: z.ZodPrefault<z.ZodNumber>;
}, z.core.$strict>;
export type TamNhinChunk = z.infer<typeof TamNhinSchema>;
export type Chunk = z.infer<typeof ChunkSchema>;
/**
 * Chunk đã qua lọc tầm nhìn VÀ đã chiếu.
 *
 * Không có trường `noiDung`. Đó là cố ý: 77.3 nói "không truyền `Chunk.noiDung`
 * gốc rồi yêu cầu reranker đừng dùng". Ở đây thì không có gì để yêu cầu — bản
 * gốc đơn giản là không đi qua được biên này.
 */
export type ChunkDaChieu = Readonly<{
    id: string;
    nguon: string;
    nguonId: string;
    /** Đã qua `chieu()` và `bopMeo()` nếu là tin đồn — 77.3. */
    projectedText: string;
    entityIds: readonly string[];
    storylineId: string | null;
    trust: number;
    tick: number;
    daBopMeo: boolean;
    vector: Uint8Array | null;
}>;
/**
 * Chủ thể ở `mucChieu` có được thấy chunk này không.
 *
 * Ba phép kiểm, mỗi phép đóng một đường rò riêng:
 *   1. tầng   — văn bản luật gốc không bao giờ xuống tầng phàm nhân (18.2);
 *   2. vùng   — diễn giải của vùng A không được trả về khi kể ở vùng B (54.2);
 *   3. domain — thần chỉ thấy phần trong domain mình giữ (18.2).
 */
export declare function chunkDuocThay(c: Chunk, nc: {
    mucChieu: ViewMode;
    vungIds: ReadonlySet<string>;
    domainIds: ReadonlySet<string>;
}): boolean;
/**
 * Cửa sổ trượt cho cảnh đã kể — 54.2: ~300 token, chồng lấn 15%.
 *
 * [BB] "Không chia theo kích thước cố định khi nội dung đã có đơn vị tự nhiên."
 * Chỉ nguồn `canh_da_ke` đi qua hàm này; mọi nguồn khác chunk theo đơn vị của nó.
 */
export declare function cuaSoTruot(text: string, tokenMoiCua?: number, chongLan?: number, tyLeToken?: number): readonly string[];
/** Lượng tử hóa float32 → int8 (54.4). Giảm bốn lần dung lượng. */
export declare function luongTuHoa(v: readonly number[]): Uint8Array;
/** Giải nén int8 → float32 tại chỗ (54.5 bước 2). */
export declare function giaiLuongTu(v: Uint8Array): Float32Array;
export declare function cosine(a: Float32Array, b: Float32Array): number;
