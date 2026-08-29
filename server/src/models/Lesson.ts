import mongoose, { Schema } from "mongoose";

export interface LessonDoc extends mongoose.Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  imageUrl: string;
  learningObjectives: string[];
  duration: string;
  orderIndex: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<LessonDoc>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    learningObjectives: [{ type: String }],
    duration: { type: String, default: "15 min" },
    orderIndex: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, orderIndex: 1 });

export const Lesson = mongoose.model<LessonDoc>("Lesson", lessonSchema);
