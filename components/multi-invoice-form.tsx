"use client"

import { useState, useMemo } from "react"

type FolderEntry = {
  id: number
  src: string | null
  label: string
  price: number
}

type FolderData = {
  name: string
  entries: FolderEntry[]
}

type Props = {
  folders: FolderData[]
  trigger: React.ReactNode
}

export function MultiInvoiceForm({ folders, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [clientName, setClientName] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCountry, setClientCountry] = useState("")
  const [invoiceRef, setInvoiceRef] = useState("")
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [discount, setDiscount] = useState("")
  const [showBankDetails, setShowBankDetails] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const allImages = useMemo(() => {
    return folders
      .filter((f) => selectedFolders.includes(f.name))
      .flatMap((f) => f.entries)
  }, [folders, selectedFolders])

  const total = useMemo(() => {
    return allImages.reduce((s, e) => s + e.price, 0)
  }, [allImages])

  function toggleFolder(name: string) {
    setSelectedFolders((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    )
  }

  function selectAll() {
    setSelectedFolders(folders.map((f) => f.name))
  }

  function handleDownload() {
    if (!clientName.trim() || selectedFolders.length === 0) return
    setSubmitting(true)
    const params = new URLSearchParams({
      folders: selectedFolders.join(","),
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim(),
      clientEmail: clientEmail.trim(),
      clientCountry: clientCountry.trim(),
      ref: invoiceRef.trim(),
      image: selectedImage,
      discount: discount.trim(),
      showBank: String(showBankDetails),
    })
    const link = document.createElement("a")
    link.href = `/api/invoice?${params.toString()}`
    link.download = `invoice-${selectedFolders.length > 1 ? "combined" : selectedFolders[0]}.pdf`
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
            <p className="text-xs text-muted-foreground">Select folders to include ({selectedFolders.length} selected, {allImages.length} files, ${total.toFixed(2)})</p>

            {/* Folder selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Folders</label>
                <button type="button" onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground underline">Select all</button>
              </div>
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {folders.map((f) => (
                  <label key={f.name} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted cursor-pointer border-b last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedFolders.includes(f.name)}
                      onChange={() => toggleFolder(f.name)}
                      className="h-3.5 w-3.5 rounded"
                    />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.entries.length} files</span>
                    <span className="text-xs text-muted-foreground">${f.entries.reduce((s, e) => s + e.price, 0).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showBankDetails"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="showBankDetails" className="text-sm font-medium">Include bank details</label>
              </div>
            </div>

            {/* Image selection */}
            {allImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Image</label>
                <div className="flex gap-2 flex-wrap">
                  {allImages.map((img) => (
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
                disabled={submitting || !clientName.trim() || selectedFolders.length === 0}
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
