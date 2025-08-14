import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createServer } from '../../server/test-server';

let server: any;
let request: supertest.SuperTest<supertest.Test>;

describe('API routes contract', () => {
	beforeAll(async () => {
		process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
		server = createServer();
		await new Promise(res => server.listen(0, res));
		const address = server.address();
		const url = `http://127.0.0.1:${address.port}`;
		request = supertest(url);
	});

	afterAll(async () => {
		await new Promise(res => server.close(res));
	});

	it('POST /api/sessions returns sessionId (same-origin)', async () => {
		const res = await request.post('/api/sessions').send({ userId: 'tester' });
		expect(res.status).toBe(201);
		expect(res.type).toMatch(/json/);
		expect(res.body.sessionId).toBeTruthy();
		// security headers present
		expect(res.headers['x-content-type-options']).toBe('nosniff');
		expect(res.headers['referrer-policy']).toBe('no-referrer');
	});

	it('GET /api/sessions/:id/history returns messages shape', async () => {
		const resSession = await request.post('/api/sessions').send({ userId: 'tester' });
		const sid = resSession.body.sessionId;
		const res = await request.get(`/api/sessions/${sid}/history`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.messages)).toBe(true);
		expect(res.body).toHaveProperty('state');
		expect(res.body).toHaveProperty('pattern');
	});

	it('POST /api/approvals validates and returns ok flag', async () => {
		const res = await request.post('/api/approvals').send({ approvalId: 'unknown', approve: true });
		expect([200, 404]).toContain(res.status);
		expect(res.type).toMatch(/json/);
		expect(res.body).toHaveProperty('ok');
	});

	it('GET /api/memory/:id/recent returns items', async () => {
		const resSession = await request.post('/api/sessions').send({ userId: 'tester' });
		const sid = resSession.body.sessionId;
		const res = await request.get(`/api/memory/${sid}/recent?limit=5`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.items)).toBe(true);
	});

	it('CORS blocks disallowed origins', async () => {
		const res = await request
			.post('/api/sessions')
			.set('Origin', 'https://evil.example.com')
			.send({});
		expect(res.status).toBe(403);
	});
});
