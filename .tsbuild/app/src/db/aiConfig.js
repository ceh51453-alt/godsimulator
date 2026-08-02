import { AiConfigSchema, CAU_HINH_AI_RONG } from '../core/ai/cauHinh.js';
export const KHOA_CAU_HINH_AI = 'may_nay';
/**
 * Đọc cấu hình. Bản ghi hỏng KHÔNG được ném lỗi ra ngoài — nó chỉ có nghĩa là
 * người chơi phải điền lại form, và đó là màn hình có sẵn chứ không phải sự cố.
 */
export async function docCauHinhAi(db) {
    const hang = await db.aiConfigs.get(KHOA_CAU_HINH_AI);
    if (!hang)
        return CAU_HINH_AI_RONG;
    const kq = AiConfigSchema.safeParse(hang.cauHinh);
    return kq.success ? kq.data : CAU_HINH_AI_RONG;
}
export async function luuCauHinhAi(db, cfg) {
    await db.aiConfigs.put({ id: KHOA_CAU_HINH_AI, cauHinh: AiConfigSchema.parse(cfg) });
}
export async function xoaCauHinhAi(db) {
    await db.aiConfigs.delete(KHOA_CAU_HINH_AI);
}
