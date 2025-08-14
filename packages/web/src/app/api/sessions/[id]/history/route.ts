export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrion } from '../../../../../server/orion';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
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

	const params = await ctx.params;
	const parsed = ParamsSchema.safeParse(params);
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid session id' }, { status: 400, headers });
	}

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
