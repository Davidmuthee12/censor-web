"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const t = localStorage.getItem("theme")
      if (t) return t === "dark"
      return (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
      )
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
    } catch (e) {
      // ignore
    }
  }, [isDark])

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDark((v) => !v)}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun data-icon="inline-start" />
        ) : (
          <Moon data-icon="inline-start" />
        )}
      </Button>
    </div>
  )
}
