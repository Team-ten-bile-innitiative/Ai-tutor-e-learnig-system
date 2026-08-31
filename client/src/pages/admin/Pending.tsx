import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, TableSkeleton } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { idOf, initials, cn } from "@/lib/utils";

export function AdminPendingPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" } | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["pending-students", page],
    queryFn: async () =>
      (await api.get("/admin/students", { params: { page, status: "pending", sort: "newest", limit: 8 } })).data,
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      action === "approve" ? api.post(`/admin/students/${id}/activate`) : api.post(`/admin/students/${id}/deactivate`),
    onSuccess: (_d, vars) => {
      toast.success(vars.action === "approve" ? "Student approved" : "Registration declined");
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ["pending-students"] });
      void qc.invalidateQueries({ queryKey: ["pending-count"] });
      void qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Pending" description="Review new student registrations before they appear on the Students list." />
      {isLoading && !data ? (
        <TableSkeleton />
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data?.data?.length ? (
        <EmptyState title="No pending registrations." description="New sign-ups will show here until you approve them." />
      ) : (
        <Card className={cn("w-full overflow-hidden", isFetching ? "opacity-70" : "")}>
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[22%]" />
            </colgroup>
            <thead className="border-b border-line bg-slate-50 text-muted">
              <tr>
                {["Student", "Level", "Registered", "Actions"].map((h) => (
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
                  <td className="px-3 py-3 text-muted">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                    <div className="mt-1">
                      <Badge tone="amber">pending</Badge>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Approve"
                        aria-label="Approve student"
                        onClick={() => setConfirm({ id: idOf(s), action: "approve" })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#16A34A] transition hover:bg-[#F0FDF4]"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        title="Decline"
                        aria-label="Decline student"
                        onClick={() => setConfirm({ id: idOf(s), action: "reject" })}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#EA580C] transition hover:bg-[#FFF7ED]"
                      >
                        <UserX className="h-4 w-4" strokeWidth={2.2} />
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
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === "approve" ? "Approve this student?" : "Decline this registration?"}
        explanation={
          confirm?.action === "approve"
            ? "They will appear on the Students list as active. They can already use their dashboard."
            : "Their account will be set to inactive and they will not be able to sign in."
        }
        danger={confirm?.action === "reject"}
        confirmLabel={confirm?.action === "approve" ? "Approve" : "Decline"}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && act.mutate(confirm)}
      />
    </div>
  );
}
