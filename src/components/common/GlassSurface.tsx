import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";
import type { Transition } from "framer-motion";

const spring: Transition = { type: "spring", stiffness: 128, damping: 20 };

interface GlassSurfaceProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  glow?: boolean;
}

export function GlassSurface({ eyebrow, title, subtitle, children, glow }: GlassSurfaceProps) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={spring}
      className={`relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/5 p-8 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-lift md:p-10 ${
        glow ? "ring-1 ring-purple-200/65 dark:ring-white/25" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2.25rem-1px)] border border-transparent bg-[linear-gradient(to_bottom,rgba(255,255,255,0.45),transparent)] opacity-[0.12] dark:opacity-[0.18]" />
      <div className="relative flex flex-col gap-5">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.42em] text-purple-600/95 dark:text-white/45">{eyebrow}</p>
        ) : null}
        <header className="space-y-2">
          <h3 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white md:text-[2.15rem]">
            {title}
          </h3>
          {subtitle ? <p className="text-sm leading-relaxed text-slate-500 dark:text-white/63">{subtitle}</p> : null}
        </header>
        <div>{children}</div>
      </div>
    </motion.section>
  );
}
