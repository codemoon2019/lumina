/**
 * Vercel serverless: neural Lumina Voice (`POST /api/lumina-tts`).
 * Set `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (optional `ELEVENLABS_MODEL`) in Vercel — server-only.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { synthesizeMp3ViaElevenLabs } from "../coach/elevenLabsSynthesize";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  const elevenLabsModelId = process.env.ELEVENLABS_MODEL?.trim();

  if (!elevenLabsApiKey) {
    res.status(503).json({
      ok: false,
      error:
        "Missing ELEVENLABS_API_KEY on the server. Add it in Vercel → Environment Variables (Production / Preview) and redeploy.",
    });
    return;
  }
  if (!elevenLabsVoiceId) {
    res.status(503).json({
      ok: false,
      error: "Missing ELEVENLABS_VOICE_ID on Vercel (your ElevenLabs voice id).",
    });
    return;
  }

  const parsed =
    typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : null;
  if (!parsed) {
    res.status(400).json({ ok: false, error: "Invalid JSON body" });
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
    res.status(result.status ?? 502).json({ ok: false, error: result.error });
    return;
  }

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(result.mp3);
}
