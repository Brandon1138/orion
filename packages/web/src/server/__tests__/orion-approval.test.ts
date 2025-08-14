import { describe, it, expect } from 'vitest';
import { getOrion } from '../../server/orion.js';
import { subscribe } from '../../server/events.js';
import { resolveApproval } from '../../server/approvals.js';

describe('Orion approval handler wiring', () => {
	it('triggers approval and can be resolved to allow ActionEngine to proceed', async () => {
		process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
		const orion = getOrion();

		const seen: any[] = [];
		const unsubscribe = subscribe('*', e => {
			seen.push(e);
			if (e.type === 'approval_requested') {
				// Approve immediately
				resolveApproval(e.approvalId, true);
			}
		});

		const action = {
			tool: 'calendar.create_event',
			risk: 'high' as const,
			args: { title: 'Test', date: '2025-01-01' },
		};

		const results = await orion.runActions([action]);
		unsubscribe();

		expect(seen.find(e => e.type === 'approval_requested')).toBeTruthy();
		expect(results.length).toBe(1);
		// If approval had been rejected, ActionEngine would set error 'User rejected'
		expect(results[0].error).not.toBe('User rejected');
	});
});
