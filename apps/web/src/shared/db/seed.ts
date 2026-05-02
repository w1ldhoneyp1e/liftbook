import { starterExercises } from "@/shared/domain/exercise-catalog"
import type {
  ExerciseEntry,
  Locale,
  UserSettings,
  WorkoutDay,
} from "@/shared/domain/types"

import { db } from "./schema"

const localOwnerId = "local"
const today = "2026-04-26"

const now = new Date("2026-04-26T08:00:00.000Z").toISOString()

function getInitialLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en"
  }

  const primaryLanguage = navigator.language.toLowerCase()
  return primaryLanguage.startsWith("ru") ? "ru" : "en"
}

function createDefaultSettings(): UserSettings {
  return {
    id: "local",
    locale: getInitialLocale(),
    themeMode: "system",
    weightUnit: "kg",
    kgStep: 1,
    lbStep: 2.5,
    repsStep: 1,
    autoRestTimer: false,
    previousResultDefaults: true,
    syncStatus: "pending",
    updatedAt: now,
  }
}

const seedEntries: ExerciseEntry[] = [
  {
    id: "entry_bench_press_today",
    exerciseId: "bench_press",
    workoutDate: today,
    position: 0,
    createdAt: now,
    syncStatus: "pending",
    updatedAt: now,
    setEntries: [
      {
        id: "set_bench_press_1",
        weight: 60,
        weightUnit: "kg",
        reps: 8,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "set_bench_press_2",
        weight: 60,
        weightUnit: "kg",
        reps: 8,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "set_bench_press_3",
        weight: 60,
        weightUnit: "kg",
        reps: 7,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: "entry_lat_pulldown_today",
    exerciseId: "lat_pulldown",
    workoutDate: today,
    position: 1,
    createdAt: now,
    syncStatus: "pending",
    updatedAt: now,
    setEntries: [
      {
        id: "set_lat_pulldown_1",
        weight: 45,
        weightUnit: "kg",
        reps: 10,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "set_lat_pulldown_2",
        weight: 45,
        weightUnit: "kg",
        reps: 10,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
]

const seedDay: WorkoutDay = {
  id: `day_${today}`,
  date: today,
  localOwnerId,
  createdAt: now,
  syncStatus: "pending",
  updatedAt: now,
}

export async function seedLocalDatabase() {
  const [settingsCount, dayCount] = await Promise.all([
    db.userSettings.count(),
    db.workoutDays.count(),
  ])

  if (settingsCount === 0) {
    await db.userSettings.put(createDefaultSettings())
  }

  await db.exercises.bulkPut(
    starterExercises.map((exercise) => ({
      ...exercise,
      syncStatus: "synced" as const,
    }))
  )

  if (dayCount === 0) {
    await db.transaction("rw", db.workoutDays, db.exerciseEntries, async () => {
      await db.exerciseEntries.bulkPut(seedEntries)
      await db.workoutDays.put(seedDay)
    })
  }
}
