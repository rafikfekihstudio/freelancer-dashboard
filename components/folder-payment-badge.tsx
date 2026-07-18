"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

const LABELS: Record<string, { label: string; cls: string }> = {
  paid: { label: "paid", cls: "bg-green-100 text-green-700" },
  partial: { label: "partial", cls: "bg-blue-100 text-blue-700" },
  unpaid: { label: "unpaid", cls: "bg-gray-100 text-gray-700" },
}

export function FolderPaymentBadge({ folder, current }: { folder: string; current: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const cur = LABELS[current] ?? LABELS.unpaid

  async function handleSelect(value: string) {
    if (value === current) return setOpen(false)
    setBusy(true)
    await fetch("/api/auth/folder-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, status: value }),
    })
    setBusy(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={busy}
        className={`rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer border-none ${cur.cls} ${busy ? "opacity-50" : ""}`}
      >
        {cur.label}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 flex flex-col rounded-md border bg-card shadow-lg min-w-[100px]">
          {Object.entries(LABELS).map(([value, opt]) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`rounded-none px-3 py-1.5 text-xs text-left hover:bg-muted ${value === current ? "font-semibold" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
