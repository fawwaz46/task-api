import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const EXPIRES_IN = "7d";

export interface AuthedRequest extends Request {
  userId?: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Express middleware: require a valid `Authorization: Bearer <token>` header
 * and attach `req.userId`.
 */
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token." });
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as jwt.JwtPayload;
    req.userId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
