/** Helper dựng cặp (manifest thuần dữ liệu, Def runtime) cho mục dựng sẵn. */
import { RegistryManifestSchema } from './manifest.js';
export function manifestCua(registry, input) {
    return RegistryManifestSchema.parse({
        registry,
        id: input.id,
        version: input.version ?? 1,
        ten: input.ten,
        moTa: input.moTa ?? '',
        handlerId: input.handlerId ?? '',
        schemaRef: input.schemaRef ?? '',
        config: input.config ?? {},
        conditions: [],
        effects: [],
        tags: input.tags ?? [],
    });
}
