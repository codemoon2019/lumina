import { motion } from "framer-motion";

interface NavbarProps {
  toggleTheme: () => void;
  isDark: boolean;
}

export function Navbar({ toggleTheme, isDark }: NavbarProps) {
  return (
    <motion.header
      layout
      className="relative z-[60] mx-auto mt-5 flex w-full max-w-6xl shrink-0 items-center justify-between gap-4 px-4 pb-1 sm:mt-6 sm:gap-6 sm:px-6 lg:mt-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 via-violet-500 to-orange-400 text-sm font-semibold text-slate-950 shadow-[0_8px_24px_-6px_rgba(167,139,250,0.65)] sm:h-11 sm:w-11">
          L
        </div>
        <div>
          <p className="font-display text-lg leading-tight text-slate-900 dark:text-white sm:text-xl">Lumina</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-600 shadow-soft backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-purple-400/55 dark:border-white/[0.14] dark:bg-white/[0.06] dark:text-white/[0.82] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-violet-400/35 dark:hover:bg-white/[0.1]"
          aria-label="Toggle theme"
        >
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </motion.header>
  );
}
