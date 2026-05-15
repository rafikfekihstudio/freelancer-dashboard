"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"

export function FilterBar({ workTypes }: { workTypes: string[] }) {
  const router = useRouter()
  const sp = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      const q = next.get("q")
      if (q === "") next.delete("q")
      router.push(`?${next.toString()}`)
    },
    [router, sp]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        defaultValue={sp.get("payment") ?? ""}
        onChange={(e) => setParam("payment", e.target.value)}
        className="border rounded px-2 py-1.5 text-xs bg-background"
      >
        <option value="">All payments</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>

      <select
        defaultValue={sp.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="border rounded px-2 py-1.5 text-xs bg-background"
      >
        <option value="">All statuses</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select
        defaultValue={sp.get("type") ?? ""}
        onChange={(e) => setParam("type", e.target.value)}
        className="border rounded px-2 py-1.5 text-xs bg-background"
      >
        <option value="">All types</option>
        {workTypes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <input
        type="date"
        defaultValue={sp.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value)}
        className="border rounded px-2 py-1.5 text-xs bg-background"
        title="From date"
      />

      <input
        type="date"
        defaultValue={sp.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value)}
        className="border rounded px-2 py-1.5 text-xs bg-background"
        title="To date"
      />

      {(sp.get("payment") || sp.get("status") || sp.get("type") || sp.get("from") || sp.get("to")) && (
        <button
          onClick={() => {
            const next = new URLSearchParams()
            const q = sp.get("q")
            if (q) next.set("q", q)
            router.push(`?${next.toString()}`)
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
