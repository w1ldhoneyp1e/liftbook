'use client'

import {
	ArrowLeft,
	ArrowRight,
	CalendarDays,
	Settings,
} from 'lucide-react'
import {
	useEffect,
	useLayoutEffect,
	useRef,
} from 'react'
import {
	type DateStripItem,
	getDateButtonClassName,
	getDateTone,
} from '../lib/date-utils'
import {getMuscleGroupColor} from '../lib/muscle-group-colors'
import {AuthPopover} from './auth-popover'
import {Button} from '@/components/ui/button'
import {
	type AccountSession,
	type DateState,
	type MuscleGroupId,
} from '@/shared/domain/types'
import {type Dictionary} from '@/shared/i18n/dictionaries'

type DateHeaderProps = {
	accountConnecting: boolean,
	accountError: boolean,
	accountSession: AccountSession | null,
	authError: string | null,
	authNotice: string | null,
	authSubmitting: boolean,
	dateStatusLabel: string,
	dateMuscleGroups: Record<string, MuscleGroupId[]>,
	days: DateStripItem[],
	dateStripCenterDate: string,
	dictionary: Dictionary,
	isDraggingDay: boolean,
	motion: 'left' | 'right' | null,
	selectedDate: string,
	selectedDateState: DateState,
	today: string,
	visualDate: string,
	onCreateGuestAccount: () => void,
	onLoginAccount: (email: string, password: string) => Promise<void> | void,
	onLogoutAccount: () => Promise<void> | void,
	onOpenCalendar: () => void,
	onOpenSettings: () => void,
	onRegisterAccount: (email: string, password: string) => Promise<void> | void,
	onResendVerificationEmail: () => Promise<void> | void,
	onDateStripSettled: (dateKey: string) => void,
	onSelectDate: (dateKey: string) => void,
}

export function DateHeader({
	accountConnecting,
	accountError,
	accountSession,
	authError,
	authNotice,
	authSubmitting,
	dateStatusLabel,
	dateMuscleGroups,
	dateStripCenterDate,
	days,
	dictionary,
	isDraggingDay,
	motion,
	selectedDate,
	selectedDateState,
	today,
	visualDate,
	onCreateGuestAccount,
	onLoginAccount,
	onLogoutAccount,
	onOpenCalendar,
	onOpenSettings,
	onRegisterAccount,
	onResendVerificationEmail,
	onDateStripSettled,
	onSelectDate,
}: DateHeaderProps) {
	const dateTone = getDateTone(selectedDateState)
	const dateStripRef = useRef<HTMLDivElement | null>(null)
	const selectedDateRef = useRef<HTMLButtonElement | null>(null)
	const lastScrolledSelectedDateRef = useRef<string | null>(null)
	const dateScrollAnimationRef = useRef<number | null>(null)

	useLayoutEffect(() => {
		if (dateStripCenterDate !== selectedDate || isDraggingDay) {
			return
		}

		const container = dateStripRef?.current
		const selectedButton = selectedDateRef.current

		if (!container || !selectedButton) {
			return
		}

		const containerRect = container.getBoundingClientRect()
		const buttonRect = selectedButton.getBoundingClientRect()
		const targetLeft
      = container.scrollLeft
      + buttonRect.left
      - containerRect.left
      - (container.clientWidth - selectedButton.offsetWidth) / 2
		const maxLeft = container.scrollWidth - container.clientWidth

		container.scrollLeft = Math.max(0, Math.min(targetLeft, maxLeft))
		lastScrolledSelectedDateRef.current = selectedDate
	}, [dateStripCenterDate, dateStripRef, isDraggingDay, selectedDate])

	useEffect(() => {
		if (isDraggingDay || dateStripCenterDate === selectedDate) {
			return
		}

		if (lastScrolledSelectedDateRef.current === selectedDate) {
			return
		}

		lastScrolledSelectedDateRef.current = selectedDate
		const container = dateStripRef?.current
		const selectedButton = selectedDateRef.current

		if (!container || !selectedButton) {
			onDateStripSettled(selectedDate)
			return
		}

		const animatedContainer = container

		if (dateScrollAnimationRef.current !== null) {
			window.cancelAnimationFrame(dateScrollAnimationRef.current)
			dateScrollAnimationRef.current = null
		}

		const containerRect = container.getBoundingClientRect()
		const buttonRect = selectedButton.getBoundingClientRect()
		const startLeft = container.scrollLeft
		const targetLeft
      = startLeft
      + buttonRect.left
      - containerRect.left
      - (container.clientWidth - selectedButton.offsetWidth) / 2
		const maxLeft = container.scrollWidth - container.clientWidth
		const endLeft = Math.max(0, Math.min(targetLeft, maxLeft))
		const distance = endLeft - startLeft
		const durationMs = 280
		const startedAt = performance.now()

		if (Math.abs(distance) < 1) {
			onDateStripSettled(selectedDate)
			return
		}

		function animate(now: number) {
			const progress = Math.min((now - startedAt) / durationMs, 1)
			const easedProgress = 1 - (1 - progress) ** 3

			animatedContainer.scrollLeft = startLeft + distance * easedProgress

			if (progress < 1) {
				dateScrollAnimationRef.current = window.requestAnimationFrame(animate)
				return
			}

			dateScrollAnimationRef.current = null
			onDateStripSettled(selectedDate)
		}

		dateScrollAnimationRef.current = window.requestAnimationFrame(animate)

		return () => {
			if (dateScrollAnimationRef.current !== null) {
				window.cancelAnimationFrame(dateScrollAnimationRef.current)
				dateScrollAnimationRef.current = null
			}
		}
	}, [
		dateStripCenterDate,
		dateStripRef,
		isDraggingDay,
		onDateStripSettled,
		selectedDate,
	])

	return (
		<header className={`px-4 pb-3 pt-4 ${dateTone.headerClassName}`}>
			<div className="flex items-center justify-between">
				<div>
					<p className={`text-sm font-medium ${dateTone.labelClassName}`}>
						{dateStatusLabel}
					</p>
					<h1 className="text-2xl font-semibold">{'Liftbook'}</h1>
				</div>
				<div className="flex gap-2">
					{selectedDate !== today
						? (
							<Button
								variant="outline"
								size="icon-lg"
								aria-label={dictionary.actions.goToToday}
								onClick={() => onSelectDate(today)}
							>
								{selectedDateState === 'future'
									? <ArrowLeft />
									: <ArrowRight />}
							</Button>
						)
						: null}
					<AuthPopover
						accountConnecting={accountConnecting}
						accountError={accountError}
						accountSession={accountSession}
						authError={authError}
						authNotice={authNotice}
						authSubmitting={authSubmitting}
						dictionary={dictionary}
						onCreateGuestAccount={onCreateGuestAccount}
						onLoginAccount={onLoginAccount}
						onLogoutAccount={onLogoutAccount}
						onRegisterAccount={onRegisterAccount}
						onResendVerificationEmail={onResendVerificationEmail}
					/>
					<Button
						variant="outline"
						size="icon-lg"
						aria-label={dictionary.actions.calendar}
						onClick={onOpenCalendar}
					>
						<CalendarDays />
					</Button>
					<Button
						variant="outline"
						size="icon-lg"
						aria-label={dictionary.actions.settings}
						onClick={onOpenSettings}
					>
						<Settings />
					</Button>
				</div>
			</div>
			<div
				ref={dateStripRef}
				className={`mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isDraggingDay
            ? ''
            : motion === 'left'
              ? 'animate-[date-strip-slide-left_180ms_ease-out]'
              : motion === 'right'
                ? 'animate-[date-strip-slide-right_180ms_ease-out]'
                : 'transition-transform duration-200 ease-out'
        }`}
			>
				<div className="flex gap-2">
					{days.map(item => (
						<button
							key={item.dateKey}
							ref={item.dateKey === selectedDate
								? selectedDateRef
								: null}
							className={`min-w-14 rounded-lg px-2 py-2 text-center text-sm ${getDateButtonClassName(
                item.state,
                item.dateKey === visualDate,
              )}`}
							type="button"
							onClick={() => onSelectDate(item.dateKey)}
						>
							<span className="block text-[11px] leading-none">{item.day}</span>
							<span className="mt-1 block text-base font-semibold leading-none">
								{item.date}
							</span>
							<span className="mt-2 flex h-1.5 items-center justify-center gap-1">
								{(dateMuscleGroups[item.dateKey] ?? item.muscleGroupIds)
									.slice(0, 3)
									.map(muscleGroupId => (
										<span
											key={`${item.dateKey}-${muscleGroupId}`}
											className={`size-1.5 rounded-full ${getMuscleGroupColor(muscleGroupId).dotClassName}`}
										/>
									))}
							</span>
						</button>
					))}
				</div>
			</div>
		</header>
	)
}
