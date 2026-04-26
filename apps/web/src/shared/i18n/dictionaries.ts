import type { Locale, MuscleGroupId } from "@/shared/domain/types"

type Dictionary = {
  actions: {
    addExercise: string
    addSet: string
    calendar: string
    collapse: string
    collapseAll: string
    search: string
    start: string
  }
  labels: {
    exercises: string
    restTimer: string
    today: string
  }
  units: {
    kg: string
    lb: string
    reps: string
  }
  muscleGroups: Record<MuscleGroupId, string>
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    actions: {
      addExercise: "Add exercise",
      addSet: "Add set",
      calendar: "Calendar",
      collapse: "Collapse",
      collapseAll: "Collapse all",
      search: "Search",
      start: "Start",
    },
    labels: {
      exercises: "Exercises",
      restTimer: "Rest timer",
      today: "Today",
    },
    units: {
      kg: "kg",
      lb: "lb",
      reps: "reps",
    },
    muscleGroups: {
      chest: "Chest",
      back: "Back",
      legs: "Legs",
      shoulders: "Shoulders",
      biceps: "Biceps",
      triceps: "Triceps",
      core: "Core",
      glutes: "Glutes",
      cardio: "Cardio",
      full_body: "Full body",
      other: "Other",
    },
  },
  ru: {
    actions: {
      addExercise: "Добавить упражнение",
      addSet: "Добавить подход",
      calendar: "Календарь",
      collapse: "Свернуть",
      collapseAll: "Свернуть все",
      search: "Поиск",
      start: "Старт",
    },
    labels: {
      exercises: "Упражнения",
      restTimer: "Таймер отдыха",
      today: "Сегодня",
    },
    units: {
      kg: "кг",
      lb: "lb",
      reps: "повт.",
    },
    muscleGroups: {
      chest: "Грудь",
      back: "Спина",
      legs: "Ноги",
      shoulders: "Плечи",
      biceps: "Бицепс",
      triceps: "Трицепс",
      core: "Кор",
      glutes: "Ягодицы",
      cardio: "Кардио",
      full_body: "Все тело",
      other: "Другое",
    },
  },
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}
