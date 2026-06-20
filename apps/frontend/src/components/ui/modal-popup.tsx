'use client'

import {type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {useOverlayLayerContainer} from './layers'
import {cn} from '@/lib/utils'

type ModalPopupProps = {
	children: ReactNode,
	contentClassName?: string,
	open: boolean,
	onOpenChange: (open: boolean) => void,
}

export function ModalPopup({
	children,
	contentClassName,
	open,
	onOpenChange,
}: ModalPopupProps) {
	const container = useOverlayLayerContainer('popup')

	if (!open || typeof document === 'undefined' || !container) {
		return null
	}

	return createPortal(
		<div className="fixed inset-0 isolate">
			<button
				className={cn(
					'pointer-events-auto absolute inset-0 block h-full w-full bg-black/10 supports-backdrop-filter:backdrop-blur-xs',
				)}
				type="button"
				aria-label="Close popup"
				onClick={() => onOpenChange(false)}
			/>
			<div
				className={cn(
					'pointer-events-none relative flex min-h-full items-center justify-center p-4',
				)}
			>
				<div
					className={cn(
						'pointer-events-auto w-full max-w-sm rounded-2xl border border-border/60 bg-background/96 p-4 shadow-xl',
						contentClassName,
					)}
				>
					{children}
				</div>
			</div>
		</div>,
		container,
	)
}
