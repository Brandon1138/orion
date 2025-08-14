export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemoryRecentQuerySchema } from '../../../../../lib/schemas';
import { getOrion } from '../../../../../server/orion';
import {
	applySecurityHeaders,
	isOriginAllowed,
	getAllowlist,
} from '../../../../../server/security';

const ParamsSchema = z.object({ id: z.string().min(1) });
const QuerySchema = MemoryRecentQuerySchema;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	const headers = new Headers();
	applySecurityHeaders(headers);

	const origin = req.headers.get('origin');
	const allowlist = getAllowlist();
	if (!isOriginAllowed(origin, allowlist)) {
		return new NextResponse('Origin not allowed', { status: 403, headers });
	}

	const params = await ctx.params;
	const p = ParamsSchema.safeParse(params);
	if (!p.success) {
		return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers });
	}

	const q = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
	if (!q.success) {
		return NextResponse.json(
			{ error: 'Invalid query', details: q.error.flatten() },
			{ status: 400, headers }
		);
	}

	const orion = getOrion();
	const items = orion.getRecentMemory(p.data.id, q.data.limit);
	return NextResponse.json({ items }, { headers });
}
