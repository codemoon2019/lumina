import type { VercelResponse } from "@vercel/node";

/** Use raw `ServerResponse` writes — patched `res.json()`/`res.status()` chains can misbehave on some Vercel Node builds → empty 500 with no actionable body if `.json` is missing. */

export function jsonResponse(res: VercelResponse, statusCode: number, body: Record<string, unknown>): void {
  try {
    if (typeof (res as { headersSent?: boolean }).headersSent === "boolean" && res.headersSent) return;
  } catch {
    /* noop */
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function sendAudioMpeg(res: VercelResponse, mp3: Buffer): void {
  try {
    if (typeof (res as { headersSent?: boolean }).headersSent === "boolean" && res.headersSent) return;
  } catch {
    /* noop */
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.end(mp3);
}
