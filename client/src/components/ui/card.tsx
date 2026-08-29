import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]", className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-line px-5 py-4", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "indigo" | "violet";
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-success-soft text-success",
    amber: "bg-warning-soft text-warning",
    red: "bg-danger-soft text-danger",
    indigo: "bg-primary-soft text-primary",
    violet: "bg-ai-soft text-ai",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", map[tone])}>{children}</span>;
}
