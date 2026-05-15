import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role
  if (role === "admin") redirect("/admin")
  if (role === "retoucher") redirect("/retoucher")
  if (role === "hirer") redirect("/hirer")

  redirect("/login")
}
