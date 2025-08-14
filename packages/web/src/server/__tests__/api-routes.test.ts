import { describe, it, expect, beforeAll } from 'vitest';
import { getOrion } from '../../server/orion.js';

describe('API contracts (sanity via direct Orion calls)', () => {
	beforeAll(() => {
		process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
	});

	it('creates a session and gets history shape', async () => {
		const orion = getOrion();
		const sessionId = orion.startSession('test-user');
		const session = orion.getSession(sessionId)!;
		expect(session.sessionId).toBe(sessionId);
		expect(Array.isArray(session.messages)).toBe(true);
	});
});

