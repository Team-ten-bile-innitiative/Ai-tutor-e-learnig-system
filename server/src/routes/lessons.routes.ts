import { Router } from "express";
import { z } from "zod";
import { Lesson } from "../models/Lesson.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound, forbidden } from "../utils/ApiError.js";
import { paginate, searchFilter } from "../utils/helpers.js";
import { logActivity } from "../services/activity.service.js";

export const lessonsRouter = Router();

const lessonSchema = z.object({
  course: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
  duration: z.string().optional(),
  orderIndex: z.number().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

lessonsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query as { page?: string; limit?: string });
    const filter: Record<string, unknown> = { ...searchFilter(req.query.q as string, ["title", "description"]) };
    if (req.query.course) filter.course = req.query.course;
    if (req.query.status) filter.status = req.query.status;
    if (req.user?.role !== "admin") filter.status = "published";

    const [items, total] = await Promise.all([
      Lesson.find(filter).populate("course", "title").sort({ orderIndex: 1, createdAt: -1 }).skip(skip).limit(limit),
      Lesson.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  })
);

lessonsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findById(req.params.id).populate("course", "title status");
    if (!lesson) throw notFound("Lesson not found");
    if (req.user?.role !== "admin" && lesson.status !== "published") throw notFound("Lesson not found");
    const siblings = await Lesson.find({
      course: lesson.course,
      ...(req.user?.role === "admin" ? {} : { status: "published" }),
    }).sort({ orderIndex: 1 }).select("title orderIndex status");
    res.json({ success: true, data: { lesson, navigation: siblings } });
  })
);

lessonsRouter.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = lessonSchema.parse(req.body);
    const lesson = await Lesson.create(data);
    await logActivity(req.user!.id, "lesson.created", "lesson", lesson.id);
    res.status(201).json({ success: true, message: "Lesson created", data: lesson });
  })
);

lessonsRouter.patch(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = lessonSchema.partial().parse(req.body);
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!lesson) throw notFound("Lesson not found");
    await logActivity(req.user!.id, "lesson.updated", "lesson", lesson.id);
    res.json({ success: true, message: "Lesson updated", data: lesson });
  })
);

lessonsRouter.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) throw notFound("Lesson not found");
    await logActivity(req.user!.id, "lesson.deleted", "lesson", String(req.params.id));
    res.json({ success: true, message: "Lesson deleted" });
  })
);

lessonsRouter.post(
  "/reorder",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { items } = z.object({ items: z.array(z.object({ id: z.string(), orderIndex: z.number() })) }).parse(req.body);
    await Promise.all(items.map((i) => Lesson.findByIdAndUpdate(i.id, { orderIndex: i.orderIndex })));
    res.json({ success: true, message: "Lessons reordered" });
  })
);

lessonsRouter.post(
  "/:id/status",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const status = z.enum(["draft", "published"]).parse(req.body.status);
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lesson) throw notFound("Lesson not found");
    await logActivity(req.user!.id, `lesson.${status}`, "lesson", lesson.id);
    res.json({ success: true, message: `Lesson ${status}`, data: lesson });
  })
);

export const studentCannotEditLessons = forbidden;
