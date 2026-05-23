import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TbFlame, TbTarget } from "react-icons/tb";

const KEY = "lumina.dailyQuests.v1";

interface Payload {
  goals: string[];
  streak: number;
  last: string; // YYYY-MM-DD local
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load(): Payload {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    return JSON.parse(raw) as Payload;
  } catch {
    return { goals: ["", "", ""], streak: 0, last: todayKey() };
  }
}

function save(p: Payload) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function DailyQuests() {
  const [payload, setPayload] = useState<Payload>(() => load());

  useEffect(() => {
    save(payload);
  }, [payload]);

  const computedStreak = useMemo(() => payload.streak, [payload.streak]);

  const updateGoal = (index: number, value: string) => {
    setPayload((prev) => {
      const goals = [...prev.goals];
      goals[index] = value;
      return { ...prev, goals };
    });
  };

  const completeDay = () => {
    setPayload((prev) => {
      const today = todayKey();
      if (prev.last === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      const nextStreak = prev.last === yKey ? prev.streak + 1 : 1;
      return { ...prev, streak: nextStreak, last: today };
    });
  };

  return (
    <div className="glass relative overflow-hidden rounded-[2.75rem] p-8 md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-lg space-y-3">
          <p className="text-xs uppercase tracking-[0.38em] text-slate-500 dark:text-white/45">
            Micro commitments
          </p>
          <h3 className="font-display text-3xl text-slate-900 dark:text-white">Daily focus board</h3>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-white/65">
            Three tiny objectives only. Completing them is optional—showing up to name them is already brave.
          </p>
        </div>
        <motion.div
          layout
          className="flex items-center gap-4 rounded-[1.75rem] border border-orange-200/70 bg-gradient-to-br from-orange-300/60 via-pink-300/60 to-purple-400/60 px-6 py-4 text-slate-900 shadow-soft dark:border-white/10 dark:from-orange-500/25 dark:via-pink-500/25 dark:to-purple-600/45 dark:text-white"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-orange-600 dark:bg-white/10 dark:text-orange-200">
            <TbFlame className="text-2xl" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-600/80 dark:text-white/60">
              Kind streak
            </p>
            <p className="font-display text-3xl">{computedStreak}</p>
          </div>
        </motion.div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((slot) => (
          <label key={slot} className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.32em] text-slate-400 dark:text-white/45">
              Win {slot + 1}
            </span>
            <div className="relative">
              <TbTarget className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/80 dark:text-purple-200/80" />
              <input
                value={payload.goals[slot] ?? ""}
                onChange={(e) => updateGoal(slot, e.target.value)}
                placeholder="Name a win sized for today"
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 py-3 pl-12 pr-4 text-sm text-slate-800 shadow-inner outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-200/80 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </label>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={completeDay}
          className="inline-flex items-center gap-2 rounded-full border border-purple-300/70 bg-gradient-to-r from-purple-600/90 to-sky-500/90 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-soft transition hover:-translate-y-0.5"
        >
          Log today as intentionally shown up
        </button>
        <span className="text-xs text-slate-500 dark:text-white/55">
          This does not delete goals—just honors your streak calendar.
        </span>
      </div>
    </div>
  );
}
