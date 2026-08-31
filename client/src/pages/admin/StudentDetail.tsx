import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ConfirmDialog, ErrorState, PageHeader, ProgressBar, Spinner } from "@/components/shared";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { formatDate, initials } from "@/lib/utils";
import { useState } from "react";

export function AdminStudentDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [statusAction, setStatusAction] = useState<"activate" | "deactivate" | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => (await api.get(`/admin/students/${id}`)).data.data,
  });
  const save = useMutation({
    mutationFn: (body: Record<string, string>) => api.patch(`/admin/students/${id}`, body),
    onSuccess: () => {
      toast.success("Student updated");
      qc.invalidateQueries({ queryKey: ["student", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reset = useMutation({
    mutationFn: () => api.post(`/admin/students/${id}/reset-password`),
    onSuccess: (res) => toast.success(res.data.data?.resetUrl || "Reset link generated"),
  });
  const toggleStatus = useMutation({
    mutationFn: (action: "activate" | "deactivate") => api.post(`/admin/students/${id}/${action}`),
    onSuccess: (_d, action) => {
      toast.success(action === "activate" ? "Student activated" : "Student deactivated");
      setStatusAction(null);
      qc.invalidateQueries({ queryKey: ["student", id] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const s = data.student;
  return (
    <div>
      <PageHeader title={s.fullName} description="Learning performance is generated from real activity — scores cannot be edited." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary text-xl font-bold text-white">
            {initials(s.fullName)}
          </div>
          <p className="mt-4 font-semibold">{s.email}</p>
          <p className="text-sm text-muted">Joined {formatDate(s.createdAt)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={s.status === "active" ? "green" : "amber"}>{s.status}</Badge>
            <Badge tone="indigo">{s.learningLevel}</Badge>
          </div>
          <Button
            className="mt-4 w-full"
            variant={s.status === "active" ? "secondary" : "default"}
            onClick={() => setStatusAction(s.status === "active" ? "deactivate" : "activate")}
          >
            {s.status === "active" ? "Deactivate student" : "Activate student"}
          </Button>
          <Button className="mt-2 w-full" variant="secondary" onClick={() => reset.mutate()}>
            Send password reset
          </Button>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted">Avg score</p>
              <p className="text-xl font-bold">{data.averageScore}%</p>
            </div>
            <div>
              <p className="text-muted">Lessons done</p>
              <p className="text-xl font-bold">{data.completedLessons}</p>
            </div>
            <div>
              <p className="text-muted">Courses done</p>
              <p className="text-xl font-bold">{data.completedCourses}</p>
            </div>
            <div>
              <p className="text-muted">Streak</p>
              <p className="text-xl font-bold">{data.streak?.currentStreak || 0}</p>
            </div>
          </div>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Edit profile</h3>
            </CardHeader>
            <CardBody>
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  save.mutate(Object.fromEntries(fd) as Record<string, string>);
                }}
              >
                <div>
                  <Label>Full name</Label>
                  <Input name="fullName" defaultValue={s.fullName} />
                </div>
                <div>
                  <Label>Learning level</Label>
                  <Select name="learningLevel" defaultValue={s.learningLevel}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Course progress</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {data.courseProgress.map((p: { _id: string; progressPercentage: number; course?: { title: string } }) => (
                <div key={p._id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{p.course?.title}</span>
                    <span>{p.progressPercentage}%</span>
                  </div>
                  <ProgressBar value={p.progressPercentage} />
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent quiz results</h3>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              {data.recentAttempts.map((a: { _id: string; percentage: number; passed: boolean; quiz?: { title: string } }) => (
                <div key={a._id} className="flex justify-between">
                  <span>{a.quiz?.title}</span>
                  <span>
                    {a.percentage}% · {a.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(statusAction)}
        title={statusAction === "activate" ? "Activate this student?" : "Deactivate this student?"}
        explanation={
          statusAction === "activate"
            ? "This student will regain access to the learning platform."
            : "This student will no longer be able to access the learning platform."
        }
        danger={statusAction === "deactivate"}
        confirmLabel={statusAction === "activate" ? "Activate" : "Deactivate"}
        onClose={() => setStatusAction(null)}
        onConfirm={() => statusAction && toggleStatus.mutate(statusAction)}
      />
    </div>
  );
}
