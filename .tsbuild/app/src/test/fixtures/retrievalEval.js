/**
 * Fixture retrieval-eval — Phase 0 deliverable, dùng cho Phase 8/10.
 *
 * Chứa đủ bốn loại chunk mà Prompt IDE đòi hỏi:
 *   - đúng      (relevant)
 *   - nhiễu     (noise, cùng chủ đề nhưng không trả lời được câu hỏi)
 *   - trùng     (near-duplicate, cùng `nguonId` — MMR phải phạt)
 *   - CẤM       (forbidden: chủ thể KHÔNG được biết → forbidden recall phải = 0)
 *
 * [BB] Chunk cấm ở đây tồn tại để CHỨNG MINH nó không bao giờ lọt ra —
 * không phải để lọc sau khi đã chấm điểm.
 */
import { RetrievalEvalCaseSchema } from '../../core/schema/rerank.js';
import { BRANCH_GOC } from './world.js';
const c = (id, nguonId, noiDung, aiDuocNhin, opt = {}) => ({
    id,
    branchId: BRANCH_GOC,
    sourceType: opt.sourceType ?? 'lorebook',
    nguonId,
    noiDung,
    tick: opt.tick ?? 100,
    trust: opt.trust ?? 0.8,
    aiDuocNhin,
    entityIds: opt.entityIds ?? [],
});
export const CHUNKS_EVAL = [
    // ── ĐÚNG cho câu hỏi của phàm nhân về "luật của thế giới này"
    c('ck_dg_thung_lung', 'nguon_dien_giai_thung_lung', 'Người già trong thung lũng dạy rằng kẻ mang dấu máu làm ô uế người đứng gần.', ['tat_ca'], { entityIds: ['law_mau', 'place_thung_lung'], trust: 0.55 }),
    c('ck_dg_bo_song', 'nguon_dien_giai_bo_song', 'Bên bờ sông, người ta tin nước rằm rửa được dấu máu nếu lòng thành.', ['tat_ca'], { entityIds: ['law_mau', 'place_bo_song'], trust: 0.5 }),
    // ── TRÙNG: cùng nguonId với ck_dg_thung_lung, chữ khác
    c('ck_dg_thung_lung_2', 'nguon_dien_giai_thung_lung', 'Ở Thung Lũng Tro, ai chạm phải kẻ có dấu thì cũng thành ô uế theo.', ['tat_ca'], { entityIds: ['law_mau', 'place_thung_lung'], trust: 0.52 }),
    // ── NHIỄU: đúng chủ đề, không trả lời được câu hỏi
    c('ck_nhieu_le_hoi', 'nguon_bien_nien', 'Năm 288, lễ hội thuyền hoa bên sông Mê kéo dài chín ngày.', ['tat_ca'], { sourceType: 'bien_nien', trust: 0.9 }),
    c('ck_nhieu_nghe_ca', 'nguon_bien_nien', 'Nghề đan lưới ở thung lũng suy tàn sau khi đàn cá bạc bỏ đi.', ['tat_ca'], { sourceType: 'bien_nien', trust: 0.9 }),
    // ── CẤM: văn bản luật gốc. [BB] Phần 18.2 — phàm nhân KHÔNG BAO GIỜ được thấy.
    c('ck_cam_van_ban_luat', 'nguon_luat_goc', 'Văn bản luật: "Máu đã đổ thì không rửa được." Kích hoạt: gay_chay_mau.', ['sang_the'], { sourceType: 'luat_goc', trust: 1 }),
    // ── CẤM: bản tính thật của thần. Phàm nhân chỉ được thấy banTinhTinDoTin.
    c('ck_cam_ban_tinh_that', 'nguon_hon_pho', 'Bản tính thật của Đấng Tẩy Uế: từ bi, khiêm nhường; ngài chưa từng đòi hỏi trừng phạt.', ['sang_the'], { sourceType: 'hon_pho', trust: 1 }),
    // ── CẤM: kẽ hở engine đã biết nhưng chưa ai trong thế giới khám phá ra.
    c('ck_cam_ke_ho', 'nguon_ke_ho', 'Kẽ hở: bóp cổ không gây chảy máu nên không kích hoạt luật.', ['sang_the'], { sourceType: 'ke_ho', trust: 1 }),
];
export const CHUNK_CAM = ['ck_cam_van_ban_luat', 'ck_cam_ban_tinh_that', 'ck_cam_ke_ho'];
export const EVAL_CASES = [
    RetrievalEvalCaseSchema.parse({
        id: 'eval_pham_hoi_luat',
        mode: 'pham_nhan',
        chuTheId: 'mortal_ly',
        task: 'narrate_scene',
        query: 'Luật của thế giới này là gì?',
        // [BB] Phần 18.3 — câu trả lời đúng là TRUYỀN THUYẾT, và nó phải SAI ở chỗ doLech.
        relevantChunkIds: ['ck_dg_thung_lung', 'ck_dg_bo_song'],
        forbiddenChunkIds: [...CHUNK_CAM],
        diversityGroups: {
            nguon_dien_giai_thung_lung: ['ck_dg_thung_lung', 'ck_dg_thung_lung_2'],
            nguon_bien_nien: ['ck_nhieu_le_hoi', 'ck_nhieu_nghe_ca'],
        },
    }),
    RetrievalEvalCaseSchema.parse({
        id: 'eval_than_trong_domain',
        mode: 'than',
        chuTheId: 'deity_tay_ue',
        task: 'answer_prayer',
        query: 'Vì sao dân bờ sông tin nước rằm rửa được dấu?',
        relevantChunkIds: ['ck_dg_bo_song'],
        // Thần thấy được văn bản luật TRONG domain, nhưng kẽ hở engine thì không.
        forbiddenChunkIds: ['ck_cam_ke_ho'],
        diversityGroups: {},
    }),
    RetrievalEvalCaseSchema.parse({
        id: 'eval_sang_the_toan_canh',
        mode: 'sang_the',
        chuTheId: null,
        task: 'world_report',
        query: 'Luật máu đã tạo ra những gì?',
        relevantChunkIds: ['ck_dg_thung_lung', 'ck_dg_bo_song', 'ck_cam_van_ban_luat'],
        // Sáng Thế thấy tất cả — không có chunk cấm.
        forbiddenChunkIds: [],
        diversityGroups: {
            nguon_dien_giai_thung_lung: ['ck_dg_thung_lung', 'ck_dg_thung_lung_2'],
        },
    }),
];
/** Chunk nào chủ thể được nhìn — dùng cho visibility filter trong test. */
export function duocNhin(chunk, mode, chuTheId) {
    if (chunk.aiDuocNhin.includes('tat_ca'))
        return true;
    if (chunk.aiDuocNhin.includes(mode))
        return true;
    return chuTheId !== null && chunk.aiDuocNhin.includes(chuTheId);
}
