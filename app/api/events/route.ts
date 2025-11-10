import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventSchema = z.object({
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	startDate: z.string().transform((s) => new Date(s)),
	endDate: z.string().transform((s) => new Date(s)),
	isRecurring: z.boolean().optional().default(false),
	frequency: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().nullable(),
	recurrenceEndDate: z.string().optional().nullable().transform((s) => (s ? new Date(s) : null))
})

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const from = searchParams.get('from')
	const to = searchParams.get('to')

	const where =
		from && to
			? {
					OR: [
						{ isRecurring: true },
						{
							isRecurring: false,
							startDate: { gte: new Date(from) },
							endDate: { lte: new Date(to) }
						}
					]
				}
			: {}

	const events = await prisma.event.findMany({
		where,
		orderBy: { startDate: 'asc' }
	})
	return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
	try {
		const json = await req.json()
		const parsed = eventSchema.parse(json)

		if (parsed.isRecurring && parsed.frequency === 'weekly') {
			if (!parsed.daysOfWeek || parsed.daysOfWeek.length === 0) {
				return NextResponse.json({ error: 'Select at least one weekday' }, { status: 400 })
			}
		}

		const created = await prisma.event.create({
			data: {
				title: parsed.title,
				description: parsed.description ?? null,
				startDate: parsed.startDate,
				endDate: parsed.endDate,
				isRecurring: parsed.isRecurring ?? false,
				frequency: parsed.isRecurring ? parsed.frequency ?? null : null,
				daysOfWeek:
					parsed.isRecurring && parsed.frequency === 'weekly'
						? JSON.stringify(parsed.daysOfWeek ?? [])
						: null,
				recurrenceEndDate: parsed.recurrenceEndDate ?? null
			}
		})
		return NextResponse.json(created, { status: 201 })
	} catch (e: any) {
		if (e?.name === 'ZodError') {
			return NextResponse.json({ error: e.flatten() }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}


