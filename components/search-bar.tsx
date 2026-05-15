"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useTransition } from "react"

function SearchBarInner({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const q = searchParams.get("q") ?? ""

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (term) params.set("q", term)
    else params.delete("q")
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <input
      type="text"
      defaultValue={q}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder={placeholder}
      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full max-w-sm rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    />
  )
}

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <Suspense fallback={<div className="h-9 w-full max-w-sm rounded-md border border-input bg-background" />}>
      <SearchBarInner placeholder={placeholder} />
    </Suspense>
  )
}
