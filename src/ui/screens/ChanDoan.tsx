/**
 * Tự Chẩn Đoán — Phần 39, mục 27 của 46.2 và tab Truy hồi của 77.11.
 *
 * [BB] 39 — mỗi mục hỏng phải kèm **câu hành động cụ thể**, không phải một dấu
 * đỏ. Một bảng chẩn đoán nói "patch trượt 22%" mà không nói phải bấm gì thì chỉ
 * làm người chơi lo, không giúp họ sửa.
 *
 * [BB] Luật bất biến #9 — trạng thái diễn đạt bằng CHỮ. Màu chỉ đi kèm.
 */
import type { CSSProperties } from 'react';
import { useGame } from '../../store/game.js';
import { useAi } from '../../store/ai.js';
import { usePreset } from '../../store/preset.js';
import { NHAN_TRANG_THAI_CONG } from '../../core/ai/cong.js';

const nhan: CSSProperties = {
  color: 'var(--mo)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};
const so: CSSProperties = { fontSize: 13, color: 'var(--tro)' };
const phu: CSSProperties = { fontSize: 11, color: 'var(--mo)' };

type Muc = { ten: string; gia: string; hong: boolean; lam: string };

function Bang({ tieuDe, muc }: { tieuDe: string; muc: readonly Muc[] }): JSX.Element {
  return (
    <section className="kinh" style={{ padding: 18, marginBottom: 16 }}>
      <h2 style={{ ...nhan, margin: '0 0 12px' }}>{tieuDe}</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {muc.map((m) => (
          <div key={m.ten} style={{ display: 'grid', gap: 2 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ ...so, flex: 1, minWidth: 180 }}>{m.ten}</span>
              <span className="chu-so" style={{ ...so, color: m.hong ? 'var(--hoi)' : 'var(--tro)' }}>
                {m.gia}
              </span>
              {/* Trạng thái bằng CHỮ, không chỉ bằng màu. */}
              <span style={{ ...phu, color: m.hong ? 'var(--hoi)' : 'var(--ngoc)' }}>
                {m.hong ? 'cần sửa' : 'ổn'}
              </span>
            </div>
            {m.hong && <div style={{ ...phu, color: 'var(--dong)' }}>{m.lam}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ChanDoan(): JSX.Element {
  const state = useGame((s) => s.state);
  const view = useGame((s) => s.view);
  const stateHash = useGame((s) => s.stateHash);
  const patchBiTuChoi = useGame((s) => s.patchBiTuChoi);
  const truyHoiCuoi = useGame((s) => s.truyHoiCuoi);
  const vetCatToken = useGame((s) => s.vetCatToken);
  const presetTrace = useGame((s) => s.presetTrace);
  const vetVeSinh = useGame((s) => s.vetVeSinh);

  const cong = useAi((s) => s.cong());
  const tyLeHong = useAi((s) => s.tyLeHong());
  const thongKe = useAi((s) => s.thongKeTruyHoi);
  const machRerank = useAi((s) => s.machRerank);
  const canhBaoNganSach = useAi((s) => s.canhBaoNganSach);

  const dangBat = usePreset((s) => s.dangBat);

  const soPatchTruot = patchBiTuChoi.length;
  const tyLeTruot = soPatchTruot === 0 ? 0 : 1;

  const mucAi: Muc[] = [
    {
      ten: 'Cổng AI',
      gia: NHAN_TRANG_THAI_CONG[cong.trangThai],
      hong: !cong.choPhepChoi,
      lam: 'Mở Cài Đặt AI, điền proxy và model, rồi bấm "Kiểm tra kết nối".',
    },
    {
      ten: 'Tỉ lệ gọi hỏng',
      gia: `${Math.round(tyLeHong * 100)}%`,
      hong: tyLeHong > 0.15,
      lam: 'Mạng hoặc proxy không ổn định. Hãy kiểm tra kết nối, hoặc chuyển sang endpoint dự phòng.',
    },
    {
      // Mục 27 của bảng 46.2 — hỏng khi vượt 15%.
      ten: 'Patch AI bị từ chối ở lượt gần nhất',
      gia: String(soPatchTruot),
      hong: tyLeTruot > 0.15,
      lam: 'Tách "Cập Nhật Biến" thành endpoint riêng — model vừa viết văn vừa xuất JSON thì JSON dễ sai.',
    },
    {
      ten: 'Cảnh báo ngân sách token',
      gia: String(canhBaoNganSach.length),
      hong: canhBaoNganSach.length > 0,
      lam: canhBaoNganSach[0] ?? '',
    },
    {
      /*
       * Phase 12 — bộ vệ sinh văn bản.
       *
       * Khác 0 KHÔNG phải là "đã bị tấn công": ký tự vô hình lọt vào từ những
       * file copy-paste hoàn toàn vô hại. Nhưng nó cũng không phải chuyện im
       * lặng được, vì ký tự đảo chiều văn bản thì luôn là cố ý.
       */
      ten: 'Số lần bộ lọc vệ sinh phải can thiệp',
      gia: String(vetVeSinh.length),
      hong: vetVeSinh.length > 0,
      lam: vetVeSinh[vetVeSinh.length - 1] ?? '',
    },
  ];

  const mucTruyHoi: Muc[] = [
    {
      // [BB] 77.10 — con số này phải LUÔN bằng 0. Khác 0 là rò rỉ, không phải là chậm.
      ten: 'Chunk cấm lọt vào kết quả truy hồi',
      gia: String(thongKe.tongForbidden),
      hong: thongKe.tongForbidden > 0,
      lam: 'Đây là rò rỉ tầm nhìn. Dừng chơi nhánh này và báo lỗi kèm ảnh chụp tab Truy hồi.',
    },
    {
      ten: 'Lần rơi về heuristic',
      gia: `${thongKe.soFallback}/${thongKe.soLan}`,
      hong: thongKe.soLan > 0 && thongKe.soFallback / thongKe.soLan > 0.5,
      lam: 'Reranker ngữ nghĩa đang hỏng hoặc quá chậm. Tắt nó đi — heuristic vẫn chơi được.',
    },
    {
      ten: 'Ngắt mạch reranker',
      gia: machRerank.moMach ? 'đang mở' : 'đóng',
      hong: machRerank.moMach,
      lam: 'Mở Cài Đặt AI và thử lại endpoint rerank, hoặc để nguyên: gameplay không phụ thuộc nó.',
    },
    {
      ten: 'Chunk đã chọn cho lượt gần nhất',
      gia: String(truyHoiCuoi?.daChon.length ?? 0),
      hong: false,
      lam: '',
    },
  ];

  const mucPreset: Muc[] = [
    {
      ten: 'Pack đang bật',
      gia: String(Object.keys(dangBat).length),
      hong: false,
      lam: '',
    },
    {
      ten: 'Macro chưa có ánh xạ ở lượt gần nhất',
      gia: String(presetTrace.macroChuaGiai.length),
      hong: presetTrace.macroChuaGiai.length > 0,
      lam: 'Những macro này giữ nguyên văn trong prompt. Tắt module chứa chúng, hoặc viết adapter.',
    },
    {
      ten: 'Module bị cắt khỏi prompt',
      gia: String(presetTrace.moduleBiBo.length),
      hong: false,
      lam: '',
    },
    {
      ten: 'Tầng prompt bị cắt vì ngân sách',
      gia: String(vetCatToken.length),
      hong: vetCatToken.length > 2,
      lam: 'Ngân sách đang quá chật. Tăng context của model, hoặc tắt bớt module preset.',
    },
  ];

  return (
    <main style={{ padding: '22px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
      <h1 className="chu-hien" style={{ margin: '0 0 4px', fontSize: 26 }}>
        Tự Chẩn Đoán
      </h1>
      <p style={{ ...phu, margin: '0 0 22px' }}>
        Mỗi mục hỏng đi kèm việc cần làm. Không có mục nào chỉ để nhìn.
      </p>

      <Bang tieuDe="Đường AI" muc={mucAi} />
      <Bang tieuDe="Truy hồi và xếp hạng" muc={mucTruyHoi} />
      <Bang tieuDe="Preset" muc={mucPreset} />

      <section className="kinh" style={{ padding: 18 }}>
        <h2 style={{ ...nhan, margin: '0 0 12px' }}>Trạng thái engine</h2>
        <pre className="chu-so" style={{ margin: 0, ...phu, whiteSpace: 'pre-wrap' }}>
          {`state hash   ${stateHash}
visibility   ${view?.visibilityHash ?? '—'}
nhánh        ${state?.world.branchId ?? '—'}
seed         ${state?.world.seed ?? '—'}
lượt         ${state?.world.tick ?? 0}
entity       ${state?.entities.size ?? 0} · thấy ${view?.entities.size ?? 0}
tri thức     ${state?.knowledge.size ?? 0}
mạch truyện  ${state?.storylines.size ?? 0}
phục bút     ${state?.foreshadows.size ?? 0}`}
        </pre>

        {patchBiTuChoi.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...nhan, color: 'var(--hoi)' }}>
              {patchBiTuChoi.length} thay đổi AI đề nghị đã bị engine từ chối
            </div>
            {patchBiTuChoi.map((p, i) => (
              <div key={i} style={{ ...phu, color: 'var(--hoi)' }}>
                {p.ma} — {p.thongDiep}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
