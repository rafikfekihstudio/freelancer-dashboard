import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { AvatarForm } from "./avatar-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const { user } = session

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-semibold">Profile</h1>

      <div className="flex items-center gap-4">
        <Avatar url={user.image} name={user.name} size="lg" />
        <div>
          <p className="font-medium text-lg">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Change Avatar</h2>
        <AvatarForm />
      </div>
    </div>
  )
}
