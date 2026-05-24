# Lumina

Daily motivation dashboard built with React, Vite, TailwindCSS, Framer Motion, **[Google Gemini](https://ai.google.dev/gemini-api/docs)** (`generateContent` REST), and optional **[ElevenLabs](https://elevenlabs.io/)** Lumina Voice. API keys stay in Node — **never bundled** in client JS.

## Quick start

```bash
cd lumina-coach
npm install
cp .env.example .env.local
```

1. Get an **[API key in Google AI Studio](https://aistudio.google.com/)**.
2. In **`.env.local`** (never commit):

```
GEMINI_API_KEY=YOUR_KEY_HERE
GEMINI_MODEL=gemini-3.1-flash-lite

# Optional — Lumina neural voice (see Env reference; keys never prefixed VITE_)
# ELEVENLABS_API_KEY=
# ELEVENLABS_VOICE_ID=
# VITE_LUMINA_USE_ELEVENLABS=1
```

The repo defaults to **Gemini Flash‑Lite** (`gemini-3.1-flash-lite`) for lighter payloads and typically better free‑tier room than full Flash. If your API key rejects that model, set `GEMINI_MODEL` to something your project allows ([model list](https://ai.google.dev/gemini-api/docs/models)—e.g. `gemini-2.0-flash-lite` may still appear for some accounts, at your own risk of deprecation notices).

Optional host override:

```
GEMINI_API_BASE=https://generativelanguage.googleapis.com
```

3. Restart the dev server after env changes:

```bash
npm run dev
```

Open http://localhost:5173 — the SPA calls **`POST /api/coach`** and (when **`VITE_LUMINA_USE_ELEVENLABS=1`** and **`ELEVENLABS_*`** are set) **`POST /api/lumina-tts`**, answered by **Vite dev middleware** (Gemini + ElevenLabs key never reach the bundle).

### First visit

The app asks for your **preferred name**, then briefly explains Lumina’s purpose (warm check-ins—not therapy). It’s saved only under **`lumina.intro.v1`** in `localStorage`. To redo the handshake, delete that key in devtools → Application → Local Storage → refresh.

**Lumina reads copy aloud** automatically (ElevenLabs when **`VITE_LUMINA_USE_ELEVENLABS=1`** and keys are set, otherwise browser speech). Strict mobile browsers may need **a tap or typing** early in onboarding so **`lumina.speech.sessionUnlocked.v1`** can unlock audio. Speaking is skipped when **Reduce Motion** is on.

When **`VITE_LUMINA_USE_ELEVENLABS=1`** (see `.env.example`) and **`ELEVENLABS_API_KEY`** + **`ELEVENLABS_VOICE_ID`** are set, Lumina uses **[ElevenLabs](https://elevenlabs.io/)** via **`POST /api/lumina-tts`** (keys stay server-side only). Dev is handled by **Vite middleware**; **`vite preview`** proxies **`/api/lumina-tts`** together with **`/api/coach`** to **`npm run coach-api`**. Split deploys: set **`VITE_COACH_API_ORIGIN`** so the SPA can reach your relay.

Otherwise (or if the relay fails), Lumina falls back to the browser **Web Speech API**—youth‑leaning voice selection and softer prosody where the OS exposes good voices.

### Troubleshooting (“no greeting”, empty hero)

1. **`npm run dev`** only — plain static `dist/` has no **`/api/coach`** or **`/api/lumina-tts`**.
2. **Restart dev** whenever `.env.local` changes (middleware reads env at startup).
3. **No quotes** around the API key unless you deliberately include them in the value.
4. **`vite preview`**: run **`npm run coach-api`** in a second terminal; preview proxies **`/api/coach`** and **`/api/lumina-tts`** → `127.0.0.1:8788`.

## Preview + sidecar (`vite preview`)

```bash
npm run coach-api   # Terminal 1 — loads GEMINI_* and ELEVENLABS_* from .env.local
npm run build && npm run preview   # Terminal 2
```

Set **`COACH_API_PORT`** if `8788` is taken (`vite.config.ts` preview proxy must match).

## Env reference

### Browser (`VITE_*` — safe for CDN; never put `GEMINI_API_KEY`)

| Variable | Purpose |
|----------|---------|
| `VITE_COACH_API_ORIGIN` | Hosted backend origin (no trailing slash) if SPA and **`/api/coach`**/**`/api/lumina-tts`** differ |
| `VITE_LUMINA_USE_ELEVENLABS` | `'1'` or `'true'` — use neural **`POST /api/lumina-tts`**; otherwise Web Speech only |

### Server / dev middleware / `coach-api`

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | **[Required](https://ai.google.dev/gemini-api/docs)** — AI Studio API key (`AIza…`) |
| `GEMINI_API_BASE` | Default `https://generativelanguage.googleapis.com` |
| `GEMINI_MODEL` | Default **`gemini-3.1-flash-lite`** (Flash‑Lite) |
| `COACH_API_PORT` | Sidecar (`coach-api`), default **8788** |
| `ELEVENLABS_API_KEY` | ElevenLabs — **never** use a `VITE_*` prefix; required for **`/api/lumina-tts`** |
| `ELEVENLABS_VOICE_ID` | Voice preset from ElevenLabs dashboard (`POST /text-to-speech`) |
| `ELEVENLABS_MODEL` | Optional (default **`eleven_turbo_v2_5`** in code) |

**Never expose `GEMINI_*` or `ELEVENLABS_*` secrets in variables prefixed `VITE_`.**

## Vercel

This repo ships **`api/coach.ts`** and **`api/lumina-tts.ts`** — Vercel runs them as serverless **`POST /api/coach`** and **`POST /api/lumina-tts`**. The Vite middleware in `vite.config.ts` only runs during **`npm run dev`**; server secrets must live in the Vercel dashboard (Production / Preview).

1. Import the repo; Vercel detects **Vite** and runs **`npm run build`** → **`dist`**.
2. Confirm the deploy picked up **`api/`**: open **Deployments → [latest] → Functions**. You should see **`api/coach`** and **`api/lumina-tts`**. If not, redeploy after pulling the repo that contains `api/` (wrong **Root Directory** in monorepos also hides them).
3. **`vercel.json`** SPA rewrite ignores paths under **`/api/*`** (`/((?!api/).*)`) so **`POST /api/coach`** reaches Functions instead of returning **`index.html`**.
4. **Environment variables** (Project → Settings → Environment Variables). Enable **Production** and **Preview** as appropriate:

| Variable | Applies to |
|----------|------------|
| **`GEMINI_API_KEY`** | Server (`api/coach.ts`) |
| **`GEMINI_MODEL`**, **`GEMINI_API_BASE`** | Server (optional) |
| **`ELEVENLABS_API_KEY`**, **`ELEVENLABS_VOICE_ID`**, **`ELEVENLABS_MODEL`** | Server (`api/lumina-tts.ts`) |
| **`VITE_*`** (`VITE_LUMINA_USE_ELEVENLABS`, weather, etc.) | **Build** — Vite inlines at compile time |

**Keeping `.env.local` aligned with Vercel:** Copy names and values **as-is** from [`.env.example`](./.env.example) — the dashboard uses **identical** keys (e.g. `GEMINI_API_KEY`, not something else Google shows in their UI). **Do not hardcode secrets** in the repo or in `vite.config`; `GEMINI_*` / `ELEVENLABS_*` must stay in `.env.local` locally and Vercel server env remotely. Optionally run **`vercel link`** then **`vercel env pull .env.local`** so your machine mirrors what is configured in Vercel (combine with `--environment=preview|production|development` as needed).

5. **`VITE_*`** changes → **trigger a redeploy.** Server vars (`GEMINI_*`, `ELEVENLABS_*`) → redeploy too after edits.
6. Keep **`VITE_COACH_API_ORIGIN` unset** if API lives on the **same** deployment (usual case).

**Tips:** Use **`VITE_LUMINA_USE_ELEVENLABS` = `1`** (or `true`) with **no stray quotes.** If Gemini errors mention the model name, temporarily **remove `GEMINI_MODEL`** in Vercel and redeploy so the repo default is used.

Debugging: Browser **Network → POST …/api/coach**. If response is HTML, routing is wrong. If JSON with **`error`**, read the message (upstream model, quota, missing key).

If Vercel shows **`FUNCTION_INVOCATION_FAILED`**, open **Deployments → [that deploy] → Logs** (Functions) right after reproducing. Handlers return **`500` JSON** with **`error`** plus **`console.error`** tags **`[api/coach]`** / **`[api/lumina-tts]`**. **`vercel.json`** sets **`includeFiles`** so the **`coach/`** folder is bundled with each serverless function. Lumina Voice uses a **minimal REST client** (`fetch`) instead of the official ElevenLabs SDK so the Lambda bundle stays small enough to reliably load.

## Production (split SPA + API elsewhere)

Deploy **`POST /api/coach`** (same `{ mood?, focus?, prior?[] }` body). Re-implement Gemini by importing [`coach/geminiCoach.ts`](./coach/geminiCoach.ts) (`generateCoachEnvelope`) — same logic as **`api/coach.ts`**.

Also deploy **`POST /api/lumina-tts`** with JSON **`{ text: string }`**, **`Content-Type: audio/mpeg`**, using **`coach/elevenLabsSynthesize.ts`** (pattern in **`api/lumina-tts.ts`**) — the ElevenLabs key stays server-side.

When the SPA is on another host, set **`VITE_COACH_API_ORIGIN`** at **build time** to that backend’s origin (no trailing slash).

## Structure

```
api/             Vercel serverless handlers (coach + Lumina Voice)
coach/           Gemini (`geminiCoach`) + ElevenLabs TTS (`elevenLabsSynthesize`, `luminaTtsPostHandler`)
server/          `npm run coach-api`
src/
├── components/
├── sections/
├── hooks/
├── services/
├── utils/
└── assets/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + **`/api/coach`** / **`/api/lumina-tts`** middleware (`GEMINI_*`, `ELEVENLABS_*`) |
| `npm run coach-api` | Sidecar for `vite preview` |
| `npm run check-env` | Validate `.env.example` vs canonical keys + no server env / key-shaped literals in `src/` |
| `npm run build` | Runs **`check-env`** then TypeScript + Vite production build |
| `npm run preview` | Preview static app (run **`coach-api`**) |

## Optional widgets

```
VITE_WEATHER_LAT=
VITE_WEATHER_LON=
```

Weather uses Open-Meteo (no API key).

## Tone & safeguards

Copy is affirmative/grounding—not clinical advice. Recommend professional care when appropriate.
