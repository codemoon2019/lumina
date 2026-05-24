/**
 * Minimal health check — no shared imports so routing + runtime can be verified in isolation.
 * GET https://YOUR_DEPLOY.vercel.app/api/ping
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.statusCode = 200;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      service: "lumina-coach-api",
      at: new Date().toISOString(),
    }),
  );
}
