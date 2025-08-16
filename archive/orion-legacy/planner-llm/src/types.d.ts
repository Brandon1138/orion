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
    id: string;
    provider: 'google-tasks';
    title: string;
    notes?: string;
    status: 'needsAction' | 'completed';
    due?: string;
    completed?: string;
    parent?: string;
    position: string;
    taskList: {
        id: string;
        title: string;
    };
    links?: {
        type: string;
        description: string;
        link: string;
    }[];
    sourceUri?: string;
    raw?: unknown;
}
export interface TaskAnalysis {
    taskId: string;
    title: string;
    priority: Priority;
    estimatedDuration: number;
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
    type: QuestionType;
    options?: string[];
    required: boolean;
}
export interface CalendarSuggestion {
    taskId: string;
    eventTitle: string;
    suggestedDate: string;
    suggestedTime?: string;
    duration: number;
    description: string;
}
/**
 * TaskPlan v1 - Structured output schema for conversational task planning
 */
export interface TaskPlan {
    planDate: string;
    conversationSummary: string;
    taskAnalysis: TaskAnalysis[];
    questions?: TaskQuestion[];
    calendarSuggestions?: CalendarSuggestion[];
    nextSteps: string[];
}
export interface TaskInterviewInput {
    tasks: Task[];
    userPreferences?: UserPreferences;
    conversationHistory?: string[];
    context?: {
        currentDate?: string;
        timeZone?: string;
        workingHours?: {
            start: string;
            end: string;
        };
        [key: string]: unknown;
    };
}
export interface UserPreferences {
    preferredTimeSlots?: TimeSlot[];
    focusBlockMinimum: number;
    conversationStyle: 'concise' | 'detailed' | 'collaborative';
    prioritizationApproach: 'deadline' | 'impact' | 'energy' | 'hybrid';
}
export interface PlannerConfig {
    model: string;
    temperature: number;
    fallbackModel?: string;
    conversationTemplate?: string;
}
