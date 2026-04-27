import type { Locale, MuscleGroupId } from "@/shared/domain/types"

import { en } from "./locales/en"
import { ru } from "./locales/ru"

export type Dictionary = {
  actions: {
    addExercise: string
    addSet: string
    calendar: string
    chooseExercise: string
    createCustomExercise: string
    collapse: string
    collapseAll: string
    deleteExercise: string
    decrease: string
    deleteSet: string
    expand: string
    expandAll: string
    goToToday: string
    increase: string
    pause: string
    reset: string
    search: string
    settings: string
    start: string
  }
  labels: {
    allMuscleGroups: string
    autoRestTimer: string
    exercises: string
    language: string
    loading: string
    noExercisesFound: string
    futureDate: string
    pastDate: string
    previousResultDefaults: string
    restTimer: string
    searchExercise: string
    today: string
    weightUnit: string
  }
  units: {
    kg: string
    lb: string
    reps: string
  }
  muscleGroups: Record<MuscleGroupId, string>
}

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}
