/**
 * Bản Đồ Nhánh — Phần 26.2. Màn thứ hai trong ba màn còn nợ.
 *
 * ── Vì sao nó dựng từ cùng một danh sách với "File save" ──
 *
 * ADR-0054: một ván **là** một nhánh. Nếu màn này đọc một danh sách khác với
 * danh sách của Sảnh Vào thì sớm muộn hai danh sách sẽ lệch nhau, và người chơi
 * sẽ thấy một nhánh ở chỗ này mà không thấy ở chỗ kia. Cùng `danhSachVan`, chỉ
 * khác cách xếp: ở đây nó thành cây theo `gocId`.
 *
 * ── Vì sao tách nhánh không phải một nút "sao lưu" ──
 *
 * [BB] 43.6 — sửa Luật Nền **luôn** bắt tách nhánh. Nhánh không phải bản sao dự
 * phòng; nó là một dòng thời gian song song, và cả hai đều thật. Vì thế nút ở
 * đây hỏi **lý do tách**, và lý do ấy được lưu: sáu tháng sau, "nhánh 3" không
 * nói lên điều gì, còn "thử để Thời Gian hai chiều" thì có.
 */
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import type { MucSave } from '../../db/quanLySave.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';

const NHAN_TANG: Readonly<Record<string, string>> = Object.freeze({
  sang_the: 'Sáng Thế',
  than: 'Thần',
  pham_nhan: 'Phàm Nhân',
});

type Nut = { muc: MucSave; con: Nut[] };

/**
 * Dựng cây từ danh sách phẳng.
 *
 * Nhánh có `gocId` trỏ tới một nhánh KHÔNG còn trong danh sách vẫn phải hiện —
 * nó thành nút gốc. Bỏ nó đi sẽ làm một ván biến mất khỏi giao diện chỉ vì cha
 * nó đã bị xóa, và đó là cách tệ nhất để mất dữ liệu: mất mà không báo.
 */
function dungCay(ds: readonly MucSave[]): Nut[] {
  const theoId = new Map(ds.map((m) => [m.branchId, m]));
  const nut = new Map<string, Nut>(ds.map((m) => [m.branchId, { muc: m, con: [] }]));
  const goc: Nut[] = [];
  for (const m of ds) {
    const n = nut.get(m.branchId) as Nut;
    const cha = m.gocId !== null ? nut.get(m.gocId) : undefined;
    if (cha !== undefined && theoId.has(m.gocId as string)) cha.con.push(n);
    else goc.push(n);
  }
  const sapXep = (ns: Nut[]): void => {
    ns.sort((a, b) =>
      a.muc.tick !== b.muc.tick ? a.muc.tick - b.muc.tick : a.muc.branchId < b.muc.branchId ? -1 : 1,
    );
    for (const n of ns) sapXep(n.con);
  };
  sapXep(goc);
  return goc;
}

function DongNhanh({
  nut: n,
  sau,
  dangMo,
  dangBan,
  onMo,
}: {
  nut: Nut;
  sau: number;
  dangMo: boolean;
  dangBan: boolean;
  onMo: () => void;
}): JSX.Element {
  const m = n.muc;
  return (
    <>
      <li
        style={{
          ...the,
          marginLeft: sau * 22,
          display: 'grid',
          gap: 6,
          borderLeft: sau > 0 ? '2px solid var(--kinh-sang)' : undefined,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 17 }}>{m.ten}</strong>
          {/* Trạng thái bằng chữ, không bằng màu. */}
          <span style={nhanNho}>
            {dangMo ? 'ĐANG CHƠI' : m.gocId === null ? 'GỐC' : `TÁCH Ở LƯỢT ${m.tick}`}
          </span>
        </div>
        {m.lyDoTach.trim() !== '' && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--tro)' }}>Tách vì: {m.lyDoTach}</p>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}>
          <span>
            lượt <b style={{ fontFamily: 'var(--chu-so)' }}>{m.tick}</b>
          </span>
          <span>
            năm <b style={{ fontFamily: 'var(--chu-so)' }}>{m.nam}</b>
          </span>
          <span>tầng {NHAN_TANG[m.mode] ?? m.mode}</span>
          <span>
            <b style={{ fontFamily: 'var(--chu-so)' }}>{m.soEntity}</b> thực thể
          </span>
          <span>
            <b style={{ fontFamily: 'var(--chu-so)' }}>{m.soSuKien}</b> sự kiện
          </span>
        </div>
        {!dangMo && (
          <button
            type="button"
            style={{ ...nut(false, dangBan), justifySelf: 'start' }}
            disabled={dangBan}
            onClick={onMo}
          >
            Nhảy sang nhánh này
          </button>
        )}
      </li>
      {n.con.map((c) => (
        <DongNhanhCon key={c.muc.branchId} nut={c} sau={sau + 1} dangBan={dangBan} />
      ))}
    </>
  );
}

/** Nhánh con — tách ra để `dangMo` được tính lại ở mỗi tầng mà không truyền tay. */
function DongNhanhCon({ nut: n, sau, dangBan }: { nut: Nut; sau: number; dangBan: boolean }): JSX.Element {
  const hienTai = useGame((s) => s.state?.world.branchId ?? '');
  const tiepTuc = useGame((s) => s.tiepTucVan);
  return (
    <DongNhanh
      nut={n}
      sau={sau}
      dangMo={n.muc.branchId === hienTai}
      dangBan={dangBan}
      onMo={() => void tiepTuc(n.muc.branchId)}
    />
  );
}

export function BanDoNhanh(): JSX.Element {
  const ds = useGame((s) => s.danhSachVan);
  const napDs = useGame((s) => s.napDanhSachVan);
  const hienTai = useGame((s) => s.state?.world.branchId ?? '');
  const tickHienTai = useGame((s) => s.state?.world.tick ?? 0);
  const tiepTuc = useGame((s) => s.tiepTucVan);
  const tach = useGame((s) => s.tachNhanh);

  const [ten, setTen] = useState('');
  const [lyDo, setLyDo] = useState('');
  const [dangBan, setDangBan] = useState(false);
  const [tin, setTin] = useState('');

  useEffect(() => {
    void napDs();
  }, [napDs]);

  const cay = useMemo(() => dungCay(ds), [ds]);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 26 }}>
      <header>
        <p style={nhanNho}>PHẦN 26 · COPY-ON-WRITE</p>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }}>
          Bản Đồ Nhánh
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 14 }}>
          Nhánh không phải bản sao dự phòng. Nó là một dòng thời gian song song, và cả hai đều thật. Tách
          nhánh không sao chép dữ liệu — bản sao chỉ sinh ra ở chỗ hai nhánh thật sự khác nhau.
        </p>
      </header>

      {hienTai !== '' && (
        <section style={{ ...the, display: 'grid', gap: 10 }}>
          <h2 style={{ ...nhanNho, margin: 0 }}>TÁCH NHÁNH TỪ LƯỢT {tickHienTai}</h2>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={nhanNho}>TÊN NHÁNH</span>
              <input
                style={oNhap}
                value={ten}
                maxLength={80}
                placeholder="Dòng thời gian thứ hai"
                onChange={(e) => setTen(e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={nhanNho}>LÝ DO TÁCH</span>
              <input
                style={oNhap}
                value={lyDo}
                maxLength={200}
                placeholder="thử để Thời Gian hai chiều"
                onChange={(e) => setLyDo(e.target.value)}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={nut(true, dangBan)}
              disabled={dangBan}
              onClick={() => {
                setDangBan(true);
                void tach(ten, lyDo)
                  .then((ok) => {
                    setTin(ok ? 'Đã tách và nhảy sang nhánh mới.' : 'Không tách được — xem Tự Chẩn Đoán.');
                    if (ok) {
                      setTen('');
                      setLyDo('');
                    }
                  })
                  .finally(() => setDangBan(false));
              }}
            >
              {dangBan ? 'Đang tách…' : 'Tách nhánh và nhảy sang'}
            </button>
            <span style={{ ...nhanNho, textTransform: 'none' }}>
              Nhánh cha giữ nguyên. Bạn quay lại nó bất cứ lúc nào từ cây bên dưới.
            </span>
          </div>
          {tin !== '' && <p style={{ margin: 0, fontSize: 13, color: 'var(--tro)' }}>{tin}</p>}
        </section>
      )}

      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }}>Cây nhánh</h2>
        {cay.length === 0 ? (
          <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
            Chưa có ván nào trên máy này. Nhánh đầu tiên sinh ra cùng ván đầu tiên.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {cay.map((n) => (
              <DongNhanh
                key={n.muc.branchId}
                nut={n}
                sau={0}
                dangMo={n.muc.branchId === hienTai}
                dangBan={dangBan}
                onMo={() => void tiepTuc(n.muc.branchId)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
