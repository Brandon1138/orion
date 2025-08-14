export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatSchema } from '../../../lib/schemas';
import { getOrion } from '../../../server/orion';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
	getClientSessionKey,
	rateLimit,
} from '../../../server/security';

export async function POST(req: NextRequest) {
	const headers = new Headers();
	applySecurityHeaders(headers);

	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}

	const key = `chat:${getClientSessionKey(req)}`;
	if (!rateLimit(key, 30)) {
		return new NextResponse('Rate limit exceeded', { status: 429, headers });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
	}

	const parsed = ChatSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid request', details: parsed.error.flatten() },
			{ status: 400, headers }
		);
	}

	const { sessionId, message, useAgent } = parsed.data;
	const orion = getOrion();

	try {
		const session = orion.getSession(sessionId);
		if (!session) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404, headers });
		}

		const responseText = useAgent
			? await orion.handleUserMessageWithAgent(message, sessionId, session.userId)
			: await orion.processMessage(sessionId, message);

		const resPayload: Record<string, unknown> = {
			response: responseText,
			state: session.state,
			pattern: session.pattern,
			taskPlan: session.currentTaskPlan ?? undefined,
		};

		return NextResponse.json(resPayload, { headers });
	} catch (err) {
		return NextResponse.json(
			{ error: 'Internal error', message: err instanceof Error ? err.message : String(err) },
			{ status: 500, headers }
		);
	}
}
