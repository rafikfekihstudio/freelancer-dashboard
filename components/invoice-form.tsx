"use client"

import { useState } from "react"

type Props = {
  folder: string
  defaultName: string
  defaultEmail: string
  images: { id: number; src: string | null; label: string }[]
  trigger: React.ReactNode
}

export function InvoiceForm({ folder, defaultName, defaultEmail, images, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [clientName, setClientName] = useState(defaultName)
  const [clientCompany, setClientCompany] = useState("")
  const [clientEmail, setClientEmail] = useState(defaultEmail)
  const [clientCountry, setClientCountry] = useState("")
  const [invoiceRef, setInvoiceRef] = useState("")
  const [selectedImage, setSelectedImage] = useState<string>(images.find((i) => i.src)?.src ?? "")
  const [discount, setDiscount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleDownload() {
    if (!clientName.trim()) return
    setSubmitting(true)
    const params = new URLSearchParams({
      folder,
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim(),
      clientEmail: clientEmail.trim(),
      clientCountry: clientCountry.trim(),
      ref: invoiceRef.trim(),
      image: selectedImage,
      discount: discount.trim(),
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
          <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                <label className="text-sm font-medium">Company Name</label>
                <input
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g. frmlabstudio"
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
              <div>
                <label className="text-sm font-medium">Discount ($)</label>
                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
            </div>

            {/* Image selection */}
            {images.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Image</label>
                <div className="flex gap-2 flex-wrap">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => img.src && setSelectedImage(img.src)}
                      className={`relative rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === img.src ? "border-primary" : "border-transparent hover:border-muted"
                      }`}
                    >
                      {img.src ? (
                        <img src={img.src} alt={img.label} className="h-16 w-16 object-cover" />
                      ) : (
                        <div className="h-16 w-16 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
