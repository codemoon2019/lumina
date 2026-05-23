/** JSON envelope Lumina expects from the Gemini coach call (Gemini emits via `application/json`). */

export interface CoachEnvelope {
  greeting: string;
  motivation: string;
  affirmation: string;
  productivityTip: string;
  gratitudePrompt: string;
}

export interface CoachRequestBody {
  mood?: string;
  focus?: string;
  /** Sanitized preferred name — model must weave into every envelope field when set */
  preferredName?: string;
  /** recently shown snippets — discourage verbatim repeats */
  prior?: string[];
}
