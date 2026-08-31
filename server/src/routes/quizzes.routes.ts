import { Router } from "express";
import { z } from "zod";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound } from "../utils/ApiError.js";
import { paginate, searchFilter } from "../utils/helpers.js";
import { logActivity } from "../services/activity.service.js";

export const quizzesRouter = Router();

const quizSchema = z.object({
  course: z.string().min(1),
  lesson: z.string().optional().nullable(),
  title: z.string().min(2),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimit: z.number().min(0).optional(),
  attemptLimit: z.number().min(0).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

quizzesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query as { page?: string; limit?: string });
    const filter: Record<string, unknown> = { ...searchFilter(req.query.q as string, ["title", "description"]) };
    if (req.query.course) filter.course = req.query.course;
    if (req.query.status) filter.status = req.query.status;
    if (req.user?.role !== "admin") filter.status = "published";
    const [items, total] = await Promise.all([
      Quiz.find(filter).populate("course", "title").populate("lesson", "title").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments(filter),
    ]);
    const counts = await Question.aggregate([
      { $match: { quiz: { $in: items.map((q) => q._id) } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]);
    const cMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json({
      success: true,
      data: items.map((q) => ({ ...q.toObject(), id: q.id, questionCount: cMap[q.id] || 0 })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  })
);

quizzesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id).populate("course", "title").populate("lesson", "title");
    if (!quiz) throw notFound("Quiz not found");
    if (req.user?.role !== "admin" && quiz.status !== "published") throw notFound("Quiz not found");
    const questions = await Question.find({ quiz: quiz.id }).sort({ orderIndex: 1 });
    const safe =
      req.user?.role === "admin"
        ? questions
        : questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            difficulty: q.difficulty,
            points: q.points,
            orderIndex: q.orderIndex,
          }));
    res.json({ success: true, data: { ...quiz.toObject(), id: quiz.id, questions: safe } });
  })
);

quizzesRouter.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = quizSchema.parse(req.body);
    const quiz = await Quiz.create(data);
    await logActivity(req.user!.id, "quiz.created", "quiz", quiz.id);
    res.status(201).json({ success: true, message: "Quiz created", data: quiz });
  })
);

quizzesRouter.patch(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = quizSchema.partial().parse(req.body);
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!quiz) throw notFound("Quiz not found");
    await logActivity(req.user!.id, "quiz.updated", "quiz", quiz.id);
    res.json({ success: true, message: "Quiz updated", data: quiz });
  })
);

quizzesRouter.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) throw notFound("Quiz not found");
    await Question.deleteMany({ quiz: quiz.id });
    await logActivity(req.user!.id, "quiz.deleted", "quiz", quiz.id);
    res.json({ success: true, message: "Quiz deleted" });
  })
);

quizzesRouter.post(
  "/:id/status",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const status = z.enum(["draft", "published"]).parse(req.body.status);
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!quiz) throw notFound("Quiz not found");
    res.json({ success: true, message: `Quiz ${status}`, data: quiz });
  })
);

export const questionsRouter = Router();
questionsRouter.use(protect, requireRole("admin"));

const questionSchema = z.object({
  quiz: z.string().min(1),
  questionText: z.string().min(4),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer"]),
  options: z.array(z.object({ text: z.string(), order: z.number() })).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  points: z.number().min(1).optional(),
  orderIndex: z.number().optional(),
});

questionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(req.query as { page?: string; limit?: string });
    const filter: Record<string, unknown> = { ...searchFilter(req.query.q as string, ["questionText"]) };
    if (req.query.quiz) filter.quiz = req.query.quiz;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.questionType = req.query.type;
    const [items, total, grouped] = await Promise.all([
      Question.find(filter)
        .populate({ path: "quiz", select: "title course", populate: { path: "course", select: "title category" } })
        .sort({ createdAt: -1, orderIndex: 1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
      Question.aggregate<{ _id: string; count: number; points: number }>([
        { $group: { _id: "$questionType", count: { $sum: 1 }, points: { $sum: "$points" } } },
      ]),
    ]);
    const byType = Object.fromEntries(grouped.map((g) => [g._id, g]));
    const stats = {
      total: grouped.reduce((s, g) => s + g.count, 0),
      multipleChoice: byType.multiple_choice?.count || 0,
      trueFalse: byType.true_false?.count || 0,
      shortAnswer: byType.short_answer?.count || 0,
      totalPoints: grouped.reduce((s, g) => s + (g.points || 0), 0),
    };
    res.json({
      success: true,
      data: items.map((item) => ({ ...item.toObject(), id: item.id })),
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  })
);

questionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = questionSchema.parse(req.body);
    const question = await Question.create(data);
    await logActivity(req.user!.id, "question.created", "question", question.id);
    res.status(201).json({ success: true, message: "Question created", data: question });
  })
);

questionsRouter.post(
  "/bulk-delete",
  asyncHandler(async (req, res) => {
    const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
    const result = await Question.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${result.deletedCount} question(s) deleted` });
  })
);

questionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = questionSchema.partial().parse(req.body);
    const question = await Question.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!question) throw notFound("Question not found");
    res.json({ success: true, message: "Question updated", data: question });
  })
);

questionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) throw notFound("Question not found");
    res.json({ success: true, message: "Question deleted" });
  })
);

questionsRouter.post(
  "/reorder",
  asyncHandler(async (req, res) => {
    const { items } = z.object({ items: z.array(z.object({ id: z.string(), orderIndex: z.number() })) }).parse(req.body);
    await Promise.all(items.map((i) => Question.findByIdAndUpdate(i.id, { orderIndex: i.orderIndex })));
    res.json({ success: true, message: "Questions reordered" });
  })
);
