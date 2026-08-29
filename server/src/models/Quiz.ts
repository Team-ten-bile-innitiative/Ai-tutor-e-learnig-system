import mongoose, { Schema } from "mongoose";

export interface QuizDoc extends mongoose.Document {
  course: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  attemptLimit: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<QuizDoc>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    timeLimit: { type: Number, default: 0 },
    attemptLimit: { type: Number, default: 3 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<QuizDoc>("Quiz", quizSchema);
