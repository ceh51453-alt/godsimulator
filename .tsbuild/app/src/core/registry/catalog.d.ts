/**
 * HandlerCatalog + SchemaCatalog — Phần 61.2 [BB].
 *
 * "Hai catalog sau CHỈ nằm trong code."
 *
 * Pack JSON chỉ được tham chiếu `handlerId` và `schemaRef` đã đăng ký ở đây.
 * Id lạ → mục được nhập ở trạng thái `can_adapter`, KHÔNG kích hoạt.
 * Đây là ranh giới duy nhất giữa dữ liệu không tin cậy và code chạy được.
 */
import { z } from 'zod';
import type { RuntimeHandler } from './manifest.js';
export declare const SchemaCatalog: ReadonlyMap<string, z.ZodType>;
export declare function dangKyHandler(id: string, fn: RuntimeHandler): void;
export declare const HandlerCatalog: ReadonlyMap<string, RuntimeHandler>;
export declare function coHandler(id: string): boolean;
export declare function coSchemaRef(ref: string): boolean;
export declare function danhSachSchemaRef(): readonly string[];
