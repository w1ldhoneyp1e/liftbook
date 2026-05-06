"use client"

import Image from "next/image"
import { memo } from "react"

import type {
  Exercise,
  ExerciseEntry,
  Locale,
  UserSettings,
  WeightUnit,
} from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

import { Button } from "@/components/ui/button"
import { ExerciseCard } from "./exercise-card"

type ExerciseListProps = {
  dictionary: Dictionary
  exerciseEntries: ExerciseEntry[]
  exercisesById: Record<string, Exercise>
  loadError: string | null
  loading: boolean
  locale: Locale
  onOpenExercisePicker: () => void
  repsStep: number
  settings: UserSettings | null
  unit: WeightUnit
  onAddSet: (exerciseEntryId: string) => Promise<string | null>
  onDeleteExercise: (exerciseEntryId: string) => void
  onDeleteSet: (
    exerciseEntryId: string,
    setEntryId: string
  ) => Promise<void> | void
  onUpdateSet: (
    exerciseEntryId: string,
    setEntryId: string,
    patch: Partial<{ reps: number; weight: number }>
  ) => Promise<void> | void
}

export const ExerciseList = memo(function ExerciseList({
  dictionary,
  exerciseEntries,
  exercisesById,
  loadError,
  loading,
  locale,
  onOpenExercisePicker,
  repsStep,
  settings,
  unit,
  onAddSet,
  onDeleteExercise,
  onDeleteSet,
  onUpdateSet,
}: ExerciseListProps) {
  return (
    <section className="flex flex-1 flex-col gap-4 px-4 py-4">
      {loading ? (
        <div className="rounded-xl bg-muted/40 p-4 text-base text-muted-foreground">
          {dictionary.labels.loading}
        </div>
      ) : null}

      {!loading && loadError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {!loading && !loadError && exerciseEntries.length === 0 ? (
        <div className="flex min-h-[52svh] flex-col items-center justify-center gap-4 px-5 py-8 text-center">
          <div className="relative h-36 w-full max-w-[220px] dark:hidden">
            <Image
              src="/images/empty-state-blue.png"
              alt=""
              fill
              sizes="220px"
              className="object-contain"
              priority
            />
          </div>
          <p className="text-lg font-medium text-foreground">
            {dictionary.labels.emptyDayMessage}
          </p>
          <Button
            variant="default"
            size="default"
            className="min-w-28"
            onClick={onOpenExercisePicker}
          >
            {dictionary.actions.add}
          </Button>
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
          onUpdateSet={onUpdateSet}
        />
      ))}

      <div className="h-16" />
    </section>
  )
})

ExerciseList.displayName = "ExerciseList"
