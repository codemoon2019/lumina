import { motion } from "framer-motion";
import { TbCloudRain } from "react-icons/tb";

export function WeatherStrip({ label, tempC }: { label: string; tempC: number }) {
  return (
    <motion.div
      layout
      className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200/70 bg-white/75 px-6 py-4 text-sm text-slate-600 shadow-soft dark:border-white/10 dark:bg-white/8 dark:text-white/75"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-xl text-white">
          <TbCloudRain aria-hidden />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400 dark:text-white/45">
            Atmospheric touch
          </p>
          <p className="text-base font-semibold text-slate-800 dark:text-white">{label}</p>
        </div>
      </div>
      <div className="text-right font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        {Math.round(tempC)}°
        <span className="block text-[11px] font-sans uppercase tracking-[0.3em] text-slate-400 dark:text-white/45">
          celsius whisper
        </span>
      </div>
    </motion.div>
  );
}
