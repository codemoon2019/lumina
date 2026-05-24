/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHER_LAT?: string;
  readonly VITE_WEATHER_LON?: string;
  readonly VITE_SPOTIFY_FOCUS_URL?: string;
  /** When set (e.g. https://lumina.vercel.app), coach POSTs here instead of same-origin `/api/coach`. Never put API secrets in env vars prefixed with `VITE_`. */
  readonly VITE_COACH_API_ORIGIN?: string;
  /** `'1'` or `'true'`: Lumina Voice uses neural TTS (`POST …/api/lumina-tts`) when healthy; falls back to Web Speech otherwise. Requires server-side ElevenLabs key. */
  readonly VITE_LUMINA_USE_ELEVENLABS?: string;
  /** IANA TZ forwarded on `POST /api/coach` (e.g. Asia/Manila) so Gemini daypart matches deployed audience. */
  readonly VITE_LUMINA_TIME_ZONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}