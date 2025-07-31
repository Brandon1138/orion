/**
 * Debug test to understand why conductTaskInterview is not available
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerLLM } from './index.js';

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

describe('Debug Tests', () => {
	let planner: PlannerLLM;

	beforeEach(() => {
		vi.clearAllMocks();

		const config = {
			model: 'gpt-4o',
			temperature: 0.3,
		};
		planner = new PlannerLLM(config);
	});

	it('should have conductTaskInterview method', () => {
		console.log('Planner instance:', planner);
		console.log('Planner methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(planner)));
		console.log('Has conductTaskInterview?', typeof planner.conductTaskInterview);

		expect(planner).toBeDefined();
		expect(typeof planner.conductTaskInterview).toBe('function');
	});

	it('should be able to call conductTaskInterview', async () => {
		const input = {
			tasks: [
				{
					id: 'test',
					provider: 'google-tasks' as const,
					title: 'Test',
					status: 'needsAction' as const,
					position: '1',
					taskList: { id: '@default', title: 'My Tasks' },
				},
			],
		};

		mockCreate.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							planDate: '2025-01-31',
							conversationSummary: 'Test summary',
							taskAnalysis: [
								{
									taskId: 'test',
									title: 'Test',
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
							nextSteps: ['Continue'],
						}),
					},
				},
			],
		});

		const result = await planner.conductTaskInterview(input);
		expect(result).toBeDefined();
	});
});
