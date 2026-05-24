/**
 * Gemini connectivity debugger — `GET /api/gemini-probe`.
 *
 * - Without `GEMINI_DEBUG_TOKEN`: returns whether a key appears configured (**no upstream call**, safe to hit occasionally).
 * - With `GEMINI_DEBUG_TOKEN` set: client must send `Authorization: Bearer <same token>` to run a **tiny live** `generateContent` (uses quota — don’t scrape this URL).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { jsonResponse } from "./_respond.js";
import { resolveGeminiProbeGet } from "../coach/geminiProbe.js";
import { DEFAULT_GEMINI_MODEL, GEMINI_REST_DEFAULT_BASE } from "../coach/geminiCoach.js";

function authHeader(req: VercelRequest): string | undefined {
  const a = req.headers.authorization ?? req.headers.Authorization;
  return typeof a === "string" ? a : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const rawBase = process.env.GEMINI_API_BASE?.trim();
    const geminiApiBase = rawBase ? rawBase.replace(/\/$/, "") : GEMINI_REST_DEFAULT_BASE;
    const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    const debugToken = process.env.GEMINI_DEBUG_TOKEN?.trim();

    const { statusCode, json } = await resolveGeminiProbeGet({
      method: req.method ?? "GET",
      authorizationHeader: authHeader(req),
      apiKey,
      geminiApiBase,
      geminiModel,
      debugToken,
    });
    jsonResponse(res, statusCode, json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/gemini-probe]", e);
    jsonResponse(res, 500, { ok: false, error: msg });
  }
}
