import type { Dictionary } from "@/shared/i18n/dictionaries"
import type { WeightUnit } from "@/shared/domain/types"

const KG_IN_LB = 2.2046226218

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value)
}

export function roundWeightForDisplay(value: number, unit: WeightUnit) {
  if (unit === "kg") {
    return value
  }

  return Math.round(value * KG_IN_LB * 10) / 10
}

export function convertDisplayedWeightToKg(value: number, unit: WeightUnit) {
  if (unit === "kg") {
    return value
  }

  return Math.round((value / KG_IN_LB) * 1000) / 1000
}

export function formatWeightValue(weightInKg: number, unit: WeightUnit) {
  return formatNumber(roundWeightForDisplay(weightInKg, unit))
}

export function getWeightUnitLabel(
  dictionary: Dictionary,
  unit: WeightUnit
) {
  return dictionary.units[unit]
}

export function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`
}
