/**
 * Vercel serverless: neural Lumina Voice (`POST /api/lumina-tts`).
 * Set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (optional `ELEVENLABS_MODEL`) in Vercel — server-only.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { coerceJsonRecord } from "./_coerceBody.js";
import { overrideElevenLabsApiKey, overrideElevenLabsVoiceId } from "./_ephemeralCredOverride.js";
import { jsonResponse, sendAudioMpeg } from "./_respond.js";
import { synthesizeMp3ViaElevenLabs } from "../coach/elevenLabsSynthesize.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      jsonResponse(res, 405, { ok: false, error: "Method Not Allowed" });
      return;
    }

    const elevenLabsApiKey =
      overrideElevenLabsApiKey() || process.env.ELEVENLABS_API_KEY?.trim();
    const elevenLabsVoiceId =
      overrideElevenLabsVoiceId() || process.env.ELEVENLABS_VOICE_ID?.trim();
    const elevenLabsModelId = process.env.ELEVENLABS_MODEL?.trim();

    if (!elevenLabsApiKey) {
      jsonResponse(res, 503, {
        ok: false,
        error:
          "Missing ELEVENLABS_API_KEY on the server. Add it in Vercel → Environment Variables (Production / Preview) and redeploy.",
      });
      return;
    }
    if (!elevenLabsVoiceId) {
      jsonResponse(res, 503, {
        ok: false,
        error: "Missing ELEVENLABS_VOICE_ID on Vercel (your ElevenLabs voice id).",
      });
      return;
    }

    const parsed = coerceJsonRecord(req.body);
    if (!parsed) {
      jsonResponse(res, 400, { ok: false, error: "Invalid JSON body" });
      return;
    }
    const text = typeof parsed.text === "string" ? parsed.text : "";

    const result = await synthesizeMp3ViaElevenLabs(
      elevenLabsApiKey,
      elevenLabsVoiceId,
      text,
      elevenLabsModelId,
    );

    if (!result.ok) {
      jsonResponse(res, result.status ?? 502, { ok: false, error: result.error });
      return;
    }

    sendAudioMpeg(res, result.mp3);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/lumina-tts]", e);
    jsonResponse(res, 500, { ok: false, error: msg || "Internal server error" });
  }
}
