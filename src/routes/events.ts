import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { getEventsForUser, createEvent, deleteEvent } from "../services/eventService.ts";
import { getStaffFormOptions } from "../services/announcementService.ts";

export const eventsRouter = Router();

eventsRouter.get("/dates", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const result = await getEventsForUser(userId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result.data);
});

eventsRouter.get("/form-options", authenticate, async (req, res) => {
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

eventsRouter.post("/", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const { title, type, date, startTime, endTime, room, courseId, groupId } = req.body;
  if (!title || !type || !date || !courseId) {
    return res.status(400).json({ error: "title, type, date, and courseId are required" });
  }
  const result = await createEvent(userId, { title, type, date, startTime, endTime, room, courseId, groupId });
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(result.status).json(result.data);
});

eventsRouter.delete("/:id", authenticate, async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).user;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token payload" });
  }
  const eventId = parseInt(req.params.id as string);
  const result = await deleteEvent(userId, eventId);
  if ("error" in result) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({ success: true });
});
