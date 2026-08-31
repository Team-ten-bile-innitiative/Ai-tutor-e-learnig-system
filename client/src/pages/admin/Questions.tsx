import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Check,
  CircleHelp,
  Copy,
  FileText,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Question, Quiz } from "@/types";
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { cn, idOf } from "@/lib/utils";

const PAGE_SIZE = 6;

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  short_answer: "Short Answer",
};

function typeBadge(type: string) {
  if (type === "true_false") return "bg-[#DBEAFE] text-[#1D4ED8]";
  if (type === "short_answer") return "bg-[#FFEDD5] text-[#C2410C]";
  return "bg-[#EDE9FE] text-[#6D28D9]";
}

function difficultyBadge(level: string) {
  if (level === "easy") return "bg-[#DCFCE7] text-[#15803D]";
  if (level === "hard") return "bg-[#FEE2E2] text-[#B91C1C]";
  return "bg-[#FFEDD5] text-[#C2410C]";
}

function questionCode(id: string) {
  return `Q${id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase()}`;
}

function formatCreated(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function quizTitle(q: Question) {
  return typeof q.quiz === "object" ? q.quiz.title : "Quiz";
}

function quizCategory(q: Question) {
  return typeof q.quiz === "object" ? q.quiz.course?.category || q.quiz.course?.title || "General" : "General";
}

function quizIdOf(q: Question) {
  return typeof q.quiz === "object" ? idOf(q.quiz) : q.quiz;
}

function pageList(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let n = start; n <= end; n += 1) pages.push(n);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof CircleHelp;
  tone: string;
}) {
  return (
    <Card className="flex min-w-0 items-start gap-3 border-slate-200 p-4 shadow-sm">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
      </div>
    </Card>
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
  const [selected, setSelected] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const quizzes = useQuery({
    queryKey: ["all-quizzes"],
    queryFn: async () => (await api.get("/quizzes", { params: { limit: 80 } })).data.data as Quiz[],
  });
  const { data, isFetching } = useQuery({
    queryKey: ["admin-questions", page, q, quiz, type, difficulty],
    queryFn: async () => (await api.get("/questions", { params: { page, q, quiz, type, difficulty, limit: PAGE_SIZE } })).data,
    placeholderData: keepPreviousData,
  });

  const items: Question[] = data?.data || [];
  const total = data?.pagination?.total || 0;
  const pages = data?.pagination?.pages || 1;
  const stats = data?.stats || { total: 0, multipleChoice: 0, trueFalse: 0, shortAnswer: 0, totalPoints: 0 };
  const pct = (n: number) => (stats.total ? `${((n / stats.total) * 100).toFixed(1)}% of total` : "0% of total");
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);
  const pageIds = items.map((item) => idOf(item));
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const optionLines = useMemo(() => (editing?.options || []).map((o) => o.text).join("\n"), [editing]);

  function resetFilters() {
    setQ("");
    setQuiz("");
    setType("");
    setDifficulty("");
    setPage(1);
    setSelected([]);
  }

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
      setSelected([]);
      toast.success("Question deleted");
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => api.post("/questions/bulk-delete", { ids }),
    onSuccess: () => {
      toast.success("Selected questions deleted");
      setSelected([]);
      setBulk(false);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: (item: Question) =>
      api.post("/questions", {
        quiz: quizIdOf(item),
        questionText: `${item.questionText} (copy)`,
        questionType: item.questionType,
        options: item.options || [],
        correctAnswer: item.correctAnswer || (item.options?.[0]?.text ?? "True"),
        explanation: item.explanation || "",
        difficulty: item.difficulty,
        points: item.points || 1,
        orderIndex: (item.orderIndex || 0) + 1,
      }),
    onSuccess: () => {
      toast.success("Question duplicated");
      setMenuId(null);
      qc.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Questions"
        description="Create and manage questions for your quizzes."
        action={
          <Button onClick={() => setEditing({ questionType: "multiple_choice", options: [], points: 1, difficulty: "medium" })}>
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Create question
          </Button>
        }
      />

      <div className="mb-4 flex w-full flex-col gap-3 lg:flex-row lg:items-center">
        <span className="relative block min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search questions..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </span>
        <Select className="w-full lg:w-44" value={quiz} onChange={(e) => { setQuiz(e.target.value); setPage(1); }}>
          <option value="">All quizzes</option>
          {quizzes.data?.map((item) => (
            <option key={idOf(item)} value={idOf(item)}>
              {item.title}
            </option>
          ))}
        </Select>
        <Select className="w-full lg:w-40" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short Answer</option>
        </Select>
        <Select className="w-full lg:w-40" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Button type="button" variant="secondary" className="shrink-0" onClick={() => setPage(1)}>
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <Button type="button" variant="secondary" className="shrink-0" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Total Questions" value={stats.total} hint="Across all quizzes" icon={CircleHelp} tone="bg-[#EDE9FE] text-[#7C3AED]" />
        <SummaryCard label="Multiple Choice" value={stats.multipleChoice} hint={pct(stats.multipleChoice)} icon={FileText} tone="bg-[#DBEAFE] text-[#2563EB]" />
        <SummaryCard label="True / False" value={stats.trueFalse} hint={pct(stats.trueFalse)} icon={Check} tone="bg-[#DCFCE7] text-[#16A34A]" />
        <SummaryCard label="Short Answer" value={stats.shortAnswer} hint={pct(stats.shortAnswer)} icon={Pencil} tone="bg-[#FFEDD5] text-[#EA580C]" />
        <SummaryCard label="Total Points" value={`${stats.totalPoints} pts`} hint="Total points value" icon={Star} tone="bg-[#FEE2E2] text-[#DC2626]" />
      </div>

      {selected.length ? (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-sm">
          <p className="font-semibold text-[#1D4ED8]">{selected.length} selected</p>
          <Button size="sm" variant="danger" onClick={() => setBulk(true)}>
            Delete selected
          </Button>
        </div>
      ) : null}

      {!items.length ? (
        <EmptyState title="No questions yet." description="Add questions to a quiz before publishing it." action={<Button onClick={() => setEditing({ questionType: "multiple_choice", options: [] })}>Create question</Button>} />
      ) : (
        <Card className={cn("w-full overflow-hidden border-slate-200 shadow-sm", isFetching && "opacity-70")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-line bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(Array.from(new Set([...selected, ...pageIds])));
                        else setSelected(selected.filter((id) => !pageIds.includes(id)));
                      }}
                      className="h-4 w-4 accent-[#2563EB]"
                      aria-label="Select all on this page"
                    />
                  </th>
                  {["Question", "Quiz", "Type", "Difficulty", "Points", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const id = idOf(item);
                  return (
                    <tr key={id} className="border-b border-line last:border-0 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={(e) => setSelected(e.target.checked ? [...selected, id] : selected.filter((x) => x !== id))}
                          className="h-4 w-4 accent-[#2563EB]"
                          aria-label={`Select ${item.questionText}`}
                        />
                      </td>
                      <td className="max-w-[280px] px-3 py-3">
                        <p className="truncate font-semibold text-ink">{item.questionText}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          ID: {questionCode(id)} · {TYPE_LABEL[item.questionType] || item.questionType}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-ink">{quizTitle(item)}</p>
                        <p className="text-xs font-medium text-[#2563EB]">{quizCategory(item)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", typeBadge(item.questionType))}>
                          {TYPE_LABEL[item.questionType]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", difficultyBadge(item.difficulty))}>
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-ink">{item.points} {item.points === 1 ? "pt" : "pts"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">{formatCreated(item.createdAt)}</td>
                      <td className="px-3 py-3">
                        <div className="relative flex items-center gap-1">
                          <button
                            type="button"
                            title="Edit"
                            aria-label="Edit question"
                            onClick={() => setEditing(item)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#2563EB] transition hover:bg-[#EFF6FF]"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete question"
                            onClick={() => setDel(id)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#DC2626] transition hover:bg-[#FEF2F2]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            title="More"
                            aria-label="More actions"
                            onClick={() => setMenuId(menuId === id ? null : id)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                          >
                            <MoreVertical className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                          {menuId === id ? (
                            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={() => duplicate.mutate(item)}
                              >
                                <Copy className="h-3.5 w-3.5" /> Duplicate
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(id);
                                  toast.success("Question ID copied");
                                  setMenuId(null);
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" /> Copy ID
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Showing {from} to {to} of {total} questions
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>
              {pageList(page, pages).map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      "grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-bold",
                      n === page ? "bg-[#2563EB] text-white" : "border border-slate-200 text-ink hover:border-[#2563EB] hover:text-[#2563EB]"
                    )}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </Card>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-slate-900/40 p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold">{editing._id || editing.id ? "Edit question" : "Create question"}</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(Object.fromEntries(new FormData(e.currentTarget)));
              }}
            >
              <div>
                <Label>Quiz</Label>
                <Select name="quiz" defaultValue={typeof editing.quiz === "object" ? idOf(editing.quiz) : editing.quiz} required>
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
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
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
                  <Input name="points" type="number" min={1} defaultValue={editing.points || 1} />
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
                <Button type="submit">{save.isPending ? "Saving…" : "Save"}</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(del)}
        title="Delete this question?"
        explanation="This question will be removed from its quiz."
        danger
        confirmLabel="Delete"
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del)}
      />
      <ConfirmDialog
        open={bulk}
        title={`Delete ${selected.length} questions?`}
        explanation="Selected questions will be removed from their quizzes. This cannot be undone."
        danger
        confirmLabel="Delete"
        onClose={() => setBulk(false)}
        onConfirm={() => bulkDelete.mutate(selected)}
      />
    </div>
  );
}
