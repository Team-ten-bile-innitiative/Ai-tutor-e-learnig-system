import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const PREFIX = "Learn Smarter With Your Personal ";
const PHRASES = ["AI Tutor", "Study Partner", "Learning Coach"];
const LONGEST_PHRASE = PHRASES.reduce((a, b) => (a.length > b.length ? a : b));

type HeroTypewriterProps = {
  className?: string;
};

export function HeroTypewriter({ className }: HeroTypewriterProps) {
  const [prefixCount, setPrefixCount] = useState(0);
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
      setPrefixCount(PREFIX.length);
      setPhraseCount(PHRASES[0].length);
      setDeleting(false);
      return;
    }

    const phrase = PHRASES[phraseIndex];
    let delay = deleting ? 28 : prefixCount < PREFIX.length ? 42 : 58;

    if (!deleting && prefixCount < PREFIX.length) {
      delay = 38 + Math.random() * 24;
    } else if (!deleting && phraseCount < phrase.length) {
      delay = 52 + Math.random() * 30;
    }

    if (!deleting && prefixCount === PREFIX.length && phraseCount === phrase.length) {
      delay = 2400;
    }

    const timer = window.setTimeout(() => {
      if (prefixCount < PREFIX.length) {
        setPrefixCount((n) => n + 1);
        return;
      }

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
  }, [prefixCount, phraseIndex, phraseCount, deleting, prefersReducedMotion]);

  const visiblePhrase = PHRASES[phraseIndex].slice(0, phraseCount);
  const typing = !prefersReducedMotion && (prefixCount < PREFIX.length || phraseCount < PHRASES[phraseIndex].length || deleting);

  return (
    <div
      className={cn(
        "hero-typewriter-lock mt-6 min-h-[5.5rem] sm:min-h-[5rem] lg:min-h-[7.75rem]",
        className,
      )}
    >
      <h1 className="text-[2.5rem] font-extrabold leading-[1.12] tracking-tight text-[#111827] sm:text-5xl lg:text-[3.5rem]">
        <span className="sr-only">Learn Smarter With Your Personal AI Tutor</span>
        <span aria-hidden="true">
          {PREFIX.slice(0, prefixCount)}
          <span className="relative inline-block align-bottom">
            <span className="invisible whitespace-nowrap" aria-hidden>
              {LONGEST_PHRASE}
            </span>
            <span className="absolute left-0 top-0 whitespace-nowrap text-[#7C3AED]">{visiblePhrase}</span>
          </span>
          <span
            className={cn(
              "typewriter-cursor ml-0.5 inline-block align-[-0.08em]",
              typing ? "typewriter-cursor-active" : "typewriter-cursor-idle",
            )}
            aria-hidden
          />
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
