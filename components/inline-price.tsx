"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export function InlinePrice({ entryId, current }: { entryId: number; current: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current.toFixed(2))
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function startEdit() {
    setValue(String(current))
    cancelledRef.current = false
    setEditing(true)
  }

  async function save() {
    if (cancelledRef.current || busy) return
    const price = Number(value)
    if (!Number.isFinite(price) || price < 0 || price === current) {
      cancelledRef.current = true
      setEditing(false)
      return
    }
    cancelledRef.current = true
    setBusy(true)
    await fetch("/api/auth/update-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, price }),
    })
    setBusy(false)
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        disabled={busy}
        title="Click to edit price"
        className={`rounded px-1 -mx-1 hover:bg-muted cursor-pointer text-sm ${busy ? "opacity-50" : ""}`}
      >
        ${current.toFixed(2)}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground">$</span>
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save()
          if (e.key === "Escape") {
            cancelledRef.current = true
            setEditing(false)
          }
        }}
        className="border-input bg-background ring-offset-background w-20 rounded-md border px-2 py-0.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
    </span>
  )
}
