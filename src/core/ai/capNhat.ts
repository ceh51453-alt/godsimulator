/**
 * Điểm cuối Cập Nhật Biến — Phần 46.1, 46.2 [BB]; món nợ Phase 6b ghi lại.
 *
 * ── Vì sao tách khỏi Narrator ──
 *
 * Phase 6b để Narrator gánh cả hai vai qua khối `<CapNhat>` — tức chế độ
 * `gop_vao_narrator` của 46.2. Nó chạy được, nhưng nó trộn hai việc có yêu cầu
 * ngược nhau: viết văn cần nhiệt độ cao và tự do; rút trạng thái cần nhiệt độ 0
 * và kỷ luật. Một model bị ép làm cả hai sẽ làm tốt một việc và làm hỏng việc kia
 * — và việc bị hỏng thường là việc thứ hai, vì nó nằm cuối output.
 *
 * Tách ra cho phép:
 *   - dùng model rẻ hơn, nhanh hơn cho Updater;
 *   - đặt nhiệt độ 0 cho Updater mà không làm văn Narrator khô đi;
 *   - Updater chết KHÔNG làm mất lời kể (nó chỉ làm mất phần cập nhật).
 *
 * [BB] 71.5 — LLM KHÔNG GIỮ SỔ, và điều đó không nới ra chút nào khi Updater có
 * điểm cuối riêng. Output của nó vẫn đi qua `bocTach()`, vẫn bị bảng trắng bốn
 * bảng và chín đường dẫn cấm chặn. Có điểm cuối riêng không có nghĩa là có
 * thẩm quyền riêng.
 */
import type { WorldView } from '../contracts/view.js';

export type NguLieuCapNhat = {
  readonly view: WorldView;
  /** Văn Narrator vừa viết — thứ Updater phải rút trạng thái từ đó. */
  readonly loiKe: string;
  /** Điều engine ĐÃ quyết ở lượt này. Updater không được mâu thuẫn với nó. */
  readonly ketQuaEngine: readonly string[];
  /** Id entity đang tồn tại — model chỉ được nhắc tới những id này. */
  readonly idHopLe: readonly string[];
  readonly tyLeToken: number;
  /**
   * Rà soát do người chơi chủ động yêu cầu, thay vì chỉ rút trạng thái từ đúng
   * một lượt kể vừa xong. Chế độ này được phép tạo bản ghi còn thiếu bằng
   * `link`, nhưng vẫn đi qua cùng bảng trắng và transaction như mọi patch AI.
   */
  readonly thuCong?: boolean;
};

/**
 * Hợp đồng tạo thực thể dùng chung cho Narrator và Updater.
 *
 * Đặt ở một chỗ để hai model không được học hai cách ghi state khác nhau. Đây
 * là phần tương đương "variables + update rule" của thẻ MVU/inTAVern: model
 * luôn thấy đúng cú pháp tạo bản ghi và hai kind dễ bị khai sai nhất.
 */
export function huongDanTaoThucTheMoi(tick: number): readonly string[] {
  return Object.freeze([
    '- Thứ mới đã thật sự xuất hiện trong lời kể phải được tạo bằng op "link"; target.id và value.id phải giống hệt nhau.',
    '- ID mới phải ổn định, không trùng, chỉ dùng chữ thường không dấu, số và dấu gạch dưới.',
    '- Kind phải dùng đúng id của engine. Vị thần là "deity" (không phải god/than); khái niệm là "concept"; định luật thành văn là "law".',
    '- Khi Thời Gian, Không Gian hoặc một trục Luật Nền được thiết lập, hãy tạo kind "concept", không tạo kind "law". Engine sẽ dùng khái niệm ấy để đặt tên trục.',
    '- Khái niệm nền đã thành hình phải có aspects.conceptual.giaiDoan = "thanh_hinh" và tag tương ứng: Không Gian → noi_chon hoặc khoang_cach; Thời Gian → truoc_sau hoặc bien_doi; Nhân Quả → nguyen_nhan hoặc hau_qua; Danh Tính → ban_nga hoặc cung_mot; Sinh Tử → cai_chet; Nhận Thức → biet hoặc bi_an; Vận Mệnh → tat_yeu.',
    `Mẫu khái niệm Thời Gian: {"op":"link","target":{"table":"entities","id":"concept_thoi_gian","path":""},"value":{"id":"concept_thoi_gian","kind":"concept","ten":"Thời Gian","tickSinh":${tick},"tags":["truoc_sau"],"aspects":{"conceptual":{"giaiDoan":"thanh_hinh"}}}}`,
    `Mẫu vị thần: {"op":"link","target":{"table":"entities","id":"deity_ten_than","path":""},"value":{"id":"deity_ten_than","kind":"deity","ten":"Tên Thần","tickSinh":${tick},"tags":[],"aspects":{}}}`,
    '- Chỉ dùng mẫu khi diễn biến thật sự xác lập thứ đó; không sao chép mẫu thành dữ liệu nếu lời kể không có.',
  ]);
}

/** Trạng thái đã chiếu, đủ gọn để Updater so cũ/mới mà không được thấy World thô. */
function tomTatTrangThai(view: WorldView): readonly string[] {
  const entities = [...view.entities.values()].slice(0, 80).map((e) =>
    JSON.stringify({
      id: e.id,
      kind: e.kind,
      ten: e.ten,
      tags: e.tags,
      aspects: e.aspects,
    }).slice(0, 1_200),
  );
  const laws = view.laws
    .slice(0, 24)
    .map((l) => JSON.stringify({ id: l.id, ten: l.ten, phamVi: l.phamVi, vanBan: l.vanBan }));
  const concepts = view.concepts
    .slice(0, 24)
    .map((c) => JSON.stringify({ id: c.id, ten: c.ten, giaiDoan: c.giaiDoan }));
  return Object.freeze([...entities, ...laws, ...concepts]);
}

/**
 * Prompt Updater.
 *
 * Cố ý KHÔNG có bảy quy tắc Narrator, không có mạch truyện, không có Sổ Phục
 * Bút — Updater không kể chuyện nên nó không cần chúng, và mỗi khối thừa là
 * token trả tiền cho một việc không xảy ra.
 *
 * Cái nó cần và chỉ cần: văn vừa viết, sự thật engine, và danh sách id hợp lệ.
 */
export function bienSoanPromptCapNhat(ng: NguLieuCapNhat): { heThong: string; nguoiDung: string } {
  const ids = ng.idHopLe.slice(0, 120).join(', ');
  const trangThai = tomTatTrangThai(ng.view);
  const huongDanThuCong = ng.thuCong
    ? [
        '',
        'ĐÂY LÀ LẦN RÀ SOÁT THỦ CÔNG DO NGƯỜI CHƠI YÊU CẦU.',
        '- Đối chiếu toàn bộ diễn biến gần đây với trạng thái hiện có; bổ sung thứ đã được kể là tồn tại nhưng còn thiếu trong sổ.',
        '- Nếu diễn biến đã tạo một vị thần mà ID HỢP LỆ chưa có vị ấy, hãy tạo entity kind "deity"; đừng chỉ sửa một luật hay khái niệm cùng tên thành thần.',
        '- Không tạo bản sao của entity đã có. Thà cập nhật bản ghi đúng còn hơn tạo bản ghi gần giống.',
      ]
    : [];

  return {
    heThong: [
      'Bạn là bộ rút trạng thái của một engine mô phỏng. Bạn KHÔNG viết văn.',
      'Việc duy nhất: đọc đoạn văn vừa được kể và khai ra những thay đổi trạng thái mà nó hàm ý.',
      '',
      'Trả về DUY NHẤT các khối dưới đây, không thêm chữ nào ngoài chúng:',
      '<CapNhat>{"patches":[{"op":"set","target":{"table":"entities","id":"...","path":"..."},"value":...}]}</CapNhat>',
      '<Foreshadow>{"muc":[{"noiDung":"...","loai":"dieu_bao"}]}</Foreshadow>',
      '<Unverified>{"muc":["..."]}</Unverified>',
      '',
      'Luật cứng:',
      '- Engine giữ sổ, không phải bạn. Đừng bịa số dân, số của cải, số năm hay tên riêng.',
      '- Chỉ được chạm bảng entities, links, gaps, prayers. Mọi bảng khác bị từ chối.',
      '- Chỉ được SỬA id có trong danh sách bên dưới. Id mới chỉ hợp lệ khi dùng op "link" để tạo trọn bản ghi.',
      ...huongDanTaoThucTheMoi(ng.view.tick),
      '- Không có thay đổi nào thì trả khối rỗng: <CapNhat>{"patches":[]}</CapNhat>',
      '- Thà khai thiếu còn hơn khai sai: engine từ chối được, nhưng nó không đoán lại được.',
      ...huongDanThuCong,
      '',
      // [BB] 54.10 — chỗ bịa không bị xóa, nó thành câu hỏi chưa có lời đáp.
      'Khối <Unverified> liệt kê những khẳng định về QUÁ KHỨ trong đoạn văn mà dữ liệu',
      'dưới đây không chứng thực được. Chúng không bị coi là lỗi; chúng trở thành bí ẩn.',
    ].join('\n'),
    nguoiDung: [
      `NHỊP: ${ng.view.tick}. TẦNG: ${ng.view.mode}.`,
      '',
      'ENGINE ĐÃ QUYẾT (đây là sự thật, đừng khai ngược lại):',
      ...ng.ketQuaEngine.map((k) => `- ${k}`),
      '',
      'ID HỢP LỆ:',
      ids,
      '',
      'TRẠNG THÁI HIỆN TẠI ĐÃ ĐƯỢC PHÉP THẤY (JSON mỗi dòng):',
      ...(trangThai.length > 0 ? trangThai : ['(trống)']),
      '',
      ng.thuCong ? 'DIỄN BIẾN GẦN ĐÂY CẦN RÀ SOÁT:' : 'ĐOẠN VĂN VỪA KỂ:',
      ng.loiKe,
    ].join('\n'),
  };
}

/**
 * Updater có được gọi riêng không.
 *
 * `batRieng = false` → khối `<CapNhat>` đi kèm lời kể của Narrator (hành vi Phase
 * 6b). [BB] ADR-0056 — không còn chế độ "chỉ engine": tắt điểm cuối này chỉ đổi
 * AI nào viết khối cập nhật, không bao giờ đổi thành "không cần AI".
 */
export function updaterChayRieng(cfg: { batRieng: boolean; proxyUrl: string; modelId: string }): boolean {
  return cfg.batRieng && cfg.proxyUrl.trim() !== '' && cfg.modelId.trim() !== '';
}
