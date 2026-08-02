import type { Registry } from './createRegistry.js';
import type { RegistryManifest } from './manifest.js';
import type { AspectDef, KindDef, VerbDef, RelationDef, GapDef, ActionDef, EndingDef, MetricDef, ProfileDef, StoryKindDef, MechanismDef, WorldProcessDef } from './types.js';
export declare const R: {
    readonly aspect: Registry<AspectDef>;
    readonly kind: Registry<KindDef>;
    readonly verb: Registry<VerbDef>;
    readonly relation: Registry<RelationDef>;
    readonly gap: Registry<GapDef>;
    readonly action: Registry<ActionDef>;
    readonly ending: Registry<EndingDef>;
    readonly metric: Registry<MetricDef>;
    readonly profile: Registry<ProfileDef>;
    readonly storyKind: Registry<StoryKindDef>;
    readonly mechanism: Registry<MechanismDef>;
    readonly worldProcess: Registry<WorldProcessDef>;
};
export type RegistryBundle = typeof R;
/** Nạp tầng 1 — dựng sẵn. Idempotent. */
export declare function napDungSan(): void;
/** Chỉ dùng trong test: xóa tầng pack/ghi đè của mọi registry. */
export declare function datLaiTatCa(): void;
/** Toàn bộ manifest dựng sẵn — dùng cho test JSON round-trip và xuất pack. */
export declare function moiManifest(): readonly RegistryManifest[];
export * from './manifest.js';
export * from './types.js';
export { createRegistry } from './createRegistry.js';
export type { Registry } from './createRegistry.js';
export { HandlerCatalog, SchemaCatalog, dangKyHandler, coHandler, coSchemaRef } from './catalog.js';
