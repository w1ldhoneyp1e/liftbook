"use client"

import { MoreVertical, Plus, X } from "lucide-react"
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

import {
  convertDisplayedWeightToKg,
  formatNumber,
  formatWeightValue,
  getWeightUnitLabel,
} from "../lib/format"
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
  onDeleteSet: (
    exerciseEntryId: string,
    setEntryId: string
  ) => Promise<void> | void
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
  onUpdateNumber,
}: ExerciseCardProps) {
  const primaryMuscleGroup = exercise?.muscleGroupIds[0]
  const exerciseName = exercise?.name[locale] ?? entry.exerciseId
  const activeSets = useMemo(
    () => entry.setEntries.filter((setEntry) => !setEntry.deletedAt),
    [entry.setEntries]
  )
  const [editorSetId, setEditorSetId] = useState<string | null>(null)
  const [creatingSetId, setCreatingSetId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [draftWeight, setDraftWeight] = useState("")
  const [draftReps, setDraftReps] = useState("")

  const editorSet = activeSets.find((setEntry) => setEntry.id === editorSetId)

  async function handleAddSet() {
    const newSetId = await onAddSet(entry.id)
    if (newSetId) {
      setCreatingSetId(newSetId)
      setEditorSetId(newSetId)
    }
  }

  async function handleCancelNewSet(setEntryId: string) {
    await Promise.resolve(onDeleteSet(entry.id, setEntryId))
    setCreatingSetId((current) => (current === setEntryId ? null : current))
    setEditorSetId((current) => (current === setEntryId ? null : current))
  }

  function handleSaveNewSet(setEntryId: string) {
    setCreatingSetId((current) => (current === setEntryId ? null : current))
    setEditorSetId((current) => (current === setEntryId ? null : current))
  }

  const displayUnit = unit
  const editorWeightStep =
    displayUnit === "kg" ? (settings?.kgStep ?? 1) : (settings?.lbStep ?? 2.5)

  function openEditor(setId: string) {
    const nextSet = activeSets.find((setEntry) => setEntry.id === setId)

    if (!nextSet) {
      return
    }

    setDraftWeight(formatWeightValue(nextSet.weight ?? 0, displayUnit))
    setDraftReps(formatNumber(nextSet.reps ?? 0))
    setEditorSetId(setId)
  }

  function closeEditor() {
    if (creatingSetId && editorSetId === creatingSetId) {
      void handleCancelNewSet(creatingSetId)
      return
    }

    setEditorSetId(null)
    setDraftWeight("")
    setDraftReps("")
  }

  function incrementDraft(
    field: "weight" | "reps",
    step: number,
    currentValue: string
  ) {
    const parsed = Number(currentValue.replace(",", "."))
    const baseValue = Number.isFinite(parsed) ? parsed : 0
    const nextValue = Math.max(0, baseValue + step)
    const formattedValue = formatNumber(nextValue)

    if (field === "weight") {
      setDraftWeight(formattedValue)
      return
    }

    setDraftReps(formattedValue)
  }

  function parseDraftValue(value: string, fallback: number) {
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback
  }

  function handleSaveSet(setId: string) {
    const currentSet = activeSets.find((setEntry) => setEntry.id === setId)

    if (!currentSet) {
      return
    }

    const currentDisplayedWeight = Number(
      formatWeightValue(currentSet.weight ?? 0, displayUnit).replace(",", ".")
    )
    const nextWeight = parseDraftValue(draftWeight, currentDisplayedWeight)
    const nextReps = parseDraftValue(draftReps, currentSet.reps ?? 0)

    onUpdateNumber(
      entry.id,
      setId,
      "weight",
      convertDisplayedWeightToKg(nextWeight, displayUnit)
    )
    onUpdateNumber(entry.id, setId, "reps", nextReps)

    if (creatingSetId === setId) {
      handleSaveNewSet(setId)
      return
    }

    setEditorSetId(null)
    setDraftWeight("")
    setDraftReps("")
  }

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
                  <X />
                  {dictionary.actions.deleteExercise}
                </Button>
              </PopoverPopup>
            </PopoverPositioner>
          </Popover>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        {activeSets.map((set, index) => {
          const setWeight = set.weight ?? 0
          const setReps = set.reps ?? 0
          const isCreatingSet = creatingSetId === set.id

          return (
            <Popover
              key={set.id}
              open={editorSetId === set.id && editorSet != null}
              onOpenChange={(open) => {
                if (!open) {
                  if (isCreatingSet) {
                    return
                  }
                  closeEditor()
                } else {
                  openEditor(set.id)
                }
              }}
            >
              <PopoverTrigger
                render={
                  <button
                    className="inline-flex min-w-[4.5rem] flex-col items-center justify-center rounded-xl bg-muted/50 px-2.5 py-2.5 text-center transition-colors hover:bg-muted"
                    type="button"
                    aria-label={`${exerciseName} set ${index + 1}`}
                    onClick={() => openEditor(set.id)}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <span>{formatWeightValue(setWeight, displayUnit)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {getWeightUnitLabel(dictionary, displayUnit)}
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
                      aria-label={dictionary.actions.cancel}
                      className="text-muted-foreground"
                      onClick={() => closeEditor()}
                    >
                      <X />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <SetNumberControl
                      ariaLabel={`${exerciseName} set ${index + 1} ${getWeightUnitLabel(
                        dictionary,
                        displayUnit
                      )}`}
                      decreaseLabel={dictionary.actions.decrease}
                      increaseLabel={dictionary.actions.increase}
                      step={editorWeightStep}
                      suffix={getWeightUnitLabel(dictionary, displayUnit)}
                      value={draftWeight}
                      onChange={setDraftWeight}
                      onIncrement={(delta) =>
                        incrementDraft("weight", delta, draftWeight)
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
                      value={draftReps}
                      onChange={setDraftReps}
                      onIncrement={(delta) =>
                        incrementDraft("reps", delta, draftReps)
                      }
                    />
                  </div>

                  <div className="mt-3 flex justify-start">
                    {isCreatingSet ? (
                      <div className="flex w-full justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={() => {
                            void handleCancelNewSet(set.id)
                          }}
                        >
                          {dictionary.actions.cancel}
                        </Button>
                        <Button
                          variant="default"
                          size="default"
                          onClick={() => handleSaveSet(set.id)}
                        >
                          {dictionary.actions.save}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex w-full justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="default"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            void Promise.resolve(onDeleteSet(entry.id, set.id))
                            setEditorSetId(null)
                            setDraftWeight("")
                            setDraftReps("")
                          }}
                        >
                          {dictionary.actions.deleteSet}
                        </Button>
                        <Button
                          variant="default"
                          size="default"
                          onClick={() => handleSaveSet(set.id)}
                        >
                          {dictionary.actions.save}
                        </Button>
                      </div>
                    )}
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
