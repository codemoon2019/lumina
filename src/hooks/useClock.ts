import { useEffect, useMemo, useState } from "react";

export function useClock(tickSeconds = 1) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), Math.max(tickSeconds, 1) * 1000);
    return () => window.clearInterval(id);
  }, [tickSeconds]);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now),
    [now],
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(now),
    [now],
  );

  return { now, formattedDate, formattedTime };
}
