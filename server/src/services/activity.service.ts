import { ActivityLog } from "../models/Engagement.js";
import { Notification } from "../models/Engagement.js";
import { User } from "../models/User.js";
import type { AuthUser } from "../middleware/auth.js";

export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  await ActivityLog.create({ user: userId, action, entityType, entityId, metadata });
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: "quiz" | "course" | "system" | "ai" | "reminder" | "registration" = "system",
  link?: string
) {
  return Notification.create({ user: userId, title, message, type, link });
}

export async function notifyAdmins(
  title: string,
  message: string,
  type: "quiz" | "course" | "system" | "ai" | "reminder" | "registration" = "system",
  link?: string
) {
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(admins.map((a) => notify(a.id, title, message, type, link)));
}

export function actor(user: AuthUser) {
  return { id: user.id, name: user.fullName, role: user.role };
}
