"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

type NotificationItem = {
  id: number
  message: string
  link: string | null
  read: boolean
  createdAt: string | null
}

export function NotificationBell({
  initialUnread,
  notifications: initial,
}: {
  initialUnread: number
  notifications: NotificationItem[]
}) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(initialUnread)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function markAllRead() {
    await fetch("/api/auth/mark-notifications-read", { method: "POST" })
    setUnread(0)
    setOpen(false)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-md hover:bg-accent transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-muted-foreground hover:text-foreground underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {initial.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              initial.map((n) => (
                <div
                  key={n.id}
                  className={`border-b last:border-0 px-3 py-2 text-xs ${!n.read ? "bg-muted/30 font-medium" : ""}`}
                >
                  {n.link ? (
                    <a href={n.link} className="hover:underline block">
                      {n.message}
                      <span className="block text-[10px] text-muted-foreground mt-0.5">{n.createdAt ? new Date(n.createdAt + "Z").toLocaleDateString() : ""}</span>
                    </a>
                  ) : (
                    <>
                      {n.message}
                      <span className="block text-[10px] text-muted-foreground mt-0.5">{n.createdAt ? new Date(n.createdAt + "Z").toLocaleDateString() : ""}</span>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
