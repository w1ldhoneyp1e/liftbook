import {type WeightUnit} from '@/shared/domain/types'
import {type Dictionary} from '@/shared/i18n/dictionaries'

const KG_IN_LB = 2.2046226218

function formatNumber(value: number) {
	return Number.isInteger(value)
		? String(value)
		: String(value)
}

function roundWeightForDisplay(value: number, unit: WeightUnit) {
	if (unit === 'kg') {
		return value
	}

	return Math.round(value * KG_IN_LB * 10) / 10
}

function convertDisplayedWeightToKg(value: number, unit: WeightUnit) {
	if (unit === 'kg') {
		return value
	}

	return Math.round((value / KG_IN_LB) * 1000) / 1000
}

function formatWeightValue(weightInKg: number, unit: WeightUnit) {
	return formatNumber(roundWeightForDisplay(weightInKg, unit))
}

function getWeightUnitLabel(
	dictionary: Dictionary,
	unit: WeightUnit,
) {
	return dictionary.units[unit]
}

function formatTimer(seconds: number) {
	const minutes = Math.floor(seconds / 60)
	const restSeconds = seconds % 60

	return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}

export {
	formatNumber,
	roundWeightForDisplay,
	convertDisplayedWeightToKg,
	formatWeightValue,
	getWeightUnitLabel,
	formatTimer,
}
