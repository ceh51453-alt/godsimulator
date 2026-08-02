/**
 * Hai bảng của Phase 5: `knowledge` và `debts`.
 *
 * Vì sao chúng là BẢNG chứ không phải trường trong aspect:
 *
 *   - Tri thức có **chủ thể biết** và **đường đi**. Bất biến "không tri thức
 *     teleport" (71.4) phải tra được: ai biết trước, biết lúc nào, qua tuyến nào.
 *     Nhét vào aspect thì không tra ngược được.
 *   - Nợ có **hai đầu** (chủ nợ, con nợ) thường ở hai vùng. Cất trong aspect của
 *     một bên là mời gọi hai bản sao lệch nhau.
 *
 * `docs/SCHEMA_DB_MATRIX.md` đã đặt chỗ cho cả hai từ Phase 0.
 */
import { z } from 'zod';
import { KnowledgeRecordSchema } from '../intent/schema.js';
import { DebtSchema } from '../contracts/primitives.js';
/**
 * Một dòng tri thức = một (người biết, mệnh đề).
 *
 * `knowerId` thường là một `place` ở độ phân giải macro — cả vùng biết chuyện —
 * và là entity cụ thể ở độ phân giải micro.
 */
export const KnowledgeRowSchema = z
    .object({
    /** Khóa bảng: `kn_<knowerId>_<factId>`. Tra ngược được cả hai đầu. */
    id: z.string(),
    branchId: z.string(),
    ...KnowledgeRecordSchema.shape,
    /** Tuyến đường mà tin đã đi qua để tới đây. Rỗng nghĩa là tự chứng kiến. */
    duongIds: z.array(z.string()).prefault([]),
})
    .strict();
export const DebtRowSchema = z
    .object({
    branchId: z.string(),
    ...DebtSchema.shape,
    tickTao: z.number().int().prefault(0),
    /** Event khai sinh món nợ — không có nó thì nợ là số từ trên trời rơi xuống. */
    nguonEventId: z.string().prefault(''),
})
    .strict();
/** Khóa chuẩn của một dòng tri thức. Dùng ở mọi nơi để tránh lệch quy ước. */
export function khoaTriThuc(knowerId, factId) {
    return `kn_${knowerId}_${factId}`;
}
