import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, Lesson, Question, Quiz } from "@/types";
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
        <Input placeholder="Search lessons" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={course} onChange={(e) => setCourse(e.target.value)}>
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
        <Input placeholder="Search quizzes" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={course} onChange={(e) => setCourse(e.target.value)}>
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

export function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [quiz, setQuiz] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [editing, setEditing] = useState<Partial<Question> | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const quizzes = useQuery({ queryKey: ["all-quizzes"], queryFn: async () => (await api.get("/quizzes", { params: { limit: 50 } })).data.data as Quiz[] });
  const { data } = useQuery({
    queryKey: ["admin-questions", page, q, quiz, type, difficulty],
    queryFn: async () => (await api.get("/questions", { params: { page, q, quiz, type, difficulty, limit: 10 } })).data,
  });
  const optionLines = useMemo(() => (editing?.options || []).map((o) => o.text).join("\n"), [editing]);
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => {
      const options = String(body.options || "")
        .split("\n")
        .map((text, i) => ({ text: text.trim(), order: i + 1 }))
        .filter((o) => o.text);
      const payload = { ...body, options, points: Number(body.points || 1), orderIndex: Number(body.orderIndex || 0) };
      if (editing && (editing._id || editing.id)) return api.patch(`/questions/${idOf(editing as Question)}`, payload);
      return api.post("/questions", payload);
    },
    onSuccess: () => {
      toast.success("Question saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      setDel(null);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
  });

  return (
    <div>
      <PageHeader title="Questions" description="Multiple choice, true/false, and short answer." action={<Button onClick={() => setEditing({ questionType: "multiple_choice", options: [] })}>Create question</Button>} />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Search questions" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={quiz} onChange={(e) => setQuiz(e.target.value)}>
          <option value="">All quizzes</option>
          {quizzes.data?.map((item) => (
            <option key={idOf(item)} value={idOf(item)}>
              {item.title}
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="multiple_choice">Multiple choice</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short answer</option>
        </Select>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>
      {!data?.data?.length ? (
        <EmptyState title="No questions yet." description="Add questions to a quiz before publishing it." />
      ) : (
        <div className="space-y-3">
          {data.data.map((item: Question) => (
            <Card key={idOf(item)} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.questionText}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.questionType.replace("_", " ")} · {item.difficulty} · {item.points} pts
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDel(idOf(item))}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />
      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-slate-900/40 p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold">Question</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(Object.fromEntries(new FormData(e.currentTarget)));
              }}
            >
              <div>
                <Label>Quiz</Label>
                <Select name="quiz" defaultValue={typeof editing.quiz === "object" ? editing.quiz._id : editing.quiz} required>
                  {quizzes.data?.map((item) => (
                    <option key={idOf(item)} value={idOf(item)}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Question</Label>
                <Textarea name="questionText" defaultValue={editing.questionText} required />
              </div>
              <div>
                <Label>Type</Label>
                <Select name="questionType" defaultValue={editing.questionType || "multiple_choice"}>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short answer</option>
                </Select>
              </div>
              <div>
                <Label>Options (one per line)</Label>
                <Textarea name="options" defaultValue={optionLines} placeholder={"x = 5\nx = 10"} />
              </div>
              <div>
                <Label>Correct answer</Label>
                <Input name="correctAnswer" defaultValue={editing.correctAnswer} required />
              </div>
              <div>
                <Label>Explanation</Label>
                <Textarea name="explanation" defaultValue={editing.explanation} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Difficulty</Label>
                  <Select name="difficulty" defaultValue={editing.difficulty || "medium"}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
                <div>
                  <Label>Points</Label>
                  <Input name="points" type="number" defaultValue={editing.points || 1} />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input name="orderIndex" type="number" defaultValue={editing.orderIndex || 1} />
                </div>
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
      <ConfirmDialog open={Boolean(del)} title="Delete this question?" explanation="This question will be removed from its quiz." danger confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del)} />
    </div>
  );
}
