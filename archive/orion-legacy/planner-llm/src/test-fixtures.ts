/**
 * Test Fixtures - Chunk 2.3
 * Shared test data for conversational flow testing
 */

import type { Task, TaskPlan, TaskInterviewInput, UserPreferences } from './types.js';

export const createTestTask = (overrides: Partial<Task> = {}): Task => ({
	id: 'test-task-1',
	provider: 'google-tasks',
	title: 'Test Task',
	status: 'needsAction',
	position: '1',
	taskList: { id: '@default', title: 'My Tasks' },
	...overrides,
});

export const createTestTasks = (count: number = 3): Task[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: `test-task-${i + 1}`,
		provider: 'google-tasks',
		title: `Test Task ${i + 1}`,
		notes: `Description for test task ${i + 1}`,
		status: 'needsAction',
		position: String(i + 1),
		taskList: { id: '@default', title: 'My Tasks' },
	}));
};

export const testTaskScenarios = {
	// Priority scenarios
	urgentTasks: [
		{
			id: 'urgent-1',
			provider: 'google-tasks' as const,
			title: 'Emergency bug fix',
			notes: 'Production system is down',
			status: 'needsAction' as const,
			due: '2025-01-31', // Today
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'urgent-2',
			provider: 'google-tasks' as const,
			title: 'Client presentation prep',
			notes: 'CEO needs this in 2 hours',
			status: 'needsAction' as const,
			due: '2025-01-31', // Today
			position: '2',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Overdue tasks
	overdueTasks: [
		{
			id: 'overdue-1',
			provider: 'google-tasks' as const,
			title: 'Quarterly report',
			notes: 'Was due yesterday',
			status: 'needsAction' as const,
			due: '2025-01-30', // Yesterday
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Vague tasks needing context
	vagueTasks: [
		{
			id: 'vague-1',
			provider: 'google-tasks' as const,
			title: 'Update project',
			notes: 'Quick update', // Very brief
			status: 'needsAction' as const,
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'vague-2',
			provider: 'google-tasks' as const,
			title: 'Do something important',
			// No notes at all
			status: 'needsAction' as const,
			position: '2',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Complex tasks requiring scheduling
	complexTasks: [
		{
			id: 'complex-1',
			provider: 'google-tasks' as const,
			title: 'Write comprehensive technical documentation',
			notes:
				'API documentation with examples, tutorials, and reference material. Needs input from engineering team.',
			status: 'needsAction' as const,
			due: '2025-02-15',
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'complex-2',
			provider: 'google-tasks' as const,
			title: 'Complete market research analysis for Q2 strategic planning',
			notes:
				'Deep dive into competitor analysis, customer segments, pricing strategies, and market trends. Present findings to executive team.',
			status: 'needsAction' as const,
			due: '2025-03-01',
			position: '2',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Tasks with dependencies
	dependentTasks: [
		{
			id: 'parent-1',
			provider: 'google-tasks' as const,
			title: 'Design new user interface',
			notes: 'Mockups and wireframes for the new dashboard',
			status: 'needsAction' as const,
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'child-1',
			provider: 'google-tasks' as const,
			title: 'Review UI designs',
			notes: "Review designs after they're completed",
			status: 'needsAction' as const,
			parent: 'parent-1',
			position: '2',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'child-2',
			provider: 'google-tasks' as const,
			title: 'Implement approved designs',
			notes: 'Code the approved interface designs',
			status: 'needsAction' as const,
			parent: 'parent-1',
			position: '3',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Completed tasks
	completedTasks: [
		{
			id: 'completed-1',
			provider: 'google-tasks' as const,
			title: 'Set up development environment',
			notes: 'Install required tools and dependencies',
			status: 'completed' as const,
			completed: '2025-01-30T10:30:00.000Z',
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],

	// Mixed priority tasks
	mixedPriorityTasks: [
		{
			id: 'high-1',
			provider: 'google-tasks' as const,
			title: 'Critical security patch',
			notes: 'Must be deployed ASAP',
			status: 'needsAction' as const,
			due: '2025-02-01',
			position: '1',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'medium-1',
			provider: 'google-tasks' as const,
			title: 'Update documentation',
			notes: 'Regular maintenance task',
			status: 'needsAction' as const,
			due: '2025-02-07',
			position: '2',
			taskList: { id: '@default', title: 'My Tasks' },
		},
		{
			id: 'low-1',
			provider: 'google-tasks' as const,
			title: 'Organize desk',
			notes: 'Nice to have but not urgent',
			status: 'needsAction' as const,
			position: '3',
			taskList: { id: '@default', title: 'My Tasks' },
		},
	] as Task[],
};

export const testUserPreferences = {
	detailed: {
		preferredTimeSlots: ['morning', 'afternoon'],
		focusBlockMinimum: 90,
		conversationStyle: 'detailed',
		prioritizationApproach: 'deadline',
	} as UserPreferences,

	concise: {
		preferredTimeSlots: ['morning'],
		focusBlockMinimum: 60,
		conversationStyle: 'concise',
		prioritizationApproach: 'impact',
	} as UserPreferences,

	flexible: {
		preferredTimeSlots: ['morning', 'afternoon', 'evening'],
		focusBlockMinimum: 45,
		conversationStyle: 'collaborative',
		prioritizationApproach: 'energy',
	} as UserPreferences,

	morningPerson: {
		preferredTimeSlots: ['morning'],
		focusBlockMinimum: 120,
		conversationStyle: 'detailed',
		prioritizationApproach: 'deadline',
	} as UserPreferences,
};

export const conversationScenarios = {
	initial: [] as string[],

	priorityPhase: ['I need help planning my tasks', 'I have several things due soon'] as string[],

	contextPhase: [
		'I need help planning my tasks',
		'Priority set to high for the presentation',
		"It's definitely complex work",
	] as string[],

	schedulingPhase: [
		'I need help planning my tasks',
		'Priority confirmed as high',
		'Complexity is moderate to complex',
		'Dependencies are minimal',
	] as string[],

	followupPhase: [
		'I need help planning my tasks',
		"I'm feeling really overwhelmed with everything",
		"Priority set but I'm worried about time",
		'My energy is usually low in afternoons',
		'Morning works better for focused work',
	] as string[],

	readyPhase: [
		'I need help planning my tasks',
		'Priority confirmed as high',
		'Complexity assessed as moderate',
		'Dependencies identified',
		'Morning scheduling preferred',
		'Duration estimated at 2 hours',
		'All details gathered, ready to proceed',
	] as string[],

	contradictory: [
		'I work best in the morning',
		'Actually I prefer afternoons for focused work',
		'Morning meetings are too distracting',
		'I said morning was good for me',
	] as string[],

	overwhelmed: [
		'I have way too many tasks',
		"I don't know where to start",
		'Everything feels urgent',
		"I'm completely overwhelmed",
	] as string[],

	timeConstrained: [
		'All of these are due today',
		'I have no flexibility with deadlines',
		'My calendar is completely packed',
		"There's not enough time for everything",
	] as string[],
};

export const mockTaskPlans = {
	basic: {
		planDate: '2025-01-31',
		conversationSummary: 'Basic task plan for testing purposes.',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'medium',
				estimatedDuration: 60,
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-02-01',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: [],
					relatedProjects: [],
					blockers: [],
				},
			},
		],
		nextSteps: ['Continue with task planning'],
	} as TaskPlan,

	withQuestions: {
		planDate: '2025-01-31',
		conversationSummary: 'Task plan with follow-up questions.',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'high',
				estimatedDuration: 90,
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-02-01',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: ['project-files.docx'],
					relatedProjects: ['Project Alpha'],
					blockers: [],
				},
			},
		],
		questions: [
			{
				taskId: 'test-task-1',
				question: 'What priority should this task have?',
				type: 'priority',
				options: ['high', 'medium', 'low'],
				required: true,
			},
		],
		nextSteps: ['Continue gathering priority information'],
	} as TaskPlan,

	withCalendar: {
		planDate: '2025-01-31',
		conversationSummary: 'Complete task plan with calendar suggestions.',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'high',
				estimatedDuration: 120,
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-02-01',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: ['requirements.md'],
					relatedProjects: ['Main Project'],
					blockers: [],
				},
			},
		],
		calendarSuggestions: [
			{
				taskId: 'test-task-1',
				eventTitle: 'Work on Test Task',
				suggestedDate: '2025-02-01',
				suggestedTime: '09:00',
				duration: 120,
				description: 'Focus session for test task completion',
			},
		],
		nextSteps: ['Generate calendar entries based on task plan'],
	} as TaskPlan,

	fallback: {
		planDate: '2025-01-31',
		conversationSummary:
			'Fallback task plan generated due to LLM service failure. Basic analysis provided for all tasks.',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'medium',
				estimatedDuration: 60,
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-01-31',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: [],
					relatedProjects: [],
					blockers: [],
				},
			},
		],
		questions: [
			{
				question:
					'LLM service was unavailable. Please manually review task priorities and estimated durations.',
				type: 'priority',
				required: true,
			},
		],
		nextSteps: [
			'LLM service was unavailable, using basic template',
			'Please check your OpenAI API configuration',
			'Try regenerating the plan when service is restored',
		],
	} as TaskPlan,
};

export const createTaskInterviewInput = (
	tasks: Task[] = [createTestTask()],
	overrides: Partial<TaskInterviewInput> = {}
): TaskInterviewInput => ({
	tasks,
	conversationHistory: [],
	context: { currentDate: '2025-01-31' },
	...overrides,
});

export const invalidTaskPlans = {
	missingRequired: {
		// Missing required fields: planDate, conversationSummary, taskAnalysis, nextSteps
		someField: 'invalid',
	},

	invalidDate: {
		planDate: 'invalid-date-format',
		conversationSummary: 'Valid summary',
		taskAnalysis: [],
		nextSteps: ['Continue'],
	},

	shortSummary: {
		planDate: '2025-01-31',
		conversationSummary: 'Short', // Less than 10 characters
		taskAnalysis: [],
		nextSteps: ['Continue'],
	},

	emptyNextSteps: {
		planDate: '2025-01-31',
		conversationSummary: 'Valid summary with proper length',
		taskAnalysis: [],
		nextSteps: [], // Empty array violates minItems: 1
	},

	invalidPriority: {
		planDate: '2025-01-31',
		conversationSummary: 'Valid summary with proper length',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'invalid-priority', // Invalid enum
				estimatedDuration: 60,
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-02-01',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: [],
					relatedProjects: [],
					blockers: [],
				},
			},
		],
		nextSteps: ['Continue'],
	},

	invalidDuration: {
		planDate: '2025-01-31',
		conversationSummary: 'Valid summary with proper length',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'medium',
				estimatedDuration: 1000, // Outside valid range (5-480)
				complexity: 'moderate',
				dependencies: [],
				suggestedSchedule: {
					preferredDate: '2025-02-01',
					preferredTimeSlot: 'morning',
					flexibility: 'flexible',
				},
				context: {
					filesToOpen: [],
					relatedProjects: [],
					blockers: [],
				},
			},
		],
		nextSteps: ['Continue'],
	},

	missingTaskAnalysis: {
		planDate: '2025-01-31',
		conversationSummary: 'Valid summary with proper length',
		// Missing taskAnalysis array
		nextSteps: ['Continue'],
	},
};

// Helper functions for test setup
export const mockOpenAISuccess = (mockInstance: any, response: TaskPlan) => {
	mockInstance.chat.completions.create.mockResolvedValue({
		choices: [{ message: { content: JSON.stringify(response) } }],
	});
};

export const mockOpenAIFailure = (mockInstance: any, error: Error) => {
	mockInstance.chat.completions.create.mockRejectedValue(error);
};

export const mockOpenAIMalformed = (mockInstance: any, malformedJson: string) => {
	mockInstance.chat.completions.create.mockResolvedValue({
		choices: [{ message: { content: malformedJson } }],
	});
};

export const mockOpenAIEmpty = (mockInstance: any) => {
	mockInstance.chat.completions.create.mockResolvedValue({
		choices: [{ message: { content: '' } }],
	});
};

export const mockOpenAINull = (mockInstance: any) => {
	mockInstance.chat.completions.create.mockResolvedValue({
		choices: [{ message: { content: null } }],
	});
};
