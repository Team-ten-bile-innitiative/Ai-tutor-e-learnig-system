import { Router } from "express";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Enrollment } from "../models/Enrollment.js";
import { CourseProgress, LessonProgress } from "../models/Progress.js";
import { ActivityLog, Notification } from "../models/Engagement.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middleware/upload.js";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const published = { status: "published" };
    const [students, courses, publishedDocs, attempts] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(published),
      Course.find(published).populate("createdBy", "fullName").select("category instructorName createdBy"),
      QuizAttempt.find({ status: "submitted" }).select("passed percentage"),
    ]);
    const categories = new Set(publishedDocs.map((c) => c.category).filter(Boolean)).size;
    const instructors = new Set(
      publishedDocs
        .map((c) => {
          const creator = c.createdBy as { fullName?: string } | undefined;
          return (c.instructorName || creator?.fullName || "").trim();
        })
        .filter(Boolean)
    ).size;
    const satisfaction = attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : null;
    res.json({
      success: true,
      data: {
        students,
        courses,
        categories,
        instructors,
        satisfaction,
        support: "24/7",
      },
    });
  })
);

analyticsRouter.use(protect, requireRole("admin"));

analyticsRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const since30 = new Date(Date.now() - 30 * 86400000);
    const [
      totalStudents,
      activeStudents,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalQuestions,
      attempts,
      enrollments,
      activity,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", status: "active", lastActive: { $gte: since30 } }),
      Course.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments(),
      Question.countDocuments(),
      QuizAttempt.find({ status: "submitted" }).select("percentage submittedAt passed"),
      Enrollment.countDocuments(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(12).populate("user", "fullName role"),
    ]);

    const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;
    const completedCourses = await CourseProgress.countDocuments({ completed: true });
    const completionRate = enrollments ? Math.round((completedCourses / enrollments) * 100) : 0;

    const growthMap = new Map<string, number>();
    const students = await User.find({ role: "student" }).select("createdAt");
    for (const s of students) {
      const key = s.createdAt.toISOString().slice(0, 7);
      growthMap.set(key, (growthMap.get(key) || 0) + 1);
    }
    const studentGrowth = [...growthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));

    const quizPerf = attempts.reduce(
      (acc, a) => {
        if (a.percentage >= 80) acc.excellent += 1;
        else if (a.percentage >= 60) acc.good += 1;
        else acc.needsWork += 1;
        return acc;
      },
      { excellent: 0, good: 0, needsWork: 0 }
    );

    res.json({
      success: true,
      data: {
        cards: { totalStudents, activeStudents, totalCourses, totalLessons, totalQuizzes, totalQuestions },
        analytics: {
          averageQuizScore: avgScore,
          courseCompletionRate: completionRate,
          activeLearners: activeStudents,
          learningActivity: await LessonProgress.countDocuments({ updatedAt: { $gte: since30 } }),
        },
        studentGrowth,
        quizPerformance: quizPerf,
        completion: { completed: completedCourses, remaining: Math.max(0, enrollments - completedCourses) },
        recentActivity: activity,
      },
    });
  })
);

analyticsRouter.get(
  "/full",
  asyncHandler(async (req, res) => {
    const courseId = req.query.course as string | undefined;
    const attemptFilter: Record<string, unknown> = { status: "submitted" };
    if (req.query.from || req.query.to) {
      attemptFilter.submittedAt = {
        ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
        ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
      };
    }

    const popular = await Enrollment.aggregate([
      ...(courseId ? [{ $match: { course: courseId } }] : []),
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const courses = await Course.find({ _id: { $in: popular.map((p) => p._id) } }).select("title");
    const popularCourses = popular.map((p) => ({
      title: courses.find((c) => c.id === String(p._id))?.title || "Course",
      enrollments: p.count,
    }));

    const hard = await QuizAttempt.aggregate([
      { $unwind: "$answers" },
      { $match: { "answers.isCorrect": false, status: "submitted" } },
      { $group: { _id: "$answers.question", misses: { $sum: 1 } } },
      { $sort: { misses: -1 } },
      { $limit: 8 },
    ]);
    const qs = await Question.find({ _id: { $in: hard.map((h) => h._id) } }).select("questionText difficulty");
    const difficultQuestions = hard.map((h) => ({
      question: qs.find((q) => q.id === String(h._id))?.questionText || "Question",
      difficulty: qs.find((q) => q.id === String(h._id))?.difficulty,
      misses: h.misses,
    }));

    const attempts = await QuizAttempt.find(attemptFilter).select("percentage passed submittedAt");
    res.json({
      success: true,
      data: {
        totals: {
          students: await User.countDocuments({ role: "student" }),
          active: await User.countDocuments({ role: "student", status: "active" }),
          enrollments: await Enrollment.countDocuments(),
          completion: await CourseProgress.countDocuments({ completed: true }),
        },
        averageScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0,
        popularCourses,
        difficultQuestions,
        lessonEngagement: await LessonProgress.countDocuments({ completed: true }),
      },
    });
  })
);

export const notificationsRouter = Router();
notificationsRouter.use(protect);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await Notification.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(30);
    const unread = await Notification.countDocuments({ user: req.user!.id, read: false });
    res.json({ success: true, data: { items, unread } });
  })
);

notificationsRouter.post(
  "/read",
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
    res.json({ success: true });
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!.id }, { read: true });
    res.json({ success: true });
  })
);

export const uploadRouter = Router();
uploadRouter.use(protect);
uploadRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    res.json({ success: true, data: { url: `/uploads/${req.file.filename}` } });
  })
);

export const settingsRouter = Router();
settingsRouter.use(protect, requireRole("admin"));
settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        platformName: "Interactive AI Learning Tutor",
        allowRegistration: true,
        maintenance: false,
      },
    });
  })
);

settingsRouter.get(
  "/audit",
  asyncHandler(async (_req, res) => {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(80).populate("user", "fullName email role");
    res.json({ success: true, data: logs });
  })
);
