/** First-visit handshake: preferred name lives only in localStorage */

const STORAGE_KEY = "lumina.intro.v1";

export type LuminaIntroState = {
  /** User finished the intro (name + purpose) step */
  done: boolean;
  /** Preferred name they gave (trimmed); null if skipped legacy */
  name: string | null;
};

export const emptyIntroState: LuminaIntroState = { done: false, name: null };

export function readLuminaIntro(): LuminaIntroState {
  if (typeof window === "undefined") return emptyIntroState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyIntroState;
    const parsed = JSON.parse(raw) as Partial<LuminaIntroState>;
    if (!parsed || typeof parsed !== "object") return emptyIntroState;
    return {
      done: parsed.done === true,
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : null,
    };
  } catch {
    return emptyIntroState;
  }
}

export function saveLuminaIntro(state: LuminaIntroState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / privacy */
  }
}

/** Reasonable nickname: letters / spaces / hyphen / apostrophe, 1–40 chars */
export function sanitizePreferredName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .slice(0, 40)
    .trim();
}

/** Lead with their name when a line lacks it — keeps fallbacks humane if the model skips a name once */
export function personalizeWithPreferredName(
  preferredName: string | null | undefined,
  line: string,
): string {
  const n = typeof preferredName === "string" ? preferredName.trim() : "";
  const t = typeof line === "string" ? line.trim() : "";
  if (!n || !t) return typeof line === "string" ? line : "";
  if (t.replace(/\s+/g, " ").toLowerCase().includes(n.toLowerCase())) return t;
  return `${n}, ${t}`;
}

/**
 * Greeting opener already cites their spelling → never prepend `"${name}, …"` onto the companion line too
 * (stops doubling when both JSON fields obey "include the name").
 */
export function personalizeMotivationLine(
  preferredName: string | null | undefined,
  motivationText: string,
  greetingPersonalized: string,
): string {
  const n = typeof preferredName === "string" ? preferredName.trim() : "";
  const t = typeof motivationText === "string" ? motivationText.trim() : "";
  if (!t) return "";

  if (
    n &&
    greetingPersonalized.trim() &&
    greetingPersonalized.replace(/\s+/g, " ").toLowerCase().includes(n.toLowerCase())
  ) {
    return personalizeWithPreferredName(undefined, motivationText);
  }

  return personalizeWithPreferredName(preferredName, motivationText);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function haystackIncludesNameInsensitive(haystack: string, name: string): boolean {
  const h = haystack.normalize("NFKD").toLowerCase();
  const n = name.normalize("NFKD").toLowerCase();
  return n.length > 0 && h.includes(n);
}

/** Fold repeated spelled‑name tenderness into pronouns ("dear Alex"→you‑address). */
function dissolveExtraSpelledNameTokens(text: string, name: string): string {
  if (!text.trim()) return "";
  const esc = escapeRegExp(name.trim());
  let s = text;
  /** Trailing "…, dear Name" / standalone "Dear Name." */
  s = s.replace(new RegExp(`,\\s*\\b[Dd]ear\\s+${esc}\\b\\.?`, "gu"), ".");
  s = s.replace(new RegExp(`\\s*\\.?\\s*\\b[Dd]ear\\s+${esc}\\b\\.?`, "gu"), ".");
  s = s.replace(new RegExp(`\\b${esc}\\b`, "gi"), "you");
  s = s.replace(/\s+/g, " ").replace(/\s*\.\s*\./g, ".").replace(/\s+,/g, ",").trim();
  if (!s) return "";

  /** Capitalise first substantive letter — repair after rewrite */
  let found = false;
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    if (/[\p{L}]/iu.test(chars[i])) {
      chars[i] = chars[i].toUpperCase();
      found = true;
      break;
    }
  }
  const out = chars.join("");
  return found ? out : s;
}

/**
 * Single hero / voice line — joins greeting + motivation and drops a duplicated **leading** `"Name,"`
 * opener on the second clause when greeting already mentions them (coach often names both slices).
 */
export function mergeCoachDisplayLines(
  greetingLine: string,
  motivationLine: string,
  preferredName?: string | null,
): string {
  let a = typeof greetingLine === "string" ? greetingLine.trim() : "";
  let b = typeof motivationLine === "string" ? motivationLine.trim() : "";
  const n = typeof preferredName === "string" ? preferredName.trim() : "";

  if (n && a && haystackIncludesNameInsensitive(a, n)) {
    const re = new RegExp(`^${escapeRegExp(n)}\\s*(?:[,–—:]+)?\\s*`, "iu");
    const stripped = b.replace(re, "").trim();
    if (stripped.length > 0) b = stripped;
    if (haystackIncludesNameInsensitive(b, n)) {
      const relaxed = dissolveExtraSpelledNameTokens(b, n);
      if (relaxed.trim()) b = relaxed.trim();
    }
  }

  if (!a && !b) return "";
  if (!a) return b;
  if (!b) return a;
  if (/[.!?…]["']?$/.test(a)) return `${a} ${b}`;
  return `${a}. ${b}`;
}
