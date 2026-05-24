/**
 * ElevenLabs TTS via their REST API (Node `fetch` + binary body).
 * We avoid `@elevenlabs/elevenlabs-js` because its huge transitive tree can balloon or break the
 * Vercel `@vercel/node` bundle and surface only as **`FUNCTION_INVOCATION_FAILED`**.
 */

const MAX_CHARS = 4_096;
const REST_BASE_V1 = "https://api.elevenlabs.io/v1";

export type LuminaSynthResult =
  | { ok: true; mp3: Buffer }
  | { ok: false; error: string; status?: number };

/**
 * Softer bedside-table delivery — same targets as earlier SDK-backed calls.
 */
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.64,
  similarity_boost: 0.72,
  style: 0.26,
  speed: 0.84,
} as const;

const FETCH_TIMEOUT_MS = 55_000;

function summarizeElevenLabsError(status: number, statusText: string, bodyText: string): string {
  const head = `${status} ${statusText}`.trim();
  const raw = bodyText.trim();
  if (!raw) return head;
  try {
    const data = JSON.parse(raw) as { detail?: unknown; message?: unknown };
    const detail = typeof data?.detail === "string" ? data.detail.trim() : "";
    const message = typeof data?.message === "string" ? data.message.trim() : "";
    const msg = detail || message;
    if (msg) return `${head}: ${msg}`;
    if (/^[\[{]/.test(raw) && raw.length < 900) return `${head}: ${raw}`;
  } catch {
    if (raw.length < 720) return `${head}: ${raw}`;
  }
  return head;
}

export async function synthesizeMp3ViaElevenLabs(
  apiKey: string,
  voiceId: string,
  text: string,
  modelId: string | undefined,
): Promise<LuminaSynthResult> {
  const trimmed = text.trim();
  const vid = voiceId.trim();
  if (!trimmed) return { ok: false, error: "Empty text", status: 400 };
  if (!vid) return { ok: false, error: "Empty voice id", status: 400 };
  if (trimmed.length > MAX_CHARS)
    return { ok: false, error: `Text exceeds ${MAX_CHARS} characters`, status: 413 };

  let signal: AbortSignal | undefined;
  try {
    signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  } catch {
    /* Node <17.3 / exotic runtimes — run without AbortSignal.timeout */
    signal = undefined;
  }

  const url = new URL(`${REST_BASE_V1}/text-to-speech/${encodeURIComponent(vid)}`);
  url.searchParams.set("output_format", "mp3_44100_128");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: modelId?.trim() || "eleven_turbo_v2_5",
        voice_settings: DEFAULT_VOICE_SETTINGS,
      }),
      signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: msg.includes("aborted") || msg.includes("timeout") ? `ElevenLabs request timed out after ${FETCH_TIMEOUT_MS}ms` : msg,
      status: 504,
    };
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    return {
      ok: false,
      error: summarizeElevenLabsError(res.status, res.statusText, errBody),
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
    };
  }

  const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ctype.includes("audio") && !ctype.includes("octet-stream")) {
    const errBody = await res.text().catch(() => "");
    return {
      ok: false,
      error: `ElevenLabs returned non-audio (${ctype || "no Content-Type"}): ${errBody.trim().slice(0, 400)}`,
      status: 502,
    };
  }

  try {
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return { ok: false, error: "Empty audio response", status: 502 };
    return { ok: true, mp3: buf };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || "Unable to read audio body", status: 502 };
  }
}
