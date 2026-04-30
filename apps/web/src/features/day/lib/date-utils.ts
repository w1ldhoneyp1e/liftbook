import type { DateState, Locale } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

export type DateStripItem = {
  date: string
  dateKey: string
  day: string
  selected: boolean
  state: DateState
}

export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function createDateStrip(
  selectedDate: string,
  locale: Locale
): DateStripItem[] {
  const selected = new Date(`${selectedDate}T12:00:00`)
  const today = toDateKey(new Date())
  const daysBack = 14
  const daysForward = 7

  return Array.from({ length: daysBack + daysForward + 1 }, (_, index) => {
    const date = new Date(selected)
    date.setDate(selected.getDate() + index - daysBack)
    const dateKey = toDateKey(date)

    return {
      date: String(date.getDate()),
      dateKey,
      day: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
      selected: dateKey === selectedDate,
      state: getDateState(dateKey, today),
    }
  })
}

export function getDateState(
  dateKey: string,
  todayKey: string
): DateState {
  if (dateKey === todayKey) {
    return "today"
  }

  return dateKey < todayKey ? "past" : "future"
}

export function getDateStatusLabel(
  state: DateState,
  dictionary: Dictionary,
  selectedDate: string
) {
  if (state === "today") {
    return dictionary.labels.today
  }

  return selectedDate
}

export function getDateTone(state: DateState) {
  if (state === "today") {
    return {
      headerClassName: "border-emerald-100 bg-emerald-50",
      labelClassName: "text-emerald-700",
    }
  }

  if (state === "future") {
    return {
      headerClassName: "border-sky-100 bg-sky-50",
      labelClassName: "text-sky-700",
    }
  }

  return {
    headerClassName: "border-zinc-200 bg-zinc-50",
    labelClassName: "text-zinc-600",
  }
}

export function getDateButtonClassName(
  state: DateState,
  selected: boolean
) {
  if (selected && state === "today") {
    return "bg-white text-emerald-900 shadow-[inset_0_0_0_1.5px_rgba(16,185,129,0.32)]"
  }

  if (selected && state === "future") {
    return "bg-white text-sky-900 shadow-[inset_0_0_0_1.5px_rgba(14,165,233,0.3)]"
  }

  if (selected) {
    return "bg-white text-zinc-900 shadow-[inset_0_0_0_1.5px_rgba(113,113,122,0.28)]"
  }

  if (state === "today") {
    return "bg-white/80 text-emerald-800"
  }

  if (state === "future") {
    return "bg-sky-50 text-sky-800"
  }

  return "bg-zinc-50 text-zinc-500"
}
