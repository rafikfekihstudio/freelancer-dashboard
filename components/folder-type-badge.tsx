"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export function FolderTypeBadge({ folder, currentType, allTypes }: { folder: string; currentType: string; allTypes: string[] }) {
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

  async function handleSelect(value: string) {
    if (value === currentType) return setOpen(false)
    setBusy(true)
    await fetch("/api/auth/folder-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, editingType: value }),
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
        className={`rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer border bg-purple-100 text-purple-700 ${busy ? "opacity-50" : ""}`}
      >
        {currentType}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 flex flex-col rounded-md border bg-card shadow-lg min-w-[140px] max-h-[240px] overflow-y-auto">
          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => handleSelect(t)}
              className={`rounded-none px-3 py-1.5 text-xs text-left hover:bg-muted ${t === currentType ? "font-semibold" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
