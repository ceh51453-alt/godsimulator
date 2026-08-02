import { SceneSchema } from '../contracts/core.js';
/** Tên chỉ tồn tại trong entity bị che — nếu nó xuất hiện trong prompt thì đã rò. */
export const TEN_BI_CHE = 'ZZ_KHONG_DUOC_THAY_ZZ';
function ent(id, ten, kind, moTa) {
    return Object.freeze({
        id,
        kind,
        ten,
        aliases: Object.freeze([]),
        moTa,
        tags: Object.freeze([]),
        mucRo: 'ro',
        aspects: Object.freeze({}),
        daBopMeo: false,
    });
}
/**
 * Một `WorldView` tối thiểu nhưng hợp lệ.
 *
 * Hàm thuần, không đọc DB, không đọc `WorldState`. Cùng tham số cho cùng view,
 * nên hash prompt của dry run so sánh được giữa hai lần chạy.
 */
export function viewGia(ghiDe = {}) {
    const entities = new Map([
        [
            'e.chu_the',
            ent('e.chu_the', 'Người Thử Đường', 'mortal', 'một nhân vật chỉ tồn tại trong bản chạy thử'),
        ],
        ['e.ban', ent('e.ban', 'Người Bạn', 'mortal', 'đứng cùng cảnh')],
    ]);
    return Object.freeze({
        mode: 'pham_nhan',
        mucChieu: 'pham_nhan',
        dangHoaThan: false,
        chuTheId: 'e.chu_the',
        branchId: 'nhanh.gia',
        tick: 0,
        entities,
        links: Object.freeze([]),
        laws: Object.freeze([]),
        concepts: Object.freeze([]),
        suongMu: Object.freeze({
            ro: Object.freeze(['e.chu_the', 'e.ban']),
            mo: Object.freeze([]),
            tinDon: Object.freeze([]),
            // [BB] Id ở đây KHÔNG được xuất hiện ở bất kỳ chỗ nào khác trong view.
            mu: Object.freeze([TEN_BI_CHE]),
        }),
        dongTuKhaDung: Object.freeze([]),
        nhipThoiGian: 'nhat',
        machTruyen: Object.freeze([]),
        /*
         * Năm khối của 55.5 dựng ở tầng PHÀM NHÂN, đúng như `mode` khai ở trên: dry
         * run mà cấp cho preset một tầm nhìn rộng hơn tầng nó khai là một bản chạy
         * thử nói dối, và nó sẽ nói dối đúng về thứ 66.5 tồn tại để bắt.
         */
        thoiCuoc: Object.freeze({
            eraId: 'era.gia',
            tenKyNguyen: '',
            tick: null,
            year: null,
            moTaThoiDiem: 'mùa xuân',
            nhip: 'nhat',
        }),
        chiSo: null,
        luatNen: Object.freeze([]),
        coChe: Object.freeze([]),
        diBiet: Object.freeze([]),
        phucBut: Object.freeze([]),
        loiCau: Object.freeze([]),
        loHong: Object.freeze([]),
        visibilityHash: 'gia',
        ...ghiDe,
    });
}
export function sceneGia(ghiDe = {}) {
    return SceneSchema.parse({
        id: 'scene.gia',
        branchId: 'nhanh.gia',
        startedAtTick: 0,
        currentTick: 0,
        locationId: null,
        participantIds: ['e.chu_the', 'e.ban'],
        lensId: 'lens.gia',
        status: 'open',
        draftInput: '',
        eventIds: [],
        ...ghiDe,
    });
}
