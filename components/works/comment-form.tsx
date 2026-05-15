"use client"

import { useActionState } from "react"
import { createCommentAction } from "@/lib/actions/comments"

export function CommentForm({ workEntryId }: { workEntryId: number }) {
  const [state, action, pending] = useActionState(createCommentAction, null)

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="workEntryId" value={workEntryId} />
      <textarea name="content" required rows={3} placeholder="Write a comment..." className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50">
        {pending ? "Posting..." : "Post Comment"}
      </button>
    </form>
  )
}
