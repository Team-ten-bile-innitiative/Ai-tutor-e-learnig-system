import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, Lesson, Quiz } from "@/types";
import { ConfirmDialog, EmptyState, PageHeader, Pagination, statusTone } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { MarkdownBody } from "@/components/MarkdownBody";
import { idOf } from "@/lib/utils";

export function AdminLessonsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [editing, setEditing] = useState<Partial<Lesson> | null>(null);
  const [preview, setPreview] = useState("");
  const [del, setDel] = useState<string | null>(null);
  const courses = useQuery({ queryKey: ["all-courses"], queryFn: async () => (await api.get("/courses", { params: { limit: 50 } })).data.data as Course[] });
  const { data } = useQuery({
    queryKey: ["admin-lessons", page, q, course],
    queryFn: async () => (await api.get("/lessons", { params: { page, q, course, limit: 10 } })).data,
    placeholderData: keepPreviousData,
  });
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const payload = {
        ...body,
        orderIndex: Number(body.orderIndex || 0),
        learningObjectives: String(body.learningObjectives || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing && (editing._id || editing.id)) return api.patch(`/lessons/${idOf(editing as Lesson)}`, payload);
      return api.post("/lessons", payload);
    },
    onSuccess: () => {
      toast.success("Lesson saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/lessons/${id}`),
    onSuccess: () => {
      toast.success("Deleted");
      setDel(null);
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
  });

  return (
    <div>
      <PageHeader title="Lessons" description="Write content, preview, then publish." action={<Button onClick={() => setEditing({ content: "# New lesson\n" })}>Create lesson</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Input placeholder="Search lessons" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }}>
          <option value="">All courses</option>
          {courses.data?.map((c) => (
            <option key={idOf(c)} value={idOf(c)}>
              {c.title}
            </option>
          ))}
        </Select>
      </div>
      {!data?.data?.length ? (
        <EmptyState title="No lessons yet." description="Create a lesson and assign it to a course." />
      ) : (
        <div className="space-y-3">
          {data.data.map((l: Lesson) => (
            <Card key={idOf(l)} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="text-xs text-muted">
                  {(typeof l.course === "object" ? l.course.title : "Course")} · order {l.orderIndex} · {l.duration}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                <Button size="sm" variant="secondary" onClick={() => setEditing(l)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDel(idOf(l))}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />
      {editing ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/40 p-4">
          <Card className="mx-auto my-6 max-w-5xl p-6">
            <h3 className="text-lg font-semibold">Lesson editor</h3>
            <form
              className="mt-4 grid gap-4 lg:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                save.mutate(Object.fromEntries(fd));
              }}
            >
              <div className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input name="title" defaultValue={editing.title} required />
                </div>
                <div>
                  <Label>Course</Label>
                  <Select name="course" defaultValue={typeof editing.course === "object" ? editing.course._id : editing.course} required>
                    {courses.data?.map((c) => (
                      <option key={idOf(c)} value={idOf(c)}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" defaultValue={editing.description} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duration</Label>
                    <Input name="duration" defaultValue={editing.duration || "15 min"} />
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Input name="orderIndex" type="number" defaultValue={editing.orderIndex || 1} />
                  </div>
                </div>
                <div>
                  <Label>Video URL</Label>
                  <Input name="videoUrl" defaultValue={editing.videoUrl} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing.status || "draft"}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </div>
                <div>
                  <Label>Learning objectives (one per line)</Label>
                  <Textarea name="learningObjectives" defaultValue={(editing.learningObjectives || []).join("\n")} />
                </div>
                <div>
                  <Label>Content (Markdown: headings, lists, links, code, quotes)</Label>
                  <Textarea
                    name="content"
                    className="min-h-56"
                    defaultValue={editing.content}
                    onChange={(e) => setPreview(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="min-h-96 rounded-xl border border-line bg-slate-50 p-4">
                  <MarkdownBody>{preview || editing.content || ""}</MarkdownBody>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save lesson</Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
      <ConfirmDialog open={Boolean(del)} title="Delete this lesson?" explanation="Students will no longer see this lesson." danger confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del)} />
    </div>
  );
}

export function AdminQuizzesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("");
  const [editing, setEditing] = useState<Partial<Quiz> | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const courses = useQuery({ queryKey: ["all-courses"], queryFn: async () => (await api.get("/courses", { params: { limit: 50 } })).data.data as Course[] });
  const lessons = useQuery({ queryKey: ["all-lessons-mini"], queryFn: async () => (await api.get("/lessons", { params: { limit: 50 } })).data.data as Lesson[] });
  const { data } = useQuery({
    queryKey: ["admin-quizzes", page, q, course],
    queryFn: async () => (await api.get("/quizzes", { params: { page, q, course, limit: 10 } })).data,
    placeholderData: keepPreviousData,
  });
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const payload = {
        ...body,
        passingScore: Number(body.passingScore || 70),
        timeLimit: Number(body.timeLimit || 0),
        attemptLimit: Number(body.attemptLimit || 3),
        lesson: body.lesson || null,
      };
      if (editing && (editing._id || editing.id)) return api.patch(`/quizzes/${idOf(editing as Quiz)}`, payload);
      return api.post("/quizzes", payload);
    },
    onSuccess: () => {
      toast.success("Quiz saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/${id}`),
    onSuccess: () => {
      setDel(null);
      qc.invalidateQueries({ queryKey: ["admin-quizzes"] });
    },
  });

  return (
    <div>
      <PageHeader title="Quizzes" description="Set passing score, time limit, and attempts." action={<Button onClick={() => setEditing({})}>Create quiz</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Input placeholder="Search quizzes" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select value={course} onChange={(e) => { setCourse(e.target.value); setPage(1); }}>
          <option value="">All courses</option>
          {courses.data?.map((c) => (
            <option key={idOf(c)} value={idOf(c)}>
              {c.title}
            </option>
          ))}
        </Select>
      </div>
      {!data?.data?.length ? (
        <EmptyState title="No quizzes yet." description="Create a quiz after you have a course." />
      ) : (
        <div className="space-y-3">
          {data.data.map((quiz: Quiz) => (
            <Card key={idOf(quiz)} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{quiz.title}</p>
                <p className="text-xs text-muted">
                  Pass {quiz.passingScore}% · {quiz.timeLimit ? `${quiz.timeLimit} min` : "No timer"} · {quiz.questionCount || 0} questions
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone={statusTone(quiz.status)}>{quiz.status}</Badge>
                <Button size="sm" variant="secondary" onClick={() => setEditing(quiz)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDel(idOf(quiz))}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />
      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold">Quiz</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(Object.fromEntries(new FormData(e.currentTarget)));
              }}
            >
              <div>
                <Label>Title</Label>
                <Input name="title" defaultValue={editing.title} required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editing.description} />
              </div>
              <div>
                <Label>Course</Label>
                <Select name="course" defaultValue={typeof editing.course === "object" ? editing.course._id : editing.course} required>
                  {courses.data?.map((c) => (
                    <option key={idOf(c)} value={idOf(c)}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Lesson (optional)</Label>
                <Select name="lesson" defaultValue={typeof editing.lesson === "object" ? editing.lesson._id : editing.lesson || ""}>
                  <option value="">None</option>
                  {lessons.data?.map((l) => (
                    <option key={idOf(l)} value={idOf(l)}>
                      {l.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Pass %</Label>
                  <Input name="passingScore" type="number" defaultValue={editing.passingScore ?? 70} />
                </div>
                <div>
                  <Label>Time (min)</Label>
                  <Input name="timeLimit" type="number" defaultValue={editing.timeLimit ?? 0} />
                </div>
                <div>
                  <Label>Attempts</Label>
                  <Input name="attemptLimit" type="number" defaultValue={editing.attemptLimit ?? 3} />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editing.status || "draft"}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
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
      <ConfirmDialog open={Boolean(del)} title="Delete this quiz?" explanation="Questions in this quiz will also be removed." danger confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del)} />
    </div>
  );
}

export { AdminQuestionsPage } from "./Questions";
