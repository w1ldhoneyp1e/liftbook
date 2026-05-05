"use client"

import { Pause, Play, RotateCcw, SlidersHorizontal, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverPopup,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Dictionary } from "@/shared/i18n/dictionaries"
import type { RestTimerMode } from "@/shared/domain/types"

import { formatTimer } from "../lib/format"

type RestTimerRowProps = {
  dictionary: Dictionary
  durationSeconds: number
  mode: RestTimerMode
  running: boolean
  seconds: number
  soundEnabled: boolean
  vibrationEnabled: boolean
  onReset: () => void
  onToggleRunning: () => void
  onUpdateDuration: (seconds: number) => void
  onUpdateMode: (mode: RestTimerMode) => void
  onUpdateSoundEnabled: (enabled: boolean) => void
  onUpdateVibrationEnabled: (enabled: boolean) => void
}

export function RestTimerRow({
  dictionary,
  durationSeconds,
  mode,
  running,
  seconds,
  soundEnabled,
  vibrationEnabled,
  onReset,
  onToggleRunning,
  onUpdateDuration,
  onUpdateMode,
  onUpdateSoundEnabled,
  onUpdateVibrationEnabled,
}: RestTimerRowProps) {
  const displaySeconds =
    mode === "timer" ? Math.max(durationSeconds - seconds, 0) : seconds

  return (
    <section className="flex items-center justify-between gap-3 border-t border-border/60 bg-background/88 px-4 py-3 backdrop-blur dark:bg-background/70">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="size-4" />
          <span>
            {mode === "timer"
              ? dictionary.actions.timer
              : dictionary.actions.stopwatch}
          </span>
          {running ? (
            <span className="inline-flex size-2 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          ) : null}
        </div>
        <div className="mt-0.5 font-mono text-xl font-semibold">
          {formatTimer(displaySeconds)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Popover withBackdrop={false}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={dictionary.labels.restTimerSettings}
              >
                <SlidersHorizontal />
              </Button>
            }
          />
          <PopoverPositioner side="bottom" align="end" sideOffset={8}>
            <PopoverPopup className="w-[min(22rem,calc(100vw-1.5rem))] bg-card/97 p-4 backdrop-blur dark:bg-card/95">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {dictionary.labels.restTimerMode}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dictionary.labels.restTimerModeHelp}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <ModeButton
                      active={mode === "timer"}
                      label={dictionary.actions.timer}
                      onClick={() => onUpdateMode("timer")}
                    />
                    <ModeButton
                      active={mode === "stopwatch"}
                      label={dictionary.actions.stopwatch}
                      onClick={() => onUpdateMode("stopwatch")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {dictionary.labels.restTimerDuration}
                  </div>
                  <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
                    <StepButton
                      ariaLabel={dictionary.actions.decrease}
                      onClick={() =>
                        onUpdateDuration(Math.max(15, durationSeconds - 15))
                      }
                    >
                      -
                    </StepButton>
                    <div className="rounded-xl bg-muted/40 px-3 py-3 text-center font-mono text-base font-semibold ring-1 ring-border/35 dark:bg-muted/55">
                      {formatTimer(durationSeconds)}
                    </div>
                    <StepButton
                      ariaLabel={dictionary.actions.increase}
                      onClick={() => onUpdateDuration(durationSeconds + 15)}
                    >
                      +
                    </StepButton>
                  </div>
                </div>

                <ToggleRow
                  checked={soundEnabled}
                  description={dictionary.labels.restTimerSoundHelp}
                  label={dictionary.labels.restTimerSound}
                  onToggle={() => onUpdateSoundEnabled(!soundEnabled)}
                />
                <ToggleRow
                  checked={vibrationEnabled}
                  description={dictionary.labels.restTimerVibrationHelp}
                  label={dictionary.labels.restTimerVibration}
                  onToggle={() =>
                    onUpdateVibrationEnabled(!vibrationEnabled)
                  }
                />
              </div>
            </PopoverPopup>
          </PopoverPositioner>
        </Popover>

        <Button
          variant="outline"
          size="icon-sm"
          aria-label={running ? dictionary.actions.pause : dictionary.actions.start}
          onClick={onToggleRunning}
        >
          {running ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={dictionary.actions.reset}
          onClick={onReset}
        >
          <RotateCcw />
        </Button>
      </div>
    </section>
  )
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`h-9 rounded-lg border text-sm ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-card/90 text-foreground hover:bg-muted/45 dark:bg-card/80 dark:hover:bg-muted/45"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function StepButton({
  ariaLabel,
  children,
  onClick,
}: {
  ariaLabel: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-12 items-center justify-center rounded-xl bg-muted/45 text-lg font-medium text-muted-foreground ring-1 ring-border/35 transition-colors hover:bg-muted/65 hover:text-foreground dark:bg-muted/55 dark:hover:bg-muted/75"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ToggleRow({
  checked,
  description,
  label,
  onToggle,
}: {
  checked: boolean
  description: string
  label: string
  onToggle: () => void
}) {
  return (
    <button
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/70 bg-card/92 px-3 py-3 text-left dark:bg-card/80"
      type="button"
      onClick={onToggle}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </div>
      </div>
      <div
        className={`mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full p-1 transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`size-4 rounded-full bg-background transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  )
}
