/**
 * Fixture world nhỏ — Phase 0 deliverable.
 *
 * Đủ để chứng minh chuỗi nhân quả bắt buộc của Prompt IDE:
 *   Sáng Thế ban một luật
 *     → luật đổi điều kiện sống hai vùng
 *     → phàm nhân thích nghi khác nhau
 *     → hai truyền thống hình thành
 *
 * [BB] Mọi số ở đây là DỮ LIỆU TEST, không phải hằng số cân bằng.
 * Luật "Máu đã đổ thì không rửa được" là ví dụ chuẩn của Phần 10.3 — nó tồn tại
 * để chứng minh tầng 2 SUY SAI, và bản diễn giải sai chính là thứ phàm nhân thấy.
 */
import { EntitySchema, LinkSchema } from '../../core/schema/entity.js';
import { WorldSchema } from '../../core/contracts/core.js';
import { SoulSchema } from '../../core/schema/aspect/soul.js';
import { LawfulSchema } from '../../core/schema/aspect/lawful.js';
import { ConceptualSchema } from '../../core/schema/aspect/conceptual.js';
import { DomainSchema, VenerableSchema } from '../../core/schema/aspect/divine.js';
import { MortalSchema, SpatialSchema } from '../../core/schema/aspect/living.js';
export const BRANCH_GOC = 'br_goc';
export const SEED_FIXTURE = 'thien-dien-fixture-0001';
const e = (id, kind, ten, aspects, extra = {}) => EntitySchema.parse({
    id,
    branchId: BRANCH_GOC,
    kind,
    ten,
    tickSinh: 0,
    aspects,
    ...extra,
});
/** Luật Nền — thứ phàm nhân KHÔNG BAO GIỜ đọc được nguyên văn. */
export const LUAT_MAU = e('law_mau', 'law', 'Máu Không Rửa Được', {
    lawful: LawfulSchema.parse({
        vanBan: 'Máu đã đổ thì không rửa được.',
        phamVi: { loai: 'vu_tru', mucTieu: [] },
        kichHoat: {
            suKien: 'gay_chay_mau',
            dieuKien: { op: 'literal', value: true, args: [] },
        },
        hieuUng: [{ duongDan: 'aspects.mortal.thanThe.doDoi', phep: 'set', giaTri: 100 }],
        ngoaiLe: [],
        // [BB] Kiểm tra 5: `bien` không được rỗng — luật phải khai nó KHÔNG làm gì.
        bien: 'Luật này không phán xét động cơ và không phân biệt tự vệ với sát nhân.',
        uuTien: 900,
        // Kẽ hở có thật: tinh thần nói "giết người", văn bản chỉ bắt "gây chảy máu".
        theTag: ['giet_nguoi', 'o_ue'],
        keHo: [
            {
                moTa: 'Bóp cổ không gây chảy máu nên không kích hoạt luật.',
                daBiKhaiThac: false,
                boiAi: '',
            },
        ],
        dienGiai: [
            {
                theHe: 3,
                vungId: 'place_thung_lung',
                noiDung: 'Kẻ mang dấu máu làm ô uế người đứng gần. Phải sống ngoài làng.',
                doLech: 34,
            },
            {
                theHe: 3,
                vungId: 'place_bo_song',
                noiDung: 'Dấu máu rửa được bằng nước sông vào ngày rằm, nếu thành tâm.',
                doLech: 61,
            },
        ],
        trangThai: 'hieu_luc',
    }),
});
/** Khái niệm mọc ra từ cách hai vùng hiểu sai luật. */
export const KHAI_NIEM_O_UE = e('concept_o_ue', 'concept', 'Ô Uế', {
    conceptual: ConceptualSchema.parse({
        giaiDoan: 'thanh_hinh',
        trongSo: 612,
        nguongKetTinh: 1000,
        // lapLai >> yChi → sẽ kết tinh thành LUẬT, không thành THẦN (Phần 8.2).
        nguon: { yChi: 41, lapLai: 571 },
        sacThai: { so_hai: 0.62, ghe_tom: 0.51, trat_tu: 0.28 },
        phanNghiaId: 'concept_thanh_sach',
        cangThang: [{ khaiNiemId: 'concept_thanh_sach', doCang: 88 }],
    }),
});
/** [BB] Phần 8.3 — mỗi khái niệm mới tự sinh phản nghĩa ở trạng thái hư danh. */
export const KHAI_NIEM_THANH_SACH = e('concept_thanh_sach', 'concept', 'Thanh Sạch', {
    conceptual: ConceptualSchema.parse({
        giaiDoan: 'hu_danh',
        trongSo: 0,
        phanNghiaId: 'concept_o_ue',
        cangThang: [{ khaiNiemId: 'concept_o_ue', doCang: 88 }],
    }),
});
export const THUNG_LUNG = e('place_thung_lung', 'place', 'Thung Lũng Tro', {
    spatial: SpatialSchema.parse({
        toaDo: { x: -12, y: 4 },
        banKinh: 6,
        danSo: 1_840,
        doPhuThuoc: 22,
    }),
});
export const BO_SONG = e('place_bo_song', 'place', 'Bờ Sông Mê', {
    spatial: SpatialSchema.parse({
        toaDo: { x: 15, y: -3 },
        banKinh: 9,
        danSo: 3_210,
        doPhuThuoc: 11,
    }),
});
/**
 * Thần có bản tính THẬT khác hẳn bản tính TÍN ĐỒ TIN.
 * Đây là dữ liệu để test rò rỉ Phần 18.2: phàm nhân chỉ được thấy `banTinhTinDoTin`.
 */
export const THAN_TAY_UE = e('deity_tay_ue', 'deity', 'Đấng Tẩy Uế', {
    soul: SoulSchema.parse({
        tang: 't3',
        // Bản tính THẬT: hiền lành, khiêm nhường.
        banTinh: { tuBi_tanNhan: -58, kieuNgao_khiemNhuong: -40, tratTu_phongTung: 12 },
        ducVong: {
            tinNguong: 30,
            tinhAi: 22,
            quyenLuc: 6,
            triThuc: 14,
            anToan: 10,
            baoThu: 4,
            danhTieng: 8,
            tuDo: 6,
        },
        // [BB] Thần nhớ nguyên vẹn: ký ức không suy giảm.
        kyUcSuyGiam: false,
    }),
    domain: DomainSchema.parse({
        domains: [
            { ten: 'tay_ue', suc: 64 },
            { ten: 'nuoc_song', suc: 41 },
        ],
        khaiNiemGocId: 'concept_thanh_sach',
    }),
    venerable: VenerableSchema.parse({
        soTinDoUocLuong: 2_400,
        matDoDen: { place_bo_song: 0.61, place_thung_lung: 0.08 },
        hienThanh: 44,
        // Bản tính tín đồ TIN: tàn nhẫn, kiêu ngạo. Ngược hẳn sự thật.
        banTinhTinDoTin: { tuBi_tanNhan: 47, kieuNgao_khiemNhuong: 38, tratTu_phongTung: -55 },
        doLechDiHoa: 71,
    }),
});
export const PHAM_NHAN_LY = e('mortal_ly', 'mortal', 'Lý Thất', {
    soul: SoulSchema.parse({
        tang: 't2',
        banTinh: { canDam_khiepNhuoc: -22, tratTu_phongTung: 31 },
        tamTrang: [
            {
                loai: 'so_hai',
                doiTuongId: 'deity_tay_ue',
                cuongDo: 58,
                nguonGocKyUcId: 'ky_uc_dem_mua',
            },
        ],
        kyUc: [
            {
                id: 'ky_uc_dem_mua',
                tomTat: 'Đêm mưa, người ta lôi cha ra khỏi làng vì dấu trên tay.',
                tick: 40,
                dienTich: 88,
                lienQuan: ['law_mau', 'place_thung_lung'],
            },
        ],
    }),
    mortal: MortalSchema.parse({
        tuoiTho: 61,
        ageBand: 'adult',
        ngheId: 'nghe_dan_luoi',
        kyNang: { dan_luoi: 62, boi_thuyen: 44 },
        mucTieuDoiNguoi: ['Xóa dấu trên tay cha', 'Rời khỏi thung lũng'],
    }),
});
export const ENTITIES_FIXTURE = [
    LUAT_MAU,
    KHAI_NIEM_O_UE,
    KHAI_NIEM_THANH_SACH,
    THUNG_LUNG,
    BO_SONG,
    THAN_TAY_UE,
    PHAM_NHAN_LY,
];
const l = (id, tuId, denId, quanHe, trongSo = 60) => LinkSchema.parse({ id, branchId: BRANCH_GOC, tuId, denId, quanHe, trongSo, tickTao: 0 });
/** [BB] Phần 6.3 quy tắc 3 — không thực thể nào có _degree === 0. */
export const LINKS_FIXTURE = [
    l('lk_1', 'concept_o_ue', 'concept_thanh_sach', 'doi_nghich', 100),
    l('lk_2', 'concept_thanh_sach', 'concept_o_ue', 'doi_nghich', 100),
    l('lk_3', 'concept_o_ue', 'law_mau', 'sinh_ra_tu', 85),
    l('lk_4', 'law_mau', 'concept_o_ue', 'sinh_ra', 85),
    l('lk_5', 'place_thung_lung', 'law_mau', 'chiu_luat', 70),
    l('lk_6', 'place_bo_song', 'law_mau', 'chiu_luat', 70),
    l('lk_7', 'place_bo_song', 'law_mau', 'dien_giai_sai', 61),
    l('lk_8', 'place_thung_lung', 'law_mau', 'dien_giai_sai', 34),
    l('lk_9', 'deity_tay_ue', 'concept_thanh_sach', 'ket_tinh_tu', 78),
    l('lk_10', 'mortal_ly', 'deity_tay_ue', 'tho_phung', 35),
    l('lk_11', 'mortal_ly', 'place_thung_lung', 'cu_tru_tai', 90),
    l('lk_12', 'place_thung_lung', 'mortal_ly', 'la_noi_cu_tru_cua', 90),
];
export const WORLD_FIXTURE = WorldSchema.parse({
    id: 'world_fixture',
    branchId: BRANCH_GOC,
    seed: SEED_FIXTURE,
    tick: 120,
    eraId: 'era_tro_tan',
    year: 341,
    tuningProfileId: 'co_dien',
    playerState: {
        mode: 'sang_the',
        chuTheId: null,
        setupCompleted: true,
        setupVersion: 1,
    },
    version: 1,
});
