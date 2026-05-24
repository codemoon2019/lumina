import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv } from "vite";

import { DEFAULT_GEMINI_MODEL, GEMINI_REST_DEFAULT_BASE, generateCoachEnvelope } from "./coach/geminiCoach";
import { resolveGeminiProbeGet } from "./coach/geminiProbe";
import { respondLuminaTtsPost } from "./coach/luminaTtsPostHandler";
import type { CoachRequestBody } from "./coach/types";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}

function send(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Dev middleware: keeps `GEMINI_*` / `ELEVENLABS_*` in Node — never bundled. */
function luminaApiMiddleware(params: {
  geminiApiKey: string | undefined;
  geminiApiBase: string;
  geminiModel: string;
  elevenLabsApiKey: string | undefined;
  elevenLabsVoiceId: string | undefined;
  elevenLabsModelId: string | undefined;
  geminiDebugToken: string | undefined;
}): import("vite").Plugin["configureServer"] {
  return function configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = (req.url?.split("?")[0] ?? "/").replace(/\/$/, "") || "/";

      if (pathname === "/api/gemini-probe" && req.method === "GET") {
        try {
          const auth =
            typeof req.headers.authorization === "string" ? req.headers.authorization : undefined;
          const { statusCode, json } = await resolveGeminiProbeGet({
            method: "GET",
            authorizationHeader: auth,
            apiKey: params.geminiApiKey?.trim(),
            geminiApiBase: params.geminiApiBase,
            geminiModel: params.geminiModel,
            debugToken: params.geminiDebugToken?.trim(),
          });
          send(res, statusCode, json as Record<string, unknown>);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          send(res, 500, { ok: false, error: msg });
        }
        return;
      }

      if (pathname === "/api/lumina-tts" && req.method === "POST") {
        try {
          await respondLuminaTtsPost(req, res, {
            elevenLabsApiKey: params.elevenLabsApiKey?.trim(),
            elevenLabsVoiceId: params.elevenLabsVoiceId?.trim(),
            elevenLabsModelId: params.elevenLabsModelId?.trim(),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          send(res, 500, { ok: false, error: msg });
        }
        return;
      }

      if (pathname !== "/api/coach" || req.method !== "POST") return next();

      try {
        if (!params.geminiApiKey) {
          send(res, 503, {
            ok: false,
            error:
              "Missing GEMINI_API_KEY. Get a key from Google AI Studio and add GEMINI_API_KEY to .env.local — never commit keys. Restart `npm run dev`.",
          });
          return;
        }

        const bodyUnknown = await parseJsonBody(req);
        const body = bodyUnknown as CoachRequestBody;

        const result = await generateCoachEnvelope(body, {
          apiKey: params.geminiApiKey,
          apiBase: params.geminiApiBase,
          model: params.geminiModel,
        });

        if (!result.ok) {
          send(res, result.status ?? 502, {
            ok: false,
            error: result.error,
            latencyMs: result.latencyMs,
            ...(result.raw ? { raw: result.raw } : {}),
          });
          return;
        }

        send(res, 200, { ok: true, data: result.data, latencyMs: result.latencyMs });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        send(res, 500, { ok: false, error: msg });
      }
    });
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["GEMINI_", "COACH_", "VITE_", "ELEVENLABS_"]);
  const geminiApiKey = env.GEMINI_API_KEY;
  const rawBase = env.GEMINI_API_BASE?.trim();
  const geminiApiBase = rawBase ? rawBase.replace(/\/$/, "") : GEMINI_REST_DEFAULT_BASE;
  const geminiModel = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const elevenLabsApiKey = env.ELEVENLABS_API_KEY;
  const elevenLabsVoiceId = env.ELEVENLABS_VOICE_ID;
  const elevenLabsModelId = env.ELEVENLABS_MODEL?.trim();
  const geminiDebugToken = env.GEMINI_DEBUG_TOKEN?.trim();

  return {
    /** Stable port + fail if busy — avoids a second mystery Vite on :5174 and 504 “Outdated Request” tabs. */
    server: {
      port: 5173,
      strictPort: true,
    },
    plugins: [
      react(),
      {
        name: "lumina-coach-proxy",
        configureServer: luminaApiMiddleware({
          geminiApiKey,
          geminiApiBase,
          geminiModel,
          elevenLabsApiKey,
          elevenLabsVoiceId,
          elevenLabsModelId,
          geminiDebugToken,
        }),
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(ROOT_DIR, "src"),
      },
    },
    preview: {
      host: true,
      port: 4173,
      proxy: {
        "/api/coach": {
          target: `http://127.0.0.1:${env.COACH_API_PORT ?? "8788"}`,
          changeOrigin: true,
        },
        "/api/gemini-probe": {
          target: `http://127.0.0.1:${env.COACH_API_PORT ?? "8788"}`,
          changeOrigin: true,
        },
        "/api/lumina-tts": {
          target: `http://127.0.0.1:${env.COACH_API_PORT ?? "8788"}`,
          changeOrigin: true,
        },
      },
    },
  };
});
