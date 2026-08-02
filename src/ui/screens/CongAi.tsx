/**
 * Cổng AI — màn đứng trước Khởi Nguyên (ADR-0028).
 *
 * ── Vì sao đây là màn ĐẦU TIÊN, không phải một mục trong Cài Đặt ──
 *
 * Thiên Diễn chạy bằng AI. Đặt cấu hình AI vào Cài Đặt nghĩa là để người chơi đi
 * qua Khởi Nguyên, tạo một thế giới, gõ câu đầu tiên, rồi mới gặp một hộp lỗi.
 * Cái giá của thứ tự ấy là toàn bộ ấn tượng đầu tiên. Nên nó đứng ở đây, và nó
 * nói thẳng lý do ngay dòng đầu.
 *
 * Ba cột của 46.3 giữ nguyên. Cột **Tường Thuật** là cột duy nhất bắt buộc; hai
 * cột kia tắt được, và tắt rồi thì xám lại chứ không mất dữ liệu đã nhập.
 *
 * [BB] 36.1 — không emoji. [BB] luật bất biến #9 — không dấu hiệu nào chỉ bằng màu.
 */
import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAi, NHAN_ENDPOINT } from '../../store/ai.js';
import { doCauHinhRerank } from '../../core/schema/rerank.js';
import type { TenEndpoint } from '../../store/ai.js';
import { DIALECTS } from '../../core/schema/ai.js';
import type { Dialect, GenParams } from '../../core/schema/ai.js';
import { thieuGiOEndpoint } from '../../core/ai/cauHinh.js';
import { Icon } from '../design/Icon.js';
import { ThongSoSinh } from './ThongSoSinh.js';

const NHAN_DIALECT: Record<Dialect, string> = {
  tu_do: 'Tự do (dạng OpenAI)',
  openai: 'OpenAI',
  gemini: 'Gemini',
  anthropic: 'Anthropic',
};

const nhanNho: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };

const oNhap: CSSProperties = {
  background: 'var(--kinh-nen-2)',
  color: 'var(--sang)',
  border: '1px solid var(--kinh-vien)',
  borderRadius: 'var(--r-sm)',
  padding: '9px 12px',
  font: 'inherit',
  fontSize: 13,
  width: '100%',
};

function nut(chinh = false, tat = false): CSSProperties {
  return {
    background: 'transparent',
    color: tat ? 'var(--mo)' : chinh ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${chinh && !tat ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '8px 14px',
    font: 'inherit',
    fontSize: 13,
    cursor: tat ? 'not-allowed' : 'pointer',
    opacity: tat ? 0.5 : 1,
  };
}

function Truong({ nhan, children }: { nhan: string; children: React.ReactNode }): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      <span style={nhanNho}>{nhan.toUpperCase()}</span>
      {children}
    </label>
  );
}

function CotEndpoint({ ten, batBuoc }: { ten: TenEndpoint; batBuoc: boolean }): JSX.Element {
  const cfg = useAi((s) => s.cfg);
  const dangDo = useAi((s) => s.dangDo);
  const sua = useAi((s) => s.suaEndpoint);
  const quet = useAi((s) => s.quet);
  const thu = useAi((s) => s.thu);

  const ep = cfg[ten];
  const batRieng = ten === 'narrator' ? true : (cfg[ten] as { batRieng: boolean }).batRieng;
  const tat = !batRieng;
  const thieu = thieuGiOEndpoint(ep);

  const doiParams = useCallback(
    (thayDoi: Partial<GenParams>) => {
      sua(ten, { params: { ...ep.params, ...thayDoi } });
    },
    [sua, ten, ep.params],
  );

  return (
    <section
      className="kinh"
      style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start', opacity: tat ? 0.55 : 1 }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--chu-hien)', fontSize: 20 }}>{NHAN_ENDPOINT[ten]}</h2>
        <span style={{ flex: 1 }} />
        {batBuoc ? (
          <span style={{ ...nhanNho, color: 'var(--dong)' }}>BẮT BUỘC</span>
        ) : (
          <label
            style={{ ...nhanNho, display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={batRieng}
              onChange={(e) => sua(ten, { batRieng: e.target.checked } as never)}
            />
            BẬT RIÊNG
          </label>
        )}
      </header>

      <Truong nhan="Địa chỉ proxy">
        <input
          style={oNhap}
          disabled={tat}
          value={ep.proxyUrl}
          placeholder="https://proxy-cua-ban.example/v1"
          onChange={(e) => sua(ten, { proxyUrl: e.target.value })}
        />
      </Truong>

      <Truong nhan="Mật khẩu / khóa">
        <input
          style={oNhap}
          type="password"
          disabled={tat}
          value={ep.proxyPassword}
          placeholder="để trống nếu proxy không cần"
          onChange={(e) => sua(ten, { proxyPassword: e.target.value })}
        />
      </Truong>

      <Truong nhan="Phương ngữ">
        <select
          style={oNhap}
          disabled={tat}
          value={ep.dialect}
          onChange={(e) => sua(ten, { dialect: e.target.value as Dialect })}
        >
          {DIALECTS.map((d) => (
            <option key={d} value={d}>
              {NHAN_DIALECT[d]}
            </option>
          ))}
        </select>
      </Truong>

      <Truong nhan="Model">
        {ep.availableModels.length > 0 ? (
          <select
            style={oNhap}
            disabled={tat}
            value={ep.modelId}
            onChange={(e) => sua(ten, { modelId: e.target.value })}
          >
            <option value="">— chọn một model —</option>
            {ep.availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.ten || m.id}
              </option>
            ))}
          </select>
        ) : (
          <input
            style={oNhap}
            disabled={tat}
            value={ep.modelId}
            placeholder="gõ tay hoặc bấm Quét danh sách"
            onChange={(e) => sua(ten, { modelId: e.target.value })}
          />
        )}
      </Truong>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button style={nut(false, tat || dangDo)} disabled={tat || dangDo} onClick={() => void quet(ten)}>
          Quét danh sách
        </button>
        <button style={nut(true, tat || dangDo)} disabled={tat || dangDo} onClick={() => void thu(ten)}>
          Kiểm tra kết nối
        </button>
      </div>

      {/* Thông số sinh — slider + preset, gập mặc định để không lấn chỗ. */}
      <ThongSoSinh params={ep.params} tat={tat} onThayDoi={doiParams} />

      {/* Bằng chứng, không phải lời hứa: hiện đúng thứ lần thử vừa rồi trả về. */}
      <div style={{ ...nhanNho, display: 'grid', gap: 3 }}>
        {ep.probe.daDo ? (
          ep.probe.thong ? (
            <span style={{ color: 'var(--ngoc)' }}>
              ✓ kết nối thành công · {ep.probe.modelDaTraLoi} trả về {ep.probe.soKyTuTraVe} ký tự
            </span>
          ) : (
            <span style={{ color: 'var(--hoi)' }}>
              ✕ {ep.probe.maLoi}: {ep.probe.thongDiep}
            </span>
          )
        ) : (
          <span>chưa kiểm tra kết nối</span>
        )}
        {!tat &&
          thieu.map((t) => (
            <span key={t.truong} style={{ color: 'var(--hoi)' }}>
              · {t.thongDiep}
            </span>
          ))}
      </div>
    </section>
  );
}

/**
 * Tab Truy hồi — Phần 77.11.
 *
 * ── Vì sao nó nằm ở đây chứ không nằm trong Chẩn Đoán ──
 *
 * Rerank là một ĐIỂM CUỐI: nó có địa chỉ, có model, có mật khẩu, và nó tốn tiền.
 * Đặt nó cạnh ba điểm cuối kia là nói đúng bản chất của nó. Chẩn Đoán chỉ nên
 * hiện hậu quả (độ trễ, tỉ lệ fallback), không phải chỗ để gõ địa chỉ vào.
 *
 * [BB] 77.2 — `llm_listwise` CHỈ chạy khi người dùng tự chọn: nó dùng chính model
 * kể chuyện để xếp hạng, tức nhân đôi số call mà người chơi không hề biết.
 */
function TabTruyHoi(): JSX.Element {
  const rr = useAi((s) => s.cfg.rerank);
  const suaRerank = useAi((s) => s.suaRerank);
  const tk = useAi((s) => s.thongKeTruyHoi);
  const machRerank = useAi((s) => s.machRerank);

  const kq = doCauHinhRerank(rr);
  const tyLeFallback = tk.soLan === 0 ? 0 : tk.soFallback / tk.soLan;
  const doTre = tk.soLan === 0 ? 0 : tk.tongLatencyMs / tk.soLan;

  return (
    <section className="kinh hien-panel" style={{ padding: 18, marginTop: 22, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ ...nhanNho, margin: 0, textTransform: 'uppercase' }}>Truy hồi</h2>
        <span style={{ color: 'var(--mo)', fontSize: 12 }}>
          Xếp lại thứ tự thông tin mà chủ thể được biết. Tắt nó thì lượt chơi vẫn chạy bằng heuristic.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={nhanNho}>CHẾ ĐỘ</span>
          <select
            style={{ ...oNhap, width: 'auto' }}
            value={rr.endpoint.mode}
            onChange={(e) =>
              suaRerank({ endpoint: { ...rr.endpoint, mode: e.target.value as typeof rr.endpoint.mode } })
            }
          >
            <option value="heuristic">Heuristic (không mạng)</option>
            <option value="auto">Tự chọn</option>
            <option value="proxy_cross_encoder">Proxy rerank chuyên dụng</option>
            <option value="llm_listwise">Nhờ model xếp hạng (đắt)</option>
            <option value="local_cross_encoder">Cục bộ (chưa có bản cài)</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4, flex: 1, minWidth: 220 }}>
          <span style={nhanNho}>ĐỊA CHỈ PROXY RERANK</span>
          <input
            style={oNhap}
            placeholder="để trống nếu dùng heuristic"
            value={rr.endpoint.proxyUrl}
            onChange={(e) => suaRerank({ endpoint: { ...rr.endpoint, proxyUrl: e.target.value } })}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span style={nhanNho}>MODEL</span>
          <input
            style={{ ...oNhap, width: 160 }}
            value={rr.endpoint.modelId}
            onChange={(e) => suaRerank({ endpoint: { ...rr.endpoint, modelId: e.target.value } })}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span style={nhanNho}>ỨNG VIÊN / GIỮ LẠI</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              style={{ ...oNhap, width: 70 }}
              type="number"
              value={rr.candidateK}
              onChange={(e) => suaRerank({ candidateK: Number(e.target.value) })}
            />
            <input
              style={{ ...oNhap, width: 70 }}
              type="number"
              value={rr.outputK}
              onChange={(e) => suaRerank({ outputK: Number(e.target.value) })}
            />
          </div>
        </label>
      </div>

      {kq.canhBao.map((c) => (
        <p key={c} style={{ color: 'var(--van)', fontSize: 12, margin: 0 }}>
          {c}
        </p>
      ))}

      {/* [BB] 77.9 — mạch mở KHÔNG đóng cổng chơi, nên nó chỉ là một dòng chữ. */}
      {machRerank.moMach && (
        <p style={{ color: 'var(--van)', fontSize: 12, margin: 0 }}>
          Đã ngắt mạch reranker sau {machRerank.hongLienTiep} lần hỏng ({machRerank.lyDoCuoi}). Còn{' '}
          {machRerank.conBoQua} lượt truy hồi nữa mới thử lại. Lượt chơi không bị chặn.
        </p>
      )}

      <div style={{ ...nhanNho, color: 'var(--tro)' }}>
        {tk.soLan === 0
          ? 'Chưa có lượt truy hồi nào trong phiên này.'
          : `${tk.soLan} lượt · độ trễ trung bình ${Math.round(doTre)} ms · ` +
            `rơi về heuristic ${Math.round(tyLeFallback * 100)}% · ` +
            `dùng lại cache ${Math.round((tk.soCacheHit / tk.soLan) * 100)}% · ` +
            `dữ liệu vượt quyền lọt ra: ${tk.tongForbidden}`}
      </div>
    </section>
  );
}

export function CongAi(): JSX.Element {
  const napTuDia = useAi((s) => s.napTuDia);
  const daNap = useAi((s) => s.daNap);
  const cong = useAi((s) => s.cong());
  const tinNhan = useAi((s) => s.tinNhan);
  const sao = useAi((s) => s.sao);
  const datLai = useAi((s) => s.datLai);
  const moLaiMach = useAi((s) => s.moLaiMach);
  const [nguon, setNguon] = useState<TenEndpoint>('narrator');
  const [dich, setDich] = useState<TenEndpoint>('updater');

  useEffect(() => {
    void napTuDia();
  }, [napTuDia]);

  if (!daNap) {
    return (
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 20px' }}>
        <p style={{ color: 'var(--mo)' }}>Đang đọc cấu hình đã lưu…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ ...nhanNho, margin: 0 }}>THIÊN DIỄN</p>
      <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 34, margin: '6px 0 10px', fontWeight: 500 }}>
        Cổng AI
      </h1>
      <p style={{ color: 'var(--tro)', marginTop: 0, maxWidth: 720, lineHeight: 1.6 }}>
        Thiên Diễn không phải một mô phỏng có thêm phần kể chuyện. Engine giữ sổ — dân số, mùa màng, lời cầu,
        quy kết domain — nhưng <strong>mọi thứ bạn nhìn thấy đều do một model viết ra</strong>, từ câu đầu
        tiên của thế giới cho tới cách một vị thần đáp lại. Chưa nối được model thì chưa có gì để chơi.
      </p>

      {cong.trangThai === 'dut_duong' && (
        <div
          role="alert"
          className="kinh"
          style={{ padding: 14, margin: '18px 0', borderLeft: '2px solid var(--hoi)' }}
        >
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <Icon ten="canh_bao" co={16} style={{ color: 'var(--hoi)', marginTop: 2 }} />
            <div style={{ color: 'var(--hoi)', fontSize: 13, display: 'grid', gap: 4 }}>
              {cong.lyDo.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </div>
          <button style={{ ...nut(true), marginTop: 10 }} onClick={moLaiMach}>
            Thử kết nối lại
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: 14,
          marginTop: 22,
        }}
      >
        <CotEndpoint ten="narrator" batBuoc />
        <CotEndpoint ten="updater" batBuoc={false} />
        <CotEndpoint ten="workflow" batBuoc={false} />
      </div>

      <TabTruyHoi />

      {/* 46.3 — sao cấu hình giữa ba cột. Mật khẩu không bị ghi đè nếu đích đã có. */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
        <span style={nhanNho}>SAO CẤU HÌNH</span>
        <select
          style={{ ...oNhap, width: 'auto' }}
          value={nguon}
          onChange={(e) => setNguon(e.target.value as TenEndpoint)}
        >
          {(['narrator', 'updater', 'workflow'] as TenEndpoint[]).map((t) => (
            <option key={t} value={t}>
              {NHAN_ENDPOINT[t]}
            </option>
          ))}
        </select>
        <span style={{ color: 'var(--mo)' }}>→</span>
        <select
          style={{ ...oNhap, width: 'auto' }}
          value={dich}
          onChange={(e) => setDich(e.target.value as TenEndpoint)}
        >
          {(['narrator', 'updater', 'workflow'] as TenEndpoint[]).map((t) => (
            <option key={t} value={t}>
              {NHAN_ENDPOINT[t]}
            </option>
          ))}
        </select>
        <button style={nut()} disabled={nguon === dich} onClick={() => sao(nguon, dich)}>
          Sao chép
        </button>
        <span style={{ flex: 1 }} />
        <button style={nut()} onClick={datLai}>
          Khôi phục mặc định
        </button>
      </div>

      {tinNhan !== '' && (
        <p style={{ color: 'var(--tro)', fontSize: 13, marginTop: 12 }} role="status">
          {tinNhan}
        </p>
      )}

      <footer style={{ marginTop: 26, borderTop: '1px solid var(--kinh-vien)', paddingTop: 18 }}>
        {cong.choPhepChoi ? (
          <p style={{ color: 'var(--ngoc)', fontSize: 14, margin: 0 }}>
            Kết nối thành công. Bấm tiếp để vào Khởi Nguyên.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }}>
            {cong.viecCanLam.map((t) => (
              <li key={`${t.truong}:${t.thongDiep}`}>{t.thongDiep}</li>
            ))}
          </ul>
        )}
        <p style={{ ...nhanNho, marginTop: 14 }}>
          Mật khẩu proxy chỉ nằm trên máy này. Nó không đi vào file save, không đi vào bản xuất, và không được
          gửi tới đâu ngoài chính địa chỉ bạn vừa nhập.
        </p>
      </footer>
    </main>
  );
}
