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

type FolderDetails = {
  thumbnail: string
  notes: string
}

type Props = {
  folders: FolderData[]
  trigger: React.ReactNode
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function MultiInvoiceForm({ folders, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [folderDetails, setFolderDetails] = useState<Record<string, FolderDetails>>({})
  const [folderLabels, setFolderLabels] = useState<Record<string, string>>({})
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null)
  const [clientName, setClientName] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientCountry, setClientCountry] = useState("")
  const [invoiceRef, setInvoiceRef] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [globalDiscount, setGlobalDiscount] = useState("")
  const [showBankDetails, setShowBankDetails] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const selectedFolderData = useMemo(() => {
    return folders.filter((f) => selectedFolders.includes(f.name))
  }, [folders, selectedFolders])

  const total = useMemo(() => {
    return selectedFolderData.reduce((s, f) => s + f.entries.reduce((s2, e) => s2 + e.price, 0), 0)
  }, [selectedFolderData])

  function toggleFolder(name: string) {
    setSelectedFolders((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    )
  }

  function selectAll() {
    setSelectedFolders(folders.map((f) => f.name))
  }

  function updateFolderDetail(name: string, key: keyof FolderDetails, value: string) {
    setFolderDetails((prev) => ({
      ...prev,
      [name]: { ...prev[name], [key]: value },
    }))
  }

  function handleDownload() {
    if (!clientName.trim() || selectedFolders.length === 0) return
    setSubmitting(true)

    const folderPayload = selectedFolders.map((name) => {
      const detail = folderDetails[name] ?? { thumbnail: "", notes: "" }
      return {
        name,
        label: (folderLabels[name] || "").trim() || name,
        thumbnail: detail.thumbnail,
        notes: detail.notes,
      }
    })

    const params = new URLSearchParams({
      folders: JSON.stringify(folderPayload),
      clientName: clientName.trim(),
      clientCompany: clientCompany.trim(),
      clientEmail: clientEmail.trim(),
      clientCountry: clientCountry.trim(),
      ref: invoiceRef.trim(),
      date: invoiceDate,
      discount: globalDiscount.trim(),
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
          <div className="bg-card border rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Generate Invoice</h2>
            <p className="text-xs text-muted-foreground">
              {selectedFolders.length} folder{selectedFolders.length !== 1 && "s"} selected &middot; {selectedFolderData.reduce((s, f) => s + f.entries.length, 0)} files &middot; ${total.toFixed(2)}
            </p>

            {/* Folder selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Folders</label>
                <button type="button" onClick={selectAll} className="text-xs text-muted-foreground hover:text-foreground underline">Select all</button>
              </div>
              <div className="space-y-1">
                {folders.map((f) => {
                  const isSelected = selectedFolders.includes(f.name)
                  const isExpanded = expandedFolder === f.name
                  const detail = folderDetails[f.name] ?? { thumbnail: "", notes: "" }
                  const folderTotal = f.entries.reduce((s, e) => s + e.price, 0)
                  return (
                    <div key={f.name} className="border rounded-md overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer" onClick={() => { toggleFolder(f.name); if (!isSelected) setExpandedFolder(f.name) }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFolder(f.name)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 rounded"
                        />
                        <span className="flex-1 text-sm truncate">{folderLabels[f.name] || f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.entries.length} files</span>
                        <span className="text-xs text-muted-foreground">${folderTotal.toFixed(2)}</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedFolder(isExpanded ? null : f.name) }}
                            className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
                          >
                            {isExpanded ? "Less" : "Details"}
                          </button>
                        )}
                      </div>
                      {isSelected && isExpanded && (
                        <div className="border-t px-3 py-3 space-y-3 bg-muted/20">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name on invoice</label>
                            <input
                              value={folderLabels[f.name] ?? f.name}
                              onChange={(e) => setFolderLabels((prev) => ({ ...prev, [f.name]: e.target.value }))}
                              placeholder={f.name}
                              className="border-input bg-background ring-offset-background flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail</label>
                            <div className="flex gap-2 flex-wrap">
                              {f.entries.map((img) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => updateFolderDetail(f.name, "thumbnail", img.src ?? "")}
                                  className={`relative rounded-md overflow-hidden border-2 transition-colors ${
                                    detail.thumbnail === img.src ? "border-primary" : "border-transparent hover:border-muted"
                                  }`}
                                >
                                  {img.src ? (
                                    <img src={img.src} alt={img.label} className="h-14 w-14 object-cover" />
                                  ) : (
                                    <div className="h-14 w-14 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes / Description</label>
                            <textarea
                              value={detail.notes}
                              onChange={(e) => updateFolderDetail(f.name, "notes", e.target.value)}
                              placeholder="e.g. Background removal, 53 images, special retouching..."
                              rows={2}
                              className="border-input bg-background ring-offset-background flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none resize-none"
                            />
                          </div>
                          {/* File list summary */}
                          <div className="text-xs text-muted-foreground">
                            {f.entries.map((e, i) => (
                              <div key={e.id} className="flex justify-between">
                                <span className="truncate max-w-[200px]">{e.label}</span>
                                <span>${e.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-sm font-medium">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Discount ($)</label>
                  <input
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  />
                </div>
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
