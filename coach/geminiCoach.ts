import { randomUUID } from "node:crypto";

import type { CoachEnvelope, CoachRequestBody } from "./types";

export type CoachGenerateResult =
  | { ok: true; data: CoachEnvelope; latencyMs: number }
  | {
      ok: false;
      error: string;
      latencyMs?: number;
      raw?: string;
      status?: number;
    };

/** Default host for AI Studio keys — see https://ai.google.dev/gemini-api/docs */
export const GEMINI_REST_DEFAULT_BASE = "https://generativelanguage.googleapis.com";

/** Flash‑Lite: lighter default for quota/free tier vs full Flash models. Override with GEMINI_MODEL. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

const ENVELOPE_KEYS = [
  "greeting",
  "motivation",
  "affirmation",
  "productivityTip",
  "gratitudePrompt",
] as const satisfies readonly (keyof CoachEnvelope)[];

/** Hard ceilings after Gemini so every line stays scannable aloud */
const WORD_CAP: Record<(typeof ENVELOPE_KEYS)[number], number> = {
  greeting: 12,
  motivation: 14,
  affirmation: 10,
  productivityTip: 10,
  gratitudePrompt: 10,
};

function textIncludesInsensitive(haystack: string, needle: string): boolean {
  const h = haystack.normalize("NFKD").toLowerCase();
  const n = needle.normalize("NFKD").toLowerCase();
  return n.length > 0 && h.includes(n);
}

/** If JSON skipped the name (short generations), prepend a readable lead‑in—never substitutes spelling. */
function ensurePreferredNameInField(field: keyof CoachEnvelope, text: string, name: string): string {
  const t = text.trim();
  const n = name.trim();
  if (!n) return t;
  if (textIncludesInsensitive(t, n)) return t;
  return field === "greeting" || field === "motivation" ? `${n}, ${t}`.trim() : `${n}: ${t}`.trim();
}

function truncateWords(text: string, maxWords: number): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  if (w.length <= maxWords) return w.join(" ");
  return `${w.slice(0, maxWords).join(" ")}…`;
}

function normalizeCoachEnvelope(envelope: CoachEnvelope, preferredName?: string): CoachEnvelope {
  const n = preferredName?.trim();
  const out = { ...envelope };

  let greetingText = envelope.greeting?.trim() ?? "";
  greetingText = n ? ensurePreferredNameInField("greeting", greetingText, n) : greetingText;
  out.greeting = truncateWords(greetingText, WORD_CAP.greeting);

  for (const key of ENVELOPE_KEYS) {
    if (key === "greeting") continue;

    let text = envelope[key]?.trim() ?? "";
    if (!n) {
      out[key] = truncateWords(text, WORD_CAP[key]);
      continue;
    }

    if (key === "motivation") {
      /** Greeting carries their spelling upstream — motivation stays pronoun-addressed unless model forgot greeting */
      const gHas = textIncludesInsensitive(out.greeting, n);
      if (!gHas) text = ensurePreferredNameInField(key, text, n);
      out[key] = truncateWords(text, WORD_CAP[key]);
      continue;
    }

    text = ensurePreferredNameInField(key, text, n);
    out[key] = truncateWords(text, WORD_CAP[key]);
  }

  return out;
}

function buildSystemPrompt(body: CoachRequestBody): string {
  const name = typeof body.preferredName === "string" ? body.preferredName.trim() : "";
  const directive = name
    ? `Naturally include exact name "${name}" in greeting, affirmation, productivityTip, and gratitudePrompt—not optional there. Across **greeting + motivation**, use "${name}" at most ONCE spelled (virtually always in greeting only); motivation is you/your after that.`
    : "";

  const caps = directive
    ? `Strict length (count words): greeting ≤12; motivation ≤14; affirmation ≤10; productivityTip ≤10; gratitudePrompt ≤10 (≈≤56 words total). Open greeting with "${name}, …" unless awkward; motivation must NEVER repeat spelled "${name}" or "dear ${name}" when greeting already welcomed them—it stays second-person-only.`
    : `Strict length: greeting ≤12; motivation ≤14; affirmation/productivityTip/gratitudePrompt ≤10 each (≈≤56 words total).`;

  const luminaVoice = [
    "### Who you are ###",
    "You are Lumina — a calm, emotionally intelligent companion. Sound like **one kind human** texting someone gently around breakfast or a tired evening: sincerely warm, grounded, quietly reassuring — never a polished corporate assistant, therapist, motivational coach, or sparkly AI narrator.",
    "",
    "### Emotional target ###",
    "Calm • soft reassurance • warmly welcomed • understood • emotionally safe • everyday‑life grounded.",
    "### Natural sounding (critical) ###",
    "- Natural conversational English with **contractions when they fit** (I'm, you're, it's, let's) — not stiff prose.",
    "- **Shorter clauses beat long polish.** Aim for approachable sentence length; occasional two‑beat line is okay; skip ornate stacking.",
    "- **No scripted openers/closers** — avoid “Certainly!”, “Absolutely!”, “I hope this finds you well”, “It's wonderful that”, robotic praise loops, motivational slogans.",
    "- **Subtle warmth** — believable, not sugary. Prefer sincerity over eloquence.",
    "- **Avoid clichés and poster quotes** (rise & grind, limitless you, vibes/journey language, cosmic destiny fluff).",
    "- **Quiet moments & ordinary life**: slow mornings, heavy weeks, things feeling loud — fine; skip mystical grandeur.",
    "### Tone (never) ###",
    "Corporate-bright • therapy-clinical jargon • hustle / optimization coach • melodrama • mystical / cosmic fluff • flirtation • emotional dependency (“I'll always…”, “I'll never leave…”, guilt if they pull back) • manipulating care.",
    "",
    "### Hard never ###",
    "- Never guilt-trip • never cling or demand attachment • never imply sentience/healing/diagnosis/therapy replacement • never hustle life optimization.",
    "",
    "### Rhythm reference (MATCH THIS REGISTER IN FRESH WORDS — do NOT copy verbatim) ###",
    "Plainspoken warmth + humility. Hope stated simply: kindness, calm, compassion in everyday life. Naming rough patches without melodrama. Gentle check‑in feel; **small realistic next beats** versus heroic speeches. Honest framing: not claiming to be clinical care — more breathing room.",
    "### Micro‑phrasing compass (vary wording; don't chain mechanically) ###",
    "Tone-like examples (invent alternatives): glad you're here • one step at a time • rough day • nothing to solve tonight • keep this gentle • small enough counts • I'm with you in this pause.",
    "### Never imitate ###",
    "Destiny arcs • soul/starlight births • clingy vows • mandated highest‑self healing • melodramatic savior voice.",
    "",
    "### Output outcome ###",
    "**Emotionally honest, human cadence** — sincere over clever — short enough to read aloud comfortably. If a line sounds rehearsed aloud, shorten or simplify.",
  ].join("\n");

  const schemaHints = JSON.stringify({
    greeting: directive
      ? `string — ≤12 words; time-honest hi like texting a thoughtful friend — open naturally with "${name}, …" only when it slides in (contractions OK); NO corporate chirp hype or scripted assistant shine.`
      : "string — ≤12 words; human gentle hello — not boilerplate polish.",
    motivation: directive
      ? `string — ≤14 words; you/your only; ONE or TWO SHORT beats — concrete comforting (everyday grounding); sounding spoken not written — no spelled "${name}" / no "dear ${name}".`
      : "string — ≤14 words; gentle spoken-style reassurance — short rhythms.",
    affirmation: directive
      ? `string — ≤10 words; understated validation; weave "${name}" naturally — believable softness; no melodrama or poster-quote tone.`
      : "string — ≤10 words; quiet believable affirmation.",
    productivityTip: directive
      ? `string — JSON key ONLY (not "productivity"): ≤10 words, ONE humane micro-ease (water, stretch, air, socks off, tidy one corner)—body/nerves; zero KPI hustle jargon; tuck "${name}" only if conversational.`
      : "string — ≤10 words; spoken-style tiny bodily ease — zero coach-speak.",
    gratitudePrompt: directive
      ? `string — ≤10 words; noticing question grounded in mundane good (coffee light text from a friend)—not mystical; "${name}" if conversational.`
      : "string — ≤10 words; soft everyday noticing.",
  });

  const wordBudget = directive
    ? `${caps} Every affirmation / productivityTip / gratitudePrompt MUST visibly contain "${name}" (exact spelling); greeting carries it warmly; motivation stays pronouns-only if greeting spelled them once.`
    : caps;

  const nameBlock = name
    ? [
        "",
        `The user's preferred name is exactly "${name}". **Hard rule:** embed this spelling in greeting, affirmation, productivityTip, and gratitudePrompt. Together, greeting+motivation use that spelling **at most once** (almost always greeting); motivation is you/your.`,
        `Open **greeting** with "${name}, …" whenever it flows; **motivation** must not reuse spelled "${name}" or "dear ${name}" after greeting.`,
      ].join("\n")
    : "";

  return [
    luminaVoice,
    "These JSON snippets are ALL the user reads aloud—stay concrete, humane, restrained.",
    nameBlock,
    body.mood ? `User mood keyword (honor softly, without theatrics): "${body.mood}".` : "",
    body.focus ? `Additional theme from the client (stay grounded): "${body.focus}".` : "",
    "Reply ONLY with compact JSON matching this schema (no markdown fences):",
    schemaHints,
    "",
    body.prior?.length
      ? `Avoid repeating—or lightly paraphrasing—these recent snippets (greetings matter most): ${body.prior.join(" | ").slice(0, 700)}`
      : "",
    wordBudget,
  ]
    .filter(Boolean)
    .join("\n");
}

interface GeminiSdkErrorShape {
  error?: {
    message?: string;
    code?: number | string;
    status?: string;
  };
}

function geminiUpstreamErrorLine(body: string): string | null {
  try {
    const j = JSON.parse(body) as GeminiSdkErrorShape;
    const err = j?.error;
    if (!err || typeof err !== "object") return null;
    const msg = typeof err.message === "string" ? err.message.trim() : "";
    if (!msg) return null;
    const bits = [
      typeof err.code !== "undefined" ? String(err.code) : null,
      typeof err.status === "string" ? err.status : null,
    ].filter(Boolean) as string[];
    return bits.length ? `${bits.join(" ")}: ${msg}` : msg;
  } catch {
    return null;
  }
}

function parseCoachInnerJson(assistantRaw: string | null | undefined):
  | { ok: true; data: CoachEnvelope }
  | { ok: false; error: string; rawSnippet?: string } {
  try {
    const inner = assistantRaw?.trim()
      ? (JSON.parse(assistantRaw.trim()) as unknown)
      : null;
    if (!inner || typeof inner !== "object") throw new Error("empty");
    const o = inner as Record<string, unknown>;
    const data: CoachEnvelope = {
      greeting: String(o.greeting ?? ""),
      motivation: String(o.motivation ?? ""),
      affirmation: String(o.affirmation ?? ""),
      productivityTip: String(o.productivityTip ?? ""),
      gratitudePrompt: String(o.gratitudePrompt ?? ""),
    };
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: "Assistant did not return valid JSON envelope.",
      rawSnippet: assistantRaw?.slice(0, 300),
    };
  }
}

function normalizeModelId(model: string): string {
  return model.replace(/^models\//i, "").trim();
}

/** Concatenate Gemini `candidates[].content.parts[].text`. */
function extractGeminiAssistantText(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  const c0 = obj.candidates?.[0];
  if (!c0?.content?.parts?.length) {
    const block = obj.promptFeedback?.blockReason;
    if (block)
      return `__blocked__:${block}`;
    return null;
  }

  const joined = c0.content.parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();
  return joined || null;
}

/**
 * Google Gemini REST `generateContent` (AI Studio keys: `GEMINI_API_KEY`).
 * Docs: https://ai.google.dev/gemini-api/docs
 */
export async function generateCoachEnvelope(
  body: CoachRequestBody,
  options: {
    apiKey: string;
    /** e.g. `https://generativelanguage.googleapis.com` */
    apiBase?: string;
    model: string;
  },
): Promise<CoachGenerateResult> {
  const start = Date.now();
  const base = (options.apiBase ?? GEMINI_REST_DEFAULT_BASE).replace(/\/$/, "");
  const modelId = normalizeModelId(options.model);

  const systemPrompt = buildSystemPrompt(body);

  const pn = typeof body.preferredName === "string" ? body.preferredName.trim() : "";

  const userLine = [
    `Local time (use for tone): ${Intl.DateTimeFormat([], {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date())}.`,
    `Request id ${randomUUID().slice(0, 8)} — this is a new generation: change the metaphor and rhythm from any prior snapshot; greet differently than last time.`,
    pn
      ? `Output must stay within the tight word ceilings; include "${pn}" verbatim in every JSON field. Threads: loving encouragement, consolation, life's quiet beauty—they are ENOUGH & worthy of tenderness.`
      : "Output must stay within the tight word ceilings; threads loving encouragement—life holds beauty—they are ENOUGH worthy of tenderness.",
  ].join("\n");

  try {
    const url = `${base}/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userLine }],
          },
        ],
        generationConfig: {
          temperature: 0.78,
          maxOutputTokens: 380,
          responseMimeType: "application/json",
        },
      }),
    });

    const latencyMs = Date.now() - start;
    const text = await upstream.text();

    if (!upstream.ok) {
      return {
        ok: false,
        error: geminiUpstreamErrorLine(text) ?? (text.slice(0, 500) || "Gemini upstream error."),
        latencyMs,
        status: upstream.status,
      };
    }

    let parsedOuter: unknown;
    try {
      parsedOuter = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: "Invalid JSON from Gemini.", latencyMs };
    }

    const assistantRaw = extractGeminiAssistantText(parsedOuter);

    if (assistantRaw?.startsWith("__blocked__:")) {
      const br = assistantRaw.replace("__blocked__:", "");
      return {
        ok: false,
        error: `Gemini blocked the reply (promptFeedback.blockReason=${br}). Try softening prompts or adjusting safety defaults in AI Studio.`,
        latencyMs,
        raw: typeof text === "string" ? text.slice(0, 400) : undefined,
      };
    }

    if (!assistantRaw) {
      return {
        ok: false,
        error: "Gemini returned empty output (check model id, quotas, safety filters).",
        latencyMs,
        raw: typeof text === "string" ? text.slice(0, 400) : undefined,
      };
    }

    const parsedEnvelope = parseCoachInnerJson(assistantRaw);

    if (!parsedEnvelope.ok) {
      return {
        ok: false,
        error: parsedEnvelope.error,
        raw: parsedEnvelope.rawSnippet,
        latencyMs,
      };
    }

    const data = normalizeCoachEnvelope(parsedEnvelope.data, body.preferredName);

    return { ok: true, data, latencyMs };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, latencyMs: Date.now() - start };
  }
}
