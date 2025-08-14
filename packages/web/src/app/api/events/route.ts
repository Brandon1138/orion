export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { subscribe } from '../../../server/events';
import { applySecurityHeaders, isOriginAllowed, getAllowlist } from '../../../server/security';

export async function GET(req: NextRequest) {
	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new Response('Origin not allowed', { status: 403 });
	}

	const headers = new Headers();
	applySecurityHeaders(headers);
	headers.set('Content-Type', 'text/event-stream');
	headers.set('Cache-Control', 'no-cache, no-transform');
	headers.set('Connection', 'keep-alive');
	headers.set('X-Accel-Buffering', 'no');

	const sessionId = req.nextUrl.searchParams.get('sessionId') || '*';

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
