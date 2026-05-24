/**
 * DEV only: prints `GET /api/gemini-probe` JSON to the browser console (no secrets in response).
 */

export function logGeminiProbeToConsole(): void {
  if (!import.meta.env.DEV) return;
  if (typeof fetch === "undefined") return;

  void (async () => {
    try {
      const originRaw =
        typeof import.meta.env.VITE_COACH_API_ORIGIN === "string"
          ? import.meta.env.VITE_COACH_API_ORIGIN
          : "";
      const origin = originRaw.trim().replace(/\/$/, "");
      const target = origin ? `${origin}/api/gemini-probe` : "/api/gemini-probe";

      const res = await fetch(target);

      let body: unknown;
      const ct = res.headers.get("content-type") ?? "";
      try {
        body = ct.includes("application/json") ? await res.json() : await res.text();
      } catch {
        body = "(could not parse body)";
      }

      const label =
        res.ok && typeof body === "object" && body !== null && (body as { liveProbeRan?: unknown }).liveProbeRan
          ? "Gemini probe (live OK)"
          : res.ok && typeof body === "object" && body !== null
            ? "Gemini probe (dry-run)"
            : "Gemini probe (request failed)";
      // eslint-disable-next-line no-console -- intentional dev instrumentation
      console.info(`[Lumina] ${label}`, { status: res.status, target, body });
    } catch (e) {
      // eslint-disable-next-line no-console -- intentional dev instrumentation
      console.warn("[Lumina] Gemini probe fetch error", e);
    }
  })();
}
