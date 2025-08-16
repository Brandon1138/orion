/**
 * Schema Validation Tests - Chunk 2.3
 * Testing TaskPlan v1 schema validation and ensuring all outputs are valid
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerLLM } from './index.js';
import type { TaskPlan, TaskInterviewInput, Task } from './types.js';

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

describe('TaskPlan Schema Validation Tests', () => {
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

	const createValidTask = (): Task => ({
		id: 'test-task-1',
		provider: 'google-tasks',
		title: 'Test Task',
		status: 'needsAction',
		position: '1',
		taskList: { id: '@default', title: 'My Tasks' },
	});

	const createValidTaskPlan = (): TaskPlan => ({
		planDate: '2025-01-31',
		conversationSummary: 'Valid task plan for testing schema validation.',
		taskAnalysis: [
			{
				taskId: 'test-task-1',
				title: 'Test Task',
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
		nextSteps: ['Continue with next phase'],
	});

	describe('Valid TaskPlan Schema', () => {
		it('should accept completely valid TaskPlan', async () => {
			const validPlan = createValidTaskPlan();
			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(validPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result).toEqual(validPlan);
			expect(result.planDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(result.conversationSummary).toHaveLength.greaterThan(10);
			expect(result.taskAnalysis).toHaveLength(1);
			expect(result.nextSteps).toHaveLength.greaterThan(0);
		});

		it('should accept TaskPlan with optional questions field', async () => {
			const planWithQuestions: TaskPlan = {
				...createValidTaskPlan(),
				questions: [
					{
						taskId: 'test-task-1',
						question: 'What priority should this task have?',
						type: 'priority',
						options: ['high', 'medium', 'low'],
						required: true,
					},
				],
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithQuestions) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.questions).toBeDefined();
			expect(result.questions).toHaveLength(1);
			expect(result.questions![0]).toMatchObject({
				taskId: 'test-task-1',
				question: expect.any(String),
				type: 'priority',
				required: true,
			});
		});

		it('should accept TaskPlan with optional calendarSuggestions field', async () => {
			const planWithCalendar: TaskPlan = {
				...createValidTaskPlan(),
				calendarSuggestions: [
					{
						taskId: 'test-task-1',
						eventTitle: 'Work on Test Task',
						suggestedDate: '2025-02-01',
						suggestedTime: '09:00',
						duration: 60,
						description: 'Focus session for test task completion',
					},
				],
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithCalendar) } }],
			});

			const result = await planner.conductTaskInterview(input);

			expect(result.calendarSuggestions).toBeDefined();
			expect(result.calendarSuggestions).toHaveLength(1);
			expect(result.calendarSuggestions![0]).toMatchObject({
				taskId: 'test-task-1',
				eventTitle: expect.any(String),
				suggestedDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				duration: expect.any(Number),
				description: expect.any(String),
			});
		});
	});

	describe('Invalid Schema Handling', () => {
		it('should handle missing required fields with fallback', async () => {
			const invalidPlan = {
				// Missing required fields: planDate, conversationSummary, taskAnalysis, nextSteps
				someField: 'invalid',
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(invalidPlan) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with all required fields
			expect(result).toMatchObject({
				planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				conversationSummary: expect.stringContaining('Fallback'),
				taskAnalysis: expect.arrayContaining([
					expect.objectContaining({
						taskId: 'test-task-1',
						title: 'Test Task',
						priority: 'medium',
						estimatedDuration: 60,
						complexity: 'moderate',
					}),
				]),
				nextSteps: expect.arrayContaining([expect.stringContaining('LLM service was unavailable')]),
			});
		});

		it('should handle invalid planDate format with fallback', async () => {
			const planWithInvalidDate = {
				...createValidTaskPlan(),
				planDate: 'invalid-date-format',
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithInvalidDate) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with valid date format
			expect(result.planDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(result.conversationSummary).toContain('Fallback');
		});

		it('should handle invalid priority enum with fallback', async () => {
			const planWithInvalidPriority = {
				...createValidTaskPlan(),
				taskAnalysis: [
					{
						taskId: 'test-task-1',
						title: 'Test Task',
						priority: 'invalid-priority', // Invalid enum value
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
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithInvalidPriority) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with valid priority
			expect(result.taskAnalysis[0].priority).toBeOneOf(['urgent', 'high', 'medium', 'low']);
		});

		it('should handle invalid estimatedDuration range with fallback', async () => {
			const planWithInvalidDuration = {
				...createValidTaskPlan(),
				taskAnalysis: [
					{
						taskId: 'test-task-1',
						title: 'Test Task',
						priority: 'medium',
						estimatedDuration: 1000, // Outside valid range (5-480)
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
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithInvalidDuration) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with valid duration
			expect(result.taskAnalysis[0].estimatedDuration).toBeGreaterThanOrEqual(5);
			expect(result.taskAnalysis[0].estimatedDuration).toBeLessThanOrEqual(480);
		});

		it('should handle missing taskAnalysis with fallback', async () => {
			const planWithoutTaskAnalysis = {
				planDate: '2025-01-31',
				conversationSummary: 'Valid summary',
				// Missing taskAnalysis array
				nextSteps: ['Continue planning'],
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithoutTaskAnalysis) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with taskAnalysis
			expect(result.taskAnalysis).toBeDefined();
			expect(result.taskAnalysis).toHaveLength(1);
			expect(result.taskAnalysis[0]).toMatchObject({
				taskId: 'test-task-1',
				title: 'Test Task',
				priority: 'medium',
				estimatedDuration: 60,
				complexity: 'moderate',
			});
		});

		it('should handle short conversationSummary with fallback', async () => {
			const planWithShortSummary = {
				...createValidTaskPlan(),
				conversationSummary: 'Short', // Less than 10 characters
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithShortSummary) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with proper summary length
			expect(result.conversationSummary.length).toBeGreaterThanOrEqual(10);
		});

		it('should handle empty nextSteps array with fallback', async () => {
			const planWithEmptyNextSteps = {
				...createValidTaskPlan(),
				nextSteps: [], // Empty array, violates minItems: 1
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithEmptyNextSteps) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan with nextSteps
			expect(result.nextSteps).toHaveLength.greaterThan(0);
		});
	});

	describe('JSON Parsing Errors', () => {
		it('should handle malformed JSON with fallback', async () => {
			const malformedJson = '{ "planDate": "2025-01-31", "invalid": json }';

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: malformedJson } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan due to JSON parse error
			expect(result).toMatchObject({
				planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				conversationSummary: expect.stringContaining('Fallback'),
				taskAnalysis: expect.any(Array),
				nextSteps: expect.arrayContaining([expect.stringContaining('LLM service was unavailable')]),
			});
		});

		it('should handle empty response with fallback', async () => {
			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: '' } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan due to empty response
			expect(result).toMatchObject({
				planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
				conversationSummary: expect.stringContaining('Fallback'),
				nextSteps: expect.arrayContaining([expect.stringContaining('LLM service was unavailable')]),
			});
		});

		it('should handle null response with fallback', async () => {
			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: null } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan due to null response
			expect(result.conversationSummary).toContain('Fallback');
		});
	});

	describe('Edge Cases in TaskAnalysis', () => {
		it('should handle multiple tasks with mixed validity in analysis', async () => {
			const tasks: Task[] = [
				createValidTask(),
				{
					...createValidTask(),
					id: 'test-task-2',
					title: 'Second Task',
				},
			];

			const planWithMixedAnalysis = {
				planDate: '2025-01-31',
				conversationSummary: 'Plan with mixed task analysis validity.',
				taskAnalysis: [
					{
						taskId: 'test-task-1',
						title: 'Test Task',
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
					{
						taskId: 'test-task-2',
						title: 'Second Task',
						priority: 'invalid-priority', // Invalid
						estimatedDuration: -10, // Invalid
						complexity: 'moderate',
						// Missing suggestedSchedule - invalid
						context: {
							filesToOpen: [],
							relatedProjects: [],
							blockers: [],
						},
					},
				],
				nextSteps: ['Continue with planning'],
			};

			const input: TaskInterviewInput = {
				tasks,
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithMixedAnalysis) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback plan due to invalid task analysis
			expect(result.taskAnalysis).toHaveLength(2);
			expect(result.taskAnalysis[1].priority).toBeOneOf(['urgent', 'high', 'medium', 'low']);
			expect(result.taskAnalysis[1].estimatedDuration).toBeGreaterThan(0);
			expect(result.taskAnalysis[1].suggestedSchedule).toBeDefined();
		});

		it('should validate question types in questions array', async () => {
			const planWithInvalidQuestions: TaskPlan = {
				...createValidTaskPlan(),
				questions: [
					{
						taskId: 'test-task-1',
						question: 'Valid question?',
						type: 'invalid-type' as any, // Invalid question type
						required: true,
					},
					{
						// Missing taskId is ok
						question: 'S', // Too short (< 10 chars)
						type: 'priority',
						required: false,
					},
				],
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithInvalidQuestions) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback due to invalid questions
			expect(result.conversationSummary).toContain('Fallback');
		});

		it('should validate calendar suggestions format', async () => {
			const planWithInvalidCalendar: TaskPlan = {
				...createValidTaskPlan(),
				calendarSuggestions: [
					{
						taskId: 'test-task-1',
						eventTitle: 'Valid Event',
						suggestedDate: 'invalid-date-format', // Invalid
						duration: 5, // Too short (minimum 15)
						description: 'Valid description',
					},
					{
						taskId: 'test-task-1',
						eventTitle: '', // Empty title
						suggestedDate: '2025-02-01',
						suggestedTime: '25:00', // Invalid time
						duration: 600, // Too long (maximum 480)
						description: 'Valid description',
					},
				],
			};

			const input: TaskInterviewInput = {
				tasks: [createValidTask()],
				context: { currentDate: '2025-01-31' },
			};

			mockCreate.mockResolvedValue({
				choices: [{ message: { content: JSON.stringify(planWithInvalidCalendar) } }],
			});

			const result = await planner.conductTaskInterview(input);

			// Should get fallback due to invalid calendar suggestions
			expect(result.conversationSummary).toContain('Fallback');
		});
	});

	describe('Schema Compliance Over Time', () => {
		it('should maintain schema compliance across multiple interview turns', async () => {
			const tasks = [createValidTask()];

			// Simulate multiple turns of the same interview
			const turns = [
				{ phase: 'INIT', historyLength: 0 },
				{ phase: 'PRIORITY', historyLength: 2 },
				{ phase: 'CONTEXT', historyLength: 4 },
				{ phase: 'READY', historyLength: 8 },
			];

			for (const turn of turns) {
				const input: TaskInterviewInput = {
					tasks,
					conversationHistory: Array(turn.historyLength).fill('conversation turn'),
					context: { currentDate: '2025-01-31' },
				};

				const validResponse = {
					...createValidTaskPlan(),
					conversationSummary: `Interview ${turn.phase} phase with ${turn.historyLength} conversation turns.`,
				};

				mockCreate.mockResolvedValue({
					choices: [{ message: { content: JSON.stringify(validResponse) } }],
				});

				const result = await planner.conductTaskInterview(input);

				// Each turn should produce valid schema
				expect(result).toMatchObject({
					planDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
					conversationSummary: expect.any(String),
					taskAnalysis: expect.arrayContaining([
						expect.objectContaining({
							taskId: expect.any(String),
							title: expect.any(String),
							priority: expect.any(String),
							estimatedDuration: expect.any(Number),
							complexity: expect.any(String),
							suggestedSchedule: expect.objectContaining({
								preferredDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
								flexibility: expect.any(String),
							}),
							context: expect.any(Object),
						}),
					]),
					nextSteps: expect.any(Array),
				});

				expect(result.conversationSummary.length).toBeGreaterThanOrEqual(10);
				expect(result.nextSteps.length).toBeGreaterThan(0);
			}
		});
	});
});
