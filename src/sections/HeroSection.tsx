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

  const borderAccent =
    luminaSpeaking && reduceMotion
      ? "border-teal-400/45 dark:border-teal-400/28"
      : "border-rose-100/55 dark:border-violet-400/25";

  const showEchoRipples = luminaSpeaking && !reduceMotion;
  const echoBreath = luminaSpeakingEchoBreathMotion(showEchoRipples);

  return (
    /** `pb-*` stays on section, not inner echo root: ripples are `absolute` and ignore flow — inner `pb-*` only stretches the halo past the shell. */
    <motion.section layout className="relative z-10 mx-auto w-full max-w-6xl overflow-visible pb-11">
      <div className="relative overflow-visible">
        <LuminaSpeakingEchoRipples show={showEchoRipples} roundClassName={ROUND_SHELL} />

        <motion.div
          layout
          className={`relative z-[1] overflow-hidden border bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(253,246,251,0.55))] p-px shadow-[0_26px_80px_-34px_rgba(139,92,246,0.42),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-3xl dark:bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] dark:shadow-[0_32px_100px_-38px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] ${ROUND_SHELL} ${borderAccent}`}
          animate={echoBreath.animate}
          transition={echoBreath.transition}
        >
        <div
          className="relative z-[2] rounded-[calc(1.85rem-1px)] bg-gradient-to-br from-rose-50/93 via-[#faf6ff]/98 to-teal-50/86 px-5 py-6 dark:from-[#1a1428]/98 dark:via-[#0d101f]/98 dark:to-[#0a1822]/96 sm:rounded-[calc(2.35rem-1px)] sm:px-7 sm:py-8 md:px-9 md:py-9 [@media(min-height:900px)]:lg:rounded-[calc(3rem-1px)] [@media(min-height:900px)]:lg:px-10 [@media(min-height:900px)]:lg:py-11"
        >
          <div className="pointer-events-none absolute -right-[18%] -top-[10%] h-[24rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(244,173,226,0.35)_0%,rgba(237,217,255,0.22)_42%,transparent_72%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(167,139,250,0.22)_0%,rgba(99,102,241,0.08)_45%,transparent_72%)]" />
          <div className="pointer-events-none absolute -bottom-[12%] -left-[14%] h-[20rem] w-[21rem] rounded-full bg-[radial-gradient(circle,rgba(191,239,229,0.55)_0%,transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(45,212,191,0.16)_0%,rgba(34,211,238,0.06)_40%,transparent_70%)]" />
          <div className="pointer-events-none absolute left-1/2 top-[20%] h-[14rem] w-[min(72%,28rem)] -translate-x-1/2 rounded-full bg-amber-100/35 blur-3xl dark:bg-[radial-gradient(circle,rgba(244,114,182,0.12)_0%,transparent_65%)]" />

          {/* oversized quote ambience — sits behind the reading column */}
          <div
            aria-hidden
            className={`pointer-events-none absolute left-4 font-display leading-none text-[#c9b9e8]/70 dark:text-violet-400/38 sm:left-7 ${hasNote ? "top-[4.1rem] text-[clamp(3.1rem,10.5vw,6.5rem)] [@media(min-height:900px)]:top-[5.15rem] [@media(min-height:900px)]:text-[clamp(4.5rem,14vw,8.5rem)]" : "top-28 text-5xl"}`}
          >
            “
          </div>

          <motion.div
            className="relative z-[1] flex w-full flex-col gap-5 [@media(min-height:900px)]:gap-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={iv} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-300/45 bg-white/78 px-2.5 py-1 text-[0.58rem] font-bold uppercase leading-tight tracking-[0.38em] text-violet-800 shadow-[0_2px_12px_-4px_rgba(139,92,246,0.35)] backdrop-blur-sm dark:border-violet-300/35 dark:bg-white/[0.07] dark:text-violet-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_40px_-18px_rgba(0,0,0,0.55)] [@media(min-height:900px)]:gap-2 [@media(min-height:900px)]:px-3 [@media(min-height:900px)]:py-[0.35rem] [@media(min-height:900px)]:text-[0.63rem]">
                <RiSparklingLine className="shrink-0 text-[0.98rem] text-teal-600 dark:text-teal-200 [@media(min-height:900px)]:text-[1.06rem]" aria-hidden />
                Today’s message from Lumina
              </span>
              {todayLine ? (
                <p className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/65 sm:text-right [@media(min-height:900px)]:text-[0.7rem]">
                  {todayLine}
                </p>
              ) : null}
            </motion.div>

            {dedicationLine ? (
              <motion.div variants={iv} className="relative mx-auto w-full max-w-3xl lg:mx-0">
                <p className="font-display text-[0.875rem] font-normal italic leading-snug tracking-wide text-slate-800 dark:text-white/85 [@media(min-height:900px)]:text-[1.02rem]">
                  {dedicationLine}
                </p>
              </motion.div>
            ) : null}

            <motion.div variants={iv} className="relative mx-auto w-full max-w-3xl lg:mx-0">
              <h1
                className={
                  hasNote
                    ? `relative mt-1 pl-[1.25rem] font-display text-[clamp(1.35rem,min(4.25vw,5.5dvh),2.85rem)] font-normal tracking-[-0.02em] text-slate-950 before:absolute before:left-0 before:top-[0.15em] before:h-[calc(100%-0.3em)] before:w-[2.5px] before:rounded-full before:bg-gradient-to-b before:from-violet-500 before:via-fuchsia-500 before:to-teal-500 before:shadow-[0_0_18px_rgba(167,139,250,0.45)] sm:mt-1.5 sm:pl-[1.35rem] md:pl-7 dark:text-white dark:before:from-violet-400 dark:before:via-fuchsia-400 dark:before:to-teal-400 dark:before:shadow-[0_0_24px_rgba(167,139,250,0.35)] ${isDualSource ? "leading-[1.14]" : "leading-[1.08]"} [@media(min-height:900px)]:mt-2 [@media(min-height:900px)]:pl-8 [@media(min-height:900px)]:text-[clamp(1.65rem,4.5vw,3.75rem)] [@media(min-height:900px)]:before:w-1`
                    : "mt-1 font-sans text-base font-medium leading-snug text-slate-600 dark:text-white/80 [@media(min-height:900px)]:mt-2 [@media(min-height:900px)]:text-lg"
                }
              >
                {hasNote ? mergedNote : "Lumina is gathering a softer line…"}
              </h1>
            </motion.div>

            {hasNote ? (
              <motion.div variants={iv} className="relative mx-auto mt-4 w-full max-w-3xl lg:mx-0">
                <button
                  type="button"
                  aria-label="Hear Lumina read this message aloud"
                  disabled={coachLoading || luminaSpeaking}
                  onClick={onHearLuminaVoice}
                  className="inline-flex min-h-[2.875rem] w-full cursor-pointer flex-wrap items-center justify-center gap-2 rounded-full border border-violet-300/55 bg-gradient-to-r from-white/92 via-teal-50/75 to-white/92 px-5 py-2.5 text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-violet-900 shadow-soft transition hover:border-violet-400/85 hover:bg-white disabled:pointer-events-none disabled:opacity-50 dark:border-white/16 dark:from-[#1c1830]/90 dark:via-teal-950/35 dark:to-[#141028]/92 dark:text-violet-100 dark:hover:bg-white/[0.08] sm:w-auto [@media(min-height:900px)]:tracking-[0.22em]"
                >
                  <RiVolumeUpLine className="shrink-0 text-lg text-teal-600 dark:text-teal-200/95" aria-hidden />
                  Hear Lumina voice
                </button>
              </motion.div>
            ) : null}

            {lastRefreshError?.trim() ? (
              <motion.div
                variants={iv}
                className="border-t border-rose-200/55 pt-4 dark:border-white/[0.12] [@media(min-height:900px)]:pt-6"
              >
                <p
                  role="status"
                  className="rounded-xl border border-amber-600/35 bg-amber-500/[0.12] px-3 py-2 text-[0.7rem] font-medium leading-snug text-amber-950 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-100"
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
