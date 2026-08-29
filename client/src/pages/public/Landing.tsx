import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  BotMessageSquare,
  BrainCircuit,
  CircleHelp,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Layers,
  Library,
  Medal,
  MessageSquareText,
  NotebookPen,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Course } from "@/types";
import { cn, idOf, formatStatCount } from "@/lib/utils";
import { HeroCtaLock, HeroTypewriter } from "@/components/HeroTypewriter";
import { scrollToId } from "@/layouts/PublicLayout";

export function LandingPage() {
  const courses = useQuery({
    queryKey: ["landing-courses"],
    queryFn: async () => (await api.get("/courses", { params: { status: "published", limit: 3 } })).data.data as Course[],
  });
  const platform = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () =>
      (await api.get("/analytics/public")).data.data as {
        students: number;
        courses: number;
        satisfaction: number | null;
        support: string;
      },
  });
  const studentsN = formatStatCount(platform.data?.students);
  const coursesN = formatStatCount(platform.data?.courses);
  const satisfactionN = platform.data?.satisfaction == null ? "—" : `${platform.data.satisfaction}%`;

  return (
    <div>
      <section className="relative flex min-h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-[#F3EEFF]">
        <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-[#C4B5FD]/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-[#A78BFA]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-[#DDD6FE]/60 blur-3xl" />
        <div className="relative flex min-h-0 flex-1 items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-2 lg:gap-12 lg:py-10">
            <div className="flex h-full w-full flex-col justify-center lg:-mr-[100px]">
              <span className="inline-flex items-center gap-2 text-base font-semibold text-[#6D28D9]">
                <Sparkles className="h-5 w-5 fill-amber-400 text-amber-400" />
                AI-Powered Learning Platform
              </span>
              <HeroTypewriter />
              <HeroCtaLock>
                <p className="mt-5 max-w-lg text-lg font-medium leading-relaxed text-[#6B7280] sm:text-xl">
                  Study interactive courses, take quizzes, and get instant help from AI Tutor anytime you need.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToId("stats")}
                    className="group inline-flex h-14 items-center gap-2.5 rounded-lg bg-[#7C3AED] px-7 text-base font-bold text-white opacity-100 shadow-[0_12px_28px_rgba(124,58,237,0.38)] transition hover:bg-[#6D28D9]"
                  >
                    Start Learning
                    <GraduationCap className="start-icon h-5 w-5 text-white" strokeWidth={2.6} />
                  </button>
                  <Link
                    to="/courses"
                    className="explore-cta group inline-flex h-14 items-center gap-3 rounded-lg border border-[#3E5BFF]/45 py-1 pl-1 pr-5 opacity-100"
                  >
                    <span className="explore-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#3E5BFF]/50 bg-[#3E5BFF]/10">
                      <BookOpen className="explore-cap h-5 w-5 text-[#3E5BFF]" strokeWidth={2} />
                    </span>
                    <span className="whitespace-nowrap text-base font-semibold text-[#3E5BFF]">Explore Courses</span>
                    <ArrowRight className="explore-arrow h-5 w-5 shrink-0 text-[#3E5BFF]" strokeWidth={2} />
                  </Link>
                </div>
              </HeroCtaLock>
            </div>
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={`/hero-student.png?v=11`}
                alt="Student learning with an AI tutor"
                width={989}
                height={844}
                className="block h-auto w-full max-h-[22rem] bg-transparent object-contain object-center sm:max-h-[26rem] lg:max-h-[28rem]"
              />
            </div>
          </div>
        </div>
        <div
          id="stats"
          className="scroll-section relative mx-auto w-full max-w-6xl shrink-0 grid grid-cols-1 gap-4 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0"
        >
          {[
            { n: studentsN, l: "Students", s: "Learning & growing", Icon: UsersRound, num: "text-[#7C3AED]", icon: "stat-icon stat-icon-purple bg-[#7C3AED] shadow-[0_10px_20px_rgba(124,58,237,0.38)]" },
            { n: coursesN, l: "Courses", s: "Expert crafted", Icon: Library, num: "text-[#2563EB]", icon: "stat-icon stat-icon-blue bg-[#2563EB] shadow-[0_10px_20px_rgba(37,99,235,0.38)]" },
            { n: satisfactionN, l: "Satisfaction", s: "Happy learners", Icon: Medal, num: "text-[#D97706]", icon: "stat-icon stat-icon-amber bg-[#D97706] shadow-[0_10px_20px_rgba(217,119,6,0.38)]" },
            { n: platform.data?.support || "24/7", l: "AI Support", s: "Always here to help", Icon: BotMessageSquare, num: "text-[#16A34A]", icon: "stat-icon stat-icon-green bg-[#16A34A] shadow-[0_10px_20px_rgba(22,163,74,0.38)]" },
          ].map(({ n, l, s, Icon, num, icon }, i) => (
            <div
              key={l}
              className={`group/stat flex min-h-[7.5rem] w-full items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 backdrop-blur-sm transition lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2 ${i > 0 ? "lg:border-l lg:border-[#16A34A]/50" : ""}`}
            >
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-white ${icon}`}>
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className={`text-3xl font-bold leading-none ${num}`}>{n}</p>
                <p className="mt-1.5 text-base font-semibold text-slate-800">{l}</p>
                <p className="mt-0.5 text-sm text-slate-400">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-base font-bold uppercase tracking-wider text-[#7C3AED]">How it works</p>
        <h2 className="mt-2 text-center text-4xl font-bold text-[#0F172A]">Learn in three simple steps</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
          Start a course, practice with lessons and quizzes, then get help from AI Tutor whenever you need it.
        </p>
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-0 left-0 hidden h-0.5 -translate-y-1/2 bg-[#16A34A] md:block"
          />
          {[
            {
              n: "01",
              t: "Join a course",
              d: "Browse published courses and start learning immediately.",
              Icon: BookOpenCheck,
              card: "border-[#DDD6FE] bg-[#F5F3FF]",
              iconWrap: "step-icon step-icon-purple bg-[#EDE9FE] text-[#7C3AED]",
            },
            {
              n: "02",
              t: "Study & practice",
              d: "Complete lessons, take quizzes, and review mistakes with guidance.",
              Icon: NotebookPen,
              card: "border-[#BBF7D0] bg-[#F0FDF4]",
              iconWrap: "step-icon step-icon-green bg-[#DCFCE7] text-[#16A34A]",
            },
            {
              n: "03",
              t: "Ask the AI Tutor",
              d: "Get context-aware explanations, examples, and what to study next.",
              Icon: BrainCircuit,
              card: "border-[#BFDBFE] bg-[#EFF6FF]",
              iconWrap: "step-icon step-icon-blue bg-[#DBEAFE] text-[#2563EB]",
            },
          ].map(({ n, t, d, Icon, card, iconWrap }) => (
            <Card
              key={t}
              className={`group/step relative z-10 flex h-full min-h-[15.5rem] flex-col border p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 ${card}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${iconWrap}`}>
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="text-lg font-bold text-black">{n}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-[#0F172A]">{t}</h3>
              <p className="mt-2 text-base leading-relaxed text-[#1E293B]">{d}</p>
            </Card>
          ))}
        </div>
        </div>
      </section>

      <section id="features" className="scroll-section bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-base font-bold uppercase tracking-wider text-[#7C3AED]">Features</p>
          <h2 className="mt-2 text-center text-4xl font-bold text-[#0F172A]">Everything you need to learn better</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: BotMessageSquare,
                t: "AI Tutor",
                d: "Smart & context-aware help",
                card: "border-[#DDD6FE] bg-white hover:border-[#C4B5FD]",
                iconWrap: "feat-icon feat-icon-purple bg-[#EDE9FE] text-[#7C3AED]",
              },
              {
                Icon: BookOpenCheck,
                t: "Interactive Learning",
                d: "Engaging structured lessons",
                card: "border-[#BBF7D0] bg-white hover:border-[#86EFAC]",
                iconWrap: "feat-icon feat-icon-green bg-[#DCFCE7] text-[#16A34A]",
              },
              {
                Icon: ClipboardCheck,
                t: "Quizzes & Assessments",
                d: "Instant scored results",
                card: "border-[#BFDBFE] bg-white hover:border-[#93C5FD]",
                iconWrap: "feat-icon feat-icon-blue bg-[#DBEAFE] text-[#2563EB]",
              },
              {
                Icon: TrendingUp,
                t: "Progress Tracking",
                d: "Detailed learning analytics",
                card: "border-[#99F6E4] bg-white hover:border-[#5EEAD4]",
                iconWrap: "feat-icon feat-icon-teal bg-[#CCFBF1] text-[#0D9488]",
              },
              {
                Icon: UsersRound,
                t: "Student Management",
                d: "Easy administration",
                card: "border-[#FDE68A] bg-white hover:border-[#FCD34D]",
                iconWrap: "feat-icon feat-icon-amber bg-[#FEF3C7] text-[#D97706]",
              },
              {
                Icon: Smartphone,
                t: "Responsive Design",
                d: "Mobile & tablet ready",
                card: "border-[#C7D2FE] bg-white hover:border-[#A5B4FC]",
                iconWrap: "feat-icon feat-icon-indigo bg-[#E0E7FF] text-[#4F46E5]",
              },
              {
                Icon: ShieldCheck,
                t: "Secure & Reliable",
                d: "Role-based access control",
                card: "border-[#FFEDD5] bg-white hover:border-[#FDBA74]",
                iconWrap: "feat-icon feat-icon-orange bg-[#FFEDD5] text-[#EA580C]",
              },
              {
                Icon: Sparkles,
                t: "Modern UI/UX",
                d: "Clean and professional",
                card: "border-[#FECDD3] bg-white hover:border-[#FDA4AF]",
                iconWrap: "feat-icon feat-icon-rose bg-[#FFE4E6] text-[#E11D48]",
              },
            ].map(({ Icon, t, d, card, iconWrap }) => (
              <Card
                key={t}
                className={cn(
                  "group/feat p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,23,42,0.1)]",
                  card,
                )}
              >
                <span className={cn("grid h-11 w-11 place-items-center rounded-[10px]", iconWrap)}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 text-base font-bold text-[#0F172A]">{t}</h3>
                <p className="mt-1.5 text-sm font-bold text-[#475569]">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-tutor" className="scroll-section mx-auto max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-[#DDD6FE]/70 bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] p-6 shadow-[0_16px_40px_rgba(124,58,237,0.1)] sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#DDD6FE]/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/4 h-40 w-40 rounded-full bg-[#BFDBFE]/30 blur-3xl" />
          <div className="relative grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EDE9FE] px-3.5 py-1.5 text-sm font-bold text-[#6D28D9] ring-1 ring-[#7C3AED]/15">
                <BotMessageSquare className="h-4 w-4" strokeWidth={2.25} />
                AI Tutor
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
                Your personal <span className="text-[#7C3AED]">learning assistant</span>
              </h2>
              <p className="mt-4 max-w-xl text-base font-bold leading-relaxed text-[#475569] sm:text-lg">
                Ask questions in plain language. The tutor uses your current lesson, learning level, and quiz history to
                explain simply, give examples, and quiz you — without doing the work for you.
              </p>
              <Link to="/register" className="mt-8 inline-flex">
                <Button
                  variant="gradient"
                  className="group h-12 rounded-[5px] px-6 text-base font-bold shadow-[0_12px_28px_rgba(124,58,237,0.35)]"
                >
                  Ask AI Tutor
                  <BotMessageSquare className="h-4 w-4 transition group-hover:scale-110" strokeWidth={2.25} />
                </Button>
              </Link>
            </div>
            <div className="grid h-full gap-3 sm:grid-cols-2 sm:auto-rows-fr">
              {[
                {
                  Icon: MessageSquareText,
                  t: "Explain this topic simply",
                  wrap: "ai-prompt-icon ai-prompt-icon-purple bg-[#EDE9FE] text-[#7C3AED]",
                  card: "hover:border-[#DDD6FE] hover:bg-[#FAF8FF]",
                },
                {
                  Icon: Layers,
                  t: "Give me another example",
                  wrap: "ai-prompt-icon ai-prompt-icon-blue bg-[#DBEAFE] text-[#2563EB]",
                  card: "hover:border-[#BFDBFE] hover:bg-[#F8FAFF]",
                },
                {
                  Icon: CircleHelp,
                  t: "Help me understand my mistake",
                  wrap: "ai-prompt-icon ai-prompt-icon-orange bg-[#FFEDD5] text-[#EA580C]",
                  card: "hover:border-[#FED7AA] hover:bg-[#FFFBEB]",
                },
                {
                  Icon: Compass,
                  t: "What should I study next?",
                  wrap: "ai-prompt-icon ai-prompt-icon-green bg-[#DCFCE7] text-[#16A34A]",
                  card: "hover:border-[#BBF7D0] hover:bg-[#F0FDF4]",
                },
              ].map(({ Icon, t, wrap, card }) => (
                <div
                  key={t}
                  className={cn(
                    "group/ai-prompt flex h-full min-h-[5.25rem] items-center gap-3 rounded-2xl border border-white/90 bg-white/85 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]",
                    card,
                  )}
                >
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[10px] shadow-sm", wrap)}>
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-[#0F172A]">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="scroll-section bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Courses</h2>
              <p className="mt-1 text-muted">Start with published programs from the live catalog.</p>
            </div>
            <Link to="/courses" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(courses.data || []).map((c) => (
              <Link key={idOf(c)} to={`/student/courses/${idOf(c)}`}>
                <Card className="h-full p-5 hover:border-primary">
                  <Badge tone="indigo">{c.category}</Badge>
                  <h3 className="mt-3 font-semibold">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{c.description}</p>
                  <p className="mt-4 text-xs capitalize text-slate-500">
                    {c.level} · {c.duration}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-indigo-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">What learners say</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["Ahmed H.", "The AI tutor explained linear equations in a way my textbook never did."],
              ["Sara M.", "Quizzes feel fair, and the review after a mistake actually helps me improve."],
              ["Omar N.", "I can continue a lesson on my phone and pick up the same progress later."],
            ].map(([name, quote]) => (
              <div key={name} className="rounded-2xl bg-white/10 p-5">
                <Quote className="h-5 w-5 text-indigo-200" />
                <p className="mt-3 text-sm text-indigo-50">{quote}</p>
                <p className="mt-4 text-sm font-semibold">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-section bg-gradient-to-b from-[#F3EEFF] to-[#EDE9FE] pb-20 pt-16">
        <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-bold text-[#1E1B4B]">FAQ</h2>
        <div className="mt-8 space-y-4">
          {[
            ["Is the AI Tutor a separate user role?", "No. Only Admin and Student are human roles. The AI Tutor assists students."],
            ["Can students edit courses?", "No. Only administrators manage educational content."],
            ["Do quiz scores come from real attempts?", "Yes. Admins cannot fabricate academic results."],
          ].map(([q, a]) => (
            <Card key={q} className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_10px_30px_rgba(124,58,237,0.08)]">
              <h3 className="font-semibold text-[#1E1B4B]">{q}</h3>
              <p className="mt-2 text-sm text-slate-500">{a}</p>
            </Card>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <img src="/logo.png" alt="Interactive Ai learing tutor system" className="mb-6 h-20 w-20 rounded-2xl shadow-md" />
      <h1 className="text-4xl font-bold">About Interactive Ai learing tutor system</h1>
      <p className="mt-4 text-muted">
        A modern education platform: structured courses, interactive quizzes, student progress analytics, and a personal AI
        tutor — with a professional admin console for managing students and content.
      </p>
    </div>
  );
}
