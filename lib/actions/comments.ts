"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { comments, workEntries } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { createNotification } from "./notifications"

export async function createCommentAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const parsed = z.object({
    workEntryId: z.coerce.number(),
    content: z.string().min(1),
  }).safeParse({
    workEntryId: formData.get("workEntryId"),
    content: formData.get("content"),
  })

  if (!parsed.success) return { error: "Invalid input" }

  await db.insert(comments).values({
    workEntryId: parsed.data.workEntryId,
    userId: Number(session.user.id),
    content: parsed.data.content,
  }).run()

  const entry = await db.select({ hirerId: workEntries.hirerId, retoucherId: workEntries.retoucherId, title: workEntries.title })
    .from(workEntries)
    .where(eq(workEntries.id, parsed.data.workEntryId))
    .get()

  const uid = Number(session.user.id)
  const targetId = entry?.hirerId === uid ? entry?.retoucherId : entry?.hirerId
  if (targetId) {
    await createNotification({
      userId: targetId,
      message: `${session.user.name} commented on "${entry?.title ?? "work entry"}"`,
      link: `/${session.user.role === "hirer" ? "retoucher" : "hirer"}/works/${parsed.data.workEntryId}`,
    })
  }

  const role = session.user.role
  revalidatePath(`/${role}/works/${parsed.data.workEntryId}`)
  return null
}
