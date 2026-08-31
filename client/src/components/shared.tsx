import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message={this.state.error.message || "This page hit an error."}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export function PageHeader({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", compact ? "mb-3" : "mb-6")}>
      <div>
        <h1 className={cn("font-bold tracking-tight text-ink", compact ? "text-xl" : "text-2xl")}>{title}</h1>
        {description ? <p className={cn("text-sm text-muted", compact ? "mt-0.5" : "mt-1")}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
      <Inbox className="mb-3 h-10 w-10 text-[#93C5FD]" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger-soft bg-white px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-danger" />
      <h3 className="font-semibold">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted">{message || "Please try again."}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200", className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <Card className="p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="mb-3 h-10" />
      ))}
    </Card>
  );
}

const statIconTones = {
  blue: "bg-[#2563EB] text-white shadow-[0_8px_16px_rgba(37,99,235,0.28)]",
  teal: "bg-[#0D9488] text-white shadow-[0_8px_16px_rgba(13,148,136,0.28)]",
  green: "bg-[#16A34A] text-white shadow-[0_8px_16px_rgba(22,163,74,0.28)]",
  amber: "bg-[#D97706] text-white shadow-[0_8px_16px_rgba(217,119,6,0.28)]",
  orange: "bg-[#EA580C] text-white shadow-[0_8px_16px_rgba(234,88,12,0.28)]",
  rose: "bg-[#E11D48] text-white shadow-[0_8px_16px_rgba(225,29,72,0.28)]",
  violet: "bg-[#7C3AED] text-white shadow-[0_8px_16px_rgba(124,58,237,0.28)]",
  cyan: "bg-[#0891B2] text-white shadow-[0_8px_16px_rgba(8,145,178,0.28)]",
} as const;

export type StatIconTone = keyof typeof statIconTones;

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconTone = "blue",
  className,
  to,
  compact = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  iconTone?: StatIconTone;
  className?: string;
  to?: string;
  compact?: boolean;
}) {
  const body = (
    <div className="flex h-full flex-col items-center justify-center px-1 text-center">
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-2xl",
          compact ? "h-11 w-11" : "h-12 w-12",
          statIconTones[iconTone]
        )}
      >
        {icon}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={cn("font-bold tracking-tight text-ink", compact ? "mt-1 text-2xl" : "mt-1.5 text-3xl")}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-400">{hint}</p> : null}
    </div>
  );
  const cardClass = cn(
    "h-full min-w-0 border-slate-200 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-[#93C5FD] hover:shadow-[0_14px_28px_rgba(37,99,235,0.14)]",
    compact ? "p-4" : "p-5",
    to && "cursor-pointer"
  );
  const wrapClass = cn("block h-full min-w-0", className);
  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          wrapClass,
          "rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
        )}
        aria-label={`Open ${label}`}
      >
        <Card className={cardClass}>{body}</Card>
      </Link>
    );
  }
  return (
    <div className={wrapClass}>
      <Card className={cardClass}>{body}</Card>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn("h-full rounded-full transition-[width]", pct >= 100 ? "bg-[#16A34A]" : pct > 0 ? "bg-[#2563EB]" : "bg-transparent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600">{pct}%</span>
    </div>
  );
}

export function ProgressRing({ value, size = 120 }: { value: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="mx-auto">
      <circle cx="50" cy="50" r={r} stroke="#e2e8f0" strokeWidth="10" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={r}
        stroke="#1D4ED8"
        strokeWidth="10"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" className="fill-ink text-xl font-bold">
        {value}%
      </text>
    </svg>
  );
}

export function ConfirmDialog({
  open,
  title,
  explanation,
  confirmLabel = "Confirm",
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  explanation: string;
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted">{explanation}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  const total = Math.max(1, pages);
  const current = Math.min(Math.max(1, page), total);
  if (total <= 1) return null;

  const nums = Array.from({ length: total }, (_, i) => i + 1).slice(0, 7);

  const navBtn =
    "inline-flex h-9 w-[8.25rem] shrink-0 items-center justify-center gap-1 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onPage(current - 1)}
        className={cn(navBtn, "border border-[#2563EB] bg-white text-[#2563EB] hover:bg-[#EFF6FF]")}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
        Previous
      </button>
      <span className="px-2 text-sm font-bold text-[#2563EB]">
        Page {current} of {total}
      </span>
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === current ? "page" : undefined}
          onClick={() => onPage(n)}
          className={cn(
            "grid h-9 min-w-9 place-items-center rounded-lg border px-2.5 text-sm font-bold transition",
            n === current
              ? "border-transparent bg-[#2563EB] text-white"
              : "border-slate-200 bg-white text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB]",
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={current >= total}
        onClick={() => onPage(current + 1)}
        className={cn(navBtn, "border border-[#2563EB] bg-white text-[#2563EB] hover:bg-[#EFF6FF]")}
      >
        Next
        <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

export function Spinner() {
  return <Loader2 className="h-5 w-5 animate-spin" />;
}

export function BrandLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex min-w-0 items-center gap-3", light ? "text-white" : "text-ink")}>
      <img
        src="/logo.png"
        alt="Interactive Ai learing tutor system"
        className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/10"
      />
      <span className={cn("min-w-0 leading-tight", compact ? "hidden xs:block sm:block" : "block")}>
        <span className="block text-base font-bold tracking-tight sm:text-lg">Interactive Ai</span>
        <span className={cn("block text-xs font-medium sm:text-sm", light ? "text-blue-200" : "text-slate-500")}>
          Learning tutor system
        </span>
      </span>
    </Link>
  );
}

export function BrandLink() {
  return <BrandLogo />;
}

export function statusTone(status: string) {
  if (status === "published" || status === "active" || status === "completed") return "green" as const;
  if (status === "draft" || status === "inactive" || status === "pending") return "amber" as const;
  if (status === "archived") return "slate" as const;
  return "indigo" as const;
}
