import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { listWorkTypes } from "@/lib/actions/work-types"
import { BulkForm } from "./bulk-form"
import DashboardShell from "@/components/dashboard-shell"

export default async function BulkUploadPage() {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const [hirers, types] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.role, "hirer"))
      .all(),
    listWorkTypes(),
  ])

  const allTypes = types.map((t) => t.name)

  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Bulk Upload</h1>
        <BulkForm hirers={hirers} workTypes={allTypes} />
      </div>
    </DashboardShell>
  )
}
