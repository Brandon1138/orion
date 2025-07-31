/**
 * Test Fixtures - Chunk 2.3
 * Shared test data for conversational flow testing
 */
import type { Task, TaskPlan, TaskInterviewInput, UserPreferences } from './types.js';
export declare const createTestTask: (overrides?: Partial<Task>) => Task;
export declare const createTestTasks: (count?: number) => Task[];
export declare const testTaskScenarios: {
    urgentTasks: Task[];
    overdueTasks: Task[];
    vagueTasks: Task[];
    complexTasks: Task[];
    dependentTasks: Task[];
    completedTasks: Task[];
    mixedPriorityTasks: Task[];
};
export declare const testUserPreferences: {
    detailed: UserPreferences;
    concise: UserPreferences;
    flexible: UserPreferences;
    morningPerson: UserPreferences;
};
export declare const conversationScenarios: {
    initial: string[];
    priorityPhase: string[];
    contextPhase: string[];
    schedulingPhase: string[];
    followupPhase: string[];
    readyPhase: string[];
    contradictory: string[];
    overwhelmed: string[];
    timeConstrained: string[];
};
export declare const mockTaskPlans: {
    basic: TaskPlan;
    withQuestions: TaskPlan;
    withCalendar: TaskPlan;
    fallback: TaskPlan;
};
export declare const createTaskInterviewInput: (tasks?: Task[], overrides?: Partial<TaskInterviewInput>) => TaskInterviewInput;
export declare const invalidTaskPlans: {
    missingRequired: {
        someField: string;
    };
    invalidDate: {
        planDate: string;
        conversationSummary: string;
        taskAnalysis: never[];
        nextSteps: string[];
    };
    shortSummary: {
        planDate: string;
        conversationSummary: string;
        taskAnalysis: never[];
        nextSteps: string[];
    };
    emptyNextSteps: {
        planDate: string;
        conversationSummary: string;
        taskAnalysis: never[];
        nextSteps: never[];
    };
    invalidPriority: {
        planDate: string;
        conversationSummary: string;
        taskAnalysis: {
            taskId: string;
            title: string;
            priority: string;
            estimatedDuration: number;
            complexity: string;
            dependencies: never[];
            suggestedSchedule: {
                preferredDate: string;
                preferredTimeSlot: string;
                flexibility: string;
            };
            context: {
                filesToOpen: never[];
                relatedProjects: never[];
                blockers: never[];
            };
        }[];
        nextSteps: string[];
    };
    invalidDuration: {
        planDate: string;
        conversationSummary: string;
        taskAnalysis: {
            taskId: string;
            title: string;
            priority: string;
            estimatedDuration: number;
            complexity: string;
            dependencies: never[];
            suggestedSchedule: {
                preferredDate: string;
                preferredTimeSlot: string;
                flexibility: string;
            };
            context: {
                filesToOpen: never[];
                relatedProjects: never[];
                blockers: never[];
            };
        }[];
        nextSteps: string[];
    };
    missingTaskAnalysis: {
        planDate: string;
        conversationSummary: string;
        nextSteps: string[];
    };
};
export declare const mockOpenAISuccess: (mockInstance: any, response: TaskPlan) => void;
export declare const mockOpenAIFailure: (mockInstance: any, error: Error) => void;
export declare const mockOpenAIMalformed: (mockInstance: any, malformedJson: string) => void;
export declare const mockOpenAIEmpty: (mockInstance: any) => void;
export declare const mockOpenAINull: (mockInstance: any) => void;
