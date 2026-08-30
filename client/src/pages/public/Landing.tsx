import { useState } from "react";
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
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/CourseCatalog";
import { EmptyState, ErrorState, Skeleton } from "@/components/shared";
import { api } from "@/lib/api";
import type { Course } from "@/types";
import { cn, idOf, formatStatCount } from "@/lib/utils";
import { HeroCtaLock, HeroTypewriter } from "@/components/HeroTypewriter";
import { useI18n } from "@/context/I18nContext";

const SAVED_KEY = "savedCourseIds";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function LandingPage() {
  const [saved, setSaved] = useState<string[]>(() => readSaved());
  const courses = useQuery({
    queryKey: ["landing-courses"],
    queryFn: async () =>
      (await api.get("/courses", { params: { status: "published", sort: "popular", limit: 8 } })).data.data as Course[],
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
  const maxEnroll = Math.max(0, ...(courses.data || []).map((c) => c.enrollmentCount || 0));

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const testimonialsData = [
    {
      name: "Ahmed H.",
      quote: "The AI tutor explained linear equations in a way my textbook never did. I finally understand math and even enjoy it now!",
      role: "High School Student",
      subject: "Mathematics",
      avatar: "https://i.pravatar.cc/150?u=31",
    },
    {
      name: "Sara M.",
      quote: "Quizzes feel fair, and the review after a mistake actually helps me improve. It's like having a personal tutor 24/7.",
      role: "University Student",
      subject: "Physics",
      avatar: "https://i.pravatar.cc/150?u=47",
    },
    {
      name: "Omar N.",
      quote: "I can continue a lesson on my phone and pick up the same progress later. It fits perfectly into my busy schedule.",
      role: "College Student",
      subject: "Computer Science",
      avatar: "https://i.pravatar.cc/150?u=60",
    },
    {
      name: "Lisa K.",
      quote: "I used to dread studying, but this platform makes it genuinely fun. The interactive examples are a game-changer!",
      role: "Middle School",
      subject: "Science",
      avatar: "https://i.pravatar.cc/150?u=24",
    }
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(1);

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonialsData.length);
  };

  const visibleTestimonials = [
    { ...testimonialsData[(activeTestimonial - 1 + testimonialsData.length) % testimonialsData.length], isCenter: false, key: 'left' },
    { ...testimonialsData[activeTestimonial], isCenter: true, key: 'center' },
    { ...testimonialsData[(activeTestimonial + 1) % testimonialsData.length], isCenter: false, key: 'right' },
  ];

  return (
    <div>
      <section className="relative flex min-h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-[#F3EEFF]">
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
                  <Link
                    to="/courses"
                    className="group inline-flex h-14 items-center gap-2.5 rounded-lg bg-[#7C3AED] px-7 text-base font-bold text-white opacity-100 shadow-[0_12px_28px_rgba(124,58,237,0.38)] transition hover:bg-[#6D28D9]"
                  >
                    Start Learning
                    <GraduationCap className="start-icon h-5 w-5 text-white" strokeWidth={2.6} />
                  </Link>
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
              className={`group/stat flex min-h-[7.5rem] w-full items-center gap-4 rounded-2xl bg-white/70 px-5 py-5 transition lg:rounded-none lg:bg-transparent lg:px-6 lg:py-2 ${i > 0 ? "lg:border-l lg:border-[#16A34A]/50" : ""}`}
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
        <div className="relative overflow-hidden rounded-3xl border border-[#DDD6FE]/70 bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] p-6 shadow-[0_16px_40px_rgba(124,58,237,0.1)] sm:p-10 min-h-[500px]">
          <div className="relative grid items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[#6D28D9]">
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
                    "group/ai-prompt flex h-full min-h-[160px] items-center gap-4 rounded-2xl border border-white/90 bg-white/85 p-6 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]",
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
              <h2 className="text-3xl font-bold text-[#0F172A]">Courses</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Start with published programs from the live catalog.</p>
            </div>
            <Link to="/courses" className="text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9]">
              View all
            </Link>
          </div>
          <div className="mt-8">
            {courses.isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-2xl" />
                ))}
              </div>
            ) : courses.error ? (
              <ErrorState message={courses.error.message} onRetry={() => courses.refetch()} />
            ) : !(courses.data || []).length ? (
              <EmptyState title="No published courses yet." description="Check back soon for new programs." />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {(courses.data || []).map((course) => (
                  <CourseCard
                    key={idOf(course)}
                    course={course}
                    href={`/student/courses/${idOf(course)}`}
                    maxEnroll={maxEnroll}
                    saved={saved.includes(idOf(course))}
                    onToggleSave={toggleSave}
                    layout="grid"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/30 py-24 text-slate-900 relative overflow-hidden">
        {/* Background glow effects */}
        
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold text-purple-700 mb-4 tracking-wider">
              <Star className="h-3.5 w-3.5 fill-purple-700" />
              TESTIMONIALS
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">What Our Learners Say</h2>
            <p className="mt-5 max-w-2xl text-base text-slate-500 font-medium">
              Real stories from students who are learning smarter with AI.
            </p>
            <div className="mt-8 flex items-center justify-center w-full mx-auto">
               <div className="h-1 w-8 bg-[#8B5CF6] rounded-full" />
            </div>
          </div>
          
          <div className="mt-16 flex flex-col md:flex-row justify-center gap-6 md:gap-8 items-center relative px-2 sm:px-12 lg:px-16">
            {/* Left arrow */}
            <div onClick={handlePrevTestimonial} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.1)] items-center justify-center cursor-pointer text-[#8B5CF6] hover:bg-purple-50 transition border border-slate-100 z-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            {/* Right arrow */}
            <div onClick={handleNextTestimonial} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.1)] items-center justify-center cursor-pointer text-[#8B5CF6] hover:bg-purple-50 transition border border-slate-100 z-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>

            {visibleTestimonials.map(({ name, quote, role, subject, avatar, isCenter, key }) => (
              <div 
                key={key} 
                className={cn(
                  "relative rounded-[1.5rem] bg-white p-7 sm:p-8 flex flex-col h-full w-full max-w-[360px] flex-1 transition-all duration-300",
                  isCenter ? "shadow-[0_16px_50px_rgba(124,58,237,0.1)] ring-1 ring-purple-100 scale-100 md:scale-105 z-10 md:-translate-y-2" : "shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-md"
                )}
              >
                {isCenter && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/30 rotate-12">
                    <Star className="h-4 w-4 text-white fill-white -rotate-12" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="currentColor" className="text-[#8B5CF6]">
                    <path d="M9.983 3v7.391C9.983 16.095 6.252 19.961 2 21L.823 18.574c3.242-.781 4.962-3.238 5.485-5.965H2V3h7.983zm12.017 0v7.391c0 5.704-3.731 9.57-7.983 10.609l-1.177-2.426c3.242-.781 4.962-3.238 5.485-5.965H14V3h8z"/>
                  </svg>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
                <p className="mt-5 text-[15px] leading-relaxed text-slate-700 font-medium flex-grow">{quote}</p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-purple-100 flex-shrink-0 border border-slate-100">
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{name}</h4>
                    <p className="text-[11px] text-purple-600 font-semibold mb-1">{role}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-100">
                      <GraduationCap className="h-3 w-3 text-purple-500" />
                      {subject}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex justify-center gap-2.5">
            {testimonialsData.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={cn("h-2.5 w-2.5 rounded-full cursor-pointer transition", idx === activeTestimonial ? "bg-[#8B5CF6]" : "bg-slate-200 hover:bg-purple-200")}
              />
            ))}
          </div>


        </div>
      </section>


    </div>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <img src="/logo.png" alt="Interactive Ai learing tutor system" className="mb-6 h-20 w-20 rounded-2xl shadow-md" />
      <h1 className="text-4xl font-bold">{t("about.title")}</h1>
      <p className="mt-4 text-muted">{t("about.body")}</p>
    </div>
  );
}
