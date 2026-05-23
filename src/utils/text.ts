export function initialsFromSentence(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function shorten(text: string, max = 90) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}
