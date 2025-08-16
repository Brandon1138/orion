/**
 * Planner LLM Types - Phase 1A
 * Structured output types for conversational task planning with TaskPlan v1 schema
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Complexity = 'simple' | 'moderate' | 'complex';
export type Flexibility = 'fixed' | 'flexible' | 'whenever';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type QuestionType = 'priority' | 'deadline' | 'dependencies' | 'context';

export interface Task {
	id: string; // Google Tasks task ID
	provider: 'google-tasks';
	title: string;
	notes?: string; // task description/details
	status: 'needsAction' | 'completed';
	due?: string; // ISO 8601 date if set
	completed?: string; // ISO 8601 datetime if completed
	parent?: string; // parent task ID for subtasks
	position: string; // position in task list
	taskList: {
		id: string;
		title: string;
	};
	links?: { type: string; description: string; link: string }[];
	sourceUri?: string; // Google Tasks web URL
	raw?: unknown; // original API payload
}

export interface TaskAnalysis {
	taskId: string; // Google Tasks task ID
	title: string;
	priority: Priority;
	estimatedDuration: number; // minutes
	complexity: Complexity;
	dependencies: string[]; // other task IDs this depends on
	suggestedSchedule: {
		preferredDate: string; // YYYY-MM-DD
		preferredTimeSlot: TimeSlot;
		flexibility: Flexibility;
	};
	context: {
		filesToOpen?: string[]; // file paths mentioned
		relatedProjects?: string[];
		blockers?: string[]; // things preventing progress
	};
}

export interface TaskQuestion {
	taskId?: string;
	question: string;
	type: QuestionType;
	options?: string[];
	required: boolean;
}

export interface CalendarSuggestion {
	taskId: string;
	eventTitle: string;
	suggestedDate: string; // YYYY-MM-DD
	suggestedTime?: string; // HH:MM
	duration: number; // minutes
	description: string;
}

/**
 * TaskPlan v1 - Structured output schema for conversational task planning
 */
export interface TaskPlan {
	planDate: string; // YYYY-MM-DD when this plan was created
	conversationSummary: string; // 2-3 sentences about what was discussed
	taskAnalysis: TaskAnalysis[];
	questions?: TaskQuestion[];
	calendarSuggestions?: CalendarSuggestion[];
	nextSteps: string[]; // what the assistant should do next
}

export interface TaskInterviewInput {
	tasks: Task[];
	userPreferences?: UserPreferences;
	conversationHistory?: string[];
	context?: {
		currentDate?: string;
		timeZone?: string;
		workingHours?: {
			start: string; // HH:MM
			end: string; // HH:MM
		};
		[key: string]: unknown;
	};
}

export interface UserPreferences {
	preferredTimeSlots?: TimeSlot[];
	focusBlockMinimum: number; // minimum minutes for focus blocks
	conversationStyle: 'concise' | 'detailed' | 'collaborative';
	prioritizationApproach: 'deadline' | 'impact' | 'energy' | 'hybrid';
}

export interface PlannerConfig {
	model: string; // 'gpt-4o' | 'claude-3-5-sonnet'
	temperature: number;
	fallbackModel?: string;
	conversationTemplate?: string; // system prompt template
}
