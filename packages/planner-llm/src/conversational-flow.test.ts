/**
 * Conversational Flow Tests - Chunk 2.3
 * Testing various interview scenarios for the conversational task planning system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerLLM } from './index.js';
import type { TaskInterviewInput, TaskPlan, Task, UserPreferences } from './types.js';

// Mock OpenAI API
const mockCreate = vi.fn();
const mockOpenAI = {
	chat: {
		completions: {
			create: mockCreate,
		},
	},
};

vi.mock('openai', () => ({
	default: class MockOpenAI {
		chat = {
			completions: {
				create: mockCreate,
			},
		};
	},
}));

describe('Conversational Flow Tests', () => {
	let planner: PlannerLLM;

	beforeEach(() => {
		// Clear any previous mock calls
		vi.clearAllMocks();

		const config = {
			model: 'gpt-4o',
			temperature: 0.3,
		};
		planner = new PlannerLLM(config);
	});

	describe('Priority Assessment Interview', () => {
		it('should ask priority questions for urgent tasks', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Review quarterly reports',
					notes: 'Need to review before board meeting',
					status: 'needsAction',
					due: '2025-02-01', // Due tomorrow (assuming test runs 2025-01-31)
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'task-2',
					provider: 'google-tasks',
					title: 'Schedule team meeting',
					status: 'needsAction',
					due: '2025-01-30', // Overdue
					position: '2',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [],
				context: { currentDate: '2025-01-31' },
			};

			// Mock successful OpenAI response with priority questions
			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Initial priority assessment for 2 tasks, focusing on overdue items and urgent deadlines.',
				taskAnalysis: [
					{
						taskId: 'task-2',
						title: 'Schedule team meeting',
						priority: 'urgent',
						estimatedDuration: 30,
						complexity: 'simple',
						suggestedSchedule: {
							preferredDate: '2025-01-31',
							preferredTimeSlot: 'morning',
							flexibility: 'fixed',
						},
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: [],
						},
					},
					{
						taskId: 'task-1',
						title: 'Review quarterly reports',
						priority: 'high',
						estimatedDuration: 120,
						complexity: 'complex',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['Q4-reports.xlsx'],
							relatedProjects: ['Board Meeting Prep'],
							blockers: [],
						},
					},
				],
				questions: [
					{
						taskId: 'task-2',
						question:
							'The team meeting scheduling is overdue (due 2025-01-30). How critical is this now?',
						type: 'priority',
						options: [
							'Critical - drop everything',
							'Important - schedule today',
							'Can wait - reschedule deadline',
						],
						required: true,
					},
				],
				nextSteps: [
					'Continue gathering priority information',
					'Ask follow-up questions about urgent tasks',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result).toMatchObject({
				planDate: '2025-01-31',
				taskAnalysis: expect.arrayContaining([
					expect.objectContaining({
						taskId: 'task-2',
						priority: 'urgent',
					}),
				]),
				questions: expect.arrayContaining([
					expect.objectContaining({
						type: 'priority',
						required: true,
					}),
				]),
			});

			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					model: 'gpt-4o',
					temperature: 0.3,
					response_format: expect.objectContaining({
						type: 'json_schema',
					}),
				})
			);
		});

		it('should handle multiple urgent tasks with priority ranking', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Client presentation prep',
					status: 'needsAction',
					due: '2025-02-01',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'task-2',
					provider: 'google-tasks',
					title: 'Budget report deadline',
					status: 'needsAction',
					due: '2025-02-01',
					position: '2',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'task-3',
					provider: 'google-tasks',
					title: 'Team retrospective planning',
					status: 'needsAction',
					due: '2025-02-02',
					position: '3',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Priority assessment for 3 urgent tasks due within 2 days. Need ranking for execution order.',
				taskAnalysis: tasks.map((task, i) => ({
					taskId: task.id,
					title: task.title,
					priority: i === 0 ? 'urgent' : ('high' as const),
					estimatedDuration: 90,
					complexity: 'moderate' as const,
					suggestedSchedule: {
						preferredDate: task.due!,
						flexibility: 'flexible' as const,
					},
					context: {
						filesToOpen: [],
						relatedProjects: [],
						blockers: [],
					},
				})),
				questions: [
					{
						question:
							'Multiple tasks due soon: "Client presentation prep", "Budget report deadline", "Team retrospective planning". Which should take priority?',
						type: 'priority',
						options: [
							'Client presentation prep',
							'Budget report deadline',
							'Team retrospective planning',
						],
						required: true,
					},
				],
				nextSteps: ['Continue gathering priority information'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions).toHaveLength(1);
			expect(result.questions![0]).toMatchObject({
				type: 'priority',
				options: expect.arrayContaining(['Client presentation prep', 'Budget report deadline']),
				required: true,
			});
		});
	});

	describe('Context Gathering Interview', () => {
		it('should ask context questions for vague tasks', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Update project timeline',
					notes: 'Quick update needed', // Very brief notes
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['User wants to plan tasks', 'Confirmed priority as medium'],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Context gathering phase for project timeline update. Need complexity assessment.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Update project timeline',
						priority: 'medium',
						estimatedDuration: 60,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'afternoon',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['project-timeline.xlsx'],
							relatedProjects: [],
							blockers: ['Waiting for milestone updates'],
						},
					},
				],
				questions: [
					{
						taskId: 'task-1',
						question: 'How complex is "Update project timeline"? This helps estimate time needed.',
						type: 'context',
						options: [
							'Quick (15-30 min)',
							'Moderate (1-2 hours)',
							'Complex (half day+)',
							'Unclear - need to investigate',
						],
						required: false,
					},
				],
				nextSteps: ['Gather more context about task complexity'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions).toHaveLength(1);
			expect(result.questions![0]).toMatchObject({
				taskId: 'task-1',
				type: 'context',
				options: expect.arrayContaining(['Quick (15-30 min)', 'Moderate (1-2 hours)']),
			});
		});

		it('should ask dependency questions for related tasks', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Review design mockups',
					notes: 'Review after wireframes are completed',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Started context gathering', 'Task priority confirmed as high'],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Context gathering for design review. Checking dependencies.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Review design mockups',
						priority: 'high',
						estimatedDuration: 90,
						complexity: 'moderate',
						dependencies: ['wireframes-completion'],
						suggestedSchedule: {
							preferredDate: '2025-02-03',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['design-mockups.figma'],
							relatedProjects: ['Website Redesign'],
							blockers: ['Waiting for wireframes'],
						},
					},
				],
				questions: [
					{
						taskId: 'task-1',
						question: 'Does "Review design mockups" depend on anything else being completed first?',
						type: 'dependencies',
						required: false,
					},
				],
				nextSteps: ['Identify dependencies between tasks'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0]).toMatchObject({
				type: 'dependencies',
				question: expect.stringContaining('depend on'),
			});
			expect(result.taskAnalysis[0].dependencies).toBeDefined();
		});
	});

	describe('Scheduling Preferences Interview', () => {
		it('should ask time-of-day preferences for focus tasks', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Write technical documentation',
					notes: 'Comprehensive API documentation needed',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'Priority confirmed as high',
					'Complexity assessed as moderate',
					'Dependencies identified',
				],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Scheduling phase for documentation writing. Gathering time preferences.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Write technical documentation',
						priority: 'high',
						estimatedDuration: 180,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['api-specs.md', 'existing-docs.md'],
							relatedProjects: ['API Development'],
							blockers: [],
						},
					},
				],
				questions: [
					{
						question: 'When do you do your best focused work?',
						type: 'context',
						options: [
							'Early morning (6-9 AM)',
							'Mid-morning (9-12 PM)',
							'Afternoon (1-4 PM)',
							'Evening (5-8 PM)',
						],
						required: false,
					},
				],
				nextSteps: ['Finalize scheduling preferences'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0]).toMatchObject({
				type: 'context',
				question: expect.stringContaining('focused work'),
				options: expect.arrayContaining(['Early morning', 'Mid-morning']),
			});
		});

		it('should ask duration estimation for large tasks', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Complete comprehensive market research analysis for Q2 strategic planning',
					notes:
						'Deep dive into competitor analysis, customer segments, pricing strategies, and market trends to inform our Q2 product positioning and go-to-market strategy',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Priority set to high', 'Context gathered'],
				userPreferences: {
					focusBlockMinimum: 90,
					conversationStyle: 'concise',
					prioritizationApproach: 'impact',
				},
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Duration estimation for large market research task.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Complete comprehensive market research analysis for Q2 strategic planning',
						priority: 'high',
						estimatedDuration: 480, // 8 hours - substantial task
						complexity: 'complex',
						suggestedSchedule: {
							preferredDate: '2025-02-03',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['competitor-data.xlsx', 'customer-surveys.csv'],
							relatedProjects: ['Q2 Strategy', 'Market Analysis'],
							blockers: [],
						},
					},
				],
				questions: [
					{
						taskId: 'task-1',
						question:
							'"Complete comprehensive market research analysis for Q2 strategic planning" seems substantial. How long do you estimate this will take?',
						type: 'context',
						options: ['1-2 hours', '3-4 hours', 'Full day', 'Multiple days'],
						required: false,
					},
				],
				nextSteps: ['Estimate time requirements for tasks'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0]).toMatchObject({
				type: 'context',
				question: expect.stringContaining('seems substantial'),
				options: expect.arrayContaining(['Full day', 'Multiple days']),
			});
		});
	});

	describe('Follow-up Interview Logic', () => {
		it('should generate follow-ups based on mentioned constraints', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Prepare presentation',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'I need help planning my tasks',
					"I'm really busy this week and feeling overwhelmed",
					'Priority confirmed for presentation',
				],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Follow-up questions based on user expressing feeling busy and overwhelmed.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Prepare presentation',
						priority: 'high',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
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
							'Since you mentioned being busy, should we focus on just the most critical tasks?',
						type: 'priority',
						options: [
							'Yes - only top 3 priorities',
							'No - I can handle more',
							'Depends on the tasks',
						],
						required: false,
					},
				],
				nextSteps: ['Address potential issues: User feeling overwhelmed'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0]).toMatchObject({
				type: 'priority',
				question: expect.stringContaining('busy'),
				options: expect.arrayContaining(['Yes - only top 3 priorities']),
			});
		});

		it('should adapt to user energy level mentions', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Code review',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'Planning my tasks for tomorrow',
					"I'm usually tired in the afternoons",
					'My energy peaks in the morning',
				],
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Follow-up on energy patterns mentioned by user.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Code review',
						priority: 'medium',
						estimatedDuration: 90,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['pull-requests.md'],
							relatedProjects: [],
							blockers: [],
						},
					},
				],
				questions: [
					{
						question: 'When during the day do you typically have the most energy?',
						type: 'context',
						options: ['Morning person', 'Afternoon peak', 'Evening surge', 'Varies daily'],
						required: false,
					},
				],
				nextSteps: ['Continue interview to gather more essential information'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0]).toMatchObject({
				type: 'context',
				question: expect.stringContaining('energy'),
				options: expect.arrayContaining(['Morning person', 'Evening surge']),
			});
		});
	});

	describe('Interview State Management', () => {
		it('should progress through interview phases correctly', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Complete report',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			// Test INIT phase
			const initInput: TaskInterviewInput = {
				tasks,
				conversationHistory: [],
				context: { currentDate: '2025-01-31' },
			};

			const initResponse: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Initial phase - starting task priority assessment.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Complete report',
						priority: 'medium',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
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
						question: 'What priority level should we assign to "Complete report"?',
						type: 'priority',
						required: true,
					},
				],
				nextSteps: ['Continue gathering priority information'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(initResponse) } }],
			});

			const initResult = await planner.conductTaskInterview(initInput);

			expect(initResult.questions![0].type).toBe('priority');

			// Test READY phase
			const readyInput: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'Start planning',
					'Priority set to high',
					'Complexity is moderate',
					'Dependencies none',
					'Prefer morning schedule',
					'Duration estimate 2 hours',
					'Time slot confirmed',
					'All details gathered',
				],
				context: { currentDate: '2025-01-31' },
			};

			const readyResponse: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Interview complete - ready for task execution planning.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Complete report',
						priority: 'high',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['report-template.docx'],
							relatedProjects: ['Q4 Analysis'],
							blockers: [],
						},
					},
				],
				calendarSuggestions: [
					{
						taskId: 'task-1',
						eventTitle: 'Complete report',
						suggestedDate: '2025-02-01',
						suggestedTime: '09:00',
						duration: 120,
						description: 'Focused work session for report completion',
					},
				],
				nextSteps: ['Interview complete - ready for task execution planning'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(readyResponse) } }],
			});

			const readyResult = await planner.conductTaskInterview(readyInput);

			expect(readyResult.calendarSuggestions).toBeDefined();
			expect(readyResult.calendarSuggestions).toHaveLength(1);
			expect(readyResult.nextSteps).toContain(
				'Interview complete - ready for task execution planning'
			);
		});

		it('should track conversation insights and readiness score', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Project task',
					status: 'needsAction',
					due: '2025-02-05',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'I need help with planning',
					'Priority is high',
					'Complexity is moderate',
					'Morning works best for me',
				],
				userPreferences: {
					focusBlockMinimum: 90,
					conversationStyle: 'concise',
					prioritizationApproach: 'deadline',
				},
				context: { currentDate: '2025-01-31' },
			};

			const mockTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Good progress on task planning with high readiness score.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Project task',
						priority: 'high',
						estimatedDuration: 90,
						complexity: 'moderate',
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
				nextSteps: ['Good coverage of topics, ready to generate final plan'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(mockTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input, 'test-session');

			expect(result).toMatchObject({
				conversationSummary: expect.stringContaining('readiness'),
				nextSteps: expect.arrayContaining([
					expect.stringContaining('ready to generate final plan'),
				]),
			});
		});
	});
});
