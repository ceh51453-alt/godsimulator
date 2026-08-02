/**
 * Sổ Tay — Phần 56.1, 56.2 [BB].
 *
 * Ở tầng Phàm Nhân, Bảng Thiên Diễn **bị thay hẳn** bằng màn này. Không phải rút
 * gọn: một thứ khác về bản chất. Trang giấy của chính nhân vật.
 *
 * Mọi câu chữ đến từ `core/pham/soTay.ts`, và hàm ấy chỉ nhận `WorldView`. Nghĩa
 * là component này **không có đường nào** chạm tới con số của engine, kể cả khi
 * ai đó vô ý muốn.
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import type { CSSProperties } from 'react';
import type { SoTay } from '../../core/pham/soTay.js';

const nhanNho: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const dong: CSSProperties = { fontSize: 14, lineHeight: 1.7, color: 'var(--tro)', margin: 0 };

function Muc({ nhan, children }: { nhan: string; children: React.ReactNode }): JSX.Element | null {
  return (
    <section style={{ display: 'grid', gap: 6 }}>
      <h3 style={{ ...nhanNho, margin: 0 }}>{nhan}</h3>
      {children}
    </section>
  );
}

export function SoTayPanel({ so }: { so: SoTay }): JSX.Element {
  return (
    <article
      className="kinh"
      aria-label="Sổ tay của nhân vật"
      style={{
        padding: '20px 22px',
        display: 'grid',
        gap: 18,
        // Giấy, không phải bảng điều khiển: một cột, chữ liền, không có ô số nào.
        maxWidth: 620,
        fontFamily: 'var(--chu-ke)',
      }}
    >
      <header style={{ display: 'grid', gap: 4 }}>
        <span style={nhanNho}>Sổ Tay</span>
        {so.moDau.map((c) => (
          <p key={c} style={{ ...dong, color: 'var(--sang)', fontSize: 16 }}>
            {c}
          </p>
        ))}
        {so.dangLam !== '' && (
          <p style={{ ...dong, color: 'var(--mo)', fontStyle: 'italic' }}>Lúc này ta đang {so.dangLam}.</p>
        )}
      </header>

      {so.than.length > 0 && (
        <Muc nhan="Thân ta">
          {so.than.map((c) => (
            <p key={c} style={dong}>
              {c}
            </p>
          ))}
        </Muc>
      )}

      {so.quen.length > 0 && (
        <Muc nhan="Người ta quen">
          {/*
           * [BB] 56.2 quy tắc 4 — quan hệ ghi bằng `anTuong`, không bằng bốn trục.
           * Không có thanh thân/sơ nào ở đây, và đó là cố ý.
           */}
          <div style={{ display: 'grid', gap: 7 }}>
            {so.quen.map((q) => (
              <div key={q.ten} style={{ display: 'grid', gridTemplateColumns: '9rem 1fr', gap: 10 }}>
                <span className="ten-rieng" style={{ fontSize: 14, color: 'var(--dong)' }}>
                  {q.ten}
                  {q.xungHo !== '' && <span style={{ ...nhanNho, display: 'block' }}>{q.xungHo}</span>}
                </span>
                <span style={{ ...dong, fontSize: 13 }}>
                  {q.anTuong || '—'}
                  {q.laHuyenThoai && (
                    <span style={{ ...nhanNho, display: 'block' }}>ta chỉ nghe kể về người này</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Muc>
      )}

      {so.tin.length > 0 && (
        <Muc nhan="Điều ta tin">
          {so.tin.map((c) => (
            <p key={c} style={dong}>
              {c}
            </p>
          ))}
        </Muc>
      )}

      {so.nghe.length > 0 && (
        <Muc nhan="Điều ta nghe được">
          {/* Quy tắc 3 — tin đồn ghi kèm độ tin, lấy từ số chặng của `bopMeo()`. */}
          <div style={{ display: 'grid', gap: 5 }}>
            {so.nghe.map((t, i) => (
              <div key={`${t.noiDung}-${i}`} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ ...dong, flex: 1, fontSize: 13 }}>{t.noiDung}</span>
                <span style={{ ...nhanNho, whiteSpace: 'nowrap' }}>({t.doTin})</span>
              </div>
            ))}
          </div>
        </Muc>
      )}

      {so.muon.length > 0 && (
        <Muc nhan="Điều ta muốn">
          <div style={{ display: 'grid', gap: 5 }}>
            {so.muon.map((m) => (
              <div key={m.noiDung} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ ...dong, flex: 1, fontSize: 13 }}>{m.noiDung}</span>
                <span style={{ ...nhanNho, whiteSpace: 'nowrap' }}>{m.xong ? 'xong' : 'chưa xong'}</span>
              </div>
            ))}
          </div>
        </Muc>
      )}
    </article>
  );
}
