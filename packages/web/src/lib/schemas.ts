import { z } from 'zod';

export const CreateSessionSchema = z.object({
	userId: z.string().min(1).optional(),
	label: z.string().max(120).optional(),
});

export const ChatSchema = z.object({
	sessionId: z.string().min(1),
	message: z.string().min(1),
	useAgent: z.boolean().optional().default(true),
	dryRun: z.boolean().optional(),
	approveLow: z.boolean().optional(),
});

export const ApprovalSchema = z.object({
	approvalId: z.string().min(1),
	approve: z.boolean(),
});

export const MemoryRecentQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(200).default(50),
});







