"use client"

import { ChevronsDown, ChevronsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import type {
  Exercise,
  ExerciseEntry,
  Locale,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

import { ExerciseCard } from "./exercise-card"

type ExerciseListProps = {
  allExercisesCollapsed: boolean
  collapsedExerciseIds: string[]
  dictionary: Dictionary
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  loading: boolean
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
  onToggleAllExercises: () => void
  onToggleExercise: (exerciseEntryId: string) => void
  onUpdateNumber: (
    exerciseEntryId: string,
    setEntryId: string,
    field: "reps" | "weight",
    value: number
  ) => void
}

export function ExerciseList({
  allExercisesCollapsed,
  collapsedExerciseIds,
  dictionary,
  exerciseEntries,
  exercisesById,
  loading,
  locale,
  repsStep,
  settings,
  unit,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
  onIncrementNumber,
  onToggleAllExercises,
  onToggleExercise,
  onUpdateNumber,
}: ExerciseListProps) {
  return (
    <section className="flex flex-1 flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {dictionary.labels.exercises}
        </h2>
        <Button variant="ghost" size="sm" onClick={onToggleAllExercises}>
          {allExercisesCollapsed ? <ChevronsDown /> : <ChevronsUp />}
          {allExercisesCollapsed
            ? dictionary.actions.expandAll
            : dictionary.actions.collapseAll}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          {dictionary.labels.loading}
        </div>
      ) : null}

      {!loading && exerciseEntries.length === 0 ? (
        <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
          {dictionary.actions.addExercise}
        </div>
      ) : null}

      {exerciseEntries.map((entry) => (
        <ExerciseCard
          key={entry.id}
          collapsed={collapsedExerciseIds.includes(entry.id)}
          dictionary={dictionary}
          entry={entry}
          exercise={exercisesById[entry.exerciseId]}
          locale={locale}
          repsStep={repsStep}
          settings={settings}
          unit={unit}
          onAddSet={onAddSet}
          onDeleteExercise={onDeleteExercise}
          onDeleteSet={onDeleteSet}
          onIncrementNumber={onIncrementNumber}
          onToggle={onToggleExercise}
          onUpdateNumber={onUpdateNumber}
        />
      ))}

      <div className="h-16" />
    </section>
  )
}
