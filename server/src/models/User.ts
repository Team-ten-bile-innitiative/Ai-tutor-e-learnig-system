import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "student";
export type AccountStatus = "active" | "inactive";
export type LearningLevel = "beginner" | "intermediate" | "advanced";

export interface UserDoc extends mongoose.Document {
  fullName: string;
  email: string;
  password: string;
  avatarUrl: string;
  role: UserRole;
  status: AccountStatus;
  learningLevel: LearningLevel;
  preferredLanguage: string;
  emailVerified: boolean;
  verifyToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastActive: Date;
  notificationEmail: boolean;
  notificationInApp: boolean;
  theme: "light" | "dark" | "system";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["admin", "student"], default: "student", index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    learningLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    preferredLanguage: { type: String, default: "en" },
    emailVerified: { type: Boolean, default: false },
    verifyToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastActive: { type: Date, default: Date.now },
    notificationEmail: { type: Boolean, default: true },
    notificationInApp: { type: Boolean, default: true },
    theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<UserDoc>("User", userSchema);
