import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, workEntries, payments } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const userCount = (await db.select().from(users).all()).length
  const entryCount = (await db.select().from(workEntries).all()).length
  const totalBilled = (await db
    .select({ total: sql<number>`coalesce(sum(price), 0)` })
    .from(workEntries)
    .get())?.total ?? 0
  const totalPaid = (await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(payments)
    .get())?.total ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <p className="text-2xl font-bold">{userCount}</p>
          <p className="text-sm text-muted-foreground">Users</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-2xl font-bold">{entryCount}</p>
          <p className="text-sm text-muted-foreground">Work Entries</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-2xl font-bold">${totalBilled.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Billed</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total Collected</p>
        </div>
      </div>
    </div>
  )
}
