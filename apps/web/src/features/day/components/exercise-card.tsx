"use client"

import { ChevronDown, Plus, Trash2 } from "lucide-react"

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

  return (
    <article className="rounded-lg bg-card shadow-sm">
      <div
        className={`flex items-center justify-between px-3 py-3 ${
          collapsed ? "" : "border-b border-border/60"
        }`}
      >
        <div>
          <h3 className="font-medium">{exerciseName}</h3>
          <p className="text-xs text-muted-foreground">
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

      <div className={collapsed ? "hidden" : "space-y-2 p-3"}>
        {entry.setEntries.map((set, index) => {
          const setUnit = set.weightUnit ?? unit
          const setWeightStep =
            setUnit === "kg" ? (settings?.kgStep ?? 1) : (settings?.lbStep ?? 2.5)

          return (
            <div
              key={set.id}
              className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 rounded-lg bg-muted px-2 py-2"
            >
              <span className="text-center text-sm text-muted-foreground">
                {index + 1}
              </span>
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
                aria-label={dictionary.actions.deleteSet}
                onClick={() => onDeleteSet(entry.id, set.id)}
              >
                <Trash2 />
              </Button>
            </div>
          )
        })}

        <button
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground"
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
