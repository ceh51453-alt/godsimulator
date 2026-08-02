import { PHIEN_BAN_SCHEMA } from '../core/contracts/branch.js';
import { PlayerStateSchema } from '../core/contracts/core.js';
import { loi } from '../core/contracts/errors.js';
import { dat, hong } from '../core/contracts/errors.js';
import { hashTap } from '../core/engine/hash.js';
import { DanCuSchema, YTeSchema, SinhThaiSchema, KinhTeSchema, VanHoaSchema, AnNinhSchema, } from '../core/schema/aspect/substrate.js';
/** Số bản ghi mỗi lô. Checkpoint được ghi sau mỗi lô. */
export const CO_LO = 500;
async function docCheckpoint(db, id) {
    return db.migrationCheckpoints.get(id);
}
async function ghiCheckpoint(db, cp) {
    await db.migrationCheckpoints.put(cp);
}
/**
 * v1 → v2: gán `branchId` cho mọi bản ghi thiếu, rồi kiểm đếm và hash trước khi
 * đánh dấu hoàn tất.
 *
 * Idempotent: chạy lại sau crash sẽ bỏ qua phần đã xong nhờ checkpoint.
 */
export async function chayMigrationV1V2(db, branchMacDinh, tick) {
    const ID = 'v1_v2';
    const canhBao = [];
    const cpCu = await docCheckpoint(db, ID);
    if (cpCu?.hoanTat) {
        return dat({ buocDaChay: [], soBanGhiDiChuyen: 0, daBoQua: true, canhBao });
    }
    let daXong = cpCu?.soBanGhiDaXong ?? 0;
    let tong = 0;
    const buoc = [];
    for (const ten of ['entities', 'links']) {
        const bang = ten === 'entities' ? db.entities : db.links;
        const tatCa = await bang.toArray();
        const thieu = tatCa.filter((r) => !r.branchId || r.branchId === '');
        for (let i = 0; i < thieu.length; i += CO_LO) {
            const lo = thieu.slice(i, i + CO_LO);
            // [BB] Mỗi lô là một transaction; crash giữa hai lô vẫn tiếp tục được.
            await db.transaction('rw', [bang, db.migrationCheckpoints], async () => {
                for (const r of lo) {
                    const khoaCu = [r.branchId ?? '', r.id];
                    // Khóa chính là [branchId+id], nên đổi branchId nghĩa là ĐỔI KHÓA:
                    // phải ghi bản ghi mới RỒI xóa bản ghi ở khóa cũ, nếu không sẽ nhân đôi.
                    await bang.put({ ...r, branchId: branchMacDinh });
                    if (khoaCu[0] !== branchMacDinh)
                        await bang.delete(khoaCu);
                }
                daXong += lo.length;
                await ghiCheckpoint(db, {
                    id: ID,
                    buoc: ten,
                    soBanGhiDaXong: daXong,
                    hoanTat: false,
                    tickGhi: tick,
                });
            });
            tong += lo.length;
        }
        buoc.push(ten);
    }
    // [BB] Quy tắc 3: kiểm đếm và hash TRƯỚC khi tuyên bố hoàn tất.
    const soEntity = await db.entities.count();
    const soLink = await db.links.count();
    const conThieu = (await db.entities.filter((r) => !r.branchId).count()) +
        (await db.links.filter((r) => !r.branchId).count());
    if (conThieu > 0) {
        return hong([
            loi('migration', 'V1V2_CON_THIEU_BRANCH', `Còn ${conThieu} bản ghi chưa có branchId sau migration.`, {
                recoverable: false,
            }),
        ]);
    }
    const hash = hashTap([
        ...(await db.entities.toArray()).map((e) => e.id),
        ...(await db.links.toArray()).map((l) => l.id),
    ]);
    await ghiCheckpoint(db, {
        id: ID,
        buoc: 'kiem_tra',
        soBanGhiDaXong: daXong,
        hoanTat: true,
        tickGhi: tick,
    });
    await db.settings.put({ key: 'migration.v1_v2.hash', value: hash });
    await db.settings.put({ key: 'migration.v1_v2.count', value: { soEntity, soLink } });
    return dat({ buocDaChay: buoc, soBanGhiDiChuyen: tong, daBoQua: false, canhBao });
}
/**
 * v2 → v3: thêm bảng Khối U và migrate PlayerState của save cũ.
 *
 * [BB] Phần 78.10 — save v3.0 trở xuống mở ra phải có:
 *   playerProfileId = null, creatorIdentityId = null,
 *   setupVersion = 0, setupCompleted = TRUE
 * Người chơi KHÔNG bị wizard chặn.
 */
export async function chayMigrationV2V3(db, tick) {
    const ID = 'v2_v3';
    const canhBao = [];
    const cpCu = await docCheckpoint(db, ID);
    if (cpCu?.hoanTat) {
        return dat({ buocDaChay: [], soBanGhiDiChuyen: 0, daBoQua: true, canhBao });
    }
    let daXong = cpCu?.soBanGhiDaXong ?? 0;
    const worlds = await db.worlds.toArray();
    let tong = 0;
    for (let i = 0; i < worlds.length; i += CO_LO) {
        const lo = worlds.slice(i, i + CO_LO);
        await db.transaction('rw', [db.worlds, db.migrationCheckpoints], async () => {
            for (const w of lo) {
                const ps = PlayerStateSchema.parse(w.playerState ?? undefined);
                await db.worlds.put({
                    ...w,
                    playerState: {
                        ...ps,
                        playerProfileId: ps.playerProfileId ?? null,
                        creatorIdentityId: ps.creatorIdentityId ?? null,
                        setupVersion: 0,
                        // [BB] KHÔNG ép người chơi chạy lại onboarding.
                        setupCompleted: true,
                    },
                });
            }
            daXong += lo.length;
            await ghiCheckpoint(db, {
                id: ID,
                buoc: 'player_state',
                soBanGhiDaXong: daXong,
                hoanTat: false,
                tickGhi: tick,
            });
        });
        tong += lo.length;
    }
    await ghiCheckpoint(db, {
        id: ID,
        buoc: 'kiem_tra',
        soBanGhiDaXong: daXong,
        hoanTat: true,
        tickGhi: tick,
    });
    return dat({ buocDaChay: ['player_state'], soBanGhiDiChuyen: tong, daBoQua: false, canhBao });
}
/**
 * v3 → v4: Thế Giới Sống.
 *
 * Hai bảng mới (`knowledge`, `debts`) sinh ra RỖNG — Dexie đã tạo index, không có
 * dữ liệu cũ nào phải di chuyển. Việc thật sự phải làm là **gieo state nền** cho
 * `place` của save cũ, vì mười hai tiến trình của 71.2 đọc những aspect đó và
 * một vùng thiếu `dan_cu` sẽ bị chúng bỏ qua lặng lẽ — thế giới đứng hình mà
 * không báo lỗi.
 *
 * [BB] Quy tắc 3 của 61.5 vẫn áp dụng: kiểm đếm trước khi tuyên bố hoàn tất.
 */
export async function chayMigrationV3V4(db, tick) {
    const ID = 'v3_v4';
    const canhBao = [];
    const cpCu = await docCheckpoint(db, ID);
    if (cpCu?.hoanTat) {
        return dat({ buocDaChay: [], soBanGhiDiChuyen: 0, daBoQua: true, canhBao });
    }
    let daXong = cpCu?.soBanGhiDaXong ?? 0;
    let tong = 0;
    const canGieo = (await db.entities.toArray()).filter((e) => e.kind === 'place' && e.aspects['dan_cu'] === undefined);
    for (let i = 0; i < canGieo.length; i += CO_LO) {
        const lo = canGieo.slice(i, i + CO_LO);
        await db.transaction('rw', [db.entities, db.migrationCheckpoints], async () => {
            for (const e of lo) {
                await db.entities.put({ ...e, aspects: { ...e.aspects, ...aspectNenTuSpatial(e.aspects) } });
            }
            daXong += lo.length;
            await ghiCheckpoint(db, {
                id: ID,
                buoc: 'gieo_nen',
                soBanGhiDaXong: daXong,
                hoanTat: false,
                tickGhi: tick,
            });
        });
        tong += lo.length;
    }
    const conThieu = (await db.entities.toArray()).filter((e) => e.kind === 'place' && e.aspects['dan_cu'] === undefined).length;
    if (conThieu > 0) {
        return hong([
            loi('migration', 'V3V4_CON_THIEU_NEN', `Còn ${conThieu} nơi chốn chưa có aspect nền sau migration.`, {
                recoverable: false,
            }),
        ]);
    }
    await ghiCheckpoint(db, { id: ID, buoc: 'kiem_tra', soBanGhiDaXong: daXong, hoanTat: true, tickGhi: tick });
    await db.settings.put({ key: 'migration.v3_v4.count', value: { soNoiChon: tong } });
    return dat({ buocDaChay: ['gieo_nen'], soBanGhiDiChuyen: tong, daBoQua: false, canhBao });
}
/**
 * Dựng aspect nền từ `spatial.danSo` của save cũ.
 *
 * [BB] Không bịa dân số. Con số duy nhất được tin là `danSo` đã có; mọi thứ khác
 * suy ra từ nó theo tỷ lệ cố định, không qua RNG — migration phải deterministic
 * để hai máy nâng cấp cùng một save cho cùng một hash.
 */
function aspectNenTuSpatial(aspects) {
    const sp = (aspects['spatial'] ?? {});
    const danSo = typeof sp.danSo === 'number' && sp.danSo > 0 ? Math.floor(sp.danSo) : 0;
    return {
        dan_cu: DanCuSchema.parse({ cohort: chiaCohort(danSo), soHo: Math.max(0, Math.round(danSo / 4)) }),
        y_te: YTeSchema.parse({}),
        sinh_thai: SinhThaiSchema.parse(sinhThaiTheoDan(danSo)),
        kinh_te: KinhTeSchema.parse({ kho: { luongThuc: danSo * 2, vatLieu: danSo * 0.5 } }),
        van_hoa: VanHoaSchema.parse({}),
        an_ninh: AnNinhSchema.parse({}),
    };
}
/** Tháp tuổi tiền công nghiệp, làm tròn sao cho tổng bằng đúng `danSo`. */
export function chiaCohort(danSo) {
    const child = Math.floor(danSo * 0.32);
    const youth = Math.floor(danSo * 0.2);
    const elder = Math.floor(danSo * 0.08);
    return { child, youth, adult: danSo - child - youth - elder, elder };
}
/** Trữ lượng đủ nuôi vùng ở mức hiện tại, không hơn — không tặng thế giới của cải. */
export function sinhThaiTheoDan(danSo) {
    const k = Math.max(100, danSo * 6);
    return {
        taiNguyen: { rung: k * 0.5, thu: k * 0.2, ca: k * 0.2, dat: k },
        sucChua: { rung: k * 0.5, thu: k * 0.2, ca: k * 0.2, dat: k },
    };
}
/** Chạy toàn bộ chuỗi migration theo thứ tự. Idempotent. */
export async function chayMoiMigration(db, branchMacDinh, tick) {
    const a = await chayMigrationV1V2(db, branchMacDinh, tick);
    if (!a.ok)
        return a;
    const b = await chayMigrationV2V3(db, tick);
    if (!b.ok)
        return b;
    const c = await chayMigrationV3V4(db, tick);
    if (!c.ok)
        return c;
    return dat({
        buocDaChay: [...a.value.buocDaChay, ...b.value.buocDaChay, ...c.value.buocDaChay],
        soBanGhiDiChuyen: a.value.soBanGhiDiChuyen + b.value.soBanGhiDiChuyen + c.value.soBanGhiDiChuyen,
        daBoQua: a.value.daBoQua && b.value.daBoQua && c.value.daBoQua,
        canhBao: [...a.value.canhBao, ...b.value.canhBao, ...c.value.canhBao],
    });
}
/**
 * [BB] Quy tắc 5 — save mới hơn app bị từ chối TỬ TẾ, có giải thích, không đoán.
 */
export function kiemPhienBanSave(schemaVersion) {
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
        return hong([
            loi('persistence', 'SAVE_VERSION_XAU', `Phiên bản save không hợp lệ: ${String(schemaVersion)}.`, {
                recoverable: false,
            }),
        ]);
    }
    if (schemaVersion > PHIEN_BAN_SCHEMA) {
        return hong([
            loi('persistence', 'SAVE_MOI_HON_APP', `Save này được tạo bởi phiên bản mới hơn (schema v${schemaVersion}); ` +
                `bản đang chạy chỉ đọc được tới v${PHIEN_BAN_SCHEMA}. Hãy cập nhật ứng dụng rồi mở lại.`, { recoverable: false, details: { saveVersion: schemaVersion, appVersion: PHIEN_BAN_SCHEMA } }),
        ]);
    }
    return dat(schemaVersion);
}
/** Trạng thái migration cho bảng Chẩn Đoán (Phần 39). */
export async function trangThaiMigration(db) {
    const ds = await db.migrationCheckpoints.toArray();
    return ds.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
