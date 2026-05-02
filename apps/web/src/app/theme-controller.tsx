"use client"

import { useEffect } from "react"

import {
  applyThemeMode,
  getStoredThemeMode,
} from "@/shared/theme/theme-mode"

export function ThemeController() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function syncThemeFromStorage() {
      applyThemeMode(getStoredThemeMode())
    }

    syncThemeFromStorage()

    const handleSystemChange = () => {
      if (getStoredThemeMode() === "system") {
        syncThemeFromStorage()
      }
    }

    mediaQuery.addEventListener("change", handleSystemChange)
    window.addEventListener("storage", syncThemeFromStorage)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange)
      window.removeEventListener("storage", syncThemeFromStorage)
    }
  }, [])

  return null
}
