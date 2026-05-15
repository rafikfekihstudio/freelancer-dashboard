"use client"

import { useCallback } from "react"

export function ThemeToggle() {
  const toggle = useCallback(() => {
    const isDark = document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      className="hover:bg-accent hover:text-accent-foreground w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors"
    >
      Toggle Dark Mode
    </button>
  )
}
