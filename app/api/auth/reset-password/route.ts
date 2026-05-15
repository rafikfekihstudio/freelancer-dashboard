import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
  const form = await req.formData()
  const email = form.get("email") as string
  if (!email) return NextResponse.json({ error: "Email required" })

  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) return NextResponse.json({ error: "No user with that email" })

  const newPassword = randomBytes(4).toString("hex")
  const hashed = await bcrypt.hash(newPassword, 10)

  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id)).run()

  await sendWelcomeEmail({
    email: user.email,
    name: user.name,
    password: newPassword,
  })

  return NextResponse.json({ success: true })
}
