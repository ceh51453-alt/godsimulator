import { tachTu } from './kenh.js';
/**
 * Xếp hạng bằng độ phủ từ khóa có trọng số theo vị trí truy vấn.
 *
 * Cố ý KHÁC BM25 của kênh từ vựng: nếu mock chấm giống hệt kênh đã có thì bài
 * test "semantic đổi thứ tự" sẽ xanh vì lý do sai. Ở đây từ trong `intentText`
 * nặng gấp đôi từ trong `focusText`, và trùng nhiều từ liên tiếp được thưởng —
 * đó là thứ một cross-encoder thật hay bắt được mà BM25 thì không.
 */
export function mockReranker(opt = {}) {
    return {
        ten: 'mock_semantic',
        xepHang(q, ds) {
            if (opt.luonHong === true) {
                return Promise.reject(new Error('mock: endpoint rerank không trả lời'));
            }
            if (opt.traIdLa === true) {
                return Promise.resolve({
                    orderedChunkIds: ['ck_khong_ton_tai_trong_candidate'],
                    latencyMs: opt.latencyGia ?? 0,
                });
            }
            const nang = new Map();
            for (const t of tachTu(q.focusText))
                nang.set(t, (nang.get(t) ?? 0) + 1);
            for (const t of tachTu(q.intentText))
                nang.set(t, (nang.get(t) ?? 0) + 2);
            for (const t of tachTu(q.precedentText))
                nang.set(t, (nang.get(t) ?? 0) + 1);
            const diem = (text) => {
                const tu = tachTu(text);
                if (tu.length === 0)
                    return 0;
                let d = 0;
                let chuoi = 0;
                for (const t of tu) {
                    const w = nang.get(t) ?? 0;
                    if (w > 0) {
                        chuoi++;
                        d += w * (1 + chuoi * 0.25); // cụm từ liên tiếp đáng giá hơn từ rời
                    }
                    else {
                        chuoi = 0;
                    }
                }
                // Chuẩn hóa theo độ dài để đoạn dài không thắng chỉ vì dài.
                return d / Math.sqrt(tu.length);
            };
            const xep = ds
                .map((c) => ({ id: c.chunkId, d: diem(c.projectedText) }))
                .sort((a, b) => b.d - a.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
                .map((x) => x.id);
            return Promise.resolve({
                orderedChunkIds: opt.daoNguoc === true ? [...xep].reverse() : xep,
                latencyMs: opt.latencyGia ?? 0,
            });
        },
    };
}
/**
 * Bộ nhúng giả — cho kênh ngữ nghĩa chạy được trong test mà không cần endpoint.
 *
 * Vector là biểu đồ tần suất âm tiết băm xuống `soChieu` chiều. Thô, nhưng nó
 * có đúng tính chất cần cho test: hai câu gần nghĩa (chung nhiều âm tiết) cho
 * cosine cao, hai câu khác hẳn cho cosine thấp — đúng phép thăm dò thứ bảy mà
 * 54.4 đòi cho model nhúng tiếng Việt.
 */
export function mockBoNhung(soChieu = 64) {
    return {
        nhung(text) {
            const v = new Float32Array(soChieu);
            for (const t of tachTu(text)) {
                let h = 2166136261;
                for (let i = 0; i < t.length; i++) {
                    h ^= t.charCodeAt(i);
                    h = Math.imul(h, 16777619);
                }
                const i = Math.abs(h) % soChieu;
                v[i] = (v[i] ?? 0) + 1;
            }
            return v;
        },
    };
}
