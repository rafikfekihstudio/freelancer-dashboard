import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { siteConfig } from "@/lib/site-config"
import { Avatar } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Finance", href: "/admin/finance" },
  ],
  retoucher: [
    { label: "My Work", href: "/retoucher" },
    { label: "New Entry", href: "/retoucher/new" },
    { label: "Finance", href: "/retoucher/finance" },
  ],
  hirer: [
    { label: "Browse", href: "/hirer" },
  ],
}

export async function Sidebar() {
  const session = await auth()
  if (!session) return null

  const items = navItems[session.user.role] ?? []

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card px-4 py-6">
      <Link href="/" className="mb-8 px-2 text-lg font-semibold">{siteConfig.name}</Link>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1.5 text-sm transition-colors">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t pt-4">
        <Link href="/profile" className="flex items-center gap-2 px-2 mb-1 hover:opacity-80">
          <Avatar url={session.user.image} name={session.user.name} size="sm" />
          <p className="text-xs text-muted-foreground truncate">{session.user.name}</p>
        </Link>
        <ThemeToggle />
        <form action={async () => { "use server"; await signOut() }}>
          <button type="submit" className="hover:bg-accent hover:text-accent-foreground w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors">Sign out</button>
        </form>
      </div>
    </aside>
  )
}
