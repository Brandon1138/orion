import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { POST as sessionsPost } from '../app/api/sessions/route';
import { GET as historyGet } from '../app/api/sessions/[id]/history/route';
import { POST as approvalsPost } from '../app/api/approvals/route';
import { GET as memoryRecentGet } from '../app/api/memory/[id]/recent/route';

function headersFromNode(req: IncomingMessage): Headers {
	const h = new Headers();
	for (const [k, v] of Object.entries(req.headers)) {
		if (Array.isArray(v)) {
			for (const vv of v) if (vv != null) h.append(k, vv);
		} else if (v != null) {
			h.set(k, String(v));
		}
	}
	return h;
}

function makeNextLikeRequest(req: IncomingMessage, rawBody: string) {
	const url = new URL(req.url || '/', 'http://localhost');
	return {
		method: req.method,
		headers: headersFromNode(req),
		ip: (req.socket && (req.socket as any).remoteAddress) || '127.0.0.1',
		nextUrl: url,
		json: async () => (rawBody ? JSON.parse(rawBody) : {}),
		text: async () => rawBody,
	} as any;
}

async function sendFromWebResponse(res: ServerResponse, resp: Response) {
	for (const [k, v] of resp.headers.entries()) {
		res.setHeader(k, v);
	}
	res.statusCode = resp.status || 200;
	if (resp.body) {
		const reader = (resp.body as ReadableStream).getReader();
		const pump = async () => {
			try {
				const { done, value } = await reader.read();
				if (done) {
					res.end();
					return;
				}
				res.write(Buffer.from(value));
				await pump();
			} catch {
				res.end();
			}
		};
		await pump();
		return;
	}
	const text = await resp.text();
	res.end(text);
}

export function createServer() {
	const server = createHttpServer(async (req, res) => {
		const method = (req.method || 'GET').toUpperCase();
		const rawUrl = req.url || '/';
		const urlObj = new URL(rawUrl, 'http://localhost');
		const pathname = urlObj.pathname;

		const chunks: Buffer[] = [];
		req.on('data', chunk => chunks.push(chunk));
		req.on('end', async () => {
			const body = Buffer.concat(chunks).toString('utf-8');
			try {
				if (method === 'POST' && pathname === '/api/sessions') {
					const nextReq = makeNextLikeRequest(req, body);
					const resp = await sessionsPost(nextReq);
					await sendFromWebResponse(res, resp as any);
					return;
				}
				if (
					method === 'GET' &&
					pathname.startsWith('/api/sessions/') &&
					pathname.endsWith('/history')
				) {
					const sid = pathname.split('/')[3];
					const nextReq = makeNextLikeRequest(req, body);
					const resp = await historyGet(nextReq, { params: Promise.resolve({ id: sid }) });
					await sendFromWebResponse(res, resp as any);
					return;
				}
				if (method === 'POST' && pathname === '/api/approvals') {
					const nextReq = makeNextLikeRequest(req, body);
					const resp = await approvalsPost(nextReq);
					await sendFromWebResponse(res, resp as any);
					return;
				}
				if (
					method === 'GET' &&
					pathname.startsWith('/api/memory/') &&
					pathname.endsWith('/recent')
				) {
					const id = pathname.split('/')[3];
					const nextReq = makeNextLikeRequest(req, body);
					const resp = await memoryRecentGet(nextReq, { params: Promise.resolve({ id }) });
					await sendFromWebResponse(res, resp as any);
					return;
				}
				res.statusCode = 404;
				res.end('not found');
			} catch (err: any) {
				res.statusCode = 500;
				res.end(String(err?.message || 'error'));
			}
		});
	});
	return server;
}
