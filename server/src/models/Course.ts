import mongoose, { Schema } from "mongoose";

export type CourseStatus = "draft" | "published" | "archived";

export interface CourseDoc extends mongoose.Document {
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  thumbnailUrl: string;
  duration: string;
  instructorName: string;
  status: CourseStatus;
  learningObjectives: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<CourseDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    thumbnailUrl: { type: String, default: "" },
    duration: { type: String, default: "4 weeks" },
    instructorName: { type: String, default: "", trim: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },
    learningObjectives: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text" });

export const Course = mongoose.model<CourseDoc>("Course", courseSchema);
