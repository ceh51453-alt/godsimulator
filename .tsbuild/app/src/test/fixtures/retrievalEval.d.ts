import type { RetrievalEvalCase } from '../../core/schema/rerank.js';
export type ChunkFixture = {
    readonly id: string;
    readonly branchId: string;
    readonly sourceType: string;
    /** Nguồn gốc — hai chunk cùng nguonId là trùng mạnh dù chữ khác nhau. */
    readonly nguonId: string;
    readonly noiDung: string;
    readonly tick: number;
    readonly trust: number;
    /** Ai được nhìn. 'tat_ca' | mode | id chủ thể cụ thể. */
    readonly aiDuocNhin: readonly string[];
    readonly entityIds: readonly string[];
};
export declare const CHUNKS_EVAL: readonly ChunkFixture[];
export declare const CHUNK_CAM: readonly string[];
export declare const EVAL_CASES: readonly RetrievalEvalCase[];
/** Chunk nào chủ thể được nhìn — dùng cho visibility filter trong test. */
export declare function duocNhin(chunk: ChunkFixture, mode: string, chuTheId: string | null): boolean;
