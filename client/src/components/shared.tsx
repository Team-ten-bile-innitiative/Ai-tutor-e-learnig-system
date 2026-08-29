import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
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
      <Inbox className="mb-3 h-10 w-10 text-slate-300" />
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
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

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        <div className="rounded-xl bg-primary-soft p-2.5 text-primary">{icon}</div>
      </div>
    </Card>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
        stroke="#4f46e5"
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
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted">
        Page {page} of {pages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
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
        <span className={cn("block text-xs font-medium sm:text-sm", light ? "text-violet-200" : "text-slate-500")}>
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
  if (status === "draft" || status === "inactive") return "amber" as const;
  if (status === "archived") return "slate" as const;
  return "indigo" as const;
}
