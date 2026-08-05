import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createNotification } from "@/lib/actions/notifications"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { folder, status } = await req.json()
  if (!folder || !["in-progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const allowed = session.user.role === "retoucher" || session.user.role === "admin"
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(workEntries)
    .set({ status: status as "in-progress" | "completed", updatedAt: new Date().toISOString() })
    .where(and(eq(workEntries.folder, folder), eq(workEntries.retoucherId, uid)))
    .run()

  const first = await db.select()
    .from(workEntries)
    .where(and(eq(workEntries.folder, folder), eq(workEntries.retoucherId, uid)))
    .get()

  if (first?.hirerId) {
    await createNotification({
      userId: first.hirerId,
      message: `${session.user.name} marked all entries in "${folder}" as ${status}`,
      link: `/hirer`,
    })
  }

  return NextResponse.json({ ok: true })
}
