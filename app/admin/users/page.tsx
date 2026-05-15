import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { DeleteUserButton } from "@/components/delete-user-button"
import DashboardShell from "@/components/dashboard-shell"

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role !== "admin") redirect("/login")

  const allUsers = await db.select().from(users).all()

  return (
    <DashboardShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Users</h1>
        <Link href="/admin/users/new" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors">
          New User
        </Link>
      </div>
      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  {user.role !== "admin" && (
                    <DeleteUserButton userId={user.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allUsers.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground">No users yet.</p>}
      </div>
    </div>
    </DashboardShell>
  )
}
