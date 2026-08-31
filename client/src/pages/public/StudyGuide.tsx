import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Goal,
  Lightbulb,
  NotebookPen,
  RefreshCcw,
  Scan,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIPS = [
  "Short, consistent sessions outperform last-minute cramming. Protect a daily study window and keep it.",
  "Review new material within 24 hours. Early retrieval is the fastest way to move ideas into long-term memory.",
  "Explain a concept in plain language. If you cannot teach it simply, revisit the lesson before moving on.",
  "Use focused blocks of 25–30 minutes, then rest. Quality of attention matters more than hours at a desk.",
];

const STEPS = [
  {
    n: "01",
    label: "PLAN",
    t: "Define measurable goals",
    d: "Set a weekly outcome you can check: one lesson completed, one quiz passed, or one topic explained from memory.",
    Icon: Goal,
    wrap: "feat-icon feat-icon-pink bg-[#FCE7F3] text-[#DB2777]",
    glow: "bg-[#DB2777]/15",
    num: "#DB2777",
  },
  {
    n: "02",
    label: "SCHEDULE",
    t: "Build a realistic plan",
    d: "Split goals into short daily tasks. Schedule study time first, then fit other work around it.",
    Icon: CalendarClock,
    wrap: "feat-icon feat-icon-amber bg-[#FEF3C7] text-[#D97706]",
    glow: "bg-[#D97706]/15",
    num: "#D97706",
  },
  {
    n: "03",
    label: "FOCUS",
    t: "Protect your focus",
    d: "Silence notifications, work in a quiet space, and keep one task open at a time so learning stays deep.",
    Icon: Scan,
    wrap: "feat-icon feat-icon-cyan bg-[#CFFAFE] text-[#0891B2]",
    glow: "bg-[#0891B2]/15",
    num: "#0891B2",
  },
  {
    n: "04",
    label: "CAPTURE",
    t: "Capture notes that last",
    d: "Rewrite key ideas in your own words, highlight questions, and keep examples you can review later.",
    Icon: NotebookPen,
    wrap: "feat-icon feat-icon-green bg-[#DCFCE7] text-[#16A34A]",
    glow: "bg-[#16A34A]/15",
    num: "#16A34A",
  },
  {
    n: "05",
    label: "PRACTICE",
    t: "Practice with retrieval",
    d: "Use quizzes and short problems before re-reading. Testing yourself is how understanding becomes skill.",
    Icon: ClipboardCheck,
    wrap: "feat-icon feat-icon-teal bg-[#CCFBF1] text-[#0D9488]",
    glow: "bg-[#0D9488]/15",
    num: "#0D9488",
  },
  {
    n: "06",
    label: "REVIEW",
    t: "Review and adjust",
    d: "Look at mistakes, update your method, and decide what to study next. Progress comes from honest review.",
    Icon: RefreshCcw,
    wrap: "feat-icon feat-icon-orange bg-[#FFEDD5] text-[#EA580C]",
    glow: "bg-[#EA580C]/15",
    num: "#EA580C",
  },
];

const HABITS = [
  "Study in a quiet, well-lit space",
  "Take a short break every 25–30 minutes",
  "Sleep enough so new material can settle",
  "Stay hydrated and keep sessions sustainable",
  "Ask the AI Tutor as soon as you get stuck",
];

export function StudyGuidePage() {
  const [tipIndex, setTipIndex] = useState(0);
  const timelineRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.78;
      const end = vh * 0.22;
      const total = Math.max(1, rect.height + (start - end));
      const progress = Math.min(1, Math.max(0, (start - rect.top) / total));
      el.style.setProperty("--guide-line", String(progress));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] px-5 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-[#BFDBFE]/55 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#93C5FD]/30 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">Study Guide</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-[#64748B] sm:text-lg">
              A practical playbook for focused learning: plan your week, protect your attention, and use quizzes plus AI Tutor support to improve with every session.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="group/feat flex items-center gap-3 rounded-2xl border border-[#CCFBF1] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#5EEAD4]">
                <span className="feat-icon feat-icon-teal grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
                  <BookOpen className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">Learn with method</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">Evidence-based routines that save time.</p>
                </div>
              </div>
              <div className="group/feat flex items-center gap-3 rounded-2xl border border-[#FDE68A] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#FCD34D]">
                <span className="feat-icon feat-icon-amber grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
                  <Target className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">Stay on schedule</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">Small daily progress that compounds.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <img
              src="/study-guide-hero.jpg"
              alt="Student writing notes beside a laptop"
              className="relative z-10 h-auto w-full max-w-[28rem] rounded-2xl object-contain object-center"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:items-start lg:gap-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] sm:text-3xl">A six-step study system</h2>
          <ol ref={timelineRef} className="guide-timeline relative mt-6 space-y-4">
            <span aria-hidden className="guide-timeline-rail pointer-events-none">
              <span className="guide-timeline-rail-fill" />
            </span>
            {STEPS.map(({ n, label, t, d, Icon, wrap, glow, num }) => (
              <li key={n} className="group/feat relative flex items-center gap-3 sm:gap-4">
                <span
                  className="guide-num relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white text-[11px] font-extrabold text-white sm:h-12 sm:w-12 sm:text-xs"
                  style={{ backgroundColor: num, ["--num-color" as string]: num }}
                >
                  {n}
                </span>
                <article className="flex min-w-0 flex-1 items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <p className="text-[11px] font-extrabold tracking-[0.14em]" style={{ color: num }}>{label}</p>
                    <h3 className="mt-1 text-base font-extrabold text-[#0F172A] sm:text-lg">{t}</h3>
                    <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#64748B]">{d}</p>
                  </div>
                  <div className="relative hidden h-full min-h-[7.5rem] w-28 shrink-0 items-center justify-center sm:flex">
                    <span className={cn("absolute inset-3 rounded-2xl blur-xl", glow)} />
                    <span className={cn("relative grid h-14 w-14 place-items-center rounded-[14px] shadow-sm", wrap)}>
                      <Icon className="h-7 w-7" strokeWidth={2.15} />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FEF3C7] text-[#D97706]">
                <Trophy className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <p className="min-w-0 flex-1 text-sm font-bold leading-relaxed text-[#92400E]">
                <span className="text-base">Ready when you are.</span> Open a published course, complete one focused session, and ask the AI Tutor the moment a concept is unclear.
              </p>
              <Link
                to="/courses"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#D97706] bg-white px-5 text-sm font-bold text-[#D97706] transition hover:bg-[#FEF3C7]"
              >
                Start a course
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="group/feat rounded-2xl border border-[#FBCFE8] bg-[#FDF2F8] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[#DB2777]">Today’s study tip</p>
                <p className="mt-3 text-sm font-semibold italic leading-relaxed text-[#9D174D]">“{TIPS[tipIndex]}”</p>
              </div>
              <span className="feat-icon feat-icon-pink grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#DB2777]">
                <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {TIPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Tip ${i + 1}`}
                  onClick={() => setTipIndex(i)}
                  className={cn(
                    "grid place-items-center rounded-full text-[10px] font-extrabold transition duration-300",
                    i === tipIndex
                      ? "h-6 min-w-[1.65rem] bg-[#DB2777] px-2 text-white"
                      : "h-6 w-6 bg-[#FBCFE8] text-[#DB2777] hover:bg-[#DB2777] hover:text-white",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
            <h3 className="text-lg font-extrabold text-[#0F172A]">Habits that hold</h3>
            <ul className="mt-4 space-y-3">
              {HABITS.map((habit, i) => {
                const habitColors = ["#16A34A", "#0D9488", "#2563EB", "#D97706", "#DB2777"];
                const c = habitColors[i % habitColors.length];
                return (
                <li key={habit} className="flex items-start gap-2.5 text-sm font-semibold text-[#334155]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: c }} strokeWidth={2.4} />
                  {habit}
                </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
