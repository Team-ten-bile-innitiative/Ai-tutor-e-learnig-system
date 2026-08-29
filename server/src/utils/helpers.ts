import crypto from "node:crypto";
import type { FilterQuery } from "mongoose";

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function paginate(query: { page?: string; limit?: string }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function searchFilter<T>(q: string | undefined, fields: string[]): FilterQuery<T> {
  if (!q?.trim()) return {};
  const rx = new RegExp(escapeRegex(q.trim()), "i");
  return { $or: fields.map((field) => ({ [field]: rx })) } as FilterQuery<T>;
}
