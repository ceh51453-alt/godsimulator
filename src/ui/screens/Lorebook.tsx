/**
 * Lorebook, Bảng Đối Soát và Bản Đồ Dị Biệt — Phần 51.7, 35.6.
 *
 * ── Một trong bốn màn còn nợ từ Phase 11 ──
 *
 * Phase 10 dựng đủ máy móc: `nhapLorebook()` đọc ba định dạng, `doiSoatEntry()`
 * phân loại bốn quan hệ, `banDoDiBiet()` dựng hồ sơ lệch. Không màn nào gọi tới
 * chúng, nên trong hai phase liền một lorebook nhập vào là một file nằm im.
 *
 * ── Ba khối, và thứ tự của chúng có nghĩa ──
 *
 *   Sách        — cái gì đang bật, và bật thì nó ảnh hưởng ra sao
 *   Đối soát    — [BB] 51.2 Sử thắng Nguồn: chỗ hai bên nói khác nhau
 *   Dị biệt     — [BB] 35.6 "không phải bảng lỗi", mà là hồ sơ thế giới đã
 *                 trở thành cái gì
 *
 * Đọc từ dưới lên cũng được, nhưng đọc từ trên xuống mới thấy được vì sao một
 * kỳ vọng lệch: vì một entry bị che, vì một sách bị tắt, hoặc vì thế giới đã đi
 * lối khác. Ba khối ngược lại thì mất mạch ấy.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { useThuVienLorebook } from '../../store/lorebook.js';
import { bangDoiSoat, doiSoatEntry } from '../../core/lore/doiSoat.js';
import type { EntryCoNguon } from '../../core/lore/doiSoat.js';
import { banDoDiBiet } from '../../core/lore/kyVong.js';
import { duocNap } from '../../core/lore/tinCay.js';
import { giaiDoanLore } from '../../core/lore/ejs.js';
import type { NguonLorebook, TrangThaiKyVong } from '../../core/lore/schema.js';
import { nut, nhanNho, the } from '../design/kieu.js';

const NHAN_NGUON: Readonly<Record<NguonLorebook, string>> = Object.freeze({
  nguoi_dung: 'Nguồn — bạn nhập',
  tu_sinh: 'Sử — thế giới tự ghi',
  di_san: 'Di sản — mang từ ván trước',
});

/**
 * Sách dựng sẵn nằm ở `public/lorebooks/` và được dựng bằng script trong
 * `tools/`. Chúng đi qua đúng đường nhập của một file người dùng kéo vào —
 * không có đường tắt nào ghi thẳng vào state — nên một sách dựng sẵn hỏng thì
 * hỏng y như một sách nhập vào, và hiện lỗi ở cùng một chỗ.
 */
const DUNG_SAN = Object.freeze([
  Object.freeze({
    tep: 'than-thoai-an-do.json',
    ten: 'Thần thoại Ấn Độ',
    moTa: 'Thế giới trống kết tinh dần thành Bharata; mười bốn cõi Loka mở dần chứ không bày ra một lượt.',
  }),
  Object.freeze({
    tep: 'than-thoai-hy-lap.json',
    ten: 'Thần thoại Hy Lạp',
    moTa: 'Thế giới trống kết tinh dần thành Olympus qua năm tầng: dấu hiệu, danh xưng, luật, cõi giới, sử thi.',
  }),
]);

const NHAN_KY_VONG: Readonly<Record<TrangThaiKyVong, string>> = Object.freeze({
  cho: 'đang chờ',
  da_thoa: 'đã thành',
  da_lech: 'đã lệch',
  bat_kha: 'không còn khả thi',
});

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

export function Lorebook(): JSX.Element {
  const state = useGame((s) => s.state);
  const stateHash = useGame((s) => s.stateHash);
  const nhap = useGame((s) => s.nhapLorebookTuChuoi);
  const bat = useGame((s) => s.batLorebook);
  const xoa = useGame((s) => s.xoaLorebook);
  const thuVien = useThuVienLorebook((s) => s.muc);
  const daNapThuVien = useThuVienLorebook((s) => s.daNap);
  const dangXuLyThuVien = useThuVienLorebook((s) => s.dangXuLy);
  const loiThuVien = useThuVienLorebook((s) => s.loi);
  const napThuVien = useThuVienLorebook((s) => s.napTuDia);
  const themThuVien = useThuVienLorebook((s) => s.themTuChuoi);
  const chonChoVanMoi = useThuVienLorebook((s) => s.datChonChoVanMoi);
  const xoaKhoiThuVien = useThuVienLorebook((s) => s.xoaKhoiThuVien);
  const oFile = useRef<HTMLInputElement>(null);
  const [tin, setTin] = useState('');
  const [dangThemDungSan, setDangThemDungSan] = useState('');

  /*
   * `WorldState` chứa Map và Event engine sửa Map tại chỗ. Theo dõi thêm hash
   * nội dung để danh sách không giữ mảng cũ trong một render đã được batch — lỗi
   * ấy khiến sách chỉ hiện sau khi chuyển tab rồi quay lại.
   */
  const sach = useMemo(() => (state === null ? [] : [...state.lorebooks.values()]), [state, stateHash]);

  useEffect(() => {
    if (!daNapThuVien) void napThuVien();
  }, [daNapThuVien, napThuVien]);

  const themMucVaoVan = async (noiDung: string, ten: string): Promise<boolean> => {
    if (state === null) return false;
    if (sach.some((lb) => lb.ten.trim().toLocaleLowerCase('vi') === ten.trim().toLocaleLowerCase('vi'))) {
      setTin(`“${ten}” đã có trong ván này.`);
      return true;
    }
    const ok = await nhap(noiDung, ten);
    setTin(
      ok
        ? `Đã thêm “${ten}” vào ván này. Sách đang tắt để bạn tự quyết định lúc bắt đầu ảnh hưởng.`
        : `Không thêm được “${ten}” vào ván.`,
    );
    return ok;
  };

  const themDungSan = async (muc: (typeof DUNG_SAN)[number]): Promise<void> => {
    setDangThemDungSan(muc.tep);
    try {
      const url = `${import.meta.env.BASE_URL}lorebooks/${muc.tep}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const noiDung = await response.text();
      const okThuVien = await themThuVien(noiDung, muc.ten, {
        dungSan: true,
        chonChoVanMoi: state === null,
      });
      if (!okThuVien) return;
      if (state !== null) {
        await themMucVaoVan(noiDung, muc.ten);
      } else {
        setTin(`Đã thêm và chọn “${muc.ten}” cho ván mới. Bạn có thể bỏ tick nếu chưa muốn dùng.`);
      }
    } catch (error) {
      setTin(`Không đọc được Lorebook dựng sẵn: ${error instanceof Error ? error.message : String(error)}.`);
    } finally {
      setDangThemDungSan('');
    }
  };

  const nhapFile = async (file: File): Promise<void> => {
    const noiDung = await file.text();
    const ten = file.name.replace(/\.json$/i, '');
    const okThuVien = await themThuVien(noiDung, ten, { chonChoVanMoi: state === null });
    if (!okThuVien) return;
    if (state !== null) {
      await themMucVaoVan(noiDung, ten);
    } else {
      setTin(`Đã nhập và chọn “${ten}” cho ván mới.`);
    }
  };

  const khoiThuVien = (
    <Khoi
      ten="Lorebook cho ván mới"
      phu={`${thuVien.filter((x) => x.chonChoVanMoi).length}/${thuVien.length} sách sẽ tự nạp và bật khi tạo ván`}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {DUNG_SAN.map((muc) => (
          <button
            key={muc.tep}
            type="button"
            title={muc.moTa}
            style={nut(false, dangThemDungSan !== '' || dangXuLyThuVien)}
            disabled={dangThemDungSan !== '' || dangXuLyThuVien}
            onClick={() => void themDungSan(muc)}
          >
            {dangThemDungSan === muc.tep ? 'Đang thêm…' : `Thêm ${muc.ten}`}
          </button>
        ))}
        <button
          type="button"
          style={nut(true, dangXuLyThuVien)}
          disabled={dangXuLyThuVien}
          onClick={() => oFile.current?.click()}
        >
          Nhập lorebook (.json)
        </button>
        <input
          ref={oFile}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void nhapFile(f);
          }}
        />
        <span style={{ ...nhanNho, textTransform: 'none' }}>
          Hỗ trợ SillyTavern V2, V3 và định dạng Thiên Diễn.
        </span>
      </div>
      {(tin !== '' || loiThuVien !== '') && (
        <p
          role={loiThuVien !== '' ? 'alert' : 'status'}
          style={{ color: loiThuVien !== '' ? 'var(--hoi)' : 'var(--tro)', fontSize: 13, margin: 0 }}
        >
          {loiThuVien || tin}
        </p>
      )}
      {!daNapThuVien ? (
        <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>Đang đọc thư viện Lorebook…</p>
      ) : thuVien.length === 0 ? (
        <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
          Chưa có sách trong thư viện. Nhập một file hoặc thêm sách dựng sẵn, rồi tick sách muốn dùng cho ván
          mới.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {thuVien.map((muc) => {
            const daCoTrongVan = sach.some(
              (lb) => lb.ten.trim().toLocaleLowerCase('vi') === muc.ten.trim().toLocaleLowerCase('vi'),
            );
            return (
              <li key={muc.id} style={{ ...the, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 17 }}>{muc.ten}</strong>
                  <span style={nhanNho}>{muc.soEntry} entry</span>
                  <span style={{ flex: 1 }} />
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={muc.chonChoVanMoi}
                      onChange={(e) => void chonChoVanMoi(muc.id, e.currentTarget.checked)}
                    />
                    dùng cho ván mới
                  </label>
                </div>
                {muc.moTa.trim() !== '' && (
                  <p style={{ margin: 0, color: 'var(--tro)', fontSize: 13 }}>{muc.moTa}</p>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {state !== null && (
                    <button
                      type="button"
                      style={nut(false, daCoTrongVan)}
                      disabled={daCoTrongVan}
                      onClick={() => void themMucVaoVan(muc.noiDung, muc.ten)}
                    >
                      {daCoTrongVan ? 'Đã có trong ván' : 'Thêm vào ván này'}
                    </button>
                  )}
                  <button
                    type="button"
                    style={{ ...nut(false), color: 'var(--hoi)' }}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Xóa “${muc.ten}” khỏi thư viện? Sách đã nằm trong các ván cũ vẫn được giữ.`,
                        )
                      ) {
                        void xoaKhoiThuVien(muc.id);
                      }
                    }}
                  >
                    Xóa khỏi thư viện
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Khoi>
  );

  /**
   * Đối soát chạy trên entry của sách ĐANG BẬT.
   *
   * Sách tắt không tham gia: nó không vào prompt, nên nó không mâu thuẫn được
   * với ai cả. Đối soát một sách đã tắt sẽ dựng một bảng đầy mâu thuẫn mà người
   * chơi không có cách nào xử lý — đúng loại báo động giả 51.7 muốn tránh.
   */
  const bang = useMemo(() => {
    const coNguon: EntryCoNguon[] = [];
    for (const lb of sach) {
      if (!lb.bat) continue;
      for (const e of lb.entries) {
        if (e.trangThai === 'da_xoa') continue;
        coNguon.push({ entry: e, lorebookId: lb.id, nguon: lb.nguon });
      }
    }
    const ds = coNguon.flatMap((m) => doiSoatEntry(m, coNguon));
    // Mỗi cặp bị duyệt hai lần (A với B, rồi B với A) — gộp theo cặp không thứ tự.
    const daThay = new Set<string>();
    const mot = ds.filter((d) => {
      const k = d.moiId < d.cuId ? `${d.moiId}|${d.cuId}` : `${d.cuId}|${d.moiId}`;
      if (daThay.has(k)) return false;
      daThay.add(k);
      return true;
    });
    return bangDoiSoat(mot, state?.world.year ?? 0, coNguon.length);
  }, [sach, state]);

  const banDo = useMemo(() => {
    if (state === null) return null;
    const dangBat = new Set([...state.lorebooks.values()].filter((lb) => lb.bat).map((lb) => lb.id));
    return banDoDiBiet(
      [...state.loreExpectations.values()].filter((kv) => dangBat.has(kv.lorebookId)),
      [...state.diBan.values()],
      state,
    );
  }, [state]);

  if (state === null) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }}>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }}>Lorebook</h1>
        <p style={{ color: 'var(--tro)', margin: 0 }}>
          Chuẩn bị sách trước khi tạo thế giới. Sách được tick sẽ tự nạp và bật ngay từ lời kể đầu tiên; bỏ
          tick không xóa sách và không ảnh hưởng các ván đã có.
        </p>
        {khoiThuVien}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 28 }}>
      <header>
        <p style={nhanNho}>KHỐI L · PHẦN 51 – 53</p>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }}>
          Lorebook và Đối Soát
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 14 }}>
          Sách bạn nhập là <b>Nguồn</b>: điều thế giới lẽ ra phải trở thành. Sách thế giới tự ghi là <b>Sử</b>
          : điều nó đã thực sự trở thành. Mâu thuẫn thì Sử thắng — không phải vì Sử đúng hơn, mà vì không được
          nói dối về chuyện đã rồi.
        </p>
      </header>

      {khoiThuVien}

      <Khoi
        ten="Sách trong ván này"
        phu={`${sach.length} sách trên nhánh này · ${sach.filter((s) => s.bat).length} đang bật`}
      >
        {sach.length === 0 ? (
          <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
            Chưa có sách nào. Thế giới vẫn chạy được — lorebook là lực hấp dẫn, không phải kịch bản.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {sach.map((lb) => {
              const soNap = lb.entries.filter((e) => duocNap(e)).length;
              const soChe = lb.entries.filter((e) => e.trangThai === 'bi_che').length;
              const giaiDoan = giaiDoanLore(lb, state.world.tick);
              return (
                <li key={lb.id} style={{ ...the, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 18 }}>{lb.ten}</strong>
                    <span style={nhanNho}>{NHAN_NGUON[lb.nguon]}</span>
                    <span style={{ flex: 1 }} />
                    <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={lb.bat}
                        onChange={(e) => bat(lb.id, e.currentTarget.checked)}
                      />
                      {lb.bat ? 'đang bật' : 'đang tắt'}
                    </label>
                    <button
                      type="button"
                      style={{ ...nut(false), color: 'var(--hoi)', padding: '5px 10px' }}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Xóa “${lb.ten}” khỏi ván này? Các nhân vật và địa danh đã xuất hiện sẽ vẫn là lịch sử.`,
                          )
                        ) {
                          void xoa(lb.id);
                        }
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                  {lb.moTa.trim() !== '' && (
                    <p style={{ margin: 0, color: 'var(--tro)', fontSize: 13 }}>{lb.moTa}</p>
                  )}
                  <div
                    style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}
                  >
                    <span>
                      <b style={{ fontFamily: 'var(--chu-so)' }}>{lb.entries.length}</b> entry
                    </span>
                    <span>
                      <b style={{ fontFamily: 'var(--chu-so)' }}>{soNap}</b> đủ tin cậy để nạp
                    </span>
                    <span>
                      <b style={{ fontFamily: 'var(--chu-so)' }}>{soChe}</b> bị che
                    </span>
                    <span>
                      lực hấp dẫn <b style={{ fontFamily: 'var(--chu-so)' }}>{lb.lucHapDan}</b>
                    </span>
                    {lb.bat && (
                      <span>
                        đang mở lớp <b style={{ fontFamily: 'var(--chu-so)' }}>{Math.min(4, giaiDoan)}</b>/4
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Khoi>

      <Khoi
        ten="Bảng Đối Soát"
        phu="Chỗ hai entry nói về cùng một thứ. Che không phải xóa — bản gốc còn nguyên."
      >
        <div style={{ ...the, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}>
            <span>
              mâu thuẫn <b style={{ fontFamily: 'var(--chu-so)' }}>{bang.mauThuan.length}</b>
            </span>
            <span>
              trùng lặp <b style={{ fontFamily: 'var(--chu-so)' }}>{bang.trungLap.length}</b>
            </span>
            <span>
              bổ sung <b style={{ fontFamily: 'var(--chu-so)' }}>{bang.boSung.length}</b>
            </span>
            <span>
              làm rõ <b style={{ fontFamily: 'var(--chu-so)' }}>{bang.lamRo.length}</b>
            </span>
          </div>
          {bang.mauThuan.length === 0 && bang.trungLap.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
              Chưa có chỗ nào hai sách nói khác nhau.
            </p>
          ) : (
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                color: 'var(--tro)',
                fontSize: 13,
                display: 'grid',
                gap: 4,
              }}
            >
              {[...bang.mauThuan, ...bang.trungLap].slice(0, 20).map((d) => (
                <li key={`${d.moiId}|${d.cuId}`}>
                  <b>{d.quanHe === 'mau_thuan' ? 'Mâu thuẫn' : 'Trùng lặp'}</b> — {d.lyDo}{' '}
                  <span style={{ color: 'var(--mo)' }}>
                    (xử lý: {d.xuLy === 'che' ? `che "${d.cheId}"` : d.xuLy.replace(/_/g, ' ')})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Khoi>

      <Khoi
        ten="Bản Đồ Dị Biệt"
        phu="Đây không phải bảng lỗi. Nó là hồ sơ về việc thế giới của bạn đã trở thành cái gì."
      >
        <div style={{ ...the, display: 'grid', gap: 8 }}>
          {banDo === null || banDo.dong.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
              Chưa có kỳ vọng nào để đo. Kỳ vọng sinh ra khi bạn nhập một lorebook có mô tả điều gì đó phải
              tồn tại.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}>
                <span>
                  đã thành <b style={{ fontFamily: 'var(--chu-so)' }}>{banDo.daThoa}</b>
                </span>
                <span>
                  đang chờ <b style={{ fontFamily: 'var(--chu-so)' }}>{banDo.dangCho}</b>
                </span>
                <span>
                  đã lệch <b style={{ fontFamily: 'var(--chu-so)' }}>{banDo.daLech}</b>
                </span>
                <span>
                  không còn khả thi <b style={{ fontFamily: 'var(--chu-so)' }}>{banDo.batKha}</b>
                </span>
              </div>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--mo)' }}>
                    <th style={{ padding: '4px 8px 4px 0', fontWeight: 400 }}>Kỳ vọng</th>
                    <th style={{ padding: '4px 8px 4px 0', fontWeight: 400 }}>Thế giới của bạn</th>
                    <th style={{ padding: '4px 0', fontWeight: 400 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {banDo.dong.slice(0, 40).map((d, i) => (
                    <tr key={`${d.kyVong}-${i}`} style={{ borderTop: '1px solid var(--kinh-vien)' }}>
                      <td style={{ padding: '6px 8px 6px 0', color: 'var(--tro)' }}>{d.kyVong}</td>
                      <td style={{ padding: '6px 8px 6px 0', color: 'var(--sang)' }}>{d.theGioiCuaBan}</td>
                      <td style={{ padding: '6px 0', color: 'var(--tro)' }}>{NHAN_KY_VONG[d.trangThai]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Khoi>
    </main>
  );
}
