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
  if (!id || !["unpaid", "partial", "paid"].includes(status)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const entry = await db.select().from(workEntries).where(eq(workEntries.id, id)).get()
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed = session.user.role === "retoucher" || session.user.role === "admin"
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(workEntries)
    .set({ paymentStatus: status, updatedAt: new Date().toISOString() })
    .where(eq(workEntries.id, id))
    .run()

  if (entry.hirerId) {
    await createNotification({
      userId: entry.hirerId,
      message: `${session.user.name} updated payment status of "${entry.title}" to ${status}`,
      link: `/hirer/works/${id}`,
    })
  }

  return NextResponse.json({ ok: true })
}
