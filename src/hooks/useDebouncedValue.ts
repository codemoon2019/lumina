import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [stored, setStored] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setStored(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return stored;
}
