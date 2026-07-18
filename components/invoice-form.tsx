"use client"

import { useState } from "react"

type Props = {
  folder: string
  defaultName: string
  defaultEmail: string
  trigger: React.ReactNode
}

export function InvoiceForm({ folder, defaultName, defaultEmail, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState(defaultName)
  const [clientEmail, setClientEmail] = useState(defaultEmail)
  const [clientCountry, setClientCountry] = useState("")
  const [invoiceRef, setInvoiceRef] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleDownload() {
    if (!clientName.trim()) return
    setSubmitting(true)
    const params = new URLSearchParams({
      folder,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientCountry: clientCountry.trim(),
      ref: invoiceRef.trim(),
    })
    const link = document.createElement("a")
    link.href = `/api/invoice?${params.toString()}`
    link.download = `invoice-${encodeURIComponent(folder)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => {
      setSubmitting(false)
      setOpen(false)
    }, 1000)
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-card border rounded-lg shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Generate Invoice</h2>
            <p className="text-xs text-muted-foreground">Folder: {folder}</p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Client Name *</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client Email</label>
                <input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <input
                  value={clientCountry}
                  onChange={(e) => setClientCountry(e.target.value)}
                  placeholder="e.g. United Arab Emirates"
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Invoice Reference</label>
                <input
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  placeholder="e.g. RF012026"
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={submitting || !clientName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Generating..." : "Generate Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
