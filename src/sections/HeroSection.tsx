import { useCallback } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { RiSparklingLine, RiVolumeUpLine } from "react-icons/ri";

import {
  LuminaSpeakingEchoRipples,
  luminaSpeakingEchoBreathMotion,
} from "@/components/ambient/LuminaSpeakingEchoChrome";
import { useLuminaSpeaking } from "@/hooks/useLuminaSpeaking";
import { mergeCoachDisplayLines } from "@/utils/luminaIntro";
import {
  cancelLuminaSpeech,
  speakLuminaLinesChained,
  unlockLuminaSpeechSession,
} from "@/utils/luminaSpeech";

interface HeroSectionProps {
  headline: string;
  subline?: string | null;
  /** Drops a duplicated leading "Name," on the merged second clause when the greeting already uses their name */
  preferredName?: string | null;
  /** e.g. "Sunday · May 24" — anchors the daily message */
  todayLine?: string;
  /** Personalized micro-line — "For you{, Name}" */
  dedicationLine?: string | null;
  /** Set when fetching a new coach line failed but the last good note is still shown */
  lastRefreshError?: string | null;
  /** Narration waits for explicit tap — disable replay while Coach is reloading */
  coachLoading?: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.06 },
  },
};

const itemVariants = (reduceMotion: boolean) => ({
  hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  visible: reduceMotion
    ? { opacity: 1, y: 0 }
    : {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      },
});

/** Matches hero glass outer radius (echo ripples reuse this exactly). */
const ROUND_SHELL =
  "rounded-[1.85rem] sm:rounded-[2.35rem] [@media(min-height:900px)]:lg:rounded-[3rem]";

/** Hero “today’s message” card — Gemini greeting + motivation merge into **one** reading moment
 * so the hero never feels like two stacked broadcasts. */
export function HeroSection({
  headline,
  subline,
  preferredName,
  todayLine,
  dedicationLine,
  lastRefreshError,
  coachLoading = false,
}: HeroSectionProps) {
  const reduceMotion = useReducedMotion();
  const luminaSpeaking = useLuminaSpeaking();
  const supportText = subline?.trim() ?? "";
  const mergedNote = mergeCoachDisplayLines(headline, supportText, preferredName).trim();
  const hasNote = !!mergedNote;

  const onHearLuminaVoice = useCallback(() => {
    if (!mergedNote.trim()) return;
    unlockLuminaSpeechSession();
    cancelLuminaSpeech();
    speakLuminaLinesChained([mergedNote]);
  }, [mergedNote]);
  /** Both models returned sentences — airy line-height keeps it one breath */
  const isDualSource = !!(headline.trim() && supportText);
  const iv = itemVariants(Boolean(reduceMotion));

  const speakingGlow =
    luminaSpeaking && reduceMotion
      ? "shadow-[0_0_48px_-8px_rgba(45,212,191,0.45)]"
      : "";

  const showEchoRipples = luminaSpeaking && !reduceMotion;
  const echoBreath = luminaSpeakingEchoBreathMotion(showEchoRipples);

  return (
    /** `pb-*` stays on section, not inner echo root: ripples are `absolute` and ignore flow — inner `pb-*` only stretches the halo past the shell. */
    <motion.section layout className="relative z-10 mx-auto w-full max-w-6xl overflow-visible pb-11">
      <div className="relative overflow-visible">
        <LuminaSpeakingEchoRipples show={showEchoRipples} roundClassName={ROUND_SHELL} />

        <motion.div
          layout
          className={`lumina-cover-glow relative z-[1] overflow-hidden ${ROUND_SHELL} ${speakingGlow}`}
          animate={echoBreath.animate}
          transition={echoBreath.transition}
        >
        <div
          className="relative z-[2] px-5 py-7 sm:px-8 sm:py-9 md:px-10 md:py-10 [@media(min-height:900px)]:lg:px-12 [@media(min-height:900px)]:lg:py-12"
        >
          <div className="pointer-events-none absolute -right-[12%] -top-[18%] h-[22rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(244,173,226,0.28)_0%,transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(167,139,250,0.16)_0%,transparent_70%)]" />
          <div className="pointer-events-none absolute -bottom-[16%] -left-[10%] h-[18rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(153,246,228,0.32)_0%,transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(45,212,191,0.12)_0%,transparent_70%)]" />

          <div
            aria-hidden
            className={`pointer-events-none absolute left-6 font-display leading-none text-violet-300/55 dark:text-violet-400/35 sm:left-9 ${hasNote ? "top-[4.4rem] text-[clamp(2.6rem,8vw,5.2rem)] [@media(min-height:900px)]:top-[5.4rem]" : "top-28 text-5xl"}`}
          >
            “
          </div>

          <motion.div
            className="relative z-[1] flex w-full flex-col gap-6 [@media(min-height:900px)]:gap-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={iv} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100/80 px-3 py-1.5 text-[0.58rem] font-semibold uppercase leading-tight tracking-[0.28em] text-violet-700 backdrop-blur-sm dark:bg-white/[0.08] dark:text-violet-100 [@media(min-height:900px)]:text-[0.63rem]">
                <span className="inline-flex items-center text-emerald-500 dark:text-teal-200" aria-hidden>
                  <RiSparklingLine className="text-[0.72rem]" />
                  <RiSparklingLine className="-ml-0.5 text-[0.82rem]" />
                  <RiSparklingLine className="-ml-0.5 text-[0.7rem]" />
                </span>
                Today’s message from Lumina
              </span>
              {todayLine ? (
                <p className="shrink-0 font-display text-[0.68rem] uppercase tracking-[0.22em] text-violet-400/90 dark:text-violet-200/70 sm:text-right [@media(min-height:900px)]:text-[0.72rem]">
                  {todayLine}
                </p>
              ) : null}
            </motion.div>

            {dedicationLine ? (
              <motion.div variants={iv} className="relative mx-auto w-full max-w-3xl lg:mx-0">
                <p className="font-display text-[0.95rem] font-normal italic leading-snug tracking-wide text-violet-500 dark:text-violet-200/85 [@media(min-height:900px)]:text-[1.05rem]">
                  {dedicationLine}
                </p>
              </motion.div>
            ) : null}

            <motion.div variants={iv} className="relative mx-auto w-full max-w-3xl lg:mx-0">
              <h1
                className={
                  hasNote
                    ? `relative mt-1 pl-[1.25rem] font-display text-[clamp(1.35rem,min(4.25vw,5.5dvh),2.85rem)] font-normal tracking-[-0.02em] text-slate-950 before:absolute before:left-0 before:top-[0.15em] before:h-[calc(100%-0.3em)] before:w-[2.5px] before:rounded-full before:bg-gradient-to-b before:from-violet-500 before:via-fuchsia-400 before:to-teal-400 before:opacity-90 sm:mt-1.5 sm:pl-[1.35rem] md:pl-7 dark:text-white ${isDualSource ? "leading-[1.14]" : "leading-[1.08]"} [@media(min-height:900px)]:mt-2 [@media(min-height:900px)]:pl-8 [@media(min-height:900px)]:text-[clamp(1.65rem,4.5vw,3.75rem)] [@media(min-height:900px)]:before:w-1`
                    : "mt-1 font-sans text-base font-medium leading-snug text-slate-600 dark:text-white/80 [@media(min-height:900px)]:mt-2 [@media(min-height:900px)]:text-lg"
                }
              >
                {hasNote ? mergedNote : "Lumina is gathering a softer line…"}
              </h1>
            </motion.div>

            {hasNote ? (
              <motion.div variants={iv} className="relative mx-auto mt-2 w-full max-w-3xl lg:mx-0">
                <button
                  type="button"
                  aria-label="Hear Lumina read this message aloud"
                  disabled={coachLoading || luminaSpeaking}
                  onClick={onHearLuminaVoice}
                  className="inline-flex min-h-[2.5rem] cursor-pointer items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-600 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)] transition hover:bg-white disabled:pointer-events-none disabled:opacity-50 dark:bg-white/[0.08] dark:text-violet-100 dark:hover:bg-white/[0.12]"
                >
                  <RiVolumeUpLine className="shrink-0 text-base text-violet-400 dark:text-violet-200/95" aria-hidden />
                  Hear Lumina voice
                </button>
              </motion.div>
            ) : null}

            {lastRefreshError?.trim() ? (
              <motion.div
                variants={iv}
                className="pt-4 [@media(min-height:900px)]:pt-6"
              >
                <p
                  role="status"
        className="rounded-xl bg-amber-500/[0.12] px-3 py-2 text-[0.7rem] font-medium leading-snug text-amber-950 dark:bg-amber-500/10 dark:text-amber-100"
                >
                  Lumina didn&apos;t respond just now—we&apos;re showing your last note.{" "}
                  <span className="opacity-85">{lastRefreshError.trim().slice(0, 160)}</span>
                  {lastRefreshError.trim().length > 160 ? "…" : ""}
                </p>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
