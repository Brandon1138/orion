export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateSessionSchema } from '../../../lib/schemas';
import { getOrion } from '../../../server/orion';
import { db } from '../../../server/db';
import { sessions as sessionsTable } from '../../../server/schema';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
	getClientSessionKey,
	rateLimit,
	applyCorsHeaders,
} from '../../../server/security';

export async function POST(req: NextRequest) {
	const headers = new Headers();
	applySecurityHeaders(headers);

	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}
	applyCorsHeaders(headers, origin, allowlist);

	const key = `sessions:${getClientSessionKey(req)}`;
	if (!rateLimit(key, 20)) {
		return new NextResponse('Rate limit exceeded', { status: 429, headers });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		body = {};
	}
	const parsed = CreateSessionSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid request', details: parsed.error.flatten() },
			{ status: 400, headers }
		);
	}

	const userId = parsed.data.userId ?? 'anonymous';
	const orion = getOrion();
	const sessionId = orion.startSession(userId);

	// Persist session
	try {
		(
			db.insert(sessionsTable).values({
				sessionId,
				userId,
				state: 'idle',
				pattern: 'quick-question',
				startTime: new Date().toISOString(),
			}) as any
		).run?.();
	} catch {}

	return NextResponse.json({ sessionId }, { status: 201, headers });
}

export async function OPTIONS(req: NextRequest) {
	const headers = new Headers();
	applySecurityHeaders(headers);
	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}
	applyCorsHeaders(headers, origin, allowlist, { allowCredentials: true });
	headers.set('Access-Control-Max-Age', '600');
	return new NextResponse(null, { status: 204, headers });
}
