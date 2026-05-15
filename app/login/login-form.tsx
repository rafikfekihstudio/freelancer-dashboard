"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetPending, setResetPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setPending(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResetPending(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      body: form,
    })
    const data = await res.json()
    setResetPending(false)
    if (data.error) {
      setError(data.error)
    } else {
      setResetSent(true)
    }
  }

  if (resetMode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a new password.</p>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
            <input id="reset-email" name="email" type="email" required className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {resetSent ? (
            <p className="text-sm text-green-600">If that email exists, a new password has been sent.</p>
          ) : (
            <button type="submit" disabled={resetPending} className="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50">
              {resetPending ? "Sending..." : "Send Reset"}
            </button>
          )}
          <button type="button" onClick={() => { setResetMode(false); setError(null) }} className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center">
            Back to sign in
          </button>
        </form>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary/90 ring-offset-background focus-visible:ring-ring inline-flex h-10 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <button type="button" onClick={() => setResetMode(true)} className="text-sm text-muted-foreground hover:text-foreground underline w-full text-center">
        Forgot password?
      </button>
    </form>
  )
}
