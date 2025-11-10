import EventForm from '@/components/EventForm'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function EditEventPage({ params }: { params: { id: string } }) {
	const id = Number(params.id)
	const event = await prisma.event.findUnique({ where: { id } })
	if (!event) return notFound()

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Edit Event</h1>
			<EventForm
				defaultValues={{
					title: event.title,
					description: event.description ?? '',
					startDate: event.startDate.toISOString().slice(0,16),
					endDate: event.endDate.toISOString().slice(0,16),
					isRecurring: event.isRecurring,
					frequency: (event.frequency as any) ?? undefined,
					daysOfWeek: typeof event.daysOfWeek === 'string' ? JSON.parse(event.daysOfWeek) : [],
					recurrenceEndDate: event.recurrenceEndDate ? event.recurrenceEndDate.toISOString().slice(0,16) : ''
				}}
				submitLabel="Update Event"
				onSubmit={async (values) => {
					'use server'
					await prisma.event.update({
						where: { id },
						data: {
							title: values.title,
							description: values.description ?? null,
							startDate: new Date(values.startDate),
							endDate: new Date(values.endDate),
							isRecurring: !!values.isRecurring,
							frequency: values.isRecurring ? values.frequency ?? null : null,
							daysOfWeek: values.isRecurring && values.frequency === 'weekly' ? JSON.stringify(values.daysOfWeek ?? []) : null,
							recurrenceEndDate: values.recurrenceEndDate ? new Date(values.recurrenceEndDate) : null
						}
					})
					revalidatePath('/')
					revalidatePath('/events')
					redirect('/events?success=updated')
				}}
			/>
			<form
				action={async () => {
					'use server'
					await prisma.event.delete({ where: { id } })
					revalidatePath('/')
					revalidatePath('/events')
					redirect('/events?success=deleted')
				}}
			>
				<button className="btn bg-red-600 hover:bg-red-700" type="submit">Delete</button>
			</form>
		</div>
	)
}


