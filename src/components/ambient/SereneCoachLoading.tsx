import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SHORT_UPLIFTING_MESSAGES } from "@/data/shortUpliftingMessages";
import { pickRandomUnusedToday, rememberShownToday } from "@/utils/dailyShownMessages";

/**
 * Slow, tactile loading tuned for calming focus — honors `prefers-reduced-motion`.
 * Voice intentionally off here so Serene Wait stays ambient-only.
 */
export function SereneCoachLoading() {
  const reduceMotion = useReducedMotion();
  const whisperRef = useRef("");
  const [whisper, setWhisper] = useState("");
  const [phraseKey, setPhraseKey] = useState(0);

  useLayoutEffect(() => {
    const first = pickRandomUnusedToday(SHORT_UPLIFTING_MESSAGES);
    rememberShownToday(first);
    whisperRef.current = first;
    setWhisper(first);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      const next = pickRandomUnusedToday(SHORT_UPLIFTING_MESSAGES, whisperRef.current);
      rememberShownToday(next);
      whisperRef.current = next;
      setWhisper(next);
      setPhraseKey((k) => k + 1);
    }, 5200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const breathe = reduceMotion ? {} : { scale: [1, 1.1, 1] };
  const breatheTran = reduceMotion ? undefined : { duration: 6.8, repeat: Infinity, ease: [0.42, 0, 0.58, 1] };

  const drift = reduceMotion ? {} : { y: [-4, 4, -4], opacity: [0.85, 1, 0.85] };
  const driftTran = reduceMotion
    ? undefined
    : { duration: 9, repeat: Infinity, ease: "easeInOut" };

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-6 text-center md:gap-14">
      <div className="relative flex h-[min(320px,52vw)] w-full max-w-lg items-center justify-center">
        {/* Soft outer rings — higher contrast so they read on the frosted screen */}
        {!reduceMotion
          ? [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="pointer-events-none absolute aspect-square rounded-full border-2 border-violet-400/45 shadow-[0_0_24px_rgba(139,92,246,0.12)] dark:border-white/22 dark:shadow-[0_0_28px_rgba(255,255,255,0.06)]"
                style={{
                  width: `${44 + i * 16}%`,
                  maxWidth: "22rem",
                }}
                animate={{
                  scale: [1, 1.12 + i * 0.03, 1],
                  opacity: [0.38, 0.14 + i * 0.05, 0.38],
                }}
                transition={{
                  duration: 5.5 + i * 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.7,
                }}
              />
            ))
          : [0, 1, 2].map((i) => (
              <div
                key={i}
                className="pointer-events-none absolute aspect-square rounded-full border-2 border-violet-300/50 dark:border-white/20"
                style={{
                  width: `${44 + i * 16}%`,
                  maxWidth: "22rem",
                }}
              />
            ))}

        {/* Glow wash — larger + brighter center pool */}
        <motion.div
          className="pointer-events-none absolute h-52 w-52 rounded-full bg-gradient-to-br from-violet-400/70 via-fuchsia-300/55 to-amber-300/60 blur-3xl dark:from-indigo-400/45 dark:via-fuchsia-500/40 dark:to-amber-400/35"
          animate={drift}
          transition={driftTran}
          aria-hidden
        />

        {/* Core orb — bigger, richer glass + outer glow */}
        <motion.div
          className="relative h-32 w-32 rounded-full shadow-[inset_0_2px_28px_rgba(255,255,255,0.5),0_0_0_1px_rgba(255,255,255,0.35),0_28px_56px_-8px_rgba(91,73,217,0.45),0_0_80px_-12px_rgba(192,132,252,0.55)] dark:shadow-[inset_0_2px_24px_rgba(255,255,255,0.12),0_0_0_1px_rgba(255,255,255,0.12),0_28px_64px_-10px_rgba(99,102,241,0.5),0_0_100px_-8px_rgba(168,85,247,0.35)] md:h-36 md:w-36"
          style={{
            background:
              "radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.98),rgba(221,214,254,0.92)38%,rgba(251,207,232,0.9)68%,rgba(254,243,199,0.88))",
          }}
          animate={breathe}
          transition={breatheTran}
          aria-hidden
        >
          <div
            className="absolute inset-[16%] rounded-full bg-gradient-to-br from-white/85 to-transparent dark:from-white/25"
            aria-hidden
          />
          <motion.div
            className="absolute inset-0 rounded-full opacity-70 dark:opacity-55"
            style={{
              background:
                "conic-gradient(from 200deg,transparent,rgba(167,139,250,0.65),transparent 52%,transparent,rgba(56,189,248,0.5),transparent)",
            }}
            animate={reduceMotion ? {} : { rotate: [0, 360] }}
            transition={
              reduceMotion ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }
            }
            aria-hidden
          />
        </motion.div>

        {/* Spark flecks — slightly larger & brighter */}
        {!reduceMotion && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={`s-${i}`}
                className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.95)] dark:bg-amber-200 dark:shadow-[0_0_20px_rgba(252,211,77,0.85)]"
                style={{
                  top: `${38 + ((i * 43) % 60)}%`,
                  left: `${22 + ((i * 37) % 56)}%`,
                }}
                animate={{
                  opacity: [0.35, 1, 0.35],
                  scale: [0.8, 1.35, 0.9],
                  y: [0, i % 2 ? -16 : 12, 0],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                aria-hidden
              />
            ))}
          </>
        )}
      </div>

      {/* Whisper caption */}
      <div className="max-w-xl space-y-4 px-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.36em] text-violet-600/90 dark:text-violet-200/90 sm:text-xs">
          Serene wait
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseKey}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl font-medium leading-snug text-slate-900 dark:text-white sm:text-[1.75rem] md:text-[2rem]"
          >
            {whisper}
          </motion.p>
        </AnimatePresence>
        <motion.p
          className="text-base font-medium text-slate-700 dark:text-white/80"
          animate={reduceMotion ? {} : { opacity: [0.65, 1, 0.65] }}
          transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          Lumina’s reply is drifting in—no hurry.
        </motion.p>
      </div>

      {/* Indeterminate bar — track matches caption width; thumb sweeps true full line (40% wide → left 0%..60% covers 0–100%). */}
      <div className="relative h-[5px] w-full max-w-xl overflow-hidden rounded-full bg-violet-200/70 shadow-inner dark:bg-white/14">
        <motion.div
          className="absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-teal-400 shadow-[0_0_20px_rgba(139,92,246,0.45)] dark:from-violet-400 dark:via-fuchsia-400 dark:to-cyan-300 dark:shadow-[0_0_24px_rgba(167,139,250,0.4)]"
          animate={
            reduceMotion
              ? { left: "30%" }
              : {
                  /** -40%: leading edge off-screen left; 62%: trailing edge just past end for a soft “exit” */
                  left: ["-40%", "62%", "-40%"],
                  opacity: [0.65, 1, 0.65],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 4.2,
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                }
          }
          aria-hidden
        />
      </div>
    </div>
  );
}
