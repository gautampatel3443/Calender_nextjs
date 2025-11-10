'use client'

import { addMonths, endOfMonth, format, getDay, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

type Instance = {
	id: number
	title: string
	date: string
	originalStart: string
	originalEnd: string
}

type Props = {
	initialMonth?: Date
}

export default function Calendar({ initialMonth }: Props) {
	const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth ?? new Date())
	const [instances, setInstances] = useState<Instance[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const firstDayOfMonth = startOfMonth(currentMonth)
	const lastDayOfMonth = endOfMonth(currentMonth)

	const gridDates = useMemo(() => {
		const startWeekday = getDay(firstDayOfMonth) // 0=Sun
		const daysInMonth = lastDayOfMonth.getDate()
		const leadingEmpty = startWeekday
		const totalCells = leadingEmpty + daysInMonth
		const rows = Math.ceil(totalCells / 7)
		return Array.from({ length: rows * 7 }, (_, i) => {
			const dayOffset = i - leadingEmpty + 1
			return new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), dayOffset)
		})
	}, [firstDayOfMonth, lastDayOfMonth])

	useEffect(() => {
		let cancelled = false
		const controller = new AbortController()
		async function load() {
			setLoading(true)
			setError(null)
			try {
				const monthParam = format(currentMonth, 'yyyy-MM')
				const res = await fetch(`/api/calendar/instances?month=${monthParam}`, { signal: controller.signal })
				if (!res.ok) throw new Error('Failed to load')
				const data: Instance[] = await res.json()
				if (!cancelled) setInstances(data)
			} catch (e: any) {
				if (!cancelled) setError(e?.message ?? 'Failed to load')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		// Only load on client to avoid hydration mismatch
		if (mounted) load()
		return () => {
			cancelled = true
			controller.abort()
		}
	}, [currentMonth, mounted])

	const byDate = useMemo(() => {
		const map = new Map<string, Instance[]>()
		for (const inst of instances) {
			const key = inst.date.slice(0, 10)
			if (!map.has(key)) map.set(key, [])
			map.get(key)!.push(inst)
		}
		return map
	}, [instances])

	// Avoid rendering calendar until mounted to prevent hydration errors
	if (!mounted) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
					<div className="flex gap-2">
						<div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
						<div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
						<div className="h-9 w-16 animate-pulse rounded bg-gray-200" />
					</div>
				</div>
				<div className="grid grid-cols-7 gap-px rounded-md border bg-gray-200">
					{Array.from({ length: 7 * 6 }).map((_, i) => (
						<div key={i} className="min-h-[90px] bg-white p-2">
							<div className="mb-1 h-4 w-6 animate-pulse rounded bg-gray-200" />
							<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</div>
				<div className="flex gap-2">
					<button className="btn" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>Prev</button>
					<button className="btn" onClick={() => setCurrentMonth(new Date())}>Today</button>
					<button className="btn" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>Next</button>
				</div>
			</div>
			{error && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
					{error}
				</div>
			)}
			<div className="grid grid-cols-7 gap-px rounded-md border bg-gray-200">
				{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
					<div key={d} className="bg-white px-2 py-2 text-xs font-medium">{d}</div>
				))}
				{gridDates.map((date, idx) => {
					const isThisMonth = isSameMonth(date, currentMonth)
					const key = date.toISOString().slice(0, 10)
					const events = byDate.get(key) ?? []
					return (
						<div key={idx} className={`min-h-[90px] bg-white p-2 ${isThisMonth ? '' : 'opacity-40'}`}>
							<div className="mb-1 text-xs font-semibold">{date.getDate()}</div>
							<div className="space-y-1">
								{events.map((e) => {
									return (
										<a key={`${e.id}-${key}`} href={`/events/${e.id}`} className="block truncate rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">
											{e.title}
										</a>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
			{loading && <div className="text-sm text-gray-500">Loading…</div>}
		</div>
	)
}


