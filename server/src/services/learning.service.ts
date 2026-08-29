import { Achievement, LearningStreak } from "../models/Engagement.js";
import { CourseProgress, LessonProgress } from "../models/Progress.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";
import { notify } from "./activity.service.js";

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function recordLearningActivity(studentId: string) {
  const today = todayKey();
  let streak = await LearningStreak.findOne({ student: studentId });
  if (!streak) streak = await LearningStreak.create({ student: studentId, currentStreak: 0, longestStreak: 0 });

  if (streak.lastActivityDate === today) return streak;

  const yesterday = todayKey(new Date(Date.now() - 86400000));
  if (streak.lastActivityDate === yesterday) streak.currentStreak += 1;
  else streak.currentStreak = 1;

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.lastActivityDate = today;
  await streak.save();

  if (streak.currentStreak === 7) {
    await unlockAchievement(studentId, "streak_7", "7 Day Streak", "You learned 7 days in a row.");
  }
  return streak;
}

export async function unlockAchievement(studentId: string, key: string, title: string, description: string) {
  try {
    await Achievement.create({ student: studentId, key, title, description });
    await notify(studentId, "Achievement unlocked", title, "system", "/student/progress");
  } catch {
    // unique index — already unlocked
  }
}

export async function recalculateCourseProgress(studentId: string, courseId: string) {
  const total = await Lesson.countDocuments({ course: courseId, status: "published" });
  const completed = await LessonProgress.countDocuments({ student: studentId, course: courseId, completed: true });
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = total > 0 && completed === total;

  const progress = await CourseProgress.findOneAndUpdate(
    { student: studentId, course: courseId },
    { progressPercentage: percentage, completed: isComplete },
    { upsert: true, new: true }
  );

  if (isComplete) {
    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "completed", completedAt: new Date() }
    );
    await unlockAchievement(studentId, `course_${courseId}`, "Course Completed", "You completed a full course.");
    await notify(studentId, "Course completed", "Great work — you finished a course.", "course", "/student/progress");
  }
  return progress;
}

export async function evaluateAchievements(studentId: string) {
  const lessons = await LessonProgress.countDocuments({ student: studentId, completed: true });
  if (lessons >= 1) await unlockAchievement(studentId, "first_lesson", "First Lesson", "You completed your first lesson.");

  const quizzes = await QuizAttempt.countDocuments({ student: studentId, status: "submitted" });
  if (quizzes >= 1) await unlockAchievement(studentId, "first_quiz", "First Quiz", "You submitted your first quiz.");
  if (quizzes >= 10) await unlockAchievement(studentId, "ten_quizzes", "10 Quizzes Completed", "You completed 10 quizzes.");

  const perfect = await QuizAttempt.findOne({ student: studentId, percentage: 100, status: "submitted" });
  if (perfect) await unlockAchievement(studentId, "perfect_score", "Perfect Score", "You scored 100% on a quiz.");
}
