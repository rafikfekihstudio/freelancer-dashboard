"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { createWorkAction } from "@/lib/actions/works"

type UserOption = { id: number; name: string; email: string }

export function WorkForm({ hirers, workTypes, defaultFolder }: { hirers: UserOption[]; workTypes: string[]; defaultFolder?: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createWorkAction, null)

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push("/retoucher")
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={action} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input id="title" name="title" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="originalFilename" className="text-sm font-medium">Original Filename</label>
        <input id="originalFilename" name="originalFilename" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
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
      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">Image (optional)</label>
        <input id="image" name="image" type="file" accept="image/*" className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50">
        {pending ? "Creating..." : "Create Entry"}
      </button>
    </form>
  )
}
