import { motion } from "framer-motion";
import { TbHeartHandshake, TbBolt, TbSunLow } from "react-icons/tb";

import { GlassSurface } from "@/components/common/GlassSurface";

export function InsightGrid({
  motivation,
  affirmation,
  productivityTip,
  gratitudePrompt,
}: {
  motivation?: string | null;
  affirmation?: string | null;
  productivityTip?: string | null;
  gratitudePrompt?: string | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlassSurface
        eyebrow="Daily lift"
        title="Motivation radiance"
        subtitle="A single sentence to align your nervous system with forward motion."
        glow
      >
        <div className="flex items-start gap-4">
          <motion.span
            animate={{ rotate: [-3, 3, -2] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/90 to-purple-500/90 text-white shadow-soft"
            aria-hidden
          >
            <TbSunLow className="text-2xl" />
          </motion.span>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-white/90 md:text-xl">
            {motivation || "Small progress is still sacred progress."}
          </p>
        </div>
      </GlassSurface>

      <GlassSurface
        eyebrow="Belief layer"
        title="Affirmation pulse"
        subtitle="Repeat quietly—let it land in bones, not just intellect."
      >
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-300/85 bg-purple-500/90 text-white shadow-soft dark:bg-gradient-to-br dark:from-purple-600/95 dark:to-sky-500/90">
            <TbHeartHandshake className="text-2xl" aria-hidden />
          </span>
          <blockquote className="relative text-lg italic leading-relaxed text-slate-700 dark:text-white/86 md:text-xl">
            {affirmation || "Your future self is already proud of today's softness."}
          </blockquote>
        </div>
      </GlassSurface>

      <GlassSurface
        eyebrow="Micro momentum"
        title="Production cadence"
        subtitle="Twenty focused minutes outperform eight distracted hours."
      >
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/95 via-pink-500/90 to-purple-700/95 text-white shadow-soft">
            <TbBolt className="text-xl" aria-hidden />
          </span>
          <p className="text-lg leading-relaxed text-slate-700 dark:text-white/88">{productivityTip}</p>
        </div>
      </GlassSurface>

      <GlassSurface
        eyebrow="Soul inventory"
        title="Gratitude prompt"
        subtitle="Honor one detail that supported you already today."
      >
        <motion.p layout className="rounded-2xl border border-dashed border-purple-300/75 bg-white/80 p-5 text-lg text-slate-700 dark:border-white/20 dark:bg-white/5 dark:text-white/88">
          {gratitudePrompt}
        </motion.p>
      </GlassSurface>
    </div>
  );
}
