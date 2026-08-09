import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  const all = await db.select().from(workEntries).all()

  let count = 0
  for (const entry of all) {
    if (entry.paymentStatus === "paid" && (!entry.amountPaid || entry.amountPaid === 0)) {
      await db.update(workEntries)
        .set({ amountPaid: entry.price })
        .where(eq(workEntries.id, entry.id))
        .run()
      count++
    }
    if (entry.paymentStatus === "partial" && (!entry.amountPaid || entry.amountPaid === 0)) {
      await db.update(workEntries)
        .set({ amountPaid: entry.price / 2 })
        .where(eq(workEntries.id, entry.id))
        .run()
      count++
    }
  }

  return NextResponse.json({ ok: true, updated: count })
}
