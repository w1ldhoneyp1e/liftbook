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
import type { Locale } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

type CalendarDrawerProps = {
  dictionary: Dictionary
  locale: Locale
  open: boolean
  selectedDate: string
  onOpenChange: (open: boolean) => void
  onSelectDate: (date: Date | undefined) => void
}

export function CalendarDrawer({
  dictionary,
  locale,
  open,
  selectedDate,
  onOpenChange,
  onSelectDate,
}: CalendarDrawerProps) {
  return (
    <Drawer direction="top" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-b-2xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.calendar}</DrawerTitle>
          <DrawerDescription>{selectedDate}</DrawerDescription>
        </DrawerHeader>

        <div className="h-[430px] px-4 pb-4">
          <Calendar
            mode="single"
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
