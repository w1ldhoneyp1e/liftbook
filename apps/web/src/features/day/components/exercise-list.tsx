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
  selectedDate: string
  settings: UserSettings | null
  today: string
  unit: WeightUnit
  onAddSet: (exerciseEntryId: string) => Promise<string | null>
  onDeleteExercise: (exerciseEntryId: string) => void
  onDeleteSet: (
    exerciseEntryId: string,
    setEntryId: string
  ) => Promise<void> | void
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
  selectedDate,
  settings,
  today,
  unit,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
  onIncrementNumber,
  onUpdateNumber,
}: ExerciseListProps) {
  const emptyDayLabel =
    selectedDate === today
      ? dictionary.labels.emptyDayToday
      : dictionary.labels.emptyDayOnDate.replace(
          "{date}",
          new Intl.DateTimeFormat(locale, {
            day: "2-digit",
            month: "2-digit",
          }).format(new Date(`${selectedDate}T12:00:00`))
        )

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 py-4">
      {loading ? (
        <div className="rounded-xl bg-muted/40 p-4 text-base text-muted-foreground">
          {dictionary.labels.loading}
        </div>
      ) : null}

      {!loading && exerciseEntries.length === 0 ? (
        <div className="flex min-h-[52svh] flex-col items-center justify-center gap-3 px-5 py-8 text-center">
          <p className="text-lg font-medium text-foreground">
            {emptyDayLabel}
          </p>
          <p className="max-w-[18rem] text-base text-muted-foreground">
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
