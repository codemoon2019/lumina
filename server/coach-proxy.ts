/**
 * Sidecar for `vite preview`: relays `/api/coach` (Gemini) and `/api/lumina-tts` (ElevenLabs) from Node.
 */

import { createServer } from "node:http";

import dotenv from "dotenv";

import { generateCoachEnvelope, DEFAULT_GEMINI_MODEL, GEMINI_REST_DEFAULT_BASE } from "../coach/geminiCoach";
import { resolveGeminiProbeGet } from "../coach/geminiProbe";
import type { CoachRequestBody } from "../coach/types";
import { respondLuminaTtsPost } from "../coach/luminaTtsPostHandler";

/** `.env.local` overrides `.env` — same precedence idea as Vite `loadEnv` */
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const PORT = Number(process.env.COACH_API_PORT) || 8788;

const geminiApiKey = process.env.GEMINI_API_KEY;
const rawBase = process.env.GEMINI_API_BASE?.trim();
const geminiApiBase = rawBase ? rawBase.replace(/\/$/, "") : GEMINI_REST_DEFAULT_BASE;
const geminiModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY?.trim();
const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
const elevenLabsModelId = process.env.ELEVENLABS_MODEL?.trim();

async function parseCoachJsonBody(raw: Buffer): Promise<unknown> {
  const s = raw.toString("utf8").trim();
  if (!s) return {};
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return {};
  }
}

function sendJson(resp: import("node:http").ServerResponse, status: number, body: Record<string, unknown>) {
  resp.statusCode = status;
  resp.setHeader("Content-Type", "application/json");
  resp.end(JSON.stringify(body));
}

createServer(async (req, resp) => {
  const pathname = (req.url?.split("?")[0] ?? "/").replace(/\/$/, "") || "/";

  if (pathname === "/api/gemini-probe" && req.method === "GET") {
    const authHeader =
      typeof req.headers.authorization === "string" ? req.headers.authorization : undefined;
    const { statusCode, json } = await resolveGeminiProbeGet({
      method: "GET",
      authorizationHeader: authHeader,
      apiKey: geminiApiKey?.trim(),
      geminiApiBase,
      geminiModel,
      debugToken: process.env.GEMINI_DEBUG_TOKEN?.trim(),
    });
    sendJson(resp, statusCode, json);
    return;
  }

  if (pathname === "/api/lumina-tts") {
    if (req.method !== "POST") {
      resp.statusCode = 405;
      resp.end();
      return;
    }
    await respondLuminaTtsPost(req, resp, {
      elevenLabsApiKey,
      elevenLabsVoiceId,
      elevenLabsModelId,
    });
    return;
  }

  if (!req.url?.startsWith("/api/coach") || req.method !== "POST") {
    resp.statusCode = 404;
    resp.end();
    return;
  }

  if (!geminiApiKey) {
    sendJson(resp, 503, {
      ok: false,
      error:
        "Missing GEMINI_API_KEY in .env.local (never commit). Restart `npm run coach-api` after editing.",
    });
    return;
  }

  const chunks: Buffer[] = [];
  for await (const c of req) {
    chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  }
  const parsed = await parseCoachJsonBody(Buffer.concat(chunks));

  try {
    const o = parsed as Record<string, unknown>;
    const body: CoachRequestBody = {
      mood: typeof o.mood === "string" ? o.mood : "",
      focus: typeof o.focus === "string" ? o.focus : "",
      preferredName: typeof o.preferredName === "string" ? o.preferredName : undefined,
      prior: Array.isArray(o.prior)
        ? o.prior.filter((p): p is string => typeof p === "string")
        : [],
      timeZone:
        typeof o.timeZone === "string" && o.timeZone.trim()
          ? o.timeZone.trim().slice(0, 120)
          : undefined,
    };

    const result = await generateCoachEnvelope(body, {
      apiKey: geminiApiKey,
      apiBase: geminiApiBase,
      model: geminiModel,
      displayTimeZone: process.env.LUMINA_DISPLAY_TIME_ZONE?.trim(),
    });

    if (!result.ok) {
      sendJson(resp, result.status ?? 502, {
        ok: false,
        error: result.error,
        latencyMs: result.latencyMs,
        modelTried: geminiModel,
        ...(result.raw ? { raw: result.raw } : {}),
      });
      return;
    }

    sendJson(resp, 200, { ok: true, data: result.data, latencyMs: result.latencyMs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    sendJson(resp, 500, { ok: false, error: msg });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.info(
    `[lumina-coach-api] http://127.0.0.1:${PORT} — POST /api/coach, POST /api/lumina-tts, GET /api/gemini-probe`,
  );
});
