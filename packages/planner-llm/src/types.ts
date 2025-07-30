/**
 * Planner LLM Types - Phase 1A
 * Structured output types for day planning with DayPlan v1 schema
 */

export type BlockType =
	| 'meeting'
	| 'focus'
	| 'break'
	| 'admin'
	| 'commute'
	| 'exercise'
	| 'errand'
	| 'sleep';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface PlanBlock {
	start: string; // ISO 8601
	end: string; // ISO 8601
	label: string; // "Deep work: feature X"
	type: BlockType;
	dependsOn?: string[]; // ids of other blocks
	linkedEvents?: string[]; // Event.id references
	filesToOpen?: string[]; // paths
	commands?: string[]; // shell snippets, never executed without approval
	risk?: RiskLevel; // schedule risk
}

export interface Ambiguity {
	eventId?: string;
	question: string;
	options?: string[];
	required: boolean;
}

/**
 * DayPlan v1 - Structured output schema
 */
export interface DayPlan {
	date: string; // YYYY-MM-DD
	summary: string; // 2–3 sentences
	blocks: PlanBlock[];
	ambiguities?: Ambiguity[];
	suggestions?: string[]; // small optimizations
}

export interface PlanningContext {
	date: string;
	events: unknown[]; // Event[] from calendar-parser
	preferences: {
		focusBlockMins: number;
		style: 'concise' | 'chatty' | 'bullet';
	};
	context?: {
		openPRs?: number;
		pendingDocs?: number;
		[key: string]: unknown;
	};
}

export interface PlannerConfig {
	model: string; // 'gpt-4o' | 'claude-3-5-sonnet'
	temperature: number;
	fallbackModel?: string;
}
