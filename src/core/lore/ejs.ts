/**
 * EJS Lorebook an toàn.
 *
 * Lorebook là dữ liệu không tin cậy nên không được đưa vào `eval`/`Function` hay renderer EJS
 * đầy đủ. Tầng này hỗ trợ phần hữu ích cho prompt động: `<%= duong.dan %>`, `<%- duong.dan %>`,
 * comment `<%# ... %>` và macro `{{user}}`. Mọi câu lệnh JavaScript khác bị loại bỏ và báo lỗi.
 */
import type { WorldState } from '../engine/state.js';
import type { Lorebook, LorebookEntry } from './schema.js';

export type NguCanhEjsLore = Readonly<{
  world: Readonly<{ tick: number; year: number; phase: number; phaseLabel: string }>;
  user: Readonly<{ id: string; name: string; mode: string }>;
  lore: Readonly<{
    bookName: string;
    activeEntryCount: number;
    realizedNames: string;
    gravity: number;
  }>;
  entry: Readonly<{ id: string; name: string; keys: string; group: string; phase: number }>;
}>;

export type KetQuaEjsLore = Readonly<{ text: string; errors: readonly string[] }>;

const CAM = new Set(['__proto__', 'prototype', 'constructor']);
const THE_EJS = /<%([_=#-]?)([\s\S]*?)%>/g;
const TRAN_KY_TU = 100_000;

export function giaiDoanLore(lorebook: Lorebook, tick: number): number {
  const tu = lorebook.tickBat ?? 0;
  return Math.max(0, Math.min(9, Math.floor(Math.max(0, tick - tu) / lorebook.nhipMoGiaiDoan)));
}

function nhanGiaiDoan(n: number): string {
  return [
    'mầm luật và dấu hiệu',
    'cõi giới và trật tự',
    'thần linh bước vào lịch sử',
    'thần tích và bảo vật',
    'sử thi phân nhánh',
  ][Math.min(4, n)] as string;
}

function docDuongDan(root: NguCanhEjsLore, raw: string): unknown {
  const path = raw.trim();
  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(path)) return undefined;
  let value: unknown = root;
  for (const part of path.split('.')) {
    if (CAM.has(part) || value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

function thanhChu(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(thanhChu).join(', ');
  return '';
}

export function taoNguCanhEjsLore(s: WorldState, lorebook: Lorebook, entry: LorebookEntry): NguCanhEjsLore {
  const chuTheId = s.world.playerState.chuTheId;
  const chuThe = chuTheId === null ? null : s.entities.get(chuTheId);
  const tenDaThanh = new Set<string>();
  const tenEntity = new Set([...s.entities.values()].map((e) => e.ten.trim().toLowerCase()));
  for (const e of lorebook.entries) {
    const ten = (e.keys[0] ?? e.ten).trim();
    if (ten !== '' && tenEntity.has(ten.toLowerCase())) tenDaThanh.add(ten);
    if (tenDaThanh.size >= 12) break;
  }
  const phase = giaiDoanLore(lorebook, s.world.tick);
  return {
    world: { tick: s.world.tick, year: s.world.year, phase, phaseLabel: nhanGiaiDoan(phase) },
    user: {
      id: chuTheId ?? 'nguoi_choi',
      name: chuThe?.ten ?? 'Người Chơi',
      mode: s.world.playerState.mode,
    },
    lore: {
      bookName: lorebook.ten,
      activeEntryCount: lorebook.entries.filter((e) => e.trangThai === 'hoat_dong').length,
      realizedNames: [...tenDaThanh].join(', ') || 'chưa có neo nào thành lịch sử',
      gravity: lorebook.lucHapDan,
    },
    entry: {
      id: entry.id,
      name: entry.ten,
      keys: entry.keys.join(', '),
      group: entry.nhomKichHoat,
      phase: entry.giaiDoanMo,
    },
  };
}

export function renderEjsLore(template: string, context: NguCanhEjsLore): KetQuaEjsLore {
  if (template.length > TRAN_KY_TU) {
    return { text: template.slice(0, TRAN_KY_TU), errors: [`EJS Lorebook vượt trần ${TRAN_KY_TU} ký tự.`] };
  }
  const errors: string[] = [];
  const text = template
    .replace(THE_EJS, (_all, sigil: string, body: string) => {
      if (sigil === '#') return '';
      if (sigil !== '=' && sigil !== '-') {
        errors.push(
          `EJS Lorebook chỉ cho phép nội suy đường dẫn; đã bỏ câu lệnh: ${body.trim().slice(0, 80)}`,
        );
        return '';
      }
      const value = docDuongDan(context, body);
      if (value === undefined) {
        errors.push(`Biến EJS Lorebook không tồn tại hoặc không an toàn: ${body.trim()}`);
        return '';
      }
      return thanhChu(value);
    })
    .replace(/\{\{user\}\}/gi, context.user.name)
    .trim();
  return { text, errors };
}
