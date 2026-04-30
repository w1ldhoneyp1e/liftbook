"use client"

import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react"
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
  onDeleteCustomExercise: (exerciseId: string) => void
  onRenameCustomExercise: (exerciseId: string, name: string) => void
  onSelectExercise: (exerciseId: string) => void
}

export function ExercisePickerDrawer({
  dictionary,
  exercises,
  locale,
  open,
  onOpenChange,
  onCreateCustomExercise,
  onDeleteCustomExercise,
  onRenameCustomExercise,
  onSelectExercise,
}: ExercisePickerDrawerProps) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState<MuscleGroupId | null>(null)
  const [query, setQuery] = useState("")
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  function resetFilters() {
    setSelectedMuscleGroup(null)
    setQuery("")
    setEditingExerciseId(null)
    setEditingName("")
  }

  const filteredExercises = exercises
    .filter((exercise) => !exercise.deletedAt)
    .filter((exercise) => {
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery =
        normalizedQuery.length === 0 ||
        exercise.name[locale].toLowerCase().includes(normalizedQuery)
      const matchesMuscleGroup =
        normalizedQuery.length > 0 ||
        !selectedMuscleGroup ||
        exercise.muscleGroupIds.includes(selectedMuscleGroup)

      return matchesQuery && matchesMuscleGroup
    })
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale]))
  const canCreateCustomExercise = query.trim().length > 0

  function startRename(exercise: Exercise) {
    setEditingExerciseId(exercise.id)
    setEditingName(exercise.name[locale])
  }

  function cancelRename() {
    setEditingExerciseId(null)
    setEditingName("")
  }

  function saveRename(exerciseId: string) {
    onRenameCustomExercise(exerciseId, editingName)
    cancelRename()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          resetFilters()
        }

        onOpenChange(nextOpen)
      }}
    >
      <DrawerContent className="mx-auto max-h-[92svh] max-w-md rounded-t-xl bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle>{dictionary.actions.chooseExercise}</DrawerTitle>
          <DrawerDescription>{dictionary.labels.searchExercise}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-hidden px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-border/60 pl-9 focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder={dictionary.labels.searchExercise}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <button
              className={`h-8 rounded-lg px-3 text-sm ${
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
                className={`h-8 rounded-lg px-3 text-sm ${
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

            {filteredExercises.map((exercise) => {
              const editing = editingExerciseId === exercise.id

              return (
                <div
                  key={exercise.id}
                  className="rounded-lg border border-border px-3 py-3"
                >
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-9"
                        aria-label={dictionary.actions.renameCustomExercise}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            saveRename(exercise.id)
                          }

                          if (event.key === "Escape") {
                            cancelRename()
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={dictionary.actions.save}
                        onClick={() => saveRename(exercise.id)}
                      >
                        <Check />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={dictionary.actions.cancel}
                        onClick={cancelRename}
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between gap-2">
                      <button
                        className="min-w-0 flex-1 text-left"
                        type="button"
                        onClick={() => onSelectExercise(exercise.id)}
                      >
                        <span className="block text-sm font-medium">
                          {exercise.name[locale]}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {exercise.muscleGroupIds
                            .map(
                              (muscleGroup) =>
                                dictionary.muscleGroups[muscleGroup]
                            )
                            .join(", ")}
                        </span>
                      </button>
                      <span className="flex items-center gap-1">
                        {!exercise.builtIn ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={
                                dictionary.actions.renameCustomExercise
                              }
                              onClick={(event) => {
                                event.stopPropagation()
                                startRename(exercise)
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={
                                dictionary.actions.deleteCustomExercise
                              }
                              onClick={(event) => {
                                event.stopPropagation()
                                onDeleteCustomExercise(exercise.id)
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        ) : null}
                        <Plus className="size-4 text-muted-foreground" />
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
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
