"use client"

import { useState } from "react"

export function CsvDownloadButton({
  label,
  fetchCsv,
  filename,
}: {
  label: string
  fetchCsv: () => Promise<string>
  filename: string
}) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    setBusy(true)
    try {
      const csv = await fetchCsv()
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Export failed")
    }
    setBusy(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="border border-input hover:bg-accent inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50"
    >
      {busy ? "..." : label}
    </button>
  )
}
