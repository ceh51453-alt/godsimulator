/**
 * Vật Lý Thế Giới — Phần 43, 44. Màn thứ nhất trong ba màn còn nợ.
 *
 * ── Điều màn này phải nói cho được ──
 *
 * [BB] 43.2 — thế giới **luôn** vận hành theo một cấu hình nào đó. Bảy trục nền
 * có giá trị ngay từ nhịp 0. Nhưng:
 *
 * > "Trước khi được đặt tên, thời gian vẫn trôi một chiều — nhưng không ai lợi
 * > dụng được điều đó, vì lợi dụng đòi hỏi phải biết luật."
 *
 * Nên `vo_danh` **không phải** "chưa cấu hình" và cũng không phải một ô trống chờ
 * điền. Nó là một trạng thái có thật của thế giới, và bảng dưới đây phải hiện
 * tham số của một trục vô danh y như trục có tên — chỉ khác ở chỗ trục vô danh
 * không có kẽ hở nào, vì kẽ hở là thứ chỉ tồn tại khi có người biết luật.
 *
 * Đó cũng là lý do cột "Kẽ hở" trống ở trục vô danh không được hiển thị như một
 * thiếu sót.
 */
import { useMemo, useState } from 'react';
import { useGame } from '../../store/game.js';
import { TRUC_NEN, PHU_THUOC_TRUC, KHAI_NIEM_NEN_CUA_TRUC } from '../../core/vatly/schema.js';
import type { TrucNen } from '../../core/vatly/schema.js';
import { NHAN_TRUC_NEN, daCoTen } from '../../core/vatly/luatNen.js';
import { CO_CHE } from '../../core/vatly/coChe.js';
import type { CoCheId } from '../../core/vatly/schema.js';
import { nut, nhanNho, the, oNhap } from '../design/kieu.js';

function Khoi({ ten, phu, children }: { ten: string; phu?: string; children: React.ReactNode }): JSX.Element {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <header>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }}>{ten}</h2>
        {phu !== undefined && <p style={{ margin: '2px 0 0', color: 'var(--mo)', fontSize: 13 }}>{phu}</p>}
      </header>
      {children}
    </section>
  );
}

function TrucNenDong({ truc }: { truc: TrucNen }): JSX.Element {
  const state = useGame((s) => s.state);
  const datTen = useGame((s) => s.datTenTrucNen);
  const [moForm, setMoForm] = useState(false);
  const [khaiNiem, setKhaiNiem] = useState('');
  const [chan, setChan] = useState<readonly string[]>([]);

  const ds = useMemo(() => (state === null ? [] : [...state.substrateLaws.values()]), [state]);
  const ln = ds.find((x) => x.truc === truc);
  const coTen = ln?.trangThai === 'co_ten';

  /**
   * Khái niệm đủ điều kiện làm nền cho trục này.
   *
   * Lọc ngay ở đây thay vì để `datTenTruc()` từ chối sau: 43.3 đòi khái niệm nền
   * ít nhất `thanh_hinh`, và đưa người chơi một danh sách rồi từ chối mọi lựa
   * chọn trong đó là cách chắc chắn nhất để họ nghĩ tính năng bị hỏng.
   */
  const ungVien = useMemo(() => {
    if (state === null) return [];
    const hopLe = KHAI_NIEM_NEN_CUA_TRUC[truc];
    return [...state.entities.values()].filter((e) => {
      if (e.kind !== 'concept') return false;
      const c = e.aspects['conceptual'] as { giaiDoan?: string } | undefined;
      if (c?.giaiDoan === 'hu_danh' || c?.giaiDoan === 'manh_nha') return false;
      return hopLe.some((h) => e.id.includes(h) || e.tags.includes(h));
    });
  }, [state, truc]);

  const phuThuoc = PHU_THUOC_TRUC[truc];
  const thieuPhuThuoc = phuThuoc.filter((t) => !daCoTen(ds, t));

  return (
    <li style={{ ...the, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 18 }}>{NHAN_TRUC_NEN[truc]}</strong>
        {/* [BB] luật bất biến #9 — trạng thái bằng CHỮ. */}
        <span style={{ ...nhanNho, color: coTen ? 'var(--ngoc)' : 'var(--mo)' }}>
          {coTen ? 'ĐÃ ĐẶT TÊN' : 'CÒN VÔ DANH'}
        </span>
        <span style={{ flex: 1 }} />
        {coTen && ln?.tickDatTen !== null && ln !== undefined && (
          <span style={{ ...nhanNho, textTransform: 'none' }}>đặt tên ở nhịp {ln.tickDatTen}</span>
        )}
      </div>

      {ln !== undefined && Object.keys(ln.thamSo).length > 0 && (
        <dl style={{ margin: 0, display: 'grid', gap: 3, fontSize: 13 }}>
          {Object.entries(ln.thamSo).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 10 }}>
              <dt style={{ color: 'var(--mo)', minWidth: 160 }}>{k}</dt>
              <dd style={{ margin: 0, color: 'var(--tro)', fontFamily: 'var(--chu-so)' }}>{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {coTen ? (
        ln !== undefined && ln.keHo.length > 0 ? (
          <div>
            <span style={nhanNho}>KẼ HỞ ĐÃ MỞ RA</span>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }}>
              {ln.keHo.map((k, i) => (
                <li key={i}>
                  {k.moTa}
                  {k.daBiKhaiThac ? ' — đã có người khai thác' : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--mo)' }}>
          Trục này vẫn đang vận hành theo tham số trên. Chưa ai gọi tên nó, nên chưa ai lợi dụng được nó — lợi
          dụng đòi hỏi phải biết luật.
        </p>
      )}

      {!coTen && (
        <div style={{ display: 'grid', gap: 8 }}>
          {thieuPhuThuoc.length > 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tro)' }}>
              Chưa đặt tên được: {thieuPhuThuoc.map((t) => NHAN_TRUC_NEN[t]).join(' và ')} còn vô danh. Thứ tự
              phụ thuộc không phải quy ước — nó là điều kiện để câu ấy có nghĩa.
            </p>
          ) : moForm ? (
            <>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={nhanNho}>KHÁI NIỆM NỀN</span>
                {ungVien.length === 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--tro)' }}>
                    Thế giới chưa có khái niệm nào đủ thành hình để làm nền cho trục này. Cần một trong:{' '}
                    {KHAI_NIEM_NEN_CUA_TRUC[truc].join(', ')}.
                  </span>
                ) : (
                  <select style={oNhap} value={khaiNiem} onChange={(e) => setKhaiNiem(e.target.value)}>
                    <option value="">— chọn —</option>
                    {ungVien.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.ten}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={nut(true, khaiNiem === '')}
                  disabled={khaiNiem === ''}
                  onClick={() => {
                    const l = datTen(truc, khaiNiem);
                    setChan(l);
                    if (l.length === 0) setMoForm(false);
                  }}
                >
                  Đặt tên trục này
                </button>
                <button type="button" style={nut()} onClick={() => setMoForm(false)}>
                  Thôi
                </button>
              </div>
              {chan.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--hoi)' }}>
                  {chan.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <button type="button" style={{ ...nut(), justifySelf: 'start' }} onClick={() => setMoForm(true)}>
              Đặt tên trục này
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function VatLy(): JSX.Element {
  const state = useGame((s) => s.state);
  const quet = useGame((s) => s.quetCoCheNgay);
  const [congBo, setCongBo] = useState<readonly string[]>([]);
  const [daQuet, setDaQuet] = useState(false);

  const coCheRows = useMemo(() => (state === null ? [] : [...state.coChe.values()]), [state]);
  const soCoTen = useMemo(
    () =>
      state === null ? 0 : [...state.substrateLaws.values()].filter((x) => x.trangThai === 'co_ten').length,
    [state],
  );

  if (state === null) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px' }}>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }}>Vật Lý Thế Giới</h1>
        <p style={{ color: 'var(--tro)' }}>
          Luật Nền thuộc về một thế giới cụ thể và fork theo nhánh. Hãy mở một ván trước.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }}>
      <header>
        <p style={nhanNho}>KHỐI L · PHẦN 43 – 44</p>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }}>
          Vật Lý Thế Giới
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 14 }}>
          Bảy trục nền, <b>{soCoTen}</b> đã được đặt tên. Hiểu biết tạo ra vật lý, và vật lý tạo ra kẽ hở —
          đặt tên một trục là mở ra cả hai.
        </p>
      </header>

      <Khoi
        ten="Bảy trục Luật Nền"
        phu="Sửa một trục đã đặt tên LUÔN bắt tách nhánh mới (43.6) — không có đường viết đè lên dòng thời gian này."
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {TRUC_NEN.map((t) => (
            <TrucNenDong key={t} truc={t} />
          ))}
        </ul>
      </Khoi>

      <Khoi
        ten="Cơ chế phái sinh"
        phu="Không bật bằng công tắc. Chúng xuất hiện khi Luật Nền đủ điều kiện, và biến mất khi điều kiện vỡ."
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={nut(true)}
            onClick={() => {
              setCongBo(quet());
              setDaQuet(true);
            }}
          >
            Quét lại điều kiện
          </button>
          <span style={{ ...nhanNho, textTransform: 'none' }}>
            {daQuet
              ? congBo.length === 0
                ? 'Không cơ chế nào đổi trạng thái.'
                : `${congBo.length} cơ chế vừa đổi — xem khung kể.`
              : 'Engine tự quét ở mốc cuối kỷ nguyên; nút này để xem ngay.'}
          </span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {(Object.keys(CO_CHE) as CoCheId[]).sort().map((id) => {
            const dn = CO_CHE[id];
            const row = coCheRows.find((r) => r.id === id);
            const bat = row?.bat === true;
            return (
              <li key={id} style={{ ...the, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 18 }}>{dn.ten}</strong>
                  <span style={{ ...nhanNho, color: bat ? 'var(--ngoc)' : 'var(--mo)' }}>
                    {bat ? 'ĐANG CÓ MẶT' : 'CHƯA TỒN TẠI'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--tro)' }}>
                  {bat ? dn.moTaKhiCo : dn.moTaKhiKhong}
                </p>
                {/*
                 * [BB] 44.5 — "phải nói rõ còn thiếu gì". Một cơ chế tắt mà không
                 * nói vì sao tắt thì người chơi không có đường nào bật nó.
                 */}
                {!bat && row !== undefined && row.conThieu.length > 0 && (
                  <div>
                    <span style={nhanNho}>CÒN THIẾU</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }}>
                      {row.conThieu.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {row === undefined && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
                    Chưa quét lần nào trên nhánh này.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Khoi>
    </main>
  );
}
