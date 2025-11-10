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

export async function GET(
	_req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const id = Number(params.id)
	const event = await prisma.event.findUnique({ where: { id } })
	if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json(event)
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = Number(params.id)
		const json = await req.json()
		const parsed = eventSchema.parse(json)
		if (parsed.isRecurring && parsed.frequency === 'weekly') {
			if (!parsed.daysOfWeek || parsed.daysOfWeek.length === 0) {
				return NextResponse.json({ error: 'Select at least one weekday' }, { status: 400 })
			}
		}
		const updated = await prisma.event.update({
			where: { id },
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
		return NextResponse.json(updated)
	} catch (e: any) {
		if (e?.name === 'ZodError') {
			return NextResponse.json({ error: e.flatten() }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const id = Number(params.id)
	await prisma.event.delete({ where: { id } })
	return NextResponse.json({ ok: true })
}


