"use client"

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Settings,
} from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import type {
  AccountSession,
  DateState,
  MuscleGroupId,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"
import { getMuscleGroupColor } from "../lib/muscle-group-colors"
import { AuthPopover } from "./auth-popover"

import {
  type DateStripItem,
  getDateButtonClassName,
  getDateTone,
} from "../lib/date-utils"

type DateHeaderProps = {
  accountConnecting: boolean
  accountError: boolean
  accountSession: AccountSession | null
  authError: string | null
  authSubmitting: boolean
  dateStatusLabel: string
  dragOffset: number
  dateMuscleGroups: Record<string, MuscleGroupId[]>
  days: DateStripItem[]
  dictionary: Dictionary
  isDraggingDay: boolean
  selectedDate: string
  selectedDateState: DateState
  today: string
  onCreateGuestAccount: () => void
  onLoginAccount: (email: string, password: string) => Promise<void> | void
  onOpenCalendar: () => void
  onOpenSettings: () => void
  onRegisterAccount: (email: string, password: string) => Promise<void> | void
  onSelectDate: (dateKey: string) => void
}

export function DateHeader({
  accountConnecting,
  accountError,
  accountSession,
  authError,
  authSubmitting,
  dateStatusLabel,
  dragOffset,
  dateMuscleGroups,
  days,
  dictionary,
  isDraggingDay,
  selectedDate,
  selectedDateState,
  today,
  onCreateGuestAccount,
  onLoginAccount,
  onOpenCalendar,
  onOpenSettings,
  onRegisterAccount,
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
          <AuthPopover
            accountConnecting={accountConnecting}
            accountError={accountError}
            accountSession={accountSession}
            authError={authError}
            authSubmitting={authSubmitting}
            dictionary={dictionary}
            onCreateGuestAccount={onCreateGuestAccount}
            onLoginAccount={onLoginAccount}
            onRegisterAccount={onRegisterAccount}
          />
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

      <div
        className={`mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDraggingDay ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={
          dragOffset !== 0
            ? {
                transform: `translateX(${dragOffset * 0.35}px)`,
              }
            : undefined
        }
      >
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
            <span className="block text-[11px] leading-none">{item.day}</span>
            <span className="mt-1 block text-base font-semibold leading-none">
              {item.date}
            </span>
            <span className="mt-2 flex h-1.5 items-center justify-center gap-1">
              {(dateMuscleGroups[item.dateKey] ?? item.muscleGroupIds)
                .slice(0, 3)
                .map((muscleGroupId) => (
                  <span
                    key={`${item.dateKey}-${muscleGroupId}`}
                    className={`size-1.5 rounded-full ${getMuscleGroupColor(muscleGroupId).dotClassName}`}
                  />
                ))}
            </span>
          </button>
        ))}
      </div>
    </header>
  )
}
