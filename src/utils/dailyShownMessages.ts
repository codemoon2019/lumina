/** localStorage bucket: which uplifting lines already appeared today (calendar day, local TZ). */

import { pickRandomShortMessage } from "@/data/shortUpliftingMessages";

const LS_KEY = "lumina.dailyShownMessages.v1";

const SS_COMFORT_PREFIX = "lumina.comfort.pick.v1";

/** Simple stable key for pairing comfort copy with an error string */
function shortErrorKey(error: string): string {
  let h = 0;
  for (let i = 0; i < error.length; i++) h = (h * 31 + error.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

function comfortPickStorageKey(date: string, error: string): string {
  return `${SS_COMFORT_PREFIX}:${date}:${shortErrorKey(error)}`;
}

type Bucket = {
  /** `YYYY-MM-DD` in local time */
  date: string;
  /** Exact message strings already shown today */
  shown: string[];
};

function localCalendarDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function safeReadBucket(): Bucket {
  const today = localCalendarDate();
  if (typeof window === "undefined") return { date: today, shown: [] };

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { date: today, shown: [] };
    const parsed = JSON.parse(raw) as Partial<Bucket>;
    if (!parsed || typeof parsed.date !== "string" || !Array.isArray(parsed.shown))
      return { date: today, shown: [] };
    if (parsed.date !== today) return { date: today, shown: [] };
    return { date: today, shown: [...parsed.shown] };
  } catch {
    return { date: today, shown: [] };
  }
}

function writeBucket(bucket: Bucket): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(bucket));
  } catch {
    /* quota / privacy mode */
  }
}

/** Persist that this exact line counted as shown today */
export function rememberShownToday(text: string): void {
  if (!text.trim()) return;
  const bucket = safeReadBucket();
  if (!bucket.shown.includes(text)) bucket.shown.push(text);
  writeBucket(bucket);
}

/**
 * Prefer a random line not shown yet today (`avoid`: don’t repeat the previous whisper in a row).
 * If everything in the catalog was already shown today, fall back to the pool-wide random picker.
 */
export function pickRandomUnusedToday(messages: readonly string[], avoid?: string): string {
  const bucket = safeReadBucket();
  const unused = messages.filter((m) => !bucket.shown.includes(m));

  const pool = unused.length ? unused : [...messages];

  let choice =
    pool[Math.floor(Math.random() * pool.length)] ??
    messages[Math.floor(Math.random() * messages.length)] ??
    "";

  if (avoid !== undefined && pool.length > 1) {
    let guard = 0;
    while (choice === avoid && guard++ < 32) {
      choice = pool[Math.floor(Math.random() * pool.length)] ?? choice;
    }
  }

  if (!choice.trim() && messages.length) {
    choice = pickRandomShortMessage(messages, avoid);
  }

  return choice;
}

/** Reuse cached comfort headline for same error today in this tab (Strict-safe). */
export function comfortHeadlineOncePerErrorToday(errorMsg: string, messages: readonly string[]): string {
  const dateKey = localCalendarDate();
  if (typeof window === "undefined") {
    return pickRandomUnusedToday(messages);
  }

  try {
    const ck = comfortPickStorageKey(dateKey, errorMsg);
    const hit = window.sessionStorage.getItem(ck);
    if (hit) return hit;

    const picked = pickRandomUnusedToday(messages);
    rememberShownToday(picked);
    window.sessionStorage.setItem(ck, picked);
    return picked;
  } catch {
    const picked = pickRandomUnusedToday(messages);
    rememberShownToday(picked);
    return picked;
  }
}
