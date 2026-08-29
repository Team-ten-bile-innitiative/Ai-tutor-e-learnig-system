import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileQuestion, GraduationCap, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { DashboardSkeleton, ErrorState, PageHeader, StatCard } from "@/components/shared";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/analytics/dashboard")).data.data,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const cards = data.cards;
  const pie = [
    { name: "Completed", value: data.completion.completed, color: "#4f46e5" },
    { name: "Remaining", value: data.completion.remaining, color: "#c7d2fe" },
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(" ")[0]}`} description="Platform overview from live database metrics." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Students" value={cards.totalStudents} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Students" value={cards.activeStudents} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Total Courses" value={cards.totalCourses} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Total Lessons" value={cards.totalLessons} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Total Quizzes" value={cards.totalQuizzes} icon={<FileQuestion className="h-5 w-5" />} />
        <StatCard label="Total Questions" value={cards.totalQuestions} icon={<FileQuestion className="h-5 w-5" />} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average Quiz Score" value={`${data.analytics.averageQuizScore}%`} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Course Completion" value={`${data.analytics.courseCompletionRate}%`} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Active Learners" value={data.analytics.activeLearners} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Learning Activity" value={data.analytics.learningActivity} hint="Lesson events (30 days)" icon={<FileQuestion className="h-5 w-5" />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Student growth</h3>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.studentGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area dataKey="count" stroke="#4f46e5" fill="#c7d2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Course completion</h3>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold">Recent activity</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {data.recentActivity.map((a: { _id: string; action: string; entityType: string; createdAt: string; user?: { fullName: string } }) => (
            <div key={a._id} className="flex items-center justify-between text-sm">
              <p>
                <span className="font-medium">{a.user?.fullName || "System"}</span> · {a.action.replaceAll(".", " ")} · {a.entityType}
              </p>
              <span className="text-muted">{formatDate(a.createdAt)}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
