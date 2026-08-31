import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bot, BookOpen, CheckCircle2, Flame, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DashboardSkeleton, ErrorState, PageHeader, StatCard } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { idOf } from "@/lib/utils";
import type { Course } from "@/types";

export function StudentDashboardPage() {
  const { user, refresh } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => (await api.get("/learning/me/dashboard")).data.data,
  });
  useQuery({
    queryKey: ["me-pending-poll"],
    queryFn: async () => {
      await refresh();
      return true;
    },
    enabled: user?.status === "pending",
    refetchInterval: 10000,
  });
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const cont = data.continueLesson?.lesson;
  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.fullName?.split(" ")[0]}!`} description="Keep your streak going and ask the AI Tutor whenever you get stuck." />
      {user?.status === "pending" ? (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Your registration is pending review.</p>
          <p className="mt-1 text-sm text-amber-800">You can use your dashboard while an administrator approves your account.</p>
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In progress" value={data.coursesInProgress} hint="Courses underway" iconTone="blue" icon={<BookOpen className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard label="Completed" value={data.completedCourses} hint="Finished courses" iconTone="green" icon={<CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard label="Avg score" value={`${data.averageScore}%`} hint="Quiz average" iconTone="amber" icon={<Trophy className="h-5 w-5" strokeWidth={2.2} />} />
        <StatCard label="Streak" value={data.streak?.currentStreak || 0} hint={`Longest ${data.streak?.longestStreak || 0} days`} iconTone="orange" icon={<Flame className="h-5 w-5" strokeWidth={2.2} />} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">Continue learning</h3>
          {cont ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{cont.title}</p>
                <p className="text-sm text-muted">{cont.course?.title}</p>
              </div>
              <Link to={`/student/lessons/${idOf(cont)}`}>
                <Button>Resume</Button>
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Start a course to continue here.</p>
          )}
        </Card>
        <Card className="bg-ai-soft p-5">
          <Bot className="h-8 w-8 text-ai" />
          <h3 className="mt-3 font-semibold">Ask AI Tutor</h3>
          <p className="mt-1 text-sm text-muted">Your personal learning assistant is ready.</p>
          <Link to="/student/ai-tutor">
            <Button variant="ai" className="mt-4 w-full">
              Open AI Tutor
            </Button>
          </Link>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Recent quiz results</h3>
          <div className="mt-3 space-y-2 text-sm">
            {data.recentAttempts.length ? (
              data.recentAttempts.map((a: { _id: string; percentage: number; quiz?: { title: string } }) => (
                <Link key={a._id} to={`/student/results/${a._id}`} className="flex justify-between hover:text-primary">
                  <span>{a.quiz?.title}</span>
                  <span>{a.percentage}%</span>
                </Link>
              ))
            ) : (
              <p className="text-muted">No quiz attempts yet.</p>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Recommended for you</h3>
          <div className="mt-3 space-y-3">
            {data.recommended.length ? (
              data.recommended.map((c: Course) => (
                <Link key={idOf(c)} to={`/student/courses/${idOf(c)}`} className="block rounded-xl border border-line p-3 hover:border-primary">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted">{c.category}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">You are enrolled in the available courses.</p>
            )}
          </div>
        </Card>
      </div>
      {data.achievements?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {data.achievements.map((a: { _id: string; title: string }) => (
            <Badge key={a._id} tone="violet">
              {a.title}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
