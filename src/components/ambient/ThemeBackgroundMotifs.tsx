import { motion, useReducedMotion } from "framer-motion";
import { TbButterfly } from "react-icons/tb";

/** Fixed layout so SSR/client paint match; biased toward edges to stay out of hero focus */
const LIGHT_BUTTERFLIES: Array<{
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  sizeRem: number;
  duration: number;
  delay: number;
  rotate: number[];
}> = [
  {
    top: "3%",
    left: "4%",
    sizeRem: 3.65,
    duration: 34,
    delay: 0,
    rotate: [-14, 10, -8, 6, -10],
  },
  {
    top: "11%",
    right: "6%",
    sizeRem: 2.55,
    duration: 29,
    delay: 1.1,
    rotate: [8, -12, 6, -9, 7],
  },
  {
    top: "38%",
    left: "1%",
    sizeRem: 2.2,
    duration: 31,
    delay: 2.3,
    rotate: [-10, 8, -6, 5, -8],
  },
  {
    bottom: "28%",
    left: "5%",
    sizeRem: 3.1,
    duration: 36,
    delay: 0.6,
    rotate: [12, -8, 10, -11, 9],
  },
  {
    bottom: "12%",
    left: "18%",
    sizeRem: 2.4,
    duration: 27,
    delay: 2.9,
    rotate: [-9, 12, -7, 8, -6],
  },
  {
    bottom: "8%",
    right: "15%",
    sizeRem: 4.1,
    duration: 39,
    delay: 1.4,
    rotate: [10, -14, 8, -11, 6],
  },
  {
    top: "52%",
    right: "3%",
    sizeRem: 2.85,
    duration: 33,
    delay: 3.8,
    rotate: [-11, 7, -9, 5, -7],
  },
  {
    top: "72%",
    left: "10%",
    sizeRem: 2.15,
    duration: 30,
    delay: 4.2,
    rotate: [7, -10, 5, -6, 8],
  },
];

const STAR_SIZES_REM = [0.13, 0.075, 0.065, 0.11];

const STARS_SPEC = Array.from({ length: 56 }, (_, i) => ({
  /** pseudo-random but deterministic positions */
  left: ((i * 73 + 11) % 100) / 100,
  top: ((i * 47 + 19) % 100) / 100,
  size: STAR_SIZES_REM[i % STAR_SIZES_REM.length],
  duration: 2.8 + (i % 5) * 0.85,
  delay: (i * 0.31) % 4.8,
  /** mix cool star tones for dark radiant bg */
  warm: i % 7 === 0,
}));

export function ThemeBackgroundMotifs() {
  const reduced = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Light: soft butterflies */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_82%_70%_at_50%_45%,transparent_52%,rgba(255,253,251,0.45)_105%)]" />
        {LIGHT_BUTTERFLIES.map((b, i) => (
          <motion.div
            key={`bf-${i}`}
            className="absolute text-violet-500/[0.2] saturate-[1.15]"
            style={{
              top: b.top,
              bottom: b.bottom,
              left: b.left,
              right: b.right,
              fontSize: `${b.sizeRem}rem`,
              filter: "drop-shadow(0 1px 10px rgba(139,92,246,0.09))",
            }}
            initial={false}
            animate={
              reduced
                ? {}
                : {
                    y: [0, -18, 12, -8, 0],
                    x: [0, 12, -14, 8, 0],
                    rotate: b.rotate,
                  }
            }
            transition={
              reduced
                ? {}
                : {
                    repeat: Infinity,
                    duration: b.duration,
                    delay: b.delay,
                    ease: "easeInOut",
                  }
            }
          >
            <TbButterfly aria-hidden />
          </motion.div>
        ))}
      </div>

      {/* Dark: scattered stars */}
      <div className="absolute inset-0 hidden opacity-[0.88] dark:block">
        {/* gentle milky vignette keeps stars softer at center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_42%,transparent_42%,rgba(10,14,34,0.55)_108%)]" />
        <div className="absolute inset-0 mix-blend-screen">
          {STARS_SPEC.map((s, i) => (
            <motion.span
              key={`st-${i}`}
              className={`absolute rounded-full ${
                s.warm ? "bg-amber-200/90 shadow-[0_0_12px_rgba(253,230,138,0.45)]" : "bg-white/85 shadow-[0_0_14px_rgba(196,181,254,0.35)]"
              }`}
              style={{
                left: `${s.left * 100}%`,
                top: `${s.top * 100}%`,
                width: `${s.size}rem`,
                height: `${s.size}rem`,
              }}
              initial={false}
              animate={
                reduced
                  ? {}
                  : {
                      opacity: [0.28, s.warm ? 0.95 : 1, 0.32, 0.55],
                      scale: [1, s.warm ? 1.15 : 1.25, 1, 1.05],
                    }
              }
              transition={
                reduced
                  ? {}
                  : {
                      repeat: Infinity,
                      duration: s.duration,
                      delay: s.delay,
                      ease: "easeInOut",
                    }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
