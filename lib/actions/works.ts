"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { workEntries, payments, comments, users, folderNotes } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { uploadImage } from "@/lib/upload"
import { ensureWorkType } from "./work-types"
import { createNotification } from "./notifications"

const createSchema = z.object({
  title: z.string().min(1),
  originalFilename: z.string().min(1),
  editingType: z.string().min(1),
  price: z.coerce.number().min(0),
  hirerId: z.coerce.number().optional(),
  folder: z.string().optional(),
  privateNotes: z.string().optional(),
  expectedDelivery: z.string().min(1),
})

export async function createWorkAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean } | null> {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") {
    return { error: "Unauthorized" }
  }

  const raw: Record<string, unknown> = {
    title: formData.get("title"),
    originalFilename: formData.get("originalFilename"),
    editingType: formData.get("editingType"),
    price: formData.get("price"),
    expectedDelivery: formData.get("expectedDelivery"),
  }

  const hirerId = formData.get("hirerId")
  if (hirerId)   raw.hirerId = hirerId
  const folder = formData.get("folder")
  if (folder) raw.folder = folder
  const privateNotes = formData.get("privateNotes")
  if (privateNotes) raw.privateNotes = privateNotes

  const parsed = createSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  let imagePath: string | null = null
  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadImage(imageFile)
  }

  ensureWorkType(parsed.data.editingType)

  await db.insert(workEntries)
    .values({
      ...parsed.data,
      retoucherId: Number(session.user.id),
      imagePath,
    })
    .run()

  if (parsed.data.hirerId) {
    await createNotification({
      userId: parsed.data.hirerId,
      message: `${session.user.name} assigned "${parsed.data.title}" to you`,
      link: `/hirer`,
    })
  }

  revalidatePath("/retoucher")
  return { ok: true }
}

export async function updateWorkAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean } | null> {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") {
    return { error: "Unauthorized" }
  }

  const id = Number(formData.get("id"))
  if (!id) return { error: "Invalid id" }

  const entry = await db
    .select()
    .from(workEntries)
    .where(eq(workEntries.id, id))
    .get()

  if (!entry || entry.retoucherId !== Number(session.user.id)) {
    return { error: "Not found" }
  }

  const title = formData.get("title") as string
  const originalFilename = formData.get("originalFilename") as string
  const editingType = formData.get("editingType") as string
  const price = formData.get("price") as string
  const expectedDelivery = formData.get("expectedDelivery") as string
  const hirerId = formData.get("hirerId") as string
  const folder = formData.get("folder") as string
  const privateNotes = formData.get("privateNotes") as string

  let imagePath = entry.imagePath
  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    imagePath = await uploadImage(imageFile)
  }

  if (editingType) ensureWorkType(editingType)

  await db.update(workEntries)
    .set({
      title: title || entry.title,
      originalFilename: originalFilename || entry.originalFilename,
      editingType: editingType || entry.editingType,
      price: price ? Number(price) : entry.price,
      expectedDelivery: expectedDelivery || entry.expectedDelivery,
      hirerId: hirerId ? Number(hirerId) : entry.hirerId,
      folder: folder || entry.folder,
      privateNotes: privateNotes || entry.privateNotes,
      imagePath,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(workEntries.id, id))
    .run()

  const targetHirer = hirerId ? Number(hirerId) : entry.hirerId
  if (targetHirer) {
    await createNotification({
      userId: targetHirer,
      message: `${session.user.name} updated "${title || entry.title}"`,
      link: `/hirer`,
    })
  }

  revalidatePath("/retoucher")
  revalidatePath(`/retoucher/works/${id}`)
  return { ok: true }
}

export async function deleteWorkAction(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const id = Number(formData.get("id"))
  if (!id) throw new Error("Invalid id")

  const entry = await db.select().from(workEntries).where(eq(workEntries.id, id)).get()
  if (!entry) throw new Error("Not found")

  const uid = Number(session.user.id)
  const allowed =
    session.user.role === "admin" ||
    (session.user.role === "retoucher" && entry.retoucherId === uid) ||
    (session.user.role === "hirer" && entry.hirerId === uid)

  if (!allowed) throw new Error("Unauthorized")

  if (entry.hirerId && entry.createdAt) {
    const created = new Date(entry.createdAt).getTime()
    const now = Date.now()
    const fiveMin = 5 * 60 * 1000
    if (now - created > fiveMin) {
      const retoucher = await db.select().from(users).where(eq(users.id, entry.retoucherId)).get()
      await createNotification({
        userId: entry.hirerId,
        message: `${retoucher?.name ?? "A retoucher"} removed "${entry.title}"`,
        link: `/hirer`,
      })
    }
  }

  await db.delete(payments).where(eq(payments.workEntryId, id)).run()
  await db.delete(comments).where(eq(comments.workEntryId, id)).run()
  await db.delete(workEntries).where(eq(workEntries.id, id)).run()

  revalidatePath("/retoucher")
  revalidatePath("/hirer")
  revalidatePath("/admin")
}

export async function updateWorkStatusAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const id = Number(formData.get("id"))
  const status = formData.get("status") as string

  if (!id || !["in-progress", "completed"].includes(status)) {
    return { error: "Invalid input" }
  }

  const entry = await db.select().from(workEntries).where(eq(workEntries.id, id)).get()
  if (!entry) return { error: "Not found" }

  const uid = Number(session.user.id)
  const allowed =
    session.user.role === "retoucher" ||
    session.user.role === "admin" ||
    (session.user.role === "hirer" && entry.hirerId === uid)

  if (!allowed) return { error: "Unauthorized" }

  await db.update(workEntries)
    .set({ status: status as "in-progress" | "completed", updatedAt: new Date().toISOString() })
    .where(eq(workEntries.id, id))
    .run()

  const changerName = session.user.name
  const targetUserId = entry.hirerId === uid ? entry.retoucherId : entry.hirerId
  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      message: `${changerName} marked "${entry.title}" as ${status}`,
      link: `/hirer/works/${id}`,
    })
  }

  revalidatePath(`/retoucher/works/${id}`)
  revalidatePath(`/hirer/works/${id}`)
  return null
}

export async function upsertFolderNoteAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "hirer") return { error: "Unauthorized" }

  const folder = formData.get("folder") as string
  const content = (formData.get("content") as string)?.trim()

  if (!folder || !content) {
    const existing = await db
      .select()
      .from(folderNotes)
      .where(and(eq(folderNotes.folder, folder), eq(folderNotes.userId, Number(session.user.id))))
      .get()
    if (existing && !content) {
      await db.delete(folderNotes)
        .where(eq(folderNotes.id, existing.id))
        .run()
    }
    revalidatePath("/hirer")
    revalidatePath("/retoucher")
    return { ok: true }
  }

  const existing = await db
    .select()
    .from(folderNotes)
    .where(and(eq(folderNotes.folder, folder), eq(folderNotes.userId, Number(session.user.id))))
    .get()

  if (existing) {
    await     await db.update(folderNotes)
      .set({ content, updatedAt: new Date().toISOString() })
      .where(eq(folderNotes.id, existing.id))
      .run()
  } else {
    await db.insert(folderNotes)
      .values({ folder, userId: Number(session.user.id), content })
      .run()
  }

  revalidatePath("/hirer")
  revalidatePath("/retoucher")
  return { ok: true }
}
