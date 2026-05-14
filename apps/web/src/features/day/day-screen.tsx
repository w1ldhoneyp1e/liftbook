"use client"

import { Plus } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react"
import { flushSync } from "react-dom"

import { Button } from "@/components/ui/button"
import type {
  MuscleGroupId,
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
import { useDayScreenData } from "./use-day-screen-data"

type WakeLockHandle = {
  release: () => Promise<void>
}

export function DayScreen() {
  const autoSyncSignatureRef = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockHandle | null>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const carouselIdleTimeoutRef = useRef<number | null>(null)
  const carouselCommitTimeoutRef = useRef<number | null>(null)
  const isRecenteringRef = useRef(false)
  const isSettlingCarouselRef = useRef(false)
  const isTouchingCarouselRef = useRef(false)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const touchLastXRef = useRef(0)
  const touchLastTimeRef = useRef(0)
  const dateStripRef = useRef<HTMLDivElement | null>(null)
  const [isDayCarouselMoving, setIsDayCarouselMoving] = useState(false)
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const ssrToday = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [today, setToday] = useState(ssrToday)
  const [selectedDate, setSelectedDate] = useState(ssrToday)
  const [carouselCenterDate, setCarouselCenterDate] = useState(ssrToday)
  const [visualDate, setVisualDate] = useState(ssrToday)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [highlightedExerciseEntryId, setHighlightedExerciseEntryId] =
    useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
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
    daySnapshots,
    dateMuscleGroups,
    exercisesById,
    loginAccount,
    loadError,
    locale,
    loading,
    logoutAccount,
    resendVerificationEmail,
    registerAccount,
    renameCustomExercise,
    resolvedDate,
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
  const carouselDates = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) =>
        shiftDateKey(carouselCenterDate, offset)
      ),
    [carouselCenterDate]
  )
  const selectedDateState = getDateState(selectedDate, today)
  const dateStatusLabel = getDateStatusLabel(
    selectedDateState,
    dictionary,
    selectedDate
  )
  const currentDaySnapshot = daySnapshots[selectedDate] ?? {
    date: selectedDate,
    workoutDay: null,
    exerciseEntries: [],
  }
  const currentDayIsResolving = !daySnapshots[selectedDate] && (
    loading || resolvedDate !== selectedDate
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const localToday = toDateKey(new Date())

      setToday(localToday)

      if (localToday === ssrToday) {
        return
      }

      setSelectedDate((currentDate) =>
        currentDate === ssrToday ? localToday : currentDate
      )
      setCarouselCenterDate((currentDate) =>
        currentDate === ssrToday ? localToday : currentDate
      )
      setVisualDate((currentDate) =>
        currentDate === ssrToday ? localToday : currentDate
      )
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [ssrToday])

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

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
    setCarouselCenterDate(dateKey)
    setVisualDate(dateKey)
  }

  function clearCarouselIdleTimeout() {
    if (carouselIdleTimeoutRef.current !== null) {
      window.clearTimeout(carouselIdleTimeoutRef.current)
      carouselIdleTimeoutRef.current = null
    }
  }

  function clearCarouselCommitTimeout() {
    if (carouselCommitTimeoutRef.current !== null) {
      window.clearTimeout(carouselCommitTimeoutRef.current)
      carouselCommitTimeoutRef.current = null
    }
  }

  function scheduleCarouselSettle(delay = 90) {
    clearCarouselIdleTimeout()
    carouselIdleTimeoutRef.current = window.setTimeout(() => {
      settleCarousel()
    }, delay)
  }

  const scrollCarouselToCenter = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      if (!carouselRef.current) {
        return
      }

      const carouselWidth = carouselRef.current.clientWidth

      carouselRef.current.scrollTo({
        left: carouselWidth * 2,
        behavior,
      })
    },
    []
  )

  useEffect(() => {
    if (!carouselRef.current) {
      return
    }

    if (isRecenteringRef.current) {
      return
    }

    isRecenteringRef.current = true

    const frameId = window.requestAnimationFrame(() => {
      scrollCarouselToCenter("auto")

      window.requestAnimationFrame(() => {
        isRecenteringRef.current = false
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [carouselCenterDate, scrollCarouselToCenter])

  const commitCarouselDate = useCallback(
    (dateKey: string) => {
      clearCarouselCommitTimeout()
      isRecenteringRef.current = true

      flushSync(() => {
        setVisualDate(dateKey)
        setSelectedDate(dateKey)
        setCarouselCenterDate(dateKey)
        setIsDayCarouselMoving(false)
      })

      scrollCarouselToCenter("auto")

      window.requestAnimationFrame(() => {
        isRecenteringRef.current = false
        isSettlingCarouselRef.current = false
      })
    },
    [scrollCarouselToCenter]
  )

  function animateAndCommitCarousel(delta: -1 | 0 | 1) {
    if (!carouselRef.current) {
      return
    }

    const carouselWidth = carouselRef.current.clientWidth

    if (carouselWidth === 0) {
      return
    }

    clearCarouselCommitTimeout()
    isSettlingCarouselRef.current = true

    if (delta === 0) {
      setVisualDate(carouselCenterDate)
      setIsDayCarouselMoving(false)
      scrollCarouselToCenter("smooth")
      carouselCommitTimeoutRef.current = window.setTimeout(() => {
        isSettlingCarouselRef.current = false
      }, 180)
      return
    }

    const nextDate = shiftDateKey(carouselCenterDate, delta)

    setVisualDate(nextDate)
    setIsDayCarouselMoving(true)
    carouselRef.current.scrollTo({
      left: carouselWidth * (2 + delta),
      behavior: "smooth",
    })

    carouselCommitTimeoutRef.current = window.setTimeout(() => {
      commitCarouselDate(nextDate)
    }, 230)
  }

  function settleCarousel() {
    if (!carouselRef.current) {
      return
    }

    const carouselWidth = carouselRef.current.clientWidth

    if (carouselWidth === 0) {
      return
    }

    const centerOffset = carouselRef.current.scrollLeft - carouselWidth * 2
    const progress = centerOffset / carouselWidth
    const delta =
      progress > 0.5 ? 1 : progress < -0.5 ? -1 : 0

    animateAndCommitCarousel(delta)
  }

  function handleCarouselScroll() {
    if (
      !carouselRef.current ||
      isRecenteringRef.current ||
      isSettlingCarouselRef.current
    ) {
      return
    }

    const carouselWidth = carouselRef.current.clientWidth

    if (carouselWidth === 0) {
      return
    }

    const centerOffset = carouselRef.current.scrollLeft - carouselWidth * 2
    const isMoving = Math.abs(centerOffset) > 4
    const progress = centerOffset / carouselWidth
    const nextVisualDate =
      progress > 0.35
        ? shiftDateKey(carouselCenterDate, 1)
        : progress < -0.35
          ? shiftDateKey(carouselCenterDate, -1)
          : carouselCenterDate

    setIsDayCarouselMoving(isMoving)
    setVisualDate((currentDate) =>
      currentDate === nextVisualDate ? currentDate : nextVisualDate
    )

    if (isTouchingCarouselRef.current) {
      clearCarouselIdleTimeout()
      return
    }

    scheduleCarouselSettle()
  }

  function handleCarouselTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (carouselCommitTimeoutRef.current !== null && visualDate !== carouselCenterDate) {
      commitCarouselDate(visualDate)
    }

    isTouchingCarouselRef.current = true
    clearCarouselIdleTimeout()
    clearCarouselCommitTimeout()
    isSettlingCarouselRef.current = false

    const touch = event.touches[0]
    const now = performance.now()

    touchStartXRef.current = touch.clientX
    touchLastXRef.current = touch.clientX

    touchStartTimeRef.current = now
    touchLastTimeRef.current = now
  }

  function handleCarouselTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]

    touchLastXRef.current = touch.clientX
    touchLastTimeRef.current = performance.now()
  }

  function handleCarouselTouchEnd() {
    isTouchingCarouselRef.current = false

    if (!carouselRef.current) {
      return
    }

    const carouselWidth = carouselRef.current.clientWidth

    if (carouselWidth === 0) {
      return
    }

    const scrollProgress =
      (carouselRef.current.scrollLeft - carouselWidth * 2) / carouselWidth
    const dragDistance = touchLastXRef.current - touchStartXRef.current
    const dragDuration = Math.max(
      touchLastTimeRef.current - touchStartTimeRef.current,
      1
    )
    const velocity = dragDistance / dragDuration
    const swipeDelta =
      dragDistance < -carouselWidth * 0.16 || velocity < -0.35
        ? 1
        : dragDistance > carouselWidth * 0.16 || velocity > 0.35
          ? -1
          : scrollProgress > 0.32
            ? 1
            : scrollProgress < -0.32
              ? -1
              : 0

    window.requestAnimationFrame(() => animateAndCommitCarousel(swipeDelta))
  }

  useEffect(() => {
    return () => {
      if (carouselIdleTimeoutRef.current !== null) {
        clearCarouselIdleTimeout()
      }
      clearCarouselCommitTimeout()
    }
  }, [])

  function handleSelectCalendarDate(date: Date | undefined) {
    if (!date) {
      return
    }

    const dateKey = toDateKey(date)

    setSelectedDate(dateKey)
    setCarouselCenterDate(dateKey)
    setVisualDate(dateKey)
    setCalendarOpen(false)
  }

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
            isDraggingDay={isDayCarouselMoving}
            motion={null}
            selectedDate={selectedDate}
            visualDate={visualDate}
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
            onSelectDate={handleSelectDate}
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
          ref={carouselRef}
          className="flex flex-1 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleCarouselScroll}
          onTouchStart={handleCarouselTouchStart}
          onTouchMove={handleCarouselTouchMove}
          onTouchEnd={handleCarouselTouchEnd}
          onTouchCancel={handleCarouselTouchEnd}
        >
          {carouselDates.map((paneDate, paneIndex) => {
            const snapshot = daySnapshots[paneDate] ?? {
              date: paneDate,
              workoutDay: null,
              exerciseEntries: [],
            }
            const isCenterPane = paneIndex === 2
            const paneExerciseEntries = isCenterPane
              ? currentDaySnapshot.exerciseEntries
              : snapshot.exerciseEntries

            return (
              <div
                key={paneIndex}
                className="w-full shrink-0 snap-center [scroll-snap-stop:always]"
              >
                <div className={isCenterPane ? "" : "pointer-events-none"}>
                  <ExerciseList
                    dictionary={dictionary}
                    exerciseEntries={paneExerciseEntries}
                    exercisesById={exercisesById}
                    highlightedExerciseEntryId={
                      isCenterPane ? highlightedExerciseEntryId : null
                    }
                    loadError={isCenterPane ? loadError : null}
                    loading={isCenterPane ? currentDayIsResolving : false}
                    locale={locale}
                    onOpenExercisePicker={() => setExercisePickerOpen(true)}
                    previewMode={!isCenterPane}
                    repsStep={repsStep}
                    settings={settings}
                    unit={unit}
                    onAddSet={isCenterPane ? handleAddSet : async () => null}
                    onDeleteExercise={isCenterPane ? deleteExercise : () => {}}
                    onDeleteSet={isCenterPane ? deleteSet : () => {}}
                    onUpdateSet={isCenterPane ? updateSet : () => {}}
                  />
                </div>
              </div>
            )
          })}
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
