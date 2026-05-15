"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { uploadImage } from "@/lib/upload"

export async function updateAvatarAction(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string } | null> {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const imageFile = formData.get("avatar") as File | null
  if (!imageFile || imageFile.size === 0) return { error: "No image" }

  const avatarUrl = await uploadImage(imageFile)

  await db.update(users)
    .set({ avatarUrl })
    .where(eq(users.id, Number(session.user.id)))
    .run()

  revalidatePath("/")
  return { ok: true }
}
