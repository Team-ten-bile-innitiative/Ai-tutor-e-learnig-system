import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, CircleHelp, Clock3, Download, Trophy, UserRound, Users } from "lucide-react";
import { useState } from "react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ErrorState, PageHeader, StatCard } from "@/components/shared";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type PopularCourse = { title: string; enrollments: number; thumbnailUrl?: string; category?: string };
type HardQuestion = { question: string; misses: number; difficulty?: string };
type Kpi = { key: string; label: string; value: string | number; change: number; spark: number[]; color: string };
type Slice = { name: string; value: number; color: string };
type GrowthPoint = { date: string; newUsers: number; activeUsers: number };

const DIST_COLORS = ["#2563EB", "#0D9488", "#F59E0B"];
const QUIZ_COLORS = ["#16A34A", "#2563EB", "#EA580C"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeFor(preset: "7" | "month" | "year") {
  const to = new Date();
  const from = new Date();
  if (preset === "7") from.setDate(to.getDate() - 6);
  if (preset === "month") from.setDate(1);
  if (preset === "year") {
    from.setMonth(0);
    from.setDate(1);
  }
  return { from: iso(from), to: iso(to) };
}
function formatDay(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

function SevenDayTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (x == null || y == null || !payload?.value) return null;
  const d = new Date(`${payload.value}T00:00:00`);
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={14} textAnchor="middle" fill="#64748B" fontSize={11} fontWeight={600}>
        {d.getDate()}
      </text>
      <text dy={28} textAnchor="middle" fill="#94A3B8" fontSize={10}>
        {d.toLocaleDateString("en-US", { month: "short" })}
      </text>
    </g>
  );
}

const cardHover =
  "border-slate-200 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-[#93C5FD] hover:shadow-[0_14px_28px_rgba(37,99,235,0.14)]";

function ChartTip({
  active,
  payload,
  label,
  grain,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  grain: "day" | "month";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-ink">{label ? (grain === "month" ? formatMonthLabel(label) : formatDay(label)) : ""}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 text-muted">
          {p.name}: <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AdminAnalyticsPage() {
  const initial = rangeFor("7");
  const [preset, setPreset] = useState<"7" | "month" | "year">("7");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const grain = preset === "year" ? "month" : "day";
  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["analytics-full", from, to, grain],
    queryFn: async () => (await api.get("/analytics/full", { params: { from, to, grain } })).data.data,
    placeholderData: keepPreviousData,
  });

  const kpis: Kpi[] = data?.kpis || [];
  const popular: PopularCourse[] = data?.popularCourses || [];
  const maxEnroll = Math.max(1, ...popular.map((c) => c.enrollments || 0));
  const growth: GrowthPoint[] = data?.growth || [];
  const activityParts: Slice[] = data?.activity?.parts || [];
  const activityTotal = data?.activity?.total || 0;
  const distribution: Slice[] = (data?.distribution || []).map((d: Slice, i: number) => ({ ...d, color: DIST_COLORS[i % DIST_COLORS.length] }));
  const quizPerformance: Slice[] = (data?.quizPerformance || []).map((d: Slice, i: number) => ({ ...d, color: QUIZ_COLORS[i % QUIZ_COLORS.length] }));
  const distTotal = Math.max(1, distribution.reduce((s, d) => s + d.value, 0));
  const quizTotal = Math.max(1, quizPerformance.reduce((s, d) => s + d.value, 0));
  const quizSlices = quizPerformance.some((p) => p.value > 0) ? quizPerformance.filter((p) => p.value > 0) : [{ name: "No attempts", value: 1, color: "#CBD5E1" }];
  const kpiMeta: Record<string, { to: string; iconTone: "blue" | "teal" | "amber" | "orange" | "violet"; Icon: typeof Users; hint: string }> = {
  users: { to: "/admin/students", iconTone: "blue", Icon: Users, hint: "All learner accounts" },
  active: { to: "/admin/students?status=active", iconTone: "teal", Icon: UserRound, hint: "Recently active" },
  courses: { to: "/admin/courses", iconTone: "amber", Icon: BookOpen, hint: "Course catalog" },
  quizzes: { to: "/admin/quizzes", iconTone: "orange", Icon: Trophy, hint: "Quiz attempts" },
  study: { to: "/admin/lessons", iconTone: "violet", Icon: Clock3, hint: "Time on lessons" },
};
  const hard: HardQuestion[] = data?.difficultQuestions || [];

  function exportCsv() {
    if (!data) return;
    const lines = [
      ["Metric", "Value"],
      ...kpis.map((k) => [k.label, String(k.value)]),
      [],
      ["Top courses", "Enrollments"],
      ...popular.map((c) => [c.title, String(c.enrollments)]),
    ];
    const csv = lines.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  }

  if (error && !data) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader compact title="Analytics Overview" description="Track performance, engagement and growth across the platform." />
        <Button type="button" variant="secondary" className="h-10 shrink-0" onClick={exportCsv} disabled={!data}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {isLoading && !data ? (
        <p className="text-sm text-muted">Loading metrics…</p>
      ) : data ? (
        <div className={cn("space-y-4", isFetching && "opacity-80")}>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-5">
            {kpis.map((k) => {
              const meta = kpiMeta[k.key] || kpiMeta.users;
              return (
                <StatCard
                  key={k.key}
                  compact
                  to={meta.to}
                  label={k.label}
                  value={k.value}
                  hint={meta.hint}
                  iconTone={meta.iconTone}
                  icon={<meta.Icon className="h-5 w-5" strokeWidth={2.2} />}
                />
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <Card className={cn(cardHover, "lg:col-span-6")}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">User growth</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {grain === "month" ? "New sign-ups and active learners by month" : "New sign-ups and active learners by day"}
                  </p>
                </div>
                <Select
                  className="h-9 w-[10rem] text-xs font-semibold"
                  value={preset}
                  onChange={(e) => {
                    const next = e.target.value as "7" | "month" | "year";
                    setPreset(next);
                    const range = rangeFor(next);
                    setFrom(range.from);
                    setTo(range.to);
                  }}
                >
                  <option value="7">Last 7 days</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </Select>
              </CardHeader>
              <CardBody className="flex h-80 flex-col pt-0">
                <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth} margin={{ top: 10, right: 18, left: 0, bottom: preset === "7" ? 18 : 8 }}>
                    <defs>
                      <linearGradient id="newFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EA580C" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="activeFillA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      interval={preset === "month" ? Math.max(0, Math.ceil(growth.length / 6) - 1) : 0}
                      minTickGap={preset === "7" ? 0 : 8}
                      padding={{ left: 12, right: 16 }}
                      tick={preset === "7" ? <SevenDayTick /> : { fill: "#64748B", fontSize: 11 }}
                      tickFormatter={preset === "7" ? undefined : (v) => (grain === "month" ? formatMonthLabel(v) : formatDay(v))}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} width={28} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip grain={grain} />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }} />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      name="New users"
                      stroke="#EA580C"
                      fill="url(#newFill)"
                      strokeWidth={2.4}
                      dot={preset === "7" ? { r: 3, fill: "#fff", stroke: "#EA580C", strokeWidth: 2 } : false}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active users"
                      stroke="#7C3AED"
                      fill="url(#activeFillA)"
                      strokeWidth={2.4}
                      dot={preset === "7" ? { r: 3, fill: "#fff", stroke: "#7C3AED", strokeWidth: 2 } : false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
                <div className="mt-1 flex justify-center gap-5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#EA580C]" /> New users</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> Active users</span>
                </div>
              </CardBody>
            </Card>

            <Card className={cn(cardHover, "lg:col-span-3")}>
              <CardHeader>
                <h3 className="font-semibold text-ink">Learning activity</h3>
                <p className="mt-0.5 text-xs text-muted">Total activities: {activityTotal}</p>
              </CardHeader>
              <CardBody>
                <div className="relative h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={activityParts.some((p) => p.value > 0) ? activityParts : [{ name: "None", value: 1, color: "#E2E8F0" }]} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none">
                        {activityParts.map((p) => (
                          <Cell key={p.name} fill={p.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <p className="text-lg font-bold text-ink">{activityTotal}</p>
                  </div>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {activityParts.map((p) => (
                    <li key={p.name} className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className="font-semibold text-ink">{activityTotal ? Math.round((p.value / activityTotal) * 1000) / 10 : 0}%</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card className={cn(cardHover, "lg:col-span-3")}>
              <CardHeader>
                <h3 className="font-semibold text-ink">Top courses</h3>
              </CardHeader>
              <CardBody className="space-y-3">
                {popular.length ? (
                  popular.map((c) => (
                    <div key={c.title} className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                        {c.thumbnailUrl ? (
                          <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                          <span className="shrink-0 text-xs font-bold text-[#2563EB]">{c.enrollments}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${Math.round((c.enrollments / maxEnroll) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No enrollments yet.</p>
                )}
                <Link to="/admin/courses" className="block pt-1 text-center text-xs font-bold text-[#2563EB]">
                  View all courses
                </Link>
              </CardBody>
            </Card>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <Card className={cn("min-w-0 flex-1", cardHover)}>
              <CardHeader>
                <h3 className="font-semibold text-ink">User distribution</h3>
                <p className="mt-0.5 text-xs text-muted">Learning levels from student profiles</p>
              </CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <ul className="space-y-2.5">
                  {distribution.map((d) => (
                    <li key={d.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-ink">{d.name}</span>
                        <span className="font-semibold" style={{ color: d.color }}>
                          {Math.round((d.value / distTotal) * 1000) / 10}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / distTotal) * 100}%`, background: d.color }} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div>
                  <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="#fff" strokeWidth={3}>
                          {distribution.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <p className="text-xl font-bold text-ink">{data.totals.students}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">students</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className={cn("min-w-0 flex-1", cardHover)}>
              <CardHeader>
                <h3 className="font-semibold text-ink">Quiz performance</h3>
                <p className="mt-0.5 text-xs text-muted">Submitted attempts</p>
              </CardHeader>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <div className="relative h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={quizSlices} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="#fff" strokeWidth={3}>
                        {quizSlices.map((p) => (
                          <Cell key={p.name} fill={p.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <p className="text-xl font-bold text-ink">{quizPerformance.reduce((s, p) => s + p.value, 0)}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">attempts</p>
                    </div>
                  </div>
                </div>
                <ul className="flex flex-col justify-center space-y-2.5">
                  {quizPerformance.map((p) => (
                    <li key={p.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="inline-flex items-center gap-2 font-medium text-ink">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                          {p.name}
                        </span>
                        <span className="font-semibold" style={{ color: p.color }}>
                          {Math.round((p.value / quizTotal) * 1000) / 10}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${(p.value / quizTotal) * 100}%`, background: p.color }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          <Card className={cardHover}>
            <CardHeader>
              <h3 className="font-semibold text-ink">Most difficult questions</h3>
              <p className="mt-0.5 text-xs text-muted">Questions students miss most on submitted quizzes</p>
            </CardHeader>
            <CardBody>
              {hard.length ? (
                <ul className="space-y-2">
                  {hard.map((q, i) => (
                    <li key={`${q.question}-${i}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEF3C7] text-sm font-bold text-[#D97706]">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0F172A]">{q.question}</p>
                        <p className="mt-1 text-xs font-medium text-muted">{q.difficulty ? `${q.difficulty} · ` : ""}{q.misses} incorrect answers</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-xs font-bold text-[#BE123C]">{q.misses} misses</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#BFDBFE] bg-[#EFF6FF] px-6 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#2563EB] shadow-sm">
                    <CircleHelp className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-[#0F172A]">No missed questions yet</p>
                  <p className="mt-1 max-w-sm text-sm text-muted">This list fills automatically after students submit quizzes with incorrect answers.</p>
                  <Link to="/admin/quizzes" className="mt-4 text-sm font-bold text-[#2563EB]">
                    Open quizzes
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
