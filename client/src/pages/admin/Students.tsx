import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, Eye, GraduationCap, KeyRound, MailCheck, ShieldCheck, Trash2, UserCheck, UserRound, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, ProgressBar, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Input, Label, Select, FieldIcon, fieldWithIconPad } from "@/components/ui/field";
import { idOf, initials, cn } from "@/lib/utils";

export function AdminStudentsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(() => {
    const s = searchParams.get("status") || "";
    return s === "active" || s === "inactive" ? s : "";
  });
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);
  const [newLevel, setNewLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [levelOpen, setLevelOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; action: "activate" | "deactivate" | "delete" } | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const s = searchParams.get("status") || "";
    const next = s === "active" || s === "inactive" ? s : "";
    setStatus(next);
  }, [searchParams]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["students", page, q, status, level, sort],
    queryFn: async () => (await api.get("/admin/students", { params: { page, q, status, level, sort, limit: 8 } })).data,
    placeholderData: keepPreviousData,
  });

  const create = useMutation({
    mutationFn: (body: Record<string, string>) => api.post("/admin/students", body),
    onSuccess: () => {
      toast.success("Student created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "activate" | "deactivate" | "delete" }) =>
      action === "delete"
        ? api.delete(`/admin/students/${id}`)
        : api.post(`/admin/students/${id}/${action === "activate" ? "activate" : "deactivate"}`),
    onSuccess: (_d, vars) => {
      toast.success(vars.action === "delete" ? "Student deleted" : vars.action === "activate" ? "Student activated" : "Student deactivated");
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Manage Students"
        description="Search, filter, and administer learner accounts."
        action={<Button onClick={() => { setNewLevel("beginner"); setLevelOpen(false); setOpen(true); }}>Add student</Button>}
      />
      <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row">
        <Input
          className="min-w-0 flex-1"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Select
          className="w-full sm:w-40"
          value={status}
          onChange={(e) => {
            const next = e.target.value;
            setStatus(next);
            setPage(1);
            const params = new URLSearchParams(searchParams);
            if (next) params.set("status", next);
            else params.delete("status");
            setSearchParams(params, { replace: true });
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          className="w-full sm:w-40"
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
        <Select
          className="w-full sm:w-36"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </Select>
      </div>
      {isLoading && !data ? (
        <TableSkeleton />
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState title="No students yet." description="Add a student to get started." />
      ) : (
        <Card className={cn("w-full overflow-hidden", isFetching ? "opacity-70" : "")}>
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="border-b border-line bg-slate-50 text-muted">
              <tr>
                {["Student", "Level", "Status", "Courses", "Progress", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((s: User) => (
                <tr key={idOf(s)} className="border-b border-line last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {initials(s.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.fullName}</p>
                        <p className="truncate text-xs text-muted">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 capitalize">{s.learningLevel}</td>
                  <td className="px-3 py-3">
                    <Badge tone={s.status === "active" ? "green" : "amber"}>{s.status}</Badge>
                  </td>
                  <td className="px-3 py-3">{s.courses ?? 0}</td>
                  <td className="px-3 py-3">
                    <ProgressBar value={s.progress || 0} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/admin/students/${idOf(s)}`}
                        title="View student details"
                        aria-label="View student details"
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#2563EB] transition hover:bg-[#EFF6FF]"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2.2} />
                      </Link>
                      <button
                        type="button"
                        title={s.status === "active" ? "Deactivate student" : "Activate student"}
                        aria-label={s.status === "active" ? "Deactivate student" : "Activate student"}
                        onClick={() =>
                          setConfirm({ id: idOf(s), action: s.status === "active" ? "deactivate" : "activate" })
                        }
                        className={
                          s.status === "active"
                            ? "grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#EA580C] transition hover:bg-[#FFF7ED]"
                            : "grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#16A34A] transition hover:bg-[#F0FDF4]"
                        }
                      >
                        {s.status === "active" ? (
                          <UserX className="h-4 w-4" strokeWidth={2.2} />
                        ) : (
                          <UserCheck className="h-4 w-4" strokeWidth={2.2} />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Delete user"
                        aria-label="Delete user"
                        onClick={() => setConfirm({ id: idOf(s), action: "delete" })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#DC2626] transition hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="flex max-h-[min(90vh,36rem)] w-full max-w-lg flex-col overflow-hidden p-0">
            <h3 className="shrink-0 px-6 pb-2 pt-5 text-lg font-semibold">Add student</h3>
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const password = String(fd.get("password") || "");
                const confirmPassword = String(fd.get("confirmPassword") || "");
                if (password !== confirmPassword) {
                  toast.error("Passwords do not match");
                  return;
                }
                create.mutate({
                  fullName: String(fd.get("fullName") || ""),
                  email: String(fd.get("email") || ""),
                  password,
                  learningLevel: newLevel,
                });
              }}
            >
              <div className="hide-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-2">
              <div>
                <Label>Full name</Label>
                <span className="relative block">
                  <FieldIcon icon={UserRound} tone="rose" />
                  <Input name="fullName" required placeholder="Enter your full name" className={fieldWithIconPad} />
                </span>
              </div>
              <div>
                <Label>Email</Label>
                <span className="relative block">
                  <FieldIcon icon={MailCheck} tone="teal" />
                  <Input name="email" type="email" required placeholder="Enter your email" className={fieldWithIconPad} />
                </span>
              </div>
              <div>
                <Label>Password</Label>
                <span className="relative block">
                  <FieldIcon icon={KeyRound} tone="amber" />
                  <Input name="password" type="password" minLength={8} placeholder="Enter your password" className={fieldWithIconPad} />
                </span>
              </div>
              <div>
                <Label>Confirm password</Label>
                <span className="relative block">
                  <FieldIcon icon={ShieldCheck} tone="blue" />
                  <Input name="confirmPassword" type="password" minLength={8} placeholder="Confirm your password" className={fieldWithIconPad} />
                </span>
              </div>
              <div className={levelOpen ? "relative" : "relative"}>
                <Label>Learning level</Label>
                  <button
                    type="button"
                    onClick={() => setLevelOpen((v) => !v)}
                    className={`${fieldWithIconPad} relative flex h-11 w-full items-center rounded-xl border border-line bg-white pr-10 text-left text-sm font-bold text-[#0F172A] capitalize hover:border-slate-400`}
                    aria-expanded={levelOpen}
                    aria-haspopup="listbox"
                  >
                    <FieldIcon icon={GraduationCap} tone="green" />
                    {newLevel}
                    <ChevronDown className={`absolute right-3 h-4 w-4 text-slate-400 transition ${levelOpen ? "rotate-180" : ""}`} />
                  </button>
                  {levelOpen ? (
                    <ul
                      role="listbox"
                      className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      {(["beginner", "intermediate", "advanced"] as const).map((opt) => (
                        <li key={opt}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={newLevel === opt}
                            className={`flex w-full px-4 py-2.5 text-left text-sm font-semibold capitalize hover:bg-slate-50 ${newLevel === opt ? "bg-[#F0FDF4] text-[#16A34A]" : "text-ink"}`}
                            onClick={() => {
                              setNewLevel(opt);
                              setLevelOpen(false);
                            }}
                          >
                            {opt}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
              </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2 border-t border-line px-6 py-4">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === "delete"
            ? "Delete this student?"
            : confirm?.action === "activate"
              ? "Activate this student?"
              : "Deactivate this student?"
        }
        explanation={
          confirm?.action === "delete"
            ? "This user and their enrollments will be removed. This cannot be undone."
            : confirm?.action === "activate"
              ? "This student will regain access to the learning platform."
              : "This student will no longer be able to access the learning platform."
        }
        danger={confirm?.action !== "activate"}
        confirmLabel={confirm?.action === "delete" ? "Delete" : confirm?.action === "activate" ? "Activate" : "Deactivate"}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && act.mutate(confirm)}
      />
    </div>
  );
}
