"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, sql } from "drizzle-orm"

export async function createNotification({
  userId,
  message,
  link,
}: {
  userId: number
  message: string
  link?: string
}) {
  await db.insert(notifications).values({ userId, message, link: link ?? null }).run()
}

export async function markNotificationsReadAction() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, Number(session.user.id)))
    .run()

  revalidatePath("/")
}

export async function getUnreadCount(userId: number): Promise<number> {
  const r = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
    .get()
  return r?.count ?? 0
}
