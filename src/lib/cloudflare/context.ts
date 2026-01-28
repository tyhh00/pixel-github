// Cloudflare context helper for accessing D1 and R2 bindings
// Works with @opennextjs/cloudflare

import { getCloudflareContext } from "@opennextjs/cloudflare";

// ============================================
// D1 Database Types
// ============================================

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: object;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// ============================================
// R2 Storage Types
// ============================================

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpMetadata?: {
    contentType?: string;
  };
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
}

export interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

// ============================================
// Environment Bindings
// ============================================

export interface AppCloudflareEnv {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  [key: string]: unknown;
}

// Get Cloudflare context in API routes
// Uses @opennextjs/cloudflare's getCloudflareContext for proper binding access
export function getCloudflareEnv(): AppCloudflareEnv | null {
  try {
    const ctx = getCloudflareContext();
    const env = ctx.env as unknown as AppCloudflareEnv;

    if (env?.DB && env?.R2_BUCKET) {
      return env;
    }

    return null;
  } catch {
    // In local development without proper setup, return null
    // API routes should handle this gracefully
    return null;
  }
}

// Check if we're running in Cloudflare Workers environment
export function isCloudflareEnv(): boolean {
  return getCloudflareEnv() !== null;
}
