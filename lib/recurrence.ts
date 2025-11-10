import { addDays, addMonths, endOfMonth, isBefore, startOfMonth } from 'date-fns'

export type CalendarEventInstance = {
	id: number
	title: string
	date: Date
	originalStart: Date
	originalEnd: Date
}

export type EventLike = {
	id: number
	title: string
	startDate: Date
	endDate: Date
	isRecurring: boolean
	frequency: string | null
	daysOfWeek: string | null
	recurrenceEndDate: Date | null
}

function normalizeDate(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function expandEventsForMonth(
	events: EventLike[],
	month: Date
): CalendarEventInstance[] {
	const rangeStart = startOfMonth(month)
	const rangeEnd = endOfMonth(month)

	const instances: CalendarEventInstance[] = []

	for (const ev of events) {
		const recurrenceEnd = ev.recurrenceEndDate ?? null

		if (!ev.isRecurring) {
			const d = normalizeDate(ev.startDate)
			if (d >= rangeStart && d <= rangeEnd) {
				instances.push({
					id: ev.id,
					title: ev.title,
					date: d,
					originalStart: ev.startDate,
					originalEnd: ev.endDate
				})
			}
			continue
		}

		if (ev.frequency === 'daily') {
			let d = new Date(Math.max(rangeStart.getTime(), normalizeDate(ev.startDate).getTime()))
			while (d <= rangeEnd) {
				if (recurrenceEnd && isBefore(recurrenceEnd, d)) break
				instances.push({
					id: ev.id,
					title: ev.title,
					date: new Date(d),
					originalStart: ev.startDate,
					originalEnd: ev.endDate
				})
				d = addDays(d, 1)
			}
		} else if (ev.frequency === 'weekly') {
			const days: number[] =
				typeof ev.daysOfWeek === 'string' ? (JSON.parse(ev.daysOfWeek) as number[]) : []
			let d = new Date(rangeStart)
			while (d <= rangeEnd) {
				if (recurrenceEnd && isBefore(recurrenceEnd, d)) break
				if (days.includes(d.getDay())) {
					if (!isBefore(d, normalizeDate(ev.startDate))) {
						instances.push({
							id: ev.id,
							title: ev.title,
							date: new Date(d),
							originalStart: ev.startDate,
							originalEnd: ev.endDate
						})
					}
				}
				d = addDays(d, 1)
			}
		} else if (ev.frequency === 'monthly') {
			const firstOccurrence = new Date(
				rangeStart.getFullYear(),
				rangeStart.getMonth(),
				ev.startDate.getDate()
			)
			const candidate =
				firstOccurrence < rangeStart ? addMonths(firstOccurrence, 1) : firstOccurrence
			const withinEnd = !recurrenceEnd || !isBefore(recurrenceEnd, candidate)
			if (candidate <= rangeEnd && !isBefore(candidate, normalizeDate(ev.startDate)) && withinEnd) {
				instances.push({
					id: ev.id,
					title: ev.title,
					date: candidate,
					originalStart: ev.startDate,
					originalEnd: ev.endDate
				})
			}
		}
	}

	return instances
}


