"use client"

import { Plus } from "lucide-react"
import {
  type PointerEvent,
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
  const activePointerIdRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchGestureRef = useRef<"idle" | "pending" | "horizontal" | "vertical">(
    "idle"
  )
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
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState(0)
  const [runningTimerMode, setRunningTimerMode] = useState<"stopwatch" | "timer" | null>(null)
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
  const restTimerRunning = runningTimerMode === restTimerMode
  const restSeconds =
    restTimerMode === "timer" ? timerElapsedSeconds : stopwatchSeconds
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
      if (restTimerMode === "timer") {
        setTimerElapsedSeconds((seconds) => seconds + 1)
        return
      }

      setStopwatchSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [restTimerMode, restTimerRunning])

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
    setRunningTimerMode(null)

    if (restTimerVibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([250, 120, 250, 120, 400])
    }

    if (restTimerSoundEnabled && typeof window !== "undefined") {
      const audioContext = new window.AudioContext()
      void audioContext.resume()
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0.045
      gainNode.connect(audioContext.destination)

      ;[0, 0.24, 0.48].forEach((startAt, index) => {
        const oscillator = audioContext.createOscillator()
        oscillator.type = "sine"
        oscillator.frequency.value = index === 2 ? 1046 : 880
        oscillator.connect(gainNode)
        oscillator.start(audioContext.currentTime + startAt)
        oscillator.stop(audioContext.currentTime + startAt + 0.14)
      })

      window.setTimeout(() => {
        void audioContext.close()
      }, 900)
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
      setTimerElapsedSeconds(0)
      setRunningTimerMode("timer")
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

  function handleTouchStart(pointerId: number, clientX: number, clientY: number) {
    activePointerIdRef.current = pointerId
    touchStartRef.current = { x: clientX, y: clientY }
    touchGestureRef.current = "pending"
    setContentMotion(null)
  }

  function handleTouchMove(
    event: PointerEvent<HTMLDivElement>,
    pointerId: number,
    clientX: number,
    clientY: number
  ) {
    if (
      event.pointerType !== "touch" ||
      activePointerIdRef.current === null ||
      activePointerIdRef.current !== pointerId
    ) {
      return
    }

    if (touchStartRef.current === null) {
      return
    }

    const deltaX = clientX - touchStartRef.current.x
    const deltaY = clientY - touchStartRef.current.y

    if (touchGestureRef.current === "pending") {
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        return
      }

      if (Math.abs(deltaX) > Math.abs(deltaY) + 6) {
        touchGestureRef.current = "horizontal"
        setIsDraggingDay(true)
      } else {
        touchGestureRef.current = "vertical"
        setIsDraggingDay(false)
        setDragOffset(0)
        return
      }
    }

    if (touchGestureRef.current !== "horizontal") {
      return
    }

    event.preventDefault()
    setDragOffset(Math.max(-120, Math.min(120, deltaX)))
  }

  function handleTouchEnd() {
    const gestureMode = touchGestureRef.current
    const threshold = 72
    const finalOffset = dragOffset

    activePointerIdRef.current = null
    touchStartRef.current = null
    touchGestureRef.current = "idle"
    setIsDraggingDay(false)
    setDragOffset(0)

    if (gestureMode === "idle") {
      return
    }

    if (gestureMode !== "horizontal") {
      return
    }

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
              setRunningTimerMode(null)
              if (restTimerMode === "timer") {
                setTimerElapsedSeconds(0)
                return
              }

              setStopwatchSeconds(0)
            }}
            onToggleRunning={() =>
              setRunningTimerMode((currentMode) =>
                currentMode === restTimerMode ? null : restTimerMode
              )
            }
            onUpdateDuration={(seconds) =>
              updateSettings({ restTimerDurationSeconds: seconds })
            }
            onUpdateMode={(mode) => {
              if (mode !== restTimerMode) {
                setRunningTimerMode(null)
              }

              updateSettings({ restTimerMode: mode })
            }}
            onUpdateSoundEnabled={(enabled) =>
              updateSettings({ restTimerSoundEnabled: enabled })
            }
            onUpdateVibrationEnabled={(enabled) =>
              updateSettings({ restTimerVibrationEnabled: enabled })
            }
          />
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y]"
          onPointerDown={(event) => {
            if (event.pointerType !== "touch") {
              return
            }

            handleTouchStart(
              event.pointerId,
              event.clientX,
              event.clientY
            )
          }}
          onPointerMove={(event) =>
            handleTouchMove(
              event,
              event.pointerId,
              event.clientX,
              event.clientY
            )
          }
          onPointerCancel={() => handleTouchEnd()}
          onPointerUp={() => handleTouchEnd()}
        >
          <div className="relative min-h-full w-full">
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
              className={`relative z-10 min-h-full ${
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

      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))] z-30 mx-auto flex w-full max-w-md justify-end px-5">
        <Button
          size="icon-lg"
          className="pointer-events-auto size-12 rounded-full shadow-lg"
          aria-label={dictionary.actions.addExercise}
          onClick={() => setExercisePickerOpen(true)}
        >
          <Plus />
        </Button>
      </div>

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
