"use client"

import { useState } from "react"

export function WorkHoverCard({
  children,
  imageSrc,
  editingType,
  expectedDelivery,
}: {
  children: React.ReactNode
  imageSrc?: string | null
  editingType: string
  expectedDelivery: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-0 top-full mt-1 z-50 flex gap-3 rounded-lg border bg-card p-3 shadow-lg w-64">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-16 w-16 rounded object-cover shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded bg-muted shrink-0" />
          )}
          <div className="space-y-1 text-xs">
            <p><span className="text-muted-foreground">Type:</span> {editingType}</p>
            <p><span className="text-muted-foreground">Delivery:</span> {expectedDelivery}</p>
          </div>
        </div>
      )}
    </div>
  )
}
