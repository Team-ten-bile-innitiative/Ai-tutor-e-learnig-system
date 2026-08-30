import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileText, LoaderCircle, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Input, Label, Select } from "@/components/ui/field";
import { SCHOOL_SUBJECTS } from "@/lib/subjects";

type ImportResult = { data: { course: { title: string }; lessons: Array<{ title: string }> } };

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function AdminPdfImportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult["data"] | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics"]);

  const importer = useMutation({
    mutationFn: async (textbook: File) => {
      const form = new FormData();
      form.append("file", textbook);
      if (courseTitle.trim()) form.append("title", courseTitle.trim());
      subjects.forEach((subject) => form.append("subjects", subject));
      return (await api.post<ImportResult>("/admin/imports/pdf-course", form)).data;
    },
    onSuccess: (response) => {
      setResult(response.data);
      toast.success("Draft course imported. Review it before publishing.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const chooseFile = (nextFile: File | undefined) => {
    setResult(null);
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Choose a PDF textbook.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      toast.error("This PDF is over Gemini's 50 MB processing limit. Compress it, then try again.");
      return;
    }
    setFile(nextFile);
  };

  return (
    <div>
      <PageHeader title="Import PDF textbook" description="Turn a textbook into a draft course and lesson outline with Gemini." />

      <div className="grid max-w-4xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="course-title">Course name <span className="font-normal text-muted">(optional)</span></Label>
              <Input id="course-title" value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} placeholder="e.g. Grade 9 Mathematics" maxLength={120} />
              <p className="mt-1 text-xs text-muted">Leave blank to use the textbook title suggested by AI.</p>
            </div>
            <div>
              <Label htmlFor="subjects">School subjects</Label>
              <Select id="subjects" multiple value={subjects} onChange={(event) => setSubjects(Array.from(event.target.selectedOptions, (option) => option.value))} className="h-28 py-2">
                {SCHOOL_SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <p className="mt-1 text-xs text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select more than one subject.</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 text-center transition hover:border-primary/60 hover:bg-primary/10"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-sm">
              <Upload className="h-6 w-6" />
            </span>
            <span className="mt-4 text-base font-bold text-slate-900">Choose a PDF textbook</span>
            <span className="mt-1 text-sm text-muted">PDF only · maximum 50 MB</span>
          </button>

          {file ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-slate-50 p-4">
              <FileText className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{file.name}</p>
                <p className="text-sm text-muted">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setFile(null)} disabled={importer.isPending}>
                Remove
              </Button>
            </div>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button disabled={!file || importer.isPending || !subjects.length} onClick={() => file && importer.mutate(file)}>
              {importer.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importer.isPending ? "Analyzing textbook…" : "Create draft course"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">How importing works</h2>
          <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
            <li><span className="mr-2 font-bold text-primary">1.</span>Upload a school textbook in PDF format.</li>
            <li><span className="mr-2 font-bold text-primary">2.</span>Choose the school subject and, if wanted, name the course.</li>
            <li><span className="mr-2 font-bold text-primary">3.</span>Gemini reads the textbook and automatically breaks its chapters into 6–12 draft lessons.</li>
            <li><span className="mr-2 font-bold text-primary">4.</span>Edit the lessons, then publish the course when it is ready.</li>
          </ol>
          <p className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            The original PDF is removed from this server after import. Review generated content for accuracy before publishing.
          </p>
        </Card>
      </div>

      {result ? (
        <Card className="mt-5 max-w-4xl border-emerald-200 bg-emerald-50/50 p-6">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-emerald-950">{result.course.title} is ready for review</h2>
              <p className="mt-1 text-sm text-emerald-800">Created {result.lessons.length} draft lessons. Nothing is visible to students until you publish it.</p>
              <Button className="mt-4" size="sm" onClick={() => navigate("/admin/courses")}>Review courses</Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
