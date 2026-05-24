import { useSyncExternalStore } from "react";

import { getLuminaSpeaking, subscribeLuminaSpeaking } from "@/utils/luminaSpeech";

/** True while neural TTS `<audio>` or Web Speech synthesis is actively reading Lumina copy. */
export function useLuminaSpeaking(): boolean {
  return useSyncExternalStore(
    (notify) =>
      subscribeLuminaSpeaking(() => {
        notify();
      }),
    getLuminaSpeaking,
    () => false,
  );
}
