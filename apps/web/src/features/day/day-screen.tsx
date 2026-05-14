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
import type {
  Dictionary,
} from "@/shared/i18n/dictionaries"
import type {
  Exercise,
  ExerciseEntry,
  MuscleGroupId,
  WeightUnit,
} from "@/shared/domain/types"
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
import {
  formatTimer,
  formatWeightValue,
  getWeightUnitLabel,
} from "./lib/format"
import { getMuscleGroupColor } from "./lib/muscle-group-colors"
import { useDayScreenData } from "./use-day-screen-data"

type WakeLockHandle = {
  release: () => Promise<void>
}

export function DayScreen() {
  const autoSyncSignatureRef = useRef<string | null>(null)
  const initialDateRef = useRef<string | null>(null)
  const suppressNextMotionRef = useRef(false)
  const wakeLockRef = useRef<WakeLockHandle | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)
  const swipeContainerRef = useRef<HTMLDivElement | null>(null)
  const swipeTrackRef = useRef<HTMLDivElement | null>(null)
  const dateStripRef = useRef<HTMLDivElement | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipeCurrentRef = useRef<{ x: number; y: number } | null>(null)
  const dragOffsetRef = useRef(0)
  const [isDraggingDay, setIsDraggingDay] = useState(false)
  const [settlingSwipe, setSettlingSwipe] = useState<
    "next" | "prev" | "reset" | null
  >(null)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const ssrToday = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [today, setToday] = useState(ssrToday)
  const [selectedDate, setSelectedDate] = useState(ssrToday)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [highlightedExerciseEntryId, setHighlightedExerciseEntryId] =
    useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contentMotion, setContentMotion] = useState<"left" | "right" | null>(
    null
  )
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState(0)
  const [runningTimerMode, setRunningTimerMode] = useState<"stopwatch" | "timer" | null>(null)
  const timerAlertPlayedRef = useRef(false)
  const [accountError, setAccountError] = useState(false)
  const [accountConnecting, setAccountConnecting] = useState(false)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
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
    loginAccount,
    loadError,
    locale,
    loading,
    logoutAccount,
    resendVerificationEmail,
    registerAccount,
    renameCustomExercise,
    settings,
    syncSummary,
    syncPendingChanges,
    updateSettings,
    updateSet,
    previousDay,
    nextDay,
  } = useDayScreenData(selectedDate)

  const unit = settings?.weightUnit ?? "kg"
  const repsStep = settings?.repsStep ?? 1
  const restTimerMode = settings?.restTimerMode ?? "stopwatch"
  const restTimerDurationSeconds = settings?.restTimerDurationSeconds ?? 90
  const restTimerNotificationsEnabled =
    settings?.restTimerNotificationsEnabled ?? true
  const restTimerSoundEnabled = settings?.restTimerSoundEnabled ?? true
  const restTimerVibrationEnabled = settings?.restTimerVibrationEnabled ?? true
  const restTimerWakeLockEnabled = settings?.restTimerWakeLockEnabled ?? true
  const restTimerLockScreenEnabled =
    settings?.restTimerLockScreenEnabled ?? false
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

  const applySwipeOffset = useCallback(
    (
      offset: number,
      options: {
        immediate?: boolean
      } = {}
    ) => {
      dragOffsetRef.current = offset

      if (swipeTrackRef.current) {
        swipeTrackRef.current.style.transition = options.immediate
          ? "none"
          : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
        swipeTrackRef.current.style.transform = `translateX(calc(-33.333% + ${offset}px))`
      }

      if (dateStripRef.current) {
        dateStripRef.current.style.transition = options.immediate
          ? "none"
          : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
        dateStripRef.current.style.transform = `translateX(${offset * 0.35}px)`
      }
    },
    []
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

    if (suppressNextMotionRef.current) {
      initialDateRef.current = selectedDate
      suppressNextMotionRef.current = false
      setContentMotion(null)
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
    if (settlingSwipe === null) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      applySwipeOffset(0, { immediate: true })

      if (settlingSwipe === "next" || settlingSwipe === "prev") {
        suppressNextMotionRef.current = true
        setSelectedDate((currentDate) =>
          shiftDateKey(currentDate, settlingSwipe === "next" ? 1 : -1)
        )
      }

      setSettlingSwipe(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [applySwipeOffset, settlingSwipe])

  useEffect(() => {
    applySwipeOffset(dragOffsetRef.current, { immediate: true })
  }, [applySwipeOffset, isDraggingDay, settlingSwipe])

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
    async function releaseWakeLock() {
      if (!wakeLockRef.current) {
        return
      }

      try {
        await wakeLockRef.current.release()
      } catch {
        // Ignore release failures.
      } finally {
        wakeLockRef.current = null
      }
    }

    async function acquireWakeLock() {
      if (
        !restTimerRunning ||
        !restTimerWakeLockEnabled ||
        typeof navigator === "undefined" ||
        !("wakeLock" in navigator) ||
        document.visibilityState !== "visible"
      ) {
        await releaseWakeLock()
        return
      }

      if (wakeLockRef.current) {
        return
      }

      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
      } catch {
        wakeLockRef.current = null
      }
    }

    function handleVisibilityChange() {
      void acquireWakeLock()
    }

    void acquireWakeLock()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [restTimerRunning, restTimerWakeLockEnabled])

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return
    }

    navigator.mediaSession.setActionHandler("play", () => {
      setRunningTimerMode(restTimerMode)
    })
    navigator.mediaSession.setActionHandler("pause", () => {
      setRunningTimerMode(null)
    })
    navigator.mediaSession.setActionHandler("stop", () => {
      setRunningTimerMode(null)
      if (restTimerMode === "timer") {
        setTimerElapsedSeconds(0)
        return
      }

      setStopwatchSeconds(0)
    })

    const mediaTitle =
      restTimerMode === "timer"
        ? `${dictionary.actions.timer}: ${Math.max(restTimerDurationSeconds - restSeconds, 0)}s`
        : `${dictionary.actions.stopwatch}: ${restSeconds}s`

    navigator.mediaSession.metadata = new MediaMetadata({
      title: mediaTitle,
      artist: "Liftbook",
      album: dictionary.labels.restTimer,
      artwork: [
        {
          src: "/icon.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    })
    navigator.mediaSession.playbackState = restTimerRunning ? "playing" : "paused"

    if (!restTimerLockScreenEnabled) {
      silentAudioRef.current?.pause()
      silentAudioRef.current = null
      return
    }

    if (!silentAudioRef.current) {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAAAAAA"
      )
      audio.loop = true
      audio.volume = 0.001
      silentAudioRef.current = audio
    }

    if (restTimerRunning) {
      void silentAudioRef.current.play().catch(() => {})
    } else {
      silentAudioRef.current.pause()
    }
  }, [
    dictionary.actions.stopwatch,
    dictionary.actions.timer,
    dictionary.labels.restTimer,
    restSeconds,
    restTimerDurationSeconds,
    restTimerLockScreenEnabled,
    restTimerMode,
    restTimerRunning,
  ])

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

    if (
      restTimerNotificationsEnabled &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const body = `${dictionary.labels.restTimer}: ${dictionary.actions.timer}`

      void navigator.serviceWorker?.ready
        .then((registration) =>
          registration.active?.postMessage({
            type: "show-timer-notification",
            payload: {
              body,
              tag: "liftbook-rest-timer",
              title: "Liftbook",
            },
          })
        )
        .catch(() => {
          new Notification("Liftbook", { body, tag: "liftbook-rest-timer" })
        })
    }
  }, [
    dictionary.actions.timer,
    dictionary.labels.restTimer,
    restSeconds,
    restTimerDurationSeconds,
    restTimerMode,
    restTimerNotificationsEnabled,
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
    const exerciseEntryId = await addExercise(exerciseId)
    setHighlightedExerciseEntryId(exerciseEntryId ?? null)
    setExercisePickerOpen(false)
  }

  async function handleAddCustomExercise(
    name: string,
    muscleGroupIds: MuscleGroupId[]
  ) {
    const exerciseEntryId = await addCustomExercise(
      name,
      muscleGroupIds,
      locale
    )
    setHighlightedExerciseEntryId(exerciseEntryId ?? null)
    setExercisePickerOpen(false)
  }

  useEffect(() => {
    if (!highlightedExerciseEntryId) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedExerciseEntryId(null)
    }, 3200)

    return () => window.clearTimeout(timeoutId)
  }, [highlightedExerciseEntryId])

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

  async function handleRegisterAccount(email: string, password: string) {
    setAuthSubmitting(true)
    setAuthError(null)
    setAuthNotice(null)

    try {
      const response = await registerAccount(email, password)
      setAuthNotice(
        response?.verificationEmailSent === false
          ? dictionary.labels.authVerificationHint
          : dictionary.labels.authVerificationSent
      )
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : dictionary.labels.connectionError
      )
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleLoginAccount(email: string, password: string) {
    setAuthSubmitting(true)
    setAuthError(null)
    setAuthNotice(null)

    try {
      await loginAccount(email, password)
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : dictionary.labels.connectionError
      )
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function handleResendVerificationEmail() {
    setAuthSubmitting(true)
    setAuthError(null)
    setAuthNotice(null)

    try {
      await resendVerificationEmail()
      setAuthNotice(dictionary.labels.authVerificationSent)
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : dictionary.labels.connectionError
      )
    } finally {
      setAuthSubmitting(false)
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

  function handleContentTouchStart(clientX: number, clientY: number) {
    swipeStartRef.current = { x: clientX, y: clientY }
    swipeCurrentRef.current = { x: clientX, y: clientY }
    setIsDraggingDay(false)
    applySwipeOffset(0, { immediate: true })
  }

  function handleContentTouchMove(clientX: number, clientY: number) {
    if (swipeStartRef.current === null) {
      return
    }

    swipeCurrentRef.current = { x: clientX, y: clientY }

    const deltaX = clientX - swipeStartRef.current.x
    const deltaY = clientY - swipeStartRef.current.y

    if (Math.abs(deltaX) < 12 || Math.abs(deltaX) <= Math.abs(deltaY) + 10) {
      if (!isDraggingDay) {
        return
      }

      setIsDraggingDay(false)
      applySwipeOffset(0, { immediate: true })
      return
    }

    const containerWidth = swipeContainerRef.current?.offsetWidth ?? 320

    setIsDraggingDay(true)
    setContentMotion(null)
    applySwipeOffset(
      Math.max(-containerWidth * 0.92, Math.min(containerWidth * 0.92, deltaX)),
      { immediate: true }
    )
  }

  function handleContentTouchEnd() {
    const start = swipeStartRef.current
    const current = swipeCurrentRef.current
    const finalOffset = dragOffsetRef.current

    swipeStartRef.current = null
    swipeCurrentRef.current = null
    setIsDraggingDay(false)

    if (!start || !current) {
      applySwipeOffset(0, { immediate: true })
      return
    }

    const deltaX = finalOffset || current.x - start.x
    const deltaY = current.y - start.y
    const containerWidth = swipeContainerRef.current?.offsetWidth ?? 320
    const activationThreshold = Math.min(120, Math.max(72, containerWidth * 0.22))

    if (
      Math.abs(deltaX) < activationThreshold ||
      Math.abs(deltaX) <= Math.abs(deltaY) + 12
    ) {
      applySwipeOffset(0)
      setSettlingSwipe("reset")
      return
    }

    applySwipeOffset(deltaX < 0 ? -containerWidth : containerWidth)
    setSettlingSwipe(deltaX < 0 ? "next" : "prev")
  }

  const showSwipeTrack = isDraggingDay || settlingSwipe !== null

  return (
    <div className="flex min-h-svh justify-center bg-muted/35 text-foreground dark:bg-[#0b0d11]">
      <main className="relative flex min-h-svh w-full max-w-md flex-col bg-background shadow-[0_0_0_1px_rgba(229,231,235,0.45)] dark:shadow-[0_0_0_1px_rgba(43,49,60,0.9)]">
        <div className="sticky top-0 z-40 bg-background/95 shadow-sm backdrop-blur dark:bg-background/92 dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          <DateHeader
            accountConnecting={accountConnecting}
            accountError={accountError}
            accountSession={accountSession}
            authError={authError}
            authNotice={authNotice}
            authSubmitting={authSubmitting}
            dateStatusLabel={dateStatusLabel}
            days={days}
            dateStripRef={dateStripRef}
            dictionary={dictionary}
            isDraggingDay={isDraggingDay}
            motion={contentMotion}
            selectedDate={selectedDate}
            selectedDateState={selectedDateState}
            today={today}
            dateMuscleGroups={dateMuscleGroups}
            onCreateGuestAccount={handleCreateGuestAccount}
            onLoginAccount={handleLoginAccount}
            onLogoutAccount={async () => {
              await logoutAccount()
            }}
            onOpenCalendar={() => setCalendarOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onRegisterAccount={handleRegisterAccount}
            onResendVerificationEmail={handleResendVerificationEmail}
            onSelectDate={setSelectedDate}
          />

          <RestTimerRow
            dictionary={dictionary}
            durationSeconds={restTimerDurationSeconds}
            lockScreenEnabled={restTimerLockScreenEnabled}
            mode={restTimerMode}
            notificationsEnabled={restTimerNotificationsEnabled}
            running={restTimerRunning}
            seconds={restSeconds}
            soundEnabled={restTimerSoundEnabled}
            vibrationEnabled={restTimerVibrationEnabled}
            wakeLockEnabled={restTimerWakeLockEnabled}
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
            onUpdateLockScreenEnabled={(enabled) =>
              updateSettings({ restTimerLockScreenEnabled: enabled })
            }
            onUpdateMode={(mode) => {
              if (mode !== restTimerMode) {
                setRunningTimerMode(null)
              }

              updateSettings({ restTimerMode: mode })
            }}
            onUpdateNotificationsEnabled={async (enabled) => {
              if (
                enabled &&
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "default"
              ) {
                const permission = await Notification.requestPermission()

                if (permission !== "granted") {
                  updateSettings({ restTimerNotificationsEnabled: false })
                  return
                }
              }

              updateSettings({ restTimerNotificationsEnabled: enabled })
            }}
            onUpdateSoundEnabled={(enabled) =>
              updateSettings({ restTimerSoundEnabled: enabled })
            }
            onUpdateVibrationEnabled={(enabled) =>
              updateSettings({ restTimerVibrationEnabled: enabled })
            }
            onUpdateWakeLockEnabled={(enabled) =>
              updateSettings({ restTimerWakeLockEnabled: enabled })
            }
          />
        </div>

        <div
          ref={swipeContainerRef}
          className="relative w-full [touch-action:pan-y]"
          onTouchStart={(event) =>
            handleContentTouchStart(
              event.changedTouches[0].clientX,
              event.changedTouches[0].clientY
            )
          }
          onTouchMove={(event) =>
            handleContentTouchMove(
              event.changedTouches[0].clientX,
              event.changedTouches[0].clientY
            )
          }
          onTouchCancel={() => handleContentTouchEnd()}
          onTouchEnd={() => handleContentTouchEnd()}
        >
          {showSwipeTrack ? (
            <div className="overflow-hidden">
              <div
                ref={swipeTrackRef}
                className="flex w-[300%] will-change-transform"
                style={{ transform: "translateX(-33.333%)" }}
              >
                <div className="w-full shrink-0 basis-full">
                  <SwipePreviewDayPane
                    dictionary={dictionary}
                    exerciseEntries={previousDay.exerciseEntries}
                    exercisesById={exercisesById}
                    locale={locale}
                    unit={unit}
                  />
                </div>
                <div className="w-full shrink-0 basis-full">
                  <SwipePreviewDayPane
                    dictionary={dictionary}
                    exerciseEntries={exerciseEntries}
                    exercisesById={exercisesById}
                    highlightedExerciseEntryId={highlightedExerciseEntryId}
                    interactive
                    loadError={loadError}
                    loading={loading}
                    locale={locale}
                    onAddSet={handleAddSet}
                    onDeleteExercise={deleteExercise}
                    onDeleteSet={deleteSet}
                    onOpenExercisePicker={() => setExercisePickerOpen(true)}
                    onUpdateSet={updateSet}
                    repsStep={repsStep}
                    settings={settings}
                    unit={unit}
                  />
                </div>
                <div className="w-full shrink-0 basis-full">
                  <SwipePreviewDayPane
                    dictionary={dictionary}
                    exerciseEntries={nextDay.exerciseEntries}
                    exercisesById={exercisesById}
                    locale={locale}
                    unit={unit}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`relative z-10 ${
                contentMotion === "left"
                  ? "animate-[day-slide-left_220ms_ease-out]"
                  : contentMotion === "right"
                    ? "animate-[day-slide-right_220ms_ease-out]"
                    : ""
              }`}
            >
              <ExerciseList
                dictionary={dictionary}
                exerciseEntries={exerciseEntries}
                exercisesById={exercisesById}
                highlightedExerciseEntryId={highlightedExerciseEntryId}
                loadError={loadError}
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
          )}
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
          accountSession={accountSession}
          dictionary={dictionary}
          open={settingsOpen}
          settings={settings}
          syncSummary={syncSummary}
          isOnline={isOnline}
          syncMode={syncMode}
          syncError={syncError}
          syncing={syncing}
          onOpenChange={setSettingsOpen}
          onSyncNow={handleSyncNow}
          onUpdateSettings={updateSettings}
        />
      ) : null}
    </div>
  )
}

type SwipePreviewDayPaneProps = {
  dictionary: Dictionary
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  highlightedExerciseEntryId?: string | null
  interactive?: boolean
  loadError?: string | null
  loading?: boolean
  locale: "en" | "ru"
  onAddSet?: (exerciseEntryId: string) => Promise<string | null>
  onDeleteExercise?: (exerciseEntryId: string) => void
  onDeleteSet?: (
    exerciseEntryId: string,
    setEntryId: string
  ) => Promise<void> | void
  onOpenExercisePicker?: () => void
  onUpdateSet?: (
    exerciseEntryId: string,
    setEntryId: string,
    patch: Partial<{ reps: number; weight: number }>
  ) => Promise<void> | void
  repsStep?: number
  settings?: Parameters<typeof ExerciseList>[0]["settings"]
  unit: WeightUnit
}

function SwipePreviewDayPane({
  dictionary,
  exerciseEntries,
  exercisesById,
  highlightedExerciseEntryId = null,
  interactive = false,
  loadError = null,
  loading = false,
  locale,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
  onOpenExercisePicker,
  onUpdateSet,
  repsStep = 1,
  settings = null,
  unit,
}: SwipePreviewDayPaneProps) {
  if (interactive) {
    return (
      <ExerciseList
        dictionary={dictionary}
        exerciseEntries={exerciseEntries}
        exercisesById={exercisesById}
        highlightedExerciseEntryId={highlightedExerciseEntryId}
        loadError={loadError}
        loading={loading}
        locale={locale}
        onOpenExercisePicker={onOpenExercisePicker ?? (() => {})}
        repsStep={repsStep}
        settings={settings}
        unit={unit}
        onAddSet={onAddSet ?? (async () => null)}
        onDeleteExercise={onDeleteExercise ?? (() => {})}
        onDeleteSet={onDeleteSet ?? (() => {})}
        onUpdateSet={onUpdateSet ?? (() => {})}
      />
    )
  }

  return (
    <section className="flex min-h-full flex-col gap-4 px-4 py-4">
      {exerciseEntries.length === 0 ? (
        <div className="flex min-h-[52svh] items-center justify-center px-5 py-8 text-center text-sm text-muted-foreground">
          {dictionary.labels.emptyDayMessage}
        </div>
      ) : (
        exerciseEntries.map((entry) => {
          const exercise = exercisesById[entry.exerciseId]
          const exerciseName = exercise?.name[locale] ?? entry.exerciseId
          const primaryMuscleGroup = exercise?.muscleGroupIds[0]
          const primaryMuscleGroupColor = primaryMuscleGroup
            ? getMuscleGroupColor(primaryMuscleGroup)
            : null

          return (
            <article
              key={entry.id}
              className="rounded-2xl bg-card px-4 py-4"
            >
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold leading-tight">
                  {exerciseName}
                </h3>
                {primaryMuscleGroup ? (
                  <p
                    className={`mt-1 inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-xs ${primaryMuscleGroupColor?.badgeClassName}`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${primaryMuscleGroupColor?.dotClassName}`}
                    />
                    <span className="truncate">
                      {dictionary.muscleGroups[primaryMuscleGroup]}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {entry.setEntries.map((setEntry, index) => (
                  <span
                    key={setEntry.id}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-foreground/90"
                  >
                    {formatSetPreview(setEntry, index + 1, dictionary, unit)}
                  </span>
                ))}
              </div>
            </article>
          )
        })
      )}
      <div className="h-16" />
    </section>
  )
}

function formatSetPreview(
  setEntry: ExerciseEntry["setEntries"][number],
  index: number,
  dictionary: Dictionary,
  unit: WeightUnit
) {
  if (typeof setEntry.weight === "number" || typeof setEntry.reps === "number") {
    const parts: string[] = [`#${index}`]

    if (typeof setEntry.weight === "number") {
      parts.push(
        `${formatWeightValue(setEntry.weight, unit)} ${getWeightUnitLabel(dictionary, unit)}`
      )
    }

    if (typeof setEntry.reps === "number") {
      parts.push(`${setEntry.reps} ${dictionary.units.reps}`)
    }

    return parts.join(" · ")
  }

  if (typeof setEntry.durationSeconds === "number") {
    return `#${index} · ${formatTimer(setEntry.durationSeconds)}`
  }

  if (typeof setEntry.distanceMeters === "number") {
    return `#${index} · ${setEntry.distanceMeters} м`
  }

  return `#${index}`
}
