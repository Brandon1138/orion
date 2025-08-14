import { describe, it, expect } from 'vitest';
import { publishEvent, subscribe } from '../../server/events.js';

describe('events pub/sub', () => {
	it('fans out to wildcard subscribers', async () => {
		const seen: any[] = [];
		const unsubscribe = subscribe('*', e => seen.push(e));
		publishEvent({ type: 'orion_ready' });
		unsubscribe();
		expect(seen.length).toBeGreaterThan(0);
		expect(seen[0].type).toBe('orion_ready');
	});

	it('routes per-session events only to matching subscribers', async () => {
		const a: any[] = [];
		const b: any[] = [];
		const ua = subscribe('s1', e => a.push(e));
		const ub = subscribe('s2', e => b.push(e));
		publishEvent({ type: 'message_started', sessionId: 's1' });
		ua();
		ub();
		expect(a.length).toBe(1);
		expect(a[0].type).toBe('message_started');
		expect(b.length).toBe(0);
	});
});

import { describe, it, expect } from 'vitest';
import { publishEvent, subscribe } from '../../server/events.js';

describe('events pub/sub', () => {
	it('fans out to wildcard subscribers', async () => {
		const seen: any[] = [];
		const unsubscribe = subscribe('*', e => seen.push(e));
		publishEvent({ type: 'orion_ready' });
		unsubscribe();
		expect(seen.length).toBeGreaterThan(0);
		expect(seen[0].type).toBe('orion_ready');
	});

	it('routes per-session events only to matching subscribers', async () => {
		const a: any[] = [];
		const b: any[] = [];
		const ua = subscribe('s1', e => a.push(e));
		const ub = subscribe('s2', e => b.push(e));
		publishEvent({ type: 'message_started', sessionId: 's1' });
		ua();
		ub();
		expect(a.length).toBe(1);
		expect(a[0].type).toBe('message_started');
		expect(b.length).toBe(0);
	});
});
