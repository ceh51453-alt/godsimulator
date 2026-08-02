/**
 * Xưởng Registry — Phần 5.4, 62. Màn thứ ba trong ba màn còn nợ.
 *
 * ── Câu quyết định toàn bộ màn này ──
 *
 * [BB] 62.2 — **manifest là JSON thuần; runtime handler nằm trong code.** Một
 * world pack không mang theo mã chạy được, và `quetDauVetCode()` là chỗ ép điều
 * đó: bất kỳ chuỗi nào trông giống hàm, `eval`, hay `require` đều làm cả pack bị
 * từ chối trước khi nó chạm vào `R`.
 *
 * ── Ba trạng thái, và cái ở giữa mới là cái đáng nói ──
 *
 *   hoat_dong     — `handlerId` tra được trong `HandlerCatalog`
 *   can_adapter   — manifest hợp lệ nhưng chưa có handler nào biết chạy nó.
 *                   **Không phải lỗi.** Nó là một lời mời viết adapter, và pack
 *                   vẫn nhập được với mục ấy nằm im.
 *   cach_ly       — có dấu vết code, hoặc schema không qua
 *
 * Gộp `can_adapter` vào `cach_ly` sẽ làm mọi pack của người ngoài trông như mã
 * độc, và đó là cách nhanh nhất để không ai chia sẻ pack nữa.
 *
 * Nhập ở đây **không** ghi vào `R` ngay: `nhapWorldPack()` trả kết quả, người
 * dùng duyệt, rồi mới đăng ký. Đăng ký là một hành động riêng.
 */
import { useMemo, useRef, useState } from 'react';
import { R, REGISTRY_IDS, moiManifest, quetDauVetCode } from '../../core/registry/index.js';
import type { RegistryId } from '../../core/registry/index.js';
import { nhapWorldPack } from '../../core/registry/packDsl.js';
import type { KetQuaNhapPack } from '../../core/registry/packDsl.js';
import { coHandler, coSchemaRef } from '../../core/registry/index.js';
import { nut, nhanNho, the } from '../design/kieu.js';

const NHAN_REGISTRY: Readonly<Record<RegistryId, string>> = Object.freeze({
  aspect: 'Aspect — mặt của thực thể',
  kind: 'Kind — loại thực thể',
  verb: 'Verb — động từ sáng thế',
  relation: 'Relation — quan hệ',
  gap: 'Gap — loại lỗ hổng',
  action: 'Action — hành động',
  ending: 'Ending — kết cục',
  metric: 'Metric — chỉ số',
  profile: 'Profile — hồ sơ tuning',
  storyKind: 'StoryKind — loại mạch truyện',
  mechanism: 'Mechanism — cơ chế phái sinh',
  worldProcess: 'WorldProcess — tiến trình nền',
});

const NHAN_TRANG_THAI: Readonly<Record<string, string>> = Object.freeze({
  hoat_dong: 'hoạt động',
  can_adapter: 'cần adapter',
  cach_ly: 'bị cách ly',
  tat: 'đang tắt',
});

export function XuongRegistry(): JSX.Element {
  const [dangMo, setDangMo] = useState<RegistryId | null>(null);
  const [kq, setKq] = useState<KetQuaNhapPack | null>(null);
  const [tin, setTin] = useState('');
  const oFile = useRef<HTMLInputElement>(null);

  const manifest = useMemo(() => moiManifest(), []);

  /**
   * Thống kê theo registry, đọc từ chính `R` chứ không từ một bảng đếm riêng.
   *
   * Một con số đếm sẵn sẽ lệch ngay lần đầu có ai đó `napPack()`, và bảng này
   * tồn tại chính là để nhìn thấy điều đó.
   */
  const thongKe = useMemo(
    () =>
      REGISTRY_IDS.map((id) => {
        const ms = manifest.filter((m) => m.registry === id);
        return {
          id,
          tong: R[id].danhSachId().length,
          coHandler: ms.filter((m) => m.handlerId !== '' && coHandler(m.handlerId)).length,
          thieuHandler: ms.filter((m) => m.handlerId !== '' && !coHandler(m.handlerId)).length,
          coSchema: ms.filter((m) => m.schemaRef !== '' && coSchemaRef(m.schemaRef)).length,
          canhBao: R[id].canhBao().length,
        };
      }),
    [manifest],
  );

  const tongCanhBao = thongKe.reduce((a, b) => a + b.canhBao, 0);
  const tongThieuHandler = thongKe.reduce((a, b) => a + b.thieuHandler, 0);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 22px 80px', display: 'grid', gap: 26 }}>
      <header>
        <p style={nhanNho}>PHẦN 5 · PHẦN 62</p>
        <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 32, margin: '4px 0 6px', fontWeight: 500 }}>
          Xưởng Registry
        </h1>
        <p style={{ color: 'var(--tro)', margin: 0, fontSize: 14 }}>
          Mười hai registry dựng nên từ vựng của thế giới: loại thực thể, động từ, quan hệ, tiến trình nền.
          Manifest là <b>JSON thuần</b> — không world pack nào mang theo mã chạy được.
        </p>
      </header>

      <section
        style={{ ...the, display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}
      >
        <span>
          <b style={{ fontFamily: 'var(--chu-so)' }}>{REGISTRY_IDS.length}</b> registry
        </span>
        <span>
          <b style={{ fontFamily: 'var(--chu-so)' }}>{manifest.length}</b> manifest
        </span>
        <span>
          <b style={{ fontFamily: 'var(--chu-so)', color: tongThieuHandler > 0 ? 'var(--dong)' : undefined }}>
            {tongThieuHandler}
          </b>{' '}
          mục cần adapter
        </span>
        <span>
          <b style={{ fontFamily: 'var(--chu-so)', color: tongCanhBao > 0 ? 'var(--hoi)' : undefined }}>
            {tongCanhBao}
          </b>{' '}
          cảnh báo
        </span>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }}>Mười hai registry</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {thongKe.map((t) => {
            const mo = dangMo === t.id;
            const ms = manifest.filter((m) => m.registry === t.id);
            return (
              <li key={t.id} style={{ ...the, display: 'grid', gap: 8 }}>
                <button
                  type="button"
                  aria-expanded={mo}
                  onClick={() => setDangMo(mo ? null : t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 17 }}>
                    {NHAN_REGISTRY[t.id]}
                  </strong>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 13, color: 'var(--tro)', fontFamily: 'var(--chu-so)' }}>
                    {t.tong}
                  </span>
                  <span style={nhanNho}>{mo ? 'THU LẠI' : 'XEM'}</span>
                </button>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--mo)' }}>
                  <span>{t.coHandler} có handler</span>
                  <span>{t.thieuHandler} cần adapter</span>
                  <span>{t.coSchema} có schema</span>
                  {t.canhBao > 0 && <span style={{ color: 'var(--hoi)' }}>{t.canhBao} cảnh báo</span>}
                </div>

                {mo && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'grid',
                      gap: 3,
                      maxHeight: 320,
                      overflowY: 'auto',
                      fontSize: 12,
                    }}
                  >
                    {ms.map((m) => (
                      <li key={m.id} style={{ display: 'flex', gap: 10, color: 'var(--tro)' }}>
                        <span style={{ minWidth: 200 }}>{m.ten}</span>
                        <span style={{ color: 'var(--mo)', fontFamily: 'var(--chu-so)' }}>
                          {m.handlerId === ''
                            ? 'không cần handler'
                            : coHandler(m.handlerId)
                              ? m.handlerId
                              : `${m.handlerId} — chưa có adapter`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section style={{ display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 22 }}>Nhập world pack</h2>
        <p style={{ margin: 0, color: 'var(--mo)', fontSize: 13 }}>
          Nhập ở đây chỉ <b>đọc và báo cáo</b>. Không mục nào vào registry cho tới khi bạn duyệt — và mục có
          dấu vết code thì không bao giờ vào.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={nut(true)} onClick={() => oFile.current?.click()}>
            Chọn file pack (.json)
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
                let goc: unknown;
                try {
                  goc = JSON.parse(await f.text());
                } catch {
                  setKq(null);
                  setTin(`"${f.name}" không phải JSON đọc được.`);
                  return;
                }
                const vet = quetDauVetCode(goc);
                const r = nhapWorldPack(goc);
                setKq(r);
                setTin(
                  vet.length > 0
                    ? `"${f.name}": tìm thấy ${vet.length} dấu vết code — pack này không nhập được.`
                    : `"${f.name}": đọc xong.`,
                );
              })();
            }}
          />
          {tin !== '' && <span style={{ fontSize: 13, color: 'var(--tro)' }}>{tin}</span>}
        </div>

        {kq !== null && (
          <div style={{ ...the, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}>
              <span>
                tổng <b style={{ fontFamily: 'var(--chu-so)' }}>{kq.thongKe.tong}</b>
              </span>
              <span>
                hoạt động <b style={{ fontFamily: 'var(--chu-so)' }}>{kq.thongKe.hoatDong}</b>
              </span>
              <span>
                cần adapter <b style={{ fontFamily: 'var(--chu-so)' }}>{kq.thongKe.canAdapter}</b>
              </span>
              <span>
                bị cách ly <b style={{ fontFamily: 'var(--chu-so)' }}>{kq.thongKe.cachLy}</b>
              </span>
            </div>

            {kq.issues.length > 0 && (
              <div>
                <span style={nhanNho}>{kq.issues.length} VẤN ĐỀ</span>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--tro)' }}>
                  {kq.issues.slice(0, 12).map((i, n) => (
                    <li key={`${i.code}-${n}`}>
                      <span style={{ fontFamily: 'var(--chu-so)' }}>{i.code}</span> — {i.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {kq.muc.length > 0 && (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: 3,
                  maxHeight: 300,
                  overflowY: 'auto',
                  fontSize: 12,
                }}
              >
                {kq.muc.map((m) => (
                  <li key={`${m.manifest.registry}.${m.manifest.id}`} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ minWidth: 190, color: 'var(--sang)' }}>{m.manifest.ten}</span>
                    <span style={{ minWidth: 110, color: 'var(--tro)' }}>
                      {NHAN_TRANG_THAI[m.trangThai] ?? m.trangThai}
                    </span>
                    <span style={{ color: 'var(--mo)' }}>{m.lyDo}</span>
                  </li>
                ))}
              </ul>
            )}

            <p style={{ margin: 0, fontSize: 12, color: 'var(--mo)' }}>
              Duyệt và đăng ký vào registry đang chạy là bước tiếp theo và nó chưa có ở bản này — xem sổ nợ ở{' '}
              <code style={{ fontFamily: 'var(--chu-so)' }}>docs/IMPLEMENTATION_STATUS.md</code>.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
