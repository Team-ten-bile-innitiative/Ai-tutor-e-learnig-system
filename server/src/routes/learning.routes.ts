import { Router } from "express";
import { z } from "zod";
import { Enrollment } from "../models/Enrollment.js";
import { Lesson } from "../models/Lesson.js";
import { LessonProgress, CourseProgress } from "../models/Progress.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import type { QuizAnswer } from "../models/QuizAttempt.js";
import { Course } from "../models/Course.js";
import { AiFeedback } from "../models/Conversation.js";
import { Achievement, LearningStreak } from "../models/Engagement.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError, notFound } from "../utils/ApiError.js";
import { notify } from "../services/activity.service.js";
import { evaluateAchievements, recalculateCourseProgress, recordLearningActivity } from "../services/learning.service.js";
import { generateQuizFeedback } from "../services/ai.service.js";
import { User } from "../models/User.js";

export const learningRouter = Router();
learningRouter.use(protect, requireRole("student"));

function answersMatch(expected: string, given: string) {
  return expected.trim().toLowerCase() === given.trim().toLowerCase();
}

learningRouter.post(
  "/enroll/:courseId",
  asyncHandler(async (req, res) => {
    const course = await Course.findOne({ _id: req.params.courseId, status: "published" });
    if (!course) throw notFound("Course not found");
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: req.user!.id, course: course.id },
      { status: "active", enrolledAt: new Date() },
      { upsert: true, new: true }
    );
    await CourseProgress.findOneAndUpdate(
      { student: req.user!.id, course: course.id },
      { progressPercentage: 0, completed: false },
      { upsert: true }
    );
    await recordLearningActivity(req.user!.id);
    res.json({ success: true, message: "Enrolled", data: enrollment });
  })
);

learningRouter.post(
  "/lessons/:id/complete",
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findOne({ _id: req.params.id, status: "published" });
    if (!lesson) throw notFound("Lesson not found");
    const timeSpent = Number(req.body.timeSpent || 0);
    await LessonProgress.findOneAndUpdate(
      { student: req.user!.id, lesson: lesson.id },
      { completed: true, completedAt: new Date(), timeSpent, course: lesson.course },
      { upsert: true }
    );
    const progress = await recalculateCourseProgress(req.user!.id, String(lesson.course));
    await recordLearningActivity(req.user!.id);
    await evaluateAchievements(req.user!.id);
    res.json({ success: true, message: "Lesson marked complete", data: progress });
  })
);

learningRouter.post(
  "/quizzes/:id/start",
  asyncHandler(async (req, res) => {
    const quiz = await Quiz.findOne({ _id: req.params.id, status: "published" });
    if (!quiz) throw notFound("Quiz not found");
    const used = await QuizAttempt.countDocuments({ student: req.user!.id, quiz: quiz.id, status: "submitted" });
    if (quiz.attemptLimit > 0 && used >= quiz.attemptLimit) {
      throw new ApiError(400, "You have reached the attempt limit for this quiz");
    }
    const open = await QuizAttempt.findOne({ student: req.user!.id, quiz: quiz.id, status: "in_progress" });
    if (open) return res.json({ success: true, data: open });
    const attempt = await QuizAttempt.create({ student: req.user!.id, quiz: quiz.id, answers: [] });
    res.status(201).json({ success: true, data: attempt });
  })
);

learningRouter.patch(
  "/attempts/:id/save",
  asyncHandler(async (req, res) => {
    const { answers } = z
      .object({ answers: z.array(z.object({ question: z.string(), answer: z.string() })) })
      .parse(req.body);
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, student: req.user!.id, status: "in_progress" });
    if (!attempt) throw notFound("Attempt not found");
    attempt.answers = answers.map((a) => ({
      question: a.question as unknown as QuizAnswer["question"],
      answer: a.answer,
      isCorrect: false,
      pointsEarned: 0,
    }));
    attempt.timeSpent = Number(req.body.timeSpent || attempt.timeSpent);
    await attempt.save();
    res.json({ success: true, message: "Progress saved", data: attempt });
  })
);

learningRouter.post(
  "/attempts/:id/submit",
  asyncHandler(async (req, res) => {
    const { answers, timeSpent } = z
      .object({
        answers: z.array(z.object({ question: z.string(), answer: z.string() })),
        timeSpent: z.number().optional(),
      })
      .parse(req.body);

    const attempt = await QuizAttempt.findOne({ _id: req.params.id, student: req.user!.id, status: "in_progress" });
    if (!attempt) throw notFound("Attempt not found");
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) throw notFound("Quiz not found");
    const questions = await Question.find({ quiz: quiz.id });

    let score = 0;
    let total = 0;
    const graded = questions.map((q) => {
      total += q.points;
      const given = answers.find((a) => a.question === q.id)?.answer || "";
      const isCorrect = answersMatch(q.correctAnswer, given);
      const pointsEarned = isCorrect ? q.points : 0;
      score += pointsEarned;
      return { question: q._id, answer: given, isCorrect, pointsEarned };
    });

    const percentage = total === 0 ? 0 : Math.round((score / total) * 100);
    attempt.answers = graded;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.passed = percentage >= quiz.passingScore;
    attempt.submittedAt = new Date();
    attempt.status = "submitted";
    attempt.timeSpent = timeSpent || Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
    await attempt.save();

    await recordLearningActivity(req.user!.id);
    await evaluateAchievements(req.user!.id);
    await notify(
      req.user!.id,
      "Quiz completed",
      `You scored ${percentage}% on ${quiz.title}.`,
      "quiz",
      `/student/results/${attempt.id}`
    );

    const wrong = questions.filter((q) => !graded.find((g) => String(g.question) === q.id)?.isCorrect);
    const right = questions.filter((q) => graded.find((g) => String(g.question) === q.id)?.isCorrect);
    const student = await User.findById(req.user!.id);
    const lesson = quiz.lesson ? await Lesson.findById(quiz.lesson) : null;
    const summary = await generateQuizFeedback({
      studentName: student?.fullName || "Student",
      quizTitle: quiz.title,
      percentage,
      passed: attempt.passed,
      strengths: right.slice(0, 3).map((q) => q.questionText.slice(0, 80)),
      weakAreas: wrong.slice(0, 3).map((q) => q.questionText.slice(0, 80)),
      recommendedLessons: lesson ? [lesson.title] : [],
    });
    const feedback = await AiFeedback.create({
      student: req.user!.id,
      quizAttempt: attempt.id,
      strengths: right.slice(0, 3).map((q) => q.questionText),
      weaknesses: wrong.slice(0, 3).map((q) => q.questionText),
      recommendations: lesson ? [`Review: ${lesson.title}`] : ["Continue to the next lesson"],
      summary,
    });
    await notify(req.user!.id, "AI feedback available", "Your quiz feedback is ready.", "ai", `/student/results/${attempt.id}`);

    res.json({ success: true, message: "Quiz submitted", data: { attempt, feedback } });
  })
);

learningRouter.get(
  "/attempts/:id",
  asyncHandler(async (req, res) => {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, student: req.user!.id }).populate("quiz");
    if (!attempt) throw notFound("Result not found");
    const questions = await Question.find({ quiz: attempt.quiz });
    const feedback = await AiFeedback.findOne({ quizAttempt: attempt.id });
    const review =
      attempt.status === "submitted"
        ? questions.map((q) => {
            const ans = attempt.answers.find((a) => String(a.question) === q.id);
            return {
              id: q.id,
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options,
              yourAnswer: ans?.answer || "",
              correctAnswer: q.correctAnswer,
              isCorrect: ans?.isCorrect || false,
              explanation: q.explanation,
              points: q.points,
              pointsEarned: ans?.pointsEarned || 0,
            };
          })
        : [];
    res.json({ success: true, data: { attempt, review, feedback } });
  })
);

learningRouter.get(
  "/me/dashboard",
  asyncHandler(async (req, res) => {
    const studentId = req.user!.id;
    const [enrollments, completedCourses, attempts, streak, achievements, continueLesson, recentLessons] = await Promise.all([
      Enrollment.find({ student: studentId, status: { $ne: "dropped" } }).populate("course"),
      CourseProgress.countDocuments({ student: studentId, completed: true }),
      QuizAttempt.find({ student: studentId, status: "submitted" }).populate("quiz", "title").sort({ submittedAt: -1 }).limit(5),
      LearningStreak.findOne({ student: studentId }),
      Achievement.find({ student: studentId }).sort({ unlockedAt: -1 }),
      LessonProgress.findOne({ student: studentId }).sort({ updatedAt: -1 }).populate({
        path: "lesson",
        populate: { path: "course", select: "title" },
      }),
      LessonProgress.find({ student: studentId }).sort({ updatedAt: -1 }).limit(4).populate("lesson", "title"),
    ]);
    const inProgress = enrollments.length - completedCourses;
    const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;
    const published = await Course.find({ status: "published" }).limit(6);
    const enrolledIds = new Set(enrollments.map((e) => String(e.course)));
    const recommended = published.filter((c) => !enrolledIds.has(c.id)).slice(0, 3);
    res.json({
      success: true,
      data: {
        coursesInProgress: Math.max(0, inProgress),
        completedCourses,
        averageScore: avg,
        streak: streak || { currentStreak: 0, longestStreak: 0 },
        continueLesson,
        recentAttempts: attempts,
        recentLessons,
        recommended,
        achievements,
      },
    });
  })
);

learningRouter.get(
  "/me/progress",
  asyncHandler(async (req, res) => {
    const studentId = req.user!.id;
    const [courseProgress, attempts, streak, achievements, lessonProgress] = await Promise.all([
      CourseProgress.find({ student: studentId }).populate("course", "title category"),
      QuizAttempt.find({ student: studentId, status: "submitted" }).populate("quiz", "title").sort({ submittedAt: 1 }),
      LearningStreak.findOne({ student: studentId }),
      Achievement.find({ student: studentId }),
      LessonProgress.find({ student: studentId }),
    ]);
    const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0;
    const studyTime = lessonProgress.reduce((s, l) => s + (l.timeSpent || 0), 0);
    const overTime = attempts.map((a) => ({
      date: a.submittedAt,
      percentage: a.percentage,
      title: (a.quiz as { title?: string })?.title,
    }));
    res.json({
      success: true,
      data: {
        courseProgress,
        attempts,
        streak,
        achievements,
        averageScore: avg,
        completedLessons: lessonProgress.filter((l) => l.completed).length,
        studyTime,
        overTime,
        overall: courseProgress.length
          ? Math.round(courseProgress.reduce((s, c) => s + c.progressPercentage, 0) / courseProgress.length)
          : 0,
      },
    });
  })
);
