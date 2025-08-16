export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApprovalSchema } from '../../../lib/schemas';
import { resolveApproval } from '../../../server/approvals';
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

	const key = `approvals:${getClientSessionKey(req)}`;
	if (!rateLimit(key, 20)) {
		return new NextResponse('Rate limit exceeded', { status: 429, headers });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
	}

	const parsed = ApprovalSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid request', details: parsed.error.flatten() },
			{ status: 400, headers }
		);
	}

	const ok = resolveApproval(parsed.data.approvalId, parsed.data.approve);
	return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers });
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
