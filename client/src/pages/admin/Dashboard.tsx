import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardCheck,
  FolderX,
  GraduationCap,
  HelpCircle,
  KeyRound,
  Library,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { DashboardSkeleton, ErrorState, PageHeader, StatCard } from "@/components/shared";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  if (!year || !m) return month;
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const ACTION_LABELS: Record<string, string> = {
  "student.registered": "Student registered",
  "student.created": "Student created",
  "student.updated": "Student updated",
  "student.activated": "Student activated",
  "student.deactivated": "Student deactivated",
  "student.deleted": "Student deleted",
  "student.reset_password": "Password reset sent",
  "course.created": "Course created",
  "course.updated": "Course updated",
  "course.deleted": "Course deleted",
  "course.published": "Course published",
  "course.unpublished": "Course unpublished",
  "category.renamed": "Category renamed",
  "category.purged": "Category removed",
  "courses.pruned": "Courses pruned",
  "lesson.created": "Lesson created",
  "lesson.updated": "Lesson updated",
  "lesson.deleted": "Lesson deleted",
  "quiz.created": "Quiz created",
  "quiz.updated": "Quiz updated",
  "quiz.deleted": "Quiz deleted",
  "question.created": "Question created",
};

const ENTITY_PATH: Record<string, string> = {
  user: "/admin/students",
  course: "/admin/courses",
  lesson: "/admin/lessons",
  quiz: "/admin/quizzes",
  question: "/admin/questions",
};

function activityStyle(action: string): { Icon: LucideIcon; wrap: string; icon: string } {
  if (action.includes("deleted") || action.includes("purged") || action.includes("pruned")) {
    return { Icon: action.includes("category") ? FolderX : Trash2, wrap: "bg-[#FEE2E2]", icon: "text-[#DC2626]" };
  }
  if (action.includes("deactivated") || action.includes("unpublished")) {
    return { Icon: UserX, wrap: "bg-[#FFEDD5]", icon: "text-[#EA580C]" };
  }
  if (action.includes("activated") || action.includes("published")) {
    return { Icon: UserCheck, wrap: "bg-[#DCFCE7]", icon: "text-[#16A34A]" };
  }
  if (action.includes("registered") || action.includes("created")) {
    return { Icon: action.startsWith("student") ? UserPlus : Plus, wrap: "bg-[#DCFCE7]", icon: "text-[#16A34A]" };
  }
  if (action.includes("updated") || action.includes("renamed")) {
    return { Icon: Pencil, wrap: "bg-[#DBEAFE]", icon: "text-[#2563EB]" };
  }
  if (action.includes("reset")) {
    return { Icon: KeyRound, wrap: "bg-[#FEF3C7]", icon: "text-[#D97706]" };
  }
  if (action.startsWith("lesson")) return { Icon: NotebookPen, wrap: "bg-[#EDE9FE]", icon: "text-[#7C3AED]" };
  if (action.startsWith("quiz")) return { Icon: ClipboardCheck, wrap: "bg-[#FFEDD5]", icon: "text-[#EA580C]" };
  if (action.startsWith("question")) return { Icon: HelpCircle, wrap: "bg-[#CFFAFE]", icon: "text-[#0891B2]" };
  if (action.startsWith("course") || action.startsWith("category")) return { Icon: BookOpen, wrap: "bg-[#CCFBF1]", icon: "text-[#0D9488]" };
  return { Icon: Users, wrap: "bg-[#DBEAFE]", icon: "text-[#2563EB]" };
}

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-ink">{label ? formatMonth(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 text-muted">
          {p.name}: <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function CompletionTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-ink">{payload[0].name}</p>
      <p className="mt-0.5 text-muted">{payload[0].value} enrollments</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/analytics/dashboard")).data.data,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const cards = data.cards;
  const completed = data.completion.completed;
  const remaining = data.completion.remaining;
  const total = completed + remaining;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const pie = [
    { name: "Completed", value: Math.max(0, completed), color: "#F59E0B" },
    { name: "In progress", value: Math.max(0, remaining), color: "#0891B2" },
  ].filter((p) => p.value > 0);
  const pieData = pie.length ? pie : [{ name: "No enrollments", value: 1, color: "#E2E8F0" }];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(" ")[0]}`} description="Platform overview from live database metrics." />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard compact to="/admin/students" label="Students" value={cards.totalStudents} hint="All learner accounts" iconTone="blue" icon={<Users className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard compact to="/admin/students?status=active" label="Active" value={cards.activeStudents} hint="Active this month" iconTone="green" icon={<GraduationCap className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard compact to="/admin/courses" label="Courses" value={cards.totalCourses} hint="Course catalog" iconTone="teal" icon={<Library className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard compact to="/admin/lessons" label="Lessons" value={cards.totalLessons} hint="Published lessons" iconTone="violet" icon={<NotebookPen className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard compact to="/admin/quizzes" label="Quizzes" value={cards.totalQuizzes} hint="Quiz bank" iconTone="orange" icon={<ClipboardCheck className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard compact to="/admin/questions" label="Questions" value={cards.totalQuestions} hint="Question bank" iconTone="cyan" icon={<HelpCircle className="h-5 w-5" strokeWidth={2.2} />} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink">Student growth</h3>
              <p className="mt-0.5 text-xs text-muted">New sign-ups and active learners by month</p>
            </div>
            <div className="hidden gap-4 text-xs text-muted sm:flex">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0D9488]" /> New</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Active</span>
            </div>
          </CardHeader>
          <CardBody className="h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.studentGrowth} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="newUsersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="activeUsersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<GrowthTooltip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  name="New users"
                  stroke="#0D9488"
                  fill="url(#newUsersFill)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#fff", stroke: "#0D9488", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  name="Active users"
                  stroke="#2563EB"
                  fill="url(#activeUsersFill)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#fff", stroke: "#2563EB", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <h3 className="font-semibold text-ink">Course completion</h3>
            <p className="mt-0.5 text-xs text-muted">Completed vs in-progress enrollments</p>
          </CardHeader>
          <CardBody className="h-80">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {pieData.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CompletionTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-ink">{completionPct}%</p>
                  <p className="text-xs font-medium text-muted">completed</p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-6 text-sm">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                Completed <span className="font-semibold text-ink">{completed}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0891B2]" />
                In progress <span className="font-semibold text-ink">{remaining}</span>
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">Recent activity</h3>
            <p className="mt-0.5 text-xs text-muted">Live actions from the platform</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-2">
          {data.recentActivity?.length ? (
            data.recentActivity.map(
              (a: { _id: string; action: string; entityType: string; entityId?: string; createdAt: string; user?: { fullName: string } }) => {
                const style = activityStyle(a.action);
                const Icon = style.Icon;
                const href =
                  a.entityType === "user" && a.entityId
                    ? `/admin/students/${a.entityId}`
                    : ENTITY_PATH[a.entityType] || "/admin/dashboard";
                const title = ACTION_LABELS[a.action] || a.action.replaceAll(".", " ").replaceAll("_", " ");
                return (
                  <Link
                    key={a._id}
                    to={href}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 transition hover:border-[#93C5FD] hover:bg-[#EFF6FF]"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.wrap}`}>
                      <Icon className={`h-4 w-4 ${style.icon}`} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{title}</span>
                      <span className="block truncate text-xs text-muted">
                        {a.user?.fullName || "System"} · {a.entityType}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-slate-400">{formatDate(a.createdAt)}</span>
                  </Link>
                );
              }
            )
          ) : (
            <p className="py-6 text-center text-sm text-muted">No recent activity yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
