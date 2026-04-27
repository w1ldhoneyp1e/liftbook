import type { Exercise, MuscleGroupId } from "./types"

export const muscleGroups: MuscleGroupId[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "biceps",
  "triceps",
  "core",
  "glutes",
  "cardio",
  "full_body",
  "other",
]

export const starterExercises: Exercise[] = [
  exercise("bench_press", "Bench press", "Жим лежа", ["chest", "triceps"]),
  exercise("incline_dumbbell_press", "Incline dumbbell press", "Жим гантелей на наклонной", ["chest"]),
  exercise("dumbbell_bench_press", "Dumbbell bench press", "Жим гантелей лежа", ["chest", "triceps"]),
  exercise("chest_fly", "Chest fly", "Разведение рук на грудь", ["chest"]),
  exercise("cable_crossover", "Cable crossover", "Кроссовер на блоках", ["chest"]),
  exercise("push_up", "Push-up", "Отжимания", ["chest", "triceps"], "bodyweight_reps"),

  exercise("lat_pulldown", "Lat pulldown", "Тяга верхнего блока", ["back"]),
  exercise("seated_cable_row", "Seated cable row", "Горизонтальная тяга", ["back"]),
  exercise("barbell_row", "Barbell row", "Тяга штанги в наклоне", ["back"]),
  exercise("dumbbell_row", "Dumbbell row", "Тяга гантели в наклоне", ["back"]),
  exercise("pull_up", "Pull-up", "Подтягивания", ["back", "biceps"], "bodyweight_reps"),
  exercise("assisted_pull_up", "Assisted pull-up", "Подтягивания с поддержкой", ["back", "biceps"]),
  exercise("back_extension", "Back extension", "Гиперэкстензия", ["back", "glutes"], "bodyweight_reps"),

  exercise("barbell_squat", "Barbell squat", "Присед со штангой", ["legs", "glutes"]),
  exercise("leg_press", "Leg press", "Жим ногами", ["legs", "glutes"]),
  exercise("leg_extension", "Leg extension", "Разгибание ног", ["legs"]),
  exercise("lying_leg_curl", "Lying leg curl", "Сгибание ног лежа", ["legs"]),
  exercise("romanian_deadlift", "Romanian deadlift", "Румынская тяга", ["legs", "glutes", "back"]),
  exercise("walking_lunge", "Walking lunge", "Выпады в ходьбе", ["legs", "glutes"]),
  exercise("standing_calf_raise", "Standing calf raise", "Подъемы на носки стоя", ["legs"]),
  exercise("seated_calf_raise", "Seated calf raise", "Подъемы на носки сидя", ["legs"]),

  exercise("shoulder_press", "Shoulder press", "Жим на плечи", ["shoulders", "triceps"]),
  exercise("dumbbell_lateral_raise", "Dumbbell lateral raise", "Махи гантелями в стороны", ["shoulders"]),
  exercise("rear_delt_fly", "Rear delt fly", "Разведение на заднюю дельту", ["shoulders"]),
  exercise("front_raise", "Front raise", "Подъем перед собой", ["shoulders"]),
  exercise("face_pull", "Face pull", "Тяга каната к лицу", ["shoulders", "back"]),

  exercise("barbell_curl", "Barbell curl", "Подъем штанги на бицепс", ["biceps"]),
  exercise("dumbbell_curl", "Dumbbell curl", "Подъем гантелей на бицепс", ["biceps"]),
  exercise("hammer_curl", "Hammer curl", "Молотковые сгибания", ["biceps"]),
  exercise("preacher_curl", "Preacher curl", "Сгибания на скамье Скотта", ["biceps"]),

  exercise("triceps_pushdown", "Triceps pushdown", "Разгибание рук на блоке", ["triceps"]),
  exercise("overhead_triceps_extension", "Overhead triceps extension", "Разгибание из-за головы", ["triceps"]),
  exercise("close_grip_bench_press", "Close-grip bench press", "Жим узким хватом", ["triceps", "chest"]),
  exercise("dip", "Dip", "Отжимания на брусьях", ["triceps", "chest"], "bodyweight_reps"),

  exercise("plank", "Plank", "Планка", ["core"], "time"),
  exercise("side_plank", "Side plank", "Боковая планка", ["core"], "time"),
  exercise("crunch", "Crunch", "Скручивания", ["core"], "bodyweight_reps"),
  exercise("hanging_leg_raise", "Hanging leg raise", "Подъем ног в висе", ["core"], "bodyweight_reps"),
  exercise("cable_crunch", "Cable crunch", "Скручивания на блоке", ["core"]),

  exercise("hip_thrust", "Hip thrust", "Ягодичный мост со штангой", ["glutes"]),
  exercise("glute_bridge", "Glute bridge", "Ягодичный мост", ["glutes"], "bodyweight_reps"),
  exercise("cable_kickback", "Cable kickback", "Отведение ноги в кроссовере", ["glutes"]),

  exercise("treadmill_run", "Treadmill run", "Беговая дорожка", ["cardio"], "distance_time"),
  exercise("stationary_bike", "Stationary bike", "Велотренажер", ["cardio"], "distance_time"),
  exercise("rowing_machine", "Rowing machine", "Гребной тренажер", ["cardio", "full_body"], "distance_time"),

  exercise("deadlift", "Deadlift", "Становая тяга", ["full_body", "back", "legs"]),
  exercise("clean_and_press", "Clean and press", "Взятие и жим", ["full_body"]),
  exercise("burpee", "Burpee", "Берпи", ["full_body"], "bodyweight_reps"),

  exercise("shrug", "Shrug", "Шраги", ["other", "shoulders"]),
  exercise("wrist_curl", "Wrist curl", "Сгибание кистей", ["other"]),
]

function exercise(
  id: string,
  en: string,
  ru: string,
  muscleGroupIds: MuscleGroupId[],
  trackingMode: Exercise["trackingMode"] = "weight_reps"
): Exercise {
  return {
    id,
    name: { en, ru },
    muscleGroupIds,
    trackingMode,
    builtIn: true,
  }
}
