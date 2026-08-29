import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { studentAdminRouter } from "./routes/students.routes.js";
import { coursesRouter } from "./routes/courses.routes.js";
import { lessonsRouter } from "./routes/lessons.routes.js";
import { quizzesRouter, questionsRouter } from "./routes/quizzes.routes.js";
import { learningRouter } from "./routes/learning.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { analyticsRouter, notificationsRouter, uploadRouter, settingsRouter } from "./routes/analytics.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { optionalAuth } from "./middleware/optionalAuth.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 400, standardHeaders: true }));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "AI Learning Tutor API" }));

app.use(optionalAuth);
app.use("/api/auth", authRouter);
app.use("/api/admin/students", studentAdminRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/learning", learningRouter);
app.use("/api/ai", aiRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/contact", contactRouter);
app.use("/api/settings", settingsRouter);

app.use((_req, _res, next) => next(new ApiError(404, "This endpoint does not exist")));
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start", err);
    process.exit(1);
  });
