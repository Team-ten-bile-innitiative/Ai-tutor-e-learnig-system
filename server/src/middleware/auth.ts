import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { forbidden, unauthorized } from "../utils/ApiError.js";

export interface AuthUser {
  id: string;
  role: "admin" | "student";
  email: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: { id: string; role: string; email: string }) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const protect = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
    if (!token) throw unauthorized();

    const payload = jwt.verify(token, env.jwtSecret) as { id: string };
    const user = await User.findById(payload.id).select("role email fullName status");
    if (!user) throw unauthorized("Account not found");
    if (user.status === "inactive") throw forbidden("Your account is inactive. Contact an administrator.");

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
    };
    next();
  } catch (err) {
    next(err instanceof Error && "statusCode" in err ? err : unauthorized("Session expired. Please sign in again."));
  }
};

export const requireRole =
  (...roles: Array<"admin" | "student">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
