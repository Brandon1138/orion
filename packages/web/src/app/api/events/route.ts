export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { subscribe } from '../../../server/events';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
	applyCorsHeaders,
	rateLimit,
	getClientSessionKey,
} from '../../../server/security';
import { z } from 'zod';

export async function GET(req: NextRequest) {
	const headers = new Headers();
	applySecurityHeaders(headers);

	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}
	applyCorsHeaders(headers, origin, allowlist);

	const key = `sse:${getClientSessionKey(req)}`;
	if (!rateLimit(key, 60)) {
		return new NextResponse('Rate limit exceeded', { status: 429, headers });
	}

	const QuerySchema = z.object({ sessionId: z.string().min(1).optional() });
	const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
	if (!parsed.success) {
		return new NextResponse('Invalid query', { status: 400, headers });
	}

	const sessionId = parsed.data.sessionId || '*';

	headers.set('Content-Type', 'text/event-stream');
	headers.set('Cache-Control', 'no-cache, no-transform');
	headers.set('Connection', 'keep-alive');
	headers.set('X-Accel-Buffering', 'no');

	const stream = new ReadableStream({
		start(controller) {
			const send = (data: unknown) => {
				controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			// Immediately notify connection
			send({ type: 'connected', sessionId });
			// Hint to clients that server is alive
			const ping = setInterval(() => send({ type: 'ping', ts: Date.now() }), 15_000);

			const unsubscribe = subscribe(sessionId as any, event => send(event));

			const close = () => {
				try {
					unsubscribe();
				} catch {}
				try {
					clearInterval(ping as any);
				} catch {}
				try {
					controller.close();
				} catch {}
			};

			// Close on client abort
			(req as any).signal?.addEventListener('abort', close);
		},
		cancel() {},
	});

	return new Response(stream, { headers });
}
