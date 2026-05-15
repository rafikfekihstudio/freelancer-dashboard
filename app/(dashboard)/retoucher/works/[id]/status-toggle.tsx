"use client"

import { useActionState } from "react"
import { updateWorkStatusAction } from "@/lib/actions/works"

export function StatusToggle({ entryId, currentStatus }: { entryId: number; currentStatus: string }) {
  const [, action, pending] = useActionState(updateWorkStatusAction, null)

  return (
    <form action={action}>
      <input type="hidden" name="id" value={entryId} />
      <input type="hidden" name="status" value={currentStatus === "in-progress" ? "completed" : "in-progress"} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          currentStatus === "completed"
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        }`}
      >
        {pending ? "..." : currentStatus === "completed" ? "Completed" : "In Progress"}
      </button>
    </form>
  )
}
