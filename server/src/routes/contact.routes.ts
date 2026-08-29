import { Router } from "express";
import { z } from "zod";
import { ContactMessage } from "../models/ContactMessage.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Engagement.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contactRouter = Router();

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

contactRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = schema.parse(req.body);
    const saved = await ContactMessage.create(body);
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length) {
      await Notification.insertMany(
        admins.map((admin) => ({
          user: admin._id,
          title: "New contact message",
          message: `${body.fullName}: ${body.subject}`,
          type: "system",
        }))
      );
    }
    res.json({ success: true, data: { id: saved.id } });
  })
);
