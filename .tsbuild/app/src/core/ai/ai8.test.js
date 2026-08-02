/**
 * Cổng Phase 8 — phần AI: assembler sáu tầng có mạch truyện, ngân sách có trace,
 * Updater tách riêng, và ba khối xuất có cấu trúc.
 *
 * Phase 6b đã chứng minh "Narrator không ghi state" và "patch sai bị từ chối".
 * Ở đây kiểm phần Phase 8 THÊM VÀO:
 *
 *   - tầng 4 mang `kyUcMach`, nút thắt và vai trò (33.1)
 *   - ống kính không ở chỗ người chơi → prompt cấm nhắc tới họ (29.2 quy tắc 5)
 *   - Sổ Phục Bút nằm CUỐI, mục quá hạn lên trước (30.2 + 33.1)
 *   - token budget cắt CÓ TRACE, không cắt im lặng (34.3)
 *   - `<Foreshadow>` và `<Unverified>` bóc được, hỏng thì không làm chết lượt
 *   - Updater có prompt riêng, và nó KHÔNG mang bảy quy tắc Narrator
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { taoState, taoEventLog } from '../engine/state.js';
import { apDungChuoi, apDungEvent } from '../engine/transaction.js';
import { datLaiInvariant } from '../engine/invariant.js';
import { moThuGioi, KhoiTaoWorldSchema } from '../world/khoiTao.js';
import { eventGieoNen } from '../world/gieoNen.js';
import { napBatBienTheGioiSong } from '../world/batBien.js';
import { napBatBienTangThan } from '../world/batBienThan.js';
import { chieu } from '../project/chieu.js';
import { StorylineSchema } from '../schema/truyen.js';
import { bienSoanPromptKe, BAY_QUY_TAC_NARRATOR } from './bienSoan.js';
import { bocTach } from './bocTach.js';
import { bienSoanPromptCapNhat, updaterChayRieng } from './capNhat.js';
import { NGAN_SACH_MAC_DINH, calibMoi, uocLuong, nganSachInput, tuHieuChinh, phanBoSauTang, catTheoTran, } from './nganSach.js';
beforeEach(() => {
    datLaiInvariant();
    napBatBienTheGioiSong();
    napBatBienTangThan();
});
function theGioi(seed = 'ai8') {
    const ct = KhoiTaoWorldSchema.parse({ cua: 'day_du', seed, worldId: 'w1', branchId: 'br_goc' });
    const { world, events } = moThuGioi(ct);
    const state = taoState(world);
    const log = taoEventLog();
    const r = apDungChuoi(state, events, log);
    if (!r.ok)
        throw new Error(r.errors.map((e) => e.message).join('; '));
    const nen = eventGieoNen(state);
    if (nen)
        apDungEvent(state, nen, log);
    return { state, log };
}
function nguLieu(view, them = {}) {
    return {
        view,
        banTin: null,
        loiCau: [],
        canhGanDay: [],
        cauNguoiChoi: '',
        ketQuaEngine: [],
        tenNguoiChoi: 'Người Chơi',
        tyLeToken: 3.2,
        ...them,
    };
}
const MACH = {
    id: 'ml_1',
    ten: 'Món nợ giữa hai nhà',
    loai: 'bao_thu',
    giaiDoan: 'phat_trien',
    cangThang: 62,
    nhanVat: [
        { entityId: 'x', ten: 'Người Thứ Nhất', vaiTro: 'chinh' },
        { entityId: 'y', ten: 'Người Thứ Hai', vaiTro: 'doi_dau' },
    ],
    kyUcMach: 'Mọi chuyện bắt đầu từ một mùa mất mùa và một lời hứa không giữ.',
    nutThatChuaGo: ['Chưa ai dám nói ra chuyện hôm ấy.'],
    phucButChuaTra: ['Con dao ấy còn ở đâu đó.'],
    nguoiChoiBiet: true,
};
// ─────────────────────────────────────────── assembler tầng 4–6
describe('[BB] 33.1 — sáu tầng, mạch truyện ở tầng 4', () => {
    it('tầng 4 mang kyUcMach, nút thắt chưa gỡ và vai trò nhân vật', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null), { machDangChieu: MACH }));
        const t4 = p.tang.find((t) => t.so === 4)?.noiDung ?? '';
        expect(t4).toContain(MACH.kyUcMach);
        expect(t4).toContain('Chưa ai dám nói ra chuyện hôm ấy.');
        expect(t4).toContain('(chinh)');
        expect(t4).toContain('(doi_dau)');
    });
    it('[BB] 29.2 quy tắc 5 — ống kính không ở chỗ người chơi thì prompt CẤM nhắc họ', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', 'mortal_1'), {
            machDangChieu: MACH,
            ongKinhOChoNguoiChoi: false,
        }));
        expect(p.nguoiDung).toContain('Không nhắc tới họ, kể cả gián tiếp');
    });
    it('ống kính Ở chỗ người chơi thì KHÔNG chèn câu cấm ấy', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', 'mortal_1'), {
            machDangChieu: MACH,
            ongKinhOChoNguoiChoi: true,
        }));
        expect(p.nguoiDung).not.toContain('Không nhắc tới họ, kể cả gián tiếp');
    });
    it('[BB] Sổ Phục Bút nằm ở tầng CUỐI, và mục quá hạn được đánh dấu', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null), {
            phucButChuaTra: [
                { noiDung: 'Lời thề chưa giữ.', quaHan: true },
                { noiDung: 'Cái chuông sẽ kêu lần nữa.', quaHan: false },
            ],
        }));
        const t6 = p.tang.find((t) => t.so === 6)?.noiDung ?? '';
        expect(t6).toContain('SỔ PHỤC BÚT');
        expect(t6).toContain('[QUÁ HẠN');
        // Quá hạn lên trước — đó là toàn bộ ý nghĩa của "engine ép model nhớ".
        expect(t6.indexOf('Lời thề chưa giữ.')).toBeLessThan(t6.indexOf('Cái chuông sẽ kêu lần nữa.'));
        // Và nó phải nằm ở tầng cuối, không nằm giữa prompt.
        expect(p.tang[p.tang.length - 1]?.so).toBe(6);
    });
    it('nội dung truy hồi vào tầng 5, và tin đồn được đánh dấu là tin đồn', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', 'mortal_1'), {
            chunkTruyHoi: [
                { nguon: 'bien_nien', text: 'Người ta nói vị thần đã giận.', daBopMeo: true },
                { nguon: 'lorebook', text: 'Dấu máu làm ô uế người đứng gần.', daBopMeo: false },
            ],
        }));
        const t5 = p.tang.find((t) => t.so === 5)?.noiDung ?? '';
        expect(t5).toContain('ĐIỀU CHỦ THỂ NHỚ HOẶC BIẾT');
        expect(t5).toContain('[nghe kể lại, đã sai đi ít nhiều]');
    });
    it('bảy quy tắc Narrator vẫn nguyên vẹn ở tầng 1 sau khi thêm Phase 8', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null), { machDangChieu: MACH }));
        for (const q of BAY_QUY_TAC_NARRATOR)
            expect(p.heThong).toContain(q);
    });
    it('tầng phàm nhân: mạch truyện KHÔNG kéo theo văn bản luật gốc', () => {
        const { state } = theGioi();
        const vanBanThat = [];
        for (const e of state.entities.values()) {
            const l = e.aspects['lawful'];
            if (l?.vanBan && l.vanBan.length > 12)
                vanBanThat.push(l.vanBan);
        }
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'pham_nhan', 'mortal_1'), {
            machDangChieu: MACH,
            chunkTruyHoi: [{ nguon: 'lorebook', text: 'Người ta kể vậy.', daBopMeo: false }],
        }));
        const ca = `${p.heThong}\n${p.nguoiDung}`;
        for (const vb of vanBanThat)
            expect(ca).not.toContain(vb);
    });
});
// ─────────────────────────────────────────── ngân sách
describe('[BB] 34 — ngân sách token và tự hiệu chỉnh', () => {
    it('[BB] 34.2 — KHÔNG dùng công thức length/4 của tiếng Anh', () => {
        const cau = 'Máu đã đổ thì không rửa được.';
        expect(uocLuong(cau, 3.2)).not.toBe(Math.ceil(cau.length / 4));
        expect(uocLuong(cau, 3.2)).toBeGreaterThan(Math.ceil(cau.length / 4));
    });
    it('bảng 34.1 có đủ mọi loại call, và ngân sách input tôn trọng hệ số hiệu chỉnh', () => {
        expect(NGAN_SACH_MAC_DINH.ke_canh.inputMax).toBe(150_000);
        const calib = { ...calibMoi('ke_canh'), heSoInput: 0.85 };
        expect(nganSachInput('ke_canh', calib)).toBe(127_500);
    });
    it('[BB] 34.3 — năm lượt lệch quá 12% thì tyLeToken tự chỉnh VÀ có cảnh báo', () => {
        let c = calibMoi('ke_canh', 3.2);
        let canhBao = [];
        for (let i = 0; i < 5; i++) {
            const r = tuHieuChinh(c, 1_000, 1_500, null, 3_200);
            c = r.calib;
            canhBao = r.canhBao;
        }
        expect(c.tyLeToken).not.toBeCloseTo(3.2, 3);
        expect(canhBao.join(' ')).toContain('lệch quá 12%');
    });
    it('[BB] 34.3 — bị cắt cụt thì giảm input 15% và KHÔNG im lặng', () => {
        const r = tuHieuChinh(calibMoi('ke_canh'), 100, 100, 'length', 5_000);
        expect(r.calib.heSoInput).toBeCloseTo(0.85, 5);
        expect(r.canhBao.join(' ')).toContain('Sổ Nhân Quả và Sổ Phục Bút nằm cuối prompt');
    });
    it('phân bổ sáu tầng: ổn định lên đầu, tổng không vượt ngân sách', () => {
        const pb = phanBoSauTang(100_000);
        expect(pb.map((t) => t.so)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(pb.filter((t) => t.onDinh).map((t) => t.so)).toEqual([1, 2, 3]);
        expect(pb.reduce((t, x) => t + x.tranToken, 0)).toBeLessThanOrEqual(100_000);
    });
    it('[BB] cổng Phase 8 — token budget CÓ TRACE block bị cắt', () => {
        const { tang, vetCat } = catTheoTran([
            { so: 1, ten: 'Lõi bất biến', noiDung: 'x'.repeat(100) },
            { so: 4, ten: 'Mạch truyện', noiDung: 'y'.repeat(100_000) },
        ], phanBoSauTang(1_000), 3.2);
        expect(vetCat).toHaveLength(1);
        expect(vetCat[0]?.tang).toBe(4);
        expect(vetCat[0]?.vi).toContain('vượt trần');
        expect((tang[1]?.noiDung ?? '').length).toBeLessThan(100_000);
    });
    it('prompt có ngân sách thì trả `vetCat`; không có ngân sách thì không cắt gì', () => {
        const { state } = theGioi();
        const khong = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null)));
        expect(khong.vetCat).toEqual([]);
        const co = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null), {
            nganSachToken: 200,
            machDangChieu: MACH,
        }));
        expect(co.vetCat.length).toBeGreaterThan(0);
    });
    it('chunk bị bộ đóng gói bỏ lại được chuyển tiếp vào trace của prompt', () => {
        const { state } = theGioi();
        const p = bienSoanPromptKe(nguLieu(chieu(state, 'sang_the', null), {
            chunkBiCat: [{ chunkId: 'ck_x', vi: 'hết ngân sách token', uocToken: 120 }],
        }));
        expect(p.chunkBiCat).toHaveLength(1);
        expect(p.chunkBiCat[0]?.chunkId).toBe('ck_x');
    });
});
// ─────────────────────────────────────────── ba khối xuất
describe('[BB] 30.2 + 54.10 — Foreshadow và Unverified', () => {
    const nc = { eventId: 'ev1', idHopLe: new Set(['mortal_1']) };
    it('bóc được `<Foreshadow>`, và văn xuôi KHÔNG còn dấu vết khối', () => {
        const raw = 'Ông lão đặt con dao xuống bàn rồi bỏ đi.\n' +
            '<Foreshadow>{"muc":[{"noiDung":"Con dao ấy còn ở đâu đó.","loai":"vat"}]}</Foreshadow>';
        const kq = bocTach(raw, nc);
        expect(kq.phucBut).toHaveLength(1);
        expect(kq.phucBut[0]?.loai).toBe('vat');
        expect(kq.loiKe).not.toContain('Foreshadow');
        expect(kq.loiKe).toContain('Ông lão');
    });
    it('bóc được `<Unverified>` — chỗ bịa thành câu hỏi, không bị xóa', () => {
        const raw = 'Người ta còn nhớ trận lụt năm xưa.\n<Unverified>{"muc":["trận lụt năm xưa"]}</Unverified>';
        const kq = bocTach(raw, nc);
        expect(kq.chuaChungThuc).toEqual(['trận lụt năm xưa']);
        // Câu văn KHÔNG bị cắt: thế giới không phạt AI vì bịa.
        expect(kq.loiKe).toContain('trận lụt năm xưa');
    });
    it('khối hỏng cú pháp không làm chết lượt kể', () => {
        const raw = 'Một cảnh.\n<Foreshadow>{ khong phai json </Foreshadow>';
        const kq = bocTach(raw, nc);
        expect(kq.phucBut).toEqual([]);
        expect(kq.loiKe).toBe('Một cảnh.');
    });
    it('model bị cắt cụt giữa khối: thẻ mở KHÔNG lọt lên khung kể', () => {
        const kq = bocTach('Một cảnh.\n<Foreshadow>{"muc":[{"noiDung":"chưa xong', nc);
        expect(kq.loiKe).toBe('Một cảnh.');
        expect(kq.loiKe).not.toContain('<Foreshadow>');
    });
    it('trần sáu phục bút một lượt — model không rải lời hứa thay vì kể chuyện', () => {
        const muc = Array.from({ length: 20 }, (_, i) => ({ noiDung: `điều ${i}`, loai: 'dieu_bao' }));
        const kq = bocTach(`Cảnh.<Foreshadow>${JSON.stringify({ muc })}</Foreshadow>`, nc);
        expect(kq.phucBut).toHaveLength(6);
    });
    it('ba khối cùng lúc vẫn bóc đủ, và patch vẫn qua đúng ba lớp duyệt', () => {
        const raw = [
            'Một cảnh có thật.',
            '<CapNhat>{"patches":[{"op":"set","target":{"table":"entities","id":"mortal_1","path":"ten"},"value":"Tên Mới"}]}</CapNhat>',
            '<Foreshadow>{"muc":[{"noiDung":"x","loai":"bi_mat"}]}</Foreshadow>',
            '<Unverified>{"muc":["y"]}</Unverified>',
        ].join('\n');
        const kq = bocTach(raw, nc);
        expect(kq.patches).toHaveLength(1);
        expect(kq.phucBut).toHaveLength(1);
        expect(kq.chuaChungThuc).toEqual(['y']);
        expect(kq.loiKe).toBe('Một cảnh có thật.');
    });
    it('patch sai thẩm quyền vẫn bị từ chối dù đi kèm hai khối mới', () => {
        const raw = [
            'Cảnh.',
            '<CapNhat>{"patches":[{"op":"set","target":{"table":"worlds","id":"worlds","path":"playerState.mode"},"value":"than"}]}</CapNhat>',
            '<Foreshadow>{"muc":[{"noiDung":"x","loai":"vat"}]}</Foreshadow>',
        ].join('\n');
        const kq = bocTach(raw, nc);
        expect(kq.patches).toHaveLength(0);
        expect(kq.biTuChoi[0]?.ma).toBe('BANG_CAM');
        // Phục bút vẫn được ghi nhận: hai khối độc lập nhau.
        expect(kq.phucBut).toHaveLength(1);
    });
});
// ─────────────────────────────────────────── Updater tách riêng
describe('[BB] 46.1 — Cập Nhật Biến có điểm cuối riêng', () => {
    it('chỉ chạy riêng khi đã bật VÀ đã cấu hình đủ', () => {
        expect(updaterChayRieng({ batRieng: true, proxyUrl: 'http://x', modelId: 'm' })).toBe(true);
        expect(updaterChayRieng({ batRieng: false, proxyUrl: 'http://x', modelId: 'm' })).toBe(false);
        expect(updaterChayRieng({ batRieng: true, proxyUrl: '', modelId: 'm' })).toBe(false);
        expect(updaterChayRieng({ batRieng: true, proxyUrl: 'http://x', modelId: '' })).toBe(false);
    });
    it('prompt Updater KHÔNG mang bảy quy tắc Narrator — nó không kể chuyện', () => {
        const { state } = theGioi();
        const p = bienSoanPromptCapNhat({
            view: chieu(state, 'sang_the', null),
            loiKe: 'Một cảnh.',
            ketQuaEngine: ['Thời gian trôi tới nhịp 1.'],
            idHopLe: ['mortal_1'],
            tyLeToken: 3.2,
        });
        for (const q of BAY_QUY_TAC_NARRATOR)
            expect(p.heThong).not.toContain(q);
        expect(p.heThong).toContain('Bạn KHÔNG viết văn');
    });
    it('prompt Updater khai đúng bảng trắng và danh sách id hợp lệ', () => {
        const { state } = theGioi();
        const p = bienSoanPromptCapNhat({
            view: chieu(state, 'sang_the', null),
            loiKe: 'Một cảnh.',
            ketQuaEngine: [],
            idHopLe: ['mortal_1', 'deity_1'],
            tyLeToken: 3.2,
        });
        expect(p.heThong).toContain('entities, links, gaps, prayers');
        expect(p.nguoiDung).toContain('mortal_1');
        expect(p.nguoiDung).toContain('deity_1');
    });
    it('Updater vẫn bị `bocTach` duyệt — có điểm cuối riêng không có thẩm quyền riêng', () => {
        const kq = bocTach('<CapNhat>{"patches":[{"op":"set","target":{"table":"entities","id":"mortal_1","path":"aspects.ban_nga.coreSelf.tuBi_tanNhan"},"value":99}]}</CapNhat>', { eventId: 'e', idHopLe: new Set(['mortal_1']) });
        expect(kq.patches).toHaveLength(0);
        expect(kq.biTuChoi[0]?.ma).toBe('DUONG_DAN_CAM');
    });
});
// ─────────────────────────────────────────── mạch truyện trong view
describe('mạch truyện đi vào prompt qua WorldView, không qua World', () => {
    it('assembler chỉ đọc `view.machTruyen`, và view đã lọc sẵn', () => {
        const { state } = theGioi();
        state.storylines.set('ml_an', StorylineSchema.parse({
            id: 'ml_an',
            branchId: 'br_goc',
            ten: 'Mạch giấu',
            loai: 'bao_thu',
            kyUcMach: 'BÍ MẬT KHÔNG ĐƯỢC LỘ',
            nguoiChoiBiet: false,
            tickSinh: 0,
        }));
        const view = chieu(state, 'pham_nhan', 'mortal_1');
        expect(view.machTruyen.map((m) => m.id)).not.toContain('ml_an');
        const p = bienSoanPromptKe(nguLieu(view));
        expect(`${p.heThong}${p.nguoiDung}`).not.toContain('BÍ MẬT KHÔNG ĐƯỢC LỘ');
    });
});
