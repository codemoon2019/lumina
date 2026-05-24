/** Tiny REST call against Gemini — for `/api/gemini-probe` diagnostics only (minimal tokens). */

const GEMINI_REST_DEFAULT_BASE = "https://generativelanguage.googleapis.com";

function normalizeModelId(model: string): string {
  return model.replace(/^models\//i, "").trim();
}

export type GeminiProbeResult =
  | { ok: true; latencyMs: number; upstreamStatus: number; snippet: string }
  | { ok: false; latencyMs: number; error: string; upstreamStatus?: number };

/** One trivial `generateContent` to verify key + model + quota. */
export async function probeGeminiApi(options: {
  apiKey: string;
  apiBase?: string;
  model: string;
}): Promise<GeminiProbeResult> {
  const start = Date.now();
  const base = (options.apiBase ?? GEMINI_REST_DEFAULT_BASE).replace(/\/$/, "");
  const modelId = normalizeModelId(options.model);
  const url = `${base}/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;

  let upstreamStatus: number | undefined;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with the single word: OK." }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 16 },
      }),
    });

    upstreamStatus = upstream.status;
    const text = await upstream.text().catch(() => "");
    const latencyMs = Date.now() - start;

    if (!upstream.ok) {
      return {
        ok: false,
        latencyMs,
        upstreamStatus,
        error: text.trim().slice(0, 500) || `HTTP ${upstream.status}`,
      };
    }

    const snippet =
      typeof text === "string" ? text.trim().replace(/\s+/g, " ").slice(0, 180) : "";
    return { ok: true, latencyMs, upstreamStatus: upstream.status, snippet };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      latencyMs: Date.now() - start,
      ...(upstreamStatus !== undefined ? { upstreamStatus } : {}),
      error: msg,
    };
  }
}

function parseBearer(authorizationHeader: string | undefined): string {
  const t =
    authorizationHeader !== undefined &&
    authorizationHeader !== null &&
    typeof authorizationHeader === "string"
      ? authorizationHeader.trim()
      : "";
  if (!t.startsWith("Bearer ")) return "";
  return t.slice(7).trim();
}

/**
 * Shared `GET /api/gemini-probe` semantics for Vercel + Vite dev middleware.
 */
export async function resolveGeminiProbeGet(input: {
  method: string;
  authorizationHeader: string | undefined;
  apiKey: string | undefined;
  geminiApiBase: string;
  geminiModel: string;
  debugToken: string | undefined;
}): Promise<{ statusCode: number; json: Record<string, unknown> }> {
  if (input.method !== "GET") {
    return { statusCode: 405, json: { ok: false, error: "Method Not Allowed" } };
  }

  const apiKeyResolved = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const keyConfigured = Boolean(apiKeyResolved);
  const debugTokenResolved =
    typeof input.debugToken === "string" ? input.debugToken.trim() : "";

  if (!debugTokenResolved) {
    return {
      statusCode: 200,
      json: {
        ok: true,
        liveProbeRan: false,
        configured: keyConfigured,
        model: input.geminiModel,
        hint: "Set GEMINI_DEBUG_TOKEN, redeploy, then GET with Authorization: Bearer <that token> to run a live Gemini ping (uses quota).",
      },
    };
  }

  if (parseBearer(input.authorizationHeader) !== debugTokenResolved) {
    return {
      statusCode: 403,
      json: {
        ok: false,
        error:
          "Send header: Authorization: Bearer <GEMINI_DEBUG_TOKEN> when GEMINI_DEBUG_TOKEN is set.",
      },
    };
  }

  if (!apiKeyResolved) {
    return {
      statusCode: 503,
      json: { ok: false, error: "No GEMINI_API_KEY (override or env) configured." },
    };
  }

  const result = await probeGeminiApi({
    apiKey: apiKeyResolved,
    apiBase: input.geminiApiBase,
    model: input.geminiModel,
  });

  if (result.ok) {
    return {
      statusCode: 200,
      json: {
        ok: true,
        liveProbeRan: true,
        configured: true,
        model: input.geminiModel,
        latencyMs: result.latencyMs,
        upstreamStatus: result.upstreamStatus,
        responseSnippet: result.snippet,
      },
    };
  }

  const statusCode =
    result.upstreamStatus !== undefined &&
    result.upstreamStatus >= 400 &&
    result.upstreamStatus < 600
      ? result.upstreamStatus
      : 502;

  return {
    statusCode,
    json: {
      ok: false,
      liveProbeRan: true,
      configured: true,
      model: input.geminiModel,
      latencyMs: result.latencyMs,
      ...(result.upstreamStatus !== undefined ? { upstreamStatus: result.upstreamStatus } : {}),
      error: result.error,
    },
  };
}
