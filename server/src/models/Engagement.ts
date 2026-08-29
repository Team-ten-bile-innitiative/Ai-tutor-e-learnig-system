import mongoose, { Schema } from "mongoose";

export interface NotificationDoc extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "quiz" | "course" | "system" | "ai" | "reminder" | "registration";
  read: boolean;
  link?: string;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["quiz", "course", "system", "ai", "reminder", "registration"], default: "system" },
    read: { type: Boolean, default: false },
    link: String,
  },
  { timestamps: true }
);

export const Notification = mongoose.model<NotificationDoc>("Notification", notificationSchema);

export interface ActivityLogDoc extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

const activitySchema = new Schema<ActivityLogDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model<ActivityLogDoc>("ActivityLog", activitySchema);

export interface StreakDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
}

const streakSchema = new Schema<StreakDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: String,
  },
  { timestamps: true }
);

export const LearningStreak = mongoose.model<StreakDoc>("LearningStreak", streakSchema);

export interface AchievementDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  key: string;
  title: string;
  description: string;
  unlockedAt: Date;
}

const achievementSchema = new Schema<AchievementDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

achievementSchema.index({ student: 1, key: 1 }, { unique: true });

export const Achievement = mongoose.model<AchievementDoc>("Achievement", achievementSchema);
