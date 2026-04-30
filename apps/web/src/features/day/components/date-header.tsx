"use client"

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Settings,
} from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import type { DateState } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

import {
  type DateStripItem,
  getDateButtonClassName,
  getDateTone,
} from "../lib/date-utils"

type DateHeaderProps = {
  dateStatusLabel: string
  days: DateStripItem[]
  dictionary: Dictionary
  selectedDate: string
  selectedDateState: DateState
  today: string
  onOpenCalendar: () => void
  onOpenSettings: () => void
  onSelectDate: (dateKey: string) => void
}

export function DateHeader({
  dateStatusLabel,
  days,
  dictionary,
  selectedDate,
  selectedDateState,
  today,
  onOpenCalendar,
  onOpenSettings,
  onSelectDate,
}: DateHeaderProps) {
  const dateTone = getDateTone(selectedDateState)
  const selectedDateRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    selectedDateRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [selectedDate])

  return (
    <header className={`px-4 pb-3 pt-4 ${dateTone.headerClassName}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${dateTone.labelClassName}`}>
            {dateStatusLabel}
          </p>
          <h1 className="text-2xl font-semibold">Liftbook</h1>
        </div>
        <div className="flex gap-2">
          {selectedDate !== today ? (
            <Button
              variant="outline"
              size="icon"
              aria-label={dictionary.actions.goToToday}
              onClick={() => onSelectDate(today)}
            >
              {selectedDateState === "future" ? <ArrowLeft /> : <ArrowRight />}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            aria-label={dictionary.actions.calendar}
            onClick={onOpenCalendar}
          >
            <CalendarDays />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={dictionary.actions.settings}
            onClick={onOpenSettings}
          >
            <Settings />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((item) => (
          <button
            key={item.dateKey}
            ref={item.selected ? selectedDateRef : null}
            className={`min-w-14 rounded-lg px-2 py-2 text-center text-sm ${getDateButtonClassName(
              item.state,
              item.selected
            )}`}
            type="button"
            onClick={() => onSelectDate(item.dateKey)}
          >
            <span className="block text-xs">{item.day}</span>
            <span className="block font-semibold">{item.date}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
