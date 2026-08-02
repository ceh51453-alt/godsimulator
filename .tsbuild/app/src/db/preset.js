// ─────────────────────────────────────────── thư viện pack
export async function ghiPack(db, row, raw) {
    await db.transaction('rw', db.presetPacks, db.presetRaw, async () => {
        await db.presetRaw.put(raw);
        await db.presetPacks.put(row);
    });
}
export async function docThuVien(db) {
    const ds = await db.presetPacks.toArray();
    return ds.sort((a, b) => (a.packId !== b.packId ? (a.packId < b.packId ? -1 : 1) : b.version - a.version));
}
export async function docBanMoiNhat(db, packId) {
    const ds = await db.presetPacks.where('packId').equals(packId).toArray();
    return ds.sort((a, b) => b.version - a.version)[0];
}
/**
 * Xóa một pack khỏi thư viện.
 *
 * KHÔNG xóa `presetRaw`: blob nguồn khóa theo hash, và một hash có thể được nhiều
 * version trỏ tới. Xóa nó ở đây sẽ làm bản version khác mất đường round-trip —
 * đúng thứ 62.2 dựng vỏ nhập bất biến để tránh.
 */
export async function xoaPack(db, packId) {
    await db.transaction('rw', db.presetPacks, db.presetActivations, db.presetVars, async () => {
        await db.presetPacks.where('packId').equals(packId).delete();
        await db.presetActivations.where('packId').equals(packId).delete();
        await db.presetVars.where('packId').equals(packId).delete();
    });
}
// ─────────────────────────────────────────── kích hoạt
export async function ghiKichHoat(db, act) {
    await db.presetActivations.put(act);
}
/**
 * Activation đang có hiệu lực trên một nhánh.
 *
 * Mỗi pack chỉ giữ bản mới nhất: 65.4 nói hoàn tác là "đổi con trỏ về
 * `previousActivationId`", nên lịch sử vẫn còn nguyên trong bảng, chỉ có bản
 * đứng đầu chuỗi là đang chạy.
 */
export async function docKichHoatDangChay(db, branchId) {
    const ds = await db.presetActivations.where('branchId').equals(branchId).toArray();
    const moiNhat = new Map();
    for (const a of ds) {
        const cu = moiNhat.get(a.packId);
        if (cu === undefined || a.activatedAt > cu.activatedAt)
            moiNhat.set(a.packId, a);
    }
    return [...moiNhat.values()].sort((a, b) => (a.packId < b.packId ? -1 : 1));
}
export async function goKichHoat(db, packId, branchId) {
    await db.presetActivations.where({ packId, branchId }).delete();
}
// ─────────────────────────────────────────── biến pack
export async function docBienPack(db, packId, branchId) {
    const hang = await db.presetVars.get([packId, branchId]);
    return hang?.bien ?? {};
}
export async function ghiBienPack(db, packId, branchId, bien, tickGhi) {
    const hang = { packId, branchId, bien, tickGhi };
    await db.presetVars.put(hang);
}
// ─────────────────────────────────────────── trạng thái giao diện
export async function docUiState(db, saveId, branchId) {
    return db.uiState.get([saveId, branchId]);
}
export async function ghiUiState(db, hang) {
    await db.uiState.put(hang);
}
