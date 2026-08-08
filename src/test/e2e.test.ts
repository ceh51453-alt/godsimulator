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
import { CauHinhTuDienHoaSchema } from '../core/world/dienHoa.js';
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

  /*
   * Hai chỉnh cho nhịp nền, và cả hai đều là chỉnh của BÀI TEST chứ không phải
   * của sản phẩm.
   *
   * `moiBaoNhieuLuot: 1` — mặc định sản phẩm là 10, vì mỗi nhịp nền nay kéo theo
   * một lượt mô phỏng có tốn tiền. Bài này đo *nhịp nền có chạy không*, nên nó
   * cho chạy mỗi lượt; con số mặc định được kiểm riêng ở bài dưới.
   *
   * `workflow.bat: false` — mô phỏng hậu trường gọi `goiTacVuWorkflow()` thật,
   * và địa chỉ proxy ở đây là một tên miền không tồn tại. Bật nó lên trong bài
   * E2E là mua về bảy lần chờ timeout mỗi lượt kể. Lõi của nó (`hauTruong.ts`)
   * được đo bằng bài riêng, không cần mạng.
   */
  useGame.getState().datTuDienHoa({ thichUng: false, moiBaoNhieuLuot: 1, workflow: { bat: false } });
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
    // [BB] `tick(n)` đẩy ĐÚNG n nhịp: nhịp nền không được cộng lén vào đây.
    expect(useGame.getState().state?.world.tick).toBe(truoc + 3);
    expect(useGame.getState().banTin).not.toBeNull();
  });
});

// ─────────────────────────────────────────── nhịp nền (Diễn Hóa tự động)

/**
 * [BB] 47 — thế giới đi tiếp sau MỖI lượt kể, không chỉ khi người chơi bấm tick.
 *
 * Ba điều bài này khoá lại:
 *   1. một lượt chơi thật (`gui`) làm thời gian trôi mà không cần ai bấm gì;
 *   2. mỗi nhịp nền ghi ra một dòng — ADR-0028 không cho thế giới đi tiếp trong
 *      im lặng;
 *   3. tắt được, và tắt rồi thì thời gian đứng yên đúng như trước.
 */
describe('[BB] E2E — nhịp nền tự chạy cuối mỗi lượt kể', () => {
  it('mặc định BẬT, và một lượt `gui` làm thời gian trôi mà không ai bấm tick', async () => {
    expect(useGame.getState().tuDienHoa.bat).toBe(true);
    kichBan = ['Ngươi bước xuống bến nước.'];
    soLanKe = 0;

    const truoc = useGame.getState().state?.world.tick ?? 0;
    const soDong = useGame.getState().scene.length;
    await useGame.getState().gui('ta nhìn quanh');

    // Một lượt nhịp `nien` = 4 tick. Thời gian trôi vì thế giới sống, không vì lệnh.
    expect(useGame.getState().state?.world.tick).toBe(truoc + 4);
    // Và nó KHÔNG đi trong im lặng: có dòng hệ thống kể lại nhịp vừa qua.
    const dongMoi = useGame.getState().scene.slice(soDong);
    expect(dongMoi.some((d) => d.loai === 'he_thong' && /năm trôi qua|Thời gian nhích/.test(d.noiDung))).toBe(
      true,
    );
  });

  it('tắt thì thế giới đứng yên giữa hai lượt, đúng như hợp đồng cũ', async () => {
    useGame.getState().datTuDienHoa({ bat: false });
    kichBan = ['Không có gì đổi.'];
    soLanKe = 0;

    const truoc = useGame.getState().state?.world.tick ?? 0;
    await useGame.getState().gui('ta đứng im');
    expect(useGame.getState().state?.world.tick).toBe(truoc);

    useGame.getState().datTuDienHoa({ bat: true, soLuot: 1, nhip: 'nien' });
  });

  it('[yêu cầu] chạy mỗi N lượt — mặc định 10, đặt 3 thì hai lượt đầu đứng yên', async () => {
    /*
     * Đọc mặc định từ SCHEMA, không từ state đang chạy: `beforeAll` đã hạ nó
     * xuống 1 cho mọi bài khác trong file này, nên hỏi state ở đây là hỏi cái
     * bài test tự đặt ra chứ không phải cái sản phẩm hứa.
     *
     * Mười, chứ không phải một: từ khi nhịp nền kéo theo một lượt mô phỏng có
     * gọi model, "mỗi lượt kể" nghĩa là mỗi lượt kể đều tốn tiền.
     */
    expect(CauHinhTuDienHoaSchema.parse({}).moiBaoNhieuLuot).toBe(10);
    useGame.getState().datTuDienHoa({ bat: true, soLuot: 1, nhip: 'nien', moiBaoNhieuLuot: 3 });

    const truoc = useGame.getState().state?.world.tick ?? 0;
    for (const cau of ['một', 'hai']) {
      kichBan = [`Lượt ${cau}.`];
      soLanKe = 0;
      await useGame.getState().gui(`ta nói ${cau}`);
    }
    // Hai lượt đầu: đếm chưa đủ, thế giới đứng yên.
    expect(useGame.getState().state?.world.tick).toBe(truoc);
    expect(useGame.getState().conLuotToiNhipNen()).toBe(1);

    kichBan = ['Lượt ba.'];
    soLanKe = 0;
    await useGame.getState().gui('ta nói ba');
    // Lượt thứ ba: nhịp nền chạy, và bộ đếm quay lại từ đầu.
    expect(useGame.getState().state?.world.tick).toBe(truoc + 4);
    expect(useGame.getState().conLuotToiNhipNen()).toBe(3);

    useGame.getState().datTuDienHoa({ moiBaoNhieuLuot: 1 });
  });

  it('Kho Từ lớn lên trong lúc chơi và không bao giờ vượt trần', async () => {
    const truoc = useGame.getState().khoTuHienTai().thongKe;
    expect(truoc.tong).toBeGreaterThan(0);

    for (let i = 0; i < 3; i++) {
      kichBan = [`Chữ nghĩa lượt ${i}.`];
      soLanKe = 0;
      await useGame.getState().gui(`ta đi thêm ${i}`);
    }

    const sau = useGame.getState().khoTuHienTai().thongKe;
    expect(sau.tong).toBeGreaterThanOrEqual(truoc.tong);
    expect(sau.tong).toBeLessThanOrEqual(sau.tran);
    expect(sau.tran).toBeGreaterThan(1000);
    // Vốn thế giới tự học phải lớn lên — nếu không thì nó vẫn là bảng cứng.
    expect(sau.tuTheGioi).toBeGreaterThan(0);
  });

  it('phần engine của nhịp nền không gọi model — một lượt kể vẫn là một call', async () => {
    /*
     * Hợp đồng này vẫn đúng, chỉ hẹp lại đúng một chỗ.
     *
     * Mười hai tiến trình nền và sáu thợ Bồi Đắp chạy bằng engine và không tốn
     * một đồng nào — đó là điều bài này canh, và nó không được phép trôi đi.
     * Phần CÓ tốn tiền là mô phỏng hậu trường, và nó có công tắc riêng
     * (`workflow.bat`) đang tắt trong file test này.
     */
    expect(useGame.getState().tuDienHoa.workflow.bat).toBe(false);
    kichBan = ['Một câu nữa.'];
    soLanKe = 0;
    await useGame.getState().gui('ta hỏi một câu');
    expect(soLanKe).toBe(1);
  });

  it('Bồi Đắp làm thế giới bớt dở dang qua nhiều lượt', async () => {
    useGame.getState().datTuDienHoa({ bat: true, soLuot: 2, hanMucBoiDap: 3 });
    const truoc = useGame.getState().doDoDangTheGioi().diem;

    for (let i = 0; i < 4; i++) {
      kichBan = [`Lượt ${i}.`];
      soLanKe = 0;
      await useGame.getState().gui(`ta đi tiếp lần ${i}`);
    }

    const sau = useGame.getState().doDoDangTheGioi();
    expect(sau.diem).toBeLessThanOrEqual(truoc);
    // Thế giới thật sự dày lên: có nơi chốn được đặt tên hoặc người được gọi tên.
    const s = useGame.getState().state;
    expect(s).not.toBeNull();
    const coTen = [...(s?.entities.values() ?? [])].filter(
      (e) => (e.kind === 'place' || e.kind === 'mortal') && e.ten.trim() !== '' && e.ten !== e.id,
    );
    expect(coTen.length).toBeGreaterThan(0);

    useGame.getState().datTuDienHoa({ bat: true, soLuot: 1, hanMucBoiDap: 2 });
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
  /*
   * Trần thời gian riêng cho hai bài này, và lý do là THẬT chứ không phải để
   * che một chỗ chậm: từ khi có nhịp nền, thế giới ở cuối file này đã đi qua
   * hàng chục năm và mang theo số thực thể tương ứng. Ghi trọn nó xuống
   * fake-indexeddb rồi đọc lại tốn hơn trần mặc định 5 giây trên máy đang bận —
   * mà đó chính là điều bài test muốn chứng minh là làm được.
   */
  const TRAN_MS = 30_000;

  it(
    'rời ván ghi xuống đĩa và danh sách thấy nó',
    async () => {
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
    },
    TRAN_MS,
  );

  it(
    'xuất rồi nhập lại qua JSON thật giữ nguyên thế giới',
    async () => {
      const truoc = hashState(useGame.getState().state as never);
      const txt = await useGame.getState().xuatVanRaChuoi(false);
      expect(txt).not.toBeNull();
      if (txt === null) return;

      // [BB] 38 — mật khẩu proxy không bao giờ ra file.
      expect(txt).not.toContain('proxyPassword');

      const ok = await useGame.getState().nhapVanTuChuoi(txt);
      expect(ok).toBe(true);
      expect(hashState(useGame.getState().state as never)).toBe(truoc);
    },
    TRAN_MS,
  );
});

// ─────────────────────────────────────────── reroll

/**
 * Nút Reroll.
 *
 * Hợp đồng của nó gói trong một câu: lượt được kể lại phải chạy trên ĐÚNG thế
 * giới mà lượt cũ đã chạy, không phải trên thế giới sau lượt cũ. Bài đầu đo câu
 * ấy theo cách khó cãi nhất — bắt model kể y hệt lần trước rồi đòi `hashState`
 * khớp từng chữ. Một patch bị áp hai lần, một Event thừa nằm lại trong log, một
 * dòng cũ sót trong khung kể: cả ba đều làm hash lệch ngay tại đó.
 *
 * Nhịp nền tắt suốt khối này, và đó là chỉnh của bài test chứ không phải của sản
 * phẩm: thứ đang đo là phép lùi, không phải chuyện thế giới tự đi tiếp.
 */
describe('[BB] E2E — Reroll lùi thế giới về trước lời kể rồi kể lại', () => {
  /** Khối `<CapNhat>` tạo đúng một khái niệm — vết tay nhỏ nhất một lượt kể để lại. */
  const khoiKhaiNiem = (id: string, ten: string): string => {
    const s = useGame.getState().state;
    return `<CapNhat>{"patches":[
      {"op":"link","target":{"table":"entities","id":"${id}","path":""},"value":{
        "id":"${id}","branchId":"${s?.world.branchId ?? ''}","kind":"concept","ten":"${ten}","moTa":"","tickSinh":${s?.world.tick ?? 0},
        "aspects":{"conceptual":{"giaiDoan":"thanh_hinh","trongSo":300}}}}
    ]}</CapNhat>`;
  };

  const CAU_NGUOI_CHOI = 'ta gọi một cái tên';

  it('vừa mở ván, chưa kể lượt nào thì không reroll được — và bấm cũng không sao', async () => {
    useGame.getState().datTuDienHoa({ bat: false });
    expect(useGame.getState().rerollDuoc).toBe(false);

    const truoc = hashState(useGame.getState().state as never);
    const soGoi = soLanKe;
    await useGame.getState().reroll();

    // Không hỏi model, không đụng thế giới. Một nút chưa dùng được thì im lặng.
    expect(soLanKe).toBe(soGoi);
    expect(hashState(useGame.getState().state as never)).toBe(truoc);
  });

  it('kể lại y hệt cho ĐÚNG thế giới cũ — không patch nào bị áp hai lần', async () => {
    const loiKe = `Một tên gọi rơi xuống. ${khoiKhaiNiem('concept_reroll_a', 'Tiếng Vọng')}`;
    kichBan = [loiKe];
    soLanKe = 0;
    await useGame.getState().gui(CAU_NGUOI_CHOI);

    expect(useGame.getState().rerollDuoc).toBe(true);
    expect(useGame.getState().state?.entities.has('concept_reroll_a')).toBe(true);
    const hashSauLuot = hashState(useGame.getState().state as never);
    const soEvent = useGame.getState().log?.soLuong() ?? 0;
    const soDong = useGame.getState().scene.length;

    kichBan = [loiKe];
    soLanKe = 0;
    await useGame.getState().reroll();

    expect(soLanKe).toBe(1);
    expect(hashState(useGame.getState().state as never)).toBe(hashSauLuot);
    expect(useGame.getState().log?.soLuong()).toBe(soEvent);
    expect(useGame.getState().scene.length).toBe(soDong);
  });

  it('lời kể khác thì thứ lượt cũ tạo ra biến mất theo nó, chứ không chồng lên', async () => {
    kichBan = [`Tên gọi ấy hoá ra là tên khác. ${khoiKhaiNiem('concept_reroll_b', 'Tiếng Vọng Khác')}`];
    soLanKe = 0;
    await useGame.getState().reroll();

    const s = useGame.getState().state;
    expect(s?.entities.has('concept_reroll_a')).toBe(false);
    expect(s?.entities.has('concept_reroll_b')).toBe(true);
  });

  it('câu của người chơi ở lại — reroll thay lời KỂ, không thay lời họ nói', () => {
    const scene = useGame.getState().scene;
    expect(scene.filter((d) => d.loai === 'nguoi_choi' && d.noiDung === CAU_NGUOI_CHOI).length).toBe(1);

    const cuoi = scene[scene.length - 1];
    expect(cuoi?.loai).toBe('ket_qua');
    expect(cuoi?.noiDung).toContain('hoá ra là tên khác');
  });

  it('chỉ lùi được MỘT lượt — một lượt mới chôn đường về lượt trước nó', async () => {
    kichBan = ['Rồi ngươi đi tiếp.'];
    soLanKe = 0;
    await useGame.getState().gui('ta đi tiếp');

    kichBan = ['Rồi ngươi đi tiếp, kể khác.'];
    soLanKe = 0;
    await useGame.getState().reroll();

    // Lùi về đầu lượt VỪA RỒI, nên thứ lượt trước đó dựng lên vẫn còn nguyên.
    expect(useGame.getState().state?.entities.has('concept_reroll_b')).toBe(true);
  });

  it('reroll thường KHÔNG làm mất đường sửa câu', () => {
    // Kể lại không đổi câu, nên câu ấy vẫn còn đó để sửa. Mất nó ở đây nghĩa là
    // người chơi phải chọn giữa "kể khác" và "sửa câu" ngay từ lần đầu.
    expect(useGame.getState().cauLuotTruoc).toBe('ta đi tiếp');
  });

  it('sửa câu thì câu cũ rời khung kể và engine phán lại theo câu mới', async () => {
    kichBan = ['Ngươi đổi ý giữa chừng.'];
    soLanKe = 0;
    await useGame.getState().rerollVoiCau('ta quay đầu lại');

    const scene = useGame.getState().scene;
    expect(scene.some((d) => d.loai === 'nguoi_choi' && d.noiDung === 'ta đi tiếp')).toBe(false);
    expect(scene.filter((d) => d.loai === 'nguoi_choi' && d.noiDung === 'ta quay đầu lại').length).toBe(1);
    // Câu mới trở thành câu sửa được của lượt mới — sửa tiếp được lần nữa.
    expect(useGame.getState().cauLuotTruoc).toBe('ta quay đầu lại');
  });

  it('cùng một câu cho cùng một thế giới, sửa bao nhiêu lần cũng vậy', async () => {
    /*
     * Bài giữ tính TẤT ĐỊNH của engine qua đường sửa câu.
     *
     * `resolve.ts` gieo RNG bằng `it_${demIntent}` rồi ném kết quả vào
     * `payload.thanhCong` của Event hành động — tức là vào chính câu engine đưa
     * cho Narrator kể. Bộ đếm ấy không lùi theo thế giới thì hai lần gửi CÙNG
     * một câu cho hai phán quyết khác nhau, và "sửa câu" lặng lẽ trở thành một
     * cái nút quay lại xúc xắc.
     *
     * Đo trên EVENT LOG chứ không chỉ trên `hashState`: Event hành động không
     * mang patch nào, nên một phán quyết lật ngược không làm state hash nhúc
     * nhích lấy một chút — bài đo bằng state hash sẽ xanh cả khi hỏng.
     */
    const loiKe = 'Ngươi dừng bước ở đúng chỗ ấy.';
    const dauVetPhanQuyet = (): string => {
      const ds = [...(useGame.getState().log?.tatCa() ?? [])].reverse();
      const ev = ds.find((e) => e.id.startsWith('ev_it_'));
      return ev === undefined ? '(không có Event hành động)' : `${ev.id}|${ev.hash}`;
    };

    kichBan = [loiKe];
    soLanKe = 0;
    await useGame.getState().rerollVoiCau('ta đứng lại nhìn quanh');
    const stateLanDau = hashState(useGame.getState().state as never);
    const phanQuyetLanDau = dauVetPhanQuyet();
    const soEventLanDau = useGame.getState().log?.soLuong() ?? 0;

    // Bài chỉ có nghĩa khi câu ấy thật sự sinh ra một phán quyết để mà so.
    expect(phanQuyetLanDau).not.toContain('không có');

    kichBan = [loiKe];
    soLanKe = 0;
    await useGame.getState().rerollVoiCau('ta đứng lại nhìn quanh');

    expect(dauVetPhanQuyet()).toBe(phanQuyetLanDau);
    expect(hashState(useGame.getState().state as never)).toBe(stateLanDau);
    // Và log không dài ra: lần sửa trước đã được cắt khỏi nó, không nằm lại.
    expect(useGame.getState().log?.soLuong()).toBe(soEventLanDau);
  });

  it('lượt không do người chơi gõ thì không có câu nào để sửa', async () => {
    kichBan = ['Thời gian đi một mình.'];
    soLanKe = 0;
    await useGame.getState().tick(1);

    // Trôi nhịp vẫn reroll được — chỉ là không có câu nào để viết lại.
    expect(useGame.getState().rerollDuoc).toBe(true);
    expect(useGame.getState().cauLuotTruoc).toBeNull();

    // Và gọi thẳng cũng không lùi lén về lượt gõ tay trước đó.
    const truoc = hashState(useGame.getState().state as never);
    const soGoi = soLanKe;
    await useGame.getState().rerollVoiCau('ta thử chen vào');
    expect(soLanKe).toBe(soGoi);
    expect(hashState(useGame.getState().state as never)).toBe(truoc);
  });

  it('cổng AI đóng thì reroll không kể gì — nó không phải cửa sau của ADR-0028', async () => {
    useAi.setState({ cfg: AiConfigSchema.parse({}) });
    expect(useAi.getState().cong().choPhepChoi).toBe(false);

    const truoc = hashState(useGame.getState().state as never);
    const soGoi = soLanKe;
    await useGame.getState().reroll();

    expect(soLanKe).toBe(soGoi);
    expect(hashState(useGame.getState().state as never)).toBe(truoc);
    expect(useGame.getState().loi.some((l) => l.code.startsWith('CONG_AI_'))).toBe(true);

    useAi.setState({ cfg: CAU_HINH_HOP_LE });
    useGame.getState().datTuDienHoa({ bat: true });
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
