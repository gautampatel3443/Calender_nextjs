import EventForm from '@/components/EventForm'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export default function NewEventPage() {
	async function submit(data: any) {
		'use server'
		await prisma.event.create({
			data: {
				title: data.title,
				description: data.description ?? null,
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				isRecurring: !!data.isRecurring,
				frequency: data.isRecurring ? data.frequency ?? null : null,
				daysOfWeek: data.isRecurring && data.frequency === 'weekly' ? JSON.stringify(data.daysOfWeek ?? []) : null,
				recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null
			}
		})
		revalidatePath('/')
		revalidatePath('/events')
		redirect('/events?success=created')
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Create Event</h1>
			<EventForm onSubmit={submit} />
		</div>
	)
}


