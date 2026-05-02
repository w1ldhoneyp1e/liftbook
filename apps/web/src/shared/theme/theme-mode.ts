import type { ThemeMode } from "@/shared/domain/types"

export const THEME_MODE_STORAGE_KEY = "liftbook-theme-mode"

export function resolveThemeMode(mode: ThemeMode) {
  if (mode !== "system") {
    return mode
  }

  if (typeof window === "undefined") {
    return "light"
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return
  }

  const resolvedTheme = resolveThemeMode(mode)
  const root = document.documentElement
  const body = document.body

  root.classList.toggle("dark", resolvedTheme === "dark")
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme

  if (body) {
    body.classList.toggle("dark", resolvedTheme === "dark")
    body.dataset.theme = resolvedTheme
    body.style.colorScheme = resolvedTheme
  }
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system"
  }

  const storedValue = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)

  return storedValue === "light" || storedValue === "dark" || storedValue === "system"
    ? storedValue
    : "system"
}

export function persistThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
}
