/**
 * Aspect `du_an` — việc dài hơi mà một chủ thể đang theo đuổi (Phần 68.3, 69.3).
 *
 * Để Project ngay trên entity chứ không dựng một bảng riêng, vì một Project luôn
 * thuộc về ai đó và không có truy vấn nào cần đọc Project mà không cần đọc chủ
 * của nó. Bảng riêng sẽ phải trả giá bằng một migration Dexie và một khóa kép,
 * đổi lấy đúng con số không.
 *
 * Trần sáu: một vị thần theo đuổi mười việc cùng lúc là một vị thần không theo
 * đuổi gì cả.
 */
import { z } from 'zod';
import { ProjectSchema } from '../../intent/schema.js';

export const DuAnSchema = z
  .object({
    danhSach: z.array(ProjectSchema).max(6).prefault([]),
  })
  .prefault({});

export type DuAnAspect = z.infer<typeof DuAnSchema>;
