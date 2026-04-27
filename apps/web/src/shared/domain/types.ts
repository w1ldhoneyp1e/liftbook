export type Locale = "en" | "ru"

export type WeightUnit = "kg" | "lb"

export type DateState = "past" | "today" | "future"

export type SyncStatus = "pending" | "synced" | "conflict"

export type SyncMetadata = {
  serverId?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  syncStatus: SyncStatus
}

export type MuscleGroupId =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "glutes"
  | "cardio"
  | "full_body"
  | "other"

export type ExerciseTrackingMode =
  | "weight_reps"
  | "bodyweight_reps"
  | "time"
  | "distance_time"
  | "weighted_bodyweight"

export type LocalizedText = Record<Locale, string>

export type Exercise = {
  id: string
  name: LocalizedText
  muscleGroupIds: MuscleGroupId[]
  trackingMode: ExerciseTrackingMode
  builtIn: boolean
} & Partial<SyncMetadata>

export type SetEntry = {
  id: string
  weight?: number
  weightUnit?: WeightUnit
  reps?: number
  durationSeconds?: number
  distanceMeters?: number
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export type ExerciseEntry = {
  id: string
  exerciseId: string
  workoutDate: string
  position: number
  setEntries: SetEntry[]
  previousResultSourceId?: string
  createdAt: string
  updatedAt: string
} & Partial<SyncMetadata>

export type WorkoutDay = {
  id: string
  date: string
  localOwnerId: string
  inferredDurationSeconds?: number
  createdAt: string
  updatedAt: string
} & Partial<SyncMetadata>

export type UserSettings = {
  id: "local"
  locale: Locale
  weightUnit: WeightUnit
  kgStep: number
  lbStep: number
  repsStep: number
  autoRestTimer: boolean
  previousResultDefaults: boolean
  updatedAt: string
} & Partial<SyncMetadata>
