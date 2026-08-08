import type { CSSProperties, ReactNode } from 'react';
import { CAI_DAT_VAN_BAN_AI_MAC_DINH, GIA_TRI_FONT_AI, useVanBanAi } from '../../store/vanBanAi.js';
import { nhanNho, nut, oNhap, the } from '../design/kieu.js';

function DieuKhien({
  nhan,
  giaTri,
  moTa,
  children,
}: {
  nhan: string;
  giaTri: string;
  moTa: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 13 }}>
        <span>{nhan}</span>
        <output style={{ color: 'var(--dong)', fontFamily: 'var(--chu-so)' }}>{giaTri}</output>
      </span>
      {children}
      <span style={{ color: 'var(--mo)', fontSize: 12 }}>{moTa}</span>
    </label>
  );
}

export function CaiDatVanBanAi(): JSX.Element {
  const caiDat = useVanBanAi((s) => s.caiDat);
  const thayDoi = useVanBanAi((s) => s.thayDoi);
  const khoiPhucMacDinh = useVanBanAi((s) => s.khoiPhucMacDinh);

  const kieuXemTruoc: CSSProperties = {
    fontFamily: GIA_TRI_FONT_AI[caiDat.phongChu],
    fontSize: caiDat.coChu,
    lineHeight: caiDat.gianDong,
    letterSpacing: `${caiDat.gianChu}em`,
    whiteSpace: 'pre-wrap',
  };

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '34px 22px 80px' }}>
      <p style={nhanNho}>HIỂN THỊ KHI CHƠI</p>
      <h1 style={{ fontFamily: 'var(--chu-hien)', fontSize: 30, margin: '4px 0 8px', fontWeight: 500 }}>
        Văn bản AI
      </h1>
      <p style={{ color: 'var(--tro)', fontSize: 14, margin: '0 0 26px', maxWidth: 660 }}>
        Các thay đổi dưới đây chỉ áp dụng cho lời kể do AI trả về, kể cả khi đang hiện dần. Câu của bạn, thông
        báo hệ thống và các bảng khác vẫn giữ nguyên.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: 22,
        }}
      >
        <section
          style={{ ...the, display: 'grid', gap: 22, alignContent: 'start' }}
          aria-label="Tuỳ chỉnh văn bản AI"
        >
          <DieuKhien nhan="Cỡ chữ" giaTri={`${caiDat.coChu}px`} moTa="Từ 12px đến 24px.">
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={caiDat.coChu}
              onChange={(e) => thayDoi({ coChu: Number(e.currentTarget.value) })}
              aria-label="Cỡ chữ lời kể AI"
            />
          </DieuKhien>

          <DieuKhien
            nhan="Giãn dòng"
            giaTri={caiDat.gianDong.toFixed(2)}
            moTa="Khoảng cách giữa các dòng chữ."
          >
            <input
              type="range"
              min={1.2}
              max={2.2}
              step={0.05}
              value={caiDat.gianDong}
              onChange={(e) => thayDoi({ gianDong: Number(e.currentTarget.value) })}
              aria-label="Giãn dòng lời kể AI"
            />
          </DieuKhien>

          <DieuKhien
            nhan="Giãn chữ"
            giaTri={`${caiDat.gianChu > 0 ? '+' : ''}${caiDat.gianChu.toFixed(2)}em`}
            moTa="Thu hẹp hoặc nới khoảng cách giữa các ký tự."
          >
            <input
              type="range"
              min={-0.03}
              max={0.12}
              step={0.01}
              value={caiDat.gianChu}
              onChange={(e) => thayDoi({ gianChu: Number(e.currentTarget.value) })}
              aria-label="Giãn chữ lời kể AI"
            />
          </DieuKhien>

          <label style={{ display: 'grid', gap: 7, fontSize: 13 }}>
            Phông chữ
            <select
              style={{ ...oNhap, boxSizing: 'border-box' }}
              value={caiDat.phongChu}
              onChange={(e) =>
                thayDoi({ phongChu: e.currentTarget.value as typeof CAI_DAT_VAN_BAN_AI_MAC_DINH.phongChu })
              }
            >
              <option value="mac_dinh">Mặc định của trò chơi</option>
              <option value="khong_chan">Không chân — dễ đọc</option>
              <option value="co_chan">Có chân — văn chương</option>
              <option value="don_cach">Đơn cách — rõ từng ký tự</option>
            </select>
          </label>

          <button type="button" style={{ ...nut(false), justifySelf: 'start' }} onClick={khoiPhucMacDinh}>
            Khôi phục mặc định
          </button>
        </section>

        <section style={{ ...the, alignSelf: 'start' }} aria-label="Xem trước văn bản AI">
          <p style={{ ...nhanNho, margin: '0 0 14px' }}>XEM TRƯỚC</p>
          <div style={{ ...kieuXemTruoc, color: 'var(--tro)' }}>
            Gió lặng đi trên mặt biển, để lại một khoảng im lặng sâu như ký ức.
            {'\n\n'}Từ phía chân trời, ánh sáng đầu tiên chạm vào những ngọn tháp vừa được gọi tên.
          </div>
        </section>
      </div>
    </main>
  );
}
