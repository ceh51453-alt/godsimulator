import { loi } from '../contracts/errors.js';
import { WorkflowPresetSchema, WorkflowTaskSchema } from './schema.js';
const nhom = (ten, vaiTro, noiDung) => ({
    ten,
    vaiTro,
    noiDung,
    bat: true,
});
/**
 * [KN] 50.2 — nhóm `assistant` cuối làm **mồi định dạng**: nội dung là phần mở
 * đầu của định dạng mong muốn, ép model vào khuôn ngay từ token đầu. Script tham
 * khảo gọi nhóm này là *卡COT*, và nó giảm tỉ lệ trượt parse rất mạnh.
 */
const moiDinhDang = (mo) => nhom('mồi định dạng', 'assistant', mo);
export const TAC_VU_DUNG_SAN = Object.freeze([
    WorkflowTaskSchema.parse({
        id: 'sang_loc_hien_dien',
        ten: 'Sàng lọc hiện diện',
        giaiDoan: 1,
        modelDeXuat: 'rẻ, nhanh',
        lich: { cheDo: 'moi_luot' },
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Liệt kê ai thật sự đang ở đây và ai đủ điều kiện hành động lượt này.'),
            nhom('khuôn', 'system', 'Trả về JSON: [{"id":"...","lyDo":"..."}]. Không rào markdown, không thêm lời nào.'),
            moiDinhDang('['),
        ],
        cheDoCoNhau: 'json_schema',
        // Chỉ cần biết ai đang ở đâu — bỏ tầng vũ trụ luận và tầng chân lý thế giới.
        cheDoNguCanh: 'rieng',
        nguCanhRieng: { tangAssembler: [3, 4], soLuotLichSu: 2 },
        doDaiToiThieu: 2,
    }),
    WorkflowTaskSchema.parse({
        id: 'hanh_dong_npc',
        ten: 'Hành động NPC',
        giaiDoan: 2,
        modelDeXuat: 'rẻ',
        lich: { cheDo: 'moi_luot' },
        // [BB] 50.9 — stage 2 BẮT BUỘC bật họ bản sao.
        hoBanSao: { bat: true, nguonLietKe: 'npc_t2_theo_spotlight', bienThayThe: 'MUC', gioiHan: 30 },
        soLuongSongSong: 5,
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Viết một hành động cho nhân vật {{MUC}} trong nhịp này. Chỉ nhân vật đó.'),
            nhom('khuôn', 'system', 'Trả về JSON: {"id":"{{MUC}}","hanhDong":"...","patch":[]}.'),
            moiDinhDang('{'),
        ],
        cheDoCoNhau: 'json_patch',
        cachGop: 'noi',
        cheDoNguCanh: 'rieng',
        nguCanhRieng: { tangAssembler: [3, 4], soLuotLichSu: 3 },
    }),
    WorkflowTaskSchema.parse({
        id: 'nhip_mach_truyen',
        ten: 'Nhịp mạch truyện',
        giaiDoan: 3,
        modelDeXuat: 'trung',
        lich: { cheDo: 'moi_luot' },
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Viết nhịp tiếp theo cho mạch đang sôi. Một nhịp, không tóm tắt cả mạch.'),
            nhom('phục bút', 'system', 'Nếu bạn gieo điều gì sẽ phải trả về sau, khai ở khối <Foreshadow>.'),
        ],
        theTrichXuat: ['Foreshadow'],
        cheDoNguCanh: 'ke_thua',
    }),
    WorkflowTaskSchema.parse({
        id: 'thoi_cuc_the_gioi',
        ten: 'Thời cục thế giới',
        giaiDoan: 4,
        modelDeXuat: 'biết suy luận',
        // [BB] 50.9 — lịch THỜI GIAN TRUYỆN, một tuần một lần.
        lich: { cheDo: 'theo_thoi_gian_truyen', thoiGianTruyen: { giaTri: 1, donVi: 'tuan' } },
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Viết bản tin thời cục: kinh tế, chiến tranh, di cư, dịch bệnh, tôn giáo.'),
            nhom('giới hạn', 'system', 'Engine giữ sổ. Không bịa số dân, số của cải hay tên riêng chưa có trong dữ liệu.'),
        ],
        cheDoCoNhau: 'json_patch',
        cheDoNguCanh: 'rieng',
        // `quyTacTrich` — chỉ lấy phần giữa hai mốc, không nạp một dòng hội thoại nào.
        nguCanhRieng: {
            tangAssembler: [3, 5],
            soLuotLichSu: 0,
            quyTacTrich: [
                { batDau: '<thoi_gian>', ketThuc: '</thoi_gian>' },
                { batDau: '<kinh_te>', ketThuc: '</kinh_te>' },
            ],
        },
        dichGhi: [
            {
                loai: 'ghi_lorebook',
                lorebookNguon: 'the_gioi',
                tenEntry: 'Thời cục hiện tại',
                loaiEntry: 'constant',
                chongDeQuy: true,
            },
        ],
    }),
    WorkflowTaskSchema.parse({
        id: 'giai_lo_hong',
        ten: 'Giải lỗ hổng',
        giaiDoan: 5,
        modelDeXuat: 'trung',
        lich: { cheDo: 'theo_luot', soLuot: 3 },
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Giải tối đa 8 lỗ hổng ưu tiên cao. Mỗi lỗ hổng một mục.'),
            nhom('khuôn', 'system', 'Trả về JSON: [{"gapId":"...","entityMoi":{...},"link":[...]}].'),
            moiDinhDang('['),
        ],
        cheDoCoNhau: 'json_schema',
    }),
    WorkflowTaskSchema.parse({
        id: 'so_sach_chi_so',
        ten: 'Sổ sách & chỉ số',
        giaiDoan: 6,
        modelDeXuat: 'rẻ',
        lich: { cheDo: 'theo_luot', soLuot: 3 },
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Đề nghị delta cho realityIntegrity, agency, doSongDong và ngân sách.'),
            nhom('khuôn', 'system', 'Chỉ dùng op "delta". Giá trị tuyệt đối sẽ bị từ chối.'),
        ],
        cheDoCoNhau: 'json_patch',
        dichGhi: [
            {
                loai: 'ghi_lorebook',
                lorebookNguon: 'the_gioi',
                tenEntry: 'Sổ sách kỷ nguyên',
                loaiEntry: 'constant',
                chongDeQuy: true,
            },
        ],
    }),
    WorkflowTaskSchema.parse({
        id: 'ket_tinh_thanh_tra',
        ten: 'Kết tinh & thanh tra',
        giaiDoan: 7,
        modelDeXuat: 'tốt nhất',
        // [BB] 50.9 — chạy hiếm nhất, theo sự kiện hết kỷ nguyên.
        lich: { cheDo: 'theo_su_kien', suKien: ['het_ky_nguyen'] },
        soLanThuLai: 5,
        nhomPrompt: [
            nhom('nhiệm vụ', 'system', 'Kết tinh cụm luật, ghi mâu thuẫn, đo Dị Hóa, nén biên niên kỷ nguyên.'),
            nhom('tiếp địa', 'system', 'Mọi luật mới phải khai `tiepDia`: khái niệm nào là nền của câu luật ấy.'),
        ],
        cheDoCoNhau: 'json_schema',
        dichGhi: [
            {
                loai: 'ghi_lorebook',
                lorebookNguon: 'the_gioi',
                tenEntry: 'Biên niên kỷ nguyên',
                loaiEntry: 'constant',
                chongDeQuy: true,
            },
        ],
    }),
]);
const lay = (...ids) => ids.map((id) => TAC_VU_DUNG_SAN.find((t) => t.id === id)).filter((t) => t !== undefined);
/** Năm preset dựng sẵn — 50.8. */
export const PRESET_WORKFLOW = Object.freeze({
    trong: WorkflowPresetSchema.parse({ ten: 'Trống', moTa: 'Rỗng, để tự dựng.', tasks: [] }),
    engine_hau_truong: WorkflowPresetSchema.parse({
        ten: 'Engine hậu trường',
        moTa: 'Đủ bảy tác vụ của 50.9.',
        tasks: [...TAC_VU_DUNG_SAN],
    }),
    chi_npc: WorkflowPresetSchema.parse({
        ten: 'Chỉ NPC',
        moTa: 'Chỉ chạy hành động NPC — rẻ nhất.',
        tasks: lay('sang_loc_hien_dien', 'hanh_dong_npc'),
    }),
    chi_the_gioi: WorkflowPresetSchema.parse({
        ten: 'Chỉ thế giới',
        moTa: 'Chỉ vĩ mô, bỏ NPC.',
        tasks: lay('thoi_cuc_the_gioi', 'so_sach_chi_so', 'giai_lo_hong'),
    }),
    nen_ky_nguyen: WorkflowPresetSchema.parse({
        ten: 'Nén kỷ nguyên',
        moTa: 'Chỉ chạy cuối kỷ nguyên.',
        tasks: lay('ket_tinh_thanh_tra'),
    }),
});
// ─────────────────────────────────────────── lằn ranh 50.10
/**
 * Lằn ranh cứng áp cho TỪNG tác vụ — 50.10 [BB].
 *
 * Mọi lằn ranh của 47.4 áp cho từng tác vụ, không chỉ cho vòng lặp tổng. Không
 * tác vụ nào — kể cả stage 7 — được sửa Luật Nền, dùng Vũ Khí Khái Niệm, kích
 * hoạt kết cục, tạo nhánh, hay sửa cấu hình.
 */
export const DUONG_DAN_CAM_WORKFLOW = Object.freeze([
    'substrateLaws',
    'tuning',
    'branches',
    'aiConfigs',
    'playerProfiles',
    'playerIdentities',
]);
/** Kiểm một preset workflow trước khi nạp — chặn sớm thay vì chặn lúc chạy. */
export function kiemLanRanh(preset) {
    const l = [];
    for (const t of preset.tasks) {
        for (const dg of t.dichGhi) {
            if (dg.loai === 'ghi_lorebook' && !dg.chongDeQuy) {
                l.push(loi('schema', 'THIEU_CHONG_DE_QUY', `Tác vụ "${t.ten}" ghi lorebook mà không bật chống đệ quy.`, {
                    path: t.id,
                }));
            }
            if (dg.loai === 'patch_world') {
                for (const cam of DUONG_DAN_CAM_WORKFLOW) {
                    if (dg.mauChen.includes(cam)) {
                        l.push(loi('schema', 'CHAM_DUONG_DAN_CAM', `Tác vụ "${t.ten}" chạm bảng cấm "${cam}" (50.10).`, {
                            path: t.id,
                            severity: 'fatal',
                            recoverable: false,
                        }));
                    }
                }
            }
        }
        if (t.id === 'hanh_dong_npc' && !t.hoBanSao.bat) {
            l.push(loi('schema', 'STAGE2_THIEU_HO_BAN_SAO', 'Tác vụ hành động NPC bắt buộc bật họ bản sao (50.9 [BB]).', {
                path: t.id,
            }));
        }
        if (t.id === 'thoi_cuc_the_gioi' && t.lich?.cheDo !== 'theo_thoi_gian_truyen') {
            l.push(loi('schema', 'STAGE4_SAI_LICH', 'Tác vụ thời cục phải dùng lịch thời gian truyện (50.9 [BB]).', {
                path: t.id,
            }));
        }
        if (t.nhomPrompt.length === 0) {
            l.push(loi('schema', 'THIEU_NHOM_PROMPT', `Tác vụ "${t.ten}" không có nhóm prompt nào — không gỡ lỗi được.`, {
                path: t.id,
                severity: 'warning',
            }));
        }
    }
    return { dat: !l.some((x) => x.severity === 'error' || x.severity === 'fatal'), loi: l };
}
/** Sáu kiểm của bảng 50.12 — số 31 tới 36. */
export function chanDoanWorkflow(sl, nguong) {
    const ra = [];
    if (sl.soLuotTruotLienTiep >= 3) {
        ra.push({
            so: 31,
            ma: 'TAC_VU_TRUOT_LIEN_TUC',
            muc: 'loi',
            thongDiep: `Tác vụ "${sl.taskId}" dùng hết số lần thử lại trong ${sl.soLuotTruotLienTiep} lượt liên tiếp.`,
        });
    }
    if (sl.tyLeLoiPresetChinh > nguong.loiPresetChinh) {
        ra.push({
            so: 32,
            ma: 'CHUOI_DU_PHONG',
            muc: 'canh_bao',
            thongDiep: `Preset chính lỗi ${Math.round(sl.tyLeLoiPresetChinh * 100)}% số call.`,
        });
    }
    if (sl.soLanParseLoiLienTiep > nguong.parseLoiLienTiep) {
        ra.push({
            so: 33,
            ma: 'LICH_THOI_GIAN_TRUYEN',
            muc: 'loi',
            thongDiep: `Không đọc được thời gian ${sl.soLanParseLoiLienTiep} lần liên tiếp — nguồn thời gian sai.`,
        });
    }
    if (sl.tyLeLechHoBanSao > nguong.lechHoBanSao) {
        ra.push({
            so: 34,
            ma: 'HO_BAN_SAO',
            muc: 'canh_bao',
            thongDiep: `Số call thực tế lệch ${Math.round(sl.tyLeLechHoBanSao * 100)}% so với số mục liệt kê.`,
        });
    }
    if (sl.coEntryTuKichHoat) {
        ra.push({
            so: 35,
            ma: 'DE_QUY_LOREBOOK',
            muc: 'loi',
            thongDiep: 'Có entry do workflow ghi đang kích hoạt chính nó.',
        });
    }
    if (sl.daGhiLorebookNguoiDung) {
        // [BB] 50.12 mục 36 — hỏng NẶNG.
        ra.push({
            so: 36,
            ma: 'GHI_DE_LOREBOOK_NGUOI_DUNG',
            muc: 'hong_nang',
            thongDiep: 'Có ghi vào lorebook nguồn "nguoi_dung". Đây là lằn ranh không được vượt (50.10).',
        });
    }
    return ra;
}
// ─────────────────────────────────────────── xuất/nhập preset (50.8)
/** [BB] 50.8 — xuất/nhập preset dưới dạng MỘT file JSON duy nhất. */
export function xuatPreset(p) {
    return JSON.stringify({ _format: 'thien_dien_workflow_v1', preset: p }, null, 2);
}
export function nhapPresetWorkflow(text) {
    let cay;
    try {
        cay = JSON.parse(text);
    }
    catch {
        return { ok: false, loi: 'Không parse được JSON.' };
    }
    const goc = cay;
    if (goc._format !== 'thien_dien_workflow_v1') {
        return { ok: false, loi: 'Không phải preset workflow Thiên Diễn (thiếu _format).' };
    }
    const r = WorkflowPresetSchema.safeParse(goc.preset);
    if (!r.success)
        return { ok: false, loi: r.error.issues.map((i) => i.message).join('; ') };
    return { ok: true, preset: r.data };
}
