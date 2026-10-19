import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, price } = await req.json()
  const num = Number(price)
  if (!id || !Number.isFinite(num) || num < 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const uid = Number(session.user.id)
  const entry = await db.select().from(workEntries).where(eq(workEntries.id, id)).get()
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed =
    session.user.role === "admin" ||
    (session.user.role === "retoucher" && entry.retoucherId === uid) ||
    (session.user.role === "hirer" && entry.hirerId === uid)

  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.update(workEntries)
    .set({ price: num, updatedAt: new Date().toISOString() })
    .where(eq(workEntries.id, id))
    .run()

  return NextResponse.json({ ok: true })
}
