/**
 * Cầu nối giữa script preset và trò chơi.
 *
 * ── Vì sao là một file riêng ──
 *
 * `store/game.ts` đã nhập `store/preset.ts`. Nếu `preset.ts` nhập ngược `game.ts`
 * để đọc khung kể thì hai module tham chiếu vòng, và thứ tự khởi tạo của ESM sẽ
 * quyết định store nào `undefined` lúc nạp — một lỗi chỉ hiện ra ở bản build.
 * File này đứng NGOÀI cả hai, nhập cả hai, rồi cài cầu nối vào host một lần.
 *
 * ── Bảng quyền, đọc được bằng mắt ──
 *
 * Mỗi phương thức dưới đây là một việc script làm được. Thứ **không** có ở đây:
 * ghi `WorldState`, tạo `Event`, gọi model ngoài đường mà người chơi cũng đi qua.
 * Không phải vì sợ script — người dùng tự viết chúng — mà vì một script ghi thẳng
 * vào thế giới sẽ phá replay xác định, và lúc ấy không còn cách nào tái hiện ván.
 */
import { TUNING_MAC_DINH } from '../core/tuning/schema.js';
import { giaiMacro } from '../core/preset/macro.js';
import { hostScript } from '../runtime/tavern/host.js';
import type { CauNoiTavern, PresetTho, RegexTho, TinNhanTavern } from '../runtime/tavern/cauNoi.js';
import { coIndexedDb, layDb } from '../db/instance.js';
import { ghiBienPack } from '../db/preset.js';
import { useGame } from './game.js';
import { usePreset, tinhNangPresetDangBat } from './preset.js';

const VAI: Readonly<Record<string, 'user' | 'assistant' | 'system'>> = Object.freeze({
  nguoi_choi: 'user',
  ket_qua: 'assistant',
  he_thong: 'system',
});

function rowsDangBat() {
  const s = usePreset.getState();
  return s.thuVien.filter((row) => s.dangBat[row.packId]?.packVersion === row.version);
}

/** Module đang bật thật sự, sau khi hợp nhất activation với công tắc của nhánh. */
function moduleDangBat(sourceIdentifier: string, packId: string, macDinh: boolean): boolean {
  return tinhNangPresetDangBat(usePreset.getState().bien[packId], 'module', sourceIdentifier, macDinh);
}

function docPresetTho(): PresetTho | null {
  const rows = rowsDangBat();
  if (rows.length === 0) return null;
  const prompts = rows.flatMap((row) =>
    row.pack.modules.map((m) => ({
      id: m.sourceIdentifier,
      name: m.name,
      enabled: moduleDangBat(m.sourceIdentifier, row.packId, m.enabled),
      role: m.role,
      content: m.content,
      marker: m.sourceMeta['marker'] === true,
    })),
  );
  const gen = rows[0]?.pack.generation ?? {};
  return { settings: { ...gen } as Record<string, unknown>, prompts };
}

/**
 * Ghi lại preset sau khi script sửa.
 *
 * Chỉ `enabled` được nhận. Script chuyển cảnh của preset thật chỉ bật/tắt prompt
 * theo tên; cho phép chúng viết lại `content` sẽ khiến bản trên đĩa và bản đang
 * chạy lệch nhau mà không có version nào ghi nhận điều đó.
 */
function ghiPresetTho(preset: PresetTho, tick: number): void {
  const p = usePreset.getState();
  const theoTen = new Map(preset.prompts.map((x) => [x.id, x.enabled]));
  for (const row of rowsDangBat()) {
    for (const m of row.pack.modules) {
      const moi = theoTen.get(m.sourceIdentifier);
      if (moi === undefined) continue;
      const dang = moduleDangBat(m.sourceIdentifier, row.packId, m.enabled);
      if (moi === dang) continue;
      void p.datTinhNang(row.packId, 'module', m.sourceIdentifier, moi, tick);
    }
  }
}

function docRegexTho(): RegexTho[] {
  return rowsDangBat().flatMap((row) =>
    row.transformDefs.map((t) => ({
      id: t.id,
      script_name: t.ten,
      enabled: tinhNangPresetDangBat(usePreset.getState().bien[row.packId], 'regex', t.id, t.batONguon),
      find_regex: t.pattern,
      replace_string: t.thayThe,
      source: {
        user_input: t.placement.includes(1),
        ai_output: t.placement.includes(2),
        slash_command: t.placement.includes(3),
        world_info: t.placement.includes(5),
      },
      destination: {
        display: !t.promptOnlyNguon || t.markdownOnlyNguon,
        prompt: t.promptOnlyNguon || !t.markdownOnlyNguon,
      },
      min_depth: t.minDepth,
      max_depth: t.maxDepth,
    })),
  );
}

/** Kho biến của script — nằm trong biến pack, dưới một khóa riêng theo script. */
const KHOA_BIEN_SCRIPT = '__script_vars';
const KHOA_BIEN_TIN = '__message_vars';

function packChoScript(scriptId: string): string {
  const row = rowsDangBat().find((r) => (r.scripts ?? []).some((s) => s.id === scriptId));
  return row?.packId ?? rowsDangBat()[0]?.packId ?? '';
}

function docBienPackHienTai(packId: string): Record<string, unknown> {
  return { ...(usePreset.getState().bien[packId] ?? {}) };
}

function ghiBienPackHienTai(packId: string, bien: Record<string, unknown>, tick: number): void {
  const p = usePreset.getState();
  usePreset.setState({ bien: { ...p.bien, [packId]: bien } });
  const branchId = p.branchId;
  if (!coIndexedDb() || branchId === '') return;
  void ghiBienPack(layDb(), packId, branchId, bien, tick).catch(() => {
    // Biến trong phiên vẫn đúng; lỗi đĩa không được làm hỏng lượt kể.
  });
}

let demThongBao = 0;

export function dungCauNoiTavern(): CauNoiTavern {
  const tickHienTai = (): number => useGame.getState().state?.world.tick ?? 0;

  return {
    docBien(pham) {
      const scriptId = pham.script_id ?? '';
      const packId = packChoScript(scriptId);
      const goc = docBienPackHienTai(packId);
      if (pham.type === 'message') {
        const bang = goc[KHOA_BIEN_TIN];
        const theoTin = bang !== null && typeof bang === 'object' ? (bang as Record<string, unknown>) : {};
        const v = theoTin[String(pham.message_id ?? '')];
        return v !== null && typeof v === 'object' ? { ...(v as Record<string, unknown>) } : {};
      }
      if (pham.type === 'script') {
        const bang = goc[KHOA_BIEN_SCRIPT];
        const theoScript = bang !== null && typeof bang === 'object' ? (bang as Record<string, unknown>) : {};
        const rieng = theoScript[scriptId];
        if (rieng !== null && typeof rieng === 'object') return { ...(rieng as Record<string, unknown>) };
        // Lần đầu: lấy `data` khai trong file làm giá trị khởi tạo, đúng như Tavern Helper.
        const def = rowsDangBat()
          .flatMap((r) => r.scripts ?? [])
          .find((s) => s.id === scriptId);
        return { ...(def?.data ?? {}) };
      }
      // `chat` và `global` cùng trỏ về biến pack của nhánh: một ván là một chat.
      const ra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(goc)) {
        if (!k.startsWith('__')) ra[k] = v;
      }
      return ra;
    },

    ghiBien(pham, bien) {
      const scriptId = pham.script_id ?? '';
      const packId = packChoScript(scriptId);
      if (packId === '') return;
      const goc = docBienPackHienTai(packId);
      if (pham.type === 'message') {
        const bang = goc[KHOA_BIEN_TIN];
        const theoTin =
          bang !== null && typeof bang === 'object' ? { ...(bang as Record<string, unknown>) } : {};
        theoTin[String(pham.message_id ?? '')] = bien;
        goc[KHOA_BIEN_TIN] = theoTin;
      } else if (pham.type === 'script') {
        const bang = goc[KHOA_BIEN_SCRIPT];
        const theoScript =
          bang !== null && typeof bang === 'object' ? { ...(bang as Record<string, unknown>) } : {};
        theoScript[scriptId] = bien;
        goc[KHOA_BIEN_SCRIPT] = theoScript;
      } else {
        for (const [k, v] of Object.entries(bien)) {
          if (!k.startsWith('__')) goc[k] = v;
        }
      }
      ghiBienPackHienTai(packId, goc, tickHienTai());
    },

    docTinNhan(): readonly TinNhanTavern[] {
      const g = useGame.getState();
      const ten = g.persona?.displayName ?? 'Người Chơi';
      return g.scene.map((d, i) => {
        const role = VAI[d.loai] ?? 'system';
        return {
          message_id: i,
          name: role === 'user' ? ten : role === 'assistant' ? 'Thiên Diễn' : 'Hệ thống',
          role,
          is_user: role === 'user',
          is_system: role === 'system',
          message: d.noiDung,
          data: {},
          extra: { format: d.dinhDang ?? 'text', tick: d.tick, raw: d.noiDungGoc ?? d.noiDung },
        };
      });
    },

    ghiTinNhan(messageId, noiDung) {
      useGame.getState().datNoiDungDong(messageId, noiDung);
    },

    tenPresetDangDung() {
      return rowsDangBat().at(-1)?.pack.envelope.sourceName ?? '';
    },

    danhSachPreset() {
      return ['in_use', ...usePreset.getState().thuVien.map((r) => r.pack.envelope.sourceName)];
    },

    docPreset(_ten) {
      return docPresetTho();
    },

    ghiPreset(_ten, preset) {
      ghiPresetTho(preset, tickHienTai());
    },

    thayMacro(text) {
      const g = useGame.getState();
      const packId = rowsDangBat().at(-1)?.packId ?? '';
      return giaiMacro(text, {
        char: 'Thiên Diễn',
        user: g.persona?.displayName ?? 'Người Chơi',
        persona: g.persona?.displayName ?? 'Người Chơi',
        description: g.persona?.publicDescription ?? '',
        lastUserMessage: [...g.scene].reverse().find((d) => d.loai === 'nguoi_choi')?.noiDung ?? '',
        sceneId: `scene.${g.state?.world.branchId ?? ''}.${g.state?.world.tick ?? 0}`,
        moduleId: 'script',
        turn: g.state?.world.tick ?? 0,
        maxDepth: TUNING_MAC_DINH.preset.maxMacroDepth,
        bien: { ...(usePreset.getState().bien[packId] ?? {}) },
      }).text;
    },

    chayRegex(text, tuyChon) {
      const p = usePreset.getState();
      return tuyChon.destination === 'prompt'
        ? p.transformPrompt(text, tuyChon.source === 'user_input' ? 1 : 2, tuyChon.depth ?? 0)
        : p.hienThi(text);
    },

    danhSachRegex() {
      return docRegexTho();
    },

    batTatRegex(id, bat) {
      const row = rowsDangBat().find((r) => r.transformDefs.some((t) => t.id === id));
      if (row === undefined) return;
      void usePreset.getState().datTinhNang(row.packId, 'regex', id, bat, tickHienTai());
    },

    async guiLuot(text) {
      const g = useGame.getState();
      if (g.state === null || g.dangKe) return '';
      await g.gui(text);
      return [...useGame.getState().scene].reverse().find((d) => d.loai === 'ket_qua')?.noiDung ?? '';
    },

    bao(muc, text, tieuDe) {
      demThongBao += 1;
      const dong = tieuDe === undefined || tieuDe === '' ? text : `${tieuDe}: ${text}`;
      usePreset.setState({
        thongBao: [...usePreset.getState().thongBao, { id: `tb${demThongBao}`, muc, text: dong }].slice(-6),
      });
    },

    ghiNhatKy(scriptId, muc, dong) {
      const cu = usePreset.getState().nhatKyScript;
      const ds = [...(cu[scriptId] ?? []), { muc, dong }].slice(-60);
      usePreset.setState({ nhatKyScript: { ...cu, [scriptId]: ds } });
    },

    boiCanh() {
      const g = useGame.getState();
      return {
        chatId: g.state?.world.branchId ?? '',
        characterId: g.state?.world.playerState.chuTheId ?? '',
        name1: g.persona?.displayName ?? 'Người Chơi',
        name2: 'Thiên Diễn',
        characters: [],
        groupId: null,
        onlineStatus: g.state === null ? 'no_connection' : 'ok',
        maxContext: usePreset.getState().thamSoHieuLuc().contextLimit ?? 0,
        tick: g.state?.world.tick ?? 0,
      };
    },
  };
}

/** Cài cầu nối và đồng bộ script. Gọi một lần lúc khởi động app. */
export function caiCauNoiTavern(): void {
  hostScript.datCauNoi(dungCauNoiTavern());
  hostScript.onDoi = () => {
    usePreset.setState({ scriptDangChay: hostScript.dangChay() });
  };
}
