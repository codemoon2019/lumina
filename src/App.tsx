import { LayoutGroup } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { GrainOverlay, FloatingParticles } from "@/components/ambient/FloatingParticles";
import { ThemeBackgroundMotifs } from "@/components/ambient/ThemeBackgroundMotifs";
import { LuminaFirstMeeting } from "@/components/onboarding/LuminaFirstMeeting";
import { SereneCoachLoadingScreen } from "@/components/ambient/SereneCoachLoadingScreen";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { useClock } from "@/hooks/useClock";
import { useCoachBundle } from "@/hooks/useCoachBundle";
import { useLuminaIntro } from "@/hooks/useLuminaIntro";
import { useMinimumDurationHold } from "@/hooks/useMinimumDurationHold";
import { useTheme } from "@/hooks/useTheme";
import { SHORT_UPLIFTING_MESSAGES } from "@/data/shortUpliftingMessages";
import { HeroSection } from "@/sections/HeroSection";
import {
  personalizeMotivationLine,
  personalizeWithPreferredName,
} from "@/utils/luminaIntro";
import type { MoodId } from "@/utils/greeting";
import { getClockPart } from "@/utils/greeting";
import { comfortHeadlineOncePerErrorToday } from "@/utils/dailyShownMessages";

const INITIAL_LOAD_OVERLAY_MS = 3000;

const MOOD_LABELS: Record<MoodId, string> = {
  calm: "soft calm grounding",
  focused: "steady focused discipline",
  energized: "energized bright momentum",
  heavy: "tender heavy-hearted day",
  curious: "playful curious openness",
};

export default function App() {
  const { now } = useClock(30);
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

  const { introductionDone, preferredName, completeIntro } = useLuminaIntro();

  const coachThematicFocus = useMemo(() => {
    if (!introductionDone) return null;
    return [
      "Coach voice: kindly human texting — warm, grounded, calm, conversational (contractions ok); sincerity over polish.",
      "Short believable rhythms; mundane life grounded — no sparkly assistant script, melodrama, or clingy vows.",
      "No corporate chirp hustle therapy-clinical voice mystical fluff poster quotes or manipulating care.",
      "Align with onboarding spirit: kindness calm compassion quieter moments tiny steps humility not clinician.",
      "User should feel subtly welcomed clearer calmer emotionally safe.",
    ].join(" ");
  }, [introductionDone]);

  const nameForCoach = introductionDone ? (preferredName?.trim() ?? "") : "";

  const coach = useCoachBundle({
    moodLabel: MOOD_LABELS.calm,
    focus: coachThematicFocus,
    preferredName: nameForCoach || undefined,
  });

  useEffect(() => {
    if (!introductionDone) return;
    void coach.regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate identity only after intro unlock
  }, [introductionDone, coach.regenerate]);

  const clockBand = useMemo(() => getClockPart(now), [now]);

  const heroTodayLine = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now),
    [now],
  );

  const heroDedicationLine = useMemo(() => {
    const n = preferredName?.trim();
    if (n)
      /** Name already appears in Lumina's quote — avoid spelling it again here */
      return `For you, with tenderness.`;
    return `For whoever's listening.`;
  }, [preferredName]);

  const lightDawnPalette = useMemo(
    () => mode === "light" && clockBand === "evening",
    [mode, clockBand],
  );

  /** Hero lines come from Gemini; this only fills silence when Lumina failed with no greeting. */
  const headline = coach.payload?.greeting.trim() ?? "";
  const motivation = coach.payload?.motivation.trim() ?? "";

  const [comfortHeadline, setComfortHeadline] = useState("");

  useEffect(() => {
    if (!coach.error || headline.trim()) {
      setComfortHeadline("");
      return;
    }
    const line = comfortHeadlineOncePerErrorToday(coach.error, SHORT_UPLIFTING_MESSAGES);
    setComfortHeadline(line);
  }, [coach.error, headline]);

  const personalizedHeroHeadline = useMemo(
    () => personalizeWithPreferredName(preferredName, comfortHeadline || headline),
    [preferredName, comfortHeadline, headline],
  );

  const personalizedMotivation = useMemo(
    () =>
      motivation.trim()
        ? personalizeMotivationLine(preferredName, motivation, personalizedHeroHeadline)
        : "",
    [preferredName, motivation, personalizedHeroHeadline],
  );

  const waitingFirstReply =
    introductionDone &&
    !coach.payload?.greeting?.trim() &&
    (coach.status === "idle" || coach.status === "loading");

  const showFirstLoadOverlay = useMinimumDurationHold(waitingFirstReply, INITIAL_LOAD_OVERLAY_MS);

  return (
    <LayoutGroup>
      <div
        className="relative isolate flex min-h-dvh flex-col overflow-x-hidden text-slate-900 transition-colors duration-500 dark:text-white"
      >
        <div
          className={`absolute inset-0 -z-20 dark:bg-radiant-dark ${
            lightDawnPalette ? "bg-radiant-light-dawn" : "bg-radiant-light"
          }`}
        />
        <ThemeBackgroundMotifs />
        <FloatingParticles mode={mode} lightPalette={lightDawnPalette ? "dawn" : "day"} />
        <GrainOverlay warmLight={lightDawnPalette} />

        {/* First visit: conversational name + purpose before Lumina loads */}
        {!introductionDone ? (
          <div className="pointer-events-auto fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-white/76 px-4 py-[max(2rem,calc(env(safe-area-inset-top)+4rem))] pb-[max(2rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:bg-[rgba(11,13,26,0.82)] dark:backdrop-blur-md">
            <LuminaFirstMeeting onFinish={(name) => completeIntro(name)} />
          </div>
        ) : null}

        {introductionDone && showFirstLoadOverlay ? (
          <SereneCoachLoadingScreen />
        ) : null}

        {introductionDone ? (
          <Navbar isDark={isDark} toggleTheme={toggle} />
        ) : null}

        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-7 sm:px-6 sm:py-10 [@media(min-height:900px)]:py-12">
            {introductionDone && !showFirstLoadOverlay ? (
              <HeroSection
                preferredName={preferredName}
                todayLine={heroTodayLine}
                dedicationLine={heroDedicationLine}
                lastRefreshError={coach.status === "ready" ? coach.error : null}
                coachLoading={coach.status === "loading"}
                headline={personalizedHeroHeadline}
                subline={personalizedMotivation ? personalizedMotivation : null}
              />
            ) : null}
          </div>
        </main>

        {introductionDone ? (
          <div className="relative z-20 shrink-0">
            <Footer />
          </div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}
