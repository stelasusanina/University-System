import { prisma } from "../prisma.ts";

export async function registerPushToken(userId: number, token: string) {
  const existing = await prisma.pushToken.findUnique({ where: { token } });

  if (existing) {
    if (existing.userId === userId) {
      return existing;
    }
    return prisma.pushToken.update({ where: { token }, data: { userId } });
  }

  await prisma.pushToken.deleteMany({ where: { userId } });
  return prisma.pushToken.create({ data: { token, userId } });
}

export async function removePushToken(token: string) {
  await prisma.pushToken.deleteMany({ where: { token } });
}

export async function getTargetedPushTokens(courseGroupId: number | null) {
  let studentGroupId: number | null = null;

  if (courseGroupId != null) {
    const cg = await prisma.courseGroup.findUnique({
      where: { id: courseGroupId },
      select: { groupId: true },
    });
    studentGroupId = cg?.groupId ?? null;
  }

  const students = await prisma.student.findMany({
    where: studentGroupId != null ? { groupId: studentGroupId } : {},
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);
  if (studentIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { studentId: { in: studentIds } },
    select: { pushTokens: { select: { token: true } } },
  });

  return users.flatMap((u) => u.pushTokens.map((t) => t.token));
}

export async function sendPushNotifications(tokens: string[], title: string, body: string) {
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title,
    body,
  }));

  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      console.error("Failed to send push notifications:", err);
    }
  }
}
