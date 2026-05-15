"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function FolderNoteEditor({ folder, initialContent }: { folder: string; initialContent: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(initialContent ?? "")

  async function save() {
    const fd = new FormData()
    fd.set("folder", folder)
    fd.set("content", content)
    await fetch("/api/auth/folder-note", { method: "POST", body: fd })
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    const fd = new FormData()
    fd.set("folder", folder)
    fd.set("content", "")
    await fetch("/api/auth/folder-note", { method: "POST", body: fd })
    setContent("")
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="w-full rounded border px-2 py-1 text-xs bg-background resize-none"
          placeholder="Write a note..."
        />
        <div className="flex gap-2">
          <button onClick={save} className="text-xs bg-primary text-primary-foreground rounded px-2 py-0.5">Save</button>
          <button onClick={() => { setEditing(false); setContent(initialContent ?? "") }} className="text-xs text-muted-foreground">Cancel</button>
          {initialContent && <button onClick={remove} className="text-xs text-red-500 ml-auto">Delete</button>}
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground italic">
        + Add a note
      </button>
    )
  }

  return (
    <div className="group relative rounded border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground bg-muted/20">
      {content}
      <button
        onClick={() => setEditing(true)}
        className="absolute right-1 top-1 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Edit
      </button>
    </div>
  )
}
