import mongoose, { Schema } from "mongoose";

export interface QuizOption {
  text: string;
  order: number;
}

export interface QuestionDoc extends mongoose.Document {
  quiz: mongoose.Types.ObjectId;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer";
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<QuestionDoc>(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer"],
      default: "multiple_choice",
    },
    options: [{ text: String, order: Number }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    points: { type: Number, default: 1, min: 1 },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Question = mongoose.model<QuestionDoc>("Question", questionSchema);
