import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { createAnnouncement, getAnnouncementsForUser, updateAnnouncement, deleteAnnouncement, getStaffFormOptions } from "../services/announcementService.ts";
import { getTargetedPushTokens, sendPushNotifications } from "../services/pushService.ts";

export const announcementsRouter = Router();

announcementsRouter.post("/", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const { message, type, validTo, courseGroupId } = req.body;
  if (!message || !validTo) {
    return res.status(400).json({ error: "message and validTo are required" });
  }
  const result = await createAnnouncement(userId, { message, type, validTo, courseGroupId });
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  getTargetedPushTokens(courseGroupId ?? null)
    .then((tokens) => {
      if (tokens.length > 0) {
        const title = type ? type.replaceAll("_", " ") : "Ново съобщение";
        sendPushNotifications(tokens, title, message);
      }
    })
    .catch((err) => console.error("Push notification error:", err));
  return res.status(result.status).json(result.data);
});

announcementsRouter.get("/", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const result = await getAnnouncementsForUser(userId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

announcementsRouter.get("/form-options", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const result = await getStaffFormOptions(userId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

announcementsRouter.put("/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const announcementId = parseInt(req.params.id as string);
  const result = await updateAnnouncement(userId, announcementId, req.body);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

announcementsRouter.delete("/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const announcementId = parseInt(req.params.id as string);
  const result = await deleteAnnouncement(userId, announcementId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({ success: true });
});
