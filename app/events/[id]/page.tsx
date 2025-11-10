import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function EventDetailPage({ params }: { params: { id: string } }) {
	const id = Number(params.id)
	const e = await prisma.event.findUnique({ where: { id } })
	if (!e) return notFound()
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{e.title}</h1>
				<a className="btn" href={`/events/${e.id}/edit`}>Edit</a>
			</div>
			<div className="rounded-md border bg-white p-4">
				<p className="text-gray-700">{e.description}</p>
				<dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
					<div>
						<dt className="text-sm text-gray-500">Start</dt>
						<dd>{format(e.startDate, 'PPpp')}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-500">End</dt>
						<dd>{format(e.endDate, 'PPpp')}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-500">Recurring</dt>
						<dd>{e.isRecurring ? e.frequency : 'No'}</dd>
					</div>
				</dl>
			</div>
		</div>
	)
}


