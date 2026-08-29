import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatMinutes(seconds?: number) {
  const s = seconds || 0;
  const m = Math.round(s / 60);
  return `${m} min`;
}

export function idOf(doc: { _id?: string; id?: string } | string) {
  if (typeof doc === "string") return doc;
  return doc.id || doc._id || "";
}

export function formatStatCount(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1000) {
    const k = n / 1000;
    const label = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "");
    return `${label}K+`;
  }
  return String(n);
}

export function formatCompact(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "0";
  if (n >= 1000) {
    const k = n / 1000;
    const label = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, "");
    return `${label}k`;
  }
  return String(n);
}
