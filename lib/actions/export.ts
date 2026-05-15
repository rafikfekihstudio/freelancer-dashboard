"use server"

import { db } from "@/lib/db"
import { workEntries, payments } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"

export async function exportWorkEntriesCsv() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const uid = Number(session.user.id)
  const isRetoucher = session.user.role === "retoucher"
  const isHirer = session.user.role === "hirer"

  let rows
  if (isRetoucher) {
    rows = await db.select().from(workEntries).where(eq(workEntries.retoucherId, uid)).all()
  } else if (isHirer) {
    rows = await db.select().from(workEntries).where(eq(workEntries.hirerId, uid)).all()
  } else {
    rows = await db.select().from(workEntries).all()
  }

  const headers = ["Title", "File", "Folder", "Type", "Price", "Status", "Payment Status", "Delivery"]
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        csvEscape(r.title),
        csvEscape(r.originalFilename),
        csvEscape(r.folder ?? ""),
        csvEscape(r.editingType),
        r.price.toFixed(2),
        r.status,
        r.paymentStatus,
        r.expectedDelivery,
      ].join(",")
    ),
  ].join("\n")

  return csv
}

export async function exportPaymentsCsv() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const uid = Number(session.user.id)

  let rows
  if (session.user.role === "retoucher") {
    rows = await db
      .select({
        paymentId: payments.id,
        amount: payments.amount,
        paidAt: payments.paidAt,
        notes: payments.notes,
        workTitle: workEntries.title,
      })
      .from(payments)
      .innerJoin(workEntries, eq(payments.workEntryId, workEntries.id))
      .where(eq(workEntries.retoucherId, uid))
      .all()
  } else {
    rows = await db
      .select({
        paymentId: payments.id,
        amount: payments.amount,
        paidAt: payments.paidAt,
        notes: payments.notes,
        workTitle: workEntries.title,
      })
      .from(payments)
      .innerJoin(workEntries, eq(payments.workEntryId, workEntries.id))
      .all()
  }

  const headers = ["Date", "Work", "Amount", "Notes"]
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [csvEscape(r.paidAt), csvEscape(r.workTitle), r.amount.toFixed(2), csvEscape(r.notes ?? "")].join(",")
    ),
  ].join("\n")

  return csv
}

function csvEscape(s: string) {
  return `"${s.replace(/"/g, '""')}"`
}
