type Risk = 'low' | 'medium' | 'high';

interface PendingApproval {
	approvalId: string;
	createdAt: number;
	resolve: (ok: boolean) => void;
}

// approvalId -> resolver
const pending = new Map<string, PendingApproval>();

export function requestApproval(input: {
	tool: string;
	risk: Risk;
	args?: Record<string, unknown>;
}): { approvalId: string; promise: Promise<boolean> } {
	const approvalId = `appr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	let resolver: (ok: boolean) => void = () => {};
	const promise = new Promise<boolean>(resolve => {
		resolver = resolve;
	});
	pending.set(approvalId, { approvalId, createdAt: Date.now(), resolve: resolver });
	return { approvalId, promise };
}

export function resolveApproval(approvalId: string, approve: boolean): boolean {
	const item = pending.get(approvalId);
	if (!item) return false;
	pending.delete(approvalId);
	try {
		item.resolve(approve);
		return true;
	} catch {
		return false;
	}
}

export function getPendingApprovals(): string[] {
	return Array.from(pending.keys());
}
