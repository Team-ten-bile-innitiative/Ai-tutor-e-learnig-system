import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const PHRASES = ["Study Partner", "AI Tutor", "Learning Coach"];
const LONGEST_PHRASE = PHRASES.reduce((a, b) => (a.length > b.length ? a : b));

type HeroTypewriterProps = {
  className?: string;
};

export function HeroTypewriter({ className }: HeroTypewriterProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseCount, setPhraseCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPrefersReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPhraseCount(PHRASES[0].length);
      setDeleting(false);
      return;
    }

    const phrase = PHRASES[phraseIndex];
    let delay = deleting ? 35 : 65 + Math.random() * 35;

    if (!deleting && phraseCount === phrase.length) {
      delay = 2600; // pause before deleting
    }

    const timer = window.setTimeout(() => {
      if (!deleting && phraseCount < phrase.length) {
        setPhraseCount((n) => n + 1);
        return;
      }

      if (!deleting && phraseCount === phrase.length) {
        setDeleting(true);
        return;
      }

      if (deleting && phraseCount > 0) {
        setPhraseCount((n) => n - 1);
        return;
      }

      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [phraseIndex, phraseCount, deleting, prefersReducedMotion]);

  const visiblePhrase = PHRASES[phraseIndex].slice(0, phraseCount);
  const typing = !prefersReducedMotion && (phraseCount < PHRASES[phraseIndex].length || deleting);

  return (
    <div className={cn("hero-typewriter-lock mt-7", className)}>
      <h1 className="mx-0 max-w-[12ch] text-[2.65rem] font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:max-w-none sm:text-5xl lg:text-[3.65rem]">
        <span className="sr-only">Learn Smarter With Your Personal Study Partner</span>
        <span aria-hidden="true">
          Learn Smarter With
          <br />
          Your Personal
          <br />
          {/* Inline flex row — no absolute positioning so descenders (g,p,y) are never clipped */}
          <span className="mt-1 inline-flex items-baseline sm:mt-2" style={{ minWidth: 0 }}>
            <span
<<<<<<< HEAD
              className="whitespace-nowrap bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#6366F1] bg-clip-text font-extrabold text-transparent drop-shadow-[0_5px_14px_rgba(168,85,247,0.18)]"
=======
              className="whitespace-nowrap font-extrabold text-[#2563EB]"
>>>>>>> dfea3a00aaaf755f28440c364992e115ebd6b696
              style={{
                paddingBottom: "0.08em",   /* ensures descenders are never cut */
                lineHeight: "inherit",
              }}
            >
              {visiblePhrase || "\u00A0" /* non-breaking space keeps line height when empty */}
            </span>
            {/* blinking cursor */}
            <span
              className={cn(
                "typewriter-cursor ml-1 inline-block align-[-0.04em]",
                typing ? "typewriter-cursor-active" : "typewriter-cursor-idle",
              )}
              aria-hidden
            />
          </span>
        </span>
      </h1>
    </div>
  );
}

export function HeroCtaLock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("hero-cta-lock visible shrink-0 opacity-100", className)}>
      {children}
    </div>
  );
}
