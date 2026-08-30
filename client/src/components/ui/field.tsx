import type { LabelHTMLAttributes } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm font-bold text-[#0F172A] outline-none transition placeholder:font-semibold placeholder:text-slate-400 hover:border-slate-400 focus:border-[#7C3AED] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass =
  "min-h-28 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-[#0F172A] outline-none transition placeholder:font-semibold placeholder:text-slate-400 hover:border-slate-400 focus:border-[#7C3AED] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const fieldWithIconPad = "pl-12";
export const authFieldPad = "pl-10";

export const fieldIconTone = {
  purple: "bg-[#EDE9FE] text-[#7C3AED] ring-1 ring-[#7C3AED]/15",
  blue: "bg-[#DBEAFE] text-[#2563EB] ring-1 ring-[#2563EB]/15",
  indigo: "bg-[#E0E7FF] text-[#4F46E5] ring-1 ring-[#4F46E5]/15",
  teal: "bg-[#CCFBF1] text-[#0D9488] ring-1 ring-[#0D9488]/15",
  green: "bg-[#DCFCE7] text-[#16A34A] ring-1 ring-[#16A34A]/15",
  amber: "bg-[#FEF3C7] text-[#D97706] ring-1 ring-[#D97706]/15",
  orange: "bg-[#FFEDD5] text-[#EA580C] ring-1 ring-[#EA580C]/15",
  rose: "bg-[#FFE4E6] text-[#E11D48] ring-1 ring-[#E11D48]/15",
  slate: "bg-[#F1F5F9] text-[#64748B] ring-1 ring-[#64748B]/10",
} as const;

export type FieldIconTone = keyof typeof fieldIconTone;

export const fieldIconPlain = {
  purple: "text-[#7C3AED]",
  blue: "text-[#2563EB]",
  indigo: "text-[#4F46E5]",
  teal: "text-[#0D9488]",
  green: "text-[#16A34A]",
  amber: "text-[#D97706]",
  orange: "text-[#EA580C]",
  rose: "text-[#E11D48]",
  slate: "text-[#64748B]",
} as const;

export function FieldIcon({
  icon: Icon,
  tone = "purple",
  align = "center",
  variant = "chip",
  className,
}: {
  icon: LucideIcon;
  tone?: FieldIconTone;
  align?: "center" | "top";
  variant?: "chip" | "plain";
  className?: string;
}) {
  // Both chip and plain variants now render as a simple colored icon — no background box
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-3 grid place-items-center",
        align === "top" ? "top-3" : "top-1/2 -translate-y-1/2",
        fieldIconPlain[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </span>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textareaClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-bold text-[#0F172A]", className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{children}</p>;
}
