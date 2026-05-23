/**
 * Vercel serverless: same contract as dev `POST /api/coach` (Vite middleware).
 * Set `GEMINI_*` (and optionally `GEMINI_API_BASE`) in Vercel project env — not `VITE_`.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_REST_DEFAULT_BASE,
  generateCoachEnvelope,
} from "../coach/geminiCoach";
import type { CoachRequestBody } from "../coach/types";

function sendJson(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const rawBase = process.env.GEMINI_API_BASE?.trim();
  const geminiApiBase = rawBase ? rawBase.replace(/\/$/, "") : GEMINI_REST_DEFAULT_BASE;
  const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  if (!geminiApiKey) {
    sendJson(res, 503, {
      ok: false,
      error:
        "Missing GEMINI_API_KEY on the server. In Vercel: Project Settings → Environment Variables → add GEMINI_API_KEY for Production & Preview (and redeploy).",
    });
    return;
  }

  const raw = (req.body ?? {}) as Partial<CoachRequestBody> & Record<string, unknown>;
  const body: CoachRequestBody = {
    mood: typeof raw.mood === "string" ? raw.mood : "",
    focus: typeof raw.focus === "string" ? raw.focus : "",
    preferredName:
      typeof raw.preferredName === "string" ? raw.preferredName : undefined,
    prior: Array.isArray(raw.prior)
      ? raw.prior.filter((p): p is string => typeof p === "string")
      : [],
  };

  const result = await generateCoachEnvelope(body, {
    apiKey: geminiApiKey,
    apiBase: geminiApiBase,
    model: geminiModel,
  });

  if (!result.ok) {
    sendJson(res, result.status ?? 502, {
      ok: false,
      error: result.error,
      latencyMs: result.latencyMs,
      ...(result.raw ? { raw: result.raw } : {}),
    });
    return;
  }

  sendJson(res, 200, { ok: true, data: result.data, latencyMs: result.latencyMs });
}
