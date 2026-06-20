'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'
import {buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {verifyEmailToken} from '@/shared/api/liftbook-api'
import {db} from '@/shared/db/schema'

type VerifyState = 'loading' | 'success' | 'error'

export function VerifyEmailScreen({token}: {token: string}) {
	const [state, setState] = useState<VerifyState>('loading')
	const [message, setMessage] = useState('Проверяем ссылку...')

	useEffect(() => {
		let cancelled = false

		async function run() {
			if (!token) {
				setState('error')
				setMessage('Ссылка подтверждения неполная')
				return
			}

			try {
				const response = await verifyEmailToken(token)
				const currentSession = await db.accountSessions.get('local')

				if (
					currentSession
          && currentSession.kind === 'account'
          && (currentSession.userId === response.user.id
            || currentSession.email === response.user.email)
				) {
					await db.accountSessions.put({
						...currentSession,
						email: response.user.email,
						emailVerified: response.user.emailVerified,
						updatedAt: new Date().toISOString(),
					})
				}

				if (cancelled) {
					return
				}

				setState('success')
				setMessage('Почта подтверждена. Можно возвращаться в Liftbook.')
			}
			catch (error) {
				if (cancelled) {
					return
				}

				setState('error')
				setMessage(
					error instanceof Error
						? error.message
						: 'Не удалось подтвердить почту',
				)
			}
		}

		void run()

		return () => {
			cancelled = true
		}
	}, [token])

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/35 px-4 py-10 text-foreground dark:bg-[#0b0d11]">
			<section className="w-full max-w-sm rounded-3xl border border-border/60 bg-background/96 p-6 shadow-xl">
				<h1 className="text-xl font-semibold">{'Liftbook'}</h1>
				<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
					{message}
				</p>
				<div className="mt-5">
					<Link
						href="/"
						className={cn(
							buttonVariants({variant: 'default'}),
							'w-full',
							state === 'loading' && 'pointer-events-none opacity-50',
						)}
					>
						{state === 'loading'
							? 'Проверяем...'
							: 'Вернуться в приложение'}
					</Link>
				</div>
			</section>
		</main>
	)
}
