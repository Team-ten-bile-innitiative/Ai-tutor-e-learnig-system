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
import { Conversation } from "../models/Conversation.js";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function countByDay(dates: Date[], from: Date, to: Date) {
  const map = new Map<string, number>();
  for (const d of dates) {
    if (d < from || d > to) continue;
    const k = dayKey(d);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const series: { date: string; count: number }[] = [];
  for (let t = startOfDay(from).getTime(); t <= to.getTime(); t += 86400000) {
    const k = dayKey(new Date(t));
    series.push({ date: k, count: map.get(k) || 0 });
  }
  return series;
}

function countByYearMonths(dates: Date[], year: number) {
  const map = new Map<string, number>();
  for (const d of dates) {
    if (d.getFullYear() !== year) continue;
    const k = monthKey(d);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const series: { date: string; count: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    const k = `${year}-${String(m).padStart(2, "0")}`;
    series.push({ date: k, count: map.get(k) || 0 });
  }
  return series;
}

function padMonths(map: Map<string, { newUsers: number; activeUsers: number }>, months = 6) {
  const out: { month: string; count: number; newUsers: number; activeUsers: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const row = map.get(key) || { newUsers: 0, activeUsers: 0 };
    out.push({ month: key, count: row.newUsers, newUsers: row.newUsers, activeUsers: row.activeUsers });
  }
  return out;
}
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
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (q.length < 1) {
      res.json({ success: true, data: { students: [], courses: [], quizzes: [] } });
      return;
    }
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [students, courses, quizzes] = await Promise.all([
      User.find({ role: "student", $or: [{ fullName: rx }, { email: rx }] })
        .select("fullName email")
        .limit(5),
      Course.find({ $or: [{ title: rx }, { category: rx }] })
        .select("title category")
        .limit(5),
      Quiz.find({ title: rx }).select("title").limit(5),
    ]);
    res.json({
      success: true,
      data: {
        students: students.map((s) => ({ id: s.id, title: s.fullName, hint: s.email, to: `/admin/students/${s.id}` })),
        courses: courses.map((c) => ({ id: c.id, title: c.title, hint: c.category, to: "/admin/courses" })),
        quizzes: quizzes.map((qz) => ({ id: qz.id, title: qz.title, hint: "Quiz", to: "/admin/quizzes" })),
      },
    });
  })
);

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

    const growthMap = new Map<string, { newUsers: number; activeUsers: number }>();
    const students = await User.find({ role: "student" }).select("createdAt lastActive");
    for (const s of students) {
      const created = monthKey(s.createdAt);
      const cur = growthMap.get(created) || { newUsers: 0, activeUsers: 0 };
      cur.newUsers += 1;
      growthMap.set(created, cur);
      if (s.lastActive) {
        const active = monthKey(s.lastActive);
        const row = growthMap.get(active) || { newUsers: 0, activeUsers: 0 };
        row.activeUsers += 1;
        growthMap.set(active, row);
      }
    }
    const studentGrowth = padMonths(growthMap, 6);

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
    const now = new Date();
    const to = req.query.to ? endOfDay(new Date(String(req.query.to))) : endOfDay(now);
    const from = req.query.from ? startOfDay(new Date(String(req.query.from))) : startOfDay(addDays(to, -6));
    const span = Math.max(1, to.getTime() - from.getTime());
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = startOfDay(new Date(prevTo.getTime() - span));

    const inRange = (d?: Date | null) => Boolean(d && d >= from && d <= to);
    const inPrev = (d?: Date | null) => Boolean(d && d >= prevFrom && d <= prevTo);

    const [
      students,
      courses,
      attempts,
      enrollments,
      lessonProg,
      conversations,
      popular,
    ] = await Promise.all([
      User.find({ role: "student" }).select("createdAt lastActive status learningLevel preferredLanguage"),
      Course.find().select("title thumbnailUrl category"),
      QuizAttempt.find({ status: "submitted" }).select("percentage passed submittedAt student"),
      Enrollment.find().select("course student enrolledAt status"),
      LessonProgress.find().select("completed completedAt timeSpent student updatedAt"),
      Conversation.find().select("createdAt"),
      Enrollment.aggregate([
        ...(courseId ? [{ $match: { course: courseId } }] : []),
        { $group: { _id: "$course", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const newNow = students.filter((s) => inRange(s.createdAt)).length;
    const newPrev = students.filter((s) => inPrev(s.createdAt)).length;
    const activeNow = students.filter((s) => s.status === "active" && inRange(s.lastActive)).length;
    const activePrev = students.filter((s) => s.status === "active" && inPrev(s.lastActive)).length;
    const quizNow = attempts.filter((a) => inRange(a.submittedAt)).length;
    const quizPrev = attempts.filter((a) => inPrev(a.submittedAt)).length;
    const lessonsNow = lessonProg.filter((l) => l.completed && inRange(l.completedAt || l.updatedAt)).length;
    const enrollNow = enrollments.filter((e) => inRange(e.enrolledAt)).length;
    const chatNow = conversations.filter((c) => inRange(c.createdAt)).length;

    const timeNow = lessonProg
      .filter((l) => inRange(l.updatedAt))
      .reduce((s, l) => s + (l.timeSpent || 0), 0);
    const timePrev = lessonProg
      .filter((l) => inPrev(l.updatedAt))
      .reduce((s, l) => s + (l.timeSpent || 0), 0);
    const studyMinutes = timeNow > 0 ? Math.round(timeNow / 60) : lessonsNow * 15;
    const studyMinutesPrev = timePrev > 0 ? Math.round(timePrev / 60) : 0;

    const sparkStudents = countByDay(students.map((s) => s.createdAt), from, to).map((d) => d.count);
    const sparkActive = countByDay(
      students.filter((s) => s.status === "active" && s.lastActive).map((s) => s.lastActive as Date),
      from,
      to
    ).map((d) => d.count);
    const sparkQuizzes = countByDay(
      attempts.map((a) => a.submittedAt).filter(Boolean) as Date[],
      from,
      to
    ).map((d) => d.count);
    const sparkLessons = countByDay(
      lessonProg.filter((l) => l.completed).map((l) => l.completedAt || l.updatedAt),
      from,
      to
    ).map((d) => d.count);

    const grain = String(req.query.grain || "") === "month" ? "month" : "day";
    const year = to.getFullYear();
    const activeDates = students.filter((s) => s.status === "active" && s.lastActive).map((s) => s.lastActive as Date);
    const monthlyNew = grain === "month" ? countByYearMonths(students.map((s) => s.createdAt), year) : [];
    const monthlyActive = grain === "month" ? countByYearMonths(activeDates, year) : [];
    const growth =
      grain === "month"
        ? monthlyNew.map((row, i) => ({ date: row.date, newUsers: row.count, activeUsers: monthlyActive[i]?.count || 0 }))
        : countByDay(students.map((s) => s.createdAt), from, to).map((row, i) => ({
            date: row.date,
            newUsers: row.count,
            activeUsers: sparkActive[i] || 0,
          }));

    const activityParts = [
      { name: "Lessons completed", value: lessonsNow, color: "#7C3AED" },
      { name: "Quizzes", value: quizNow, color: "#2563EB" },
      { name: "Enrollments", value: enrollNow, color: "#16A34A" },
      { name: "AI tutor chats", value: chatNow, color: "#F59E0B" },
    ];
    const activityTotal = activityParts.reduce((s, p) => s + p.value, 0);

    const popularCourses = popular.map((p) => {
      const course = courses.find((c) => c.id === String(p._id));
      return {
        title: course?.title || "Course",
        thumbnailUrl: course?.thumbnailUrl || "",
        category: course?.category || "",
        enrollments: p.count,
      };
    });

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

    const levelCounts = { beginner: 0, intermediate: 0, advanced: 0 };
    const statusCounts = { active: 0, pending: 0, inactive: 0 };
    const langCounts = new Map<string, number>();
    for (const s of students) {
      if (s.learningLevel in levelCounts) levelCounts[s.learningLevel as keyof typeof levelCounts] += 1;
      if (s.status in statusCounts) statusCounts[s.status as keyof typeof statusCounts] += 1;
      const lang = (s.preferredLanguage || "en").toUpperCase();
      langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
    }
    const totalStudents = students.length || 1;
    const distribution = [
      { name: "Beginner", value: levelCounts.beginner, color: "#7C3AED" },
      { name: "Intermediate", value: levelCounts.intermediate, color: "#2563EB" },
      { name: "Advanced", value: levelCounts.advanced, color: "#16A34A" },
    ];
    const languages = [...langCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value, pct: Math.round((value / totalStudents) * 1000) / 10 }));

    const quizPerf = attempts.reduce(
      (acc, a) => {
        if (a.percentage >= 80) acc.excellent += 1;
        else if (a.percentage >= 60) acc.good += 1;
        else acc.needsWork += 1;
        return acc;
      },
      { excellent: 0, good: 0, needsWork: 0 }
    );

    const learners = students.length;
    const uniqueProgress = new Set(lessonProg.map((l) => String(l.student))).size;
    const avgMinutes = uniqueProgress ? Math.round(studyMinutes / uniqueProgress) : 0;
    const lessonsPerUser = learners ? Math.round((lessonProg.filter((l) => l.completed).length / learners) * 10) / 10 : 0;
    const passed = attempts.filter((a) => a.passed).length;
    const quizSuccess = attempts.length ? Math.round((passed / attempts.length) * 1000) / 10 : 0;
    const retained = students.filter((s) => s.lastActive && s.lastActive >= addDays(now, -30)).length;
    const retention = learners ? Math.round((retained / learners) * 1000) / 10 : 0;

    res.json({
      success: true,
      data: {
        range: { from: from.toISOString(), to: to.toISOString() },
        totals: {
          students: students.length,
          active: students.filter((s) => s.status === "active").length,
          enrollments: enrollments.length,
          completion: await CourseProgress.countDocuments({ completed: true }),
        },
        averageScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0,
        popularCourses,
        difficultQuestions,
        lessonEngagement: lessonProg.filter((l) => l.completed).length,
        kpis: [
          {
            key: "users",
            label: "Total users",
            value: students.length,
            change: pctChange(newNow, newPrev),
            spark: sparkStudents,
            color: "#7C3AED",
          },
          {
            key: "active",
            label: "Active learners",
            value: students.filter((s) => s.status === "active").length,
            change: pctChange(activeNow, activePrev),
            spark: sparkActive,
            color: "#2563EB",
          },
          {
            key: "courses",
            label: "Courses",
            value: courses.length,
            change: pctChange(courses.length, courses.length),
            spark: sparkLessons,
            color: "#16A34A",
          },
          {
            key: "quizzes",
            label: "Quizzes taken",
            value: attempts.length,
            change: pctChange(quizNow, quizPrev),
            spark: sparkQuizzes,
            color: "#F59E0B",
          },
          {
            key: "study",
            label: "Total study time",
            value: `${Math.round(studyMinutes / 60)}h`,
            change: pctChange(studyMinutes, studyMinutesPrev),
            spark: sparkLessons,
            color: "#4F46E5",
          },
        ],
        growth,
        grain,
        activity: { total: activityTotal, parts: activityParts },
        distribution,
        languages,
        statuses: statusCounts,
        quizPerformance: [
          { name: "Excellent", value: quizPerf.excellent, color: "#7C3AED" },
          { name: "Good", value: quizPerf.good, color: "#2563EB" },
          { name: "Needs work", value: quizPerf.needsWork, color: "#16A34A" },
        ],
        engagement: [
          { label: "Average session", value: avgMinutes ? `${avgMinutes}m` : "—", change: pctChange(studyMinutes, studyMinutesPrev), color: "#16A34A" },
          { label: "Lessons per user", value: lessonsPerUser, change: pctChange(lessonsNow, 0), color: "#2563EB" },
          { label: "Quiz success rate", value: `${quizSuccess}%`, change: pctChange(quizSuccess, 0), color: "#F59E0B" },
          { label: "Retention (30 days)", value: `${retention}%`, change: pctChange(retained, learners - retained), color: "#7C3AED" },
        ],
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
