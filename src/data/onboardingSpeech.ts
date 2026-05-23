/** Plain-language strings passed to Speech Synthesis (keep in sync with onboarding UI). */

export function onboardingFirstStepSpeech(): string {
  return [
    "Hi — I'm Lumina.",
    "I'm really glad you're here. Before anything else, I'd love to know what to call you — it feels nicer when we can speak a little more personally.",
    "What name would you like me to use for you?",
  ].join(" ");
}

export function onboardingPurposeSpeechChunks(displayName: string): string[] {
  const dn = displayName.trim() || "there";
  return [
    `Lovely to meet you, ${dn}.`,
    `I'm Lumina. I was created with a simple hope in mind: to bring a little more kindness, calm, and compassion into people's everyday lives.`,
    [
      `I'm here for the quieter moments — slow mornings, heavy weeks, or times when everything feels a bit louder than usual.`,
      `A gentle check-in, a little reassurance, and small next steps when the bigger picture feels overwhelming.`,
    ].join(" "),
    `I'm not therapy or a clinician. Think of me more as a soft place to land for a moment, breathe, and keep moving forward — gently, one step at a time.`,
  ];
}
