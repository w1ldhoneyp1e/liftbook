import type { Locale, MuscleGroupId } from "@/shared/domain/types"

import { en } from "./locales/en"
import { ru } from "./locales/ru"

export type Dictionary = {
  actions: {
    add: string
    addExercise: string
    addSet: string
    calendar: string
    cancel: string
    createGuestAccount: string
    keepLocalVersion: string
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
    login: string
    logout: string
    pause: string
    reset: string
    register: string
    renameCustomExercise: string
    save: string
    search: string
    settings: string
    stopwatch: string
    start: string
    syncNow: string
    timer: string
  }
  labels: {
    account: string
    accountConnected: string
    accountGuestConnected: string
    accountLocalOnly: string
    authEmail: string
    authPassword: string
    authRegisteredHint: string
    authRegisterHint: string
    allMuscleGroups: string
    autoRestTimer: string
    autoRestTimerHelp: string
    connectionError: string
    emptyDayMessage: string
    emptyDayOnDate: string
    emptyDayToday: string
    exercises: string
    language: string
    loading: string
    noExercisesFound: string
    futureDate: string
    pastDate: string
    previousResultDefaults: string
    previousResultDefaultsHelp: string
    restTimer: string
    restTimerDuration: string
    restTimerMode: string
    restTimerModeHelp: string
    restTimerSettings: string
    restTimerSound: string
    restTimerSoundHelp: string
    restTimerVibration: string
    restTimerVibrationHelp: string
    searchExercise: string
    syncFailed: string
    syncConflicts: string
    syncConflictsHelp: string
    syncExercise: string
    syncInProgress: string
    syncOffline: string
    syncPending: string
    syncRecords: string
    syncReady: string
    syncSettings: string
    syncSynced: string
    syncStatus: string
    syncSuccess: string
    syncTrainingDay: string
    syncTrainingEntry: string
    theme: string
    themeDark: string
    themeLight: string
    themeSystem: string
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
