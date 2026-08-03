/**
 * Hiện thực hóa các "neo" có hình dạng thực thể trong Lorebook.
 *
 * Lorebook vẫn là nguồn định hướng, không phải toàn bộ lịch sử được đóng dấu sẵn.
 * Vì vậy chỉ entry tự khai rõ mình là nhân vật/thần/nơi chốn/khái niệm mới được
 * tạo thành entity khi bật sách. Những entry còn lại đi qua retrieval và được
 * Narrator đưa vào thế giới dần dần.
 */
import type { WorldState } from '../engine/state.js';
import { bam } from '../engine/hash.js';
import { EntitySchema } from '../schema/entity.js';
import type { Entity } from '../schema/entity.js';
import { SoulSchema } from '../schema/aspect/soul.js';
import { MortalSchema, SpatialSchema } from '../schema/aspect/living.js';
import { DomainSchema, VenerableSchema } from '../schema/aspect/divine.js';
import { ConceptualSchema } from '../schema/aspect/conceptual.js';
import { nguonGoc } from '../schema/aspect/provenance.js';
import type { Lorebook, LorebookEntry } from './schema.js';

export type NeoLore = Readonly<{
  ten: string;
  kind: 'mortal' | 'deity' | 'place' | 'concept';
  aliases: readonly string[];
}>;

const CHI_THI =
  /(?:@entity|thực\s*thể|entity|nhân\s*vật|character|npc|thần|deity|địa\s*danh|place|location|khái\s*niệm|concept)\s*(?:\(([^)]+)\)|\[([^\]]+)\])?\s*[:：]\s*([^\r\n;|]{2,80})/iu;
const NHAN_VAT =
  /\b(?:nhân\s*vật|character|npc|tuổi|age|gender|giới\s*tính|cô ấy|anh ấy|nàng|hắn|ông ấy|bà ấy|protagonist|antagonist)\b/iu;
const THAN = /\b(?:thần|thánh|deity|god|goddess|divine|神|女神)\b/iu;
const NOI =
  /\b(?:địa\s*danh|nơi\s*chốn|thành\s*phố|vương\s*quốc|núi|sông|đảo|place|location|city|realm|kingdom|城|国)\b/iu;
const KHAI_NIEM = /\b(?:khái\s*niệm|quy\s*luật|concept|principle|法则|概念)\b/iu;
const TEN_CHUNG = /^(?:entry|mục|ghi chú|note|lore|world info|untitled|không tên)\s*\d*$/iu;

function sachTen(s: string): string {
  return s
    .trim()
    .replace(/^[#*\s[\]"'“”‘’]+|[#*\s[\]"'“”‘’]+$/g, '')
    .trim()
    .slice(0, 80);
}

function kindTuNhan(nhan: string, noiDung: string): NeoLore['kind'] {
  const ca = `${nhan}\n${noiDung}`;
  if (THAN.test(ca)) return 'deity';
  if (NOI.test(ca)) return 'place';
  if (KHAI_NIEM.test(ca)) return 'concept';
  return 'mortal';
}

/** Đọc một neo rõ ràng; không đoán mọi entry thành nhân vật. */
export function docNeoLore(entry: LorebookEntry): NeoLore | null {
  if (entry.triHoanHienThuc) return null;
  const m = CHI_THI.exec(entry.noiDung);
  let ten = '';
  let nhan = '';
  if (m !== null) {
    nhan = `${m[0] ?? ''} ${m[1] ?? ''} ${m[2] ?? ''}`;
    ten = sachTen(m[3] ?? '');
  } else {
    const t = sachTen(entry.ten);
    const coHinhDang = NHAN_VAT.test(entry.noiDung) || THAN.test(entry.noiDung) || NOI.test(entry.noiDung);
    if (!coHinhDang || t.length < 2 || TEN_CHUNG.test(t)) return null;
    ten = t;
    nhan = entry.noiDung;
  }
  if (ten.length < 2 || TEN_CHUNG.test(ten)) return null;

  const aliases = entry.keys
    .map(sachTen)
    .filter((x) => x.length >= 2 && x.length <= 60 && x.toLocaleLowerCase() !== ten.toLocaleLowerCase())
    .slice(0, 12);
  return { ten, kind: kindTuNhan(nhan, entry.noiDung), aliases: [...new Set(aliases)] };
}

function tag(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function aspects(kind: NeoLore['kind'], tick: number, eventId: string): Record<string, unknown> {
  const provenance = nguonGoc('lorebook', tick, { eventId });
  if (kind === 'deity') {
    return {
      provenance,
      soul: SoulSchema.parse({ tang: 't3', kyUcSuyGiam: false }),
      domain: DomainSchema.parse({}),
      venerable: VenerableSchema.parse({}),
    };
  }
  if (kind === 'mortal') {
    return {
      provenance,
      soul: SoulSchema.parse({ tang: 't1' }),
      mortal: MortalSchema.parse({ tickSinh: tick, ageBand: 'adult' }),
    };
  }
  if (kind === 'place') return { provenance, spatial: SpatialSchema.parse({}) };
  return { provenance, conceptual: ConceptualSchema.parse({ giaiDoan: 'manh_nha', trongSo: 1 }) };
}

/**
 * Tạo entity cho các neo chưa tồn tại. Cùng state + lorebook cho cùng id/thứ tự.
 * Entity đã thành Sử không bị xóa khi tắt sách.
 */
export function vatChatHoaLorebook(
  lorebook: Lorebook,
  state: WorldState,
  eventId: string,
): readonly Entity[] {
  if (!lorebook.bat) return [];
  const daCo = new Set<string>();
  for (const e of state.entities.values()) {
    daCo.add(e.ten.toLocaleLowerCase());
    for (const a of e.aliases) daCo.add(a.toLocaleLowerCase());
  }

  const ra: Entity[] = [];
  for (const entry of [...lorebook.entries].sort(
    (a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )) {
    if (entry.trangThai !== 'hoat_dong') continue;
    const neo = docNeoLore(entry);
    if (neo === null || daCo.has(neo.ten.toLocaleLowerCase())) continue;
    const id = `lore.${bam(`${lorebook.id}|${entry.id}|${neo.kind}|${neo.ten}`)}`;
    const tags = ['lorebook', `lorebook_${tag(lorebook.id)}`, `entry_${tag(entry.id)}`, tag(neo.ten)].filter(
      (x) => x !== '',
    );
    ra.push(
      EntitySchema.parse({
        id,
        branchId: state.world.branchId,
        kind: neo.kind,
        ten: neo.ten,
        aliases: neo.aliases,
        moTa: entry.noiDung.trim().slice(0, 1_500),
        tickSinh: state.world.tick,
        aspects: aspects(neo.kind, state.world.tick, eventId),
        tags: [...new Set(tags)],
      }),
    );
    daCo.add(neo.ten.toLocaleLowerCase());
  }
  return ra;
}
