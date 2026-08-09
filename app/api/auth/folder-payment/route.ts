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
  if (!folder || !["unpaid", "partial", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const allowed = session.user.role === "retoucher" || session.user.role === "admin"
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const folderEntries = await db.select()
    .from(workEntries)
    .where(and(eq(workEntries.folder, folder), eq(workEntries.retoucherId, uid)))
    .all()

  for (const entry of folderEntries) {
    await db.update(workEntries)
      .set({
        paymentStatus: status,
        amountPaid: status === "paid" ? entry.price : status === "unpaid" ? 0 : entry.price / 2,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(workEntries.id, entry.id))
      .run()
  }

  if (folderEntries[0]?.hirerId) {
    await createNotification({
      userId: folderEntries[0].hirerId,
      message: `${session.user.name} marked all entries in "${folder}" as ${status}`,
      link: `/hirer`,
    })
  }

  return NextResponse.json({ ok: true })
}
