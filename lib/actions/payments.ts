"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { payments, workEntries } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, sql } from "drizzle-orm"
import { createNotification } from "./notifications"

const createPaymentSchema = z.object({
  workEntryId: z.coerce.number(),
  amount: z.coerce.number().min(0.01),
  paidAt: z.string().min(1),
  notes: z.string().optional(),
})

export async function recordPaymentAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") {
    return { error: "Unauthorized" }
  }

  const parsed = createPaymentSchema.safeParse({
    workEntryId: formData.get("workEntryId"),
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes") || undefined,
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  const entry = await db
    .select()
    .from(workEntries)
    .where(eq(workEntries.id, parsed.data.workEntryId))
    .get()

  if (!entry || entry.retoucherId !== Number(session.user.id)) {
    return { error: "Not found" }
  }

  await db.insert(payments)
    .values({
      workEntryId: parsed.data.workEntryId,
      amount: parsed.data.amount,
      paidAt: parsed.data.paidAt,
      notes: parsed.data.notes,
    })
    .run()

  const totalPaid = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(payments)
    .where(eq(payments.workEntryId, parsed.data.workEntryId))
    .get()

  const total = totalPaid?.total ?? 0
  const paymentStatus = total >= entry.price ? "paid" : total > 0 ? "partial" : "unpaid"

  await db.update(workEntries)
    .set({ amountPaid: total, paymentStatus })
    .where(eq(workEntries.id, parsed.data.workEntryId))
    .run()

  if (entry.hirerId) {
    await createNotification({
      userId: entry.hirerId,
      message: `${session.user.name} recorded a $${parsed.data.amount.toFixed(2)} payment for "${entry.title}" (${paymentStatus})`,
      link: `/hirer`,
    })
  }

  revalidatePath("/retoucher")
  revalidatePath(`/retoucher/works/${parsed.data.workEntryId}`)
  revalidatePath("/retoucher/finance")
  return null
}
