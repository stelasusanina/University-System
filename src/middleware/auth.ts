import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

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

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!roles.includes(authenticatedReq.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
