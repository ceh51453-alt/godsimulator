import { KhoNhanh } from './repo.js';
import { BranchSchema } from '../core/contracts/branch.js';
import { hashState } from '../core/engine/state.js';
import { luuSnapshot } from './save.js';
import { loi } from '../core/contracts/errors.js';
import { dat, hong } from '../core/contracts/errors.js';
/**
 * Nhãn mặc định cho một ván chưa được đặt tên.
 *
 * Không dùng đồng hồ máy: nhịp thế giới là thứ duy nhất người chơi nhận ra được
 * ván nào là ván nào, và nó cũng là thứ duy nhất replay lại đúng.
 */
export function nhanMacDinh(tick, mode) {
    const tang = mode === 'sang_the' ? 'Sáng Thế' : mode === 'than' ? 'Thần' : 'Phàm Nhân';
    return tick === 0 ? `Ván mới — ${tang}` : `Nhịp ${tick} — ${tang}`;
}
/**
 * Liệt kê mọi ván đã lưu, mới nhất (nhịp cao nhất) lên trước.
 *
 * Sắp xếp deterministic tuyệt đối: theo nhịp giảm dần rồi theo id codepoint. Sắp
 * theo giờ máy sẽ đảo thứ tự giữa hai lần mở trên hai múi giờ khác nhau, và luật
 * bất biến #7 cấm đọc đồng hồ trong mọi thứ ảnh hưởng tới mô phỏng — danh sách
 * này thì không, nhưng giữ cùng một quy tắc rẻ hơn là nhớ hai quy tắc.
 */
export async function danhSachSave(db) {
    const branches = await db.branches.toArray();
    const worlds = await db.worlds.toArray();
    const theoNhanh = new Map(branches.map((b) => [b.id, b]));
    const worldTheoNhanh = new Map(worlds.map((w) => [w.branchId, w]));
    /*
     * Liệt kê từ hợp của hai bảng, không từ riêng `worlds`.
     *
     * Lý do là copy-on-write: một nhánh vừa fork **chưa có hàng world riêng** —
     * nó lần lên cha để đọc. Liệt kê từ `worlds` làm nhánh ấy vô hình, và người
     * chơi tách nhánh xong thấy báo thành công rồi không tìm lại được nó ở đâu cả.
     *
     * Chiều ngược lại cũng phải giữ: một hàng `worlds` mồ côi (bản ghi nhánh mất
     * vì crash giữa chừng) vẫn phải hiện ra, vì trong đó là dữ liệu thật.
     */
    const moiNhanh = [...new Set([...theoNhanh.keys(), ...worldTheoNhanh.keys()])].sort();
    const kho = new KhoNhanh(db);
    const ra = [];
    for (const branchId of moiNhanh) {
        // `docWorld()` lần lên cha — đúng phép đọc của ADR-0014.
        const w = worldTheoNhanh.get(branchId) ?? (await kho.docWorld(branchId));
        if (w === undefined)
            continue;
        const b = theoNhanh.get(branchId);
        /*
         * Đếm theo COW: nhánh con thấy cả bản ghi kế thừa từ cha.
         *
         * Đếm riêng hàng của nhánh này sẽ báo "0 thực thể" cho một nhánh vừa fork từ
         * một thế giới có ba trăm thực thể — đúng về mặt lưu trữ, và hoàn toàn sai
         * về mặt điều người chơi đang hỏi.
         */
        const chuoi = await kho.chuoiToTien(branchId);
        let soEntity = 0;
        let soSuKien = 0;
        for (const nhanh of chuoi) {
            soEntity += await db.entities.where('branchId').equals(nhanh).count();
            soSuKien += await db.events.where('branchId').equals(nhanh).count();
        }
        ra.push({
            branchId,
            worldId: w.id,
            ten: b?.ten?.trim() ? b.ten : nhanMacDinh(w.tick, w.playerState.mode),
            tick: w.tick,
            nam: w.year,
            mode: w.playerState.mode,
            soEntity,
            soSuKien,
            stateHash: '',
            gocId: b?.gocId ?? null,
            lyDoTach: b?.lyDoTach ?? '',
        });
    }
    ra.sort((x, y) => (x.tick !== y.tick ? y.tick - x.tick : x.branchId < y.branchId ? -1 : 1));
    return Object.freeze(ra);
}
/**
 * Ghi toàn bộ ván xuống đĩa: bản ghi nhánh, state, event log, và một snapshot.
 *
 * Event `put` theo khóa kép `[branchId+id]` nên ghi lại cả log mỗi lần là **idempotent**
 * chứ không nhân đôi. Đắt hơn ghi tăng dần, nhưng nó đúng kể cả sau khi người
 * chơi hoàn tác, đổi nhánh hay nạp lại từ file — và một save sai thì không có
 * cách nào biết trước lúc mở lại.
 */
export async function ghiVan(db, kho, state, events, ten) {
    const branchId = state.world.branchId;
    const cu = await db.branches.get(branchId);
    await db.branches.put(BranchSchema.parse({
        id: branchId,
        worldId: state.world.id,
        gocId: cu?.gocId ?? null,
        tickTao: cu?.tickTao ?? 0,
        ten: ten.trim() === '' ? (cu?.ten ?? '') : ten.trim(),
        lyDoTach: cu?.lyDoTach ?? '',
        dangChay: true,
    }));
    await kho.ghiState(state);
    for (const e of events)
        await kho.themEvent(e);
    // Ảnh chụp theo `scopeKey` của tầng đang chơi — [BB] schema.ts: không `null`
    // bên trong compound primary key.
    const scopeKey = `${state.world.playerState.mode}:${state.world.playerState.chuTheId ?? 'root'}`;
    await luuSnapshot(db, state, scopeKey);
}
/**
 * Ghi NHẸ: chỉ bản ghi nhánh và world, không đụng entity.
 *
 * Dùng ngay sau khi fork. `danhSachSave()` liệt kê từ bảng `worlds`, nên một
 * nhánh chưa có hàng world là một nhánh **không hiện ra ở đâu cả** — người chơi
 * tách nhánh xong, thấy thông báo thành công, rồi không tìm lại được nó.
 *
 * Cố ý không gọi `ghiState()`: [BB] copy-on-write — fork KHÔNG sao chép dữ liệu.
 * Entity của nhánh con vẫn lần lên nhánh cha cho tới khi có ghi thật, và ghi
 * thật là việc của lượt chơi đầu tiên trên nhánh ấy.
 */
export async function ghiVanNhe(db, state, ten) {
    const branchId = state.world.branchId;
    const cu = await db.branches.get(branchId);
    if (cu !== undefined && ten.trim() !== '' && cu.ten !== ten.trim()) {
        await db.branches.put({ ...cu, ten: ten.trim() });
    }
    await db.worlds.put({ ...state.world, branchId });
    await db.metrics.put({ branchId, metrics: state.metrics });
}
/** Đổi tên một ván. Tên rỗng đưa nó về nhãn mặc định ở lần liệt kê sau. */
export async function doiTenVan(db, branchId, ten) {
    const cu = await db.branches.get(branchId);
    if (!cu)
        return;
    await db.branches.put({ ...cu, ten: ten.trim() });
}
/**
 * Xóa hẳn một ván.
 *
 * [BB] Không xóa nhánh đang có con: xóa cha sẽ làm phép đọc lần lên của mọi nhánh
 * con rơi vào hư không, và Dexie không có ràng buộc khóa ngoại để bắt điều đó.
 * Trả lỗi có cấu trúc thay vì im lặng làm hỏng dữ liệu của người khác.
 */
export async function xoaVan(db, branchId) {
    const con = await db.branches.where('gocId').equals(branchId).toArray();
    if (con.length > 0) {
        return hong([
            loi('persistence', 'NHANH_CON_CON_SONG', `Ván này là gốc của ${con.length} nhánh khác. Xóa nó sẽ làm hỏng chúng — hãy xóa nhánh con trước.`, { details: { con: con.map((c) => c.id) }, recoverable: true }),
        ]);
    }
    let soDong = 0;
    const xoaTheoNhanh = async (t) => {
        soDong += await t.where('branchId').equals(branchId).delete();
    };
    await db.transaction('rw', [
        db.worlds,
        db.branches,
        db.entities,
        db.links,
        db.gaps,
        db.metrics,
        db.events,
        db.tombstones,
        db.snapshots,
        db.knowledge,
        db.debts,
        db.prayers,
        db.storylines,
        db.foreshadows,
        db.chunks,
        db.substrateLaws,
        db.coChe,
        db.lorebooks,
        db.loreExpectations,
        db.diBan,
        db.presetVars,
        db.uiState,
    ], async () => {
        for (const t of [
            db.entities,
            db.links,
            db.gaps,
            db.events,
            db.tombstones,
            db.snapshots,
            db.knowledge,
            db.debts,
            db.prayers,
            db.storylines,
            db.foreshadows,
            db.chunks,
            db.substrateLaws,
            db.coChe,
            db.lorebooks,
            db.loreExpectations,
            db.diBan,
            db.presetVars,
            db.uiState,
        ]) {
            await xoaTheoNhanh(t);
        }
        soDong += await db.worlds.where('branchId').equals(branchId).delete();
        soDong += await db.metrics.where('branchId').equals(branchId).delete();
        await db.branches.delete(branchId);
    });
    return dat(soDong);
}
/** Ván gần nhất — thứ nút "Tiếp tục" mở ra khi người chơi không chọn gì. */
export async function vanGanNhat(db) {
    const ds = await danhSachSave(db);
    return ds[0] ?? null;
}
/** Hash state hiện tại — dùng cho dòng "đã lưu" trên màn chính. */
export function hashVan(state) {
    return hashState(state);
}
