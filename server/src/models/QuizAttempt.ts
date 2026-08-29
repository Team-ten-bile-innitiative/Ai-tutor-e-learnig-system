import mongoose, { Schema } from "mongoose";

export interface QuizAnswer {
  question: mongoose.Types.ObjectId;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizAttemptDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  score: number;
  percentage: number;
  passed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number;
  answers: QuizAnswer[];
  status: "in_progress" | "submitted";
}

const quizAttemptSchema = new Schema<QuizAttemptDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    timeSpent: { type: Number, default: 0 },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Question" },
        answer: String,
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
  },
  { timestamps: true }
);

export const QuizAttempt = mongoose.model<QuizAttemptDoc>("QuizAttempt", quizAttemptSchema);
