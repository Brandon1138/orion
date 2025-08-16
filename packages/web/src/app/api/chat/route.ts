export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatSchema } from '../../../lib/schemas';
import { getOrion } from '../../../server/orion';
import { db } from '../../../server/db';
import { messages as messagesTable, sessions as sessionsTable } from '../../../server/schema';
import { eq } from 'drizzle-orm';
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

	const { sessionId, message, useAgent, dryRun } = parsed.data;
	const orion = getOrion();

	try {
		console.log(`[CHAT] Processing message for session ${sessionId}: "${message}"`);
		const session = orion.getSession(sessionId);
		if (!session) {
			console.error(`[CHAT] Session not found: ${sessionId}`);
			return NextResponse.json({ error: 'Session not found' }, { status: 404, headers });
		}

		// Emit lifecycle start for SSE subscribers
		try {
			(await import('../../../server/events')).publishEvent({ type: 'message_started', sessionId });
		} catch {}

		// Basic chat: Direct OpenAI API call without complex workflows
		console.log(`[CHAT] Making direct OpenAI call for session ${sessionId}`);
		
		let responseText = '';
		try {
			// Simple conversation with basic system prompt
			const OpenAI = (await import('openai')).default;
			const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
			
			console.log(`[CHAT] OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
			
			const completion = await openai.chat.completions.create({
				model: 'gpt-5-nano',
				messages: [
					{
						role: 'system',
						content: 'You are Orion, a helpful conversational assistant. Be friendly, helpful, and engaging in conversation.'
					},
					{
						role: 'user',
						content: message
					}
				],
				temperature: 1
			});
			
			responseText = completion.choices[0]?.message?.content || 'Sorry, I had trouble processing your message.';
			console.log(`[CHAT] Received response (${responseText.length} chars): ${responseText.substring(0, 100)}...`);
		} catch (error) {
			console.error(`[CHAT] OpenAI API Error:`, error);
			responseText = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}

		const resPayload: Record<string, unknown> = {
			response: responseText,
			state: session.state,
			pattern: session.pattern,
			taskPlan: session.currentTaskPlan ?? undefined,
		};

		// Emit token stream followed by final completion for streaming UX
		try {
			const events = await import('../../../server/events');
			const finalText = String(resPayload.response ?? '');
			
			// Publish final completion directly (skip token streaming for now)
			events.publishEvent({ type: 'assistant_completed', sessionId, text: finalText });
			console.log(`[SSE] Published assistant_completed for session ${sessionId}, text length: ${finalText.length}`);
		} catch (error) {
			console.error('[SSE] Failed to publish events:', error);
		}

		// Persist both user and assistant messages and update session state/pattern
		try {
			const now = new Date();
			(
				db.insert(messagesTable).values([
					{
						sessionId,
						role: 'user',
						content: message,
						timestamp: new Date(now.getTime() - 1).toISOString(),
					},
					{ sessionId, role: 'assistant', content: responseText, timestamp: now.toISOString() },
				]) as any
			).run?.();
			(
				db
					.update(sessionsTable)
					.set({ state: session.state, pattern: session.pattern })
					.where(eq(sessionsTable.sessionId, sessionId)) as any
			).run?.();
		} catch {}

		return NextResponse.json(resPayload, { headers });
	} catch (err) {
		return NextResponse.json(
			{ error: 'Internal error', message: err instanceof Error ? err.message : String(err) },
			{ status: 500, headers }
		);
	}
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
