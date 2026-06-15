import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { loginUser, registerUser, refreshToken } from "../services/authService.ts";

export const authRouter = Router();

authRouter.post("/refresh", authenticate, (req, res) => {
  const { userId, email, role } = (req as AuthenticatedRequest).user;
  if (!userId || !email) {
    return res.status(401).json({ error: "Невалидни данни в токена" });
  }
  return res.json({ token: refreshToken(userId, email, role) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password, mobile } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Имейлът и паролата са задължителни" });
  }
  const result = await loginUser(email, password, !!mobile);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({ token: result.token, user: result.user });
});

authRouter.post("/register", async (req, res) => {
  const { email, identifierNumber, firstName, lastName, password } = req.body;
  if (!email || !identifierNumber || !firstName || !lastName || !password) {
    return res.status(400).json({ error: "Всички полета са задължителни: имейл, идентификационен номер, имена и парола" });
  }
  const result = await registerUser(email, identifierNumber, firstName, lastName, password);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(result.status).json({ token: result.token, user: result.user });
});
