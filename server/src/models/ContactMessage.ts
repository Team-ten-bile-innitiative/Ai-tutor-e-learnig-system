import mongoose, { Schema } from "mongoose";

export interface ContactMessageDoc extends mongoose.Document {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

const contactMessageSchema = new Schema<ContactMessageDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model<ContactMessageDoc>("ContactMessage", contactMessageSchema);
