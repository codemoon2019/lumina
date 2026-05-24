/**
 * Vercel serverless: same contract as dev `POST /api/coach` (Vite middleware).
 * Set `GEMINI_*` (and optionally `GEMINI_API_BASE`) in Vercel project env — not `VITE_`.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { coerceJsonRecord } from "./_coerceBody.js";
import { jsonResponse } from "./_respond.js";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_REST_DEFAULT_BASE,
  generateCoachEnvelope,
} from "../coach/geminiCoach.js";
import type { CoachRequestBody } from "../coach/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      jsonResponse(res, 405, { ok: false, error: "Method Not Allowed" });
      return;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    const rawBase = process.env.GEMINI_API_BASE?.trim();
    const geminiApiBase = rawBase ? rawBase.replace(/\/$/, "") : GEMINI_REST_DEFAULT_BASE;
    const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

    if (!geminiApiKey) {
      jsonResponse(res, 503, {
        ok: false,
        error:
          "Missing GEMINI_API_KEY on the server. In Vercel: Project Settings → Environment Variables → add GEMINI_API_KEY for Production & Preview (and redeploy).",
        ...(typeof process.env.VERCEL !== "undefined"
          ? {
              diagnostics: {
                vercelRuntime: true,
                vercelEnv: process.env.VERCEL_ENV ?? "(unset)",
                tip: "Ensure GEMINI_API_KEY is enabled for the environment that matches this deploy (Production vs Preview vs Development). Redeploy after saving variables.",
              },
            }
          : {}),
      });
      console.warn("[api/coach] missing GEMINI_API_KEY", process.env.VERCEL_ENV ?? "(non-vercel)");
      return;
    }

    const raw = coerceJsonRecord(req.body) ?? {};
    const tzRaw =
      typeof raw.timeZone === "string" && raw.timeZone.trim() ? raw.timeZone.trim().slice(0, 120) : undefined;
    const body: CoachRequestBody = {
      mood: typeof raw.mood === "string" ? raw.mood : "",
      focus: typeof raw.focus === "string" ? raw.focus : "",
      preferredName:
        typeof raw.preferredName === "string" ? raw.preferredName : undefined,
      prior: Array.isArray(raw.prior)
        ? raw.prior.filter((p): p is string => typeof p === "string")
        : [],
      timeZone: tzRaw,
    };

    const result = await generateCoachEnvelope(body, {
      apiKey: geminiApiKey,
      apiBase: geminiApiBase,
      model: geminiModel,
      displayTimeZone: process.env.LUMINA_DISPLAY_TIME_ZONE?.trim(),
    });

    if (!result.ok) {
      jsonResponse(res, result.status ?? 502, {
        ok: false,
        error: result.error,
        latencyMs: result.latencyMs,
        modelTried: geminiModel,
        ...(result.raw ? { raw: result.raw } : {}),
      });
      return;
    }

    jsonResponse(res, 200, { ok: true, data: result.data, latencyMs: result.latencyMs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/coach]", e);
    jsonResponse(res, 500, { ok: false, error: msg || "Internal server error" });
  }
}
