'use client';

type ApprovalModalProps = {
	open: boolean;
	approvalId?: string;
	tool?: string;
	risk?: 'low' | 'medium' | 'high';
	onDecision: (approve: boolean) => void;
};

export function ApprovalModal({ open, approvalId, tool, risk, onDecision }: ApprovalModalProps) {
	if (!open) return null;
	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="approvalTitle"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		>
			<div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
				<h2 id="approvalTitle" className="text-sm font-semibold">
					Approval required
				</h2>
				<p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
					Tool <span className="font-mono">{tool ?? 'unknown'}</span> requests approval.
				</p>
				{risk ? (
					<p className="mt-1 text-xs">
						Risk level:{' '}
						<span
							className={`${
								risk === 'high'
									? 'text-rose-600'
									: risk === 'medium'
										? 'text-amber-600'
										: 'text-neutral-600'
							}`}
						>
							{risk}
						</span>
					</p>
				) : null}
				<div className="mt-4 flex items-center justify-end gap-2">
					<button
						onClick={() => onDecision(false)}
						className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
					>
						Deny
					</button>
					<button
						onClick={() => onDecision(true)}
						className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
					>
						Approve
					</button>
				</div>
			</div>
		</div>
	);
}

export default ApprovalModal;
