"use client"

import type { CSSProperties } from "react"

import { Calendar } from "@/components/ui/calendar"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { Locale, MuscleGroupId } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"
import { getMuscleGroupColor } from "../lib/muscle-group-colors"

type CalendarDrawerProps = {
  dateMuscleGroups: Record<string, MuscleGroupId[]>
  dictionary: Dictionary
  locale: Locale
  open: boolean
  selectedDate: string
  onOpenChange: (open: boolean) => void
  onSelectDate: (date: Date | undefined) => void
}

export function CalendarDrawer({
  dateMuscleGroups,
  dictionary,
  locale,
  open,
  selectedDate,
  onOpenChange,
  onSelectDate,
}: CalendarDrawerProps) {
  return (
    <Drawer direction="top" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-b-2xl bg-background supports-[height:100dvh]:max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.calendar}</DrawerTitle>
          <DrawerDescription>{selectedDate}</DrawerDescription>
        </DrawerHeader>

        <div className="h-[430px] px-4 pb-4">
          <Calendar
            mode="single"
            dayIndicators={Object.fromEntries(
              Object.entries(dateMuscleGroups).map(([dateKey, muscleGroupIds]) => [
                dateKey,
                <span key={dateKey} className="flex items-center justify-center gap-0.5">
                  {muscleGroupIds.slice(0, 3).map((muscleGroupId) => (
                    <span
                      key={`${dateKey}-${muscleGroupId}`}
                      className={`size-1.5 rounded-full ${getMuscleGroupColor(muscleGroupId).dotClassName}`}
                    />
                  ))}
                </span>,
              ])
            )}
            locale={{ code: locale }}
            selected={new Date(`${selectedDate}T12:00:00`)}
            className="mx-auto h-full [--cell-size:--spacing(10)]"
            style={{ "--cell-size": "2.75rem" } as CSSProperties}
            onSelect={onSelectDate}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
