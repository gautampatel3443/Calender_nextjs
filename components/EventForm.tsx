'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const schema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional(),
	startDate: z.string().min(1),
	endDate: z.string().min(1),
	isRecurring: z.boolean().default(false),
	frequency: z.enum(['daily','weekly','monthly']).optional(),
	daysOfWeek: z.array(z.number()).optional(),
	recurrenceEndDate: z.string().optional()
})

type FormValues = z.infer<typeof schema>

type Props = {
	defaultValues?: Partial<FormValues>
	onSubmit: (values: FormValues) => Promise<void>
	submitLabel?: string
}

export default function EventForm({ defaultValues, onSubmit, submitLabel }: Props) {
	const [values, setValues] = useState<FormValues>({
		title: defaultValues?.title ?? '',
		description: defaultValues?.description ?? '',
		startDate: defaultValues?.startDate ?? new Date().toISOString().slice(0,16),
		endDate: defaultValues?.endDate ?? new Date().toISOString().slice(0,16),
		isRecurring: defaultValues?.isRecurring ?? false,
		frequency: defaultValues?.frequency as any,
		daysOfWeek: (defaultValues?.daysOfWeek as number[] | undefined) ?? [],
		recurrenceEndDate: (defaultValues as any)?.recurrenceEndDate ?? ''
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		// Keep endDate >= startDate
		if (values.endDate < values.startDate) {
			setValues((v) => ({ ...v, endDate: v.startDate }))
		}
	}, [values.startDate, values.endDate])

	const toggleWeekday = (d: number) => {
		setValues((v) => {
			const set = new Set(v.daysOfWeek ?? [])
			if (set.has(d)) set.delete(d)
			else set.add(d)
			return { ...v, daysOfWeek: Array.from(set).sort((a,b)=>a-b) }
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setErrors({})
		const result = schema.safeParse(values)
		if (!result.success) {
			const flat = result.error.flatten().fieldErrors as Partial<Record<keyof FormValues, string[]>>
			const errs: Record<string, string> = {}
			for (const k in flat) {
				const key = k as keyof FormValues
				const msgs = flat[key]
				if (msgs && msgs.length) errs[key as string] = msgs[0]!
			}
			setErrors(errs)
			return
		}
		if (values.isRecurring && values.frequency === 'weekly') {
			if (!values.daysOfWeek || values.daysOfWeek.length === 0) {
				setErrors({ daysOfWeek: 'Select at least one weekday' })
				return
			}
		}
		// Additional validations
		if (values.isRecurring && values.recurrenceEndDate) {
			if (values.recurrenceEndDate < values.startDate) {
				setErrors({ recurrenceEndDate: 'Recurrence end should be after start' })
				return
			}
		}
		setSubmitting(true)
		try {
			await onSubmit(values)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label className="label">Title</label>
					<input className="input" value={values.title} onChange={(e)=>setValues(v=>({...v,title:e.target.value}))} />
					{errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
				</div>
				<div>
					<label className="label">Description</label>
					<input className="input" value={values.description ?? ''} onChange={(e)=>setValues(v=>({...v,description:e.target.value}))} />
				</div>
				<div>
					<label className="label">Start</label>
					<input type="datetime-local" className="input" value={values.startDate} onChange={(e)=>setValues(v=>({...v,startDate:e.target.value}))} />
					{errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
				</div>
				<div>
					<label className="label">End</label>
					<input type="datetime-local" className="input" value={values.endDate} onChange={(e)=>setValues(v=>({...v,endDate:e.target.value}))} />
					{errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
				</div>
			</div>
			<div className="space-y-2">
				<label className="inline-flex items-center gap-2">
					<input type="checkbox" checked={values.isRecurring} onChange={(e)=>setValues(v=>({...v,isRecurring:e.target.checked, frequency: e.target.checked ? (v.frequency ?? 'weekly') : undefined}))} />
					<span className="label">Recurring</span>
				</label>
				{values.isRecurring && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label className="label">Frequency</label>
							<select className="input" value={values.frequency ?? ''} onChange={(e)=>setValues(v=>({...v,frequency: e.target.value as any}))}>
								<option value="" disabled>Select</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
						{values.frequency === 'weekly' && (
							<div className="md:col-span-2">
								<label className="label">Weekdays</label>
								<div className="flex flex-wrap gap-2">
									{weekdays.map((w, idx) => {
										const active = values.daysOfWeek?.includes(idx)
										return (
											<button type="button" key={w} onClick={()=>toggleWeekday(idx)} className={`rounded border px-2 py-1 text-sm ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>
												{w}
											</button>
										)
									})}
								</div>
								{errors.daysOfWeek && <p className="text-sm text-red-600">{errors.daysOfWeek}</p>}
							</div>
						)}
						<div className="md:col-span-3">
							<label className="label">Recurrence End </label>
							<input type="datetime-local" className="input" value={values.recurrenceEndDate ?? ''} onChange={(e)=>setValues(v=>({...v, recurrenceEndDate: e.target.value}))} />
							{errors.recurrenceEndDate && <p className="text-sm text-red-600">{errors.recurrenceEndDate}</p>}
						</div>
					</div>
				)}
			</div>
			<div className="flex gap-2">
				<button disabled={submitting} className="btn" type="submit">{submitLabel ?? 'Save Event'}</button>
				<a className="btn bg-gray-200 text-gray-900 hover:bg-gray-300" href="/events">Cancel</a>
			</div>
		</form>
	)
}


