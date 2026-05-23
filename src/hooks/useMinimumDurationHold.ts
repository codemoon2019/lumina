import { useEffect, useRef, useState } from "react";

/**
 * When `signal` is true → output true.
 * After `signal` becomes false → output stays true until at least `minMs`
 * has passed since `signal` first became true in this episode (smooth minimum dwell).
 */
export function useMinimumDurationHold(signal: boolean, minMs: number): boolean {
  const startRef = useRef<number | null>(null);
  const [held, setHeld] = useState(signal);

  useEffect(() => {
    if (signal) {
      if (startRef.current === null) startRef.current = Date.now();
      setHeld(true);
      return undefined;
    }

    const start = startRef.current;
    if (start === null) {
      setHeld(false);
      return undefined;
    }

    const remaining = Math.max(0, minMs - (Date.now() - start));
    const id = window.setTimeout(() => {
      setHeld(false);
      startRef.current = null;
    }, remaining);

    return () => window.clearTimeout(id);
  }, [signal, minMs]);

  return held;
}
