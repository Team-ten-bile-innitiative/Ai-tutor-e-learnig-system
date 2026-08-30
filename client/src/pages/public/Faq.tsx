import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n, type I18nKey } from "@/context/I18nContext";
import { cn } from "@/lib/utils";

const ITEMS: { q: I18nKey; a: I18nKey }[] = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
];

export function FaqPage() {
  const { t } = useI18n();
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A]">{t("faq.title")}</h1>
      <p className="mt-3 text-base font-semibold leading-relaxed text-[#64748B]">{t("faq.sub")}</p>
      <div className="mt-8 space-y-3">
        {ITEMS.map((item, i) => {
          const expanded = open === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-[#DDD6FE] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? -1 : i)}
              >
                <span className="text-base font-extrabold text-[#0F172A]">{t(item.q)}</span>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-[#7C3AED] transition", expanded ? "rotate-180" : "")} />
              </button>
              {expanded ? <p className="px-5 pb-5 text-sm font-semibold leading-relaxed text-[#475569]">{t(item.a)}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
