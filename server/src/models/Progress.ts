import mongoose, { Schema } from "mongoose";

export interface LessonProgressDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  lesson: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number;
}

const lessonProgressSchema = new Schema<LessonProgressDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    timeSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

export const LessonProgress = mongoose.model<LessonProgressDoc>("LessonProgress", lessonProgressSchema);

export interface CourseProgressDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  progressPercentage: number;
  completed: boolean;
}

const courseProgressSchema = new Schema<CourseProgressDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export const CourseProgress = mongoose.model<CourseProgressDoc>("CourseProgress", courseProgressSchema);
