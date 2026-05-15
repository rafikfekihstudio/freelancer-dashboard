"use server"

import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { users, workEntries, comments, payments } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { sendWelcomeEmail } from "@/lib/email"

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["retoucher", "hirer"]),
})

export async function createUserAction(
  _prev: { error?: string; success?: boolean; password?: string; emailSent?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; password?: string; emailSent?: boolean } | null> {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .get()

  if (existing) {
    return { error: "Email already in use" }
  }

  const rawPassword = randomBytes(4).toString("hex")
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  await db.insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      password: hashedPassword,
    })
    .run()

  const emailSent = !!process.env.RESEND_API_KEY
  if (emailSent) {
    await sendWelcomeEmail({
      email: parsed.data.email,
      name: parsed.data.name,
      password: rawPassword,
    })
  }

  revalidatePath("/admin/users")
  return { success: true, password: rawPassword, emailSent }
}

export async function deleteUserAction(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const id = Number(formData.get("id"))
  if (!id) throw new Error("Invalid user ID")

  const userEntries = await db
    .select({ id: workEntries.id })
    .from(workEntries)
    .where(eq(workEntries.retoucherId, id))
    .all()

  for (const entry of userEntries) {
    await db.delete(payments).where(eq(payments.workEntryId, entry.id)).run()
    await db.delete(comments).where(eq(comments.workEntryId, entry.id)).run()
    await db.delete(workEntries).where(eq(workEntries.id, entry.id)).run()
  }

  await db.update(workEntries)
    .set({ hirerId: null })
    .where(eq(workEntries.hirerId, id))
    .run()

  await db.delete(comments).where(eq(comments.userId, id)).run()
  await db.delete(users).where(eq(users.id, id)).run()
  revalidatePath("/admin/users")
}

export async function sendResetEmailAction(formData: FormData) {
  const email = formData.get("email") as string
  if (!email) return { error: "Email required" }

  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) return { error: "No user with that email" }

  const newPassword = randomBytes(4).toString("hex")
  const hashed = await bcrypt.hash(newPassword, 10)

  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id)).run()

  await sendWelcomeEmail({
    email: user.email,
    name: user.name,
    password: newPassword,
  })

  return { success: true }
}
