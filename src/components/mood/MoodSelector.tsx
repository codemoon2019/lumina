import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { MoodId } from "@/utils/greeting";
import {
  TbAdjustmentsBolt,
  TbBatteryCharging,
  TbCloudBolt,
  TbLeaf,
  TbSunrise,
} from "react-icons/tb";

interface MoodChip {
  id: MoodId;
  label: string;
  cue: string;
  icon: ReactNode;
}

const moods: MoodChip[] = [
  { id: "calm", label: "Quiet ease", cue: "Centered softness", icon: <TbLeaf /> },
  { id: "focused", label: "Laser mind", cue: "Momentum mode", icon: <TbAdjustmentsBolt /> },
  {
    id: "energized",
    label: "Spark ignite",
    cue: "Momentum bright",
    icon: <TbSunrise className="-rotate-3" />,
  },
  { id: "heavy", label: "Honor weight", cue: "Gentle repair", icon: <TbCloudBolt /> },
  { id: "curious", label: "Open wonder", cue: "Playfulness", icon: <TbBatteryCharging /> },
];

export function MoodSelector({
  selected,
  onSelect,
}: {
  selected: MoodId | null;
  onSelect: (mood: MoodId) => void;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.42em] text-slate-500 dark:text-white/45">
            Pulse check-in
          </p>
          <h3 className="mt-2 font-display text-2xl text-slate-900 dark:text-white md:text-[1.95rem]">
            How luminous do you feel?
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-white/60">
            This steers prompts—warmth over generic rah-rah. Nothing is clinically diagnostic—just gentle
            attunement.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {moods.map((mood, index) => {
          const active = selected === mood.id;
          return (
            <motion.button
              layout
              type="button"
              key={mood.id}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(mood.id)}
              className={`group relative flex flex-1 min-w-[10.5rem] flex-col rounded-2xl border px-5 py-4 text-left transition ${
                active
                  ? "border-purple-400/85 bg-white/92 text-slate-900 shadow-soft dark:border-white/65 dark:bg-gradient-to-br dark:from-purple-700/85 dark:to-sky-500/85 dark:text-white"
                  : "border-slate-200/85 bg-white/70 text-slate-700 hover:border-purple-300/85 dark:border-white/10 dark:bg-white/10 dark:text-white/90 dark:hover:border-white/35"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-lg text-purple-500 dark:text-white/95">{mood.icon}</span>
              <span className="mt-4 text-[11px] uppercase tracking-[0.32em] text-slate-400 dark:text-white/45">
                {mood.cue}
              </span>
              <span className="mt-2 font-semibold">{mood.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
