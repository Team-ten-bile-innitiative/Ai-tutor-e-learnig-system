import mongoose, { Schema } from "mongoose";

export interface ConversationDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  lesson?: mongoose.Types.ObjectId;
  quiz?: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<ConversationDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
    title: { type: String, default: "New conversation" },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model<ConversationDoc>("Conversation", conversationSchema);

export interface MessageDoc extends mongoose.Document {
  conversation: mongoose.Types.ObjectId;
  senderType: "student" | "ai";
  message: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDoc>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: { type: String, enum: ["student", "ai"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model<MessageDoc>("Message", messageSchema);

export interface AiFeedbackDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  quizAttempt: mongoose.Types.ObjectId;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}

const feedbackSchema = new Schema<AiFeedbackDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quizAttempt: { type: Schema.Types.ObjectId, ref: "QuizAttempt", required: true },
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    summary: String,
  },
  { timestamps: true }
);

export const AiFeedback = mongoose.model<AiFeedbackDoc>("AiFeedback", feedbackSchema);
