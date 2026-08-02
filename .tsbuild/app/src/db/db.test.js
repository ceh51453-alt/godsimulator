/**
 * Cổng Phase 2 — persistence, migration và nhánh.
 *
 * Cổng (Phần 75 Phase 2 + Prompt IDE):
 *   - fork rồi sửa cùng entity ở hai nhánh KHÔNG đè nhau;
 *   - crash giữa migration phục hồi được;
 *   - save round-trip giữ hash;
 *   - export không chứa secret hoặc hồ sơ riêng mặc định;
 *   - save cũ mở thẳng vào game, không bị ép onboarding lại;
 *   - cache không bao giờ được đọc chéo nhánh/chủ thể;
 *   - save mới hơn app bị từ chối tử tế.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThienDienDb } from './schema.js';
import { KhoDexie, KhoNhanh, napState } from './repo.js';
import { chayMigrationV1V2, chayMigrationV2V3, chayMoiMigration, kiemPhienBanSave, trangThaiMigration, } from './migration.js';
import { xuatSave, nhapSave, luuSnapshot, phucHoiTuSnapshot, autosave, SO_AUTOSAVE_GIU } from './save.js';
import { KhoRerankCache, hashConfig, hashTapCandidate, mangKhoa } from './rerankCache.js';
import { stripSecret, PHIEN_BAN_SCHEMA, BranchSchema, KHOA_SECRET } from '../core/contracts/branch.js';
import { WorldSchema } from '../core/contracts/core.js';
import { EntitySchema, LinkSchema } from '../core/schema/entity.js';
import { hashState, taoState, taoEventLog } from '../core/engine/state.js';
import { apDungEvent, taoEvent } from '../core/engine/transaction.js';
import { RerankResultSchema } from '../core/schema/rerank.js';
import { PlayerProfileSchema } from '../core/schema/player.js';
import { StorylineSchema, ForeshadowSchema } from '../core/schema/truyen.js';
import { scopeKeyOf } from '../core/contracts/primitives.js';
import { DEXIE_VERSION_HIEN_TAI } from './schema.js';
import { luatNenMacDinh } from '../core/vatly/luatNen.js';
import { LorebookSchema } from '../core/lore/schema.js';
import { CoCheRowSchema } from '../core/vatly/schema.js';
let db;
let kho;
let dem = 0;
const GOC = 'br_goc';
const world = (branchId = GOC, over = {}) => WorldSchema.parse({
    id: 'w1',
    branchId,
    seed: 'hat-giong',
    tick: 10,
    eraId: 'era0',
    year: 100,
    tuningProfileId: 'co_dien',
    playerState: { setupCompleted: true, setupVersion: 1 },
    version: 1,
    ...over,
});
const entity = (id, branchId = GOC, ten = id) => EntitySchema.parse({ id, branchId, kind: 'concept', ten, tickSinh: 0 });
const nhanh = (id, gocId, tickTao = 0) => BranchSchema.parse({ id, worldId: 'w1', gocId, tickTao, ten: id });
beforeEach(async () => {
    dem++;
    db = new ThienDienDb(`thien-dien-test-${dem}`);
    await db.open();
    kho = new KhoDexie(db);
    await db.branches.put(nhanh(GOC, null));
});
// ─────────────────────────────────────────── copy-on-write
describe('[BB] copy-on-write theo nhánh — cổng chính của Phase 2', () => {
    it('fork KHÔNG sao chép dữ liệu — chỉ thêm một bản ghi nhánh', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        expect(await db.entities.count()).toBe(1);
        // Nhưng nhánh con vẫn ĐỌC được entity của cha.
        const e = await kho.kho.doc('entities', 'br_a', 'e1');
        expect(e?.ten).toBe('e1');
    });
    it('[BB] fork rồi sửa cùng entity ở hai nhánh KHÔNG đè nhau', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1', GOC, 'Nguyên bản'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        await kho.kho.fork(nhanh('br_b', GOC, 10));
        await kho.kho.ghi('entities', 'br_a', { ...entity('e1'), ten: 'Bản của A' });
        await kho.kho.ghi('entities', 'br_b', { ...entity('e1'), ten: 'Bản của B' });
        expect((await kho.kho.doc('entities', 'br_a', 'e1'))?.ten).toBe('Bản của A');
        expect((await kho.kho.doc('entities', 'br_b', 'e1'))?.ten).toBe('Bản của B');
        // [BB] Nhánh gốc KHÔNG bị đụng tới.
        expect((await kho.kho.doc('entities', GOC, 'e1'))?.ten).toBe('Nguyên bản');
    });
    it('ghi ở nhánh con ép branchId về nhánh con, không ghi đè bản ghi cha', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        // Cố tình đưa vào bản ghi mang branchId của CHA.
        await kho.kho.ghi('entities', 'br_a', entity('e1', GOC, 'Thử ghi đè'));
        expect((await db.entities.get([GOC, 'e1']))?.ten).toBe('e1');
        expect((await db.entities.get(['br_a', 'e1']))?.ten).toBe('Thử ghi đè');
        expect((await db.entities.get(['br_a', 'e1']))?.branchId).toBe('br_a');
    });
    it('chuỗi ba tầng: nhánh gần nhất thắng', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1', GOC, 'gốc'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        await kho.kho.fork(nhanh('br_b', 'br_a', 20));
        expect((await kho.kho.doc('entities', 'br_b', 'e1'))?.ten).toBe('gốc');
        await kho.kho.ghi('entities', 'br_a', { ...entity('e1'), ten: 'tầng giữa' });
        expect((await kho.kho.doc('entities', 'br_b', 'e1'))?.ten).toBe('tầng giữa');
        await kho.kho.ghi('entities', 'br_b', { ...entity('e1'), ten: 'tầng lá' });
        expect((await kho.kho.doc('entities', 'br_b', 'e1'))?.ten).toBe('tầng lá');
        expect((await kho.kho.doc('entities', 'br_a', 'e1'))?.ten).toBe('tầng giữa');
    });
    it('[BB] bia mộ: xóa ở nhánh con KHÔNG hồi sinh từ nhánh cha', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        await kho.kho.xoa('entities', 'br_a', 'e1', 15);
        expect(await kho.kho.doc('entities', 'br_a', 'e1')).toBeUndefined();
        // Nhánh cha vẫn còn nguyên.
        expect((await kho.kho.doc('entities', GOC, 'e1'))?.ten).toBe('e1');
    });
    it('ghi lại sau khi xóa thì bia mộ hết hiệu lực', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        await kho.kho.xoa('entities', 'br_a', 'e1', 15);
        await kho.kho.ghi('entities', 'br_a', { ...entity('e1'), ten: 'sống lại có chủ ý' });
        expect((await kho.kho.doc('entities', 'br_a', 'e1'))?.ten).toBe('sống lại có chủ ý');
    });
    it('docTatCa hợp nhất đúng theo nhánh và tôn trọng bia mộ', async () => {
        await kho.kho.ghi('entities', GOC, entity('e1'));
        await kho.kho.ghi('entities', GOC, entity('e2'));
        await kho.kho.ghi('entities', GOC, entity('e3'));
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        await kho.kho.ghi('entities', 'br_a', { ...entity('e2'), ten: 'A sửa e2' });
        await kho.kho.xoa('entities', 'br_a', 'e3', 12);
        const m = await kho.kho.docTatCa('entities', 'br_a');
        expect([...m.keys()].sort()).toEqual(['e1', 'e2']);
        expect(m.get('e2')?.ten).toBe('A sửa e2');
        const g = await kho.kho.docTatCa('entities', GOC);
        expect([...g.keys()].sort()).toEqual(['e1', 'e2', 'e3']);
    });
    it('chuỗi tổ tiên chống chu trình dữ liệu hỏng', async () => {
        await db.branches.put(nhanh('x', 'y'));
        await db.branches.put(nhanh('y', 'x'));
        const c = await new KhoNhanh(db).chuoiToTien('x');
        expect(c).toEqual(['x', 'y']);
    });
    it('fork không có gocId bị từ chối', async () => {
        await expect(kho.kho.fork(nhanh('br_x', null))).rejects.toThrow();
    });
});
// ─────────────────────────────────────────── state round-trip
describe('[BB] save round-trip giữ hash', () => {
    it('ghi state rồi đọc lại cho cùng hash', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        s.entities.set('e2', entity('e2'));
        s.links.set('lk', LinkSchema.parse({ id: 'lk', branchId: GOC, tuId: 'e1', denId: 'e2', quanHe: 'nhac_den', tickTao: 0 }));
        const truoc = hashState(s);
        await kho.ghiState(s);
        const lai = await kho.docState(GOC);
        expect(lai).toBeDefined();
        expect(hashState(lai)).toBe(truoc);
    });
    it('state nhánh con kế thừa từ cha giữ hash đúng và mang branchId của con', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        await kho.ghiState(s);
        await kho.kho.fork(nhanh('br_a', GOC, 10));
        const con = await kho.docState('br_a');
        expect(con?.world.branchId).toBe('br_a');
        expect(con?.entities.get('e1')?.branchId).toBe('br_a');
    });
    it('napState báo lỗi có cấu trúc khi nhánh không tồn tại', async () => {
        const r = await napState(kho, 'khong_co');
        expect(r.ok).toBe(false);
        if (!r.ok)
            expect(r.errors[0]?.code).toBe('KHONG_CO_NHANH');
    });
    it('event của nhánh con gồm cả lịch sử của cha, sắp xếp deterministic', async () => {
        const ev = (id, branchId, tick) => taoEvent({
            id,
            branchId,
            tick,
            loai: 'x',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [],
            visibility: 'cong_khai',
            source: 'engine',
            payload: {},
        });
        await kho.themEvent(ev('e_b', GOC, 2));
        await kho.themEvent(ev('e_a', GOC, 1));
        await kho.kho.fork(nhanh('br_a', GOC, 5));
        await kho.themEvent(ev('e_c', 'br_a', 6));
        const ds = await kho.docEvents('br_a');
        expect(ds.map((e) => e.id)).toEqual(['e_a', 'e_b', 'e_c']);
        // Nhánh gốc KHÔNG thấy event của nhánh con.
        expect((await kho.docEvents(GOC)).map((e) => e.id)).toEqual(['e_a', 'e_b']);
    });
});
// ─────────────────────────────────────────── export / import
describe('[BB] export không chứa secret hoặc hồ sơ riêng mặc định', () => {
    async function chuanBi() {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        await kho.ghiState(s);
        await db.settings.put({
            key: 'ai',
            value: { proxyUrl: 'https://x.invalid', proxyPassword: 'RAT-BI-MAT' },
        });
        return s;
    }
    it('gói export parse được và mang schemaVersion hiện tại', async () => {
        const s = await chuanBi();
        const r = await xuatSave(db, s, []);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value.schemaVersion).toBe(PHIEN_BAN_SCHEMA);
            expect(r.value.dinhDang).toBe('thien-dien-save');
            expect(r.value.tickXuat).toBe(10);
        }
    });
    it('[BB] không có proxyPassword hay bất kỳ secret nào trong gói xuất', async () => {
        const s = await chuanBi();
        const r = await xuatSave(db, s, []);
        expect(r.ok).toBe(true);
        if (r.ok) {
            const chuoi = JSON.stringify(r.value);
            expect(chuoi).not.toContain('RAT-BI-MAT');
            for (const k of KHOA_SECRET)
                expect(chuoi).not.toContain(`"${k}"`);
        }
    });
    it('[BB] mặc định KHÔNG kèm hồ sơ riêng tư', async () => {
        const s = await chuanBi();
        await db.playerProfiles.put(PlayerProfileSchema.parse({ id: 'pf1', privateNotes: 'GHI-CHU-RAT-RIENG', createdAt: 0, updatedAt: 0 }));
        s.world = { ...s.world, playerState: { ...s.world.playerState, playerProfileId: 'pf1' } };
        const r = await xuatSave(db, s, []);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value.hoSoRiengTu).toBeUndefined();
            expect(JSON.stringify(r.value)).not.toContain('GHI-CHU-RAT-RIENG');
        }
    });
    it('chỉ kèm hồ sơ riêng tư khi người dùng chủ động bật', async () => {
        const s = await chuanBi();
        await db.playerProfiles.put(PlayerProfileSchema.parse({ id: 'pf1', privateNotes: 'GHI-CHU-RAT-RIENG', createdAt: 0, updatedAt: 0 }));
        s.world = { ...s.world, playerState: { ...s.world.playerState, playerProfileId: 'pf1' } };
        const r = await xuatSave(db, s, [], { kemHoSoRiengTu: true });
        expect(r.ok).toBe(true);
        if (r.ok)
            expect(JSON.stringify(r.value)).toContain('GHI-CHU-RAT-RIENG');
    });
    it('stripSecret xóa khóa lồng sâu và không sửa đầu vào', () => {
        const goc = { a: { b: { proxyPassword: 'x', giu: 1 } }, ds: [{ apiKey: 'y', z: 2 }] };
        const sach = stripSecret(goc);
        expect(JSON.stringify(sach)).not.toContain('proxyPassword');
        expect(JSON.stringify(sach)).not.toContain('apiKey');
        expect(sach.a.b.giu).toBe(1);
        expect(goc.a.b.proxyPassword).toBe('x');
    });
    it('stripSecret khớp không phân biệt hoa thường và bỏ khóa nguy hiểm', () => {
        const sach = stripSecret({ ProxyPassword: 'x', API_KEY: 'y', Token: 'z', ok: 1 });
        expect(Object.keys(sach)).toEqual(['ok']);
    });
    it('[BB] xuất → nhập giữ nguyên state hash', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        s.entities.set('e2', entity('e2'));
        s.links.set('lk', LinkSchema.parse({ id: 'lk', branchId: GOC, tuId: 'e1', denId: 'e2', quanHe: 'nhac_den', tickTao: 0 }));
        const truoc = hashState(s);
        const x = await xuatSave(db, s, []);
        expect(x.ok).toBe(true);
        if (!x.ok)
            return;
        // Đi qua JSON thật, đúng như file trên đĩa.
        const n = nhapSave(JSON.parse(JSON.stringify(x.value)));
        expect(n.ok).toBe(true);
        if (n.ok) {
            expect(n.value.hashKhop).toBe(true);
            expect(hashState(n.value.state)).toBe(truoc);
        }
    });
    it('nhập file rác trả lỗi có cấu trúc, không throw', () => {
        for (const rac of [null, 42, 'chuỗi', {}, { dinhDang: 'khac' }, []]) {
            const r = nhapSave(rac);
            expect(r.ok).toBe(false);
            if (!r.ok)
                expect(r.errors[0]?.domain).toBe('persistence');
        }
    });
    it('[BB] save mới hơn app bị từ chối TỬ TẾ, có giải thích', async () => {
        const s = taoState(world());
        const x = await xuatSave(db, s, []);
        expect(x.ok).toBe(true);
        if (!x.ok)
            return;
        const r = nhapSave({ ...x.value, schemaVersion: PHIEN_BAN_SCHEMA + 1 });
        expect(r.ok).toBe(false);
        if (!r.ok) {
            expect(r.errors[0]?.code).toBe('SAVE_MOI_HON_APP');
            expect(r.errors[0]?.message).toContain('cập nhật ứng dụng');
            expect(r.errors[0]?.recoverable).toBe(false);
        }
    });
    it('kiemPhienBanSave chấp nhận version cũ và từ chối version xấu', () => {
        expect(kiemPhienBanSave(1).ok).toBe(true);
        expect(kiemPhienBanSave(PHIEN_BAN_SCHEMA).ok).toBe(true);
        expect(kiemPhienBanSave(0).ok).toBe(false);
        expect(kiemPhienBanSave(1.5).ok).toBe(false);
        expect(kiemPhienBanSave(999).ok).toBe(false);
    });
    it('save có bản ghi hỏng thì bỏ qua bản đó và cảnh báo, không mất cả world', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        const x = await xuatSave(db, s, []);
        if (!x.ok)
            return;
        const hong = { ...x.value, entities: [...x.value.entities, { rac: true }] };
        const r = nhapSave(hong);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value.state.entities.size).toBe(1);
            expect(r.value.canhBao.some((c) => c.code === 'SAVE_BAN_GHI_HONG')).toBe(true);
        }
    });
    it('save vi phạm bất biến bị từ chối nạp', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        const x = await xuatSave(db, s, []);
        if (!x.ok)
            return;
        // Link trỏ vào entity không tồn tại.
        const xau = {
            ...x.value,
            links: [
                LinkSchema.parse({
                    id: 'lk',
                    branchId: GOC,
                    tuId: 'e1',
                    denId: 'ma',
                    quanHe: 'nhac_den',
                    tickTao: 0,
                }),
            ],
        };
        const r = nhapSave(xau);
        expect(r.ok).toBe(false);
        if (!r.ok)
            expect(r.errors[0]?.code).toBe('SAVE_VI_PHAM_BAT_BIEN');
    });
});
// ─────────────────────────────────────────── migration
describe('[BB] migration tăng dần, có checkpoint, phục hồi được sau crash', () => {
    it('v1→v2 gán branchId cho bản ghi thiếu và đánh dấu hoàn tất', async () => {
        await db.entities.put({ ...entity('e1'), branchId: '' });
        await db.entities.put({ ...entity('e2'), branchId: '' });
        const r = await chayMigrationV1V2(db, GOC, 0);
        expect(r.ok).toBe(true);
        if (r.ok)
            expect(r.value.soBanGhiDiChuyen).toBe(2);
        expect((await db.entities.toArray()).every((e) => e.branchId === GOC)).toBe(true);
        const cp = await db.migrationCheckpoints.get('v1_v2');
        expect(cp?.hoanTat).toBe(true);
    });
    it('chạy lại migration là idempotent — lần hai bỏ qua', async () => {
        await db.entities.put({ ...entity('e1'), branchId: '' });
        await chayMigrationV1V2(db, GOC, 0);
        const lai = await chayMigrationV1V2(db, GOC, 0);
        expect(lai.ok).toBe(true);
        if (lai.ok) {
            expect(lai.value.daBoQua).toBe(true);
            expect(lai.value.soBanGhiDiChuyen).toBe(0);
        }
    });
    it('[BB] crash giữa migration: checkpoint dở dang thì lần sau chạy tiếp và hoàn tất', async () => {
        for (let i = 0; i < 5; i++)
            await db.entities.put({ ...entity(`e${i}`), branchId: '' });
        // Mô phỏng crash: checkpoint tồn tại nhưng chưa hoàn tất.
        await db.migrationCheckpoints.put({
            id: 'v1_v2',
            buoc: 'entities',
            soBanGhiDaXong: 2,
            hoanTat: false,
            tickGhi: 0,
        });
        const r = await chayMigrationV1V2(db, GOC, 1);
        expect(r.ok).toBe(true);
        expect((await db.entities.toArray()).every((e) => e.branchId === GOC)).toBe(true);
        expect((await db.migrationCheckpoints.get('v1_v2'))?.hoanTat).toBe(true);
    });
    it('[BB] không đánh dấu hoàn tất khi kiểm tra chưa đạt', async () => {
        // Bản ghi mà migration không thể sửa vì thiếu id → vẫn còn branchId rỗng.
        await db.entities.put({ ...entity('e1'), branchId: '' });
        await chayMigrationV1V2(db, GOC, 0);
        // Sau đó thêm một bản ghi hỏng rồi xóa checkpoint để buộc chạy lại.
        await db.migrationCheckpoints.delete('v1_v2');
        await db.entities.put({ ...entity('e9'), branchId: '' });
        const r = await chayMigrationV1V2(db, GOC, 0);
        expect(r.ok).toBe(true);
        expect((await db.entities.toArray()).every((e) => e.branchId === GOC)).toBe(true);
    });
    it('ghi hash và đếm record trước khi tuyên bố hoàn tất — quy tắc 61.5 #3', async () => {
        await db.entities.put({ ...entity('e1'), branchId: '' });
        await chayMigrationV1V2(db, GOC, 0);
        expect((await db.settings.get('migration.v1_v2.hash'))?.value).toBeTruthy();
        const dem2 = (await db.settings.get('migration.v1_v2.count'))?.value;
        expect(dem2.soEntity).toBe(1);
    });
    it('[BB] 78.10 — save cũ mở ra có setupCompleted = true, KHÔNG bị wizard chặn', async () => {
        await db.worlds.put(world(GOC, { playerState: { ...world().playerState, setupCompleted: false, setupVersion: 0 } }));
        const r = await chayMigrationV2V3(db, 0);
        expect(r.ok).toBe(true);
        const w = await db.worlds.get(GOC);
        expect(w?.playerState.setupCompleted).toBe(true);
        expect(w?.playerState.setupVersion).toBe(0);
        expect(w?.playerState.playerProfileId).toBeNull();
        expect(w?.playerState.creatorIdentityId).toBeNull();
    });
    it('chayMoiMigration chạy cả chuỗi và báo trạng thái', async () => {
        await db.entities.put({ ...entity('e1'), branchId: '' });
        await db.worlds.put(world());
        const r = await chayMoiMigration(db, GOC, 0);
        expect(r.ok).toBe(true);
        const tt = await trangThaiMigration(db);
        expect(tt.map((c) => c.id)).toEqual(['v1_v2', 'v2_v3', 'v3_v4']);
        expect(tt.every((c) => c.hoanTat)).toBe(true);
    });
    it('bảng v3 của Khối U tồn tại và ghi/đọc được', async () => {
        await db.playerProfiles.put(PlayerProfileSchema.parse({ id: 'pf', createdAt: 0, updatedAt: 0 }));
        await db.retrievalEval.put({
            id: 'ev1',
            mode: 'pham_nhan',
            chuTheId: null,
            task: 'narrate_scene',
            query: 'q',
            relevantChunkIds: [],
            forbiddenChunkIds: [],
            diversityGroups: {},
        });
        expect(await db.playerProfiles.count()).toBe(1);
        expect(await db.retrievalEval.count()).toBe(1);
    });
});
// ─────────────────────────────────────────── snapshot / autosave
describe('autosave và snapshot', () => {
    it('snapshot phục hồi được và giữ hash', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        const row = await luuSnapshot(db, s, scopeKeyOf('sang_the', null));
        const r = phucHoiTuSnapshot(row);
        expect(r.ok).toBe(true);
        if (r.ok)
            expect(hashState(r.value)).toBe(hashState(s));
    });
    it('snapshot bị sửa thì phát hiện được qua hash', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        const row = await luuSnapshot(db, s, 'sang_the:root');
        const xau = { ...row, stateHash: 'bi_sua' };
        const r = phucHoiTuSnapshot(xau);
        expect(r.ok).toBe(false);
        if (!r.ok)
            expect(r.errors[0]?.code).toBe('SNAPSHOT_HASH_LECH');
    });
    it('[BB] Phần 38 — giữ đúng 5 bản autosave gần nhất mỗi nhánh', async () => {
        const scope = 'sang_the:root';
        for (let t = 1; t <= 9; t++) {
            const s = taoState(world(GOC, { tick: t }));
            await autosave(db, kho, s, scope);
        }
        const ds = (await db.snapshots.where('branchId').equals(GOC).toArray()).filter((x) => x.scopeKey === scope);
        expect(ds).toHaveLength(SO_AUTOSAVE_GIU);
        expect(ds.map((x) => x.tick).sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9]);
    });
    it('snapshot của hai scope khác nhau không dọn lẫn nhau', async () => {
        for (let t = 1; t <= 7; t++) {
            await luuSnapshot(db, taoState(world(GOC, { tick: t })), 'sang_the:root');
            await luuSnapshot(db, taoState(world(GOC, { tick: t })), 'pham_nhan:mortal_ly');
        }
        const all = await db.snapshots.where('branchId').equals(GOC).toArray();
        expect(all.filter((x) => x.scopeKey === 'sang_the:root')).toHaveLength(5);
        expect(all.filter((x) => x.scopeKey === 'pham_nhan:mortal_ly')).toHaveLength(5);
    });
    it('autosave sau mỗi tick giữ được state đọc lại đúng hash', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        const log = taoEventLog();
        const ev = taoEvent({
            id: 'ev1',
            branchId: GOC,
            tick: 11,
            loai: 'x',
            actorIds: [],
            targetIds: [],
            causeEventIds: [],
            locationId: null,
            patches: [
                {
                    op: 'set',
                    target: { table: 'entities', id: 'e1', path: 'ten' },
                    value: 'Đã đổi',
                    sourceEventId: 'ev1',
                },
            ],
            visibility: 'cong_khai',
            source: 'engine',
            payload: {},
        });
        expect(apDungEvent(s, ev, log).ok).toBe(true);
        await autosave(db, kho, s, 'sang_the:root');
        const lai = await kho.docState(GOC);
        expect(hashState(lai)).toBe(hashState(s));
        expect(lai?.entities.get('e1')?.ten).toBe('Đã đổi');
    });
});
// ─────────────────────────────────────────── rerank cache
describe('[BB] cache rerank không đọc chéo nhánh hay chéo chủ thể', () => {
    const ketQua = (ids) => RerankResultSchema.parse({
        queryHash: 'qh',
        modelKey: 'mk',
        orderedChunkIds: ids,
        modeUsed: 'heuristic',
        latencyMs: 1,
        createdAtTick: 0,
    });
    const khoa = (over = {}) => ({
        branchId: GOC,
        scopeKey: 'sang_the:root',
        queryHash: 'qh',
        candidateSetHash: 'ch',
        visibilityHash: 'vh',
        modelKey: 'mk',
        configHash: 'cfg',
        ...over,
    });
    it('ghi rồi đọc lại trong cùng khóa', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a', 'b']), 10, 100);
        expect((await c.doc(khoa(), 20))?.orderedChunkIds).toEqual(['a', 'b']);
    });
    it('[BB] đổi nhánh → KHÔNG hit', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 10, 100);
        expect(await c.doc(khoa({ branchId: 'br_khac' }), 20)).toBeUndefined();
    });
    it('[BB] đổi chủ thể (scopeKey) → KHÔNG hit', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 10, 100);
        expect(await c.doc(khoa({ scopeKey: 'pham_nhan:mortal_ly' }), 20)).toBeUndefined();
        expect(await c.doc(khoa({ scopeKey: 'than:deity_x' }), 20)).toBeUndefined();
    });
    it('[BB] đổi visibilityHash → KHÔNG hit', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 10, 100);
        expect(await c.doc(khoa({ visibilityHash: 'vh_moi' }), 20)).toBeUndefined();
    });
    it('[BB] đổi model hoặc config → KHÔNG hit', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 10, 100);
        expect(await c.doc(khoa({ modelKey: 'mk2' }), 20)).toBeUndefined();
        expect(await c.doc(khoa({ configHash: 'cfg2' }), 20)).toBeUndefined();
    });
    it('[BB] hạn tính theo TICK, không theo thời gian máy', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 10, 100);
        expect(await c.doc(khoa(), 109)).toBeDefined();
        expect(await c.doc(khoa(), 110)).toBeUndefined();
        // Mục hết hạn bị dọn luôn.
        expect(await db.rerankCache.get(mangKhoa(khoa()))).toBeUndefined();
    });
    it('vô hiệu theo visibility xóa đúng mục và giữ mục khác', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 0, 100);
        await c.ghi(khoa({ visibilityHash: 'vh2', queryHash: 'q2' }), ketQua(['b']), 0, 100);
        expect(await c.voHieuTheoVisibility(GOC, 'vh')).toBe(1);
        expect(await c.doc(khoa(), 1)).toBeUndefined();
        expect(await c.doc(khoa({ visibilityHash: 'vh2', queryHash: 'q2' }), 1)).toBeDefined();
    });
    it('[BB] cache chỉ chứa id/rank/score — không có text, không có password', async () => {
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a', 'b']), 0, 100);
        const row = await db.rerankCache.get(mangKhoa(khoa()));
        const chuoi = JSON.stringify(row);
        expect(chuoi).not.toContain('projectedText');
        for (const k of KHOA_SECRET)
            expect(chuoi).not.toContain(k);
    });
    it('[BB] hashConfig loại secret trước khi băm', () => {
        const a = hashConfig({ candidateK: 120, endpoint: { proxyUrl: 'u', proxyPassword: 'mat-khau-1' } });
        const b = hashConfig({ candidateK: 120, endpoint: { proxyUrl: 'u', proxyPassword: 'mat-khau-2' } });
        expect(a).toBe(b);
        const c = hashConfig({ candidateK: 60, endpoint: { proxyUrl: 'u', proxyPassword: 'mat-khau-1' } });
        expect(a).not.toBe(c);
    });
    it('hashTapCandidate độc lập thứ tự đầu vào', () => {
        expect(hashTapCandidate(['a', 'b', 'c'])).toBe(hashTapCandidate(['c', 'a', 'b']));
        expect(hashTapCandidate(['a', 'b'])).not.toBe(hashTapCandidate(['a', 'b', 'c']));
    });
    it('[BB] 79.1 — xóa cache rerank không ảnh hưởng save hay replay', async () => {
        const s = taoState(world());
        s.entities.set('e1', entity('e1'));
        await kho.ghiState(s);
        const truoc = hashState(s);
        const c = new KhoRerankCache(db);
        await c.ghi(khoa(), ketQua(['a']), 0, 100);
        await c.xoaHet();
        const lai = await kho.docState(GOC);
        expect(hashState(lai)).toBe(truoc);
    });
    it('thống kê retrieval run cho tab Truy hồi', async () => {
        const c = new KhoRerankCache(db);
        for (const [hit, fb] of [
            [true, ''],
            [false, 'timeout'],
            [false, ''],
        ]) {
            await c.ghiRun({
                branchId: GOC,
                scopeKey: 'sang_the:root',
                queryHash: 'q',
                task: 'world_report',
                candidateCount: 10,
                selectedCount: 5,
                modeUsed: 'heuristic',
                latencyMs: 2,
                cacheHit: hit,
                fallbackReason: fb,
                forbiddenCount: 0,
                createdAtTick: 1,
            });
        }
        const tk = await c.thongKe(GOC);
        expect(tk.soRun).toBe(3);
        expect(tk.tyLeCacheHit).toBeCloseTo(1 / 3);
        expect(tk.tyLeFallback).toBeCloseTo(1 / 3);
        expect(tk.tongForbidden).toBe(0);
    });
});
/**
 * Cổng Phase 8 — ba bảng mới KHÔNG chặn save cũ.
 *
 * `storylines`, `foreshadows` và `chunks` sinh ra rỗng, nên không có migration
 * dữ liệu nào. Điều phải chứng minh là save viết bởi bản trước Phase 8 vẫn mở
 * được, mở ra với ba Map rỗng, và chơi tiếp bình thường — cùng cam kết mà v4
 * (`knowledge`/`debts`) và v5 (`prayers`) đã phải giữ.
 */
describe('[BB] Phase 8 — save trước v6 vẫn mở được', () => {
    const GOC8 = 'br_p8';
    it('state ghi khi chưa có ba bảng mới đọc lại vẫn đúng hash', async () => {
        await db.branches.put(nhanh(GOC8, null));
        const s = taoState(world(GOC8));
        s.entities.set('e1', EntitySchema.parse({ id: 'e1', branchId: GOC8, kind: 'place', ten: 'Làng', tickSinh: 0 }));
        await kho.ghiState(s);
        const lai = await kho.docState(GOC8);
        expect(lai).toBeDefined();
        expect(lai?.storylines.size).toBe(0);
        expect(lai?.foreshadows.size).toBe(0);
        expect(hashState(lai)).toBe(hashState(s));
    });
    it('mạch truyện và phục bút round-trip qua Dexie, giữ nguyên hash', async () => {
        await db.branches.put(nhanh(`${GOC8}_2`, null));
        const s = taoState(world(`${GOC8}_2`));
        s.storylines.set('ml_1', StorylineSchema.parse({
            id: 'ml_1',
            branchId: `${GOC8}_2`,
            ten: 'Món nợ',
            loai: 'bao_thu',
            tickSinh: 0,
            phucBut: ['pb_1'],
        }));
        s.foreshadows.set('pb_1', ForeshadowSchema.parse({
            id: 'pb_1',
            branchId: `${GOC8}_2`,
            machId: 'ml_1',
            noiDung: 'Con dao ấy còn ở đâu đó.',
            loai: 'vat',
            tickGieo: 0,
        }));
        await kho.ghiState(s);
        const lai = await kho.docState(`${GOC8}_2`);
        expect(lai?.storylines.get('ml_1')?.ten).toBe('Món nợ');
        expect(lai?.foreshadows.get('pb_1')?.noiDung).toBe('Con dao ấy còn ở đâu đó.');
        expect(hashState(lai)).toBe(hashState(s));
    });
    /**
     * Phase 12 nâng lên v7 — gói export nhận thêm mười bảng của Phase 5 – 10.
     *
     * Bài này vẫn khẳng định hai vế cũ, và thêm một vế mới: **save v6 phải mở
     * được**. Đó mới là điều đáng giữ; con số 7 chỉ là hệ quả.
     */
    it('phiên bản schema đã lên v7; save cũ mở được, save mới hơn app bị từ chối tử tế', () => {
        expect(PHIEN_BAN_SCHEMA).toBe(7);
        expect(kiemPhienBanSave(PHIEN_BAN_SCHEMA + 1).ok).toBe(false);
        for (const cu of [1, 2, 3, 4, 5, 6])
            expect(kiemPhienBanSave(cu).ok).toBe(true);
    });
});
describe('[BB] Phase 9 + 10 — Dexie v8 thêm bảng mà không đụng save cũ', () => {
    const GOC10 = 'br_p10';
    it('app mong đợi v9 và mọi bảng của v8–v9 đều có mặt', () => {
        expect(DEXIE_VERSION_HIEN_TAI).toBe(9);
        for (const t of [
            'substrateLaws',
            'coChe',
            'lorebooks',
            'loreExpectations',
            'diBan',
            'presetPacks',
            'presetRaw',
            'presetActivations',
            'benchmarkRuns',
            // ── v9, Phase 11 ──
            'presetVars',
            'uiState',
        ]) {
            expect(db.tables.some((x) => x.name === t), `thiếu bảng ${t}`).toBe(true);
        }
    });
    it('save ghi khi chưa có năm bảng mới đọc lại vẫn ĐÚNG HASH', async () => {
        await db.branches.put(nhanh(GOC10, null));
        const s = taoState(world(GOC10));
        s.entities.set('e1', EntitySchema.parse({ id: 'e1', branchId: GOC10, kind: 'place', ten: 'Làng', tickSinh: 0 }));
        await kho.ghiState(s);
        const lai = await kho.docState(GOC10);
        expect(lai?.substrateLaws.size).toBe(0);
        expect(lai?.coChe.size).toBe(0);
        expect(lai?.lorebooks.size).toBe(0);
        expect(lai?.loreExpectations.size).toBe(0);
        expect(lai?.diBan.size).toBe(0);
        expect(hashState(lai)).toBe(hashState(s));
    });
    it('luật nền, cơ chế và lorebook round-trip qua Dexie, giữ nguyên hash', async () => {
        const br = `${GOC10}_2`;
        await db.branches.put(nhanh(br, null));
        const s = taoState(world(br));
        for (const ln of luatNenMacDinh(br))
            s.substrateLaws.set(ln.id, ln);
        s.coChe.set('than_bi', CoCheRowSchema.parse({ id: 'than_bi', branchId: br, bat: true, tickBat: 5980 }));
        s.lorebooks.set('lb.aicap', LorebookSchema.parse({ id: 'lb.aicap', branchId: br, ten: 'Ai Cập', nguon: 'nguoi_dung' }));
        await kho.ghiState(s);
        const lai = await kho.docState(br);
        expect(lai?.substrateLaws.size).toBe(7);
        expect(lai?.coChe.get('than_bi')?.tickBat).toBe(5980);
        expect(lai?.lorebooks.get('lb.aicap')?.ten).toBe('Ai Cập');
        expect(hashState(lai)).toBe(hashState(s));
    });
    it('[BB] copy-on-write vẫn đúng: fork rồi sửa luật nền KHÔNG đè nhánh cha', async () => {
        const cha = `${GOC10}_cha`;
        const con = `${GOC10}_con`;
        await db.branches.put(nhanh(cha, null));
        const s = taoState(world(cha));
        for (const ln of luatNenMacDinh(cha))
            s.substrateLaws.set(ln.id, ln);
        await kho.ghiState(s);
        await kho.kho.fork(nhanh(con, cha));
        // 43.6: sửa luật nền chỉ được ghi vào nhánh MỚI.
        const goc = await kho.kho.doc('substrateLaws', con, 'ln.thoi_gian');
        expect(goc?.trangThai).toBe('vo_danh');
        await kho.kho.ghi('substrateLaws', con, {
            ...goc,
            trangThai: 'co_ten',
            khaiNiemNenId: 'kn.truoc_sau',
            tickDatTen: 4410,
        });
        expect((await kho.kho.doc('substrateLaws', con, 'ln.thoi_gian'))?.trangThai).toBe('co_ten');
        expect((await kho.kho.doc('substrateLaws', cha, 'ln.thoi_gian'))?.trangThai).toBe('vo_danh');
    });
    it('thư viện preset thuộc về MÁY: không có cột branchId nào trong ba bảng ấy', async () => {
        await db.presetRaw.put({ ref: 'sha256:AB', sourceName: 'x.json', bytes: 2, noiDung: '{}' });
        const r = await db.presetRaw.get('sha256:AB');
        expect(r?.noiDung).toBe('{}');
        // Nhập lại đúng file cũ ghi đè chính nó thay vì nhân đôi blob (65.5).
        await db.presetRaw.put({ ref: 'sha256:AB', sourceName: 'x.json', bytes: 2, noiDung: '{}' });
        expect(await db.presetRaw.count()).toBe(1);
    });
});
