/**
 * Mười hai tiến trình nền, nối manifest với handler — Phần 71.1, 71.2.
 *
 * Đây là chỗ ADR-0006 được đóng: mọi `handlerId` của `R.worldProcess` từ nay
 * tra được trong `HandlerCatalog`, không còn mục nào ở trạng thái `can_adapter`.
 */
import { R, napDungSan } from '../../registry/index.js';
import { chayMoiTruong, chaySinhThai } from './moiTruong.js';
import { chayDanSo, chaySucKhoe } from './danSo.js';
import { chaySanXuat, chayTraoDoi, chayDinhCu } from './kinhTe.js';
import { chayLienLac, chayKyThuat } from './triThuc.js';
import { chayThietChe, chayVanHoa, chayXungDot } from './xaHoi.js';
import { chayDiHoa, chayCauNguyen, chayThanNpc } from './than.js';
import { chayDoiNguoi, chayVongDoiHo } from './pham.js';
import { chayMachTruyen } from './truyen.js';
/** Ánh xạ id tiến trình → handler. Khóa phải khớp `WORLD_PROCESS_IDS`. */
const HANDLER = Object.freeze({
    environment_cycle: chayMoiTruong,
    ecology: chaySinhThai,
    population_household: chayDanSo,
    health_disease: chaySucKhoe,
    production_consumption: chaySanXuat,
    exchange_debt: chayTraoDoi,
    settlement_infrastructure: chayDinhCu,
    travel_communication: chayLienLac,
    institution_governance: chayThietChe,
    knowledge_technology: chayKyThuat,
    culture_language_religion: chayVanHoa,
    conflict_security: chayXungDot,
    // ── Phase 6 ──
    divine_alienation: chayDiHoa,
    prayer_flow: chayCauNguyen,
    divine_agency: chayThanNpc,
    // ── Phase 7 ──
    mortal_daily: chayDoiNguoi,
    household_lifecycle: chayVongDoiHo,
    // ── Phase 8 ──
    storyline_beat: chayMachTruyen,
});
let cache = null;
/**
 * Mười hai tiến trình đã nối handler, sắp xếp theo id để mọi lần chạy đều
 * duyệt cùng thứ tự (luật bất biến #7).
 */
export function moiTienTrinh() {
    if (cache)
        return cache;
    napDungSan();
    const ra = [];
    for (const def of R.worldProcess.tatCa()) {
        const chay = HANDLER[def.id];
        if (!chay)
            continue;
        ra.push({ def, chay });
    }
    ra.sort((a, b) => (a.def.id < b.def.id ? -1 : a.def.id > b.def.id ? 1 : 0));
    cache = ra;
    return ra;
}
/** Chỉ dùng trong test: buộc dựng lại danh sách sau khi đổi registry. */
export function datLaiTienTrinh() {
    cache = null;
}
/** Id tiến trình chưa có handler — cổng Phase 5 đòi danh sách này rỗng. */
export function tienTrinhThieuHandler() {
    napDungSan();
    return R.worldProcess.tatCa()
        .filter((d) => HANDLER[d.id] === undefined)
        .map((d) => d.id)
        .sort((a, b) => (a < b ? -1 : 1));
}
export * from './types.js';
export { moiNoiChon, langGieng, docAspect, lam, kep, tongCohort, laoDong } from './tienIch.js';
