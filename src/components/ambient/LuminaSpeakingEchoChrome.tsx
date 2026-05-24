import { useSyncExternalStore } from "react";

import { motion } from "framer-motion";

function subscribeDarkClass(listener: () => void): () => void {
  if (typeof document === "undefined") return () => undefined;
  const el = document.documentElement;
  const mo = new MutationObserver(listener);
  mo.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function snapshotDarkClass(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/** Tracks `<html class="dark">` without tying to `useTheme` state duplication in deep trees */
export function useHtmlDocumentIsDark(): boolean {
  return useSyncExternalStore(subscribeDarkClass, snapshotDarkClass, () => false);
}

const RIPPLE_TIMES = [0, 0.58, 1] as const;

const echoRippleShellVariants = {
  /** Slightly slower / softer on exit so halos don’t pop off */
  hidden: {
    opacity: 0,
    transition: { opacity: { duration: 0.9, ease: [0.4, 0, 0.2, 1] as const } },
  },
  visible: {
    opacity: 1,
    transition: { opacity: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
  },
} as const;

/** Subtle swell on whatever shell wraps the echoes (pairs with ripples behind glass). */
export function luminaSpeakingEchoBreathMotion(showEcho: boolean) {
  return {
    animate: showEcho ? { scale: [1, 1.00085, 0.99995, 1] } : { scale: 1 },
    transition: showEcho
      ? {
          repeat: Infinity,
          duration: 6,
          times: [0, 0.38, 0.72, 1],
          ease: [0.42, 0, 0.58, 1],
          repeatDelay: 3,
        }
      : { duration: 0.52, ease: [0.4, 0, 0.2, 1] },
  };
}

export interface LuminaSpeakingEchoRipplesProps {
  show: boolean;
  /** Exact Tailwind rounding string on the card (e.g. `rounded-[2.25rem]`) — ripples inherit shape */
  roundClassName: string;
  /** How far echoes bleed past the shell (Tailwind inset negative margin) */
  bleedClassName?: string;
}

/**
 * Staggered halo rings shown **behind** a translucent shell while `useLuminaSpeaking()` is true.
 */
export function LuminaSpeakingEchoRipples({
  show,
  roundClassName,
  bleedClassName = "-inset-5",
}: LuminaSpeakingEchoRipplesProps) {
  const isDark = useHtmlDocumentIsDark();

  const echoPalette = {
    rim: isDark ? "rgba(52,239,229,0.38)" : "rgba(38,207,178,0.48)",
    glow: isDark ? "rgba(167,139,250,0.22)" : "rgba(139,92,246,0.18)",
  };

  return (
    <motion.div
      /** Keep mounted so opacity can ease out instead of unmounting (`return null`) */
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      variants={echoRippleShellVariants}
      className={`pointer-events-none absolute isolate z-0 ${bleedClassName} ${roundClassName}`}
      aria-hidden
    >
      {[0, 1, 2].map((wave) => (
        <motion.div
          key={wave}
          className={`absolute inset-1 ${roundClassName}`}
          style={{
            transformOrigin: "50% 50%",
            border: `1.5px solid ${echoPalette.rim}`,
            boxShadow: `0 0 26px ${echoPalette.glow}, inset 0 0 22px rgba(45,212,191,${isDark ? 0.03 : 0.045})`,
          }}
          /** Pause ring keyframes while fully hidden to avoid invisible work */
          animate={
            show
              ? {
                  scale: [1, 1.03, 1.065],
                  opacity: [0.34, 0.17, 0],
                  y: [0, 1.75, -0.85],
                }
              : { scale: 1, opacity: 0, y: 0 }
          }
          transition={
            show
              ? {
                  duration: 5.85,
                  repeat: Infinity,
                  delay: wave * 1.55,
                  times: [...RIPPLE_TIMES],
                  ease: [0.4, 0, 0.6, 1],
                  repeatDelay: 2.25,
                }
              : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
          }
        />
      ))}
    </motion.div>
  );
}
