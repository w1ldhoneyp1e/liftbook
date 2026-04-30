"use client"

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
  dictionary: Dictionary
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  loading: boolean
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

export function ExerciseList({
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
  onUpdateNumber,
}: ExerciseListProps) {
  return (
    <section className="flex flex-1 flex-col gap-3 px-4 py-4">
      <h2 className="text-base font-semibold">
        {dictionary.labels.exercises}
      </h2>

      {loading ? (
        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          {dictionary.labels.loading}
        </div>
      ) : null}

      {!loading && exerciseEntries.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl bg-muted/20 px-5 py-8 text-center">
          <p className="text-base font-medium text-foreground">
            Add your first exercise today
          </p>
          <p className="max-w-[18rem] text-sm text-muted-foreground">
            {dictionary.actions.addExercise}
          </p>
        </div>
      ) : null}

      {exerciseEntries.map((entry) => (
        <ExerciseCard
          key={entry.id}
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
          onUpdateNumber={onUpdateNumber}
        />
      ))}

      <div className="h-16" />
    </section>
  )
}
