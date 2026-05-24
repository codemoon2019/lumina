/**
 * **Temporary Vercel env sanity check ONLY**
 *
 * Leave every override **empty** in git (`""`).
 * When you suspect `GEMINI_*` / `ELEVENLABS_*` are not bound at runtime, briefly paste keys
 * here, redeploy, test, then clear this file, redeploy again, **and rotate keys** — anything pasted
 * in source has higher leak risk even on private repos.
 */

export function overrideGeminiApiKey(): string {
  /** Paste key between quotes only while debugging; revert to '' before merging. */
  return "AIzaSyBk1T7CvrNTWqVYv8uHeinV-jkrZ3K1PHQ".trim();
}

export function overrideElevenLabsApiKey(): string {
  return "sk_9c869eb18ca7157e03245654a9af3a999149b0aee736346b".trim();
}

export function overrideElevenLabsVoiceId(): string {
  return "hpp4J3VqNfWAUOO0d1Us".trim();
}
