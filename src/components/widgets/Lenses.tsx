import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PiPauseBold, PiPlayBold } from "react-icons/pi";

const BREATH = [
  { label: "Inhale slowly", subtitle: "Let ribs expand sideways", ms: 5000 },
  { label: "Hold gently", subtitle: "No strain—sip stillness", ms: 3000 },
  { label: "Exhale longer", subtitle: "Melt shoulders down your back", ms: 5500 },
];

export function BreathingOrb({ mode }: { mode: "light" | "dark" }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setIdx((p) => (p + 1) % BREATH.length), BREATH[idx]?.ms ?? 4000);
    return () => window.clearTimeout(id);
  }, [idx]);

  const phase = BREATH[idx];
  const gradient =
    mode === "dark"
      ? "from-purple-700/95 via-sky-500/90 to-orange-400/85"
      : "from-sky-300/95 via-purple-400/90 to-orange-300/85";

  const scalePulse =
    phase.label === "Inhale slowly" ? 1.12 : phase.label === "Hold gently" ? 1.1 : 0.94;

  return (
    <div className="glass relative overflow-hidden rounded-[2.75rem] p-8 md:p-10">
      <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-xs uppercase tracking-[0.38em] text-purple-700/95 dark:text-white/45">
            Nervous system invite
          </p>
          <h3 className="font-display text-3xl text-slate-900 dark:text-white">Breathing prism</h3>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-white/65">
            The orb follows you—no perfection required, only honest breath.
          </p>
          <p className="text-base font-medium text-slate-800 dark:text-white/90">{phase.subtitle}</p>
        </div>
        <div className="relative flex h-64 w-64 items-center justify-center">
          <motion.div
            animate={{ scale: scalePulse, opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: (phase.ms ?? 4000) / 1000, ease: "easeInOut" }}
            className={`absolute h-48 w-48 rounded-full bg-gradient-to-br ${gradient} blur-md`}
          />
          <motion.div
            key={phase.label}
            initial={{ scale: 0.92, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-full bg-gradient-to-br ${gradient} px-6 text-center text-white shadow-soft`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/80">Now</span>
            <span className="font-display text-2xl leading-tight">{phase.label}</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function PomodoroLens() {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress = 1 - secondsLeft / (25 * 60);

  return (
    <div className="glass relative rounded-[2.5rem] p-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.42em] text-slate-500 dark:text-white/45">
          Rhythm ritual
        </p>
        <h3 className="font-display text-3xl text-slate-900 dark:text-white">Pomodoro lens</h3>
        <p className="text-sm text-slate-500 dark:text-white/60">
          One sprint. Phone face-down. Let future-you celebrate this tiny victory.
        </p>
      </header>
      <div className="mt-8 flex flex-col items-center gap-6">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <motion.div
            className="absolute inset-2 rounded-[1.8rem] bg-gradient-to-br from-orange-400/90 via-purple-500/92 to-sky-500/92 opacity-40 blur-lg"
            animate={{ scale: running ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: running ? Infinity : 0, duration: 4, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex h-48 w-48 flex-col items-center justify-center rounded-[1.8rem] border border-white/25 bg-gradient-to-br from-slate-900/90 via-purple-900/85 to-sky-700/90 text-white shadow-lift dark:from-slate-950/90"
            style={{ rotate: 0 }}
          >
            <svg className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.12)" strokeWidth="6" fill="none" />
              <motion.circle
                cx="50"
                cy="50"
                r="44"
                stroke="url(#pomo)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={276}
                initial={{ strokeDashoffset: 276 }}
                animate={{ strokeDashoffset: 276 * (1 - progress) }}
                transition={{ duration: 0.35, ease: "linear" }}
              />
              <defs>
                <linearGradient id="pomo" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#fbbf24" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <span className="relative font-display text-4xl tracking-tight">
              {minutes}:{seconds}
            </span>
          </motion.div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-800 shadow-soft transition hover:-translate-y-0.5 dark:border-white/20 dark:bg-white/10 dark:text-white"
          >
            {running ? <PiPauseBold className="text-lg" aria-hidden /> : <PiPlayBold className="text-lg" />}
            {running ? "pause" : "begin"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(25 * 60);
            }}
            className="rounded-full border border-slate-200/70 px-5 py-2 text-xs uppercase tracking-[0.28em] text-slate-600 transition hover:-translate-y-0.5 dark:border-white/30 dark:text-white/80"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
