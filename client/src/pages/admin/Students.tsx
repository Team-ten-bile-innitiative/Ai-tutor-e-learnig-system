import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, ProgressBar, TableSkeleton } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { formatDate, idOf, initials } from "@/lib/utils";

export function AdminStudentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; action: "deactivate" | "activate" } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["students", page, q, status, level, sort],
    queryFn: async () => (await api.get("/admin/students", { params: { page, q, status, level, sort, limit: 8 } })).data,
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
    mutationFn: ({ id, action }: { id: string; action: string }) => api.post(`/admin/students/${id}/${action}`),
    onSuccess: () => {
      toast.success("Student updated");
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Manage Students"
        description="Search, filter, and administer learner accounts."
        action={<Button onClick={() => setOpen(true)}>Add student</Button>}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </Select>
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data.data.length ? (
        <EmptyState title="No students yet." description="Add a student to get started." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-slate-50 text-muted">
              <tr>
                {["Student", "Level", "Status", "Courses", "Avg score", "Progress", "Last active", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((s: User) => (
                <tr key={idOf(s)} className="border-b border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {initials(s.fullName)}
                      </div>
                      <div>
                        <p className="font-medium">{s.fullName}</p>
                        <p className="text-xs text-muted">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="capitalize px-4 py-3">{s.learningLevel}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === "active" ? "green" : "amber"}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{s.courses ?? 0}</td>
                  <td className="px-4 py-3">{s.averageScore ?? "—"}</td>
                  <td className="px-4 py-3 w-40">
                    <ProgressBar value={s.progress || 0} />
                  </td>
                  <td className="px-4 py-3">{formatDate(s.lastActive)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link to={`/admin/students/${idOf(s)}`}>
                        <Button size="sm" variant="secondary">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirm({ id: idOf(s), action: s.status === "active" ? "deactivate" : "activate" })}
                      >
                        {s.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
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
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold">Add student</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate(Object.fromEntries(fd) as Record<string, string>);
              }}
            >
              <div>
                <Label>Full name</Label>
                <Input name="fullName" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" minLength={8} placeholder="Student@123456" />
              </div>
              <div>
                <Label>Learning level</Label>
                <Select name="learningLevel" defaultValue="beginner">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
        title={confirm?.action === "deactivate" ? "Deactivate this student?" : "Activate this student?"}
        explanation={
          confirm?.action === "deactivate"
            ? "This student will no longer be able to access the learning platform."
            : "The student will regain access to courses, quizzes, and the AI Tutor."
        }
        danger={confirm?.action === "deactivate"}
        confirmLabel={confirm?.action === "deactivate" ? "Deactivate" : "Activate"}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && act.mutate(confirm)}
      />
    </div>
  );
}
