import { motion } from "framer-motion";

const LIGHT_BLOBS_DAY = [
  "from-sky-400/55",
  "from-purple-400/55",
  "from-orange-400/45",
  "from-pink-400/45",
];

/** Softer peach, honey, and rose — pairs with `bg-radiant-light-dawn` when it’s evening but theme is light */
const LIGHT_BLOBS_DAWN = [
  "from-amber-200/65",
  "from-orange-200/55",
  "from-rose-300/50",
  "from-amber-100/60",
];

const DARK_BLOBS = ["from-violet-500/40", "from-indigo-500/28", "from-cyan-400/22", "from-fuchsia-500/18"];

export function FloatingParticles({
  mode,
  lightPalette = "day",
}: {
  mode: "light" | "dark";
  lightPalette?: "day" | "dawn";
}) {
  const blobs =
    mode === "dark"
      ? DARK_BLOBS
      : lightPalette === "dawn"
        ? LIGHT_BLOBS_DAWN
        : LIGHT_BLOBS_DAY;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-85 dark:opacity-[0.52]">
      {blobs.map((gradient, idx) => (
        <motion.span
          key={`${gradient}-${idx}`}
          className={`absolute h-72 w-72 rounded-full bg-gradient-to-br blur-3xl ${gradient}`}
          style={{
            top: `${8 + idx * 16}%`,
            left: `${4 + idx * 18}%`,
            mixBlendMode: mode === "dark" ? "screen" : lightPalette === "dawn" ? "soft-light" : "multiply",
          }}
          animate={{
            y: [-12, 12, -8],
            x: [-14, 8, -6],
            scale: [1, 1.08, 0.94],
          }}
          transition={{
            repeat: Infinity,
            duration: 12 + idx * 2,
            ease: "easeInOut",
            delay: idx * 1.25,
          }}
        />
      ))}
    </div>
  );
}

export function GrainOverlay({ warmLight = false }: { warmLight?: boolean } = {}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.085] dark:opacity-[0.068]"
      style={{
        mixBlendMode: "soft-light",
      }}
    >
      <div
        className={`h-full w-full rounded-[inherit] ${
          warmLight
            ? "bg-[radial-gradient(circle_at_center,transparent_58%,rgba(120,74,48,0.11)_100%)]"
            : "bg-[radial-gradient(circle_at_center,transparent_60%,rgba(15,23,42,0.45)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_45%,rgba(36,31,71,0.65)_110%)]"
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)] dark:bg-[linear-gradient(to_bottom,rgba(139,92,246,0.06),transparent_55%)]" />
    </div>
  );
}
