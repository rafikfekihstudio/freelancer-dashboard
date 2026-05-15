import { CreateUserForm } from "./create-user-form"

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">New User</h1>
      <CreateUserForm />
    </div>
  )
}
