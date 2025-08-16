export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Complexity = 'simple' | 'moderate' | 'complex';
export type Flexibility = 'fixed' | 'flexible' | 'whenever';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface TaskAnalysis {
	taskId: string;
	title: string;
	priority: Priority;
	estimatedDuration: number; // minutes
	complexity: Complexity;
	dependencies: string[];
	suggestedSchedule: {
		preferredDate: string;
		preferredTimeSlot: TimeSlot;
		flexibility: Flexibility;
	};
	context: {
		filesToOpen?: string[];
		relatedProjects?: string[];
		blockers?: string[];
	};
}

export interface TaskQuestion {
	taskId?: string;
	question: string;
	type: 'priority' | 'deadline' | 'dependencies' | 'context';
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

export interface TaskPlan {
	planDate: string; // YYYY-MM-DD
	conversationSummary: string;
	taskAnalysis: TaskAnalysis[];
	questions?: TaskQuestion[];
	calendarSuggestions?: CalendarSuggestion[];
	nextSteps: string[];
}

export type MemoryItem = {
	ts: string;
	kind: 'message' | 'event' | 'note';
	data: Record<string, unknown>;
};
