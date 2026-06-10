import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createNotification } from "@/lib/actions/notifications"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !["in-progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const entry = await db.select().from(workEntries).where(eq(workEntries.id, id)).get()
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed =
    session.user.role === "retoucher" ||
    session.user.role === "admin" ||
    (session.user.role === "hirer" && entry.hirerId === uid)

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(workEntries)
    .set({ status: status as "in-progress" | "completed", updatedAt: new Date().toISOString() })
    .where(eq(workEntries.id, id))
    .run()

  const targetUserId = entry.hirerId === uid ? entry.retoucherId : entry.hirerId
  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      message: `${session.user.name} marked "${entry.title}" as ${status}`,
      link: session.user.role === "hirer" ? `/retoucher/works/${id}` : `/hirer/works/${id}`,
    })
  }

  return NextResponse.json({ ok: true })
}
