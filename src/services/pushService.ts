import { prisma } from "../prisma.ts";

export async function registerPushToken(userId: number, token: string) {
  const existing = await prisma.pushToken.findUnique({ where: { token } });

  if (existing) {
    if (existing.userId === userId) {
      return existing;
    }
    // Token moved to a different user (re-login on same device) — reassign
    return prisma.pushToken.update({ where: { token }, data: { userId } });
  }

  // New token for this user — delete any stale tokens they had before
  await prisma.pushToken.deleteMany({ where: { userId } });

  return prisma.pushToken.create({ data: { token, userId } });
}

export async function removePushToken(token: string) {
  await prisma.pushToken.deleteMany({ where: { token } });
}

// Get push tokens for students matching a specialty/year/group filter
export async function getTargetedPushTokens(
  specialtyId: number,
  year: number,
  group: number | null,
) {
  const students = await prisma.student.findMany({
    where: {
      specialtyId,
      year,
      ...(group != null ? { group } : {}),
    },
    select: { id: true },
  });

  const studentIds = students.map((s) => s.id);
  if (studentIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: { studentId: { in: studentIds } },
    select: {
      pushTokens: { select: { token: true } },
    },
  });

  return users.flatMap((u) => u.pushTokens.map((t) => t.token));
}

// Send push notifications via Expo Push API
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
) {
  if (tokens.length === 0) {
    return;
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title,
    body,
  }));

  // Expo accepts batches of up to 100
  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      console.error("Failed to send push notifications:", err);
    }
  }
}
