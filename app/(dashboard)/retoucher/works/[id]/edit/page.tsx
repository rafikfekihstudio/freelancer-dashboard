import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { listWorkTypes } from "@/lib/actions/work-types"
import { EditWorkForm } from "./edit-work-form"

export default async function EditWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const { id } = await params
  const entry = await db
    .select()
    .from(workEntries)
    .where(eq(workEntries.id, Number(id)))
    .get()

  if (!entry || entry.retoucherId !== Number(session.user.id)) {
    return <p className="text-muted-foreground">Not found.</p>
  }

  const [hirers, types] = await Promise.all([
    await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.role, "hirer"))
      .all(),
    listWorkTypes(),
  ])

  const allTypes = types.map((t) => t.name)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Edit Work Entry</h1>
      <EditWorkForm entry={entry} hirers={hirers} workTypes={allTypes} />
    </div>
  )
}
