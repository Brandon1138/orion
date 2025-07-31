/**
 * Edge Cases Tests - Chunk 2.3
 * Testing edge cases including incomplete information, conflicting priorities, and API failures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerLLM } from './index.js';
import type { TaskInterviewInput, TaskPlan, Task, UserPreferences } from './types.js';

// Mock OpenAI API
const mockCreate = vi.fn();

vi.mock('openai', () => ({
	default: class MockOpenAI {
		chat = {
			completions: {
				create: mockCreate,
			},
		};
	},
}));

describe('Edge Cases Tests', () => {
	let planner: PlannerLLM;

	beforeEach(() => {
		// Clear any previous mock calls
		vi.clearAllMocks();

		const config = {
			model: 'gpt-4o',
			temperature: 0.3,
			fallbackModel: 'gpt-3.5-turbo',
		};
		planner = new PlannerLLM(config);
	});

	describe('Incomplete Information Handling', () => {
		it('should handle tasks with minimal information', async () => {
			const incompleteTasks: Task[] = [
				{
					id: 'minimal-task',
					provider: 'google-tasks',
					title: 'Do something', // Very vague title
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
					// Missing: notes, due date, any context
				},
			];

			const input: TaskInterviewInput = {
				tasks: incompleteTasks,
				conversationHistory: [],
				context: { currentDate: '2025-01-31' },
			};

			const fallbackPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Planning minimal task with insufficient information. Using defaults and asking clarifying questions.',
				taskAnalysis: [
					{
						taskId: 'minimal-task',
						title: 'Do something',
						priority: 'medium',
						estimatedDuration: 60, // Default
						complexity: 'moderate', // Default
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: ['Task details unclear'],
						},
					},
				],
				questions: [
					{
						taskId: 'minimal-task',
						question: '"Do something" needs more context. What does this involve exactly?',
						type: 'context',
						required: false,
					},
				],
				nextSteps: ['Gather more context about task complexity'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(fallbackPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.taskAnalysis[0]).toMatchObject({
				taskId: 'minimal-task',
				title: 'Do something',
				priority: 'medium', // Should default to medium
				estimatedDuration: expect.any(Number),
				complexity: expect.any(String),
			});

			expect(result.questions).toHaveLength.greaterThan(0);
			expect(result.questions![0].type).toBe('context');
		});

		it('should handle empty conversation history gracefully', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Review documents',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [], // Empty history
				context: { currentDate: '2025-01-31' },
			};

			const initPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Initial phase with empty conversation history. Starting priority assessment.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Review documents',
						priority: 'medium',
						estimatedDuration: 90,
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
						taskId: 'task-1',
						question: 'What priority level should we assign to "Review documents"?',
						type: 'priority',
						required: true,
					},
				],
				nextSteps: ['Continue gathering priority information'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(initPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result).toBeDefined();
			expect(result.questions).toHaveLength.greaterThan(0);
			expect(result.nextSteps).toContain('Continue gathering priority information');
		});

		it('should handle missing user preferences', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Write report',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				// userPreferences deliberately omitted
				conversationHistory: ['Initial planning request'],
				context: { currentDate: '2025-01-31' },
			};

			const planWithoutPrefs: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Planning without user preferences. Using default assumptions.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Write report',
						priority: 'medium',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning', // Default assumption
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
				nextSteps: ['Gather user preferences for better scheduling'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithoutPrefs) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result).toBeDefined();
			expect(result.taskAnalysis[0].suggestedSchedule.preferredTimeSlot).toBeDefined();
		});

		it('should handle missing context information', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Complete project',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Need help planning'],
				// context deliberately minimal/missing
			};

			const planWithMinimalContext: TaskPlan = {
				planDate: new Date().toISOString().split('T')[0], // Should default to today
				conversationSummary:
					'Planning with minimal context information. Using current date as default.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Complete project',
						priority: 'medium',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: new Date().toISOString().split('T')[0],
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: [],
						},
					},
				],
				nextSteps: ['Continue with task planning using available information'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithMinimalContext) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.planDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(result).toBeDefined();
		});
	});

	describe('Conflicting Priorities Handling', () => {
		it('should handle multiple urgent tasks with conflicting deadlines', async () => {
			const conflictingTasks: Task[] = [
				{
					id: 'urgent-1',
					provider: 'google-tasks',
					title: 'Critical client presentation',
					notes: 'Must be ready for 2pm meeting',
					status: 'needsAction',
					due: '2025-01-31', // Today
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'urgent-2',
					provider: 'google-tasks',
					title: 'Emergency bug fix',
					notes: 'Production down, needs immediate attention',
					status: 'needsAction',
					due: '2025-01-31', // Also today
					position: '2',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'urgent-3',
					provider: 'google-tasks',
					title: 'Board meeting prep',
					notes: 'CEO needs this in 2 hours',
					status: 'needsAction',
					due: '2025-01-31', // Also today
					position: '3',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks: conflictingTasks,
				conversationHistory: [
					'I have multiple urgent items all due today',
					"I don't know which to prioritize",
				],
				context: { currentDate: '2025-01-31' },
			};

			const conflictResolutionPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Multiple urgent tasks with conflicting deadlines. Providing prioritization framework.',
				taskAnalysis: [
					{
						taskId: 'urgent-2',
						title: 'Emergency bug fix',
						priority: 'urgent',
						estimatedDuration: 60,
						complexity: 'simple',
						suggestedSchedule: {
							preferredDate: '2025-01-31',
							preferredTimeSlot: 'morning',
							flexibility: 'fixed',
						},
						context: {
							filesToOpen: ['production-logs.txt'],
							relatedProjects: ['Production Support'],
							blockers: [],
						},
					},
					{
						taskId: 'urgent-3',
						title: 'Board meeting prep',
						priority: 'urgent',
						estimatedDuration: 90,
						complexity: 'moderate',
						dependencies: ['urgent-2'], // After bug fix
						suggestedSchedule: {
							preferredDate: '2025-01-31',
							preferredTimeSlot: 'morning',
							flexibility: 'fixed',
						},
						context: {
							filesToOpen: ['board-presentation.pptx'],
							relatedProjects: ['Executive Communications'],
							blockers: [],
						},
					},
					{
						taskId: 'urgent-1',
						title: 'Critical client presentation',
						priority: 'high',
						estimatedDuration: 120,
						complexity: 'moderate',
						dependencies: ['urgent-2', 'urgent-3'], // After other urgent items
						suggestedSchedule: {
							preferredDate: '2025-01-31',
							preferredTimeSlot: 'afternoon',
							flexibility: 'fixed',
						},
						context: {
							filesToOpen: ['client-presentation.pptx'],
							relatedProjects: ['Client Relations'],
							blockers: [],
						},
					},
				],
				questions: [
					{
						question:
							'With multiple urgent items today, can any deadlines be negotiated or delegated?',
						type: 'priority',
						options: [
							'No - all are fixed deadlines',
							'Some flexibility on client presentation',
							'Can delegate board meeting prep',
							'Bug fix is only truly urgent',
						],
						required: true,
					},
				],
				calendarSuggestions: [
					{
						taskId: 'urgent-2',
						eventTitle: 'Emergency bug fix (URGENT)',
						suggestedDate: '2025-01-31',
						suggestedTime: '09:00',
						duration: 60,
						description: 'Fix production issue immediately',
					},
					{
						taskId: 'urgent-3',
						eventTitle: 'Board meeting prep (URGENT)',
						suggestedDate: '2025-01-31',
						suggestedTime: '10:30',
						duration: 90,
						description: 'Complete prep for CEO - 2 hour deadline',
					},
				],
				nextSteps: [
					'Address potential issues: Multiple conflicting urgent deadlines',
					'Consider delegation or deadline negotiation',
					'Focus on highest business impact first',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(conflictResolutionPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.taskAnalysis).toHaveLength(3);

			// Should prioritize by impact/urgency
			const urgentTasks = result.taskAnalysis.filter(t => t.priority === 'urgent');
			expect(urgentTasks.length).toBeGreaterThan(0);

			// Should include conflict resolution questions
			expect(result.questions).toHaveLength.greaterThan(0);
			expect(result.questions![0].question).toContain('multiple urgent');

			// Should suggest immediate calendar entries for urgent items
			expect(result.calendarSuggestions).toBeDefined();
			expect(result.calendarSuggestions!.length).toBeGreaterThan(0);
		});

		it('should handle contradictory user preferences in conversation', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Deep work session',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: [
					'I work best in the morning',
					'Actually I prefer afternoons for focused work',
					'Morning meetings are too distracting',
					'I said morning was good for me',
				], // Contradictory statements
				userPreferences: {
					preferredTimeSlots: ['morning', 'evening'], // Also contradictory
					focusBlockMinimum: 90,
					conversationStyle: 'detailed',
					prioritizationApproach: 'energy',
				},
				context: { currentDate: '2025-01-31' },
			};

			const clarificationPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Detected contradictory preferences in conversation. Seeking clarification on time preferences.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Deep work session',
						priority: 'medium',
						estimatedDuration: 120,
						complexity: 'moderate',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning', // Default to first mentioned
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: ['Time preference unclear'],
						},
					},
				],
				questions: [
					{
						question:
							'I noticed conflicting time preferences. When do you actually do your best focused work - morning or afternoon?',
						type: 'context',
						options: [
							'Morning (despite meetings)',
							'Afternoon (better focus)',
							'It varies by day',
							'Either works fine',
						],
						required: true,
					},
				],
				nextSteps: [
					'Resolve contradictory time preferences',
					'Clarify optimal focus time for deep work',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(clarificationPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions).toHaveLength.greaterThan(0);
			expect(result.questions![0].question).toContain('conflicting');
			expect(result.taskAnalysis[0].context.blockers).toContain('Time preference unclear');
		});

		it('should handle impossible task combinations due to time constraints', async () => {
			const impossibleTasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: '8-hour research project',
					notes: 'Comprehensive market analysis needed',
					status: 'needsAction',
					due: '2025-01-31',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'task-2',
					provider: 'google-tasks',
					title: '6-hour presentation prep',
					notes: 'Major client presentation',
					status: 'needsAction',
					due: '2025-01-31',
					position: '2',
					taskList: { id: '@default', title: 'My Tasks' },
				},
				{
					id: 'task-3',
					provider: 'google-tasks',
					title: 'Team meetings all day',
					notes: 'Back-to-back meetings scheduled',
					status: 'needsAction',
					due: '2025-01-31',
					position: '3',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks: impossibleTasks,
				conversationHistory: ['All of these are due today', 'I have no flexibility'],
				context: {
					currentDate: '2025-01-31',
					workingHours: { start: '09:00', end: '17:00' }, // Only 8 hours available
				},
			};

			const impossibilityPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Detected impossible time constraints: 14+ hours of work scheduled for 8-hour day.',
				taskAnalysis: [
					{
						taskId: 'task-2',
						title: '6-hour presentation prep',
						priority: 'urgent',
						estimatedDuration: 360,
						complexity: 'complex',
						suggestedSchedule: {
							preferredDate: '2025-01-31',
							preferredTimeSlot: 'morning',
							flexibility: 'fixed',
						},
						context: {
							filesToOpen: ['presentation-template.pptx'],
							relatedProjects: ['Client Relations'],
							blockers: [],
						},
					},
					{
						taskId: 'task-1',
						title: '8-hour research project',
						priority: 'high',
						estimatedDuration: 480,
						complexity: 'complex',
						suggestedSchedule: {
							preferredDate: '2025-02-01', // Moved to next day
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: ['research-template.docx'],
							relatedProjects: ['Market Analysis'],
							blockers: ['Time constraint - rescheduled'],
						},
					},
					{
						taskId: 'task-3',
						title: 'Team meetings all day',
						priority: 'medium',
						estimatedDuration: 240,
						complexity: 'simple',
						suggestedSchedule: {
							preferredDate: '2025-02-01', // Also moved
							preferredTimeSlot: 'afternoon',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: [],
							relatedProjects: ['Team Coordination'],
							blockers: ['Schedule conflict resolved by rescheduling'],
						},
					},
				],
				questions: [
					{
						question:
							'You have 14+ hours of work scheduled for today but only 8 hours available. Which is the absolute top priority?',
						type: 'priority',
						options: [
							'Client presentation (6h) - reschedule others',
							'Research project (8h) - cancel meetings',
							'Spread across multiple days',
							'Delegate some tasks',
						],
						required: true,
					},
				],
				nextSteps: [
					'Address potential issues: Impossible time constraints detected',
					'Consider task delegation or deadline renegotiation',
					'Prioritize by business impact and reschedule lower priority items',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(impossibilityPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions![0].question).toContain('14+ hours');
			expect(result.nextSteps).toContain(
				'Address potential issues: Impossible time constraints detected'
			);

			// Should reschedule some tasks
			const todayTasks = result.taskAnalysis.filter(
				t => t.suggestedSchedule.preferredDate === '2025-01-31'
			);
			const tomorrowTasks = result.taskAnalysis.filter(
				t => t.suggestedSchedule.preferredDate === '2025-02-01'
			);

			expect(tomorrowTasks.length).toBeGreaterThan(0); // Some tasks moved to tomorrow
		});
	});

	describe('API Failures and Error Handling', () => {
		it('should handle OpenAI API timeout gracefully', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Test task',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Help me plan this task'],
				context: { currentDate: '2025-01-31' },
			};

			// Simulate API timeout
			mockCreate.mockRejectedValue(new Error('Request timeout'));

			const result = await planner.conductTaskInterview(input);

			// Should return fallback plan
			expect(result).toMatchObject({
				planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				conversationSummary: expect.stringContaining('Fallback'),
				taskAnalysis: expect.arrayContaining([
					expect.objectContaining({
						taskId: 'task-1',
						title: 'Test task',
						priority: 'medium',
						estimatedDuration: 60,
						complexity: 'moderate',
					}),
				]),
				nextSteps: expect.arrayContaining([expect.stringContaining('LLM service was unavailable')]),
			});
		});

		it('should handle OpenAI API rate limiting with fallback model', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Test task for rate limiting',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Planning with rate limits'],
				context: { currentDate: '2025-01-31' },
			};

			const fallbackResponse: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary: 'Plan created using fallback model due to rate limiting.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Test task for rate limiting',
						priority: 'medium',
						estimatedDuration: 60,
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
				nextSteps: ['Fallback model used successfully'],
			};

			// First call fails with rate limit, second succeeds with fallback
			mockCreate.mockRejectedValueOnce(new Error('Rate limit exceeded')).mockResolvedValueOnce({
				choices: [{ message: { content: JSON.stringify(fallbackResponse) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.conversationSummary).toContain('fallback model');
			expect(mockCreate).toHaveBeenCalledTimes(2); // Primary + fallback
		});

		it('should handle both primary and fallback model failures', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Test task for complete failure',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Planning with complete API failure'],
				context: { currentDate: '2025-01-31' },
			};

			// Both primary and fallback models fail
			mockCreate
				.mockRejectedValueOnce(new Error('Primary model failed'))
				.mockRejectedValueOnce(new Error('Fallback model failed'));

			const result = await planner.conductTaskInterview(input);

			// Should return hardcoded fallback plan
			expect(result).toMatchObject({
				planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				conversationSummary: expect.stringContaining('Fallback'),
				taskAnalysis: expect.arrayContaining([
					expect.objectContaining({
						taskId: 'task-1',
						title: 'Test task for complete failure',
					}),
				]),
				questions: expect.arrayContaining([
					expect.objectContaining({
						question: expect.stringContaining('LLM service was unavailable'),
					}),
				]),
				nextSteps: expect.arrayContaining([expect.stringContaining('LLM service was unavailable')]),
			});
		});

		it('should handle malformed API responses gracefully', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Test malformed response',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Testing malformed response handling'],
				context: { currentDate: '2025-01-31' },
			};

			// Return malformed response
			mockCreate.mockResolvedValue({
				choices: [{ message: { content: 'This is not valid JSON { malformed' } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should return fallback plan due to JSON parse error
			expect(result.conversationSummary).toContain('Fallback');
			expect(result.taskAnalysis).toHaveLength(1);
			expect(result.taskAnalysis[0].taskId).toBe('task-1');
		});

		it('should handle null or undefined API responses', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Test null response',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['Testing null response handling'],
				context: { currentDate: '2025-01-31' },
			};

			// Return null response
			mockCreate.mockResolvedValue({
				choices: [{ message: { content: null } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should return fallback plan
			expect(result).toBeDefined();
			expect(result.conversationSummary).toContain('Fallback');
		});
	});

	describe('Large-Scale Edge Cases', () => {
		it('should handle excessive number of tasks (>10)', async () => {
			const manyTasks: Task[] = Array.from({ length: 15 }, (_, i) => ({
				id: `task-${i + 1}`,
				provider: 'google-tasks' as const,
				title: `Task number ${i + 1}`,
				notes: `Description for task ${i + 1}`,
				status: 'needsAction' as const,
				due: i < 5 ? '2025-01-31' : '2025-02-01', // First 5 due today
				position: String(i + 1),
				taskList: { id: '@default', title: 'My Tasks' },
			}));

			const input: TaskInterviewInput = {
				tasks: manyTasks,
				conversationHistory: ['I have way too many tasks to handle'],
				context: { currentDate: '2025-01-31' },
			};

			const overwhelmingTasksPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Large number of tasks detected (15). Focusing on highest priority items to avoid overwhelm.',
				taskAnalysis: manyTasks.slice(0, 5).map((task, i) => ({
					// Only analyze top 5
					taskId: task.id,
					title: task.title,
					priority: i < 2 ? 'urgent' : ('high' as const),
					estimatedDuration: 60,
					complexity: 'moderate' as const,
					suggestedSchedule: {
						preferredDate: task.due!,
						preferredTimeSlot: i < 2 ? 'morning' : ('afternoon' as const),
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
							'You have 15 tasks which may be overwhelming. Should we focus on just the most critical ones?',
						type: 'priority',
						options: [
							'Yes - only top 5 priorities',
							'No - I can handle all of them',
							"Focus on today's deadlines only",
							'Help me reduce the list',
						],
						required: true,
					},
				],
				nextSteps: [
					'Address potential issues: Too many tasks may overwhelm the interview process',
					'Focus on highest impact tasks first',
					'Consider task delegation or elimination',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(overwhelmingTasksPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.taskAnalysis.length).toBeLessThanOrEqual(5); // Should limit analysis
			expect(result.questions![0].question).toContain('15 tasks');
			expect(result.nextSteps).toContain(
				'Address potential issues: Too many tasks may overwhelm the interview process'
			);
		});

		it('should handle very long conversation history (>15 turns)', async () => {
			const tasks: Task[] = [
				{
					id: 'task-1',
					provider: 'google-tasks',
					title: 'Task with long conversation',
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const longHistory = Array.from(
				{ length: 20 },
				(_, i) => `Conversation turn ${i + 1} with various details about planning and priorities`
			);

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: longHistory,
				context: { currentDate: '2025-01-31' },
			};

			const longConversationPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Long conversation detected (20 turns). Summarizing key points and moving to completion.',
				taskAnalysis: [
					{
						taskId: 'task-1',
						title: 'Task with long conversation',
						priority: 'medium',
						estimatedDuration: 90,
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
				questions: [], // No more questions - ready to finalize
				calendarSuggestions: [
					{
						taskId: 'task-1',
						eventTitle: 'Task with long conversation',
						suggestedDate: '2025-02-01',
						suggestedTime: '09:00',
						duration: 90,
						description: 'Complete task discussed in detail',
					},
				],
				nextSteps: [
					'Address potential issues: Conversation becoming too long, user may lose engagement',
					'Interview complete - proceeding with final recommendations',
				],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(longConversationPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.nextSteps).toContain(
				'Address potential issues: Conversation becoming too long, user may lose engagement'
			);
			expect(result.calendarSuggestions).toBeDefined(); // Should provide final suggestions
		});

		it('should handle tasks with extremely long titles and descriptions', async () => {
			const longTitle =
				'This is an extremely long task title that goes on and on and includes way too much detail about what needs to be done, when it needs to be done, how it should be approached, and various other considerations that should probably be in the notes field instead of the title but here we are with a title that is way too long and might cause issues with processing';

			const longNotes = Array.from(
				{ length: 10 },
				() =>
					'This is a very detailed note section with extensive information about the task requirements, dependencies, background context, technical specifications, user requirements, business justification, and implementation details.'
			).join(' ');

			const tasks: Task[] = [
				{
					id: 'long-task',
					provider: 'google-tasks',
					title: longTitle,
					notes: longNotes,
					status: 'needsAction',
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			];

			const input: TaskInterviewInput = {
				tasks,
				conversationHistory: ['This task has way too much detail'],
				context: { currentDate: '2025-01-31' },
			};

			const longTaskPlan: TaskPlan = {
				planDate: '2025-01-31',
				conversationSummary:
					'Processing task with extensive details. Summarizing key points for clarity.',
				taskAnalysis: [
					{
						taskId: 'long-task',
						title: longTitle.substring(0, 100) + '...', // Truncated for readability
						priority: 'medium',
						estimatedDuration: 180, // Longer due to complexity
						complexity: 'complex',
						suggestedSchedule: {
							preferredDate: '2025-02-01',
							preferredTimeSlot: 'morning',
							flexibility: 'flexible',
						},
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: ['Task details are very extensive - may need clarification'],
						},
					},
				],
				questions: [
					{
						taskId: 'long-task',
						question:
							'This task has extensive details. What are the core 2-3 most important outcomes you need?',
						type: 'context',
						required: false,
					},
				],
				nextSteps: ['Simplify task scope based on core requirements'],
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(longTaskPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.taskAnalysis[0].complexity).toBe('complex');
			expect(result.questions![0].question).toContain('extensive details');
			expect(result.taskAnalysis[0].context.blockers).toContain('Task details are very extensive');
		});
	});
});
