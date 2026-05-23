import { useCallback, useRef, useState } from "react";

import type { CoachEnvelope } from "@/services/coach.api";
import { fetchCoachAdvice } from "@/services/coach.api";

type Status = "idle" | "loading" | "ready" | "error";

interface UseCoachArgs {
  moodLabel: string | null;
  focus: string | null;
  preferredName?: string | undefined;
}

export function useCoachBundle({ moodLabel, focus, preferredName }: UseCoachArgs) {
  const [status, setStatus] = useState<Status>("idle");
  const [payload, setPayload] = useState<CoachEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const priorRef = useRef<string[]>([]);
  /** Last successful GPT response — kept visible if a later refresh fails */
  const lastSuccessRef = useRef<CoachEnvelope | null>(null);

  const regenerate = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const envelope = await fetchCoachAdvice({
        mood: moodLabel,
        focus,
        preferredName: preferredName?.trim(),
        prior: priorRef.current,
      });
      lastSuccessRef.current = envelope;
      setPayload(envelope);
      /** Include greeting — it's the headline users compare across refreshes; was omitted before so repeats were common */
      priorRef.current = [
        ...priorRef.current,
        envelope.greeting,
        envelope.motivation,
        envelope.affirmation,
        envelope.productivityTip,
        envelope.gratitudePrompt,
      ].slice(-30);
      setStatus("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lumina is temporarily unavailable.";
      setError(message);
      const prior = lastSuccessRef.current;
      if (prior) {
        setPayload(prior);
        setStatus("ready");
      } else {
        setPayload(null);
        setStatus("error");
      }
    }
  }, [focus, moodLabel, preferredName]);

  return {
    status,
    payload,
    error,
    regenerate,
  };
}
