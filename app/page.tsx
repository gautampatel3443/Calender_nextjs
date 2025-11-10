import Calendar from '@/components/Calendar'

export default async function HomePage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Monthly Calendar</h1>
			<Calendar initialMonth={new Date()} />
		</div>
	)
}


