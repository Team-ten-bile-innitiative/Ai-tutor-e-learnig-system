import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path?.filter(Boolean).join(" ") || "form";
    return res.status(400).json({
      success: false,
      message: first ? `Please complete ${field}` : "Please complete the required fields",
      details: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  const mongoErr = err as { code?: number; name?: string };
  if (mongoErr?.code === 11000) {
    return res.status(409).json({ success: false, message: "That email is already registered" });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    ...(env.isProd ? {} : { debug: err instanceof Error ? err.message : String(err) }),
  });
}
