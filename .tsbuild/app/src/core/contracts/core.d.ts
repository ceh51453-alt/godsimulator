/**
 * Bốn hợp đồng lõi tối thiểu — Phần 61.3 [BB].
 * Cộng PlayerState (Phần 21.3) vì World tham chiếu nó.
 *
 * [BB] Event là append-only. Patch được kiểm tra và áp trong một transaction.
 * Narrator không ghi state. `source = 'ai_validated'` chỉ dùng sau khi output
 * đã qua schema, invariant và visibility check.
 */
import { z } from 'zod';
export declare const PatchOpSchema: z.ZodObject<{
    op: z.ZodEnum<{
        set: "set";
        push: "push";
        link: "link";
        add: "add";
        mul: "mul";
        remove: "remove";
        flag: "flag";
        unlink: "unlink";
    }>;
    target: z.ZodObject<{
        table: z.ZodString;
        id: z.ZodString;
        path: z.ZodPrefault<z.ZodString>;
    }, z.core.$strict>;
    value: z.ZodOptional<z.ZodUnknown>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
    sourceEventId: z.ZodString;
}, z.core.$strict>;
export declare const EVENT_VISIBILITIES: readonly ["cong_khai", "gioi_han", "bi_mat", "engine"];
export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];
export declare const EVENT_SOURCES: readonly ["engine", "player", "ai_validated", "import", "migration"];
export type EventSource = (typeof EVENT_SOURCES)[number];
export declare const EventSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    tick: z.ZodNumber;
    loai: z.ZodString;
    actorIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    targetIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    causeEventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
    locationId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    patches: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        op: z.ZodEnum<{
            set: "set";
            push: "push";
            link: "link";
            add: "add";
            mul: "mul";
            remove: "remove";
            flag: "flag";
            unlink: "unlink";
        }>;
        target: z.ZodObject<{
            table: z.ZodString;
            id: z.ZodString;
            path: z.ZodPrefault<z.ZodString>;
        }, z.core.$strict>;
        value: z.ZodOptional<z.ZodUnknown>;
        expectedVersion: z.ZodOptional<z.ZodNumber>;
        sourceEventId: z.ZodString;
    }, z.core.$strict>>>;
    visibility: z.ZodPrefault<z.ZodEnum<{
        engine: "engine";
        cong_khai: "cong_khai";
        gioi_han: "gioi_han";
        bi_mat: "bi_mat";
    }>>;
    source: z.ZodEnum<{
        engine: "engine";
        player: "player";
        ai_validated: "ai_validated";
        import: "import";
        migration: "migration";
    }>;
    payload: z.ZodPrefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    hash: z.ZodString;
}, z.core.$strict>;
export declare const SceneSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    startedAtTick: z.ZodNumber;
    currentTick: z.ZodNumber;
    locationId: z.ZodNullable<z.ZodString>;
    participantIds: z.ZodArray<z.ZodString>;
    lensId: z.ZodString;
    status: z.ZodPrefault<z.ZodEnum<{
        open: "open";
        paused: "paused";
        closed: "closed";
    }>>;
    draftInput: z.ZodPrefault<z.ZodString>;
    eventIds: z.ZodPrefault<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
/**
 * Trạng thái người chơi — Phần 21.3.
 * Chuyển tầng KHÔNG tạo save mới, KHÔNG đổi branchId, KHÔNG reset gì.
 * Chỉ đổi `mode` + `chuTheId` rồi gọi lại `chieu()`.
 */
export declare const PlayerStateSchema: z.ZodPrefault<z.ZodObject<{
    playerProfileId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    creatorIdentityId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    setupVersion: z.ZodPrefault<z.ZodNumber>;
    setupCompleted: z.ZodPrefault<z.ZodBoolean>;
    mode: z.ZodPrefault<z.ZodEnum<{
        sang_the: "sang_the";
        than: "than";
        pham_nhan: "pham_nhan";
    }>>;
    chuTheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    banTheGocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
    lichSuChuyenTang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
        tick: z.ZodNumber;
        tu: z.ZodString;
        den: z.ZodString;
        lyDo: z.ZodString;
    }, z.core.$strict>>>;
}, z.core.$strip>>;
export declare const WorldSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    seed: z.ZodString;
    tick: z.ZodNumber;
    eraId: z.ZodString;
    year: z.ZodNumber;
    tuningProfileId: z.ZodString;
    playerState: z.ZodPrefault<z.ZodObject<{
        playerProfileId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        creatorIdentityId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        setupVersion: z.ZodPrefault<z.ZodNumber>;
        setupCompleted: z.ZodPrefault<z.ZodBoolean>;
        mode: z.ZodPrefault<z.ZodEnum<{
            sang_the: "sang_the";
            than: "than";
            pham_nhan: "pham_nhan";
        }>>;
        chuTheId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        banTheGocId: z.ZodPrefault<z.ZodNullable<z.ZodString>>;
        lichSuChuyenTang: z.ZodPrefault<z.ZodArray<z.ZodObject<{
            tick: z.ZodNumber;
            tu: z.ZodString;
            den: z.ZodString;
            lyDo: z.ZodString;
        }, z.core.$strict>>>;
    }, z.core.$strip>>;
    indicesVersion: z.ZodPrefault<z.ZodNumber>;
    version: z.ZodNumber;
}, z.core.$strict>;
export type PatchOp = z.infer<typeof PatchOpSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type World = z.infer<typeof WorldSchema>;
