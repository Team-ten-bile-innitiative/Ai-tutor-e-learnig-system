import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, unauthorized } from "../utils/ApiError.js";
import { hashToken, randomToken } from "../utils/helpers.js";
import { protect, requireRole, setAuthCookie, signToken } from "../middleware/auth.js";
import { logActivity, notifyAdmins } from "../services/activity.service.js";
import { Router } from "express";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    preferredLanguage: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

function publicUser(user: {
  id?: string;
  _id?: unknown;
  fullName: string;
  email: string;
  avatarUrl: string;
  role: string;
  status: string;
  learningLevel: string;
  preferredLanguage: string;
  emailVerified: boolean;
  lastActive: Date;
  notificationEmail: boolean;
  notificationInApp: boolean;
  theme: string;
  createdAt: Date;
}) {
  return {
    id: user.id || String(user._id),
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    learningLevel: user.learningLevel,
    preferredLanguage: user.preferredLanguage,
    emailVerified: user.emailVerified,
    lastActive: user.lastActive,
    notificationEmail: user.notificationEmail,
    notificationInApp: user.notificationInApp,
    theme: user.theme,
    createdAt: user.createdAt,
  };
}

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const verifyToken = hashToken(randomToken());
    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      learningLevel: data.learningLevel || "beginner",
      preferredLanguage: data.preferredLanguage || "en",
      verifyToken,
      role: "student",
      status: "pending",
    });
    if (user.status !== "pending") {
      user.status = "pending";
      await user.save();
    }

    try {
      await notifyAdmins(
        "New student registered",
        `${user.fullName} just joined the platform.`,
        "registration",
        "/admin/pending"
      );
      await logActivity(user.id, "student.registered", "user", user.id);
    } catch (err) {
      console.error("Register notification failed", err);
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.status(201).json({
      success: true,
      message: "Account created. Welcome!",
      data: { user: publicUser(user), token, verifyHint: env.nodeEnv !== "production" ? "Email verification token stored. Use /api/auth/verify" : undefined },
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select("+password");
    if (!user || !(await user.comparePassword(data.password))) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (user.status === "inactive") throw new ApiError(403, "Your account is inactive. Contact an administrator.");

    user.lastActive = new Date();
    await user.save();

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.json({ success: true, message: "Signed in", data: { user: publicUser(user), token } });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Signed out" });
  })
);

authRouter.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw unauthorized();
    res.json({ success: true, data: publicUser(user) });
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = z.string().email().parse(req.body.email);
    const user = await User.findOne({ email });
    const generic = { success: true, message: "If that email exists, a reset link has been sent." };
    if (!user) return res.json(generic);

    const raw = randomToken();
    user.resetPasswordToken = hashToken(raw);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
    console.log("Password reset URL:", resetUrl);
    res.json({
      ...generic,
      ...(env.nodeEnv !== "production" ? { data: { resetUrl } } : {}),
    });
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = z
      .object({ token: z.string().min(10), password: z.string().min(8) })
      .parse(req.body);
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");
    if (!user) throw new ApiError(400, "This reset link is invalid or has expired");
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password updated. You can sign in now." });
  })
);

authRouter.post(
  "/verify-email",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw unauthorized();
    user.emailVerified = true;
    user.verifyToken = undefined;
    await user.save();
    res.json({ success: true, message: "Email verified", data: publicUser(user) });
  })
);

authRouter.post(
  "/change-password",
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .parse(req.body);
    const user = await User.findById(req.user!.id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new ApiError(400, "Current password is incorrect");
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  })
);

authRouter.patch(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional(),
        learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        preferredLanguage: z.string().optional(),
        avatarUrl: z.string().optional(),
        notificationEmail: z.boolean().optional(),
        notificationInApp: z.boolean().optional(),
        theme: z.enum(["light", "dark", "system"]).optional(),
      })
      .parse(req.body);

    const user = await User.findById(req.user!.id);
    if (!user) throw unauthorized();

    if (data.email) {
      const nextEmail = data.email.trim().toLowerCase();
      if (nextEmail !== user.email) {
        const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
        if (taken) throw new ApiError(409, "That email is already in use");
        user.email = nextEmail;
      }
    }
    if (data.fullName) user.fullName = data.fullName;
    if (data.learningLevel) user.learningLevel = data.learningLevel;
    if (data.preferredLanguage) user.preferredLanguage = data.preferredLanguage;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.notificationEmail !== undefined) user.notificationEmail = data.notificationEmail;
    if (data.notificationInApp !== undefined) user.notificationInApp = data.notificationInApp;
    if (data.theme) user.theme = data.theme;
    await user.save();

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    setAuthCookie(res, token);
    res.json({ success: true, message: "Profile saved", data: publicUser(user), token });
  })
);

export { requireRole };
