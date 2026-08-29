import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Lesson, Quiz } from "@/types";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { idOf } from "@/lib/utils";
import { CourseCatalog } from "@/components/CourseCatalog";

export function StudentCoursesPage() {
  return <CourseCatalog compact />;
}

export function StudentCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, error, refetch } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/courses/${id}`)).data.data,
  });
  const enroll = useMutation({
    mutationFn: () => api.post(`/learning/enroll/${id}`),
    onSuccess: () => {
      toast.success("Enrolled");
      qc.invalidateQueries({ queryKey: ["course", id] });
      const first = data?.lessons?.[0];
      if (first) navigate(`/student/lessons/${idOf(first)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) return <Skeleton className="h-64" />;
  const lessons = (data.lessons || []) as Lesson[];
  const quizzes = (data.quizzes || []) as Quiz[];
  return (
    <div>
      <p className="text-sm text-muted">Courses / {data.title}</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{data.description}</p>
          <div className="mt-3 flex gap-2">
            <Badge tone="indigo">{data.level}</Badge>
            <Badge>{data.duration}</Badge>
          </div>
        </div>
        <Button onClick={() => (data.enrolled ? navigate(`/student/lessons/${idOf(lessons[0])}`) : enroll.mutate())}>
          {data.enrolled ? "Continue Learning" : "Start Learning"}
        </Button>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold">Learning objectives</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {(data.learningObjectives || []).map((o: string) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Lessons</h3>
          <div className="mt-3 space-y-2">
            {lessons.map((l) => (
              <Link key={idOf(l)} to={`/student/lessons/${idOf(l)}`} className="flex justify-between rounded-xl border border-line px-3 py-2 text-sm hover:border-primary">
                <span>{l.title}</span>
                <span className="text-muted">{l.duration}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h3 className="font-semibold">Quizzes</h3>
        <div className="mt-3 space-y-2">
          {quizzes.map((quiz) => (
            <Link key={idOf(quiz)} to={`/student/quizzes/${idOf(quiz)}`} className="flex justify-between rounded-xl border border-line px-3 py-2 text-sm hover:border-primary">
              <span>{quiz.title}</span>
              <span>Pass {quiz.passingScore}%</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StudentLessonsListPage() {
  const { data } = useQuery({
    queryKey: ["student-lessons"],
    queryFn: async () => (await api.get("/lessons", { params: { limit: 30 } })).data.data as Lesson[],
  });
  return (
    <div>
      <PageHeader title="Lessons" description="Published lessons across your courses." />
      {!data?.length ? (
        <EmptyState title="No lessons yet." description="Enroll in a course to see lessons." />
      ) : (
        <div className="space-y-3">
          {data.map((l) => (
            <Link key={idOf(l)} to={`/student/lessons/${idOf(l)}`}>
              <Card className="p-4 hover:border-primary">
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-muted">{l.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentQuizzesListPage() {
  const { data } = useQuery({
    queryKey: ["student-quizzes"],
    queryFn: async () => (await api.get("/quizzes", { params: { limit: 30 } })).data.data as Quiz[],
  });
  return (
    <div>
      <PageHeader title="Quizzes" description="Practice what you have learned." />
      {!data?.length ? (
        <EmptyState title="No quizzes yet." description="Quizzes appear after an admin publishes them." />
      ) : (
        <div className="space-y-3">
          {data.map((quiz) => (
            <Link key={idOf(quiz)} to={`/student/quizzes/${idOf(quiz)}`}>
              <Card className="flex items-center justify-between p-4 hover:border-primary">
                <div>
                  <p className="font-semibold">{quiz.title}</p>
                  <p className="text-sm text-muted">{quiz.description}</p>
                </div>
                <Badge tone="indigo">{quiz.questionCount || 0} questions</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
