/** Where Lumina should anchor “morning / evening / late” language (IANA TZ). Defaults to Philippines. */

export const DEFAULT_LUMINA_DISPLAY_TIME_ZONE = "Asia/Manila";

export function isValidIanaTimeZone(tz: string): boolean {
  const t = tz.trim();
  if (!t || t.length > 120) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: t }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Request `timeZone` wins, then server `LUMINA_DISPLAY_TIME_ZONE`, then Philippines. */
export function resolveLuminaDisplayTimeZone(input: {
  fromRequestBody?: string | null | undefined;
  fromServerEnv?: string | null | undefined;
}): string {
  for (const c of [input.fromRequestBody, input.fromServerEnv]) {
    const t = typeof c === "string" ? c.trim() : "";
    if (t && isValidIanaTimeZone(t)) return t;
  }
  return DEFAULT_LUMINA_DISPLAY_TIME_ZONE;
}

export function formatLuminaLocalTimestamp(now: Date, timeZone: string): string {
  return Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
    timeZone,
  }).format(now);
}
