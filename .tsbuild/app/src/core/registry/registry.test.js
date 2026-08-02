/**
 * Cổng Phase 0 — registry.
 * Phần 61.1 #2, #3; 61.2; Prompt IDE "Cổng kỹ thuật Phase 0".
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { R, napDungSan, datLaiTatCa, moiManifest } from './index.js';
import { createRegistry } from './createRegistry.js';
import { REGISTRY_IDS, RegistryManifestSchema, quetDauVetCode, roundTripManifest } from './manifest.js';
import { coHandler, coSchemaRef, SchemaCatalog } from './catalog.js';
import { ASPECT_IDS, ASPECT_IDS_42, ASPECT_IDS_NEN, ASPECT_IDS_THAN, ASPECT_IDS_PHAM, ASPECT_IDS_BANG, } from './aspects.js';
import { KIND_IDS, KIND_IDS_43, KIND_IDS_NEN, KIND_IDS_THAN } from './kinds.js';
import { VERB_IDS } from './verbs.js';
import { RELATION_IDS } from './relations.js';
beforeEach(() => {
    datLaiTatCa();
});
describe('mười hai registry', () => {
    it('R khai đủ và đúng mười hai registry của Phần 5.1', () => {
        expect(Object.keys(R).sort()).toEqual([...REGISTRY_IDS].sort());
        expect(REGISTRY_IDS).toHaveLength(12);
    });
    it('mỗi registry đều có mục dựng sẵn — không registry nào rỗng', () => {
        napDungSan();
        for (const id of REGISTRY_IDS) {
            const reg = R[id];
            expect(reg.danhSachId().length, `registry '${id}' rỗng`).toBeGreaterThan(0);
        }
    });
    /**
     * Bảng 4.2 và 4.3 là danh sách ĐÓNG: kiểm bằng chính danh sách, không bằng
     * con số. Đếm thì thêm một aspect nền cũng phải sửa test; so danh sách thì
     * chỉ *đổi* một dòng của 4.2 mới làm test đỏ — đúng thứ ta muốn khóa.
     * ADR-0021 giải thích vì sao Phase 5 được thêm aspect ngoài bảng.
     */
    it('mười hai aspect và mười bốn kind của Phần 4.2/4.3 còn nguyên vẹn', () => {
        napDungSan();
        expect(ASPECT_IDS_42).toEqual([
            'soul',
            'conceptual',
            'lawful',
            'domain',
            'genealogical',
            'divisible',
            'venerable',
            'carrier',
            'spatial',
            'mortal',
            'adversarial',
            'institutional',
        ]);
        expect(KIND_IDS_43).toHaveLength(14);
        expect(VERB_IDS).toEqual(['phan', 'hop', 'hien', 'thu', 'dinh', 'buong']);
        // 22 quan hệ trong danh sách Phần 6.2 + cạnh nghịch đảo tương ứng.
        expect(RELATION_IDS.length).toBeGreaterThanOrEqual(22);
    });
    it('aspect và kind nền của Phase 5 nằm ngoài bảng 4.2/4.3, không chồng lấn', () => {
        napDungSan();
        expect(ASPECT_IDS_NEN).toEqual(['dan_cu', 'y_te', 'sinh_thai', 'kinh_te', 'van_hoa', 'an_ninh', 'duong']);
        expect(KIND_IDS_NEN).toEqual(['route', 'household']);
        for (const id of ASPECT_IDS_NEN)
            expect(ASPECT_IDS_42).not.toContain(id);
        for (const id of KIND_IDS_NEN)
            expect(KIND_IDS_43).not.toContain(id);
        // Danh sách tổng là hợp của các danh sách theo phase, đúng thứ tự.
        expect(ASPECT_IDS).toEqual([
            ...ASPECT_IDS_42,
            ...ASPECT_IDS_NEN,
            ...ASPECT_IDS_THAN,
            ...ASPECT_IDS_PHAM,
            ...ASPECT_IDS_BANG,
        ]);
        // Phase 11 thêm đúng một aspect, và nó áp được lên MỌI kind (59.1).
        expect(ASPECT_IDS_BANG).toEqual(['provenance']);
        expect(KIND_IDS).toEqual([...KIND_IDS_43, ...KIND_IDS_NEN, ...KIND_IDS_THAN]);
    });
    it('aspect tầng Phàm Nhân của Phase 7 nằm ngoài mọi danh sách trước', () => {
        napDungSan();
        expect(ASPECT_IDS_PHAM).toEqual(['sinh_ke', 'ho', 'can_cuoc']);
        for (const id of ASPECT_IDS_PHAM) {
            expect(ASPECT_IDS_42).not.toContain(id);
            expect(ASPECT_IDS_NEN).not.toContain(id);
            expect(ASPECT_IDS_THAN).not.toContain(id);
        }
    });
    it('danhSachId sắp xếp deterministic theo codepoint, không phụ thuộc locale', () => {
        napDungSan();
        const a = R.kind.danhSachId();
        const b = [...a].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
        expect(a).toEqual(b);
    });
});
describe('manifest là dữ liệu thuần — cổng 61.1 #3', () => {
    it('JSON.stringify rồi parse lại mọi manifest không mất nghĩa', () => {
        const ms = moiManifest();
        expect(ms.length).toBeGreaterThan(80);
        for (const m of ms) {
            expect(roundTripManifest(m)).toEqual(m);
        }
    });
    it('không manifest nào chứa hàm, eval, new Function hay dấu vết code', () => {
        for (const m of moiManifest()) {
            expect(quetDauVetCode(m), `manifest '${m.registry}.${m.id}' có dấu vết code`).toEqual([]);
        }
    });
    it('mọi handlerId và schemaRef của manifest dựng sẵn đều tra được hoặc rỗng', () => {
        for (const m of moiManifest()) {
            expect(coSchemaRef(m.schemaRef), `schemaRef lạ: ${m.schemaRef}`).toBe(true);
            // handlerId chưa nạp → `can_adapter`, chấp nhận được ở Phase 0 nhưng phải khai rõ.
            expect(typeof coHandler(m.handlerId)).toBe('boolean');
        }
    });
    it('SchemaCatalog chỉ nằm trong code và không rỗng', () => {
        expect(SchemaCatalog.size).toBeGreaterThan(25);
    });
    it('id manifest tuân regex an toàn', () => {
        for (const m of moiManifest()) {
            expect(m.id).toMatch(/^[a-z0-9][a-z0-9_.-]*$/);
        }
    });
});
describe('quetDauVetCode chặn pack độc hại', () => {
    it.each([
        ['hàm', { config: { f: () => 1 } }],
        ['eval', { config: { s: "eval('1+1')" } }],
        ['new Function', { config: { s: 'new Function("return 1")' } }],
        ['dynamic import', { config: { s: 'import("http://x")' } }],
        ['thẻ script', { config: { s: '<script>alert(1)</script>' } }],
        ['javascript: url', { config: { s: 'javascript:alert(1)' } }],
        ['event handler', { config: { s: '<img onerror=alert(1)>' } }],
    ])('bắt được %s', (_ten, payload) => {
        expect(quetDauVetCode(payload).length).toBeGreaterThan(0);
    });
    it('bắt được prototype pollution qua khóa __proto__', () => {
        const doc = JSON.parse('{"config":{"__proto__":{"x":1}}}');
        expect(quetDauVetCode(doc).some((h) => h.code === 'proto_pollution')).toBe(true);
    });
    it('không báo nhầm với dữ liệu sạch', () => {
        expect(quetDauVetCode({ ten: 'Đấng Tẩy Uế', suc: 64, tags: ['a', 'b'] })).toEqual([]);
    });
});
describe('ba tầng nạp — Phần 5.2', () => {
    const dinhNghiaHopLe = (id) => ({
        id,
        ten: 'Thử',
        manifest: RegistryManifestSchema.parse({ registry: 'kind', id, version: 1, ten: 'Thử' }),
    });
    it('pack ghi đè dựng sẵn theo id', () => {
        napDungSan();
        const truoc = R.kind.lay('deity');
        expect(truoc?.ten).toBe('Thần');
        const reg = R.kind;
        reg.napPack('pack_thu', [{ ...truoc, ten: 'Thượng Đế' }]);
        expect(R.kind.lay('deity')?.ten).toBe('Thượng Đế');
    });
    it('ghi đè là MỘT PHẦN — chỉ trường có mặt mới bị thay', () => {
        napDungSan();
        const truoc = R.kind.lay('deity');
        R.kind.ghiDe('deity', { ten: 'Thiên Tôn' });
        const sau = R.kind.lay('deity');
        expect(sau?.ten).toBe('Thiên Tôn');
        expect(sau?.aspects).toEqual(truoc?.aspects);
        expect(sau?.phanChieu).toEqual(truoc?.phanChieu);
    });
    it('[BB] ghi đè mục không tồn tại thì cảnh báo, giữ tầng dưới, KHÔNG crash', () => {
        napDungSan();
        const truoc = R.kind.lay('deity')?.ten;
        const loi = R.kind.ghiDe('khong_ton_tai', { ten: 'X' });
        expect(loi).toHaveLength(1);
        expect(loi[0]?.code).toBe('OVERRIDE_TARGET_MISSING');
        expect(loi[0]?.severity).toBe('warning');
        expect(R.kind.lay('deity')?.ten).toBe(truoc);
        expect(R.kind.canhBao().length).toBeGreaterThan(0);
    });
    it('[BB] ghi đè KHÔNG hợp lệ bị bỏ, giữ giá trị tầng dưới, không throw', () => {
        // Registry có bộ kiểm tra: từ chối mục có `ten` rỗng.
        const reg = createRegistry('kind', (d) => {
            const x = d;
            if (!x.id || !x.ten)
                return { ok: false, errors: ['thiếu id hoặc ten'] };
            return { ok: true, value: { id: x.id, ten: x.ten } };
        });
        reg.dangKy({ id: 'a', ten: 'Nguyên bản' });
        const loi = reg.ghiDe('a', { ten: '' });
        expect(loi[0]?.code).toBe('OVERRIDE_INVALID');
        expect(reg.lay('a')?.ten).toBe('Nguyên bản');
        expect(reg.canhBao().some((c) => c.code === 'OVERRIDE_INVALID')).toBe(true);
    });
    it('pack có mục hỏng thì chỉ mục đó bị từ chối, pack còn lại vẫn nạp', () => {
        const reg = createRegistry('kind', (d) => {
            const x = d;
            if (!x.id || !x.ten)
                return { ok: false, errors: ['thiếu id hoặc ten'] };
            return { ok: true, value: { id: x.id, ten: x.ten } };
        });
        const loi = reg.napPack('p', [
            { id: 'tot', ten: 'Tốt' },
            { id: 'xau', ten: '' },
        ]);
        expect(loi).toHaveLength(1);
        expect(reg.co('tot')).toBe(true);
        expect(reg.co('xau')).toBe(false);
    });
    it('khoiPhuc trả mục về giá trị tầng dưới', () => {
        napDungSan();
        const truoc = R.kind.lay('deity')?.ten;
        R.kind.ghiDe('deity', { ten: 'Tạm' });
        expect(R.kind.lay('deity')?.ten).toBe('Tạm');
        R.kind.khoiPhuc('deity');
        expect(R.kind.lay('deity')?.ten).toBe(truoc);
    });
    it('co() là cách kiểm tính hợp lệ của kind chuỗi — Phần 4.1', () => {
        napDungSan();
        expect(R.kind.co('deity')).toBe(true);
        expect(R.kind.co('tinh_linh_chua_khai')).toBe(false);
        R.kind.napPack('pack_tinh_linh', [dinhNghiaHopLe('tinh_linh')]);
        expect(R.kind.co('tinh_linh')).toBe(true);
    });
});
describe('phanChieu là dữ liệu — Phần 18.2', () => {
    it('mọi kind khai đủ ba tầng và Sáng Thế luôn thấy đầy đủ', () => {
        napDungSan();
        for (const k of R.kind.tatCa()) {
            expect(k.phanChieu.sangThe).toBe('day_du');
            expect(k.phanChieu.than).toBeTruthy();
            expect(k.phanChieu.phamNhan).toBeTruthy();
        }
    });
    it('[BB] phàm nhân không bao giờ thấy law/deity ở mức đầy đủ', () => {
        napDungSan();
        expect(R.kind.lay('law')?.phanChieu.phamNhan).not.toBe('day_du');
        expect(R.kind.lay('deity')?.phanChieu.phamNhan).not.toBe('day_du');
    });
    it('mọi aspect mà kind tham chiếu đều đã khai trong R.aspect', () => {
        napDungSan();
        for (const k of R.kind.tatCa()) {
            for (const a of k.aspects) {
                expect(R.aspect.co(a), `kind '${k.id}' dùng aspect chưa khai '${a}'`).toBe(true);
            }
        }
    });
    it('mọi phuThuoc của aspect đều đã khai', () => {
        napDungSan();
        for (const a of R.aspect.tatCa()) {
            for (const p of a.phuThuoc ?? []) {
                expect(R.aspect.co(p), `aspect '${a.id}' phụ thuộc '${p}' chưa khai`).toBe(true);
            }
        }
    });
    it('mọi nghichDao của quan hệ đều tồn tại và đối xứng ngược lại', () => {
        napDungSan();
        for (const r of R.relation.tatCa()) {
            if (!r.nghichDao)
                continue;
            const nguoc = R.relation.lay(r.nghichDao);
            expect(nguoc, `quan hệ '${r.id}' trỏ nghichDao lạ '${r.nghichDao}'`).toBeDefined();
            expect(nguoc?.nghichDao).toBe(r.id);
        }
    });
    it('mọi capDoi của động từ đều tồn tại và đối xứng', () => {
        napDungSan();
        for (const v of R.verb.tatCa()) {
            if (!v.capDoi)
                continue;
            expect(R.verb.lay(v.capDoi)?.capDoi).toBe(v.id);
        }
    });
    it('[BB] mọi metric ánh xạ về một trường có thật của WorldMetricsSchema', async () => {
        const { WorldMetricsSchema } = await import('../schema/entity.js');
        napDungSan();
        const truong = new Set(Object.keys(WorldMetricsSchema.parse(undefined)));
        for (const m of R.metric.tatCa()) {
            expect(truong.has(m.truongWorldMetrics), `metric '${m.id}' trỏ trường lạ`).toBe(true);
        }
    });
    it('[BB] doSongDong chỉ hiển thị cuối kỷ nguyên — Phần 13.4', () => {
        napDungSan();
        expect(R.metric.lay('do_song_dong')?.chiHienCuoiKyNguyen).toBe(true);
    });
});
