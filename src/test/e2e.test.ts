/**
 * E2E ba tầng — cổng Phase 11 mở ra và Phase 12 để lại, nay trả.
 *
 * ── Vì sao bài này chạy qua STORE chứ không qua `core/` ──
 *
 * Mọi cổng trước đều đo `core/`, và `core/` đã sạch từ Phase 1. Thứ chưa ai đo
 * tự động là **đường người chơi thật sự đi**: `useGame` gọi `doiCong()`, gọi
 * Narrator, bóc tách patch, gieo nền, chiếu ba tầng, ghi xuống đĩa, mở lại. Sáu
 * bước ấy nối với nhau ở store, và một chỗ đứt trong đó thì mọi test `core/` vẫn
 * xanh.
 *
 * ── Narrator giả, không phải Narrator tắt ──
 *
 * [BB] ADR-0028 — không có AI thì không chơi, và bài test này KHÔNG được phép
 * lách luật ấy. Nó thay `ke()` bằng một hàm trả về văn bản đã dựng sẵn, tức là
 * đóng vai một model **đang chạy**. Cổng vẫn phải mở, `doiCong()` vẫn phải cho
 * qua, và nếu ai đó gỡ cổng đi thì bài "cổng đóng thì không chơi được" ở cuối
 * file sẽ đỏ.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { useGame } from '../store/game.js';
import { useAi } from '../store/ai.js';
import { AiConfigSchema } from '../core/ai/cauHinh.js';
import { MACH_MOI } from '../core/ai/cong.js';
import { hashState } from '../core/engine/state.js';
import { chieu } from '../core/project/chieu.js';
import type { KetQuaGoi } from '../ai/client.js';

// ─────────────────────────────────────────── Narrator giả

/** Lời kể sẵn cho từng lượt; hết thì dùng lời cuối. Không có ngẫu nhiên nào. */
let kichBan: string[] = [];
let soLanKe = 0;
/** Bật để giả lập đường đứt giữa ván — dùng cho bài `luotChuaKe`. */
let duongDut = false;

function traLoi(): KetQuaGoi {
  const i = Math.min(soLanKe, kichBan.length - 1);
  soLanKe++;
  const vanBan = kichBan[i] ?? 'Một nhịp trôi qua.';
  return { ok: true, vanBan, soKyTu: vanBan.length, promptTokens: null, finishReason: 'stop' };
}

const CAU_HINH_HOP_LE = AiConfigSchema.parse({
  narrator: {
    proxyUrl: 'https://gia-lap.test/v1',
    modelId: 'mo-hinh-gia-lap',
    probe: { daDo: true, thong: true, modelDaTraLoi: 'mo-hinh-gia-lap', soKyTuTraVe: 5 },
  },
});

/**
 * Khối `<CapNhat>` tạo bốn thực thể đầu tiên của thế giới.
 *
 * Viết tay đúng như một model sẽ viết — kể cả chỗ thừa: `op: 'link'` cho bản ghi
 * mới, `sourceEventId` bị bỏ (engine tự gán), và một patch cố tình sai để bài
 * test chứng minh nó bị TỪ CHỐI chứ không lọt.
 */
const KHOI_KHAI_THIEN = `Trong cái chưa có tên, một mặt đất nổi lên.

<CapNhat>{"patches":[
  {"op":"link","target":{"table":"entities","id":"place_dat_dau","path":""},"value":{
    "id":"place_dat_dau","branchId":"br_goc","kind":"place","ten":"Đất Đầu","moTa":"Vùng đất nổi lên trước nhất.","tickSinh":0,
    "aspects":{"spatial":{"toaDo":{"x":0,"y":0},"banKinh":7,"danSo":900}}}},
  {"op":"link","target":{"table":"entities","id":"concept_o_nhiem","path":""},"value":{
    "id":"concept_o_nhiem","branchId":"br_goc","kind":"concept","ten":"Ô Nhiễm","moTa":"","tickSinh":0,
    "aspects":{"conceptual":{"giaiDoan":"thanh_hinh","trongSo":400}}}},
  {"op":"link","target":{"table":"entities","id":"law_mau","path":""},"value":{
    "id":"law_mau","branchId":"br_goc","kind":"law","ten":"Máu Không Rửa Được","moTa":"","tickSinh":0,
    "aspects":{"lawful":{"vanBan":"Máu đã đổ thì không rửa được.","uuTien":900,"trangThai":"hieu_luc"}}}},
  {"op":"link","target":{"table":"entities","id":"deity_dau","path":""},"value":{
    "id":"deity_dau","branchId":"br_goc","kind":"deity","ten":"Kẻ Gọi Tên","moTa":"","tickSinh":0,
    "aspects":{"soul":{"tang":"t3"},"domain":{"domains":[{"ten":"tay_ue","suc":40}]},"venerable":{"soTinDoUocLuong":300}}}},
  {"op":"link","target":{"table":"entities","id":"mortal_dau","path":""},"value":{
    "id":"mortal_dau","branchId":"br_goc","kind":"mortal","ten":"Người Thứ Nhất","moTa":"","tickSinh":0,
    "aspects":{"soul":{"tang":"t2"},"mortal":{"tuoiTho":60,"ageBand":"adult"}}}},
  {"op":"link","target":{"table":"links","id":"lk_e2e_1","path":""},"value":{
    "id":"lk_e2e_1","branchId":"br_goc","tuId":"mortal_dau","denId":"place_dat_dau","quanHe":"cu_tru_tai","trongSo":90,"tickTao":0}},
  {"op":"link","target":{"table":"links","id":"lk_e2e_2","path":""},"value":{
    "id":"lk_e2e_2","branchId":"br_goc","tuId":"place_dat_dau","denId":"mortal_dau","quanHe":"la_noi_cu_tru_cua","trongSo":90,"tickTao":0}},
  {"op":"link","target":{"table":"links","id":"lk_e2e_3","path":""},"value":{
    "id":"lk_e2e_3","branchId":"br_goc","tuId":"deity_dau","denId":"place_dat_dau","quanHe":"cu_tru_tai","trongSo":60,"tickTao":0}},
  {"op":"link","target":{"table":"links","id":"lk_e2e_4","path":""},"value":{
    "id":"lk_e2e_4","branchId":"br_goc","tuId":"place_dat_dau","denId":"deity_dau","quanHe":"la_noi_cu_tru_cua","trongSo":60,"tickTao":0}},
  {"op":"set","target":{"table":"worlds","id":"worlds","path":"playerState.mode"},"value":"pham_nhan"}
]}</CapNhat>`;

beforeAll(() => {
  useAi.setState({
    cfg: CAU_HINH_HOP_LE,
    mach: MACH_MOI,
    daNap: true,
    ke: async () => (duongDut ? { ok: false, ma: 'MANG_HONG', thongDiep: 'giả lập đứt đường' } : traLoi()),
    // Cập Nhật Biến tắt: bài này đo Narrator, không đo điểm cuối thứ hai.
    capNhatBien: async () => null,
  });
  kichBan = [KHOI_KHAI_THIEN];
  soLanKe = 0;
});

// ─────────────────────────────────────────── vòng chơi

describe('[BB] E2E — mở thế giới từ hư vô và để lời kể dựng nó lên', () => {
  it('cổng AI mở thì bắt đầu được, và thế giới trước lượt kể đầu tiên là RỖNG', async () => {
    expect(useAi.getState().cong().choPhepChoi).toBe(true);

    await useGame.getState().batDauBoQua();
    const s = useGame.getState().state;
    expect(s).not.toBeNull();
    if (!s) return;

    // Bảy trục Luật Nền được gieo, và cả bảy đều `vo_danh` — 43.2.
    expect(s.substrateLaws.size).toBe(7);
    expect([...s.substrateLaws.values()].every((x) => x.trangThai === 'vo_danh')).toBe(true);
  });

  it('lời kể đầu tiên tạo ra thực thể, và patch vượt quyền bị TỪ CHỐI', () => {
    const g = useGame.getState();
    const s = g.state;
    expect(s).not.toBeNull();
    if (!s) return;

    for (const id of ['place_dat_dau', 'concept_o_nhiem', 'law_mau', 'deity_dau', 'mortal_dau']) {
      expect(s.entities.has(id)).toBe(true);
    }

    /*
     * Patch cuối trong khối cố tình ghi `worlds.playerState.mode`. Bảng `worlds`
     * vắng mặt khỏi bảng trắng của `bocTach()` có chủ ý: nó sẽ đá người chơi
     * sang tầng khác giữa câu văn.
     */
    expect(s.world.playerState.mode).toBe('sang_the');
    expect(g.patchBiTuChoi.some((p) => p.ma === 'BANG_CAM')).toBe(true);
  });

  it('vùng đất mới được gieo nền, nên mười hai tiến trình không bỏ qua nó', () => {
    const e = useGame.getState().state?.entities.get('place_dat_dau');
    expect(e).toBeDefined();
    // Không có `dan_cu` thì vùng này đứng hình mãi mãi mà không báo lỗi (71.2).
    expect(e?.aspects['dan_cu']).toBeDefined();
    expect(e?.aspects['kinh_te']).toBeDefined();
    expect(e?.aspects['sinh_thai']).toBeDefined();
  });

  it('thời gian trôi được và thế giới tự chạy', async () => {
    kichBan = ['Mùa đi qua Đất Đầu.'];
    soLanKe = 0;
    const truoc = useGame.getState().state?.world.tick ?? 0;
    await useGame.getState().tick(3);
    expect(useGame.getState().state?.world.tick).toBe(truoc + 3);
    expect(useGame.getState().banTin).not.toBeNull();
  });
});

// ─────────────────────────────────────────── ba tầng

describe('[BB] E2E — chơi trọn ba tầng, và ba tầng thấy ba thứ khác nhau', () => {
  it('chuyển sang tầng Thần bằng đúng bộ chọn chủ thể của 21.3', async () => {
    const ungVien = useGame.getState().ungVienChuThe('than');
    expect(ungVien.length).toBeGreaterThan(0);

    await useGame.getState().chuyenTang('than', ungVien[0]?.id ?? null);
    const s = useGame.getState().state;
    expect(s?.world.playerState.mode).toBe('than');
    // Lỗi cũ "bấm Thần ra Phàm Nhân" — chủ thể phải đúng loại.
    expect(s?.entities.get(s.world.playerState.chuTheId ?? '')?.kind).toBe('deity');
  });

  it('chuyển sang tầng Phàm Nhân', async () => {
    const ungVien = useGame.getState().ungVienChuThe('pham_nhan');
    expect(ungVien.length).toBeGreaterThan(0);

    await useGame.getState().chuyenTang('pham_nhan', ungVien[0]?.id ?? null);
    const s = useGame.getState().state;
    expect(s?.world.playerState.mode).toBe('pham_nhan');
    expect(s?.entities.get(s.world.playerState.chuTheId ?? '')?.kind).toBe('mortal');
  });

  it('[BB] phàm nhân KHÔNG đọc được văn bản luật gốc, Sáng Thế thì có', () => {
    const s = useGame.getState().state;
    expect(s).not.toBeNull();
    if (!s) return;

    const pham = chieu(s, 'pham_nhan', 'mortal_dau');
    const sangThe = chieu(s, 'sang_the', null);

    const luatPham = pham.laws.find((l) => l.id === 'law_mau');
    const luatSangThe = sangThe.laws.find((l) => l.id === 'law_mau');

    expect(luatSangThe?.vanBan).toBe('Máu đã đổ thì không rửa được.');
    // `chieu()` XÓA trường, không để lại chuỗi rỗng — thứ không được thấy thì
    // không tồn tại trong đối tượng mà tầng dưới đọc được.
    expect(luatPham?.vanBan ?? null).toBeNull();
  });

  it('ba tầng cho ba `visibilityHash` khác nhau trên cùng một thế giới', () => {
    const s = useGame.getState().state;
    if (!s) return;
    const h = new Set([
      chieu(s, 'sang_the', null).visibilityHash,
      chieu(s, 'than', 'deity_dau').visibilityHash,
      chieu(s, 'pham_nhan', 'mortal_dau').visibilityHash,
    ]);
    expect(h.size).toBe(3);
  });

  it('Sổ Tay thay hẳn Bảng Thiên Diễn ở tầng phàm nhân — [BB] 56.1', () => {
    const so = useGame.getState().soTay();
    expect(so).not.toBeNull();
  });
});

// ─────────────────────────────────────────── ván chơi

describe('[BB] E2E — lưu, rời ván, mở lại', () => {
  it('rời ván ghi xuống đĩa và danh sách thấy nó', async () => {
    const truoc = hashState(useGame.getState().state as never);
    const sceneTruoc = [...useGame.getState().scene];
    expect(sceneTruoc.length).toBeGreaterThan(0);
    await useGame.getState().roiVan();

    expect(useGame.getState().state).toBeNull();
    const ds = useGame.getState().danhSachVan;
    expect(ds.length).toBeGreaterThan(0);
    expect(ds[0]?.soEntity).toBeGreaterThan(0);

    // Mở lại phải cho ĐÚNG thế giới ấy, không phải một thế giới giống nó.
    const ok = await useGame.getState().tiepTucVan(ds[0]?.branchId ?? '');
    expect(ok).toBe(true);
    expect(hashState(useGame.getState().state as never)).toBe(truoc);
    expect(useGame.getState().scene).toEqual(sceneTruoc);
  });

  it('xuất rồi nhập lại qua JSON thật giữ nguyên thế giới', async () => {
    const truoc = hashState(useGame.getState().state as never);
    const txt = await useGame.getState().xuatVanRaChuoi(false);
    expect(txt).not.toBeNull();
    if (txt === null) return;

    // [BB] 38 — mật khẩu proxy không bao giờ ra file.
    expect(txt).not.toContain('proxyPassword');

    const ok = await useGame.getState().nhapVanTuChuoi(txt);
    expect(ok).toBe(true);
    expect(hashState(useGame.getState().state as never)).toBe(truoc);
  });
});

// ─────────────────────────────────────────── cổng AI

describe('[BB] E2E — ADR-0028 và ADR-0056 giữ được ở đường chơi thật', () => {
  it('Narrator đứt giữa lượt thì trò chơi DỪNG, không đi tiếp', async () => {
    duongDut = true;
    const tickTruoc = useGame.getState().state?.world.tick ?? 0;

    await useGame.getState().tick(1);
    expect(useGame.getState().luotChuaKe).not.toBeNull();

    // Và mọi hành động sau đó bị chặn — thế giới không nhích thêm nhịp nào.
    await useGame.getState().tick(1);
    await useGame.getState().gui('ta thử làm gì đó');
    expect(useGame.getState().state?.world.tick).toBe(tickTruoc + 1);
    expect(useGame.getState().loi.some((l) => l.code === 'LUOT_CHUA_DUOC_KE')).toBe(true);
  });

  it('nối lại đường rồi kể lại thì chơi tiếp được', async () => {
    duongDut = false;
    kichBan = ['Nhịp bị bỏ quên nay được kể lại.'];
    soLanKe = 0;

    await useGame.getState().keLai();
    expect(useGame.getState().luotChuaKe).toBeNull();

    const tickTruoc = useGame.getState().state?.world.tick ?? 0;
    await useGame.getState().tick(1);
    expect(useGame.getState().state?.world.tick).toBe(tickTruoc + 1);
  });

  it('cổng đóng thì KHÔNG hành động nào đi qua', async () => {
    useAi.setState({ cfg: AiConfigSchema.parse({}) });
    expect(useAi.getState().cong().choPhepChoi).toBe(false);

    const tickTruoc = useGame.getState().state?.world.tick ?? 0;
    await useGame.getState().tick(1);
    await useGame.getState().gui('ban một luật mới');
    await useGame.getState().chuyenTang('sang_the', null);

    expect(useGame.getState().state?.world.tick).toBe(tickTruoc);
    expect(useGame.getState().loi.some((l) => l.code.startsWith('CONG_AI_'))).toBe(true);

    useAi.setState({ cfg: CAU_HINH_HOP_LE });
  });
});
