import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createNotification } from "@/lib/actions/notifications"
import { ensureWorkType } from "@/lib/actions/work-types"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { folder, editingType } = await req.json()
  if (!folder || !editingType || typeof editingType !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const allowed = session.user.role === "retoucher" || session.user.role === "admin"
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await ensureWorkType(editingType)

  await db.update(workEntries)
    .set({ editingType, updatedAt: new Date().toISOString() })
    .where(and(eq(workEntries.folder, folder), eq(workEntries.retoucherId, uid)))
    .run()

  const first = await db.select()
    .from(workEntries)
    .where(and(eq(workEntries.folder, folder), eq(workEntries.retoucherId, uid)))
    .get()

  if (first?.hirerId) {
    await createNotification({
      userId: first.hirerId,
      message: `${session.user.name} changed all entries in "${folder}" to ${editingType}`,
      link: `/hirer`,
    })
  }

  return NextResponse.json({ ok: true })
}
