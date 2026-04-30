"use client"

import { ChevronDown, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  Exercise,
  ExerciseEntry,
  Locale,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

import { SetNumberControl } from "./set-number-control"

type ExerciseCardProps = {
  collapsed: boolean
  dictionary: Dictionary
  entry: ExerciseEntry
  exercise: Exercise | undefined
  locale: Locale
  repsStep: number
  settings: UserSettings | null
  unit: WeightUnit
  onAddSet: (exerciseEntryId: string) => void
  onDeleteExercise: (exerciseEntryId: string) => void
  onDeleteSet: (exerciseEntryId: string, setEntryId: string) => void
  onIncrementNumber: (
    exerciseEntryId: string,
    setEntryId: string,
    field: "reps" | "weight",
    delta: number
  ) => void
  onToggle: (exerciseEntryId: string) => void
  onUpdateNumber: (
    exerciseEntryId: string,
    setEntryId: string,
    field: "reps" | "weight",
    value: number
  ) => void
}

export function ExerciseCard({
  collapsed,
  dictionary,
  entry,
  exercise,
  locale,
  repsStep,
  settings,
  unit,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
  onIncrementNumber,
  onToggle,
  onUpdateNumber,
}: ExerciseCardProps) {
  const primaryMuscleGroup = exercise?.muscleGroupIds[0]
  const exerciseName = exercise?.name[locale] ?? entry.exerciseId
  const activeSets = entry.setEntries.length

  return (
    <article className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-base font-semibold leading-tight">
              {exerciseName}
            </h3>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {activeSets}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {primaryMuscleGroup ? dictionary.muscleGroups[primaryMuscleGroup] : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.actions.deleteExercise}
            onClick={() => onDeleteExercise(entry.id)}
          >
            <Trash2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              collapsed ? dictionary.actions.expand : dictionary.actions.collapse
            }
            onClick={() => onToggle(entry.id)}
          >
            <ChevronDown
              className={
                collapsed
                  ? "-rotate-90 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </div>
      </div>

      <div className={collapsed ? "hidden" : "space-y-2 bg-muted/35 p-3"}>
        {entry.setEntries.map((set, index) => {
          const setUnit = set.weightUnit ?? unit
          const setWeightStep =
            setUnit === "kg" ? (settings?.kgStep ?? 1) : (settings?.lbStep ?? 2.5)

          return (
            <div
              key={set.id}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_1.75rem] items-center gap-2 rounded-xl bg-background/80 px-2 py-2 shadow-sm"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {index + 1}
              </div>
              <SetNumberControl
                key={`weight-${set.id}-${set.weight ?? 0}`}
                ariaLabel={`${exerciseName} set ${index + 1} ${
                  dictionary.units[setUnit]
                }`}
                decreaseLabel={dictionary.actions.decrease}
                increaseLabel={dictionary.actions.increase}
                step={setWeightStep}
                suffix={dictionary.units[setUnit]}
                value={set.weight ?? 0}
                onCommit={(value) =>
                  onUpdateNumber(entry.id, set.id, "weight", value)
                }
                onIncrement={(delta) =>
                  onIncrementNumber(entry.id, set.id, "weight", delta)
                }
              />
              <SetNumberControl
                key={`reps-${set.id}-${set.reps ?? 0}`}
                ariaLabel={`${exerciseName} set ${index + 1} ${
                  dictionary.units.reps
                }`}
                decreaseLabel={dictionary.actions.decrease}
                increaseLabel={dictionary.actions.increase}
                step={repsStep}
                suffix={dictionary.units.reps}
                value={set.reps ?? 0}
                onCommit={(value) =>
                  onUpdateNumber(entry.id, set.id, "reps", value)
                }
                onIncrement={(delta) =>
                  onIncrementNumber(entry.id, set.id, "reps", delta)
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label={dictionary.actions.deleteSet}
                onClick={() => onDeleteSet(entry.id, set.id)}
              >
                <X />
              </Button>
            </div>
          )
        })}

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/40 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
          type="button"
          onClick={() => onAddSet(entry.id)}
        >
          <Plus className="size-4" />
          {dictionary.actions.addSet}
        </button>
      </div>
    </article>
  )
}
