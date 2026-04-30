"use client"

import { MoreVertical, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverPopup,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  dictionary: Dictionary
  entry: ExerciseEntry
  exercise: Exercise | undefined
  locale: Locale
  repsStep: number
  settings: UserSettings | null
  unit: WeightUnit
  onAddSet: (exerciseEntryId: string) => Promise<string | null>
  onDeleteExercise: (exerciseEntryId: string) => void
  onDeleteSet: (exerciseEntryId: string, setEntryId: string) => void
  onIncrementNumber: (
    exerciseEntryId: string,
    setEntryId: string,
    field: "reps" | "weight",
    delta: number
  ) => void
  onUpdateNumber: (
    exerciseEntryId: string,
    setEntryId: string,
    field: "reps" | "weight",
    value: number
  ) => void
}

export function ExerciseCard({
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
  onUpdateNumber,
}: ExerciseCardProps) {
  const primaryMuscleGroup = exercise?.muscleGroupIds[0]
  const exerciseName = exercise?.name[locale] ?? entry.exerciseId
  const activeSets = useMemo(
    () => entry.setEntries.filter((setEntry) => !setEntry.deletedAt),
    [entry.setEntries]
  )
  const [editorSetId, setEditorSetId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const editorSet = activeSets.find((setEntry) => setEntry.id === editorSetId)

  async function handleAddSet() {
    const newSetId = await onAddSet(entry.id)
    if (newSetId) {
      setEditorSetId(newSetId)
    }
  }

  const editorUnit = editorSet?.weightUnit ?? unit
  const editorWeightStep =
    editorUnit === "kg" ? (settings?.kgStep ?? 1) : (settings?.lbStep ?? 2.5)

  return (
    <article className="rounded-2xl bg-card px-4 py-4">
      <div className="flex items-start gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold leading-tight">
              {exerciseName}
            </h3>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {primaryMuscleGroup ? dictionary.muscleGroups[primaryMuscleGroup] : ""}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dictionary.actions.addSet}
            onClick={() => {
              void handleAddSet()
            }}
          >
            <Plus />
          </Button>

          <Popover
            open={menuOpen}
            withBackdrop={false}
            onOpenChange={setMenuOpen}
          >
            <PopoverTrigger
              render={
                <button
                  className="inline-flex size-7 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  type="button"
                  aria-label={dictionary.actions.deleteExercise}
                >
                  <MoreVertical className="size-[18px]" />
                </button>
              }
            />
            <PopoverPositioner side="top" align="end" sideOffset={8}>
              <PopoverPopup className="min-w-40 p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    setMenuOpen(false)
                    onDeleteExercise(entry.id)
                  }}
                >
                  <Trash2 />
                  {dictionary.actions.deleteExercise}
                </Button>
              </PopoverPopup>
            </PopoverPositioner>
          </Popover>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {activeSets.map((set, index) => {
          const setUnit = set.weightUnit ?? unit
          const setWeight = set.weight ?? 0
          const setReps = set.reps ?? 0

          return (
            <Popover
              key={set.id}
              open={editorSetId === set.id && editorSet != null}
              onOpenChange={(open) => {
                if (!open) {
                  setEditorSetId((current) => (current === set.id ? null : current))
                } else {
                  setEditorSetId(set.id)
                }
              }}
            >
              <PopoverTrigger
                render={
                  <button
                    className="inline-flex min-w-[4.5rem] flex-col items-center justify-center rounded-xl bg-muted/50 px-2.5 py-2.5 text-center transition-colors hover:bg-muted"
                    type="button"
                    aria-label={`${exerciseName} set ${index + 1}`}
                    onClick={() => setEditorSetId(set.id)}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <span>{setWeight ? setWeight : "0"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {dictionary.units[setUnit]}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {setReps} {dictionary.units.reps}
                    </div>
                  </button>
                }
              />
              <PopoverPositioner side="top" align="start" sideOffset={10}>
                <PopoverPopup className="w-[min(21rem,calc(100vw-1.5rem))] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">
                        {exerciseName} · {index + 1}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={dictionary.actions.deleteSet}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteSet(entry.id, set.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <SetNumberControl
                      ariaLabel={`${exerciseName} set ${index + 1} ${
                        dictionary.units[setUnit]
                      }`}
                      decreaseLabel={dictionary.actions.decrease}
                      increaseLabel={dictionary.actions.increase}
                      step={editorWeightStep}
                      suffix={dictionary.units[setUnit]}
                      value={setWeight}
                      onCommit={(value) =>
                        onUpdateNumber(entry.id, set.id, "weight", value)
                      }
                      onIncrement={(delta) =>
                        onIncrementNumber(entry.id, set.id, "weight", delta)
                      }
                    />
                    <SetNumberControl
                      ariaLabel={`${exerciseName} set ${index + 1} ${
                        dictionary.units.reps
                      }`}
                      decreaseLabel={dictionary.actions.decrease}
                      increaseLabel={dictionary.actions.increase}
                      step={repsStep}
                      suffix={dictionary.units.reps}
                      value={setReps}
                      onCommit={(value) =>
                        onUpdateNumber(entry.id, set.id, "reps", value)
                      }
                      onIncrement={(delta) =>
                        onIncrementNumber(entry.id, set.id, "reps", delta)
                      }
                    />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => setEditorSetId(null)}
                    >
                      {dictionary.actions.cancel}
                    </Button>
                  </div>
                </PopoverPopup>
              </PopoverPositioner>
            </Popover>
          )
        })}
      </div>
    </article>
  )
}
