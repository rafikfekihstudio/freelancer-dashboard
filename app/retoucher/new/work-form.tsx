"use client"

import { useState, useRef, type DragEvent, type ChangeEvent } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ImageIcon } from "lucide-react"
import { createWorkAction } from "@/lib/actions/works"

const PREVIEWABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif)$/i

type UserOption = { id: number; name: string; email: string }

export function WorkForm({ hirers, workTypes, defaultFolder }: { hirers: UserOption[]; workTypes: string[]; defaultFolder?: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createWorkAction, null)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const filenameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push("/retoucher")
      router.refresh()
    }
  }, [state, router])

  function handleFile(file: File) {
    if (!IMAGE_EXTENSIONS.test(file.name)) return
    const dot = file.name.lastIndexOf(".")
    const nameWithoutExt = dot > 0 ? file.name.slice(0, dot) : file.name
    if (titleInputRef.current) titleInputRef.current.value = nameWithoutExt
    if (filenameInputRef.current) filenameInputRef.current.value = file.name
    setFileName(file.name)
    if (PREVIEWABLE_TYPES.includes(file.type)) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
    const dt = new DataTransfer()
    dt.items.add(file)
    if (fileInputRef.current) fileInputRef.current.files = dt.files
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDragLeave() {
    setDragOver(false)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Image</label>
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 max-w-full rounded object-contain" />
          ) : fileName ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <span className="text-xs">{fileName}</span>
              <p className="text-xs">Preview not available (will be converted server-side)</p>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium">Drop an image here</p>
              <p className="mt-1 text-xs">or click to browse</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/tiff,image/bmp,.tiff,.tif,.bmp,.heic,.heif"
          onChange={onChange}
          className="hidden"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input ref={titleInputRef} id="title" name="title" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="originalFilename" className="text-sm font-medium">Original Filename</label>
        <input ref={filenameInputRef} id="originalFilename" name="originalFilename" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="editingType" className="text-sm font-medium">Editing Type</label>
        <input id="editingType" name="editingType" list="work-type-list" required placeholder="e.g. color grading" className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
        <datalist id="work-type-list">
          {workTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
        <input id="price" name="price" type="number" step="0.01" min="0" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="folder" className="text-sm font-medium">Folder</label>
        <input id="folder" name="folder" defaultValue={defaultFolder ?? ""} placeholder="e.g. Project Alpha / Batch 1" className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="hirerId" className="text-sm font-medium">Hirer</label>
        <select id="hirerId" name="hirerId" className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <option value="">No hirer (direct)</option>
          {hirers.map((h) => (
            <option key={h.id} value={h.id}>{h.name} ({h.email})</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="expectedDelivery" className="text-sm font-medium">Expected Delivery</label>
        <input id="expectedDelivery" name="expectedDelivery" type="date" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="privateNotes" className="text-sm font-medium">Private Notes (only you see)</label>
        <textarea id="privateNotes" name="privateNotes" rows={3} className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50">
        {pending ? "Creating..." : "Create Entry"}
      </button>
    </form>
  )
}
