import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { notificationStates } from "@/drizzle/schema";
import { db } from "@/lib/db";

export type NotificationStateMap = Map<
  string,
  { readAt: Date | null; dismissedAt: Date | null; createdAt: Date }
>;

export const getNotificationStateMap = async (
  userId: number,
  notificationIds: string[],
): Promise<NotificationStateMap> => {
  if (notificationIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      notificationId: notificationStates.notificationId,
      readAt: notificationStates.readAt,
      dismissedAt: notificationStates.dismissedAt,
      createdAt: notificationStates.createdAt,
    })
    .from(notificationStates)
    .where(
      and(
        eq(notificationStates.userId, userId),
        inArray(notificationStates.notificationId, notificationIds),
      ),
    );

  return new Map(
    rows.map((row) => [
      row.notificationId,
      {
        readAt: row.readAt,
        dismissedAt: row.dismissedAt,
        createdAt: row.createdAt,
      },
    ]),
  );
};

export const markNotificationsAsRead = async (userId: number, ids: string[]) => {
  if (ids.length === 0) {
    return 0;
  }

  const now = new Date();

  const result = await db
    .insert(notificationStates)
    .values(
      ids.map((id) => ({
        userId,
        notificationId: id,
        readAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: [notificationStates.userId, notificationStates.notificationId],
      set: {
        readAt: now,
        dismissedAt: null,
      },
    })
    .returning({ id: notificationStates.id });

  return result.length;
};

export const clearReadNotifications = async (userId: number, ids?: string[]) => {
  const whereBase = and(
    eq(notificationStates.userId, userId),
    isNotNull(notificationStates.readAt),
  );

  const whereClause =
    ids && ids.length > 0
      ? and(
          whereBase,
          inArray(notificationStates.notificationId, ids),
        )
      : whereBase;

  const result = await db
    .update(notificationStates)
    .set({
      dismissedAt: new Date(),
    })
    .where(whereClause)
    .returning({ id: notificationStates.id });

  return result.length;
};
