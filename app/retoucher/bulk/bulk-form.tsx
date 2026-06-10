"use client"

import { useState } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createBulkWorkAction } from "@/lib/actions/works"
import { ImageIcon } from "lucide-react"

const PREVIEWABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif)$/i

type UserOption = { id: number; name: string; email: string }

type FileEntry = {
  id: string
  file: File
  title: string
  originalFilename: string
  editingType: string
  price: string
  expectedDelivery: string
  preview: string | null
}

export function BulkForm({ hirers, workTypes }: { hirers: UserOption[]; workTypes: string[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createBulkWorkAction, null)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [hirerId, setHirerId] = useState("")
  const [folder, setFolder] = useState("")
  const [privateNotes, setPrivateNotes] = useState("")
  const [batchEditingType, setBatchEditingType] = useState("")
  const [batchPrice, setBatchPrice] = useState("")
  const [batchDelivery, setBatchDelivery] = useState("")
  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push("/retoucher")
      router.refresh()
    }
  }, [state, router])

  function handleFiles(files: FileList) {
    const newEntries: FileEntry[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!IMAGE_EXTENSIONS.test(file.name)) continue
      const dot = file.name.lastIndexOf(".")
      const title = dot > 0 ? file.name.slice(0, dot) : file.name
      newEntries.push({
        id: crypto.randomUUID(),
        file,
        title,
        originalFilename: file.name,
        editingType: "",
        price: "",
        expectedDelivery: "",
        preview: PREVIEWABLE_TYPES.includes(file.type) ? URL.createObjectURL(file) : null,
      })
    }
    setEntries((prev) => [...prev, ...newEntries])
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ""
  }

  function updateEntry(id: string, field: keyof FileEntry, value: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function applyBatch() {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        editingType: batchEditingType || e.editingType,
        price: batchPrice || e.price,
        expectedDelivery: batchDelivery || e.expectedDelivery,
      }))
    )
  }

  function handleSubmit(formData: FormData) {
    formData.set("count", String(entries.length))
    formData.set("hirerId", hirerId)
    formData.set("folder", folder)
    formData.set("privateNotes", privateNotes)
    entries.forEach((entry, i) => {
      formData.append(`image_${i}`, entry.file)
      formData.set(`title_${i}`, entry.title)
      formData.set(`originalFilename_${i}`, entry.originalFilename)
      formData.set(`editingType_${i}`, entry.editingType)
      formData.set(`price_${i}`, entry.price)
      formData.set(`expectedDelivery_${i}`, entry.expectedDelivery)
    })
    action(formData)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* File selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Folder</label>
        <input
          ref={(el) => { if (el) el.setAttribute("webkitdirectory", ""); }}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/tiff,image/bmp,.tiff,.tif,.bmp,.heic,.heif"
          onChange={onChange}
          className="border-input bg-background ring-offset-background file:text-foreground file:bg-transparent file:border-0 file:cursor-pointer flex h-10 w-full rounded-md border px-3 py-2 text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">Select a folder of images to upload in bulk, or select multiple files</p>
      </div>

      {/* Batch fields */}
      {entries.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-semibold">Batch Settings (apply to all)</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs font-medium">Editing Type</label>
              <input
                value={batchEditingType}
                onChange={(e) => setBatchEditingType(e.target.value)}
                list="work-type-list"
                placeholder="shared type"
                className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Price ($)</label>
              <input
                value={batchPrice}
                onChange={(e) => setBatchPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="shared price"
                className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Delivery Date</label>
              <input
                value={batchDelivery}
                onChange={(e) => setBatchDelivery(e.target.value)}
                type="date"
                className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={applyBatch}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium"
              >
                Apply to All
              </button>
            </div>
          </div>
          <datalist id="work-type-list">
            {workTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      )}

      {/* Common fields */}
      {entries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="bulk-hirer" className="text-sm font-medium">Hirer</label>
            <select id="bulk-hirer" value={hirerId} onChange={(e) => setHirerId(e.target.value)} className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm">
              <option value="">No hirer (direct)</option>
              {hirers.map((h) => (
                <option key={h.id} value={h.id}>{h.name} ({h.email})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="bulk-folder" className="text-sm font-medium">Folder</label>
            <input id="bulk-folder" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="e.g. Project Alpha / Batch 1" className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label htmlFor="bulk-notes" className="text-sm font-medium">Private Notes</label>
            <input id="bulk-notes" value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} placeholder="only you see" className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {/* Entries table */}
      {entries.length > 0 && (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-2 text-left font-medium w-12">File</th>
                <th className="px-2 py-2 text-left font-medium">Title</th>
                <th className="px-2 py-2 text-left font-medium">Filename</th>
                <th className="px-2 py-2 text-left font-medium">Type</th>
                <th className="px-2 py-2 text-left font-medium w-20">Price</th>
                <th className="px-2 py-2 text-left font-medium w-32">Delivery</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-2 py-1">
                    {entry.preview ? (
                      <img src={entry.preview} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={entry.title}
                      onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
                      required
                      className="border-input bg-background ring-offset-background flex h-8 w-full rounded border px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={entry.originalFilename}
                      onChange={(e) => updateEntry(entry.id, "originalFilename", e.target.value)}
                      required
                      className="border-input bg-background ring-offset-background flex h-8 w-full rounded border px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={entry.editingType}
                      onChange={(e) => updateEntry(entry.id, "editingType", e.target.value)}
                      list="work-type-list"
                      required
                      className="border-input bg-background ring-offset-background flex h-8 w-full rounded border px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={entry.price}
                      onChange={(e) => updateEntry(entry.id, "price", e.target.value)}
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="border-input bg-background ring-offset-background flex h-8 w-full rounded border px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      value={entry.expectedDelivery}
                      onChange={(e) => updateEntry(entry.id, "expectedDelivery", e.target.value)}
                      type="date"
                      required
                      className="border-input bg-background ring-offset-background flex h-8 w-full rounded border px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                      title="Remove"
                    >x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      {entries.length > 0 && (
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pending ? `Uploading ${entries.length} entries...` : `Upload ${entries.length} Entries`}
        </button>
      )}
    </form>
  )
}
