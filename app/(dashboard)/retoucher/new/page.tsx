import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { listWorkTypes, distinctEditingTypes } from "@/lib/actions/work-types"
import { WorkForm } from "./work-form"

export default async function NewWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const { folder } = await searchParams

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
      <h1 className="text-3xl font-semibold">New Work Entry</h1>
      <WorkForm hirers={hirers} workTypes={allTypes} defaultFolder={folder} />
    </div>
  )
}
