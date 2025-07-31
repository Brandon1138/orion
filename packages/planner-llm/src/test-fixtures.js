/**
 * Test Fixtures - Chunk 2.3
 * Shared test data for conversational flow testing
 */
export const createTestTask = (overrides = {}) => ({
    id: 'test-task-1',
    provider: 'google-tasks',
    title: 'Test Task',
    status: 'needsAction',
    position: '1',
    taskList: { id: '@default', title: 'My Tasks' },
    ...overrides,
});
export const createTestTasks = (count = 3) => {
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
            provider: 'google-tasks',
            title: 'Emergency bug fix',
            notes: 'Production system is down',
            status: 'needsAction',
            due: '2025-01-31', // Today
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'urgent-2',
            provider: 'google-tasks',
            title: 'Client presentation prep',
            notes: 'CEO needs this in 2 hours',
            status: 'needsAction',
            due: '2025-01-31', // Today
            position: '2',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Overdue tasks
    overdueTasks: [
        {
            id: 'overdue-1',
            provider: 'google-tasks',
            title: 'Quarterly report',
            notes: 'Was due yesterday',
            status: 'needsAction',
            due: '2025-01-30', // Yesterday
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Vague tasks needing context
    vagueTasks: [
        {
            id: 'vague-1',
            provider: 'google-tasks',
            title: 'Update project',
            notes: 'Quick update', // Very brief
            status: 'needsAction',
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'vague-2',
            provider: 'google-tasks',
            title: 'Do something important',
            // No notes at all
            status: 'needsAction',
            position: '2',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Complex tasks requiring scheduling
    complexTasks: [
        {
            id: 'complex-1',
            provider: 'google-tasks',
            title: 'Write comprehensive technical documentation',
            notes: 'API documentation with examples, tutorials, and reference material. Needs input from engineering team.',
            status: 'needsAction',
            due: '2025-02-15',
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'complex-2',
            provider: 'google-tasks',
            title: 'Complete market research analysis for Q2 strategic planning',
            notes: 'Deep dive into competitor analysis, customer segments, pricing strategies, and market trends. Present findings to executive team.',
            status: 'needsAction',
            due: '2025-03-01',
            position: '2',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Tasks with dependencies
    dependentTasks: [
        {
            id: 'parent-1',
            provider: 'google-tasks',
            title: 'Design new user interface',
            notes: 'Mockups and wireframes for the new dashboard',
            status: 'needsAction',
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'child-1',
            provider: 'google-tasks',
            title: 'Review UI designs',
            notes: "Review designs after they're completed",
            status: 'needsAction',
            parent: 'parent-1',
            position: '2',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'child-2',
            provider: 'google-tasks',
            title: 'Implement approved designs',
            notes: 'Code the approved interface designs',
            status: 'needsAction',
            parent: 'parent-1',
            position: '3',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Completed tasks
    completedTasks: [
        {
            id: 'completed-1',
            provider: 'google-tasks',
            title: 'Set up development environment',
            notes: 'Install required tools and dependencies',
            status: 'completed',
            completed: '2025-01-30T10:30:00.000Z',
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
    // Mixed priority tasks
    mixedPriorityTasks: [
        {
            id: 'high-1',
            provider: 'google-tasks',
            title: 'Critical security patch',
            notes: 'Must be deployed ASAP',
            status: 'needsAction',
            due: '2025-02-01',
            position: '1',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'medium-1',
            provider: 'google-tasks',
            title: 'Update documentation',
            notes: 'Regular maintenance task',
            status: 'needsAction',
            due: '2025-02-07',
            position: '2',
            taskList: { id: '@default', title: 'My Tasks' },
        },
        {
            id: 'low-1',
            provider: 'google-tasks',
            title: 'Organize desk',
            notes: 'Nice to have but not urgent',
            status: 'needsAction',
            position: '3',
            taskList: { id: '@default', title: 'My Tasks' },
        },
    ],
};
export const testUserPreferences = {
    detailed: {
        preferredTimeSlots: ['morning', 'afternoon'],
        focusBlockMinimum: 90,
        conversationStyle: 'detailed',
        prioritizationApproach: 'deadline',
    },
    concise: {
        preferredTimeSlots: ['morning'],
        focusBlockMinimum: 60,
        conversationStyle: 'concise',
        prioritizationApproach: 'impact',
    },
    flexible: {
        preferredTimeSlots: ['morning', 'afternoon', 'evening'],
        focusBlockMinimum: 45,
        conversationStyle: 'collaborative',
        prioritizationApproach: 'energy',
    },
    morningPerson: {
        preferredTimeSlots: ['morning'],
        focusBlockMinimum: 120,
        conversationStyle: 'detailed',
        prioritizationApproach: 'deadline',
    },
};
export const conversationScenarios = {
    initial: [],
    priorityPhase: ['I need help planning my tasks', 'I have several things due soon'],
    contextPhase: [
        'I need help planning my tasks',
        'Priority set to high for the presentation',
        "It's definitely complex work",
    ],
    schedulingPhase: [
        'I need help planning my tasks',
        'Priority confirmed as high',
        'Complexity is moderate to complex',
        'Dependencies are minimal',
    ],
    followupPhase: [
        'I need help planning my tasks',
        "I'm feeling really overwhelmed with everything",
        "Priority set but I'm worried about time",
        'My energy is usually low in afternoons',
        'Morning works better for focused work',
    ],
    readyPhase: [
        'I need help planning my tasks',
        'Priority confirmed as high',
        'Complexity assessed as moderate',
        'Dependencies identified',
        'Morning scheduling preferred',
        'Duration estimated at 2 hours',
        'All details gathered, ready to proceed',
    ],
    contradictory: [
        'I work best in the morning',
        'Actually I prefer afternoons for focused work',
        'Morning meetings are too distracting',
        'I said morning was good for me',
    ],
    overwhelmed: [
        'I have way too many tasks',
        "I don't know where to start",
        'Everything feels urgent',
        "I'm completely overwhelmed",
    ],
    timeConstrained: [
        'All of these are due today',
        'I have no flexibility with deadlines',
        'My calendar is completely packed',
        "There's not enough time for everything",
    ],
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
    },
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
    },
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
    },
    fallback: {
        planDate: '2025-01-31',
        conversationSummary: 'Fallback task plan generated due to LLM service failure. Basic analysis provided for all tasks.',
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
                question: 'LLM service was unavailable. Please manually review task priorities and estimated durations.',
                type: 'priority',
                required: true,
            },
        ],
        nextSteps: [
            'LLM service was unavailable, using basic template',
            'Please check your OpenAI API configuration',
            'Try regenerating the plan when service is restored',
        ],
    },
};
export const createTaskInterviewInput = (tasks = [createTestTask()], overrides = {}) => ({
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
export const mockOpenAISuccess = (mockInstance, response) => {
    mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(response) } }],
    });
};
export const mockOpenAIFailure = (mockInstance, error) => {
    mockInstance.chat.completions.create.mockRejectedValue(error);
};
export const mockOpenAIMalformed = (mockInstance, malformedJson) => {
    mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: malformedJson } }],
    });
};
export const mockOpenAIEmpty = (mockInstance) => {
    mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '' } }],
    });
};
export const mockOpenAINull = (mockInstance) => {
    mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
    });
};
