import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { expandEventsForMonth, type EventLike } from '@/lib/recurrence'

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const monthStr = searchParams.get('month') // e.g. 2025-11
	const base = monthStr ? new Date(`${monthStr}-01T00:00:00`) : new Date()

	const events = await prisma.event.findMany({
		orderBy: { startDate: 'asc' }
	})

	// Map prisma rows into EventLike and expand
	const plain: EventLike[] = events.map((e) => ({
		id: e.id,
		title: e.title,
		startDate: e.startDate,
		endDate: e.endDate,
		isRecurring: e.isRecurring,
		frequency: e.frequency,
		daysOfWeek: e.daysOfWeek as string | null,
		recurrenceEndDate: e.recurrenceEndDate
	}))

	const instances = expandEventsForMonth(plain, base).map((i) => ({
		...i,
		date: i.date.toISOString()
	}))

	return NextResponse.json(instances)
}


