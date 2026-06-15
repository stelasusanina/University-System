import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { registerPushToken, removePushToken } from "../services/pushService.ts";

export const pushRouter = Router();

pushRouter.post("/", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Токенът е задължителен" });
  }
  await registerPushToken(userId!, token);
  return res.json({ success: true });
});

pushRouter.delete("/", authenticate, async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Токенът е задължителен" });
  }
  await removePushToken(token);
  return res.json({ success: true });
});
