import { Router } from "express";
import { z } from "zod";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Enrollment } from "../models/Enrollment.js";
import { CourseProgress } from "../models/Progress.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/ApiError.js";
import { paginate, searchFilter } from "../utils/helpers.js";
import { logActivity } from "../services/activity.service.js";

export const coursesRouter = Router();

const CATEGORY_ALIASES: Record<string, string[]> = {
  Mathematics: ["Mathematics", "Math"],
  English: ["English", "Language"],
  Science: ["Science"],
  Biology: ["Biology"],
  Chemistry: ["Chemistry"],
  Physics: ["Physics"],
  Geography: ["Geography"],
  History: ["History"],
  "Computer Science": ["Computer Science", "Programming"],
  "Business Studies": ["Business Studies", "Business"],
  Economics: ["Economics"],
  Accounting: ["Accounting"],
  Civics: ["Civics"],
  Agriculture: ["Agriculture"],
  Languages: ["Languages", "Language"],
  "Art & Design": ["Art & Design", "Design"],
  "Physical Education": ["Physical Education"],
  Math: ["Math", "Mathematics"],
  Programming: ["Programming", "Computer Science"],
  "AI & ML": ["AI & ML", "AI", "Machine Learning"],
};

const courseSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  subjects: z.array(z.string().min(2)).min(1).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  thumbnailUrl: z.string().optional(),
  duration: z.string().optional(),
  instructorName: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  learningObjectives: z.array(z.string()).optional(),
});

coursesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query as { page?: string; limit?: string });
    const filter: Record<string, unknown> = { ...searchFilter(req.query.q as string, ["title", "description", "category"]) };
    if (req.query.category) {
      const cat = String(req.query.category);
      const names = CATEGORY_ALIASES[cat] || [cat];
      const subjectFilter = names.length === 1 ? names[0] : { $in: names };
      filter.$or = [{ category: subjectFilter }, { subjects: subjectFilter }];
    }
    if (req.query.level) filter.level = req.query.level;
    if (req.query.status) filter.status = req.query.status;
    if (req.user?.role !== "admin") filter.status = "published";

    const sortParam = String(req.query.sort || "newest");
    const publishedFilter = req.user?.role === "admin" && req.query.status ? { status: req.query.status } : req.user?.role === "admin" ? {} : { status: "published" };
    const popular = sortParam === "popular";

    const [rawItems, categoryRows, total] = await Promise.all([
      Course.find(filter)
        .populate("createdBy", "fullName avatarUrl")
        .sort(sortParam === "title" ? { title: 1 } : { createdAt: -1 })
        .skip(popular ? 0 : skip)
        .limit(popular ? 50 : limit),
      Course.find(publishedFilter).select("category subjects").lean(),
      Course.countDocuments(filter),
    ]);

    const ids = rawItems.map((c) => c._id);
    const [lessonCounts, quizCounts, enrollCounts, studentProgress, studentEnrolls] = await Promise.all([
      Lesson.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", count: { $sum: 1 } } }]),
      Quiz.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", count: { $sum: 1 } } }]),
      Enrollment.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", count: { $sum: 1 } } }]),
      req.user?.role === "student"
        ? CourseProgress.find({ student: req.user.id, course: { $in: ids } })
        : Promise.resolve([]),
      req.user?.role === "student"
        ? Enrollment.find({ student: req.user.id, course: { $in: ids } })
        : Promise.resolve([]),
    ]);
    const lMap = Object.fromEntries(lessonCounts.map((x) => [String(x._id), x.count]));
    const qMap = Object.fromEntries(quizCounts.map((x) => [String(x._id), x.count]));
    const eMap = Object.fromEntries(enrollCounts.map((x) => [String(x._id), x.count]));
    const pMap = Object.fromEntries(studentProgress.map((x) => [String(x.course), x]));
    const enrolledSet = new Set(studentEnrolls.map((x) => String(x.course)));

    const mapped = rawItems.map((c) => {
      const obj = c.toObject();
      const creator = obj.createdBy as { fullName?: string; avatarUrl?: string } | undefined;
      const progress = pMap[c.id];
      return {
        ...obj,
        id: c.id,
        subjects: obj.subjects?.length ? obj.subjects : [obj.category],
        lessons: lMap[c.id] || 0,
        quizzes: qMap[c.id] || 0,
        enrollmentCount: eMap[c.id] || 0,
        enrolled: enrolledSet.has(c.id),
        completed: Boolean(progress?.completed),
        progressPercentage: progress?.progressPercentage ?? 0,
        instructor: {
          fullName: obj.instructorName || creator?.fullName || "Instructor",
          avatarUrl: creator?.avatarUrl || "",
        },
      };
    });

    if (sortParam === "popular") mapped.sort((a, b) => b.enrollmentCount - a.enrollmentCount || a.title.localeCompare(b.title));

    const items = popular ? mapped.slice(skip, skip + limit) : mapped;

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      meta: {
        categories: [...new Set(categoryRows.flatMap((course) => course.subjects?.length ? course.subjects : [course.category]))]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
      },
    });
  })
);

coursesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw notFound("Course not found");
    if (req.user?.role !== "admin" && course.status !== "published") throw notFound("Course not found");
    const lessonFilter = req.user?.role === "admin" ? { course: course.id } : { course: course.id, status: "published" };
    const quizFilter = req.user?.role === "admin" ? { course: course.id } : { course: course.id, status: "published" };
    const [lessons, quizzes, enrolled] = await Promise.all([
      Lesson.find(lessonFilter).sort({ orderIndex: 1 }),
      Quiz.find(quizFilter).sort({ createdAt: 1 }),
      req.user ? Enrollment.findOne({ student: req.user.id, course: course.id }) : null,
    ]);
    res.json({
      success: true,
      data: {
        ...course.toObject(),
        id: course.id,
        subjects: course.subjects?.length ? course.subjects : [course.category],
        lessons,
        quizzes,
        enrolled: Boolean(enrolled),
      },
    });
  })
);

coursesRouter.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = courseSchema.parse(req.body);
    const subjects = data.subjects?.length ? data.subjects : [data.category];
    const course = await Course.create({ ...data, category: subjects[0], subjects, createdBy: req.user!.id });
    await logActivity(req.user!.id, "course.created", "course", course.id);
    res.status(201).json({ success: true, message: "Course created", data: course });
  })
);

coursesRouter.patch(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = courseSchema.partial().parse(req.body);
    const subjects = data.subjects?.length ? data.subjects : undefined;
    const course = await Course.findByIdAndUpdate(req.params.id, { ...data, ...(subjects ? { category: subjects[0], subjects } : {}) }, { new: true });
    if (!course) throw notFound("Course not found");
    await logActivity(req.user!.id, "course.updated", "course", course.id);
    res.json({ success: true, message: "Course updated", data: course });
  })
);

coursesRouter.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) throw notFound("Course not found");
    await Lesson.deleteMany({ course: course.id });
    await Quiz.deleteMany({ course: course.id });
    await logActivity(req.user!.id, "course.deleted", "course", course.id);
    res.json({ success: true, message: "Course deleted" });
  })
);

coursesRouter.post(
  "/:id/status",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const status = z.enum(["draft", "published", "archived"]).parse(req.body.status);
    const course = await Course.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!course) throw notFound("Course not found");
    await logActivity(req.user!.id, `course.${status}`, "course", course.id);
    res.json({ success: true, message: `Course ${status}`, data: course });
  })
);
