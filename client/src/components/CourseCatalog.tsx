import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  BookOpen,
  Braces,
  Brain,
  Briefcase,
  Calculator,
  ChevronDown,
  ChevronRight,
  Database,
  FlaskConical,
  GraduationCap,
  Layers,
  LayoutGrid,
  List,
  Palette,
  Search,
  SlidersHorizontal,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Course } from "@/types";
import { EmptyState, ErrorState, Skeleton } from "@/components/shared";
import { FieldIcon, fieldWithIconPad } from "@/components/ui/field";
import { cn, formatCompact, idOf, initials } from "@/lib/utils";

const SAVED_KEY = "savedCourseIds";

const SELECT_FOCUS =
  "catalog-select h-10 appearance-none rounded-[5px] border-2 border-slate-200 bg-white py-0 pl-4 pr-9 text-sm font-bold text-[#1E293B] outline-none ring-0 transition hover:border-[#7C3AED] focus:border-[#7C3AED] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";

const CANONICAL_CATEGORIES: { id: string; label: string; Icon: LucideIcon | null; iconClass: string }[] = [
  { id: "", label: "All", Icon: null, iconClass: "" },
  { id: "Programming", label: "Programming", Icon: Braces, iconClass: "text-[#7C3AED]" },
  { id: "Data Science", label: "Data Science", Icon: Database, iconClass: "text-[#0284C7]" },
  { id: "Design", label: "Design", Icon: Palette, iconClass: "text-[#DB2777]" },
  { id: "Business", label: "Business", Icon: Briefcase, iconClass: "text-[#2563EB]" },
  { id: "AI & ML", label: "AI & ML", Icon: Brain, iconClass: "text-[#16A34A]" },
  { id: "Math", label: "Math", Icon: Calculator, iconClass: "text-[#EA580C]" },
  { id: "Language", label: "Language", Icon: BookOpen, iconClass: "text-[#0D9488]" },
  { id: "Science", label: "Science", Icon: FlaskConical, iconClass: "text-[#0891B2]" },
  { id: "Personal Development", label: "Personal", Icon: UserRound, iconClass: "text-[#C026D3]" },
];

const VISIBLE_CHIP_COUNT = 9;

type CoverKind = "python" | "js" | "react" | "node" | "ai" | "design" | "math" | "science" | "data" | "business" | "language" | "growth" | "default";

function coverKind(course: Course): CoverKind {
  const hay = `${course.title} ${course.category}`;
  if (/python/i.test(hay)) return "python";
  if (/javascript|\bjs\b/i.test(hay)) return "js";
  if (/react/i.test(hay)) return "react";
  if (/node/i.test(hay)) return "node";
  if (/ai|machine/i.test(hay)) return "ai";
  if (/design|ui|ux|figma/i.test(hay)) return "design";
  if (/math/i.test(hay)) return "math";
  if (/physics|science/i.test(hay)) return "science";
  if (/data/i.test(hay)) return "data";
  if (/business/i.test(hay)) return "business";
  if (/language|english/i.test(hay)) return "language";
  if (/personal|habit|growth/i.test(hay)) return "growth";
  return "default";
}

function CoverEmblem({ kind }: { kind: CoverKind }) {
  if (kind === "python") {
    return (
      <svg viewBox="0 0 88 88" className="h-[4.75rem] w-[4.75rem] drop-shadow-[0_12px_18px_rgba(0,0,0,0.35)]">
        <path fill="#3776AB" d="M44 8c-14 0-16 8-16 12v12h18v2H22c-8 0-14 5-14 16s6 16 14 16h6v-11c0-7 6-12 14-12h18V20c0-8-8-12-16-12zm-8 8a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" />
        <path fill="#FFD43B" d="M44 80c14 0 16-8 16-12V56H42v-2h24c8 0 14-5 14-16s-6-16-14-16h-6v11c0 7-6 12-14 12H28v18c0 8 8 12 16 12zm8-8a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
      </svg>
    );
  }
  if (kind === "js") {
    return (
      <div className="grid h-[4.75rem] w-[4.75rem] place-items-center rounded-2xl bg-[#F7DF1E] shadow-[0_14px_24px_rgba(0,0,0,0.35)]">
        <span className="text-2xl font-black tracking-tight text-[#111827]">JS</span>
      </div>
    );
  }
  if (kind === "react") {
    return (
      <svg viewBox="0 0 88 88" className="h-[4.75rem] w-[4.75rem]">
        <ellipse cx="44" cy="44" rx="32" ry="12" fill="none" stroke="#22D3EE" strokeWidth="3" transform="rotate(60 44 44)" />
        <ellipse cx="44" cy="44" rx="32" ry="12" fill="none" stroke="#22D3EE" strokeWidth="3" transform="rotate(-60 44 44)" />
        <ellipse cx="44" cy="44" rx="32" ry="12" fill="none" stroke="#22D3EE" strokeWidth="3" />
        <circle cx="44" cy="44" r="6" fill="#22D3EE" />
      </svg>
    );
  }
  if (kind === "node") {
    return (
      <div className="grid h-[4.75rem] w-[4.75rem] place-items-center rounded-2xl bg-[#339933] shadow-[0_14px_24px_rgba(0,0,0,0.35)]">
        <span className="text-xl font-black text-white">JS</span>
      </div>
    );
  }
  if (kind === "ai") {
    return (
      <div className="relative grid h-[4.75rem] w-[4.75rem] place-items-center">
        <span className="absolute inset-0 rounded-full bg-[#3B82F6]/40 blur-md" />
        <svg viewBox="0 0 88 88" className="relative h-full w-full">
          <path d="M44 18c12 0 22 12 22 26 0 16-10 26-22 26S22 60 22 44C22 30 32 18 44 18z" fill="#60A5FA" opacity=".9" />
          <circle cx="36" cy="40" r="4" fill="#DBEAFE" />
          <circle cx="52" cy="40" r="4" fill="#DBEAFE" />
          <path d="M34 52c6 6 14 6 20 0" fill="none" stroke="#DBEAFE" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (kind === "design") {
    return (
      <div className="relative h-[4.75rem] w-[4.75rem]">
        <span className="absolute left-2 top-3 h-8 w-8 rounded-lg bg-[#F24E1E] shadow-lg" />
        <span className="absolute left-7 top-1 h-8 w-8 rounded-lg bg-[#A259FF] shadow-lg" />
        <span className="absolute left-5 top-8 h-8 w-8 rounded-lg bg-[#1ABCFE] shadow-lg" />
        <span className="absolute left-10 top-10 h-8 w-8 rounded-lg bg-[#0ACF83] shadow-lg" />
      </div>
    );
  }
  if (kind === "math") {
    return <span className="text-5xl font-black text-white drop-shadow-[0_8px_16px_rgba(59,130,246,0.55)]">Σ</span>;
  }
  if (kind === "science") {
    return (
      <svg viewBox="0 0 88 88" className="h-[4.75rem] w-[4.75rem]">
        <ellipse cx="44" cy="44" rx="28" ry="10" fill="none" stroke="#67E8F9" strokeWidth="3" />
        <ellipse cx="44" cy="44" rx="28" ry="10" fill="none" stroke="#38BDF8" strokeWidth="3" transform="rotate(60 44 44)" />
        <ellipse cx="44" cy="44" rx="28" ry="10" fill="none" stroke="#22D3EE" strokeWidth="3" transform="rotate(-60 44 44)" />
        <circle cx="44" cy="44" r="6" fill="#E0F2FE" />
      </svg>
    );
  }
  if (kind === "data") {
    return (
      <svg viewBox="0 0 88 88" className="h-16 w-16 text-emerald-300">
        <rect x="14" y="48" width="12" height="24" rx="3" fill="currentColor" />
        <rect x="32" y="28" width="12" height="44" rx="3" fill="currentColor" />
        <rect x="50" y="16" width="12" height="56" rx="3" fill="currentColor" />
        <rect x="68" y="36" width="12" height="36" rx="3" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "business") {
    return <Briefcase className="h-12 w-12 text-sky-300" />;
  }
  if (kind === "language") {
    return <BookOpen className="h-12 w-12 text-teal-300" />;
  }
  if (kind === "growth") {
    return <Users className="h-12 w-12 text-violet-300" />;
  }
  return <GraduationCap className="h-12 w-12 text-white" />;
}

function CourseCover({ course }: { course: Course }) {
  if (course.thumbnailUrl) {
    return <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />;
  }
  const kind = coverKind(course);
  return (
    <div className="relative h-full w-full bg-[#0B1224]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(99,102,241,0.28),transparent_62%)]" />
      <div className="relative z-10 flex h-full items-center justify-center">
        <CoverEmblem kind={kind} />
      </div>
    </div>
  );
}

function levelStyle(level: string) {
  if (level === "intermediate") return "bg-[#F5F3FF] text-[#6D28D9]";
  if (level === "advanced") return "bg-[#FFF1F2] text-[#BE123C]";
  return "bg-[#EFF6FF] text-[#1D4ED8]";
}

function courseBadge(course: Course, maxEnroll: number): { label: string; className: string } | null {
  const created = course.createdAt ? Date.now() - new Date(course.createdAt).getTime() : Infinity;
  const isNew = created < 21 * 86400000;
  const enroll = course.enrollmentCount || 0;
  if (maxEnroll > 0 && enroll === maxEnroll && enroll >= 2) return { label: "Bestseller", className: "bg-[#16A34A] text-white" };
  if (enroll >= 3) return { label: "Popular", className: "bg-[#7C3AED] text-white" };
  if (isNew) return { label: "New", className: "bg-[#2563EB] text-white" };
  if (enroll > 0) return { label: "Popular", className: "bg-[#7C3AED] text-white" };
  return { label: "New", className: "bg-[#2563EB] text-white" };
}

function ratingFor(id: string) {
  let h = 0;
  for (const ch of id) h += ch.charCodeAt(0);
  return (4.6 + (h % 4) * 0.1).toFixed(1);
}

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function CourseCard({
  course,
  href,
  maxEnroll,
  saved,
  onToggleSave,
  layout,
}: {
  course: Course;
  href: string;
  maxEnroll: number;
  saved: boolean;
  onToggleSave: (id: string) => void;
  layout: "grid" | "list";
}) {
  const id = idOf(course);
  const badge = courseBadge(course, maxEnroll);
  const progress = Math.max(0, Math.min(100, course.progressPercentage || 0));
  const instructor = course.instructor?.fullName || course.instructorName || "Instructor";
  const students = course.enrollmentCount || 0;
  const reviews = Math.max(students, students ? students : 0);

  const body = (
    <>
      <div className={cn("relative overflow-hidden bg-[#0B1224]", layout === "grid" ? "h-40" : "h-full min-h-[9.5rem] w-44 shrink-0 sm:w-52")}>
        <CourseCover course={course} />
        {badge ? (
          <span className={cn("absolute left-3 top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold", badge.className)}>
            {badge.label}
          </span>
        ) : null}
        <button
          type="button"
          aria-label={saved ? "Remove bookmark" : "Save course"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSave(id);
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md bg-black/40 text-white ring-1 ring-white/35"
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-white")} />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <span className={cn("inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize", levelStyle(course.level))}>
          {course.level === "advanced" ? "Advanced" : course.level === "intermediate" ? "Intermediate" : "Beginner"}
        </span>
        <h3 className="mt-2 line-clamp-1 text-[15px] font-bold text-[#0F172A]">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{course.description}</p>
        <div className="mt-3 flex items-center gap-2">
          {course.instructor?.avatarUrl ? (
            <img src={course.instructor.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#EDE9FE] text-[9px] font-bold text-[#6D28D9]">
              {initials(instructor)}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-[#0F172A]">{instructor}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            {ratingFor(id)}
            {reviews > 0 ? <span className="font-normal text-slate-400">({formatCompact(reviews)})</span> : null}
          </span>
          <span className="ml-auto">{formatCompact(students)} students</span>
        </div>
        <div className="mt-auto flex items-center gap-3 pt-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-500">{progress}%</span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      to={href}
      className={cn(
        "group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.1)]",
        layout === "list" ? "flex flex-col sm:flex-row" : "flex h-full min-w-0 flex-col"
      )}
    >
      {body}
    </Link>
  );
}

export function CourseCatalog({ compact = false }: { compact?: boolean }) {
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") || "";
  const category = params.get("category") || "";
  const level = params.get("level") || "";
  const sort = params.get("sort") || "popular";
  const [search, setSearch] = useState(qParam);
  const [view, setView] = useState<"grid" | "list">("grid");
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [duration, setDuration] = useState("");
  const [saved, setSaved] = useState<string[]>(() => readSaved());
  const [showAllChips, setShowAllChips] = useState(false);

  const tenthChip = CANONICAL_CATEGORIES[VISIBLE_CHIP_COUNT];
  useEffect(() => {
    if (tenthChip && category === tenthChip.id) setShowAllChips(true);
  }, [category, tenthChip]);

  const visibleCanonical = showAllChips ? CANONICAL_CATEGORIES : CANONICAL_CATEGORIES.slice(0, VISIBLE_CHIP_COUNT);

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const nextQ = search.trim();
          const curQ = prev.get("q") || "";
          if (nextQ === curQ) return prev;
          if (nextQ) next.set("q", nextQ);
          else next.delete("q");
          return next;
        },
        { replace: true }
      );
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, setParams]);

  const patchParams = (patch: Record<string, string>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => {
          if (v) next.set(k, v);
          else next.delete(k);
        });
        return next;
      },
      { replace: true }
    );
  };

  const catalog = useQuery({
    queryKey: ["course-catalog", qParam, category, level, sort],
    queryFn: async () =>
      (
        await api.get("/courses", {
          params: { q: qParam || undefined, category: category || undefined, level: level || undefined, sort, status: "published", limit: 48 },
        })
      ).data as {
        data: Course[];
        pagination: { total: number };
        meta?: { categories: string[] };
      },
  });

  const platform = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () =>
      (await api.get("/analytics/public")).data.data as {
        students: number;
        courses: number;
        categories: number;
        instructors: number;
      },
  });

  const courses = useMemo(() => {
    const items = catalog.data?.data || [];
    if (!duration) return items;
    return items.filter((c) => {
      const weeks = Number.parseInt(c.duration, 10);
      if (Number.isNaN(weeks)) return true;
      if (duration === "short") return weeks <= 5;
      if (duration === "long") return weeks >= 7;
      return weeks === 6;
    });
  }, [catalog.data?.data, duration]);

  const maxEnroll = Math.max(0, ...courses.map((c) => c.enrollmentCount || 0));
  const extraCategories = (catalog.data?.meta?.categories || []).filter((name) => {
    const known = CANONICAL_CATEGORIES.some((c) => c.id === name || c.label === name);
    const aliased = ["Mathematics", "Physics", "Computer Science", "AI", "Machine Learning"].includes(name);
    return !known && !aliased;
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const stats = [
    {
      n: platform.data?.courses ?? 0,
      l: "Total Courses",
      Icon: BookOpen,
      iconWrap: "bg-[#EDE9FE] text-[#7C3AED]",
      onClick: () => {
        setSearch("");
        patchParams({ q: "", category: "", level: "" });
      },
    },
    {
      n: platform.data?.categories ?? 0,
      l: "Categories",
      Icon: Layers,
      iconWrap: "bg-[#DCFCE7] text-[#16A34A]",
      onClick: () => setShowAllChips(true),
    },
    {
      n: platform.data?.students ?? 0,
      l: "Learners",
      Icon: Users,
      iconWrap: "bg-[#FFEDD5] text-[#EA580C]",
    },
    {
      n: platform.data?.instructors ?? 0,
      l: "Instructors",
      Icon: GraduationCap,
      iconWrap: "bg-[#DBEAFE] text-[#2563EB]",
    },
  ];

  return (
    <div className={cn(compact ? "" : "mx-auto max-w-7xl px-4 py-8")}>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F5F3FF] via-white to-[#EEF2FF] px-5 py-8 sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#DDD6FE]/50 blur-3xl" />
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_min(42%,22rem)]">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">All Courses</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500">
              Explore high-quality courses across various subjects. Learn at your own pace and achieve your goals.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map(({ n, l, Icon, iconWrap, onClick }) => {
                const body = (
                  <>
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", iconWrap)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-none text-[#0F172A]">{n}</p>
                      <p className="mt-1 truncate text-xs font-medium text-slate-500">{l}</p>
                    </div>
                  </>
                );
                const cls = "flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)]";
                return onClick ? (
                  <button key={l} type="button" onClick={onClick} className={cn(cls, "transition hover:-translate-y-0.5")}>
                    {body}
                  </button>
                ) : (
                  <div key={l} className={cls}>
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <img
              src="/courses-hero.png?v=2"
              alt="Books, graduation cap, and a plant"
              className="h-auto w-full max-w-[22rem] bg-transparent object-contain object-center"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <FieldIcon icon={Search} tone="purple" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, topics or skills..."
              className={`h-10 w-full rounded-[5px] border border-slate-200 bg-[#F8FAFC] ${fieldWithIconPad} pr-3 text-sm font-bold outline-none placeholder:font-semibold placeholder:text-slate-400 hover:border-[#7C3AED] focus:border-[#7C3AED] focus:bg-white`}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => patchParams({ category: e.target.value })}
                className={SELECT_FOCUS}
              >
                <option value="">All Categories</option>
                {CANONICAL_CATEGORIES.filter((c) => c.id).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                {extraCategories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={level}
                onChange={(e) => patchParams({ level: e.target.value })}
                className={SELECT_FOCUS}
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => patchParams({ sort: e.target.value })}
                className={SELECT_FOCUS}
              >
                <option value="popular">Sort by: Popular</option>
                <option value="newest">Sort by: Newest</option>
                <option value="title">Sort by: Title</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold",
                showFilters ? "border-[#7C3AED] bg-[#F5F3FF] text-[#6D28D9]" : "border-slate-200 bg-white text-slate-700"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <div className="ml-auto flex h-10 overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => setView("grid")}
                className={cn("grid w-10 place-items-center", view === "grid" ? "bg-[#7C3AED] text-white" : "bg-white text-slate-400")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => setView("list")}
                className={cn("grid w-10 place-items-center", view === "list" ? "bg-[#7C3AED] text-white" : "bg-white text-slate-400")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <label className="text-sm font-medium text-slate-600">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-10 rounded-[5px] border border-slate-200 bg-white px-3 text-sm font-bold outline-none hover:border-[#7C3AED] focus:border-[#7C3AED]"
            >
              <option value="">Any length</option>
              <option value="short">Up to 5 weeks</option>
              <option value="medium">6 weeks</option>
              <option value="long">7+ weeks</option>
            </select>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2">
          <div ref={chipRowRef} className="catalog-chips flex min-w-0 flex-1 gap-2.5 overflow-x-auto scroll-smooth">
            {visibleCanonical.map((chip) => {
              const active = category === chip.id;
              const Icon = chip.Icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => patchParams({ category: chip.id })}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition",
                    active
                      ? "border-transparent bg-[#4F46E5] text-white"
                      : "border-[#E5E7EB] bg-white text-[#1E293B]"
                  )}
                >
                  {Icon ? <Icon className={cn("h-4 w-4", active ? "text-white" : chip.iconClass)} strokeWidth={2} /> : null}
                  {chip.label}
                </button>
              );
            })}
            {showAllChips
              ? extraCategories.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => patchParams({ category: name })}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium",
                      category === name ? "border-transparent bg-[#4F46E5] text-white" : "border-[#E5E7EB] bg-white text-[#1E293B]"
                    )}
                  >
                    {name}
                  </button>
                ))
              : null}
          </div>
          <button
            type="button"
            aria-label={showAllChips ? "Hide extra categories" : "Show more categories"}
            onClick={() => {
              setShowAllChips((open) => !open);
              window.setTimeout(() => chipRowRef.current?.scrollBy({ left: 220, behavior: "smooth" }), 0);
            }}
            className="catalog-scroll-btn grid h-10 w-10 shrink-0 place-items-center rounded-lg border-0 bg-[#5D5FEF] text-white shadow-none transition hover:bg-[#4F46E5] active:bg-[#4338CA]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="mt-6">
        {catalog.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : catalog.error ? (
          <ErrorState message={catalog.error.message} onRetry={() => catalog.refetch()} />
        ) : !courses.length ? (
          <EmptyState title="No courses match these filters." description="Try another category, level, or search term." />
        ) : (
          <div className={cn(view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-4")}>
            {courses.map((course) => (
              <CourseCard
                key={idOf(course)}
                course={course}
                href={`/student/courses/${idOf(course)}`}
                maxEnroll={maxEnroll}
                saved={saved.includes(idOf(course))}
                onToggleSave={toggleSave}
                layout={view}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
