import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileQuestion, Search, Users } from "lucide-react";
import { api } from "@/lib/api";

type Hit = { id: string; title: string; hint?: string; to: string };

export function AdminSearch() {
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 220);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const search = useQuery({
    queryKey: ["admin-search", debounced],
    enabled: debounced.length > 0,
    queryFn: async () =>
      (await api.get("/analytics/search", { params: { q: debounced } })).data.data as {
        students: Hit[];
        courses: Hit[];
        quizzes: Hit[];
      },
  });

  const groups = [
    { key: "Students", Icon: Users, items: search.data?.students || [] },
    { key: "Courses", Icon: BookOpen, items: search.data?.courses || [] },
    { key: "Quizzes", Icon: FileQuestion, items: search.data?.quizzes || [] },
  ];
  const hasHits = groups.some((g) => g.items.length);

  function go(to: string) {
    setOpen(false);
    setQ("");
    navigate(to);
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <div className="flex h-10 w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = groups.flatMap((g) => g.items)[0];
              if (first) go(first.to);
              else navigate(`/admin/students`);
            }
          }}
          placeholder="Search students, courses, quizzes"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-400"
        />
      </div>
      {open && debounced ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {search.isFetching ? (
            <p className="px-4 py-3 text-sm text-muted">Searching…</p>
          ) : !hasHits ? (
            <p className="px-4 py-3 text-sm text-muted">No matches for “{debounced}”.</p>
          ) : (
            groups.map((g) =>
              g.items.length ? (
                <div key={g.key} className="border-b border-slate-100 last:border-0">
                  <p className="px-4 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{g.key}</p>
                  {g.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.to)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                    >
                      <g.Icon className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                        {item.hint ? <span className="block truncate text-xs text-muted">{item.hint}</span> : null}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
