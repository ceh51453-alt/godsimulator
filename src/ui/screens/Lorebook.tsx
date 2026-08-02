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
import { useMemo, useRef, useState } from 'react';
import { useGame } from '../../store/game.js';
import { bangDoiSoat, doiSoatEntry } from '../../core/lore/doiSoat.js';
import type { EntryCoNguon } from '../../core/lore/doiSoat.js';
import { banDoDiBiet } from '../../core/lore/kyVong.js';
import { duocNap } from '../../core/lore/tinCay.js';
import type { NguonLorebook, TrangThaiKyVong } from '../../core/lore/schema.js';
import { nut, nhanNho, the } from '../design/kieu.js';

const NHAN_NGUON: Readonly<Record<NguonLorebook, string>> = Object.freeze({
  nguoi_dung: 'Nguồn — bạn nhập',
  tu_sinh: 'Sử — thế giới tự ghi',
  di_san: 'Di sản — mang từ ván trước',
});

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
  const nhap = useGame((s) => s.nhapLorebookTuChuoi);
  const bat = useGame((s) => s.batLorebook);
  const oFile = useRef<HTMLInputElement>(null);
  const [tin, setTin] = useState('');

  const sach = useMemo(() => (state === null ? [] : [...state.lorebooks.values()]), [state]);

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
    return banDoDiBiet([...state.loreExpectations.values()], [...state.diBan.values()], state);
  }, [state]);

  if (state === null) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 22px 80px' }}>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 30, margin: 0 }}>Lorebook</h1>
        <p style={{ color: 'var(--tro)' }}>
          Lorebook thuộc về một thế giới cụ thể — nó fork theo nhánh như mọi thứ khác có trạng thái. Hãy mở
          một ván trước, rồi quay lại đây.
        </p>
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

      <Khoi
        ten="Sách"
        phu={`${sach.length} sách trên nhánh này · ${sach.filter((s) => s.bat).length} đang bật`}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={nut(true)} onClick={() => oFile.current?.click()}>
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
              if (!f) return;
              void (async () => {
                const ok = await nhap(await f.text(), f.name.replace(/\.json$/i, ''));
                setTin(ok ? `Đã nhập "${f.name}".` : `Không nhập được "${f.name}" — xem lỗi ở Tự Chẩn Đoán.`);
              })();
            }}
          />
          <span style={{ ...nhanNho, textTransform: 'none' }}>
            Hỗ trợ SillyTavern V2, V3 và định dạng Thiên Diễn.
          </span>
        </div>
        {tin !== '' && <p style={{ color: 'var(--tro)', fontSize: 13, margin: 0 }}>{tin}</p>}

        {sach.length === 0 ? (
          <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
            Chưa có sách nào. Thế giới vẫn chạy được — lorebook là lực hấp dẫn, không phải kịch bản.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {sach.map((lb) => {
              const soNap = lb.entries.filter((e) => duocNap(e)).length;
              const soChe = lb.entries.filter((e) => e.trangThai === 'bi_che').length;
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
                        onChange={(e) => bat(lb.id, e.target.checked)}
                      />
                      {lb.bat ? 'đang bật' : 'đang tắt'}
                    </label>
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
