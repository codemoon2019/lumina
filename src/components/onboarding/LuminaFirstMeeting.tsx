import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AiFillHeart } from "react-icons/ai";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  LuminaSpeakingEchoRipples,
  luminaSpeakingEchoBreathMotion,
} from "@/components/ambient/LuminaSpeakingEchoChrome";
import { onboardingFirstStepSpeech, onboardingPurposeSpeechChunks } from "@/data/onboardingSpeech";
import { useLuminaSpeaking } from "@/hooks/useLuminaSpeaking";
import { sanitizePreferredName } from "@/utils/luminaIntro";
import {
  cancelLuminaSpeech,
  speakLuminaLinesChained,
  speakLuminaLinesChainedAsync,
  unlockLuminaSpeechSession,
} from "@/utils/luminaSpeech";

type Step = "name" | "purpose";

interface LuminaFirstMeetingProps {
  onFinish: (sanitizedName: string) => void;
}

export function LuminaFirstMeeting({ onFinish }: LuminaFirstMeetingProps) {
  const luminaSpeaking = useLuminaSpeaking();
  const reduceMotion = useReducedMotion();
  const showSpeakingEcho = luminaSpeaking && !reduceMotion;
  const speakingEchoBreath = luminaSpeakingEchoBreathMotion(showSpeakingEcho);

  const [step, setStep] = useState<Step>("name");
  /** One deliberate tap/button press first — satisfies browser voice unlock + skips mystery “silent” reloads */
  const [primerDone, setPrimerDone] = useState(false);
  const primerDoneRef = useRef(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  /** Prevents stacking duplicate welcome narration calls */
  const welcomePlayedRef = useRef(false);
  const welcomeSpeakInFlight = useRef(false);

  /**
   * Chrome/Safari (and most browsers) **block audible playback**—including Web Speech and `<audio>`
   * MP3—from running on “cold” loads: new tab, refresh, startup page until there is user activation.
   * Welcome runs only **after** the primer tap (`primerDoneRef`); retries use window gestures.
   */
  const attemptWelcomeSpeech = useCallback(async () => {
    if (
      !primerDoneRef.current ||
      step !== "name" ||
      welcomePlayedRef.current ||
      welcomeSpeakInFlight.current
    ) {
      return;
    }
    welcomeSpeakInFlight.current = true;
    try {
      unlockLuminaSpeechSession();
      cancelLuminaSpeech();
      const ok = await speakLuminaLinesChainedAsync([onboardingFirstStepSpeech()]);
      if (ok) {
        welcomePlayedRef.current = true;
      }
      /** When `false`, autoplay was blocked or failed — user can gesture again */
    } finally {
      welcomeSpeakInFlight.current = false;
    }
  }, [step]);

  useEffect(() => {
    if (step !== "name" || !primerDone) return;

    const opts = { capture: true } as const;
    /** Keep retry path in direct gesture chain when possible — microtask ok for retries */
    const afterGesture = () => queueMicrotask(() => void attemptWelcomeSpeech());

    window.addEventListener("pointerdown", afterGesture, opts);
    window.addEventListener("keydown", afterGesture, opts);

    return () => {
      window.removeEventListener("pointerdown", afterGesture, opts);
      window.removeEventListener("keydown", afterGesture, opts);
    };
  }, [step, primerDone, attemptWelcomeSpeech]);

  /** Unlock flow from the prerequisite button synchronously tied to pointer activation */
  const handlePrimerEnter = () => {
    /** Same tick as pointer — aligns with browsers’ gesture / audio gates */
    unlockLuminaSpeechSession();
    primerDoneRef.current = true;
    setPrimerDone(true);
    void attemptWelcomeSpeech();
  };

  useEffect(() => {
    if (!primerDone || step !== "name") return;
    let id = 0;
    id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [primerDone, step]);

  const displayName = sanitizePreferredName(step === "purpose" ? input : input || "");

  const handleNameContinue = () => {
    const name = sanitizePreferredName(input);
    if (!name) {
      inputRef.current?.focus();
      return;
    }
    speakLuminaLinesChained(onboardingPurposeSpeechChunks(name));
    setInput(name);
    setStep("purpose");
  };

  const handlePurposeContinue = () => {
    const name = sanitizePreferredName(input);
    if (!name) {
      setStep("name");
      return;
    }
    unlockLuminaSpeechSession();
    onFinish(name);
  };

  const onSubmitName = (e: FormEvent) => {
    e.preventDefault();
    handleNameContinue();
  };

  return (
    <div
      role="dialog"
      aria-labelledby={
        step === "purpose"
          ? "lumina-purpose-title"
          : primerDone
            ? "lumina-intro-title"
            : "lumina-intro-primer-title"
      }
      aria-describedby={
        step === "purpose"
          ? "lumina-purpose-body"
          : primerDone
            ? "lumina-intro-desc"
            : "lumina-intro-primer-desc"
      }
      className="relative z-[80] mx-auto mt-[-1rem] w-full max-w-lg overflow-visible px-5 pb-6 sm:mt-0 sm:pb-0"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        /** No bottom padding here: echoes are absolutely positioned and would stretch with `pb-*`, misaligning the halo vs the glass card — use outer margin toward the footer instead. */
        className="relative mb-10 overflow-visible"
      >
        <LuminaSpeakingEchoRipples show={showSpeakingEcho} roundClassName="rounded-[2.25rem]" />

        <motion.div
          animate={speakingEchoBreath.animate}
          transition={speakingEchoBreath.transition}
          className={`relative z-[1] rounded-[2.25rem] border bg-white/90 px-8 pb-10 pt-14 shadow-soft backdrop-blur-2xl dark:bg-[rgba(14,18,38,0.88)] md:px-10 md:pb-12 md:pt-16 ${
            luminaSpeaking && reduceMotion
              ? "border-teal-400/48 dark:border-teal-400/32"
              : "border-violet-200/60 dark:border-white/14"
          }`}
        >
        <AnimatePresence mode="wait">
          {!primerDone ? (
            <motion.div
              key="primer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="text-center sm:text-left"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-700 dark:text-violet-300">
                A gentle threshold
              </p>
              <h2
                id="lumina-intro-primer-title"
                className="mt-5 font-display text-[1.75rem] leading-tight text-slate-950 dark:text-white sm:text-[1.9rem]"
              >
                A quiet conversation is waiting for you.
              </h2>
              <p id="lumina-intro-primer-desc" className="mt-5 text-base leading-relaxed text-slate-700 dark:text-slate-100">
                Lumina keeps a whisper of hello tucked here—warm, unrushed, and meant for nobody else&apos;s ears. If it
                tugs gently at your curiosity, come a little nearer; nothing else unfolds until this first moment settles.
              </p>
              <button
                type="button"
                className="mt-10 inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-teal-500 px-8 text-[0.98rem] font-semibold tracking-wide text-white shadow-[0_12px_32px_-8px_rgba(91,73,217,0.45)] ring-1 ring-white/30 transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-[0.97] hover:shadow-[0_18px_44px_-10px_rgba(91,73,217,0.52)] hover:ring-white/45 active:translate-y-0 dark:from-indigo-600 dark:to-teal-500 dark:ring-white/15 dark:hover:ring-white/35 sm:mx-auto sm:max-w-sm"
                onClick={handlePrimerEnter}
                aria-describedby="lumina-intro-primer-footnote"
              >
                Draw near — say hello softly
              </button>
              <p
                id="lumina-intro-primer-footnote"
                className="mx-auto mt-4 max-w-sm text-[0.8rem] leading-snug text-slate-500 dark:text-white/55"
              >
                There&apos;s nowhere to hurry; crossing this softness once is usually enough until you close the chapter
                and return.
              </p>
            </motion.div>
          ) : step === "name" ? (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-violet-700 dark:text-violet-300">
                First hello
              </p>
              <h1 id="lumina-intro-title" className="mt-4 font-display text-[1.85rem] leading-tight text-slate-950 dark:text-white sm:text-[2rem]">
                Hi — I&apos;m Lumina.
              </h1>
              <p id="lumina-intro-desc" className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-100 md:text-[1.05rem]">
                I&apos;m really glad you&apos;re here. Before anything else, I&apos;d love to know what to call you — it
                feels nicer when we can speak a little more personally.
                <span className="mt-3 block font-medium text-slate-900 dark:text-white">
                  What name would you like me to use for you?
                </span>
              </p>

              <form onSubmit={onSubmitName} className="mt-8 space-y-4">
                <label htmlFor="lumina-preferred-name" className="sr-only">
                  Your preferred name
                </label>
                <input
                  ref={inputRef}
                  id="lumina-preferred-name"
                  type="text"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  spellCheck={false}
                  placeholder="your name…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300/90 bg-white px-4 py-3.5 text-[1rem] font-medium text-slate-950 outline-none ring-violet-500/60 transition placeholder:text-slate-500 focus:border-transparent focus:ring-[3px] dark:border-slate-500/50 dark:bg-slate-900/85 dark:text-slate-50 dark:placeholder:text-slate-400 dark:ring-teal-500/55"
                  maxLength={48}
                />
                <button
                  type="submit"
                  disabled={luminaSpeaking}
                  className="inline-flex min-h-[2.875rem] w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-teal-500 px-8 text-[0.95rem] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(91,73,217,0.45)] transition hover:opacity-[0.95] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 dark:from-indigo-600 dark:to-teal-500"
                >
                  That&apos;s my name →
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="purpose"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700 dark:text-teal-300">
                So you know why I&apos;m here
              </p>
              <h2
                id="lumina-purpose-title"
                className="mt-4 font-display text-[1.75rem] leading-tight text-slate-950 dark:text-white"
              >
                Lovely to meet you, {displayName}.
              </h2>
              <div
                id="lumina-purpose-body"
                className="mt-5 space-y-4 text-[0.98rem] leading-relaxed text-slate-700 dark:text-slate-100 md:text-[1.05rem]"
              >
                <p>
                  I&apos;m Lumina. I was created with a simple hope in mind: to bring a little more{" "}
                  <span className="font-semibold text-slate-950 dark:text-white">
                    kindness, calm, and compassion
                  </span>{" "}
                  into people&apos;s everyday lives.
                </p>
                <p>
                  I&apos;m here for the quieter moments — slow mornings, heavy weeks, or times when everything feels a
                  bit louder than usual. A gentle check-in, a little reassurance, and small next steps when the bigger
                  picture feels overwhelming.
                </p>
                <p className="text-slate-800 dark:text-slate-100">
                  <span className="font-semibold text-slate-950 dark:text-white">
                    I&apos;m not therapy or a clinician.
                  </span>{" "}
                  Think of me more as a soft place to land for a moment, breathe, and keep moving forward — gently, one
                  step at a time.
                </p>
              </div>
              <button
                type="button"
                disabled={luminaSpeaking}
                className="mt-10 inline-flex min-h-[2.875rem] w-full items-center justify-center rounded-full border border-transparent bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-8 text-[0.95rem] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(20,184,166,0.45)] transition hover:opacity-[0.95] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 dark:from-teal-500 dark:via-teal-400 dark:to-cyan-500"
                onClick={handlePurposeContinue}
              >
                Continue into Lumina
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </motion.div>
      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-1.5 pb-1 text-center text-[0.8rem] font-medium leading-tight text-slate-600 dark:text-white/[0.88] sm:mt-8">
        <span>Crafted with</span>
        <AiFillHeart className="shrink-0 text-[0.95rem] text-rose-500 dark:text-rose-300" aria-hidden />
        <span>by Al</span>
      </p>
      <div className="h-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0" aria-hidden />
    </div>
  );
}
