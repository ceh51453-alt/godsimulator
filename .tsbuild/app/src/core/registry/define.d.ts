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
export declare function manifestCua(registry: RegistryId, input: ManifestInput): RegistryManifest;
