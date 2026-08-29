import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await User.findById(payload.id).select("role email fullName status");
    if (user && user.status === "active") {
      req.user = { id: user.id, role: user.role, email: user.email, fullName: user.fullName };
    }
  } catch {
    // ignore invalid optional tokens
  }
  next();
}
