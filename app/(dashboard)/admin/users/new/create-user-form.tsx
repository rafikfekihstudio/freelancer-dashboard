"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createUserAction } from "@/lib/actions/users"

export function CreateUserForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createUserAction, null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state && "success" in state && state.success && state.emailSent) {
      router.push("/admin/users")
      router.refresh()
    }
  }, [state, router])

  if (state && "success" in state && state.success && !state.emailSent) {
    return (
      <div className="max-w-sm space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-800 mb-1">Email not configured</p>
          <p className="text-amber-700 mb-3">Set <code className="text-xs bg-amber-100 px-1">RESEND_API_KEY</code> in .env.local to send emails automatically.</p>
          <p className="text-amber-800 font-medium mb-1">Password for this user:</p>
          <div className="flex items-center gap-2">
            <code className="bg-amber-100 px-2 py-1 rounded text-amber-900 text-sm">{state.password}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(state.password || ""); setCopied(true) }}
              className="text-xs text-amber-700 hover:text-amber-900 underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <button onClick={() => router.push("/admin/users")} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium">
          Back to Users
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="max-w-sm space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input id="name" name="name" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
      </div>
      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">Role</label>
        <select id="role" name="role" required className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <option value="retoucher">Retoucher</option>
          <option value="hirer">Hirer</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">A random password will be generated and emailed to the user.</p>
      {state && "error" in state && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50">
        {pending ? "Creating..." : "Create User"}
      </button>
    </form>
  )
}
