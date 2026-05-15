import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, payments } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { CsvDownloadButton } from "@/components/csv-download"
import { exportPaymentsCsv } from "@/lib/actions/export"

export default async function RetoucherFinancePage() {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const uid = Number(session.user.id)

  const totals = await db
    .select({
      billed: sql<number>`coalesce(sum(price), 0)`,
      paid: sql<number>`coalesce(sum(amount_paid), 0)`,
    })
    .from(workEntries)
    .where(eq(workEntries.retoucherId, uid))
    .get()

  const billed = Number(totals?.billed ?? 0)
  const collected = Number(totals?.paid ?? 0)
  const outstanding = billed - collected

  const allPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paidAt: payments.paidAt,
      notes: payments.notes,
      workTitle: workEntries.title,
    })
    .from(payments)
    .innerJoin(workEntries, eq(payments.workEntryId, workEntries.id))
    .where(eq(workEntries.retoucherId, uid))
    .orderBy(sql`${payments.paidAt} desc`)
    .all()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Finance</h1>
        <CsvDownloadButton label="Download CSV" fetchCsv={exportPaymentsCsv} filename="payments.csv" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-5">
          <p className="text-xs text-muted-foreground">Total Billed</p>
          <p className="text-2xl font-bold">${billed.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-5">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold">${collected.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-5">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">${outstanding.toFixed(2)}</p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        {allPayments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Work</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{p.paidAt}</td>
                  <td className="px-4 py-3">{p.workTitle}</td>
                  <td className="px-4 py-3">${p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
