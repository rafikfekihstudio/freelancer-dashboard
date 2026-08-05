"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export function FolderTypeBadge({ folder, currentType, allTypes }: { folder: string; currentType: string; allTypes: string[] }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newType, setNewType] = useState("")
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function apply(value: string) {
    if (!value.trim() || value === currentType) return setOpen(false)
    setBusy(true)
    await fetch("/api/auth/folder-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, editingType: value.trim() }),
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
        <div className="absolute right-0 top-full z-50 flex flex-col rounded-md border bg-card shadow-lg min-w-[160px] max-h-[260px] overflow-y-auto">
          <div className="border-b px-2 py-1.5">
            <input
              ref={inputRef}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newType.trim()) apply(newType)
                if (e.key === "Escape") setOpen(false)
              }}
              placeholder="New type..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          {allTypes.map((t) => (
            <button
              key={t}
              onClick={() => apply(t)}
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
