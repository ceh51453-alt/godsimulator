/**
 * Panel Ống Kính — Phần 29.1, và tab Truy hồi của 77.11.
 *
 * ── Điều panel này phải nói cho người chơi hiểu ──
 *
 * 29.1: "Cột tường thuật ở giữa màn hình KHÔNG PHẢI cuộc chat của bạn. Nó là
 * biên niên sử đang được kể." Một người chơi quen với chat sẽ mặc định điều
 * ngược lại, và không có gì trên màn hình nói khác đi. Panel này là chỗ nói.
 *
 * Vì vậy nó hiện ba thứ, theo thứ tự quan trọng:
 *   1. ống kính đang ở ĐÂU, và VÌ SAO engine chọn chỗ ấy;
 *   2. hạn ngạch vắng mặt — bao nhiêu phần cảnh không có mặt người chơi (28.6);
 *   3. truy hồi lượt vừa rồi: mode, độ trễ, và LÝ DO từng chunk được chọn (77.11).
 *
 * [BB] 36.1 — không emoji, không thư viện icon.
 * [BB] Luật bất biến #9 — mọi dấu hiệu màu đều đi kèm chữ.
 */
import type { CSSProperties } from 'react';
import type { DoVangMat } from '../../core/truyen/machTruyen.js';
import type { KetQuaTruyHoi } from '../../core/retrieval/truyHoi.js';
import type { ProjectedStoryline } from '../../core/contracts/view.js';
import type { KetQuaBoDanhGia } from '../../core/retrieval/boDanhGia.js';
import { Icon } from '../design/Icon.js';

const nhanNho: CSSProperties = { color: 'var(--mo)', fontSize: 11, letterSpacing: '0.08em' };
const dong: CSSProperties = { display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 };

export type DuLieuOngKinh = {
  readonly viChieu: string;
  readonly machDangChieu: ProjectedStoryline | null;
  readonly vangMat: DoVangMat;
  readonly truyHoi: KetQuaTruyHoi | null;
  readonly vetCatToken: readonly { tang: number; ten: string; vi: string }[];
  readonly machKhac: readonly ProjectedStoryline[];
  readonly onChia: (machId: string) => void;
  readonly onTuDong: () => void;
  /** Nhân vật và nơi chốn chĩa được — hai loại mục tiêu còn lại của 29.1. */
  readonly nhanVatGan: readonly { id: string; ten: string }[];
  readonly vungGan: readonly { id: string; ten: string }[];
  readonly onChiaNhanVat: (entityId: string) => void;
  readonly onChiaVung: (vungId: string) => void;
  /** Bộ đánh giá truy hồi — 77.10, nút của 77.11. */
  readonly danhGia: KetQuaBoDanhGia | null;
  readonly dangDanhGia: boolean;
  readonly onDanhGia: () => void;
};

const NHAN_GIAI_DOAN: Record<string, string> = {
  am_i: 'âm ỉ',
  khoi: 'khởi',
  phat_trien: 'phát triển',
  cao_trao: 'cao trào',
  ha_man: 'hạ màn',
  du_am: 'dư âm',
  chet_yeu: 'chết yểu',
};

const NHAN_LY_DO: Record<string, string> = {
  semantic: 'gần nghĩa',
  graph: 'nhân quả',
  precedent: 'tiền lệ',
  trust: 'đáng tin',
  recency: 'vừa xảy ra',
  diversity: 'khác nguồn',
};

const NHAN_MODE: Record<string, string> = {
  heuristic: 'heuristic',
  local_cross_encoder: 'cục bộ',
  proxy_cross_encoder: 'proxy',
  llm_listwise: 'listwise',
  auto: 'tự chọn',
};

function nutNho(dang = false): CSSProperties {
  return {
    background: 'transparent',
    color: dang ? 'var(--dong)' : 'var(--tro)',
    border: `1px solid ${dang ? 'var(--dong)' : 'var(--kinh-vien)'}`,
    borderRadius: 'var(--r-sm)',
    padding: '3px 8px',
    fontSize: 12,
    cursor: 'pointer',
  };
}

export function PanelOngKinh(du: DuLieuOngKinh): JSX.Element {
  const th = du.truyHoi;

  return (
    <section className="kinh hien-panel" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon ten="khai_niem" co={16} style={{ color: 'var(--van)' }} />
        <h2 style={{ ...nhanNho, margin: 0, textTransform: 'uppercase' }}>Ống kính</h2>
      </header>

      {/* ── 1. đang chiếu vào đâu, vì sao ── */}
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 14 }}>
          {du.machDangChieu
            ? `“${du.machDangChieu.ten}” — ${NHAN_GIAI_DOAN[du.machDangChieu.giaiDoan] ?? du.machDangChieu.giaiDoan}`
            : 'Đang nhìn theo người chơi'}
        </div>
        {du.viChieu !== '' && <div style={{ ...nhanNho, lineHeight: 1.5 }}>{du.viChieu}</div>}
        {du.machDangChieu && du.machDangChieu.nutThatChuaGo.length > 0 && (
          <div style={{ ...nhanNho, color: 'var(--van)' }}>
            Chưa gỡ: {du.machDangChieu.nutThatChuaGo.join(' · ')}
          </div>
        )}
      </div>

      {/* Chuyển ống kính KHÔNG tốn lượt — 29.1. Nói điều đó ra bằng chữ. */}
      {du.machKhac.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={nhanNho}>CHĨA SANG (không tốn lượt, không tốn thời gian trong game)</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button type="button" style={nutNho(du.machDangChieu === null)} onClick={du.onTuDong}>
              Tự động
            </button>
            {du.machKhac.slice(0, 6).map((m) => (
              <button
                key={m.id}
                type="button"
                style={nutNho(m.id === du.machDangChieu?.id)}
                onClick={() => du.onChia(m.id)}
                title={m.kyUcMach}
              >
                {m.ten}
              </button>
            ))}
          </div>

          {/* Hai loại mục tiêu còn lại của 29.1: một người, hoặc một vùng. */}
          {(du.nhanVatGan.length > 0 || du.vungGan.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {du.vungGan.slice(0, 3).map((v) => (
                <button key={v.id} type="button" style={nutNho()} onClick={() => du.onChiaVung(v.id)}>
                  ở {v.ten}
                </button>
              ))}
              {du.nhanVatGan.slice(0, 4).map((n) => (
                <button key={n.id} type="button" style={nutNho()} onClick={() => du.onChiaNhanVat(n.id)}>
                  theo {n.ten}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. hạn ngạch vắng mặt (28.6) ── */}
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={nhanNho}>THẾ GIỚI NGOÀI NGƯỜI CHƠI</span>
        <div style={dong}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: du.vangMat.dat ? 'var(--ngoc)' : 'var(--van)',
            }}
          />
          <span style={{ flex: 1 }}>{du.vangMat.thongDiep}</span>
        </div>
      </div>

      {/* ── 3. tab Truy hồi (77.11) ── */}
      {th && (
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={nhanNho}>TRUY HỒI LƯỢT VỪA RỒI</span>
          <div style={{ ...nhanNho, color: 'var(--tro)' }}>
            {NHAN_MODE[th.run.modeUsed] ?? th.run.modeUsed} · {th.run.candidateCount} ứng viên →{' '}
            {th.run.selectedCount} chọn · {Math.round(th.run.latencyMs)} ms
            {th.run.cacheHit ? ' · dùng lại cache' : ''}
          </div>

          {th.run.fallbackReason !== '' && (
            <div style={{ ...nhanNho, color: 'var(--van)' }}>
              Đã rơi về heuristic: {th.run.fallbackReason}. Lượt chơi không bị chặn.
            </div>
          )}

          {/*
           * [BB] 77.11 — "lý do mỗi chunk được chọn". Không có dòng này thì tab
           * Truy hồi chỉ là một cái đồng hồ đo, và người chơi không bao giờ biết
           * vì sao Narrator nhắc tới chuyện cũ nào.
           */}
          <div style={{ display: 'grid', gap: 4 }}>
            {th.daChon.slice(0, 6).map((c, i) => {
              const ly = (th.lyDo.get(c.id) ?? []).map((x) => NHAN_LY_DO[x] ?? x);
              return (
                <div key={c.id} style={{ ...dong, alignItems: 'flex-start' }}>
                  <span style={{ ...nhanNho, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.5 }}>
                    {c.projectedText.slice(0, 90)}
                    {c.projectedText.length > 90 ? '…' : ''}
                    {c.daBopMeo && <span style={{ ...nhanNho, color: 'var(--van)' }}> · nghe kể lại</span>}
                    {ly.length > 0 && <span style={nhanNho}> · {ly.join(', ')}</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* [BB] Cổng "token budget có trace" — hiện thật, không giấu. */}
          {(th.biCat.length > 0 || du.vetCatToken.length > 0) && (
            <div style={{ ...nhanNho, color: 'var(--mo)' }}>
              Đã cắt vì ngân sách: {th.biCat.filter((b) => b.vi.includes('ngân sách')).length} chunk
              {du.vetCatToken.length > 0 && `, ${du.vetCatToken.map((v) => `tầng ${v.tang}`).join(', ')}`}.
            </div>
          )}

          {/* [BB] Phải LUÔN là 0. Khác 0 thì nói to, không nói nhỏ. */}
          {th.chunkCamLotVao.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--hoi)' }}>
              LỖI NGHIÊM TRỌNG: {th.chunkCamLotVao.length} mẩu dữ liệu vượt quyền đã lọt vào ngữ cảnh.
            </div>
          )}

          {th.canhBao.map((c) => (
            <div key={c} style={{ ...nhanNho, color: 'var(--van)' }}>
              {c}
            </div>
          ))}
        </div>
      )}

      {/*
       * [BB] 77.11 — nút "Chạy bộ đánh giá".
       *
       * Nó nằm ở đây chứ không ở tab Truy hồi của Cài Đặt AI vì bộ đề được dựng
       * TỪ THẾ GIỚI (xem `boDeTuTheGioi`), mà màn Cổng AI đứng trước Khởi Nguyên
       * nên ở đó chưa có thế giới nào để dựng đề.
       */}
      <div style={{ display: 'grid', gap: 6, borderTop: '1px solid var(--kinh-vien)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={nutNho()} disabled={du.dangDanhGia} onClick={du.onDanhGia}>
            {du.dangDanhGia ? 'Đang đo…' : 'Chạy bộ đánh giá'}
          </button>
          <span style={nhanNho}>đo trên chính thế giới này, không tốn lượt</span>
        </div>

        {du.danhGia && (
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ ...nhanNho, color: 'var(--tro)' }}>{du.danhGia.moTa}</div>
            {du.danhGia.cong.map((c) => (
              <div key={c.ten} style={{ ...dong, fontSize: 12 }}>
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 8,
                    background: c.dat ? 'var(--ngoc)' : 'var(--hoi)',
                  }}
                />
                {/* [BB] Luật bất biến #9 — dấu hiệu màu luôn đi kèm chữ. */}
                <span style={{ flex: 1 }}>
                  {c.dat ? 'đạt' : 'HỎNG'} · {c.ten}
                </span>
                <span style={nhanNho}>{c.chiTiet}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
