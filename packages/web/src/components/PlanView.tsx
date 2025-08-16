'use client';

import { useChatContext } from '@/lib/chat-context';
import type { TaskPlan } from '@/lib/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<div className="mb-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
				{title}
			</div>
			{children}
		</div>
	);
}

function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-2 text-[11px]">
			<div className="text-neutral-500 dark:text-neutral-400">{k}</div>
			<div className="text-right text-neutral-800 dark:text-neutral-100">{v}</div>
		</div>
	);
}

function TaskPlanCard({ plan }: { plan: TaskPlan }) {
	return (
		<div className="space-y-3">
			<Section title="Summary">
				<p className="text-[12px] leading-snug text-neutral-800 dark:text-neutral-100">
					{plan.conversationSummary}
				</p>
				<div className="mt-1 text-[10px] text-neutral-500">Plan date: {plan.planDate}</div>
			</Section>

			<Section title="Tasks">
				<div className="space-y-2">
					{plan.taskAnalysis.map(t => (
						<div
							key={t.taskId}
							className="rounded border border-neutral-200 p-2 dark:border-neutral-800"
						>
							<div className="text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
								{t.title}
							</div>
							<div className="mt-1 grid grid-cols-2 gap-2">
								<KeyValue k="Priority" v={t.priority} />
								<KeyValue k="Duration" v={`${t.estimatedDuration} min`} />
								<KeyValue k="Complexity" v={t.complexity} />
								<KeyValue k="Depends on" v={t.dependencies.length || '—'} />
							</div>
							<div className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-300">
								Preferred: {t.suggestedSchedule.preferredDate} ·{' '}
								{t.suggestedSchedule.preferredTimeSlot}
								{t.suggestedSchedule.flexibility !== 'fixed'
									? ` · ${t.suggestedSchedule.flexibility}`
									: ''}
							</div>
						</div>
					))}
				</div>
			</Section>

			{plan.calendarSuggestions && plan.calendarSuggestions.length > 0 ? (
				<Section title="Calendar suggestions">
					<ul className="list-disc pl-4 text-[12px] text-neutral-800 dark:text-neutral-100">
						{plan.calendarSuggestions.map((c, idx) => (
							<li key={`${c.taskId}-${idx}`}>
								{c.eventTitle} — {c.suggestedDate}
								{c.suggestedTime ? ` ${c.suggestedTime}` : ''} · {c.duration} min
							</li>
						))}
					</ul>
				</Section>
			) : null}

			{plan.questions && plan.questions.length > 0 ? (
				<Section title="Questions">
					<ol className="list-decimal pl-4 text-[12px] text-neutral-800 dark:text-neutral-100">
						{plan.questions.map((q, idx) => (
							<li key={idx}>{q.question}</li>
						))}
					</ol>
				</Section>
			) : null}

			<Section title="Next steps">
				<ul className="list-disc pl-4 text-[12px] text-neutral-800 dark:text-neutral-100">
					{plan.nextSteps.map((s, idx) => (
						<li key={idx}>{s}</li>
					))}
				</ul>
			</Section>

			<div className="pt-1">
				<button
					type="button"
					className="w-full rounded bg-neutral-900 px-2 py-1.5 text-[12px] font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
					onClick={() => {
						// Phase 1A: surface dry-run only; later will POST to an apply endpoint
						// Here we just emit a console log to indicate intent
						console.log('Apply plan (dry-run) clicked');
					}}
				>
					Apply plan (dry-run)
				</button>
			</div>
		</div>
	);
}

export function PlanView() {
	const { taskPlan } = useChatContext();
	return (
		<div className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-800">
			{!taskPlan ? (
				<p className="text-neutral-600 dark:text-neutral-400">No plan yet</p>
			) : (
				<TaskPlanCard plan={taskPlan} />
			)}
		</div>
	);
}

export default PlanView;
