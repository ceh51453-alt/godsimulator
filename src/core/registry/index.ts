/**
 * R — mười hai registry. Phần 5.1 [BB].
 *
 * Cổng 61.1 #2: "Không còn truy cập `R.*` chưa khai."
 * Bài test `registry.test.ts` chứng minh REGISTRY_IDS khớp đúng khóa của R.
 */
import { createRegistry } from './createRegistry.js';
import type { Registry } from './createRegistry.js';
import { REGISTRY_IDS } from './manifest.js';
import type { RegistryId, RegistryManifest } from './manifest.js';
import type {
  AspectDef,
  KindDef,
  VerbDef,
  RelationDef,
  GapDef,
  ActionDef,
  EndingDef,
  MetricDef,
  ProfileDef,
  StoryKindDef,
  MechanismDef,
  WorldProcessDef,
} from './types.js';

import { ASPECTS_DUNG_SAN } from './aspects.js';
import { KINDS_DUNG_SAN } from './kinds.js';
import { VERBS_DUNG_SAN } from './verbs.js';
import { RELATIONS_DUNG_SAN } from './relations.js';
import {
  GAPS_DUNG_SAN,
  ACTIONS_DUNG_SAN,
  ENDINGS_DUNG_SAN,
  METRICS_DUNG_SAN,
  PROFILES_DUNG_SAN,
  STORY_KINDS_DUNG_SAN,
  MECHANISMS_DUNG_SAN,
  WORLD_PROCESSES_DUNG_SAN,
} from './misc.js';

export const R = {
  aspect: createRegistry<AspectDef>('aspect'),
  kind: createRegistry<KindDef>('kind'),
  verb: createRegistry<VerbDef>('verb'),
  relation: createRegistry<RelationDef>('relation'),
  gap: createRegistry<GapDef>('gap'),
  action: createRegistry<ActionDef>('action'),
  ending: createRegistry<EndingDef>('ending'),
  metric: createRegistry<MetricDef>('metric'),
  profile: createRegistry<ProfileDef>('profile'),
  storyKind: createRegistry<StoryKindDef>('storyKind'),
  mechanism: createRegistry<MechanismDef>('mechanism'),
  worldProcess: createRegistry<WorldProcessDef>('worldProcess'),
} as const;

export type RegistryBundle = typeof R;

/** Bằng chứng kiểu: R có đúng mười hai khóa của REGISTRY_IDS, không thừa không thiếu. */
type KhoaR = keyof RegistryBundle;
type _DuKhoa = RegistryId extends KhoaR ? true : never;
type _KhongThua = KhoaR extends RegistryId ? true : never;
const _duKhoa: _DuKhoa = true;
const _khongThua: _KhongThua = true;
void _duKhoa;
void _khongThua;

let daNap = false;

/** Nạp tầng 1 — dựng sẵn. Idempotent. */
export function napDungSan(): void {
  if (daNap) return;
  daNap = true;
  for (const d of ASPECTS_DUNG_SAN) R.aspect.dangKy(d);
  for (const d of KINDS_DUNG_SAN) R.kind.dangKy(d);
  for (const d of VERBS_DUNG_SAN) R.verb.dangKy(d);
  for (const d of RELATIONS_DUNG_SAN) R.relation.dangKy(d);
  for (const d of GAPS_DUNG_SAN) R.gap.dangKy(d);
  for (const d of ACTIONS_DUNG_SAN) R.action.dangKy(d);
  for (const d of ENDINGS_DUNG_SAN) R.ending.dangKy(d);
  for (const d of METRICS_DUNG_SAN) R.metric.dangKy(d);
  for (const d of PROFILES_DUNG_SAN) R.profile.dangKy(d);
  for (const d of STORY_KINDS_DUNG_SAN) R.storyKind.dangKy(d);
  for (const d of MECHANISMS_DUNG_SAN) R.mechanism.dangKy(d);
  for (const d of WORLD_PROCESSES_DUNG_SAN) R.worldProcess.dangKy(d);
}

/** Chỉ dùng trong test: xóa tầng pack/ghi đè của mọi registry. */
export function datLaiTatCa(): void {
  for (const id of REGISTRY_IDS) {
    (R[id] as Registry<{ id: string }>).datLai();
  }
  daNap = false;
  napDungSan();
}

/** Toàn bộ manifest dựng sẵn — dùng cho test JSON round-trip và xuất pack. */
export function moiManifest(): readonly RegistryManifest[] {
  napDungSan();
  return REGISTRY_IDS.flatMap((id) =>
    (R[id] as Registry<{ id: string; manifest: RegistryManifest }>).tatCa().map((d) => d.manifest),
  );
}

export * from './manifest.js';
export * from './types.js';
export { createRegistry } from './createRegistry.js';
export type { Registry } from './createRegistry.js';
export { HandlerCatalog, SchemaCatalog, dangKyHandler, coHandler, coSchemaRef } from './catalog.js';
