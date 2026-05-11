import type { VercelRequest, VercelResponse } from "@vercel/node";

export type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export function ok<T>(res: VercelResponse, data: T, code = 200) {
  res.status(code).json({ ok: true, data });
}

export function fail(
  res: VercelResponse,
  code: number,
  error: { code: string; message: string; details?: Record<string, unknown> },
) {
  res.status(code).json({ ok: false, error });
}

export function withMethod(methods: string[], handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    if (!req.method || !methods.includes(req.method)) {
      fail(res, 405, { code: "method_not_allowed", message: `Allowed: ${methods.join(", ")}` });
      return;
    }
    await handler(req, res);
  };
}
