export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrion } from '../../../../../server/orion';
import { db } from '../../../../../server/db';
import { sessions as sessionsTable, messages as messagesTable } from '../../../../../server/schema';
import { eq, asc } from 'drizzle-orm';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
	applyCorsHeaders,
} from '../../../../../server/security';

const ParamsSchema = z.object({ id: z.string().min(1) });

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	const headers = new Headers();
	applySecurityHeaders(headers);

	const allowlist = getAllowlist();
	const origin = req.headers.get('origin');
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}
	applyCorsHeaders(headers, origin, allowlist);

	const params = await ctx.params;
	const parsed = ParamsSchema.safeParse(params);
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid session id' }, { status: 400, headers });
	}

	// Prefer persisted history; fall back to in-memory if missing
	try {
		// @ts-ignore drizzle-orm runtime types
		const s = db
			.select()
			.from(sessionsTable)
			.where(eq(sessionsTable.sessionId, parsed.data.id))
			.get?.();
		if (s) {
			// @ts-ignore drizzle-orm runtime types
			const rows =
				db
					.select()
					.from(messagesTable)
					.where(eq(messagesTable.sessionId, parsed.data.id))
					.orderBy(asc(messagesTable.id))
					.all?.() || [];
			const messages = (rows as any[]).map(r => ({
				role: r.role as 'user' | 'assistant' | 'system',
				content: r.content as string,
				timestamp: String(r.timestamp),
			}));
			return NextResponse.json({ messages, state: s.state, pattern: s.pattern }, { headers });
		}
	} catch {}

	const orion = getOrion();
	const session = orion.getSession(parsed.data.id);
	if (!session) {
		return new NextResponse('Not found', { status: 404, headers });
	}

	const messages = session.messages.map(m => ({
		role: m.role,
		content: m.content,
		timestamp: m.timestamp.toISOString(),
	}));

	return NextResponse.json(
		{
			messages,
			state: session.state,
			pattern: session.pattern,
			taskPlan: session.currentTaskPlan ?? undefined,
		},
		{ headers }
	);
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
