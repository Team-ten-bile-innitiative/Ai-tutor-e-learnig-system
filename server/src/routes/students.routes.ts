import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { CourseProgress } from "../models/Progress.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { LessonProgress } from "../models/Progress.js";
import { Enrollment } from "../models/Enrollment.js";
import { ActivityLog, LearningStreak } from "../models/Engagement.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, notFound } from "../utils/ApiError.js";
import { paginate, searchFilter } from "../utils/helpers.js";
import { logActivity, notify } from "../services/activity.service.js";
import { randomToken } from "../utils/helpers.js";
import { env } from "../config/env.js";

export const studentAdminRouter = Router();
studentAdminRouter.use(protect, requireRole("admin"));

const studentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  learningLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredLanguage: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  avatarUrl: z.string().optional(),
});

studentAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query as { page?: string; limit?: string });
    const filter: Record<string, unknown> = { role: "student", ...searchFilter(req.query.q as string, ["fullName", "email"]) };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.level) filter.learningLevel = req.query.level;
    const sort = req.query.sort === "oldest" ? { createdAt: 1 as const } : { createdAt: -1 as const };

    const [items, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const ids = items.map((s) => s._id);
    const [enrolls, attempts, progresses] = await Promise.all([
      Enrollment.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: "$student", count: { $sum: 1 } } }]),
      QuizAttempt.aggregate([
        { $match: { student: { $in: ids }, status: "submitted" } },
        { $group: { _id: "$student", avg: { $avg: "$percentage" } } },
      ]),
      CourseProgress.aggregate([
        { $match: { student: { $in: ids } } },
        { $group: { _id: "$student", avg: { $avg: "$progressPercentage" } } },
      ]),
    ]);

    const enrollMap = Object.fromEntries(enrolls.map((e) => [String(e._id), e.count]));
    const avgMap = Object.fromEntries(attempts.map((e) => [String(e._id), Math.round(e.avg)]));
    const progMap = Object.fromEntries(progresses.map((e) => [String(e._id), Math.round(e.avg)]));

    res.json({
      success: true,
      data: items.map((s) => ({
        ...s.toObject(),
        id: s.id,
        courses: enrollMap[s.id] || 0,
        averageScore: avgMap[s.id] ?? null,
        progress: progMap[s.id] ?? 0,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);

studentAdminRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = studentSchema.parse(req.body);
    const password = data.password || "Student@123456";
    const user = await User.create({ ...data, password, role: "student" });
    await logActivity(req.user!.id, "student.created", "user", user.id, { email: user.email });
    await notify(user.id, "Welcome to AI Tutor", "An administrator created your learning account.", "system");
    res.status(201).json({ success: true, message: "Student created", data: user });
  })
);

studentAdminRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) throw notFound("Student not found");

    const [enrollments, lessonCount, completedLessons, attempts, courseProgress, streak, activity] = await Promise.all([
      Enrollment.find({ student: student.id }).populate("course", "title category"),
      LessonProgress.countDocuments({ student: student.id }),
      LessonProgress.countDocuments({ student: student.id, completed: true }),
      QuizAttempt.find({ student: student.id, status: "submitted" }).populate("quiz", "title").sort({ submittedAt: -1 }).limit(10),
      CourseProgress.find({ student: student.id }).populate("course", "title"),
      LearningStreak.findOne({ student: student.id }),
      ActivityLog.find({ user: student.id }).sort({ createdAt: -1 }).limit(12),
    ]);

    const avg =
      attempts.length === 0 ? 0 : Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length);

    res.json({
      success: true,
      data: {
        student,
        enrollments,
        completedLessons,
        trackedLessons: lessonCount,
        completedCourses: courseProgress.filter((c) => c.completed).length,
        averageScore: avg,
        recentAttempts: attempts,
        courseProgress,
        streak,
        recentActivity: activity,
      },
    });
  })
);

studentAdminRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = studentSchema.partial().parse(req.body);
    const { password, ...rest } = data;
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: "student" }, rest, { new: true });
    if (!student) throw notFound("Student not found");
    if (password) {
      student.password = password;
      await student.save();
    }
    await logActivity(req.user!.id, "student.updated", "user", student.id);
    res.json({ success: true, message: "Student updated", data: student });
  })
);

studentAdminRouter.post(
  "/:id/activate",
  asyncHandler(async (req, res) => {
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: "student" }, { status: "active" }, { new: true });
    if (!student) throw notFound("Student not found");
    await logActivity(req.user!.id, "student.activated", "user", student.id);
    await notify(student.id, "Account activated", "You can access the learning platform again.", "system");
    res.json({ success: true, message: "Student activated", data: student });
  })
);

studentAdminRouter.post(
  "/:id/deactivate",
  asyncHandler(async (req, res) => {
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: "student" }, { status: "inactive" }, { new: true });
    if (!student) throw notFound("Student not found");
    await logActivity(req.user!.id, "student.deactivated", "user", student.id);
    res.json({ success: true, message: "Student deactivated", data: student });
  })
);

studentAdminRouter.post(
  "/:id/reset-password",
  asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) throw notFound("Student not found");
    const raw = randomToken();
    const { hashToken } = await import("../utils/helpers.js");
    student.resetPasswordToken = hashToken(raw);
    student.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await student.save();
    const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
    await logActivity(req.user!.id, "student.reset_password", "user", student.id);
    res.json({
      success: true,
      message: "Password reset link generated",
      data: env.nodeEnv !== "production" ? { resetUrl } : { sent: true },
    });
  })
);

studentAdminRouter.get(
  "/:id/progress",
  asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: "student" });
    if (!student) throw notFound("Student not found");
    const [courseProgress, lessonProgress, attempts] = await Promise.all([
      CourseProgress.find({ student: student.id }).populate("course", "title category"),
      LessonProgress.find({ student: student.id }).populate("lesson", "title"),
      QuizAttempt.find({ student: student.id, status: "submitted" }).populate("quiz", "title"),
    ]);
    res.json({ success: true, data: { courseProgress, lessonProgress, attempts } });
  })
);

studentAdminRouter.get(
  "/:id/results",
  asyncHandler(async (req, res) => {
    const attempts = await QuizAttempt.find({ student: req.params.id, status: "submitted" })
      .populate("quiz", "title passingScore")
      .sort({ submittedAt: -1 });
    res.json({ success: true, data: attempts });
  })
);

export const adminCannotPatchScores = () => {
  throw new ApiError(403, "Academic results cannot be edited manually");
};
