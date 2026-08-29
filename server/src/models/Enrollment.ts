import mongoose, { Schema } from "mongoose";

export interface EnrollmentDoc extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  status: "active" | "completed" | "dropped";
}

const enrollmentSchema = new Schema<EnrollmentDoc>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    status: { type: String, enum: ["active", "completed", "dropped"], default: "active" },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model<EnrollmentDoc>("Enrollment", enrollmentSchema);
