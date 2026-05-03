"use client"

import { Plus } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import type { MuscleGroupId } from "@/shared/domain/types"
import {
  applyThemeMode,
  persistThemeMode,
} from "@/shared/theme/theme-mode"

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
  shiftDateKey,
  toDateKey,
} from "./lib/date-utils"
import { useDayScreenData } from "./use-day-screen-data"

export function DayScreen() {
  const autoSyncSignatureRef = useRef<string | null>(null)
  const initialDateRef = useRef<string | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const ssrToday = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [today, setToday] = useState(ssrToday)
  const [selectedDate, setSelectedDate] = useState(ssrToday)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contentMotion, setContentMotion] = useState<"left" | "right" | null>(
    null
  )
  const [dragOffset, setDragOffset] = useState(0)
  const [isDraggingDay, setIsDraggingDay] = useState(false)
  const [restSeconds, setRestSeconds] = useState(0)
  const [restTimerRunning, setRestTimerRunning] = useState(false)
  const timerAlertPlayedRef = useRef(false)
  const [accountError, setAccountError] = useState(false)
  const [accountConnecting, setAccountConnecting] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMode, setSyncMode] = useState<"auto" | "manual" | null>(null)
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
    dateMuscleGroups,
    exerciseEntries,
    exercisesById,
    locale,
    loading,
    nextDay,
    previousDay,
    renameCustomExercise,
    settings,
    syncSummary,
    syncPendingChanges,
    updateSettings,
    updateSet,
  } = useDayScreenData(selectedDate)

  const unit = settings?.weightUnit ?? "kg"
  const repsStep = settings?.repsStep ?? 1
  const restTimerMode = settings?.restTimerMode ?? "stopwatch"
  const restTimerDurationSeconds = settings?.restTimerDurationSeconds ?? 90
  const restTimerSoundEnabled = settings?.restTimerSoundEnabled ?? true
  const restTimerVibrationEnabled = settings?.restTimerVibrationEnabled ?? true
  const days = useMemo(
    () => createDateStrip(selectedDate, locale, dateMuscleGroups),
    [dateMuscleGroups, locale, selectedDate]
  )
  const selectedDateState = getDateState(selectedDate, today)
  const dateStatusLabel = getDateStatusLabel(
    selectedDateState,
    dictionary,
    selectedDate
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const localToday = toDateKey(new Date())

      setToday(localToday)

      if (localToday === ssrToday) {
        return
      }

      initialDateRef.current = localToday
      setSelectedDate((currentDate) =>
        currentDate === ssrToday ? localToday : currentDate
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [ssrToday])

  useEffect(() => {
    if (initialDateRef.current === null) {
      initialDateRef.current = selectedDate
      return
    }

    const previousDate = initialDateRef.current
    if (previousDate === selectedDate) {
      return
    }

    setContentMotion(selectedDate > previousDate ? "left" : "right")
    initialDateRef.current = selectedDate

    const timeoutId = window.setTimeout(() => {
      setContentMotion(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [selectedDate])

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
    if (
      restTimerMode !== "timer" ||
      !restTimerRunning ||
      restSeconds < restTimerDurationSeconds
    ) {
      timerAlertPlayedRef.current = false
      return
    }

    if (timerAlertPlayedRef.current) {
      return
    }

    timerAlertPlayedRef.current = true
    setRestTimerRunning(false)

    if (restTimerVibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([180, 80, 180])
    }

    if (restTimerSoundEnabled && typeof window !== "undefined") {
      const audioContext = new window.AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = "sine"
      oscillator.frequency.value = 880
      gainNode.gain.value = 0.04

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
      oscillator.onended = () => {
        void audioContext.close()
      }
    }
  }, [
    restSeconds,
    restTimerDurationSeconds,
    restTimerMode,
    restTimerRunning,
    restTimerSoundEnabled,
    restTimerVibrationEnabled,
  ])

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

  useEffect(() => {
    const themeMode = settings?.themeMode ?? "system"

    persistThemeMode(themeMode)
    applyThemeMode(themeMode)
  }, [settings?.themeMode])

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
    const newSetId = await addSet(exerciseEntryId)

    if (settings?.autoRestTimer) {
      setRestSeconds(0)
      setRestTimerRunning(true)
    }

    return newSetId
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

  const runSync = useCallback(
    async (mode: "auto" | "manual") => {
      setSyncing(true)
      setSyncMode(mode)

      if (mode === "manual") {
        setSyncError(false)
      }

      try {
        await syncPendingChanges()
        if (mode === "manual") {
          setSyncError(false)
        }
      } catch {
        if (mode === "manual") {
          setSyncError(true)
        }
      } finally {
        setSyncing(false)
        setSyncMode(null)
      }
    },
    [syncPendingChanges]
  )

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
      void runSync("auto")
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [accountSession, isOnline, runSync, syncSummary.pending, syncing])

  async function handleSyncNow() {
    await runSync("manual")
  }

  function handleSelectCalendarDate(date: Date | undefined) {
    if (!date) {
      return
    }

    setSelectedDate(toDateKey(date))
    setCalendarOpen(false)
  }

  function handleShiftDate(dayDelta: number) {
    setSelectedDate((currentDate) => shiftDateKey(currentDate, dayDelta))
  }

  function handleTouchStart(clientX: number) {
    touchStartXRef.current = clientX
    setIsDraggingDay(true)
    setContentMotion(null)
  }

  function handleTouchMove(clientX: number) {
    if (touchStartXRef.current === null) {
      return
    }

    const deltaX = clientX - touchStartXRef.current
    setDragOffset(Math.max(-120, Math.min(120, deltaX)))
  }

  function handleTouchEnd() {
    if (touchStartXRef.current === null) {
      return
    }

    const threshold = 72
    const finalOffset = dragOffset

    touchStartXRef.current = null
    setIsDraggingDay(false)
    setDragOffset(0)

    if (Math.abs(finalOffset) < threshold) {
      return
    }

    handleShiftDate(finalOffset < 0 ? 1 : -1)
  }

  const previewDay = dragOffset < 0 ? nextDay : previousDay
  const previewBaseTransform =
    dragOffset < 0
      ? `calc(100% + ${dragOffset}px)`
      : `calc(-100% + ${dragOffset}px)`

  return (
    <div className="flex min-h-svh justify-center bg-muted/35 text-foreground dark:bg-[#0b0d11]">
      <main className="relative flex min-h-svh w-full max-w-md flex-col bg-background shadow-[0_0_0_1px_rgba(229,231,235,0.45)] dark:shadow-[0_0_0_1px_rgba(43,49,60,0.9)]">
        <div className="sticky top-0 z-40 bg-background/95 shadow-sm backdrop-blur dark:bg-background/92 dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          <DateHeader
            dateStatusLabel={dateStatusLabel}
            dragOffset={dragOffset}
            days={days}
            dictionary={dictionary}
            isDraggingDay={isDraggingDay}
            selectedDate={selectedDate}
            selectedDateState={selectedDateState}
            today={today}
            dateMuscleGroups={dateMuscleGroups}
            onOpenCalendar={() => setCalendarOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onSelectDate={setSelectedDate}
          />

          <RestTimerRow
            dictionary={dictionary}
            durationSeconds={restTimerDurationSeconds}
            mode={restTimerMode}
            running={restTimerRunning}
            seconds={restSeconds}
            soundEnabled={restTimerSoundEnabled}
            vibrationEnabled={restTimerVibrationEnabled}
            onReset={() => {
              setRestTimerRunning(false)
              setRestSeconds(0)
            }}
            onToggleRunning={() =>
              setRestTimerRunning((running) => !running)
            }
            onUpdateDuration={(seconds) =>
              updateSettings({ restTimerDurationSeconds: seconds })
            }
            onUpdateMode={(mode) => updateSettings({ restTimerMode: mode })}
            onUpdateSoundEnabled={(enabled) =>
              updateSettings({ restTimerSoundEnabled: enabled })
            }
            onUpdateVibrationEnabled={(enabled) =>
              updateSettings({ restTimerVibrationEnabled: enabled })
            }
          />
        </div>

        <div
          className="flex-1 overflow-hidden"
          onTouchStart={(event) =>
            handleTouchStart(event.changedTouches[0].clientX)
          }
          onTouchMove={(event) =>
            handleTouchMove(event.changedTouches[0].clientX)
          }
          onTouchCancel={() => handleTouchEnd()}
          onTouchEnd={() => handleTouchEnd()}
        >
          <div className="relative h-full w-full">
            {isDraggingDay ? (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  transform: `translateX(${previewBaseTransform})`,
                }}
              >
                <ExerciseList
                  dictionary={dictionary}
                  exerciseEntries={previewDay.exerciseEntries}
                  exercisesById={exercisesById}
                  loading={false}
                  locale={locale}
                  onOpenExercisePicker={() => {}}
                  repsStep={repsStep}
                  settings={settings}
                  unit={unit}
                  onAddSet={async () => null}
                  onDeleteExercise={() => {}}
                  onDeleteSet={async () => {}}
                  onUpdateSet={async () => {}}
                />
              </div>
            ) : null}

            <div
              className={`absolute inset-0 ${
                isDraggingDay
                  ? ""
                  : contentMotion === "left"
                    ? "animate-[day-slide-left_220ms_ease-out]"
                    : contentMotion === "right"
                      ? "animate-[day-slide-right_220ms_ease-out]"
                      : ""
              }`}
              style={{
                transform: isDraggingDay ? `translateX(${dragOffset}px)` : undefined,
                transition: isDraggingDay ? "none" : undefined,
              }}
            >
              <ExerciseList
                dictionary={dictionary}
                exerciseEntries={exerciseEntries}
                exercisesById={exercisesById}
                loading={loading}
                locale={locale}
                onOpenExercisePicker={() => setExercisePickerOpen(true)}
                repsStep={repsStep}
                settings={settings}
                unit={unit}
                onAddSet={handleAddSet}
                onDeleteExercise={deleteExercise}
                onDeleteSet={deleteSet}
                onUpdateSet={updateSet}
              />
            </div>
          </div>
        </div>

        <Button
          size="icon-lg"
          className="absolute bottom-5 right-5 z-30 size-12 rounded-full shadow-lg"
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
        dateMuscleGroups={dateMuscleGroups}
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
          isOnline={isOnline}
          syncMode={syncMode}
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
