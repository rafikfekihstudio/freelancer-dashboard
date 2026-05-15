"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { updateAvatarAction } from "@/lib/actions/profile"

export function AvatarForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(updateAvatarAction, null)

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="avatar" className="text-sm font-medium">Upload Avatar</label>
        <input id="avatar" name="avatar" type="file" accept="image/*" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50">
        {pending ? "Uploading..." : "Upload"}
      </button>
    </form>
  )
}
