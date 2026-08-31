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
    <div className={cn("hero-typewriter-lock mt-6", className)}>
      <h1 className="text-[2.5rem] font-extrabold leading-[1.2] tracking-tight text-[#111827] sm:text-5xl lg:text-[3.5rem]">
        <span className="sr-only">Learn Smarter With Your Personal Study Partner</span>
        <span aria-hidden="true">
          Learn Smarter With
          <br />
          Your Personal
          <br />
          {/* Inline flex row — no absolute positioning so descenders (g,p,y) are never clipped */}
          <span className="inline-flex items-baseline" style={{ minWidth: 0 }}>
            <span
              className="whitespace-nowrap font-extrabold text-[#2563EB]"
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
                "typewriter-cursor ml-0.5 inline-block align-[-0.08em]",
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
