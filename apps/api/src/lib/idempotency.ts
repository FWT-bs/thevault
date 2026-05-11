import type { VercelRequest } from "@vercel/node";

const memoryStore = new Map<string, unknown>();

export function readIdempotencyKey(req: VercelRequest): string | null {
  const key = req.headers["x-idempotency-key"];
  if (Array.isArray(key)) return key[0] ?? null;
  return key ?? null;
}

export function idempotencyGet(scope: string, userId: string, key: string) {
  return memoryStore.get(`${scope}:${userId}:${key}`);
}

export function idempotencySet(scope: string, userId: string, key: string, value: unknown) {
  memoryStore.set(`${scope}:${userId}:${key}`, value);
}
