import type { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

type TokenBucket = { tokens: number; lastRefill: number };
const buckets = new Map<string, TokenBucket>();

export function isOriginAllowed(origin: string | null | undefined, allowlist: string[]): boolean {
	if (!origin) return true; // same-origin requests in Next often omit Origin
	try {
		const url = new URL(origin);
		return allowlist.some(allowed => matchOrigin(url, allowed));
	} catch {
		return false;
	}
}

function matchOrigin(url: URL, allowed: string): boolean {
	// allowed can be exact origin like https://example.com or wildcard like https://*.example.com
	try {
		const allowedUrl = new URL(allowed);
		if (allowedUrl.hostname.startsWith('*.')) {
			const suffix = allowedUrl.hostname.slice(2);
			return (
				url.protocol === allowedUrl.protocol &&
				(url.hostname === suffix || url.hostname.endsWith(`.${suffix}`)) &&
				(allowedUrl.port ? url.port === allowedUrl.port : true)
			);
		}
		return (
			url.protocol === allowedUrl.protocol &&
			url.hostname === allowedUrl.hostname &&
			(allowedUrl.port ? url.port === allowedUrl.port : true)
		);
	} catch {
		return false;
	}
}

export function applySecurityHeaders(headers: Headers): void {
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Referrer-Policy', 'no-referrer');
	headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data:",
			"connect-src 'self'",
			"font-src 'self' data:",
			"frame-ancestors 'none'",
		].join('; ')
	);
}

export function rateLimit(key: string, ratePerMinute = 30): boolean {
	const now = Date.now();
	const capacity = ratePerMinute;
	const refillMs = 60_000;
	let bucket = buckets.get(key);
	if (!bucket) {
		bucket = { tokens: capacity - 1, lastRefill: now };
		buckets.set(key, bucket);
		return true;
	}
	const elapsed = now - bucket.lastRefill;
	if (elapsed > 0) {
		const refill = Math.floor((elapsed / refillMs) * capacity);
		if (refill > 0) {
			bucket.tokens = Math.min(capacity, bucket.tokens + refill);
			bucket.lastRefill = now;
		}
	}
	if (bucket.tokens <= 0) return false;
	bucket.tokens -= 1;
	return true;
}

export function getClientSessionKey(req: NextRequest): string {
	const xff = req.headers.get('x-forwarded-for');
	const firstProxyIp = xff?.split(',')[0]?.trim();
	const realIp = req.headers.get('x-real-ip');
	const ip = firstProxyIp || realIp || 'anonymous';
	const sid =
		req.nextUrl.searchParams.get('sessionId') ||
		'' ||
		req.headers.get('x-session-id') ||
		'no-session';
	return `${ip}:${sid}`;
}

export function getAllowlist(): string[] {
	try {
		const candidates = [
			path.resolve(process.cwd(), 'orion.config.json'),
			path.resolve(process.cwd(), '../../orion.config.json'),
			path.resolve(process.cwd(), '../../../orion.config.json'),
		];
		for (const candidate of candidates) {
			if (fs.existsSync(candidate)) {
				const raw = fs.readFileSync(candidate, 'utf-8');
				const json = JSON.parse(raw) as { web?: { allowlist?: string[] } };
				return json.web?.allowlist ?? [];
			}
		}
	} catch {
		// ignore
	}
	return [];
}
