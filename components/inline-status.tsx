"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type Option = { label: string; value: string; cls: string }

export function InlineStatus({
  entryId,
  current,
  options,
}: {
  entryId: number
  current: string
  options: Option[]
}) {
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

  const currentOpt = options.find((o) => o.value === current)
  const cls = currentOpt?.cls ?? "bg-gray-100 text-gray-700"

  async function handleSelect(value: string) {
    if (value === current) return setOpen(false)
    setBusy(true)
    const isWork = options.some((o) => ["in-progress", "completed"].includes(o.value))
    const action = isWork ? "/api/auth/update-work-status" : "/api/auth/update-payment-status"
    await fetch(action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, status: value }),
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
        className={`rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer border-none ${cls} ${busy ? "opacity-50" : ""}`}
      >
        {current}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 flex flex-col rounded-md border bg-card shadow-lg min-w-[100px]">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => handleSelect(o.value)}
              className={`rounded-none px-3 py-1.5 text-xs text-left hover:bg-muted ${o.value === current ? "font-semibold" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
