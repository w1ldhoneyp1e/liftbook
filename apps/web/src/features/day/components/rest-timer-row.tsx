"use client"

import { Pause, Play, RotateCcw, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/shared/i18n/dictionaries"

import { formatTimer } from "../lib/format"

type RestTimerRowProps = {
  dictionary: Dictionary
  running: boolean
  seconds: number
  onReset: () => void
  onToggleRunning: () => void
}

export function RestTimerRow({
  dictionary,
  running,
  seconds,
  onReset,
  onToggleRunning,
}: RestTimerRowProps) {
  return (
    <section className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="size-4" />
          <span>{dictionary.labels.restTimer}</span>
        </div>
        <div className="mt-0.5 font-mono text-xl font-semibold">
          {formatTimer(seconds)}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
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
