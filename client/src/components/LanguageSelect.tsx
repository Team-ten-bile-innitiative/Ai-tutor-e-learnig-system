import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function FlagBox({ code }: { code: "EN" | "SO" }) {
  const src = code === "EN" ? "/flags/gb.svg" : "/flags/so.svg";
  return (
    <span className="inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-sm">
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

const langs = [
  { code: "EN" as const, name: "English" },
  { code: "SO" as const, name: "Somali" },
];

export function LanguageSelect() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "SO">(() => {
    try {
      return localStorage.getItem("publicLang") === "SO" ? "SO" : "EN";
    } catch {
      return "EN";
    }
  });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = langs.find((l) => l.code === lang) ?? langs[0];

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#7C3AED] bg-white px-2.5 text-sm font-semibold text-[#1E293B]"
        aria-expanded={open}
        aria-label="Language"
      >
        <FlagBox code={current.code} />
        {current.code}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#A78BFA] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {langs.map((l) => (
            <button
              key={l.code}
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
              onClick={() => {
                setLang(l.code);
                localStorage.setItem("publicLang", l.code);
                setOpen(false);
              }}
            >
              <FlagBox code={l.code} />
              <span className="flex-1">
                {l.name} ({l.code})
              </span>
              {lang === l.code ? <span className="font-bold text-[#2563EB]">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
