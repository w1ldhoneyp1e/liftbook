"use client"

import { Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { MuscleGroupId } from "@/shared/domain/types"

import { CalendarDrawer } from "./components/calendar-drawer"
import { DateHeader } from "./components/date-header"
import { ExerciseList } from "./components/exercise-list"
import { ExercisePickerDrawer } from "./components/exercise-picker-drawer"
import { RestTimerRow } from "./components/rest-timer-row"
import { SettingsDrawer } from "./components/settings-drawer"
import {
  createDateStrip,
  getDateState,
  getDateStatusLabel,
  toDateKey,
} from "./lib/date-utils"
import { useDayScreenData } from "./use-day-screen-data"

export function DayScreen() {
  const autoSyncSignatureRef = useRef<string | null>(null)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const today = toDateKey(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<string[]>([])
  const [restSeconds, setRestSeconds] = useState(0)
  const [restTimerRunning, setRestTimerRunning] = useState(false)
  const [accountError, setAccountError] = useState(false)
  const [accountConnecting, setAccountConnecting] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const {
    accountSession,
    addExercise,
    addCustomExercise,
    addSet,
    createGuestAccount,
    deleteCustomExercise,
    deleteExercise,
    deleteSet,
    dictionary,
    exerciseEntries,
    exercisesById,
    incrementNumber,
    locale,
    loading,
    renameCustomExercise,
    settings,
    syncSummary,
    syncPendingChanges,
    updateSettings,
    updateNumber,
  } = useDayScreenData(selectedDate)

  const unit = settings?.weightUnit ?? "kg"
  const repsStep = settings?.repsStep ?? 1
  const days = useMemo(
    () => createDateStrip(selectedDate, locale),
    [locale, selectedDate]
  )
  const selectedDateState = getDateState(selectedDate, today)
  const dateStatusLabel = getDateStatusLabel(
    selectedDateState,
    dictionary,
    selectedDate
  )
  const allExercisesCollapsed =
    exerciseEntries.length > 0 &&
    exerciseEntries.every((entry) => collapsedExerciseIds.includes(entry.id))

  useEffect(() => {
    if (!restTimerRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      setRestSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [restTimerRunning])

  useEffect(() => {
    function handleOnlineStatusChange() {
      setIsOnline(window.navigator.onLine)
    }

    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)
    }
  }, [])

  async function handleAddExercise(exerciseId: string) {
    await addExercise(exerciseId)
    setExercisePickerOpen(false)
  }

  async function handleAddCustomExercise(
    name: string,
    muscleGroupId: MuscleGroupId
  ) {
    await addCustomExercise(name, muscleGroupId, locale)
    setExercisePickerOpen(false)
  }

  async function handleAddSet(exerciseEntryId: string) {
    await addSet(exerciseEntryId)

    if (settings?.autoRestTimer) {
      setRestSeconds(0)
      setRestTimerRunning(true)
    }
  }

  async function handleCreateGuestAccount() {
    setAccountConnecting(true)
    setAccountError(false)

    try {
      await createGuestAccount()
    } catch {
      setAccountError(true)
    } finally {
      setAccountConnecting(false)
    }
  }

  const runSync = useCallback(async () => {
    setSyncing(true)
    setSyncError(false)

    try {
      await syncPendingChanges()
      autoSyncSignatureRef.current = null
      setSyncError(false)
    } catch {
      setSyncError(true)
    } finally {
      setSyncing(false)
    }
  }, [syncPendingChanges])

  useEffect(() => {
    if (!accountSession || !isOnline || syncing) {
      return
    }

    const signature = [
      accountSession.userId,
      accountSession.syncCursor ?? "initial",
      syncSummary.pending,
      isOnline ? "online" : "offline",
    ].join(":")

    if (autoSyncSignatureRef.current === signature) {
      return
    }

    autoSyncSignatureRef.current = signature

    const timeoutId = window.setTimeout(() => {
      void runSync()
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [accountSession, isOnline, runSync, syncSummary.pending, syncing])

  async function handleSyncNow() {
    await runSync()
  }

  function handleSelectCalendarDate(date: Date | undefined) {
    if (!date) {
      return
    }

    setSelectedDate(toDateKey(date))
    setCalendarOpen(false)
  }

  function handleShiftDate(dayDelta: number) {
    setSelectedDate((currentDate) => {
      const nextDate = new Date(`${currentDate}T12:00:00`)
      nextDate.setDate(nextDate.getDate() + dayDelta)
      return toDateKey(nextDate)
    })
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX === null) {
      return
    }

    const deltaX = clientX - touchStartX
    setTouchStartX(null)

    if (Math.abs(deltaX) < 60) {
      return
    }

    handleShiftDate(deltaX < 0 ? 1 : -1)
  }

  function handleToggleAllExercises() {
    setCollapsedExerciseIds(
      allExercisesCollapsed ? [] : exerciseEntries.map((entry) => entry.id)
    )
  }

  function handleToggleExercise(exerciseEntryId: string) {
    setCollapsedExerciseIds((current) =>
      current.includes(exerciseEntryId)
        ? current.filter((id) => id !== exerciseEntryId)
        : [...current, exerciseEntryId]
    )
  }

  return (
    <div className="flex min-h-svh justify-center bg-zinc-100 text-foreground">
      <main
        className="flex min-h-svh w-full max-w-md flex-col bg-background"
        onTouchStart={(event) => setTouchStartX(event.changedTouches[0].clientX)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
      >
        <div className="sticky top-0 z-40 bg-background shadow-sm">
          <DateHeader
            dateStatusLabel={dateStatusLabel}
            days={days}
            dictionary={dictionary}
            selectedDate={selectedDate}
            selectedDateState={selectedDateState}
            today={today}
            onOpenCalendar={() => setCalendarOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onSelectDate={setSelectedDate}
          />

          <RestTimerRow
            dictionary={dictionary}
            running={restTimerRunning}
            seconds={restSeconds}
            onReset={() => {
              setRestTimerRunning(false)
              setRestSeconds(0)
            }}
            onToggleRunning={() =>
              setRestTimerRunning((running) => !running)
            }
          />
        </div>

        <ExerciseList
          allExercisesCollapsed={allExercisesCollapsed}
          collapsedExerciseIds={collapsedExerciseIds}
          dictionary={dictionary}
          exerciseEntries={exerciseEntries}
          exercisesById={exercisesById}
          loading={loading}
          locale={locale}
          repsStep={repsStep}
          settings={settings}
          unit={unit}
          onAddSet={handleAddSet}
          onDeleteExercise={deleteExercise}
          onDeleteSet={deleteSet}
          onIncrementNumber={incrementNumber}
          onToggleAllExercises={handleToggleAllExercises}
          onToggleExercise={handleToggleExercise}
          onUpdateNumber={updateNumber}
        />

        <Button
          size="icon-lg"
          className="fixed bottom-5 right-5 z-30 size-12 rounded-full shadow-lg"
          aria-label={dictionary.actions.addExercise}
          onClick={() => setExercisePickerOpen(true)}
        >
          <Plus />
        </Button>
      </main>

      <ExercisePickerDrawer
        dictionary={dictionary}
        exercises={Object.values(exercisesById)}
        locale={locale}
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
        onCreateCustomExercise={handleAddCustomExercise}
        onDeleteCustomExercise={deleteCustomExercise}
        onRenameCustomExercise={(exerciseId, name) =>
          renameCustomExercise(exerciseId, name, locale)
        }
        onSelectExercise={handleAddExercise}
      />

      <CalendarDrawer
        dictionary={dictionary}
        locale={locale}
        open={calendarOpen}
        selectedDate={selectedDate}
        onOpenChange={setCalendarOpen}
        onSelectDate={handleSelectCalendarDate}
      />

      {settings ? (
        <SettingsDrawer
          accountConnecting={accountConnecting}
          accountError={accountError}
          accountSession={accountSession}
          dictionary={dictionary}
          open={settingsOpen}
          settings={settings}
          syncSummary={syncSummary}
          syncError={syncError}
          syncing={syncing}
          onCreateGuestAccount={handleCreateGuestAccount}
          onOpenChange={setSettingsOpen}
          onSyncNow={handleSyncNow}
          onUpdateSettings={updateSettings}
        />
      ) : null}
    </div>
  )
}
