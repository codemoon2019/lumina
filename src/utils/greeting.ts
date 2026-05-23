export type MoodId = "calm" | "focused" | "energized" | "heavy" | "curious";

export function getClockPart(date: Date) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning" as const;
  if (h >= 12 && h < 17) return "afternoon" as const;
  return "evening" as const;
}

export function getEmojiForClock(clock: ReturnType<typeof getClockPart>) {
  switch (clock) {
    case "morning":
      return "☀️";
    case "afternoon":
      return "🌤️";
    default:
      return "🌙";
  }
}

export function getDisplayGreeting(now: Date) {
  const part = getClockPart(now);
  const label =
    part === "morning"
      ? "Good morning"
      : part === "afternoon"
        ? "Good afternoon"
        : "Good evening";
  return `${label}`;
}
