/**
 * Màn chính — cửa vào sau Cổng AI.
 *
 * ── Vì sao nó ra đời ở Phase 12 chứ không ở Phase 3 ──
 *
 * Suốt mười một phase, mở app là rơi thẳng vào Khởi Nguyên, và Khởi Nguyên chỉ
 * biết TẠO. Không có đường nào quay lại ván hôm qua, vì không có gì được ghi
 * xuống đĩa để mà quay lại. Nút "Tiếp tục" ở đây không phải một nút — nó là
 * phần cuối của một đường dài: `luuVan()` sau mỗi lượt kể, `quanLySave.ts` liệt
 * kê, `napState()` dựng lại, invariant chạy ở ranh giới nạp.
 *
 * Ba lối, đúng theo thứ tự người ta thật sự dùng:
 *
 *   Tiếp tục   — lối MẶC ĐỊNH khi đã có ván. Đứng đầu vì nó là việc hay làm nhất.
 *   Bắt đầu    — mở một thế giới hư vô mới (ADR-0055).
 *   File save  — nhập/xuất `.json`, đổi tên, xóa.
 *
 * [BB] 36.1 không emoji; [BB] luật bất biến #9 không dấu hiệu nào chỉ bằng màu —
 * mọi trạng thái ở đây đều có chữ.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useGame } from '../../store/game.js';
import { useUi } from '../../store/ui.js';
import type { MucSave } from '../../db/quanLySave.js';
import { Icon } from '../design/Icon.js';
import { nut, oNhap, nhanNho, the } from '../design/kieu.js';

const NHAN_TANG: Readonly<Record<string, string>> = Object.freeze({
  sang_the: 'Sáng Thế',
  than: 'Thần',
  pham_nhan: 'Phàm Nhân',
});

const nutLon = (chinh: boolean, tat: boolean): CSSProperties => ({
  ...nut(chinh, tat),
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '16px 20px',
  fontSize: 15,
  textAlign: 'left',
  width: '100%',
});

/** Tải một chuỗi xuống máy dưới dạng file. Không gửi đi đâu cả. */
function taiVeFile(ten: string, noiDung: string): void {
  const blob = new Blob([noiDung], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ten;
  a.click();
  URL.revokeObjectURL(url);
}

function DongVan({
  muc,
  dangBan,
  onMo,
  onXoa,
  onXuat,
  onDoiTen,
}: {
  muc: MucSave;
  dangBan: boolean;
  onMo: () => void;
  onXoa: () => void;
  onXuat: () => void;
  onDoiTen: (ten: string) => void;
}): JSX.Element {
  const [suaTen, setSuaTen] = useState(false);
  const [ten, setTen] = useState(muc.ten);

  return (
    <li style={{ ...the, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {suaTen ? (
          <input
            style={{ ...oNhap, maxWidth: 260 }}
            value={ten}
            maxLength={80}
            autoFocus
            onChange={(e) => setTen(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onDoiTen(ten);
                setSuaTen(false);
              }
              if (e.key === 'Escape') setSuaTen(false);
            }}
          />
        ) : (
          <strong style={{ fontFamily: 'var(--chu-hien)', fontSize: 18 }}>{muc.ten}</strong>
        )}
        <span style={{ flex: 1 }} />
        <span style={nhanNho}>{muc.gocId === null ? 'NHÁNH GỐC' : 'NHÁNH TÁCH RA'}</span>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'var(--tro)' }}>
        <span>
          Nhịp <b style={{ fontFamily: 'var(--chu-so)' }}>{muc.tick}</b>
        </span>
        <span>
          Năm <b style={{ fontFamily: 'var(--chu-so)' }}>{muc.nam}</b>
        </span>
        <span>Tầng {NHAN_TANG[muc.mode] ?? muc.mode}</span>
        <span>
          <b style={{ fontFamily: 'var(--chu-so)' }}>{muc.soEntity}</b> thực thể
        </span>
        <span>
          <b style={{ fontFamily: 'var(--chu-so)' }}>{muc.soSuKien}</b> sự kiện
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={nut(true, dangBan)} disabled={dangBan} onClick={onMo}>
          Mở ván này
        </button>
        <button type="button" style={nut(false, dangBan)} disabled={dangBan} onClick={onXuat}>
          Xuất ra file
        </button>
        <button
          type="button"
          style={nut(false, dangBan)}
          disabled={dangBan}
          onClick={() => {
            if (suaTen) onDoiTen(ten);
            setSuaTen(!suaTen);
          }}
        >
          {suaTen ? 'Lưu tên' : 'Đổi tên'}
        </button>
        <button type="button" style={nut(false, dangBan)} disabled={dangBan} onClick={onXoa}>
          Xóa
        </button>
      </div>
    </li>
  );
}

export function ManChinh({ onBatDau }: { onBatDau: () => void }): JSX.Element {
  const ds = useGame((s) => s.danhSachVan);
  const napDs = useGame((s) => s.napDanhSachVan);
  const tiepTuc = useGame((s) => s.tiepTucVan);
  const xoa = useGame((s) => s.xoaVanTheoId);
  const doiTen = useGame((s) => s.doiTenVanTheoId);
  const xuatTheoId = useGame((s) => s.xuatVanTheoIdRaChuoi);
  const nhap = useGame((s) => s.nhapVanTuChuoi);
  const loi = useGame((s) => s.loi);
  const doiMan = useUi((s) => s.doiMan);

  const [hienFile, setHienFile] = useState(false);
  const [dangBan, setDangBan] = useState(false);
  const [tin, setTin] = useState('');
  const oFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void napDs();
  }, [napDs]);

  const ganNhat = ds[0] ?? null;

  const chay = async (viec: () => Promise<void>): Promise<void> => {
    setDangBan(true);
    try {
      await viec();
    } finally {
      setDangBan(false);
    }
  };

  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '56px 20px 96px' }}>
      <p style={nhanNho}>THIÊN DIỄN</p>
      <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 40, margin: '4px 0 6px', fontWeight: 500 }}>
        Sảnh Vào
      </h1>
      <p style={{ color: 'var(--tro)', marginTop: 0, fontSize: 14 }}>
        Mọi thứ trong thế giới này — luật, khái niệm, thần, người — chỉ tồn tại sau khi được kể ra trong lúc
        chơi. Ván mới bắt đầu từ hư vô.
      </p>

      <div style={{ display: 'grid', gap: 10, marginTop: 30 }}>
        <button
          type="button"
          style={nutLon(ganNhat !== null, ganNhat === null || dangBan)}
          disabled={ganNhat === null || dangBan}
          onClick={() => {
            if (ganNhat) void chay(async () => void (await tiepTuc(ganNhat.branchId)));
          }}
        >
          <Icon ten="nhip" co={20} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>Tiếp tục</span>
            <span style={{ display: 'block', color: 'var(--mo)', fontSize: 13 }}>
              {ganNhat === null
                ? 'Chưa có ván nào trên máy này.'
                : `${ganNhat.ten} — nhịp ${ganNhat.tick}, ${ganNhat.soEntity} thực thể.`}
            </span>
          </span>
        </button>

        <button type="button" style={nutLon(ganNhat === null, dangBan)} disabled={dangBan} onClick={onBatDau}>
          <Icon ten="than" co={20} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>Bắt đầu</span>
            <span style={{ display: 'block', color: 'var(--mo)', fontSize: 13 }}>
              Mở một thế giới hư vô mới. Không đất, không luật, không tên gọi nào có sẵn.
            </span>
          </span>
        </button>

        <button
          type="button"
          style={nutLon(false, dangBan)}
          disabled={dangBan}
          aria-expanded={hienFile}
          onClick={() => setHienFile(!hienFile)}
        >
          <Icon ten="so_sach" co={20} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>File save</span>
            <span style={{ display: 'block', color: 'var(--mo)', fontSize: 13 }}>
              {ds.length === 0
                ? 'Nhập một file .json từ máy khác.'
                : `${ds.length} ván trên máy này · nhập và xuất .json`}
            </span>
          </span>
        </button>

        <button type="button" style={nutLon(false, false)} onClick={() => doiMan('cai_dat')}>
          <Icon ten="coi" co={20} />
          <span>
            <span style={{ display: 'block', fontWeight: 600 }}>Cài đặt</span>
            <span style={{ display: 'block', color: 'var(--mo)', fontSize: 13 }}>
              Preset · Lorebook · Workflow · Proxy AI
            </span>
          </span>
        </button>
      </div>

      {hienFile && (
        <section aria-label="File save" style={{ marginTop: 26, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              style={nut(true, dangBan)}
              disabled={dangBan}
              onClick={() => oFile.current?.click()}
            >
              Nhập từ file .json
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
                void chay(async () => {
                  const txt = await f.text();
                  const ok = await nhap(txt);
                  setTin(ok ? `Đã nhập "${f.name}" và mở ván.` : `Không nhập được "${f.name}".`);
                });
              }}
            />
            <span style={{ ...nhanNho, textTransform: 'none' }}>
              File save không bao giờ chứa mật khẩu proxy, và mặc định không chứa hồ sơ riêng tư.
            </span>
          </div>

          {tin !== '' && <p style={{ color: 'var(--tro)', fontSize: 13, margin: 0 }}>{tin}</p>}

          {ds.length === 0 ? (
            <p style={{ color: 'var(--mo)', fontSize: 13, margin: 0 }}>
              Chưa có ván nào được lưu. Ván tự lưu sau mỗi nhịp được kể.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {ds.map((m) => (
                <DongVan
                  key={m.branchId}
                  muc={m}
                  dangBan={dangBan}
                  onMo={() => void chay(async () => void (await tiepTuc(m.branchId)))}
                  onXoa={() => void chay(() => xoa(m.branchId))}
                  onDoiTen={(t) => void chay(() => doiTen(m.branchId, t))}
                  onXuat={() =>
                    void chay(async () => {
                      const txt = await xuatTheoId(m.branchId, false);
                      if (txt === null) {
                        setTin('Không xuất được ván này — xem lý do ở danh sách lỗi bên dưới.');
                        return;
                      }
                      taiVeFile(`thien-dien-${m.branchId}-nhip${m.tick}.json`, txt);
                      setTin(`Đã xuất "${m.ten}".`);
                    })
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {loi.length > 0 && (
        <section aria-label="Lỗi" style={{ marginTop: 24 }}>
          <h2 style={{ ...nhanNho, margin: '0 0 6px' }}>CÓ VẤN ĐỀ</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--tro)', fontSize: 13 }}>
            {loi.slice(-5).map((l, i) => (
              <li key={`${l.code}-${i}`}>
                <span style={{ fontFamily: 'var(--chu-so)' }}>{l.code}</span> — {l.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
