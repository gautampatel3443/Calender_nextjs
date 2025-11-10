import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Formics Tech Calendar',
	description: 'Event calendar with recurring events'
}

export default function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<div className="min-h-screen bg-gray-50 text-gray-900">
					<header className="border-b bg-white">
						<div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-6">
							<a href="/" className="font-semibold">Calendar</a>
							<nav className="flex gap-4 text-sm">
								<a className="hover:underline" href="/">Home</a>
								<a className="hover:underline" href="/events">Events</a>
								<a className="hover:underline" href="/events/new">New Event</a>
							</nav>
						</div>
					</header>
					<main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
				</div>
			</body>
		</html>
	)
}


