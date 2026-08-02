/**
 * Cấu hình AI — Phần 31.1, 31.2, 46.1 [BB].
 *
 * ── Vì sao file này nằm ở `core/` mà không gọi mạng ──
 *
 * `core/` là TypeScript thuần: không `fetch`, không React, không Dexie (luật bất
 * biến #3). Nên hợp đồng cấu hình, phép kiểm hợp lệ và **quyết định cho chơi hay
 * không** nằm ở đây; phần thật sự nhấc điện thoại lên nằm ở `src/ai/`.
 *
 * ── Điều đã đổi so với đặc tả gốc ──
 *
 * Đặc tả v3.1 (46.2, cổng Phase 8) cho phép chơi khi endpoint chết: `chi_engine`
 * là "chế độ chơi hợp lệ". Dự án này chọn khác — **không có AI thì không chơi**
 * (ADR-0028), và Phase 12 đóng nốt lối cuối cùng: `chi_engine` bị **gỡ khỏi
 * schema** (ADR-0056). Cấu hình cũ có chuỗi ấy vẫn đọc được — `.catch()` kéo nó
 * về `gop_vao_narrator` — nhưng không còn cách nào chọn lại nó.
 *
 * Điểm cuối *Tường Thuật* không có chế độ tắt, và `congCoMo()` trả `false` khi
 * nó chưa thông.
 */
import { z } from 'zod';
import { GenParamsSchema } from '../schema/ai.js';
import { DIALECTS } from '../schema/ai.js';
import { RerankConfigSchema } from '../schema/rerank.js';
/** Một model mà proxy khai là dùng được — kết quả của lần quét gần nhất. */
export const ModelInfoSchema = z
    .object({
    id: z.string(),
    ten: z.string().prefault(''),
    /** Proxy nào cũng khai khác nhau; giữ nguyên chuỗi để không đoán bừa. */
    nhomNhaCungCap: z.string().prefault(''),
    contextMax: z.number().nullable().prefault(null),
})
    .strict();
/**
 * Kết quả thăm dò một điểm cuối.
 *
 * [BB] Không dùng thời gian máy trong `core/`. `tickDo` là **nhịp thế giới** lúc
 * đo, không phải đồng hồ — nhờ vậy hồ sơ này replay được và không mục theo giờ.
 */
export const ProbeResultSchema = z
    .object({
    daDo: z.boolean().prefault(false),
    thong: z.boolean().prefault(false),
    /** Mã lỗi cuối cùng, rỗng nếu thông. */
    maLoi: z.string().prefault(''),
    thongDiep: z.string().prefault(''),
    /** Model đã trả lời được — bằng chứng đường đi thật sự chạy. */
    modelDaTraLoi: z.string().prefault(''),
    /** Số ký tự model trả về ở lần thử — 0 nghĩa là im lặng, tức là hỏng. */
    soKyTuTraVe: z.number().int().prefault(0),
    tickDo: z.number().int().nullable().prefault(null),
    /** Model có xuất được khối dữ liệu có cấu trúc không (probe #3). */
    xuatCoCauTruc: z.boolean().prefault(false),
})
    .strict()
    .prefault({});
/**
 * Hình dạng trần của một điểm cuối, TRƯỚC `.prefault()`.
 *
 * Tách ra vì `.prefault()` trả về `ZodPrefault`, và `ZodPrefault` không có
 * `.extend()` — nên `UpdaterEndpointSchema` phải mở rộng bản trần rồi mới bọc
 * prefault lại. Đây là cùng loại vướng mắc đã ghi ở ADR-0002.
 */
const BanTheEndpoint = z
    .object({
    label: z.string().prefault(''),
    proxyUrl: z.string().prefault(''),
    /** [BB] Không bao giờ ra khỏi máy người chơi — `KHOA_SECRET` cắt nó khi export. */
    proxyPassword: z.string().prefault(''),
    dialect: z.enum(DIALECTS).prefault('tu_do'),
    modelId: z.string().prefault(''),
    profileId: z.string().prefault(''),
    availableModels: z.array(ModelInfoSchema).prefault([]),
    lastScanAt: z.number().nullable().prefault(null),
    probe: ProbeResultSchema,
    params: GenParamsSchema,
})
    .strict();
export const AiEndpointSchema = BanTheEndpoint.prefault({});
/**
 * 46.2 — Cập Nhật Biến tắt được; Tường Thuật thì không.
 *
 * [BB] ADR-0056 — `cheDoKhiTat` chỉ còn MỘT giá trị. Tắt điểm cuối riêng nghĩa là
 * khối `<CapNhat>` đi kèm lời kể của Narrator, không nghĩa là thế giới tự chạy
 * bằng engine. `.catch()` giữ cấu hình cũ đọc được thay vì làm hỏng cả file.
 */
export const UpdaterEndpointSchema = BanTheEndpoint.extend({
    batRieng: z.boolean().prefault(true),
    cheDoKhiTat: z.enum(['gop_vao_narrator']).catch('gop_vao_narrator').prefault('gop_vao_narrator'),
}).prefault({});
/** 46.1 — Diễn Hóa: chạy nhiều lượt tự động cho thế giới tiến hóa. */
export const WorkflowEndpointSchema = BanTheEndpoint.extend({
    batRieng: z.boolean().prefault(false),
}).prefault({});
export const AiConfigSchema = z
    .object({
    narrator: AiEndpointSchema,
    updater: UpdaterEndpointSchema,
    workflow: WorkflowEndpointSchema,
    /**
     * Phần 77.2 — cấu hình rerank thuộc về MÁY, cùng chỗ với ba điểm cuối.
     *
     * Nó không thuộc save vì cùng lý do với `proxyUrl`: một reranker chạy trên
     * máy này không tồn tại trên máy khác. `.prefault({})` nên save cấu hình cũ
     * (v6, chưa có trường này) parse nguyên vẹn và nhận mặc định heuristic.
     */
    rerank: RerankConfigSchema,
})
    .strict()
    .prefault({});
export const CAU_HINH_AI_RONG = AiConfigSchema.parse({});
const laUrlHopLe = (s) => {
    const t = s.trim();
    if (t === '')
        return false;
    if (!/^https?:\/\//i.test(t))
        return false;
    // Không dùng `new URL` để tránh khác biệt giữa Node và trình duyệt cũ.
    return /^https?:\/\/[^\s/?#]+\.?[^\s]*$/i.test(t);
};
/**
 * Điểm cuối này còn thiếu gì trước khi dùng được.
 *
 * Trả về **danh sách**, không phải boolean: người chơi cần biết thiếu cái nào,
 * không cần biết "cấu hình sai". Một thông báo chung chung ở đây là cùng loại
 * lỗi với "không hiểu" ở ô nhập tự do (cổng Phase 4).
 */
export function thieuGiOEndpoint(ep) {
    const ra = [];
    if (!laUrlHopLe(ep.proxyUrl)) {
        ra.push({
            truong: 'proxyUrl',
            thongDiep: 'Chưa có địa chỉ proxy hợp lệ. Địa chỉ phải bắt đầu bằng http:// hoặc https://.',
        });
    }
    if (ep.modelId.trim() === '') {
        ra.push({ truong: 'modelId', thongDiep: 'Chưa chọn model. Quét danh sách rồi chọn một cái.' });
    }
    if (!ep.probe.daDo) {
        ra.push({ truong: 'probe', thongDiep: 'Chưa thử đường. Bấm "Thử đường" để chắc là model trả lời được.' });
    }
    else if (!ep.probe.thong) {
        ra.push({
            truong: 'probe',
            thongDiep: ep.probe.thongDiep.trim() === '' ? 'Lần thử gần nhất không thông.' : ep.probe.thongDiep,
        });
    }
    return ra;
}
/**
 * [BB] ADR-0028 — cửa vào của cả trò chơi.
 *
 * Chỉ điểm cuối **Tường Thuật** quyết định được chơi hay không. Cập Nhật Biến và
 * Diễn Hóa tắt được, vì thiếu chúng thì thế giới vẫn kể được, chỉ là kể xong
 * không tác động ngược.
 */
export function thieuGiDeChoi(cfg) {
    return thieuGiOEndpoint(cfg.narrator);
}
export function congCoMo(cfg) {
    return thieuGiDeChoi(cfg).length === 0;
}
/**
 * Bản cấu hình đã cắt mật khẩu — dùng cho log, chẩn đoán và mọi chỗ hiển thị.
 * Chưa từng có ai cố ý in mật khẩu ra; người ta chỉ in nguyên object.
 */
export function cheMatKhau(cfg) {
    const che = (ep) => ({
        ...ep,
        proxyPassword: ep.proxyPassword === '' ? '' : '••••••',
    });
    return {
        narrator: che(cfg.narrator),
        updater: che(cfg.updater),
        workflow: che(cfg.workflow),
        // Endpoint rerank cũng có mật khẩu, và nó cũng đi vào bảng chẩn đoán (77.11).
        rerank: {
            ...cfg.rerank,
            endpoint: {
                ...cfg.rerank.endpoint,
                proxyPassword: cfg.rerank.endpoint.proxyPassword === '' ? '' : '••••••',
            },
        },
    };
}
/** Sao cấu hình sang điểm cuối khác — 46.3, giữ nguyên mật khẩu riêng nếu đã có. */
export function saoCauHinh(tu, den) {
    return {
        ...den,
        proxyUrl: tu.proxyUrl,
        proxyPassword: den.proxyPassword === '' ? tu.proxyPassword : den.proxyPassword,
        dialect: tu.dialect,
        modelId: tu.modelId,
        profileId: tu.profileId,
        availableModels: [...tu.availableModels],
        params: { ...tu.params },
        // Thăm dò KHÔNG được sao chép: đường của người khác không chứng minh đường của mình.
        probe: ProbeResultSchema.parse({}),
    };
}
