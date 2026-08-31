import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { Enrollment } from "../models/Enrollment.js";
import { CourseProgress, LessonProgress } from "../models/Progress.js";
import { QuizAttempt } from "../models/QuizAttempt.js";

export async function deleteCourseTree(courseId: string) {
  const quizzes = await Quiz.find({ course: courseId }).select("_id");
  const quizIds = quizzes.map((q) => q._id);
  if (quizIds.length) {
    await Question.deleteMany({ quiz: { $in: quizIds } });
    await QuizAttempt.deleteMany({ quiz: { $in: quizIds } });
  }
  await Quiz.deleteMany({ course: courseId });
  await Lesson.deleteMany({ course: courseId });
  await Enrollment.deleteMany({ course: courseId });
  await CourseProgress.deleteMany({ course: courseId });
  await LessonProgress.deleteMany({ course: courseId });
  await Course.findByIdAndDelete(courseId);
}

export async function keepNamedOrFirstCourses(keepTitles: string[], limit = 3) {
  let keep = await Course.find({ title: { $in: keepTitles } });
  if (keep.length < limit) {
    const extra = await Course.find({ _id: { $nin: keep.map((c) => c._id) } })
      .sort({ createdAt: 1 })
      .limit(limit - keep.length);
    keep = [...keep, ...extra];
  } else {
    keep = keep.slice(0, limit);
  }
  const keepIds = new Set(keep.map((c) => String(c._id)));
  const all = await Course.find().select("_id title");
  let removed = 0;
  for (const course of all) {
    if (keepIds.has(String(course._id))) continue;
    await deleteCourseTree(course.id);
    removed += 1;
  }
  return { kept: keep.map((c) => c.title), removed };
}

export async function deleteCoursesByCategory(category: string) {
  const courses = await Course.find({
    category: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });
  for (const course of courses) {
    await deleteCourseTree(course.id);
  }
  return { removed: courses.length };
}
