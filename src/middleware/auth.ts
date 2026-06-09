import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

if (!process.env.JWT_SECRET) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}
const JWT_SECRET = process.env.JWT_SECRET;

type AuthUser = {
  userId?: number;
  email?: string;
  role: string;
};

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export type { AuthUser, AuthenticatedRequest };

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
