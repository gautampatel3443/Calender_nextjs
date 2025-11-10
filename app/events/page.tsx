import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export default async function EventsListPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
	const events = await prisma.event.findMany({ orderBy: { startDate: 'desc' } })
	const success = typeof searchParams?.success === 'string' ? searchParams?.success : undefined
	return (
		<div className="space-y-6">
			{success && (
				<div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
					{success === 'created' && 'Event created successfully.'}
					{success === 'updated' && 'Event updated successfully.'}
					{success === 'deleted' && 'Event deleted successfully.'}
				</div>
			)}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Events</h1>
				<a className="btn" href="/events/new">New Event</a>
			</div>
			<div className="overflow-hidden rounded-md border">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 py-2 text-left text-sm font-semibold">Title</th>
							<th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
							<th className="px-4 py-2 text-left text-sm font-semibold">End</th>
							<th className="px-4 py-2 text-left text-sm font-semibold">Recurring</th>
							<th className="px-4 py-2"></th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100 bg-white">
						{events.map((e) => (
							<tr key={e.id}>
								<td className="px-4 py-2">{e.title}</td>
								<td className="px-4 py-2 text-sm text-gray-600">{format(e.startDate, 'PPpp')}</td>
								<td className="px-4 py-2 text-sm text-gray-600">{format(e.endDate, 'PPpp')}</td>
								<td className="px-4 py-2 text-sm">{e.isRecurring ? e.frequency : 'No'}</td>
								<td className="px-4 py-2 text-right">
									<a className="mr-2 text-blue-600 hover:underline" href={`/events/${e.id}`}>View</a>
									<a className="text-blue-600 hover:underline" href={`/events/${e.id}/edit`}>Edit</a>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}


