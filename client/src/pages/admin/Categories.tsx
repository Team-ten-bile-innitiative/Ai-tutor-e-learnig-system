import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { categoryDef, hideCategory, listVisibleAdminCategories, readExtraCategories, readHiddenCategories, removeExtraCategory, renameExtraCategory, saveExtraCategory } from "@/lib/categories";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [extras, setExtras] = useState(() => readExtraCategories());
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [hiddenTick, setHiddenTick] = useState(0);
  const hidden = useMemo(() => readHiddenCategories(), [hiddenTick]);
  const addPreview = name.trim()
    ? categoryDef(name.trim())
    : { Icon: Layers, iconClass: "text-[#EA580C]", chipClass: "bg-[#FFEDD5]" };
  const AddIcon = addPreview.Icon;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-category-counts"],
    queryFn: async () => (await api.get("/courses", { params: { limit: 100 } })).data as { data: { category?: string }[]; meta?: { categories: string[] } },
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const course of data?.data || []) {
      const key = course.category || "Other";
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [data]);

  const catalogNames = data?.meta?.categories || [];
  const boxes = listVisibleAdminCategories({
    extras,
    catalogNames,
    counts,
    hidden,
  });

  function addCategory() {
    const next = name.trim();
    if (next.length < 2) {
      toast.error("Enter a category name");
      return;
    }
    setExtras(saveExtraCategory(next));
    setName("");
    toast.success("Category added");
  }

  const rename = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      await api.post("/courses/rename-category", { from, to });
    },
    onSuccess: (_d, { from, to }) => {
      setExtras(renameExtraCategory(from, to));
      setEditing(null);
      toast.success("Category updated");
      qc.invalidateQueries({ queryKey: ["admin-category-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function saveEdit() {
    const to = editName.trim();
    if (!editing || to.length < 2) {
      toast.error("Enter a category name");
      return;
    }
    if (to.toLowerCase() === editing.toLowerCase()) {
      setEditing(null);
      return;
    }
    rename.mutate({ from: editing, to });
  }

  return (
    <div>
      <PageHeader title="Categories" description="Add, edit, and open matching programs." />

      <Card className="mb-6 p-5">
        <Label>Add category</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <span className="relative block min-w-0 flex-1">
            <span className={cn("pointer-events-none absolute left-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg", addPreview.chipClass)}>
              <AddIcon className={cn("h-4 w-4", addPreview.iconClass)} strokeWidth={2.2} />
            </span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a category name, e.g. Biology or Programming" className="pl-[3.25rem]" />
          </span>
          <Button type="button" onClick={addCategory}>
            Add category
          </Button>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : !boxes.length ? (
        <EmptyState title="No categories yet." description="Add a category to organize courses." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((chip) => {
            const Icon = chip.Icon;
            const count = Object.entries(counts).reduce((sum, [key, n]) => (key.toLowerCase() === chip.id.toLowerCase() ? sum + n : sum), 0);
            return (
              <div
                key={chip.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => navigate(`/admin/courses?category=${encodeURIComponent(chip.id)}`)}
                >
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", chip.chipClass)}>
                    <Icon className={cn("h-5 w-5", chip.iconClass)} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-5 text-[#0F172A]">{chip.label}</span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">
                      {count} {count === 1 ? "course" : "courses"}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Edit"
                    aria-label={`Edit ${chip.label}`}
                    onClick={() => {
                      setEditing(chip.id);
                      setEditName(chip.label);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#2563EB] transition hover:bg-[#EFF6FF]"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label={`Delete ${chip.label}`}
                    onClick={() => setRemoving(chip.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#DC2626] transition hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="flex max-h-[min(90vh,24rem)] w-full max-w-lg flex-col overflow-hidden p-0">
            <h3 className="shrink-0 px-6 pb-2 pt-5 text-lg font-semibold">Edit category</h3>
            <div className="hide-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-2">
              <div>
                <Label>Category name</Label>
                <span className="relative block">
                  {(() => {
                    const preview = categoryDef(editName.trim() || editing || "Category");
                    const Icon = preview.Icon;
                    return (
                      <>
                        <span className={cn("pointer-events-none absolute left-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg", preview.chipClass)}>
                          <Icon className={cn("h-4 w-4", preview.iconClass)} strokeWidth={2.2} />
                        </span>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter the category name" className="pl-[3.25rem]" />
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-line px-6 py-4">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveEdit} disabled={rename.isPending}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        title="Delete this category?"
        explanation="The category will leave this list. Any courses in it will also be deleted."
        danger
        confirmLabel="Delete"
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.post("/courses/purge-category", { category: removing });
            setExtras(removeExtraCategory(removing));
            hideCategory(removing);
            setHiddenTick((n) => n + 1);
            setRemoving(null);
            toast.success("Category deleted");
            qc.invalidateQueries({ queryKey: ["admin-category-counts"] });
            qc.invalidateQueries({ queryKey: ["admin-courses"] });
            qc.invalidateQueries({ queryKey: ["landing-courses"] });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not delete category");
          }
        }}
      />
    </div>
  );
}
