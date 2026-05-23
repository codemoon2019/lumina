/**
 * POST /api/lumina-tts — synthesize MP3 server-side so the ElevenLabs key never ships to browsers.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

import { synthesizeMp3ViaElevenLabs } from "./elevenLabsSynthesize";

async function readBodyRaw(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of req) {
    chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  }
  return Buffer.concat(chunks);
}

function sendJson(resp: ServerResponse, status: number, body: Record<string, unknown>) {
  resp.statusCode = status;
  resp.setHeader("Content-Type", "application/json");
  resp.end(JSON.stringify(body));
}

export async function respondLuminaTtsPost(
  req: IncomingMessage,
  resp: ServerResponse,
  cfg: {
    elevenLabsApiKey: string | undefined;
    elevenLabsVoiceId: string | undefined;
    elevenLabsModelId: string | undefined;
  },
): Promise<void> {
  if (!cfg.elevenLabsApiKey) {
    sendJson(resp, 503, {
      ok: false,
      error:
        "Missing ELEVENLABS_API_KEY in .env.local — never commit. Restart the dev server or coach-api after editing.",
    });
    return;
  }
  if (!cfg.elevenLabsVoiceId) {
    sendJson(resp, 503, {
      ok: false,
      error:
        "Missing ELEVENLABS_VOICE_ID (pick a voice in the ElevenLabs dashboard). See .env.example.",
    });
    return;
  }

  const raw = await readBodyRaw(req);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString("utf8").trim() || "{}");
  } catch {
    sendJson(resp, 400, { ok: false, error: "Invalid JSON body" });
    return;
  }

  const textUnknown = parsed as Record<string, unknown>;
  const text = typeof textUnknown.text === "string" ? textUnknown.text : "";
  const result = await synthesizeMp3ViaElevenLabs(
    cfg.elevenLabsApiKey,
    cfg.elevenLabsVoiceId.trim(),
    text,
    cfg.elevenLabsModelId,
  );

  if (!result.ok) {
    sendJson(resp, result.status ?? 502, {
      ok: false,
      error: result.error,
    });
    return;
  }

  resp.statusCode = 200;
  resp.setHeader("Content-Type", "audio/mpeg");
  resp.setHeader("Cache-Control", "no-store");
  resp.end(result.mp3);
}
