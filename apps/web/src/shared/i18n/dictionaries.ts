import type { Locale, MuscleGroupId } from "@/shared/domain/types"

import { en } from "./locales/en"
import { ru } from "./locales/ru"

export type Dictionary = {
  actions: {
    addExercise: string
    addSet: string
    calendar: string
    cancel: string
    createGuestAccount: string
    chooseExercise: string
    createCustomExercise: string
    collapse: string
    collapseAll: string
    deleteExercise: string
    deleteCustomExercise: string
    decrease: string
    deleteSet: string
    expand: string
    expandAll: string
    goToToday: string
    increase: string
    pause: string
    reset: string
    renameCustomExercise: string
    save: string
    search: string
    settings: string
    start: string
    syncNow: string
  }
  labels: {
    account: string
    accountConnected: string
    accountLocalOnly: string
    allMuscleGroups: string
    autoRestTimer: string
    connectionError: string
    exercises: string
    language: string
    loading: string
    noExercisesFound: string
    futureDate: string
    pastDate: string
    previousResultDefaults: string
    restTimer: string
    searchExercise: string
    syncFailed: string
    syncReady: string
    syncStatus: string
    syncSuccess: string
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
