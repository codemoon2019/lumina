import { useCallback, useState } from "react";

import { readLuminaIntro, sanitizePreferredName, saveLuminaIntro } from "@/utils/luminaIntro";

/** Intro handshake persisted in localStorage — name only on device */
export function useLuminaIntro() {
  const [state, setState] = useState(() => readLuminaIntro());

  const completeIntro = useCallback((rawName: string) => {
    const name = sanitizePreferredName(rawName);
    const next = { done: true, name: name || null };
    saveLuminaIntro(next);
    setState(next);
  }, []);

  return {
    introductionDone: state.done,
    preferredName: state.name,
    completeIntro,
  };
}
