import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { Course } from "../models/Course.js";
import { Lesson } from "../models/Lesson.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { extractTextbookCourse } from "../services/textbook-import.service.js";
import { logActivity } from "../services/activity.service.js";

const importDirectory = path.join(process.cwd(), "course-imports");
if (!fs.existsSync(importDirectory)) fs.mkdirSync(importDirectory, { recursive: true });

const textbookUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, importDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf" && path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return callback(new ApiError(400, "Upload a PDF textbook."));
    }
    callback(null, true);
  },
});

export const importsRouter = Router();
importsRouter.use(protect, requireRole("admin"));

importsRouter.post(
  "/pdf-course",
  textbookUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose a PDF textbook to import.");
    const options = z
      .object({
        title: z.string().trim().min(2).max(120).optional(),
        subjects: z.preprocess(
          (value) => (Array.isArray(value) ? value : typeof value === "string" ? [value] : value),
          z.array(z.string().trim().min(2).max(60)).min(1).max(8)
        ),
      })
      .parse(req.body);

    try {
      const imported = await extractTextbookCourse(req.file.path, req.file.originalname, req.file.size, options);
      const course = await Course.create({ ...imported.course, category: options.subjects[0], subjects: options.subjects, status: "draft", createdBy: req.user!.id, instructorName: "Imported textbook" });
      const lessons = await Lesson.insertMany(
        imported.lessons.map((lesson, index) => ({ ...lesson, course: course.id, orderIndex: index + 1, status: "draft" }))
      );
      await logActivity(req.user!.id, "course.imported_pdf", "course", course.id);
      res.status(201).json({ success: true, message: "Draft course imported. Review lessons before publishing.", data: { course, lessons } });
    } finally {
      fs.unlink(req.file.path, () => undefined);
    }
  })
);
