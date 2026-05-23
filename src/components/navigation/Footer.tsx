import { AiFillHeart } from "react-icons/ai";

export function Footer() {
  return (
    <footer className="relative mx-auto w-full max-w-6xl shrink-0 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 text-center sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-5 [@media(min-height:900px)]:pt-6 [@media(min-height:900px)]:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[0.8rem] font-medium leading-tight text-slate-600 dark:text-white/[0.88] [@media(min-height:900px)]:text-sm">
        <span>Crafted with</span>
        <AiFillHeart className="shrink-0 text-[0.95rem] text-rose-500 dark:text-rose-300" aria-hidden />
        <span>by Al</span>
      </p>
      <p className="mx-auto mt-1.5 max-w-md text-[0.7rem] leading-snug text-slate-500 dark:text-white/58 [@media(min-height:900px)]:mt-2 [@media(min-height:900px)]:max-w-sm [@media(min-height:900px)]:text-[0.8rem] [@media(min-height:900px)]:leading-relaxed">
        Al created Lumina to spread a little kindness and compassion—one pause, one hello, one softer day at a time.
      </p>
    </footer>
  );
}
