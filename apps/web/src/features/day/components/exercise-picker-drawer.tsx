"use client"

import { Plus, Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { muscleGroups } from "@/shared/domain/exercise-catalog"
import type { Exercise, Locale, MuscleGroupId } from "@/shared/domain/types"
import type { Dictionary } from "@/shared/i18n/dictionaries"

type ExercisePickerDrawerProps = {
  dictionary: Dictionary
  exercises: Exercise[]
  locale: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCustomExercise: (name: string, muscleGroupId: MuscleGroupId) => void
  onSelectExercise: (exerciseId: string) => void
}

export function ExercisePickerDrawer({
  dictionary,
  exercises,
  locale,
  open,
  onOpenChange,
  onCreateCustomExercise,
  onSelectExercise,
}: ExercisePickerDrawerProps) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroupId | null>(null)
  const [query, setQuery] = useState("")

  const filteredExercises = exercises
    .filter(
      (exercise) =>
        !selectedMuscleGroup ||
        exercise.muscleGroupIds.includes(selectedMuscleGroup)
    )
    .filter((exercise) =>
      exercise.name[locale].toLowerCase().includes(query.trim().toLowerCase())
    )
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]))
  const canCreateCustomExercise = query.trim().length > 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-t-xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.chooseExercise}</DrawerTitle>
          <DrawerDescription>{dictionary.labels.searchExercise}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-hidden px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder={dictionary.labels.searchExercise}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              className={`h-8 shrink-0 rounded-lg px-3 text-sm ${
                selectedMuscleGroup === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
              type="button"
              onClick={() => setSelectedMuscleGroup(null)}
            >
              {dictionary.labels.allMuscleGroups}
            </button>
            {muscleGroups.map((muscleGroup) => (
              <button
                key={muscleGroup}
                className={`h-8 shrink-0 rounded-lg px-3 text-sm ${
                  selectedMuscleGroup === muscleGroup
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
                type="button"
                onClick={() => setSelectedMuscleGroup(muscleGroup)}
              >
                {dictionary.muscleGroups[muscleGroup]}
              </button>
            ))}
          </div>

          <div className="max-h-[58svh] space-y-2 overflow-y-auto pb-2">
            {filteredExercises.length === 0 ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                {dictionary.labels.noExercisesFound}
              </div>
            ) : null}

            {filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-3 text-left"
                type="button"
                onClick={() => onSelectExercise(exercise.id)}
              >
                <span>
                  <span className="block text-sm font-medium">
                    {exercise.name[locale]}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {exercise.muscleGroupIds
                      .map((muscleGroup) => dictionary.muscleGroups[muscleGroup])
                      .join(", ")}
                  </span>
                </span>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={!canCreateCustomExercise}
            onClick={() =>
              onCreateCustomExercise(query.trim(), selectedMuscleGroup ?? "other")
            }
          >
            <Plus />
            {dictionary.actions.createCustomExercise}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
