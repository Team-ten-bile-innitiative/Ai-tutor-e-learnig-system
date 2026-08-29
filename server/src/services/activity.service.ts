import { ActivityLog } from "../models/Engagement.js";
import { Notification } from "../models/Engagement.js";
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

export function actor(user: AuthUser) {
  return { id: user.id, name: user.fullName, role: user.role };
}
