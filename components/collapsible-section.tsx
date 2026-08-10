"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export function CollapsibleSection({
  title,
  defaultOpen = true,
  actions,
  badge,
  children,
}: {
  title: React.ReactNode
  defaultOpen?: boolean
  actions?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b pb-1 text-left hover:bg-muted/30 -mx-1 px-1 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>{title}</div>
          {badge}
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </button>
      {open && children}
    </section>
  )
}
