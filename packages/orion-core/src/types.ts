/**
 * Orion Core Types - Phase 1A
 * Main orchestration types and interfaces
 */

import { Event, CalendarConfig } from '@orion/calendar-parser';
import { DayPlan, PlanningContext } from '@orion/planner-llm';
import { CommandRequest, ExecutionResult } from '@orion/command-router';

export type SessionState = 'idle' | 'context_build' | 'plan_draft' | 'clarify' | 'apply' | 'review';

export type ConversationPattern =
	| 'quick-question'
	| 'planning-session'
	| 'clarification-loop'
	| 'execution-mode'
	| 'reflection-mode';

export interface OrionConfig {
	profile: {
		timezone: string;
		workday: {
			start: string;
			end: string;
			focusBlockMins: number;
		};
		style: 'concise' | 'chatty' | 'bullet';
	};
	mvp: {
		mode: 'development' | 'staging' | 'production';
		phase: '1A' | '1B' | '2' | '3';
		quickStart: boolean;
		enabledFeatures: string[];
		skipApprovals: string[];
		autoAcceptPlans: boolean;
		debugMode: boolean;
		maxContextTokens: number;
		phaseEnforcement: boolean;
		circuitBreakers: boolean;
		rateLimiting: boolean;
	};
	calendars: CalendarConfig;
	agents: {
		plannerModel: string;
		plannerTemperature: number;
		fallbackModel: string;
		codexEnabled: boolean;
	};
	keys: {
		openaiKeyRef: string;
		googleKeyRef: string;
		msgraphKeyRef: string;
	};
	audit: {
		path: string;
		hashing: boolean;
		includeMetrics: boolean;
		retentionDays: number;
	};
}

export interface SessionContext {
	sessionId: string;
	userId: string;
	state: SessionState;
	pattern: ConversationPattern;
	messages: Message[];
	currentPlan?: DayPlan;
	events: Event[];
	preferences: any;
	startTime: Date;
}

export interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	metadata?: any;
}

export interface PlanRequest {
	date?: string; // YYYY-MM-DD, defaults to today
	events?: Event[];
	preferences?: any;
	context?: any;
}

export interface PlanResponse {
	plan: DayPlan;
	confidence: number;
	needsClarification: boolean;
	questions: string[];
}

export interface AuditEvent {
	ts: string;
	actor: string;
	user: string;
	action: string;
	args: any;
	result: any;
	prevHash?: string;
	hash: string;
}

export interface IterationMetrics {
	planGenerationTime: number;
	userSatisfactionScore?: 1 | 2 | 3 | 4 | 5;
	planAcceptanceRate: number;
	mostUsedTools: string[];
	commonFailurePoints: string[];
	contextSwitchFrequency: number;
}