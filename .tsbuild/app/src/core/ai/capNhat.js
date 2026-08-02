/**
 * Prompt Updater.
 *
 * Cố ý KHÔNG có bảy quy tắc Narrator, không có mạch truyện, không có Sổ Phục
 * Bút — Updater không kể chuyện nên nó không cần chúng, và mỗi khối thừa là
 * token trả tiền cho một việc không xảy ra.
 *
 * Cái nó cần và chỉ cần: văn vừa viết, sự thật engine, và danh sách id hợp lệ.
 */
export function bienSoanPromptCapNhat(ng) {
    const ids = ng.idHopLe.slice(0, 120).join(', ');
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
            '- Chỉ được nhắc tới id có trong danh sách bên dưới. Id lạ bị từ chối cả lô.',
            '- Không có thay đổi nào thì trả khối rỗng: <CapNhat>{"patches":[]}</CapNhat>',
            '- Thà khai thiếu còn hơn khai sai: engine từ chối được, nhưng nó không đoán lại được.',
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
            'ĐOẠN VĂN VỪA KỂ:',
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
export function updaterChayRieng(cfg) {
    return cfg.batRieng && cfg.proxyUrl.trim() !== '' && cfg.modelId.trim() !== '';
}
