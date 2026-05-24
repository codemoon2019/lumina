import axios, { isAxiosError } from "axios";

import type { CoachEnvelope } from "../../coach/types";

/** Production / cross-origin overrides; leave empty during `npm run dev` (same origin + Vite middleware). */
function coachEndpoint(): string {
  const origin =
    typeof import.meta.env.VITE_COACH_API_ORIGIN === "string"
      ? import.meta.env.VITE_COACH_API_ORIGIN.replace(/\/$/, "")
      : "";
  return `${origin}/api/coach`;
}

function coachErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object" && "error" in data) {
      const msg = (data as { error?: unknown }).error;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    if (error.response?.status === 404) {
      return "POST /api/coach not found — use `npm run dev` with Vite (not opening dist/ as static files), or run `npm run coach-api` when using `vite preview`.";
    }
    return error.message || "Network error connecting to Lumina.";
  }
  if (error instanceof Error) return error.message;
  return "Unable to retrieve a reply from Lumina.";
}

export type { CoachEnvelope };

export async function fetchCoachAdvice(params: {
  mood?: string | null;
  focus?: string | null;
  preferredName?: string | null;
  /** recently shown lines — avoid verbatim repeats server-side when supported */
  prior?: string[];
}): Promise<CoachEnvelope> {
  try {
    const preferredNameTrim = typeof params.preferredName === "string" ? params.preferredName.trim() : "";
    const body: Record<string, unknown> = {
      mood: params.mood ?? "",
      focus: params.focus ?? "",
      prior: params.prior ?? [],
    };
    if (preferredNameTrim) body.preferredName = preferredNameTrim;

    const tzBuild =
      typeof import.meta.env.VITE_LUMINA_TIME_ZONE === "string"
        ? import.meta.env.VITE_LUMINA_TIME_ZONE.trim().slice(0, 120)
        : "";
    if (tzBuild) body.timeZone = tzBuild;

    const { data: res } = await axios.post<{
      ok: boolean;
      data?: CoachEnvelope;
      error?: string;
    }>(
      coachEndpoint(),
      body,
      { timeout: 90_000, headers: { "Content-Type": "application/json" } },
    );

    if (!res.ok || !res.data) throw new Error(res.error || "Unable to retrieve a reply from Lumina.");

    return res.data;
  } catch (e) {
    throw new Error(coachErrorMessage(e));
  }
}
