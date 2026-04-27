import Dexie, { type EntityTable } from "dexie"

import type {
  Exercise,
  ExerciseEntry,
  UserSettings,
  WorkoutDay,
} from "@/shared/domain/types"

export class LiftbookDb extends Dexie {
  exercises!: EntityTable<Exercise, "id">
  workoutDays!: EntityTable<WorkoutDay, "id">
  exerciseEntries!: EntityTable<ExerciseEntry, "id">
  userSettings!: EntityTable<UserSettings, "id">

  constructor() {
    super("liftbook")

    this.version(1).stores({
      exercises: "id, builtIn, *muscleGroupIds, trackingMode",
      workoutDays: "id, date, localOwnerId, updatedAt",
      exerciseEntries: "id, workoutDate, exerciseId, position, updatedAt",
      userSettings: "id, locale, weightUnit, updatedAt",
    })

    this.version(2).stores({
      exercises:
        "id, builtIn, *muscleGroupIds, trackingMode, updatedAt, deletedAt, syncStatus",
      workoutDays:
        "id, date, localOwnerId, updatedAt, deletedAt, syncStatus",
      exerciseEntries:
        "id, workoutDate, exerciseId, position, updatedAt, deletedAt, syncStatus",
      userSettings: "id, locale, weightUnit, updatedAt, deletedAt, syncStatus",
    })
  }
}

export const db = new LiftbookDb()
