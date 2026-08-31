import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n, type PublicLang } from "@/context/I18nContext";

function FlagBox({ code }: { code: PublicLang }) {
  const src = code === "EN" ? "/flags/gb.svg" : "/flags/so.svg";
  return (
    <span className="inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-black/10">
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

export function LanguageSelect() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const langs: { code: PublicLang; nameKey: "lang.en" | "lang.so" }[] = [
    { code: "EN", nameKey: "lang.en" },
    { code: "SO", nameKey: "lang.so" },
  ];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#2563EB] bg-white px-3 text-sm font-semibold text-[#1D4ED8] transition hover:bg-[#EFF6FF]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("lang.label")}
      >
        <FlagBox code={lang} />
        {lang}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1D4ED8] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div role="listbox" aria-label={t("lang.label")} className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {langs.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={lang === l.code}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-semibold text-[#334155] hover:bg-[#EFF6FF]"
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <FlagBox code={l.code} />
              <span className="flex-1">
                {t(l.nameKey)} ({l.code})
              </span>
              {lang === l.code ? <span className="font-bold text-[#2563EB]">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
