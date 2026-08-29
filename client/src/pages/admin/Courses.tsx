import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course } from "@/types";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, statusTone } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { formatDate, idOf } from "@/lib/utils";

export function AdminCoursesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Partial<Course> | null>(null);
  const [del, setDel] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-courses", page, q, status],
    queryFn: async () => (await api.get("/courses", { params: { page, q, status, limit: 9 } })).data,
  });

  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const objectives = String(body.learningObjectives || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = { ...body, learningObjectives: objectives };
      if (editing && (editing.id || editing._id)) return api.patch(`/courses/${idOf(editing as Course)}`, payload);
      return api.post("/courses", payload);
    },
    onSuccess: () => {
      toast.success("Course saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success("Course deleted");
      setDel(null);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
  });

  const setStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/courses/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courses"] }),
  });

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Create, publish, and archive learning programs."
        action={<Button onClick={() => setEditing({})}>Create course</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Input placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : !data.data.length ? (
        <EmptyState title="No courses yet." description="Create your first course, then add lessons and quizzes." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.data.map((c: Course) => (
            <Card key={idOf(c)} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.title}</h3>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>
              <p className="mt-3 text-xs text-slate-500">
                {c.category} · {c.level} · {typeof c.lessons === "number" ? c.lessons : c.lessons?.length || 0} lessons · {typeof c.quizzes === "number" ? c.quizzes : c.quizzes?.length || 0} quizzes
              </p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(c.createdAt)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>
                  Edit
                </Button>
                {c.status !== "published" ? (
                  <Button size="sm" onClick={() => setStatusMut.mutate({ id: idOf(c), status: "published" })}>
                    Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setStatusMut.mutate({ id: idOf(c), status: "draft" })}>
                    Unpublish
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setStatusMut.mutate({ id: idOf(c), status: "archived" })}>
                  Archive
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDel(idOf(c))}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-slate-900/40 p-4">
          <Card className="w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold">{editing.id || editing._id ? "Edit course" : "Create course"}</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                save.mutate(Object.fromEntries(fd));
              }}
            >
              <div>
                <Label>Title</Label>
                <Input name="title" defaultValue={editing.title} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editing.description} required />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Input name="category" defaultValue={editing.category || "Mathematics"} required />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select name="level" defaultValue={editing.level || "beginner"}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Duration</Label>
                <Input name="duration" defaultValue={editing.duration || "4 weeks"} />
              </div>
              <div>
                <Label>Learning objectives (one per line)</Label>
                <Textarea name="learningObjectives" defaultValue={(editing.learningObjectives || []).join("\n")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(del)}
        title="Delete this course?"
        explanation="Lessons and quizzes in this course will also be removed. This cannot be undone."
        danger
        confirmLabel="Delete"
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del)}
      />
    </div>
  );
}
