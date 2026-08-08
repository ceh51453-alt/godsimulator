/**
 * Cài Đặt — một cửa cho bốn thứ vốn nằm rải rác.
 *
 * ── Vì sao gộp ──
 *
 * Trước Phase 12, bốn thứ này ở bốn chỗ khác nhau và hai trong số đó không có
 * chỗ nào: Cổng AI là một màn chặn ở đầu, Xưởng Preset là một mục trong router,
 * còn Lorebook và Workflow chỉ có id màn mà không có component — bấm vào thì
 * hiện Sảnh. Người chơi muốn đổi proxy giữa ván phải nhớ một đường đi khác với
 * người chơi muốn bật một pack.
 *
 * Bốn tab ở đây là bốn thứ người dùng chỉnh, xếp theo thứ tự họ chạm tới:
 *
 *   Proxy AI  — bắt buộc, và là thứ hỏng thường xuyên nhất
 *   Preset    — nhập rồi bật; đổi cách prompt được xếp
 *   Lorebook  — nhập rồi bật; đổi cái thế giới đang hướng tới
 *   Workflow  — đổi cái chạy khi không ai gõ gì
 *
 * [BB] 58.1 — không hai lớp phủ chồng nhau. Đây là màn TOÀN TRANG, không phải
 * lớp phủ, nên nó đóng lớp phủ khi mở (`doiMan` đã làm việc đó).
 */
import { useState } from 'react';
import { CongAi } from './CongAi.js';
import { XuongPreset } from './XuongPreset.js';
import { Lorebook } from './Lorebook.js';
import { XuongWorkflow } from './XuongWorkflow.js';
import { CaiDatVanBanAi } from './CaiDatVanBanAi.js';
import { nhanNho } from '../design/kieu.js';

const TAB = [
  { id: 'proxy', ten: 'Proxy AI', phu: 'Ba kênh kết nối, model, kiểm tra' },
  { id: 'van_ban_ai', ten: 'Văn bản AI', phu: 'Cỡ chữ, giãn cách, phông chữ' },
  { id: 'preset', ten: 'Preset', phu: 'Nhập, giải xung đột, bật/tắt' },
  { id: 'lorebook', ten: 'Lorebook', phu: 'Sách, đối soát, dị biệt' },
  { id: 'workflow', ten: 'Workflow', phu: 'Đường ống tác vụ và Diễn Hóa' },
] as const;

type TenTab = (typeof TAB)[number]['id'];

export function CaiDat({ tabDau = 'proxy' }: { tabDau?: TenTab }): JSX.Element {
  const [tab, setTab] = useState<TenTab>(tabDau);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/*
       * Dải tab dính khi cuộn — cùng lý do với dải định vị của Bảng Thông Tin
       * (58.4): nội dung bên dưới dài, và mất đường quay ra giữa chừng là cách
       * chắc chắn nhất để người dùng bấm nút Back của trình duyệt.
       */}
      <nav
        role="tablist"
        aria-label="Cài đặt"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          gap: 4,
          padding: '10px 20px',
          background: 'var(--nen-0)',
          borderBottom: '1px solid var(--kinh-vien)',
          overflowX: 'auto',
        }}
      >
        {TAB.map((t) => {
          const dangMo = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={dangMo}
              onClick={() => setTab(t.id)}
              style={{
                background: dangMo ? 'var(--kinh-nen-2)' : 'transparent',
                color: dangMo ? 'var(--sang)' : 'var(--tro)',
                border: `1px solid ${dangMo ? 'var(--kinh-sang)' : 'transparent'}`,
                borderRadius: 'var(--r-sm)',
                padding: '8px 14px',
                font: 'inherit',
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'block', fontWeight: dangMo ? 600 : 400 }}>{t.ten}</span>
              <span style={{ ...nhanNho, display: 'block', textTransform: 'none' }}>{t.phu}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel" style={{ flex: 1, minHeight: 0 }}>
        {tab === 'proxy' && <CongAi />}
        {tab === 'van_ban_ai' && <CaiDatVanBanAi />}
        {tab === 'preset' && <XuongPreset />}
        {tab === 'lorebook' && <Lorebook />}
        {tab === 'workflow' && <XuongWorkflow />}
      </div>
    </div>
  );
}
