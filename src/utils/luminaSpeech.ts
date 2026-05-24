/**
 * Lumina voice: **ElevenLabs** neural TTS when enabled (`POST /api/lumina-tts`, key stays on the
 * server), else **Web Speech** with youthful prosody tweaks. Gesture unlock (`unlockLuminaSpeechSession`)
 * still helps mobile browsers with `<audio>` playback.
 */

const SESSION_SPEECH_UNLOCK = "lumina.speech.sessionUnlocked.v1";

/**
 * Gentle, softly spoken Lumina — slightly slow, close-to-neutral pitch, quiet volume so it feels
 * hushed beside you rather than “presented.” Expressive tweaks below stay subtle.
 */
const LUMINA_BASE_PROSODY = {
  rate: 0.84,
  pitch: 0.98,
  volume: 0.8,
} as const;

/** Tiny pause between phrases (ms) — a little more breath between thoughts */
const PAUSE_BETWEEN_PHRASES_MS = 210;
const PAUSE_BETWEEN_PARAGRAPHS_MS = 290;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Tint rate/pitch/volume by punctuation + phrase shape so phrases don’t flatline together.
 */
function expressiveProsodyForPhrase(phrase: string, index: number): {
  rate: number;
  pitch: number;
  volume: number;
  pauseBoostMs: number;
} {
  let rate = LUMINA_BASE_PROSODY.rate;
  let pitch = LUMINA_BASE_PROSODY.pitch;
  let volume = LUMINA_BASE_PROSODY.volume;
  let pauseBoost = 0;

  const trimmed = phrase.trim();
  const last = trimmed.slice(-1);

  /** Subtle contour phrase-to-phrase — warm, not bouncy */
  pitch += Math.sin(index * 0.85) * 0.016;
  rate += Math.cos(index * 0.6) * 0.01;

  if (last === "?") {
    rate *= 0.92;
    pitch += 0.045;
    pauseBoost += 135;
  } else if (last === "!") {
    rate *= 0.93;
    pitch += 0.028;
    pauseBoost += 65;
    volume *= 0.98;
  } else if (/…$|\.\.\.$/.test(trimmed)) {
    rate *= 0.86;
    pitch -= 0.025;
    volume *= 0.9;
    pauseBoost += 165;
  } else if (last === "." && trimmed.length < 72) {
    /** Short affirmation lines: tiny lift without sounding chipper */
    pitch += 0.012;
    pauseBoost += 22;
  }

  const calming = /\b(you'?re\s+okay|it's\s+okay|take\s+(?:your\s+)?time|take\s+(?:a\s+)?breath|here\s+(?:with|for)\s+you|gentle\s+with\s+yourself|breathe|you'?re\s+not\s+alone|small\s+(?:steps?|moment)|this\s+is\s+hard|you\s+matter|you'?re\s+safe|peaceful|ease\s+(?:your|yourself))\b/i;
  if (calming.test(trimmed)) {
    rate *= 0.87;
    pitch += 0.022;
    volume *= 0.82;
    pauseBoost += 65;
  }

  const tenderness =
    /\b(i\s+(?:really\s+)?care|i'?m\s+here|loves?\s+you|thinking\s+of\s+you|sweetheart|sweet\s+heart|soft\s+spot|you\s+(?:were|were\s+already)\s+enough)\b/i;
  if (tenderness.test(trimmed)) {
    rate *= 0.86;
    pitch += 0.028;
    volume *= 0.8;
    pauseBoost += 58;
  }

  const uplift = /\b(be\s+proud|well\s+done|you'?ve\s+got\s+this|you\s+can\s+do\s+(?:this|it)|that\s+takes\s+courage|beautiful|glad\s+you|worth(y|while)|(?:you'?re\s+)?enough|brave\s+today|stronger\s+than)\b/i;
  if (uplift.test(trimmed)) {
    pitch += 0.022;
    rate *= 0.9;
    pauseBoost += 45;
    volume *= 0.98;
  }

  const sparkle = /\b(yay|hooray|wow|so\s+good|so\s+happy|love\s+that|nice\s+work|you\s+did\s+it|keep\s+going|we'?ve\s+got\s+this)\b/i;
  if (sparkle.test(trimmed)) {
    pitch += 0.03;
    rate *= 0.94;
    pauseBoost += 35;
    volume *= 0.94;
  }

  return {
    rate: clamp(rate, 0.66, 0.93),
    pitch: clamp(pitch, 0.84, 1.08),
    volume: clamp(volume, 0.68, 0.9),
    pauseBoostMs: pauseBoost,
  };
}

const FEMALE_TAGS = [
  "female",
  "woman",
  "girl",
  "samantha",
  "victoria",
  "karen",
  "susan",
  "aria",
  "nova",
  "fiona",
  "tessa",
  "emma",
  "sophie",
  "alice",
  "kate",
  "hazel",
  "zira",
  "siri female",
];

const MALE_TAGS = [" male", "male ", "man ", " man", "david", "daniel", "oliver", "fred", "james"];

/** Higher-quality labels (still OS-dependent) */
const NATURAL_TAGS = [
  "neural",
  "premium",
  "enhanced",
  "natural",
  "wavenet",
  "studio",
  "generative",
  "expressive",
  "sonic",
  "speech studio",
];

const SOFT_VENDOR_HINTS = ["siri ", "apple", " google ", "google us", "google uk"];

const ROBOT_HINTS = ["compact", "zarvox", "robot", "synthesizer", "novelty"];

/** OSes vary; these substrings often mark child/youth-oriented voices where they exist */
const LITTLE_CHILD_VOICE_TAGS = [
  "little girl",
  "young girl",
  "girl voice",
  "child voice",
  "kids voice",
  "kid voice",
  "junior ",
  " junior",
  "child ",
  " children",
  "children ",
  "youth ",
  " young voice",
];

/**
 * Softer boosts for youthful *sounding* names (fallback when no explicit child preset).
 */
const YOUTHFUL_FEMALE_NAME_HINTS = [
  " ivy",
  " zoe ",
  " zoe-",
  " lily",
  " mia ",
  "-mia",
  " sophie",
  " emma",
  " tessa",
  " elizabeth",
];

const MATURITY_PENALTY_TAGS = [" grandpa ", "grandfather", "baritone", "deep voice", " albert"];

function langRank(lang: string): number {
  const l = lang.toLowerCase();
  if (l.startsWith("en-us")) return 42;
  if (l.startsWith("en-au")) return 36;
  if (l.startsWith("en-ca")) return 36;
  if (l.startsWith("en-gb")) return 34;
  if (l.startsWith("en")) return 30;
  return 0;
}

function hasAnyTag(haystack: string, tags: readonly string[]): boolean {
  const h = haystack.toLowerCase();
  return tags.some((tag) => h.includes(tag.toLowerCase()));
}

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = ` ${v.name} ${v.lang} `;
  let s = langRank(v.lang);

  /** Prefer explicit child‑leaning presets first—they’re uncommon but noticeably right when present */
  if (hasAnyTag(name, LITTLE_CHILD_VOICE_TAGS)) s += 78;
  if (hasAnyTag(name, FEMALE_TAGS)) s += 30;
  if (hasAnyTag(name, MALE_TAGS)) s -= 48;

  /** Youthful‑sounding females when we can’t pick a labelled child voice */
  if (!hasAnyTag(name, MALE_TAGS) && hasAnyTag(name, YOUTHFUL_FEMALE_NAME_HINTS)) {
    s += 22;
  }

  /** Strong preference for labelled “premium / neural” stock voices when the OS exposes them */
  if (hasAnyTag(name, NATURAL_TAGS)) s += 38;
  if (hasAnyTag(name, SOFT_VENDOR_HINTS)) s += 14;
  if (hasAnyTag(name, ROBOT_HINTS)) s -= 35;
  if (hasAnyTag(name, MATURITY_PENALTY_TAGS)) s -= 28;

  return s;
}

/** Make punctuation a little easier for TTS to phrase naturally */
export function prepareTextForGentleSpeech(raw: string): string {
  return raw
    .replace(/\u2019/g, "'")
    .replace(/\u201c|\u201d/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split into short phrases so the engine doesn’t rush one wall of text;
 * long bits are broken at commas.
 */
/** Shorter maxLen ⇒ more breaths ⇒ reads closer to spontaneous kid pacing */
export function splitIntoSpeechPhrases(text: string, maxLen = 102): string[] {
  const t = prepareTextForGentleSpeech(text);
  if (!t) return [];

  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length <= maxLen) {
      out.push(sentence);
      continue;
    }
    let buf = "";
    const commas = sentence.split(/,(?=\s)/);
    for (let i = 0; i < commas.length; i++) {
      const piece = commas[i]?.trim();
      if (!piece) continue;
      const sep = buf ? ", " : "";
      const candidate = buf + sep + piece;
      if (candidate.length <= maxLen) buf = candidate;
      else {
        if (buf) out.push(buf);
        buf = piece;
      }
    }
    if (buf) out.push(buf);
  }

  return out.filter(Boolean);
}

export function subscribeVoicesReady(cb: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => undefined;

  const ss = window.speechSynthesis;
  const flush = () => {
    if (ss.getVoices().length > 0) cb();
  };

  flush();
  ss.addEventListener("voiceschanged", flush);
  const tid = window.setTimeout(flush, 550);

  return () => {
    window.clearTimeout(tid);
    ss.removeEventListener("voiceschanged", flush);
  };
}

export function unlockLuminaSpeechSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_SPEECH_UNLOCK, "1");
  } catch {
    /* private mode */
  }
}

export function isLuminaSpeechSessionUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_SPEECH_UNLOCK) === "1";
  } catch {
    return false;
  }
}

/**
 * Prefer a **young, warm English female Lumina**: child/youth voice tags when exposed,
 * else neural female + youthful name hints—still capped by whatever the OS actually ships.
 */
export function pickPreferredLuminaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    if (!v.lang.toLowerCase().startsWith("en")) continue;
    const sc = scoreVoice(v);
    if (sc > bestScore) {
      bestScore = sc;
      best = v;
    }
  }
  return best;
}

/** @deprecated alias — Lumina intentionally skews youthful / girl‑leaning, not generic “female”. */
export function pickPreferredEnglishFemaleVoice(): SpeechSynthesisVoice | null {
  return pickPreferredLuminaVoice();
}

function createUtterance(
  text: string,
  prosody?: Readonly<{ rate: number; pitch: number; volume: number }>,
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const line = prepareTextForGentleSpeech(text);
  if (!line) return null;

  const p = prosody ?? LUMINA_BASE_PROSODY;

  const u = new SpeechSynthesisUtterance(line);
  u.rate = p.rate;
  u.pitch = p.pitch;
  u.volume = p.volume;

  const voice = pickPreferredLuminaVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang || "en-US";
  } else {
    u.lang = "en-US";
  }

  return u;
}

/** Bumps whenever playback is invalidated so stale ElevenLabs fallbacks cannot double-speak */
let luminaSpeakEpoch = 0;

const LUMINA_SPEAKING_OWNER_NEURAL = "neural";
const LUMINA_SPEAKING_OWNER_BROWSER = "browser";

const luminaSpeakingOwners = new Set<string>();

let luminaSpeakingSnapshot = false;

const luminaSpeakingSubscribers = new Set<(speaking: boolean) => void>();

function publishLuminaSpeaking(): void {
  const next = luminaSpeakingOwners.size > 0;
  if (next === luminaSpeakingSnapshot) return;
  luminaSpeakingSnapshot = next;
  for (const fn of luminaSpeakingSubscribers) {
    try {
      fn(next);
    } catch {
      /* ignore */
    }
  }
}

/** Mirrors whether neural MP3 or Web Speech synthesis is actively outputting Lumina voice. */
export function getLuminaSpeaking(): boolean {
  return luminaSpeakingSnapshot;
}

export function subscribeLuminaSpeaking(listener: (speaking: boolean) => void): () => void {
  luminaSpeakingSubscribers.add(listener);
  return () => luminaSpeakingSubscribers.delete(listener);
}

/** In-flight neural fetch cancelled on `cancelLuminaSpeech` */
let neuralFetchAbort: AbortController | null = null;

/** Current `<audio>` for ElevenLabs MP3 blobs */
let neuralAudioElement: HTMLAudioElement | null = null;

function prefersElevenLabsTts(): boolean {
  try {
    const v = import.meta.env.VITE_LUMINA_USE_ELEVENLABS;
    return v === "1" || /^true$/i.test(String(v ?? ""));
  } catch {
    return false;
  }
}

/** Same-origin or `VITE_COACH_API_ORIGIN` preview / split deploy target */
function luminaTtsUrl(): string {
  let origin = "";
  try {
    origin = String(import.meta.env.VITE_COACH_API_ORIGIN ?? "").trim();
  } catch {
    origin = "";
  }
  if (origin) return `${origin.replace(/\/$/, "")}/api/lumina-tts`;
  return "/api/lumina-tts";
}

/** Cross-origin relays need cookies when the API host sits behind SSO or session auth (`include` implies CORS + credentials server-side). */
function luminaTtsCredentials(urlStr: string): RequestCredentials {
  if (typeof window === "undefined") return "same-origin";
  try {
    const isAbsolute = /^https?:\/\//i.test(urlStr);
    if (!isAbsolute) return "same-origin";
    const target = new URL(urlStr).origin;
    return target !== window.location.origin ? "include" : "same-origin";
  } catch {
    return "same-origin";
  }
}

/** Consumes failed response body and returns something safe for `console.warn` (no guessing secrets). */
async function summarizeLuminaTtsFailure(res: Response): Promise<string> {
  const statusLine = `${res.status} ${res.statusText}`.trim();
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  try {
    const raw = await res.text();

    if (ct.includes("application/json")) {
      try {
        const data = JSON.parse(raw) as { error?: unknown };
        const msg = typeof data?.error === "string" ? data.error.trim() : "";
        return msg ? `${statusLine}: ${msg}` : statusLine;
      } catch {
        return raw.trim() ? `${statusLine}: ${raw.slice(0, 280)}` : statusLine;
      }
    }

    const sniff = raw.trimStart();
    if (res.status === 401 || sniff.startsWith("<!")) {
      return `${statusLine}: auth/HTML response (deployment protection / SSO, broken route to index.html, or proxy). Inspect Network → lumina-tts.`;
    }
    if (raw.trim()) return `${statusLine}: ${raw.trim().slice(0, 280)}`;
    return statusLine;
  } catch {
    return statusLine;
  }
}

function luminaResponseLooksLikeAudioMp3(ct: string): boolean {
  const h = ct.toLowerCase();
  return /\baudio\//i.test(h) || /\boctet-stream\b/i.test(h);
}

function revokeNeuralAudio(): void {
  if (!neuralAudioElement) return;
  try {
    neuralAudioElement.pause();
    const src = neuralAudioElement.src;
    neuralAudioElement.removeAttribute("src");
    neuralAudioElement.load();
    if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  } catch {
    /* ignore */
  }
  neuralAudioElement = null;

  luminaSpeakingOwners.delete(LUMINA_SPEAKING_OWNER_NEURAL);
  publishLuminaSpeaking();
}

/** Join phrase chunks with blank lines — ElevenLabs reads it as softer paragraph pauses */
function neuralMergedText(parts: readonly string[]): string {
  return parts.map((p) => prepareTextForGentleSpeech(p)).filter(Boolean).join("\n\n");
}

/** Best-effort: first load/reload sometimes races Chrome/Safari `getVoices()` — wait briefly before `speak()`. */
async function prepareSpeechSynthVoices(): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    if (window.speechSynthesis.getVoices().length > 0) return;
    await new Promise<void>((resolve) => {
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        unsub();
        resolve();
      };
      const timer = window.setTimeout(settle, 2800);
      const unsub = subscribeVoicesReady(() => {
        if (window.speechSynthesis.getVoices().length > 0) settle();
      });
    });
  } catch {
    /* ignore */
  }
}

async function playElevenLabsUtterance(fullText: string, epochCaptured: number): Promise<boolean> {
  const trimmed = fullText.trim();
  if (!trimmed) return false;

  neuralFetchAbort?.abort();
  const ac = new AbortController();
  neuralFetchAbort = ac;

  try {
    const url = luminaTtsUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: ac.signal,
      credentials: luminaTtsCredentials(url),
    });

    if (luminaSpeakEpoch !== epochCaptured || ac.signal.aborted) return false;

    if (!res.ok) {
      console.warn("[luminaSpeech] POST /api/lumina-tts failed:", await summarizeLuminaTtsFailure(res));
      return false;
    }

    const ctype = res.headers.get("content-type") ?? "";
    if (!luminaResponseLooksLikeAudioMp3(ctype)) {
      console.warn(
        "[luminaSpeech] /api/lumina-tts succeeded but Content-Type was not audio — treating as failure:",
        ctype || "(missing)",
        await summarizeLuminaTtsFailure(res),
      );
      return false;
    }

    const blob = await res.blob();
    if (luminaSpeakEpoch !== epochCaptured || !blob.size || ac.signal.aborted) return false;

    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.volume = 0.87;
    neuralAudioElement = audio;

    /**
     * Trust **`playing`**, not **`play()` resolve alone** — autoplay-soft-fail browsers can fulfil
     * `play()` without audible output; false success wedges the hero dedupe against tap-to-retry.
     * If `play()` settles still paused for too long while we awaited decode, assume blocked.
     */
    return await new Promise<boolean>((resolve) => {
      let reported = false;
      neuralFetchAbort = null;

      let stallTimerId: number | null = null;

      const cancelStall = () => {
        if (stallTimerId !== null) {
          window.clearTimeout(stallTimerId);
          stallTimerId = null;
        }
      };

      const armStallProbe = () => {
        cancelStall();
        /** Long enough for typical MP3 decode on cold reload; afterward treat lingering pause as mute/blocked autoplay */
        const STALL_AFTER_MS = 2600;

        stallTimerId = window.setTimeout(() => {
          stallTimerId = null;
          if (reported) return;

          if (!audio.paused) {
            reportOnce(true);
            return;
          }

          revokeNeuralAudio();
          reportOnce(false);
        }, STALL_AFTER_MS);
      };

      const reportOnce = (ok: boolean) => {
        if (reported) return;
        reported = true;
        cancelStall();
        if (ok) {
          luminaSpeakingOwners.add(LUMINA_SPEAKING_OWNER_NEURAL);
          publishLuminaSpeaking();
        }
        resolve(ok);
      };

      audio.addEventListener(
        "playing",
        () => {
          cancelStall();
          reportOnce(true);
        },
        { once: true },
      );

      audio.addEventListener(
        "ended",
        () => {
          cancelStall();
          revokeNeuralAudio();
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        () => {
          cancelStall();
          revokeNeuralAudio();
          reportOnce(false);
        },
        { once: true },
      );

      void audio
        .play()
        .then(() => {
          if (!audio.paused) {
            cancelStall();
            reportOnce(true);
            return;
          }
          armStallProbe();
        })
        .catch(() => {
          cancelStall();
          revokeNeuralAudio();
          reportOnce(false);
        });
    });
  } catch (e) {
    revokeNeuralAudio();
    const aborted =
      ac.signal.aborted ||
      (e instanceof DOMException && e.name === "AbortError") ||
      !!(e && typeof e === "object" && "name" in e && (e as { name?: string }).name === "AbortError");
    if (!aborted) console.warn("[luminaSpeech] neural TTS fetch error:", e);
    return false;
  } finally {
    neuralFetchAbort = null;
  }
}

export function cancelLuminaSpeech(): void {
  if (typeof window === "undefined") return;

  luminaSpeakEpoch++;

  luminaSpeakingOwners.clear();
  publishLuminaSpeaking();

  neuralFetchAbort?.abort();
  neuralFetchAbort = null;

  revokeNeuralAudio();

  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}


/** `true` if the synthesis engine signaled `onstart` (proves autoplay gates passed). */
async function speakBrowserPhrasesWithPausesAsync(
  cleaned: readonly string[],
  opts: { pauseMs: number },
): Promise<boolean> {
  await prepareSpeechSynthVoices();

  if (typeof window === "undefined" || !window.speechSynthesis)
    return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    /** First phrase can be slow cold-starting synth / loading voices after reload */
    const START_WATCH_MS = 3400;

    let sawStart = false;
    let settled = false;

    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        luminaSpeakingOwners.delete(LUMINA_SPEAKING_OWNER_BROWSER);
        publishLuminaSpeaking();
        resolve(sawStart);
      }
    }, START_WATCH_MS);

    const finalizeStart = () => {
      window.clearTimeout(timer);
      if (!settled) {
        settled = true;
        resolve(sawStart);
      }
    };

    const speakAt = (i: number) => {
      if (!window.speechSynthesis) {
        luminaSpeakingOwners.delete(LUMINA_SPEAKING_OWNER_BROWSER);
        publishLuminaSpeaking();
        finalizeStart();
        return;
      }
      if (i >= cleaned.length) {
        luminaSpeakingOwners.delete(LUMINA_SPEAKING_OWNER_BROWSER);
        publishLuminaSpeaking();
        finalizeStart();
        return;
      }
      const phrase = cleaned[i] ?? "";
      const ex = expressiveProsodyForPhrase(phrase, i);
      const u = createUtterance(phrase, {
        rate: ex.rate,
        pitch: ex.pitch,
        volume: ex.volume,
      });
      const afterMs = opts.pauseMs + ex.pauseBoostMs;
      if (!u) {
        window.setTimeout(() => speakAt(i + 1), afterMs);
        return;
      }
      u.onstart = () => {
        sawStart = true;
        luminaSpeakingOwners.add(LUMINA_SPEAKING_OWNER_BROWSER);
        publishLuminaSpeaking();
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(true);
        }
      };
      u.onend = () => {
        window.setTimeout(() => speakAt(i + 1), afterMs);
      };
      u.onerror = () => {
        window.setTimeout(() => speakAt(i + 1), afterMs);
      };
      try {
        window.speechSynthesis.speak(u);
      } catch {
        window.setTimeout(() => speakAt(i + 1), afterMs);
      }
    };

    speakAt(0);
  });
}

async function speakChainedWithPausesAsync(
  lines: readonly string[],
  opts: { unlockSession: boolean; pauseMs: number },
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const cleaned = lines
    .flatMap((l) => splitIntoSpeechPhrases(l))
    .map((l) => l.trim())
    .filter(Boolean);
  if (cleaned.length === 0) return false;

  if (opts.unlockSession) unlockLuminaSpeechSession();

  cancelLuminaSpeech();
  const epoch = luminaSpeakEpoch;

  const mergedForNeural = neuralMergedText(cleaned);

  if (prefersElevenLabsTts() && mergedForNeural.trim()) {
    const ok = await playElevenLabsUtterance(mergedForNeural, epoch);
    if (luminaSpeakEpoch !== epoch) return false;
    if (ok) return true;
    if (!window.speechSynthesis?.speak) return false;
    return await speakBrowserPhrasesWithPausesAsync(cleaned, { pauseMs: opts.pauseMs });
  }

  if (!window.speechSynthesis?.speak) return false;
  return await speakBrowserPhrasesWithPausesAsync(cleaned, { pauseMs: opts.pauseMs });
}

function speakChainedWithPauses(
  lines: readonly string[],
  opts: { unlockSession: boolean; pauseMs: number },
): void {
  void speakChainedWithPausesAsync(lines, opts);
}

/** Read one line; internally splits into gentle phrases with breath pauses */
export function speakLuminaLine(text: string): void {
  speakChainedWithPauses([text], { unlockSession: false, pauseMs: PAUSE_BETWEEN_PHRASES_MS });
}

/**
 * Speak several chunks—call first chunk from a **user gesture** on strict mobile browsers.
 * Extra pause between chunks feels closer to paragraphs.
 */
export function speakLuminaLinesChained(lines: readonly string[]): void {
  speakChainedWithPauses(lines, {
    unlockSession: true,
    pauseMs: PAUSE_BETWEEN_PARAGRAPHS_MS,
  });
}

/** Resolves `true` once audio or Web Speech reliably started (not silently blocked by autoplay). */
export function speakLuminaLinesChainedAsync(lines: readonly string[]): Promise<boolean> {
  return speakChainedWithPausesAsync(lines, {
    unlockSession: true,
    pauseMs: PAUSE_BETWEEN_PARAGRAPHS_MS,
  });
}

export function likelyNeedsSpeechGestureUnlock(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}
