/**
 * ElevenLabs TTS (Node only). Keeps callers small for Vite middleware + preview sidecar.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const MAX_CHARS = 4_096;

export type LuminaSynthResult =
  | { ok: true; mp3: Buffer }
  | { ok: false; error: string; status?: number };

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const parts: Buffer[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value?.byteLength) parts.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts);
}

/**
 * Softer bedside-table delivery: steadier cadence, less stylistic flare, eased pace —
 * Lumina lands quiet and close rather than brightly “broadcast.”
 */
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.64,
  similarityBoost: 0.72,
  style: 0.26,
  speed: 0.84,
};

export async function synthesizeMp3ViaElevenLabs(
  apiKey: string,
  voiceId: string,
  text: string,
  modelId: string | undefined,
): Promise<LuminaSynthResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Empty text", status: 400 };
  if (trimmed.length > MAX_CHARS)
    return { ok: false, error: `Text exceeds ${MAX_CHARS} characters`, status: 413 };

  try {
    const client = new ElevenLabsClient({ apiKey });
    const stream = await client.textToSpeech.convert(voiceId, {
      text: trimmed,
      modelId: modelId?.trim() || "eleven_turbo_v2_5",
      outputFormat: "mp3_44100_128",
      voiceSettings: DEFAULT_VOICE_SETTINGS,
    });

    const mp3 = await streamToBuffer(stream);
    if (!mp3.length) return { ok: false, error: "Empty audio response", status: 502 };
    return { ok: true, mp3 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, status: 502 };
  }
}
