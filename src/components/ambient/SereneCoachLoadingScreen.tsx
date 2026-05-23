import { SereneCoachLoading } from "@/components/ambient/SereneCoachLoading";

/**
 * Full-viewport gentle loading surface — navbar should sit above (higher z-index).
 */
export function SereneCoachLoadingScreen() {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex flex-col bg-white/82 backdrop-blur-xl dark:bg-[rgba(12,17,34,0.88)] [&::before]:pointer-events-none [&::before]:absolute [&::before]:inset-0 [&::before]:bg-[radial-gradient(ellipse_85%_60%_at_50%_42%,rgba(196,181,254,0.35),transparent_58%)] dark:[&::before]:bg-[radial-gradient(ellipse_85%_55%_at_50%_40%,rgba(129,140,248,0.28),transparent_55%)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Lumina — preparing your message"
    >
      <div className="flex flex-1 items-center justify-center px-6 pt-[max(6rem,calc(env(safe-area-inset-top)+4.5rem))] pb-[max(5rem,env(safe-area-inset-bottom))]">
        <SereneCoachLoading />
      </div>
    </div>
  );
}
