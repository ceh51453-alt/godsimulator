import { describe, expect, it } from 'vitest';
import { CAI_DAT_VAN_BAN_AI_MAC_DINH, chuanHoaCaiDatVanBanAi } from './vanBanAi.js';

describe('cài đặt văn bản AI', () => {
  it('dùng mặc định khi dữ liệu lưu không hợp lệ', () => {
    expect(chuanHoaCaiDatVanBanAi(null)).toEqual(CAI_DAT_VAN_BAN_AI_MAC_DINH);
    expect(chuanHoaCaiDatVanBanAi({ coChu: 'rất lớn', phongChu: 'không tồn tại' })).toEqual(
      CAI_DAT_VAN_BAN_AI_MAC_DINH,
    );
  });

  it('giới hạn các con số để không làm vỡ khung chơi', () => {
    expect(chuanHoaCaiDatVanBanAi({ coChu: 100, gianDong: 0.2, gianChu: 2, phongChu: 'co_chan' })).toEqual({
      coChu: 24,
      gianDong: 1.2,
      gianChu: 0.12,
      phongChu: 'co_chan',
    });
  });
});
