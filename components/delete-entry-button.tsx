"use client"

import { deleteWorkAction } from "@/lib/actions/works"

export function DeleteEntryButton({ entryId }: { entryId: number }) {
  return (
    <form action={deleteWorkAction}>
      <input type="hidden" name="id" value={entryId} />
      <button
        type="submit"
        onClick={(e) => { if (!confirm("Delete this work entry?")) e.preventDefault() }}
        className="text-muted-foreground hover:text-red-500 transition-colors"
        title="Delete entry"
      >
        ✕
      </button>
    </form>
  )
}
