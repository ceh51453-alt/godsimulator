/**
 * Đường ống tác vụ — Phần 50.2, 50.4, 50.5, 50.7, 50.8 [BB].
 *
 * ── Vì sao có khối này ──
 *
 * 47.2 gộp mọi việc vào một call. Sai ở ba điểm: mỗi việc cần một **model** khác
 * nhau, một **nhịp** khác nhau, và một **ngữ cảnh** khác nhau. Gộp tất cả vào một
 * call là chọn model tệ nhất cho việc khó nhất.
 *
 * ── [BB] `nhomPrompt` là MẢNG CÓ TÊN VÀ VAI TRÒ ──
 *
 * Không phải một chuỗi lớn. "Người dùng cần bật tắt từng nhóm để gỡ lỗi — đây là
 * điểm khác biệt lớn giữa một workflow dùng được và một workflow không gỡ được."
 */
import { z } from 'zod';
export declare const CHE_DO_LICH: readonly ["moi_luot", "theo_luot", "theo_thoi_gian_truyen", "theo_su_kien"];
export type CheDoLich = (typeof CHE_DO_LICH)[number];
export declare const DON_VI_THOI_GIAN: readonly ["gio", "ngay", "tuan", "thang", "nam", "the_dai"];
export type DonViThoiGian = (typeof DON_VI_THOI_GIAN)[number];
export declare const WorkflowScheduleSchema: z.ZodObject<{
    cheDo: z.ZodEnum<{
        moi_luot: "moi_luot";
        theo_luot: "theo_luot";
        theo_thoi_gian_truyen: "theo_thoi_gian_truyen";
        theo_su_kien: "theo_su_kien";
    }>;
    soLuot: z.ZodPrefault<z.ZodNumber>;
    thoiGianTruyen: z.ZodPrefault<z.ZodObject<{
        giaTri: z.ZodPrefault<z.ZodNumber>;
        donVi: z.ZodPrefault<z.ZodEnum<{
            the_dai: "the_dai";
            nam: "nam";
            gio: "gio";
            ngay: "ngay";
            tuan: "tuan";
            thang: "thang";
        }>>;
        nguonThoiGian: z.ZodPrefault<z.ZodObject<{
            loai: z.ZodPrefault<z.ZodEnum<{
                tick_engine: "tick_engine";
                the_trong_van_ban: "the_trong_van_ban";
            }>>;
            tenThe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            pham_vi: z.ZodPrefault<z.ZodEnum<{
                ai_hien_tai: "ai_hien_tai";
                toan_bo: "toan_bo";
            }>>;
        }, z.core.$strip>>;
        khiParseLoi: z.ZodPrefault<z.ZodEnum<{
            bo_qua: "bo_qua";
            dung: "dung";
            chay_luon: "chay_luon";
        }>>;
    }, z.core.$strip>>;
    suKien: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export type WorkflowSchedule = z.infer<typeof WorkflowScheduleSchema>;
export declare const TaskContextSchema: z.ZodPrefault<z.ZodObject<{
    soLuotLichSu: z.ZodPrefault<z.ZodNumber>;
    quyTacTrich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        batDau: z.ZodString;
        ketThuc: z.ZodString;
    }, z.core.$strict>>>;
    quyTacLoaiTru: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        batDau: z.ZodString;
        ketThuc: z.ZodString;
    }, z.core.$strict>>>;
    tangAssembler: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
    soKyUcGoiLai: z.ZodPrefault<z.ZodNumber>;
    lorebookRieng: z.ZodPrefault<z.ZodObject<{
        cheDo: z.ZodPrefault<z.ZodEnum<{
            ke_thua: "ke_thua";
            tat: "tat";
            tu_chon: "tu_chon";
        }>>;
        lorebookIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>>;
export type TaskContext = z.infer<typeof TaskContextSchema>;
export declare const LOAI_DICH_GHI: readonly ["chen_vao_canh", "bien_theo_luot", "ghi_lorebook", "patch_world"];
export type LoaiDichGhi = (typeof LOAI_DICH_GHI)[number];
export declare const WriteTargetSchema: z.ZodObject<{
    loai: z.ZodEnum<{
        chen_vao_canh: "chen_vao_canh";
        bien_theo_luot: "bien_theo_luot";
        ghi_lorebook: "ghi_lorebook";
        patch_world: "patch_world";
    }>;
    mauChen: z.ZodPrefault<z.ZodString>;
    lorebookNguon: z.ZodPrefault<z.ZodEnum<{
        nhan_vat: "nhan_vat";
        chi_dinh: "chi_dinh";
        the_gioi: "the_gioi";
    }>>;
    lorebookId: z.ZodPrefault<z.ZodString>;
    tenEntry: z.ZodPrefault<z.ZodString>;
    loaiEntry: z.ZodPrefault<z.ZodEnum<{
        constant: "constant";
        keyword: "keyword";
    }>>;
    keys: z.ZodPrefault<z.ZodString>;
    viTri: z.ZodPrefault<z.ZodObject<{
        position: z.ZodPrefault<z.ZodString>;
        depth: z.ZodPrefault<z.ZodNumber>;
        order: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    chongDeQuy: z.ZodPrefault<z.ZodBoolean>;
    tachTheoThuocTinh: z.ZodPrefault<z.ZodBoolean>;
}, z.core.$strict>;
export type WriteTarget = z.infer<typeof WriteTargetSchema>;
export declare const WorkflowTaskSchema: z.ZodObject<{
    id: z.ZodString;
    ten: z.ZodString;
    bat: z.ZodPrefault<z.ZodBoolean>;
    giaiDoan: z.ZodPrefault<z.ZodNumber>;
    nhomPrompt: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        ten: z.ZodString;
        vaiTro: z.ZodEnum<{
            user: "user";
            system: "system";
            assistant: "assistant";
        }>;
        noiDung: z.ZodString;
        bat: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
    apiPresetName: z.ZodPrefault<z.ZodString>;
    apiPresetDuPhong: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    modelDeXuat: z.ZodPrefault<z.ZodString>;
    soLuongSongSong: z.ZodPrefault<z.ZodNumber>;
    soLanThuLai: z.ZodPrefault<z.ZodNumber>;
    doDaiToiThieu: z.ZodPrefault<z.ZodNumber>;
    cachGop: z.ZodPrefault<z.ZodEnum<{
        ghi_de: "ghi_de";
        noi: "noi";
        gop_json: "gop_json";
    }>>;
    lich: z.ZodPrefault<z.ZodNullable<z.ZodObject<{
        cheDo: z.ZodEnum<{
            moi_luot: "moi_luot";
            theo_luot: "theo_luot";
            theo_thoi_gian_truyen: "theo_thoi_gian_truyen";
            theo_su_kien: "theo_su_kien";
        }>;
        soLuot: z.ZodPrefault<z.ZodNumber>;
        thoiGianTruyen: z.ZodPrefault<z.ZodObject<{
            giaTri: z.ZodPrefault<z.ZodNumber>;
            donVi: z.ZodPrefault<z.ZodEnum<{
                the_dai: "the_dai";
                nam: "nam";
                gio: "gio";
                ngay: "ngay";
                tuan: "tuan";
                thang: "thang";
            }>>;
            nguonThoiGian: z.ZodPrefault<z.ZodObject<{
                loai: z.ZodPrefault<z.ZodEnum<{
                    tick_engine: "tick_engine";
                    the_trong_van_ban: "the_trong_van_ban";
                }>>;
                tenThe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
                pham_vi: z.ZodPrefault<z.ZodEnum<{
                    ai_hien_tai: "ai_hien_tai";
                    toan_bo: "toan_bo";
                }>>;
            }, z.core.$strip>>;
            khiParseLoi: z.ZodPrefault<z.ZodEnum<{
                bo_qua: "bo_qua";
                dung: "dung";
                chay_luon: "chay_luon";
            }>>;
        }, z.core.$strip>>;
        suKien: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
    cheDoNguCanh: z.ZodPrefault<z.ZodEnum<{
        ke_thua: "ke_thua";
        rieng: "rieng";
    }>>;
    nguCanhRieng: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
        soLuotLichSu: z.ZodPrefault<z.ZodNumber>;
        quyTacTrich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            batDau: z.ZodString;
            ketThuc: z.ZodString;
        }, z.core.$strict>>>;
        quyTacLoaiTru: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            batDau: z.ZodString;
            ketThuc: z.ZodString;
        }, z.core.$strict>>>;
        tangAssembler: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
        soKyUcGoiLai: z.ZodPrefault<z.ZodNumber>;
        lorebookRieng: z.ZodPrefault<z.ZodObject<{
            cheDo: z.ZodPrefault<z.ZodEnum<{
                ke_thua: "ke_thua";
                tat: "tat";
                tu_chon: "tu_chon";
            }>>;
            lorebookIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    theTrichXuat: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    cheDoCoNhau: z.ZodPrefault<z.ZodEnum<{
        tat: "tat";
        json_patch: "json_patch";
        json_schema: "json_schema";
    }>>;
    quyTacCoNhau: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    hoBanSao: z.ZodPrefault<z.ZodObject<{
        bat: z.ZodPrefault<z.ZodBoolean>;
        nguonLietKe: z.ZodPrefault<z.ZodString>;
        bienThayThe: z.ZodPrefault<z.ZodString>;
        gioiHan: z.ZodPrefault<z.ZodNumber>;
    }, z.core.$strip>>;
    dichGhi: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        loai: z.ZodEnum<{
            chen_vao_canh: "chen_vao_canh";
            bien_theo_luot: "bien_theo_luot";
            ghi_lorebook: "ghi_lorebook";
            patch_world: "patch_world";
        }>;
        mauChen: z.ZodPrefault<z.ZodString>;
        lorebookNguon: z.ZodPrefault<z.ZodEnum<{
            nhan_vat: "nhan_vat";
            chi_dinh: "chi_dinh";
            the_gioi: "the_gioi";
        }>>;
        lorebookId: z.ZodPrefault<z.ZodString>;
        tenEntry: z.ZodPrefault<z.ZodString>;
        loaiEntry: z.ZodPrefault<z.ZodEnum<{
            constant: "constant";
            keyword: "keyword";
        }>>;
        keys: z.ZodPrefault<z.ZodString>;
        viTri: z.ZodPrefault<z.ZodObject<{
            position: z.ZodPrefault<z.ZodString>;
            depth: z.ZodPrefault<z.ZodNumber>;
            order: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        chongDeQuy: z.ZodPrefault<z.ZodBoolean>;
        tachTheoThuocTinh: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export declare const WorkflowPresetSchema: z.ZodObject<{
    ten: z.ZodString;
    moTa: z.ZodPrefault<z.ZodString>;
    tasks: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        ten: z.ZodString;
        bat: z.ZodPrefault<z.ZodBoolean>;
        giaiDoan: z.ZodPrefault<z.ZodNumber>;
        nhomPrompt: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            ten: z.ZodString;
            vaiTro: z.ZodEnum<{
                user: "user";
                system: "system";
                assistant: "assistant";
            }>;
            noiDung: z.ZodString;
            bat: z.ZodPrefault<z.ZodBoolean>;
        }, z.core.$strict>>>;
        apiPresetName: z.ZodPrefault<z.ZodString>;
        apiPresetDuPhong: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        modelDeXuat: z.ZodPrefault<z.ZodString>;
        soLuongSongSong: z.ZodPrefault<z.ZodNumber>;
        soLanThuLai: z.ZodPrefault<z.ZodNumber>;
        doDaiToiThieu: z.ZodPrefault<z.ZodNumber>;
        cachGop: z.ZodPrefault<z.ZodEnum<{
            ghi_de: "ghi_de";
            noi: "noi";
            gop_json: "gop_json";
        }>>;
        lich: z.ZodPrefault<z.ZodNullable<z.ZodObject<{
            cheDo: z.ZodEnum<{
                moi_luot: "moi_luot";
                theo_luot: "theo_luot";
                theo_thoi_gian_truyen: "theo_thoi_gian_truyen";
                theo_su_kien: "theo_su_kien";
            }>;
            soLuot: z.ZodPrefault<z.ZodNumber>;
            thoiGianTruyen: z.ZodPrefault<z.ZodObject<{
                giaTri: z.ZodPrefault<z.ZodNumber>;
                donVi: z.ZodPrefault<z.ZodEnum<{
                    the_dai: "the_dai";
                    nam: "nam";
                    gio: "gio";
                    ngay: "ngay";
                    tuan: "tuan";
                    thang: "thang";
                }>>;
                nguonThoiGian: z.ZodPrefault<z.ZodObject<{
                    loai: z.ZodPrefault<z.ZodEnum<{
                        tick_engine: "tick_engine";
                        the_trong_van_ban: "the_trong_van_ban";
                    }>>;
                    tenThe: z.ZodPrefault<z.ZodArray<z.ZodString>>;
                    pham_vi: z.ZodPrefault<z.ZodEnum<{
                        ai_hien_tai: "ai_hien_tai";
                        toan_bo: "toan_bo";
                    }>>;
                }, z.core.$strip>>;
                khiParseLoi: z.ZodPrefault<z.ZodEnum<{
                    bo_qua: "bo_qua";
                    dung: "dung";
                    chay_luon: "chay_luon";
                }>>;
            }, z.core.$strip>>;
            suKien: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>>;
        cheDoNguCanh: z.ZodPrefault<z.ZodEnum<{
            ke_thua: "ke_thua";
            rieng: "rieng";
        }>>;
        nguCanhRieng: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
            soLuotLichSu: z.ZodPrefault<z.ZodNumber>;
            quyTacTrich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
                batDau: z.ZodString;
                ketThuc: z.ZodString;
            }, z.core.$strict>>>;
            quyTacLoaiTru: z.ZodPrefault<z.ZodArray<z.ZodObject<{
                batDau: z.ZodString;
                ketThuc: z.ZodString;
            }, z.core.$strict>>>;
            tangAssembler: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
            soKyUcGoiLai: z.ZodPrefault<z.ZodNumber>;
            lorebookRieng: z.ZodPrefault<z.ZodObject<{
                cheDo: z.ZodPrefault<z.ZodEnum<{
                    ke_thua: "ke_thua";
                    tat: "tat";
                    tu_chon: "tu_chon";
                }>>;
                lorebookIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>>>;
        theTrichXuat: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        cheDoCoNhau: z.ZodPrefault<z.ZodEnum<{
            tat: "tat";
            json_patch: "json_patch";
            json_schema: "json_schema";
        }>>;
        quyTacCoNhau: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        hoBanSao: z.ZodPrefault<z.ZodObject<{
            bat: z.ZodPrefault<z.ZodBoolean>;
            nguonLietKe: z.ZodPrefault<z.ZodString>;
            bienThayThe: z.ZodPrefault<z.ZodString>;
            gioiHan: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        dichGhi: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            loai: z.ZodEnum<{
                chen_vao_canh: "chen_vao_canh";
                bien_theo_luot: "bien_theo_luot";
                ghi_lorebook: "ghi_lorebook";
                patch_world: "patch_world";
            }>;
            mauChen: z.ZodPrefault<z.ZodString>;
            lorebookNguon: z.ZodPrefault<z.ZodEnum<{
                nhan_vat: "nhan_vat";
                chi_dinh: "chi_dinh";
                the_gioi: "the_gioi";
            }>>;
            lorebookId: z.ZodPrefault<z.ZodString>;
            tenEntry: z.ZodPrefault<z.ZodString>;
            loaiEntry: z.ZodPrefault<z.ZodEnum<{
                constant: "constant";
                keyword: "keyword";
            }>>;
            keys: z.ZodPrefault<z.ZodString>;
            viTri: z.ZodPrefault<z.ZodObject<{
                position: z.ZodPrefault<z.ZodString>;
                depth: z.ZodPrefault<z.ZodNumber>;
                order: z.ZodPrefault<z.ZodNumber>;
            }, z.core.$strip>>;
            chongDeQuy: z.ZodPrefault<z.ZodBoolean>;
            tachTheoThuocTinh: z.ZodPrefault<z.ZodBoolean>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>>;
    mauChenCuoi: z.ZodPrefault<z.ZodString>;
    mauBienThe: z.ZodPrefault<z.ZodString>;
    nguCanhChung: z.ZodPrefault<z.ZodPrefault<z.ZodObject<{
        soLuotLichSu: z.ZodPrefault<z.ZodNumber>;
        quyTacTrich: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            batDau: z.ZodString;
            ketThuc: z.ZodString;
        }, z.core.$strict>>>;
        quyTacLoaiTru: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            batDau: z.ZodString;
            ketThuc: z.ZodString;
        }, z.core.$strict>>>;
        tangAssembler: z.ZodPrefault<z.ZodArray<z.ZodNumber>>;
        soKyUcGoiLai: z.ZodPrefault<z.ZodNumber>;
        lorebookRieng: z.ZodPrefault<z.ZodObject<{
            cheDo: z.ZodPrefault<z.ZodEnum<{
                ke_thua: "ke_thua";
                tat: "tat";
                tu_chon: "tu_chon";
            }>>;
            lorebookIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    quyTacGhiLorebook: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        loai: z.ZodEnum<{
            chen_vao_canh: "chen_vao_canh";
            bien_theo_luot: "bien_theo_luot";
            ghi_lorebook: "ghi_lorebook";
            patch_world: "patch_world";
        }>;
        mauChen: z.ZodPrefault<z.ZodString>;
        lorebookNguon: z.ZodPrefault<z.ZodEnum<{
            nhan_vat: "nhan_vat";
            chi_dinh: "chi_dinh";
            the_gioi: "the_gioi";
        }>>;
        lorebookId: z.ZodPrefault<z.ZodString>;
        tenEntry: z.ZodPrefault<z.ZodString>;
        loaiEntry: z.ZodPrefault<z.ZodEnum<{
            constant: "constant";
            keyword: "keyword";
        }>>;
        keys: z.ZodPrefault<z.ZodString>;
        viTri: z.ZodPrefault<z.ZodObject<{
            position: z.ZodPrefault<z.ZodString>;
            depth: z.ZodPrefault<z.ZodNumber>;
            order: z.ZodPrefault<z.ZodNumber>;
        }, z.core.$strip>>;
        chongDeQuy: z.ZodPrefault<z.ZodBoolean>;
        tachTheoThuocTinh: z.ZodPrefault<z.ZodBoolean>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type WorkflowPreset = z.infer<typeof WorkflowPresetSchema>;
/**
 * Op mở rộng của RFC 6902 — 50.6.
 *
 * [BB] `delta` là op quan trọng nhất và **không có trong RFC gốc**. Không có nó
 * thì model phải tự tính giá trị tuyệt đối, và nó sẽ tính sai. `delta` ánh xạ
 * thẳng sang `{_op:'add'}` của 31.7.
 */
export declare const JSON_PATCH_OPS: readonly ["replace", "delta", "insert", "remove", "move"];
export type JsonPatchOp = (typeof JSON_PATCH_OPS)[number];
export declare const JsonPatchEntrySchema: z.ZodObject<{
    op: z.ZodEnum<{
        replace: "replace";
        remove: "remove";
        insert: "insert";
        move: "move";
        delta: "delta";
    }>;
    path: z.ZodString;
    value: z.ZodOptional<z.ZodUnknown>;
    from: z.ZodOptional<z.ZodString>;
    index: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export type JsonPatchEntry = z.infer<typeof JsonPatchEntrySchema>;
