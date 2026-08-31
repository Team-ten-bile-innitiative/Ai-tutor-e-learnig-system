import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlignLeft, BookOpen, ChevronDown, Clock, GraduationCap, ImagePlus, Layers, Pencil, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Course, LearningLevel } from "@/types";
import { categoryDef, listVisibleAdminCategories, readExtraCategories, readHiddenCategories } from "@/lib/categories";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, Pagination, statusTone } from "@/components/shared";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldIcon, fieldWithIconPad, Input, Label, Select, Textarea } from "@/components/ui/field";
import { CourseCard } from "@/components/CourseCatalog";
import { levelAccent, levelBadgeClass, LEVEL_OPTIONS } from "@/lib/levels";
import { cn, idOf, joinDescription, splitDescription } from "@/lib/utils";

export function AdminCoursesPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const categoryFilter = params.get("category") || "";
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Partial<Course> | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [courseLevel, setCourseLevel] = useState<LearningLevel | "">("");
  const [courseCategory, setCourseCategory] = useState("");
  const [levelOpen, setLevelOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-courses", page, q, status, categoryFilter],
    queryFn: async () => (await api.get("/courses", { params: { page, q, status, category: categoryFilter || undefined, limit: 3 } })).data,
    placeholderData: keepPreviousData,
  });

  const categoryCatalog = useQuery({
    queryKey: ["admin-category-counts"],
    queryFn: async () => (await api.get("/courses", { params: { limit: 100 } })).data as { data: { category?: string }[]; meta?: { categories: string[] } },
  });

  const categoryOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const course of categoryCatalog.data?.data || []) {
      const key = course.category || "Other";
      counts[key] = (counts[key] || 0) + 1;
    }
    return listVisibleAdminCategories({
      extras: readExtraCategories(),
      catalogNames: categoryCatalog.data?.meta?.categories || [],
      counts,
      hidden: readHiddenCategories(),
    });
  }, [categoryCatalog.data, editing]);

  const selectedCategory = courseCategory ? categoryDef(courseCategory) : null;

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, q, status]);

  useEffect(() => {
    if (!editing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editing]);

  function openCreate() {
    setCourseLevel("");
    setCourseCategory("");
    setLevelOpen(false);
    setCategoryOpen(false);
    setCoverUrl("");
    setCoverPreview("");
    setEditing({});
  }

  function openEdit(course: Course) {
    setCourseLevel(course.level || "");
    setCourseCategory(course.category || "");
    setLevelOpen(false);
    setCategoryOpen(false);
    setCoverUrl(course.thumbnailUrl || "");
    setCoverPreview(course.thumbnailUrl || "");
    setEditing(course);
  }

  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const isEdit = Boolean(editing && (editing.id || editing._id));
      const payload: Record<string, unknown> = {
        title: String(body.title || "").trim(),
        description: joinDescription(String(body.descriptionOne || ""), String(body.descriptionTwo || "")),
        category: courseCategory,
        level: courseLevel,
        thumbnailUrl: coverUrl || undefined,
        duration: String(body.duration || "").trim() || undefined,
        instructorName: String(body.instructorName || "").trim() || undefined,
      };
      if (!isEdit) payload.status = "published";
      if (isEdit) return api.patch(`/courses/${idOf(editing as Course)}`, payload);
      return api.post("/courses", payload);
    },
    onSuccess: () => {
      toast.success("Course saved");
      setEditing(null);
      setPage(1);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["landing-courses"] });
      qc.invalidateQueries({ queryKey: ["admin-category-counts"] });
      qc.invalidateQueries({ queryKey: ["course-catalog"] });
      qc.invalidateQueries({ queryKey: ["footer-courses"] });
      qc.invalidateQueries({ queryKey: ["public-stats"] });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["landing-courses"] });
      qc.invalidateQueries({ queryKey: ["course-catalog"] });
      qc.invalidateQueries({ queryKey: ["footer-courses"] });
      qc.invalidateQueries({ queryKey: ["public-stats"] });
    },
  });

  async function onCoverFile(file: File | undefined) {
    if (!file) return;
    const local = URL.createObjectURL(file);
    setCoverPreview(local);
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/uploads", fd);
      const url = res.data?.data?.url as string;
      if (!url) throw new Error("Upload did not return a URL");
      setCoverUrl(url);
      setCoverPreview(url);
      toast.success("Cover image uploaded");
    } catch (e) {
      setCoverPreview("");
      setCoverUrl("");
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        compact
        title="Courses"
        description="Create, publish, and archive learning programs."
        action={<Button onClick={openCreate}>Create course</Button>}
      />
      {categoryFilter ? (
        <p className="mb-3 text-sm font-medium text-slate-600">
          Showing <span className="font-bold text-[#0F172A]">{categoryFilter}</span> courses.
        </p>
      ) : null}
      <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row">
        <Input className="min-w-0 flex-1" placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select
          className="w-full sm:w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>
      {error && !data ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isLoading && !data ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : !data?.data?.length ? (
        <EmptyState title="No courses yet." description="Create your first course, then add lessons and quizzes." />
      ) : (
        <div className={cn("grid w-full grid-cols-1 gap-5 md:grid-cols-3", isFetching && "opacity-70")}>
          {data.data.slice(0, 3).map((c: Course) => (
            <div key={idOf(c)} className="min-w-0">
            <CourseCard
              course={c}
              maxEnroll={0}
              layout="grid"
              showSave={false}
              dense
              footer={
                <div className="flex items-center gap-1.5 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Edit"
                      aria-label="Edit course"
                      onClick={() => openEdit(c)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    {c.status !== "published" ? (
                      <Button size="sm" className="h-8" onClick={() => setStatusMut.mutate({ id: idOf(c), status: "published" })}>
                        Publish
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => setStatusMut.mutate({ id: idOf(c), status: "draft" })}>
                        Unpublish
                      </Button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete course"
                      onClick={() => setDel(idOf(c))}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[#DC2626] transition hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              }
            />
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pagination?.pages || 1} onPage={setPage} />

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <Card className="flex max-h-[min(90vh,36rem)] w-full max-w-lg flex-col overflow-hidden p-0">
            <h3 className="shrink-0 px-6 pb-2 pt-5 text-lg font-semibold">{editing.id || editing._id ? "Edit course" : "Create course"}</h3>
            <form
              key={idOf(editing as Course) || "new-course"}
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                if (!courseCategory) {
                  toast.error("Choose a category");
                  return;
                }
                if (!courseLevel) {
                  toast.error("Choose a level");
                  return;
                }
                if (!coverUrl) {
                  toast.error("Upload a cover image");
                  return;
                }
                const fd = new FormData(e.currentTarget);
                const one = String(fd.get("descriptionOne") || "").trim();
                const two = String(fd.get("descriptionTwo") || "").trim();
                if (!one || !two) {
                  toast.error("Write two description paragraphs");
                  return;
                }
                save.mutate(Object.fromEntries(fd));
              }}
            >
              <div className="hide-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-2">
                <div>
                  <Label>Cover image</Label>
                  <div className="overflow-hidden rounded-xl border border-line bg-slate-50">
                    {coverPreview ? (
                      <img src={coverPreview} alt="" className="h-24 w-full object-cover" />
                    ) : (
                      <div className="flex h-20 items-center justify-center text-sm font-semibold text-slate-400">Upload your cover image</div>
                    )}
                    <label className="relative flex cursor-pointer items-center gap-2 border-t border-line bg-white px-3 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-50">
                      <ImagePlus className="h-5 w-5 text-[#E11D48]" strokeWidth={2.2} />
                      {uploading ? "Uploading…" : "Upload a cover image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => {
                          void onCoverFile(e.target.files?.[0]);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <span className="relative block">
                    <FieldIcon icon={BookOpen} tone="blue" />
                    <Input name="title" defaultValue={editing.title || ""} required placeholder="e.g. Biology Foundations" className={fieldWithIconPad} />
                  </span>
                </div>
                <div>
                  <Label>Description</Label>
                  {(() => {
                    const [one, two] = splitDescription(editing.description);
                    return (
                      <div className="space-y-2">
                        <span className="relative block">
                          <FieldIcon icon={AlignLeft} tone="teal" align="top" />
                          <Textarea
                            name="descriptionOne"
                            defaultValue={one}
                            required
                            placeholder="Paragraph 1 — what this course covers"
                            className="min-h-16 resize-none pl-12"
                          />
                        </span>
                        <span className="relative block">
                          <FieldIcon icon={AlignLeft} tone="teal" align="top" />
                          <Textarea
                            name="descriptionTwo"
                            defaultValue={two}
                            required
                            placeholder="Paragraph 2 — what students will practice or achieve"
                            className="min-h-16 resize-none pl-12"
                          />
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <Label>Category</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryOpen((v) => !v);
                        setLevelOpen(false);
                      }}
                      className={`${fieldWithIconPad} relative flex h-11 w-full items-center rounded-xl border bg-white pr-10 text-left text-sm font-bold hover:border-[#EA580C] ${
                        courseCategory ? "border-line text-[#0F172A]" : "border-[#FDBA74] text-[#EA580C]"
                      }`}
                      aria-expanded={categoryOpen}
                      aria-haspopup="listbox"
                    >
                      {selectedCategory ? (
                        <FieldIcon icon={selectedCategory.Icon} tone="orange" />
                      ) : (
                        <FieldIcon icon={Layers} tone="orange" />
                      )}
                      {selectedCategory ? selectedCategory.label : "Choose category"}
                      <ChevronDown className={`absolute right-3 h-4 w-4 text-[#EA580C] transition ${categoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryOpen ? (
                      <ul role="listbox" className="hide-scroll absolute left-0 right-0 z-50 mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        {categoryOptions.map((opt) => {
                          const Icon = opt.Icon;
                          const active = courseCategory.toLowerCase() === opt.id.toLowerCase();
                          return (
                            <li key={opt.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={cn(
                                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50",
                                  active ? "bg-[#FFF7ED] text-[#EA580C]" : "text-ink"
                                )}
                                onClick={() => {
                                  setCourseCategory(opt.id);
                                  setCategoryOpen(false);
                                }}
                              >
                                <Icon className={cn("h-4 w-4", opt.iconClass)} strokeWidth={2.2} />
                                {opt.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Label>Level</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setLevelOpen((v) => !v);
                        setCategoryOpen(false);
                      }}
                      className={`${fieldWithIconPad} relative flex h-11 w-full items-center rounded-xl border bg-white pr-10 text-left text-sm font-bold hover:border-[#2563EB] ${
                        courseLevel ? cn("border-line capitalize", levelAccent(courseLevel).text) : "border-[#86EFAC] text-[#16A34A]"
                      }`}
                      aria-expanded={levelOpen}
                      aria-haspopup="listbox"
                    >
                      <FieldIcon icon={GraduationCap} tone={courseLevel ? levelAccent(courseLevel).tone : "green"} />
                      {courseLevel || "Choose level"}
                      <ChevronDown className={`absolute right-3 h-4 w-4 transition ${levelOpen ? "rotate-180" : ""} ${courseLevel ? levelAccent(courseLevel).text : "text-[#16A34A]"}`} />
                    </button>
                    {levelOpen ? (
                      <ul role="listbox" className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        {LEVEL_OPTIONS.map((opt) => (
                          <li key={opt.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={courseLevel === opt.id}
                              className={cn(
                                "flex w-full items-center px-4 py-2.5 text-left text-sm font-semibold capitalize",
                                courseLevel === opt.id ? levelBadgeClass(opt.id) : "text-ink hover:bg-slate-50",
                              )}
                              onClick={() => {
                                setCourseLevel(opt.id);
                                setLevelOpen(false);
                              }}
                            >
                              <span className={cn("rounded-md px-2 py-0.5", levelBadgeClass(opt.id))}>{opt.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Duration</Label>
                    <span className="relative block">
                      <FieldIcon icon={Clock} tone="orange" />
                      <Input name="duration" defaultValue={editing.duration || ""} placeholder="e.g. 4 weeks" className={fieldWithIconPad} />
                    </span>
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <span className="relative block">
                      <FieldIcon icon={UserRound} tone="rose" />
                      <Input name="instructorName" defaultValue={editing.instructorName || editing.instructor?.fullName || ""} placeholder="Instructor full name" className={fieldWithIconPad} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 justify-end gap-2 border-t border-line px-6 py-4">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending || uploading}>
                  Save
                </Button>
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
