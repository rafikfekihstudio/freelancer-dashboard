import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, users, payments } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import DashboardShell from "@/components/dashboard-shell"

export default async function AdminFinancePage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const perRetoucher = await db
    .select({
      retoucherId: workEntries.retoucherId,
      retoucherName: users.name,
      totalBilled: sql<number>`coalesce(sum(${workEntries.price}), 0)`,
      totalEntries: sql<number>`count(*)`,
    })
    .from(workEntries)
    .innerJoin(users, eq(workEntries.retoucherId, users.id))
    .groupBy(workEntries.retoucherId)
    .all()

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
    .orderBy(sql`${payments.paidAt} desc`)
    .all()

  return (
    <DashboardShell>
      <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Finance Overview</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Per Retoucher</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Retoucher</th>
                <th className="px-4 py-3 text-left font-medium">Entries</th>
                <th className="px-4 py-3 text-left font-medium">Total Billed</th>
              </tr>
            </thead>
            <tbody>
              {perRetoucher.map((row) => (
                <tr key={row.retoucherId} className="border-b last:border-0">
                  <td className="px-4 py-3">{row.retoucherName}</td>
                  <td className="px-4 py-3">{row.totalEntries}</td>
                  <td className="px-4 py-3">${Number(row.totalBilled).toFixed(2)}</td>
                </tr>
              ))}
              {perRetoucher.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">All Payments</h2>
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
              {allPayments.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </DashboardShell>
  )
}
