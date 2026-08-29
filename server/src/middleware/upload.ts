import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { ApiError } from "../utils/ApiError.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|webp|gif)|video\/(mp4|webm)/.test(file.mimetype);
    if (!ok) return cb(new ApiError(400, "Only images and mp4/webm videos are allowed"));
    cb(null, true);
  },
});
