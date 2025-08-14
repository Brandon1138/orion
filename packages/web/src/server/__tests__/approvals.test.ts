import { describe, it, expect } from 'vitest';
import { resolveApproval, requestApproval, getPendingApprovals } from '../../server/approvals.js';

describe('approvals registry', () => {
	it('creates pending approval and resolves true', async () => {
		const { approvalId, promise } = requestApproval({
			tool: 'calendar.create_event',
			risk: 'high',
		});
		expect(getPendingApprovals()).toContain(approvalId);
		const ok = resolveApproval(approvalId, true);
		expect(ok).toBe(true);
		await expect(promise).resolves.toBe(true);
		expect(getPendingApprovals()).not.toContain(approvalId);
	});
});

import { describe, it, expect } from 'vitest';
import { requestApproval, resolveApproval, getPendingApprovals } from '../../server/approvals.js';

describe('approvals registry', () => {
	it('creates pending approval and resolves true', async () => {
		const { approvalId, promise } = requestApproval({
			tool: 'calendar.create_event',
			risk: 'high',
		});
		expect(getPendingApprovals()).toContain(approvalId);
		const ok = resolveApproval(approvalId, true);
		expect(ok).toBe(true);
		await expect(promise).resolves.toBe(true);
		expect(getPendingApprovals()).not.toContain(approvalId);
	});

	it('returns false when resolving unknown id', () => {
		const ok = resolveApproval('unknown', true);
		expect(ok).toBe(false);
	});
});
