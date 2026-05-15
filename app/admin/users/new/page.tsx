import { CreateUserForm } from "./create-user-form"
import DashboardShell from "@/components/dashboard-shell"

export default function NewUserPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
      <h1 className="text-3xl font-semibold">New User</h1>
      <CreateUserForm />
    </div>
    </DashboardShell>
  )
}
