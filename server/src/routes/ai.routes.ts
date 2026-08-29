import { Router } from "express";
import { z } from "zod";
import { Conversation, Message } from "../models/Conversation.js";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { User } from "../models/User.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Question } from "../models/Question.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFound, forbidden } from "../utils/ApiError.js";
import { generateTutorReply } from "../services/ai.service.js";
import { recordLearningActivity } from "../services/learning.service.js";

export const aiRouter = Router();
aiRouter.use(protect, requireRole("student"));

aiRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const items = await Conversation.find({ student: req.user!.id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: items });
  })
);

aiRouter.post(
  "/conversations",
  asyncHandler(async (req, res) => {
    const data = z
      .object({
        title: z.string().optional(),
        course: z.string().optional(),
        lesson: z.string().optional(),
        quiz: z.string().optional(),
      })
      .parse(req.body);
    const conversation = await Conversation.create({ ...data, student: req.user!.id, title: data.title || "New conversation" });
    res.status(201).json({ success: true, data: conversation });
  })
);

aiRouter.patch(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const title = z.string().min(1).parse(req.body.title);
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, student: req.user!.id },
      { title },
      { new: true }
    );
    if (!conversation) throw notFound("Conversation not found");
    res.json({ success: true, data: conversation });
  })
);

aiRouter.delete(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, student: req.user!.id });
    if (!conversation) throw notFound("Conversation not found");
    await Message.deleteMany({ conversation: conversation.id });
    res.json({ success: true, message: "Conversation deleted" });
  })
);

aiRouter.get(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id, student: req.user!.id });
    if (!conversation) throw notFound("Conversation not found");
    const messages = await Message.find({ conversation: conversation.id }).sort({ createdAt: 1 });
    res.json({ success: true, data: { conversation, messages } });
  })
);

aiRouter.post(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
    const conversation = await Conversation.findOne({ _id: req.params.id, student: req.user!.id });
    if (!conversation) throw notFound("Conversation not found");

    await Message.create({ conversation: conversation.id, senderType: "student", message });
    const history = await Message.find({ conversation: conversation.id }).sort({ createdAt: 1 }).limit(24);

    const [student, course, lesson, quiz] = await Promise.all([
      User.findById(req.user!.id),
      conversation.course ? Course.findById(conversation.course).select("title") : null,
      conversation.lesson ? Lesson.findById(conversation.lesson).select("title content") : null,
      conversation.quiz ? Quiz.findById(conversation.quiz).select("title") : null,
    ]);

    let lastMistake: string | undefined;
    if (conversation.quiz) {
      const last = await QuizAttempt.findOne({ student: req.user!.id, quiz: conversation.quiz, status: "submitted" }).sort({
        submittedAt: -1,
      });
      if (last) {
        const wrong = last.answers.find((a) => !a.isCorrect);
        if (wrong) {
          const q = await Question.findById(wrong.question).select("questionText");
          lastMistake = q?.questionText;
        }
      }
    }

    const reply = await generateTutorReply(
      message,
      history.map((m) => ({ role: m.senderType === "student" ? "user" : "assistant", content: m.message })),
      {
        studentName: student?.fullName || "Student",
        learningLevel: student?.learningLevel || "beginner",
        courseTitle: course?.title,
        lessonTitle: lesson?.title,
        lessonContent: lesson?.content,
        quizTitle: quiz?.title,
        lastMistake,
      }
    );

    const aiMessage = await Message.create({ conversation: conversation.id, senderType: "ai", message: reply });
    if (conversation.title === "New conversation") {
      conversation.title = message.slice(0, 48);
    }
    conversation.updatedAt = new Date();
    await conversation.save();
    await recordLearningActivity(req.user!.id);
    res.json({ success: true, data: aiMessage });
  })
);

export const adminCannotReadAi = forbidden;
