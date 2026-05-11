/* eslint-disable no-console */
const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000/api";

async function check(path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-user-id": "00000000-0000-0000-0000-000000000001",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${path} failed (${res.status}): ${body}`);
  }
  console.log(`ok ${path}`);
}

async function run() {
  await check("/auth/me");
  await check("/catalog");
  await check("/wallet/balance");
  await check("/vault-level/status");
  await check("/streak/summary");
  await check("/streak/claim", {
    method: "POST",
    headers: { "x-idempotency-key": `smoke-${Date.now()}` },
    body: JSON.stringify({ idempotencyKey: `smoke-${Date.now()}` }),
  });
  await check("/redemption/create", {
    method: "POST",
    headers: { "x-idempotency-key": `smoke-red-${Date.now()}` },
    body: JSON.stringify({
      method: "paypal",
      amountUsd: 5,
      destination: "alex@example.com",
      idempotencyKey: `smoke-red-${Date.now()}`,
    }),
  });
}

void run();
