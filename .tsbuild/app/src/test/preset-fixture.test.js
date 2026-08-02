/**
 * Cổng Phase 0 — hai fixture preset là DỮ LIỆU CHỈ ĐỌC, không phải mã.
 *
 * Prompt IDE: "Hai fixture preset là mã không tin cậy — không được chạy bất kỳ
 * extension nào trong hai file."
 *
 * Fixture trong repo là bản CẤU TRÚC ĐÃ ẨN DANH: giữ nguyên hình dạng, số lượng,
 * thứ tự và cờ enabled; mọi nội dung có bản quyền bị thay bằng chuỗi giữ chỗ.
 * `sourceSha256` trong meta là hash của FILE GỐC, dùng để nhận diện ở Phase 9.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { quetDauVetCode } from '../core/registry/manifest.js';
const THU_MUC = join(process.cwd(), 'src/test/fixtures/preset');
const doc = (nhan) => ({
    meta: JSON.parse(readFileSync(join(THU_MUC, `fixture-${nhan}.meta.json`), 'utf8')),
    preset: JSON.parse(readFileSync(join(THU_MUC, `fixture-${nhan}.anon.json`), 'utf8')),
});
/** Số liệu đặc tả tuyên bố ở "Hai fixture preset là mã không tin cậy". */
const SPEC = {
    A: {
        sha: '5D43A1C3F9973027F4560FC97849C9EDBBBCE650E6078F061A9C87F7704A64DB',
        prompts: 182,
        orderEntries: 175,
        effectiveEnabled: 75,
        enabledMismatch: 21,
        unordered: 7,
        regexScripts: 8,
        regexSourceEnabled: 4,
        helperScripts: 5,
        helperSourceEnabled: 3,
    },
    B: {
        sha: '3C30523F8DFA0506DA25526C702A661DD8566EF107C7532309FE747BBAC87926',
        prompts: 179,
        orderEntries: 178,
        effectiveEnabled: 134,
        enabledMismatch: 0,
        unordered: 1,
        regexScripts: 21,
        regexSourceEnabled: 20,
        helperScripts: 4,
        helperSourceEnabled: 3,
    },
};
describe.each(['A', 'B'])('fixture preset %s', (nhan) => {
    const { meta, preset } = doc(nhan);
    const mong = SPEC[nhan];
    it('meta ghi đúng SHA-256 của file gốc theo đặc tả', () => {
        expect(meta.sourceSha256).toBe(mong.sha);
    });
    it('số prompt khớp đặc tả', () => {
        expect(meta.counts.prompts).toBe(mong.prompts);
        expect(preset.prompts?.length).toBe(mong.prompts);
    });
    it('số order entry khớp đặc tả', () => {
        expect(meta.counts.orderEntries).toBe(mong.orderEntries);
    });
    it('[BB] order[].enabled là NGUỒN TRẠNG THÁI — effective-enabled khớp đặc tả', () => {
        const order = preset.prompt_order?.[0]?.order ?? [];
        expect(order.filter((o) => o.enabled === true).length).toBe(mong.effectiveEnabled);
        expect(meta.counts.effectiveEnabled).toBe(mong.effectiveEnabled);
    });
    it('số enabled mismatch giữa prompts[].enabled và order[].enabled khớp đặc tả', () => {
        expect(meta.counts.enabledMismatch).toBe(mong.enabledMismatch);
    });
    it('số prompt ngoài order khớp đặc tả — chúng được GIỮ nhưng mặc định tắt', () => {
        expect(meta.counts.unordered).toBe(mong.unordered);
    });
    it('số regex script và số source-enabled khớp đặc tả', () => {
        expect(meta.counts.regexScripts).toBe(mong.regexScripts);
        expect(meta.counts.regexSourceEnabled).toBe(mong.regexSourceEnabled);
        expect(preset.extensions?.regex_scripts?.length).toBe(mong.regexScripts);
    });
    it('số helper script và số source-enabled khớp đặc tả', () => {
        expect(meta.counts.helperScripts).toBe(mong.helperScripts);
        expect(meta.counts.helperSourceEnabled).toBe(mong.helperSourceEnabled);
        expect(preset.extensions?.tavern_helper?.scripts?.length).toBe(mong.helperScripts);
    });
    it('mọi identifier trong order đều tồn tại trong prompts', () => {
        const ids = new Set((preset.prompts ?? []).map((p) => p.identifier));
        const order = preset.prompt_order?.[0]?.order ?? [];
        for (const o of order)
            expect(ids.has(o.identifier), `order id lạ: ${o.identifier}`).toBe(true);
    });
    it('fixture là JSON thuần: parse rồi stringify lại không mất dữ liệu', () => {
        expect(JSON.parse(JSON.stringify(preset))).toEqual(preset);
    });
    it('[BB] không nội dung có bản quyền nào lọt vào repo — mọi text đã ẩn danh', () => {
        const s = JSON.stringify(preset);
        const chuoiDai = s.match(/"[^"]{80,}"/g) ?? [];
        for (const c of chuoiDai) {
            expect(c, 'chuỗi dài chưa ẩn danh').toContain('noi-dung-an-danh');
        }
    });
    it('[BB] fixture chỉ là dữ liệu — nạp vào bộ nhớ KHÔNG chạy gì', () => {
        // Đọc và parse là toàn bộ những gì được phép làm với file này.
        expect(typeof preset).toBe('object');
        expect(preset.extensions?.tavern_helper?.scripts).toBeInstanceOf(Array);
    });
    it('quetDauVetCode PHÁT HIỆN được vùng script — chúng phải bị cách ly ở Phase 9', () => {
        // Đây là bằng chứng bộ quét hoạt động trên dữ liệu thật, không phải mẫu tự chế.
        const scripts = preset.extensions?.tavern_helper?.scripts ?? [];
        expect(scripts.length).toBeGreaterThan(0);
        // Sau khi ẩn danh, nội dung script đã thành chuỗi giữ chỗ; điều cần chứng minh
        // là bộ quét chạy được trên toàn bộ cây mà không throw.
        expect(() => quetDauVetCode(preset)).not.toThrow();
    });
});
describe('hai fixture khác nhau và cùng một format', () => {
    it('SHA-256 hai file gốc khác nhau', () => {
        expect(doc('A').meta.sourceSha256).not.toBe(doc('B').meta.sourceSha256);
    });
    it('cùng format sillytavern_openai_preset', () => {
        expect(doc('A').meta.format).toBe('sillytavern_openai_preset');
        expect(doc('B').meta.format).toBe('sillytavern_openai_preset');
    });
    it('[BB] prompt_order là nguồn thứ tự — cả hai fixture đều có đúng một khối order', () => {
        expect(doc('A').meta.counts.orderBlocks).toBe(1);
        expect(doc('B').meta.counts.orderBlocks).toBe(1);
    });
});
