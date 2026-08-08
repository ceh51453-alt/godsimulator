/**
 * Cổng cho runtime Tavern Helper.
 *
 * Ba câu bài này phải trả lời được, vì cả ba đều là chỗ bản trước hỏng im lặng:
 *
 *   1. Script có **thật sự chạy** không, hay chỉ được lưu rồi bỏ đó?
 *   2. Tắt script có tắt luôn thứ nó cắm vào trang không, hay chỉ ngừng gọi?
 *   3. Script hỏng có làm chết lượt kể không?
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { HostScript } from './host.js';
import { BusSuKien, TAVERN_EVENTS } from './suKien.js';
import type { CauNoiTavern, PresetTho } from './cauNoi.js';
import { cauNoiRong } from './cauNoi.js';
import { HelperScriptSchema } from '../../core/preset/schema.js';
import type { HelperScript } from '../../core/preset/schema.js';

function script(noiDung: string, phan: Partial<HelperScript> = {}): HelperScript {
  return HelperScriptSchema.parse({
    id: 'p/th0',
    packId: 'p',
    ten: 'thử',
    hash: 'abc',
    soKyTu: noiDung.length,
    batONguon: true,
    noiDung,
    ...phan,
  });
}

/** Cầu nối ghi lại mọi thứ script chạm vào — bài test đọc lại nó để khẳng định. */
function cauNoiGhi(): CauNoiTavern & { kho: Record<string, Record<string, unknown>>; nhatKy: string[] } {
  const kho: Record<string, Record<string, unknown>> = {};
  const nhatKy: string[] = [];
  let preset: PresetTho = {
    settings: {},
    prompts: [{ id: 'intro', name: 'Mở đầu', enabled: false, role: 'system', content: 'x' }],
  };
  return {
    ...cauNoiRong(),
    kho,
    nhatKy,
    docBien: (pham) => ({ ...(kho[pham.type ?? 'script'] ?? {}) }),
    ghiBien: (pham, bien) => {
      kho[pham.type ?? 'script'] = { ...bien };
    },
    docTinNhan: () => [
      {
        message_id: 0,
        name: 'Người Chơi',
        role: 'user',
        is_user: true,
        is_system: false,
        message: 'xin chào',
        data: {},
        extra: {},
      },
      {
        message_id: 1,
        name: 'Thiên Diễn',
        role: 'assistant',
        is_user: false,
        is_system: false,
        message: 'lời kể',
        data: {},
        extra: {},
      },
    ],
    docPreset: () => JSON.parse(JSON.stringify(preset)) as PresetTho,
    ghiPreset: (_ten, p) => {
      preset = p;
    },
    tenPresetDangDung: () => 'preset thử',
    ghiNhatKy: (_id, muc, dong) => nhatKy.push(`${muc}:${dong}`),
  };
}

describe('host script — chạy thật', () => {
  let host: HostScript;
  let cau: ReturnType<typeof cauNoiGhi>;

  beforeEach(() => {
    host = new HostScript();
    cau = cauNoiGhi();
    host.datCauNoi(cau);
  });

  it('mã nguồn được thực thi và ghi được biến của chính script', async () => {
    await host.chay(script(`replaceVariables({ da_chay: true }, { type: 'script' });`));
    expect(cau.kho['script']).toEqual({ da_chay: true });
    expect(host.dangChay()[0]?.trangThai).toBe('dang_chay');
  });

  it('`const` trùng tên ở hai script không đụng nhau — mỗi script một scope', async () => {
    await host.chay(script(`const Config = 1; replaceVariables({ a: Config }, { type: 'chat' });`));
    await host.chay(
      script(`const Config = 2; replaceVariables({ b: Config }, { type: 'global' });`, {
        id: 'p/th1',
      }),
    );
    expect(host.dangChay().every((s) => s.trangThai === 'dang_chay')).toBe(true);
    expect(cau.kho['chat']).toEqual({ a: 1 });
    expect(cau.kho['global']).toEqual({ b: 2 });
  });

  it('script nghe sự kiện Tavern và nhận được tin nhắn của lượt', async () => {
    await host.chay(
      script(
        `eventOn(tavern_events.MESSAGE_RECEIVED, (id) => {
           const tin = getChatMessages(id)[0];
           replaceVariables({ id, noiDung: tin.message, vai: tin.role }, { type: 'script' });
         });`,
      ),
    );
    await host.phat(TAVERN_EVENTS.MESSAGE_RECEIVED, 1);
    expect(cau.kho['script']).toEqual({ id: 1, noiDung: 'lời kể', vai: 'assistant' });
  });

  it('`updatePresetWith` bật được một prompt theo tên, đúng cách preset thật làm', async () => {
    await host.chay(
      script(
        `await updatePresetWith('in_use', (p) => {
           for (const x of p.prompts) if (x.name === 'Mở đầu') x.enabled = true;
           return p;
         });`,
      ),
    );
    expect(cau.docPreset('in_use')?.prompts[0]?.enabled).toBe(true);
  });

  it('lỗi trong script KHÔNG ném ra ngoài — nó thành một dòng lỗi có tên script', async () => {
    await host.chay(script(`throw new Error('hỏng ở dòng đầu');`));
    const ban = host.dangChay()[0];
    expect(ban?.trangThai).toBe('loi');
    expect(ban?.loi.join(' ')).toContain('hỏng ở dòng đầu');
  });

  it('lỗi trong handler sự kiện cũng không kéo theo cả lượt', async () => {
    await host.chay(
      script(`eventOn(tavern_events.GENERATION_ENDED, () => { throw new Error('vỡ trong handler'); });`),
    );
    await expect(host.phat(TAVERN_EVENTS.GENERATION_ENDED)).resolves.toBeUndefined();
    expect(host.dangChay()[0]?.loi.join(' ')).toContain('vỡ trong handler');
  });

  it('tắt script gỡ luôn handler của nó — không còn chạy sau khi tắt', async () => {
    await host.chay(
      script(
        `let n = 0;
         eventOn(tavern_events.MESSAGE_RECEIVED, () => {
           n += 1;
           replaceVariables({ n }, { type: 'script' });
         });`,
      ),
    );
    await host.phat(TAVERN_EVENTS.MESSAGE_RECEIVED, 0);
    expect(cau.kho['script']).toEqual({ n: 1 });

    host.dung('p/th0');
    await host.phat(TAVERN_EVENTS.MESSAGE_RECEIVED, 0);
    // Giá trị đứng yên: handler đã bị gỡ, không phải chạy rồi bị bỏ kết quả.
    expect(cau.kho['script']).toEqual({ n: 1 });
    expect(host.dangChay()).toEqual([]);
  });

  it('chạy lại một script đang chạy thì bản cũ bị dừng trước — không có hai bản chồng nhau', async () => {
    const s = script(
      `eventOn(tavern_events.MESSAGE_RECEIVED, () => {
         const cu = getVariables({ type: 'script' });
         replaceVariables({ n: (cu.n ?? 0) + 1 }, { type: 'script' });
       });`,
    );
    await host.chay(s);
    await host.chay(s);
    await host.phat(TAVERN_EVENTS.MESSAGE_RECEIVED, 0);
    expect(cau.kho['script']).toEqual({ n: 1 });
  });

  it('nút của script phát đúng sự kiện `${scriptId}_${tên}`', async () => {
    await host.chay(
      script(
        `eventOn(getButtonEvent('Khởi động'), () => replaceVariables({ bam: true }, { type: 'chat' }));`,
        {
          buttons: [{ name: 'Khởi động', visible: true }],
        },
      ),
    );
    await host.bamNut('p/th0', 'Khởi động');
    expect(cau.kho['chat']).toEqual({ bam: true });
  });

  it('`insertVariables` chỉ điền khóa còn thiếu, `replaceVariables` ghi đè tất', async () => {
    await host.chay(
      script(
        `replaceVariables({ a: 1 }, { type: 'chat' });
         insertVariables({ a: 99, b: 2 }, { type: 'chat' });`,
      ),
    );
    expect(cau.kho['chat']).toEqual({ a: 1, b: 2 });
  });

  it('`console.*` của script đi vào nhật ký thay vì biến mất', async () => {
    await host.chay(script(`console.info('đã nạp xong');`));
    expect(cau.nhatKy.join(' ')).toContain('đã nạp xong');
  });
});

describe('bus sự kiện', () => {
  it('chạy tuần tự và CHỜ handler bất đồng bộ', async () => {
    const bus = new BusSuKien();
    const vet: string[] = [];
    bus.on(
      'x',
      async () => {
        await Promise.resolve();
        vet.push('cham');
      },
      'a',
    );
    bus.on('x', () => vet.push('nhanh'), 'b');
    await bus.phat('x');
    expect(vet).toEqual(['cham', 'nhanh']);
  });

  it('`eventMakeFirst` đẩy một handler lên trước', async () => {
    const bus = new BusSuKien();
    const vet: string[] = [];
    const sau = (): void => void vet.push('sau');
    const truoc = (): void => void vet.push('truoc');
    bus.on('x', sau, 'a');
    bus.on('x', truoc, 'b');
    bus.datUuTien('x', truoc, -1);
    await bus.phat('x');
    expect(vet).toEqual(['truoc', 'sau']);
  });

  it('`once` chỉ chạy một lần', async () => {
    const bus = new BusSuKien();
    let n = 0;
    bus.on('x', () => void n++, 'a', true);
    await bus.phat('x');
    await bus.phat('x');
    expect(n).toBe(1);
  });
});
