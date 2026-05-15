"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function markNotificationsReadAction() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, Number(session.user.id)))
    .run()

  revalidatePath("/")
}
