/** Helper dựng cặp (manifest thuần dữ liệu, Def runtime) cho mục dựng sẵn. */
import { RegistryManifestSchema } from './manifest.js';
import type { RegistryId, RegistryManifest } from './manifest.js';

export type ManifestInput = {
  id: string;
  ten: string;
  moTa?: string;
  version?: number;
  handlerId?: string;
  schemaRef?: string;
  config?: Record<string, unknown>;
  tags?: string[];
};

export function manifestCua(registry: RegistryId, input: ManifestInput): RegistryManifest {
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
